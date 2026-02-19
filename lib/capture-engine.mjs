/**
 * Core capture logic with retry support
 */

import { devices } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import { IN_APP_UA_STRINGS, BROWSER_LAUNCHERS, getPlatform } from './browsers.mjs';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Retry a screenshot capture with exponential backoff.
 * Returns { success, ...result } or { success, error }.
 */
async function captureWithRetry(fn, label) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn();
      return { success: true, ...result };
    } catch (err) {
      const isLastAttempt = attempt === MAX_RETRIES;
      if (isLastAttempt) {
        console.error(`  \u274C ${label} — failed after ${MAX_RETRIES} attempts: ${err.message}`);
        return { success: false, error: err.message };
      }
      const backoff = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(`  \u26A0\uFE0F  ${label} — attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}. Retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}

/**
 * Capture screenshots across browser engines and device emulations.
 */
export async function captureScreenshots(config) {
  const { url, output, fullPage, delay, browsers: browserNames, devices: deviceNames, uaSpoof, injectEruda } = config;

  if (!url) {
    console.error('\u274C Please provide a URL as the first argument');
    console.error('Usage: node capture.mjs <url> [options]');
    process.exit(1);
  }

  const outputDir = path.resolve(output);
  const screenshotsDir = path.join(outputDir, 'screenshots');
  await fs.mkdir(screenshotsDir, { recursive: true });

  const results = [];

  // 1. Standard browser + device combos
  for (const browserName of browserNames) {
    const browserConfig = BROWSER_LAUNCHERS[browserName];
    if (!browserConfig) {
      console.warn(`\u26A0\uFE0F  Unknown browser: ${browserName}, skipping`);
      continue;
    }

    console.log(`\n\uD83D\uDE80 Launching ${browserConfig.label}...`);
    const browser = await browserConfig.launcher.launch({ headless: true });

    for (const deviceName of deviceNames) {
      const device = devices[deviceName];
      if (!device) {
        console.warn(`\u26A0\uFE0F  Unknown device: ${deviceName}, skipping`);
        continue;
      }

      const platform = getPlatform(device);

      // Skip incompatible combos (desktop devices work with all engines)
      if (platform !== 'desktop') {
        if (browserName === 'webkit' && platform === 'android') continue;
        if (browserName === 'firefox' && device.isMobile) continue;
      }

      const label = `${browserConfig.label} \u2014 ${deviceName}`;
      console.log(`  \uD83D\uDCF1 ${label}`);

      const result = await captureWithRetry(async () => {
        const context = await browser.newContext({
          ...device,
          ...(config.customWidth && { viewport: { width: config.customWidth, height: config.customHeight || device.viewport.height } }),
        });
        const page = await context.newPage();

        if (injectEruda) {
          await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/eruda' });
          await page.evaluate(() => eruda.init());
        }

        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(delay);

        const filename = `${browserName}_${deviceName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        const filepath = path.join(screenshotsDir, filename);
        await page.screenshot({ path: filepath, fullPage });

        await context.close();

        return {
          browser: browserConfig.label,
          browserEngine: browserName,
          device: deviceName,
          viewport: device.viewport,
          userAgent: device.userAgent,
          filename,
          filepath,
          type: 'standard',
          platform,
        };
      }, label);

      if (result.success) {
        const { success, ...data } = result;
        results.push(data);
      }
    }

    await browser.close();
  }

  // 2. In-app browser UA spoofing
  for (const spoofKey of uaSpoof) {
    const matchingKeys = Object.keys(IN_APP_UA_STRINGS).filter(k => k.startsWith(spoofKey) || k.includes(spoofKey));
    const keysToUse = matchingKeys.length > 0 ? matchingKeys : [spoofKey];

    for (const key of keysToUse) {
      const inApp = IN_APP_UA_STRINGS[key];
      if (!inApp) {
        console.warn(`\u26A0\uFE0F  Unknown in-app browser: ${key}, skipping`);
        continue;
      }

      const browserConfig = BROWSER_LAUNCHERS[inApp.engine];
      const device = devices[inApp.device];

      console.log(`\n\uD83D\uDCF2 ${inApp.name} (${browserConfig.label} engine)`);

      const browser = await browserConfig.launcher.launch({ headless: true });

      const label = inApp.name;
      const result = await captureWithRetry(async () => {
        const context = await browser.newContext({
          ...device,
          userAgent: inApp.ua,
        });
        const page = await context.newPage();

        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(delay);

        const filename = `inapp_${key}.png`;
        const filepath = path.join(screenshotsDir, filename);
        await page.screenshot({ path: filepath, fullPage });

        await context.close();

        return {
          browser: inApp.name,
          browserEngine: inApp.engine,
          device: inApp.device,
          viewport: device.viewport,
          userAgent: inApp.ua,
          filename,
          filepath,
          type: 'in-app',
          platform: inApp.engine === 'webkit' ? 'ios' : 'android',
        };
      }, label);

      if (result.success) {
        const { success, ...data } = result;
        results.push(data);
      }

      await browser.close();
    }
  }

  return results;
}
