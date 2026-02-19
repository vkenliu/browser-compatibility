#!/usr/bin/env node

/**
 * Browser Compatibility Screenshot Comparison Tool
 *
 * Captures screenshots of a target URL across multiple browser engines
 * and device emulations using Playwright, then generates an HTML comparison report.
 *
 * Usage:
 *   node capture.mjs <url> [options]
 *
 * Options:
 *   --output, -o    Output directory (default: ./report)
 *   --width, -w     Custom viewport width
 *   --height, -h    Custom viewport height
 *   --full-page     Capture full page screenshots (default: true)
 *   --delay         Wait ms after page load before capture (default: 2000)
 *   --devices       Comma-separated device list (default: all presets)
 *   --browsers      Comma-separated browser list: chromium,webkit,firefox (default: all)
 *   --inject-eruda  Inject Eruda console for debugging
 *   --ua-spoof      Spoof in-app browser user agents (facebook, instagram, tiktok, etc.)
 *
 * Examples:
 *   node capture.mjs https://example.com
 *   node capture.mjs https://example.com --browsers chromium,webkit --devices "iPhone 15,Pixel 7"
 *   node capture.mjs https://example.com --ua-spoof facebook,instagram,wechat
 */

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { DEFAULT_DEVICES } from './lib/browsers.mjs';
import { captureScreenshots } from './lib/capture-engine.mjs';
import { generateReport } from './lib/report-generator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// Defaults
// ============================================================
const DEFAULTS = {
  url: null,
  output: './report',
  fullPage: true,
  delay: 2000,
  devices: DEFAULT_DEVICES,
  browsers: ['chromium', 'webkit', 'firefox'],
  uaSpoof: [],
  injectEruda: false,
  customWidth: null,
  customHeight: null,
};

// ============================================================
// Parse CLI Arguments
// ============================================================
function parseArgs(args) {
  const parsed = {};

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--output' || arg === '-o') {
      parsed.output = args[++i];
    } else if (arg === '--width' || arg === '-w') {
      parsed.customWidth = parseInt(args[++i]);
    } else if (arg === '--height' || arg === '-h') {
      parsed.customHeight = parseInt(args[++i]);
    } else if (arg === '--full-page') {
      parsed.fullPage = args[++i] !== 'false';
    } else if (arg === '--delay') {
      parsed.delay = parseInt(args[++i]);
    } else if (arg === '--devices') {
      parsed.devices = args[++i].split(',').map(d => d.trim());
    } else if (arg === '--browsers') {
      parsed.browsers = args[++i].split(',').map(b => b.trim().toLowerCase());
    } else if (arg === '--ua-spoof') {
      parsed.uaSpoof = args[++i].split(',').map(u => u.trim().toLowerCase());
    } else if (arg === '--inject-eruda') {
      parsed.injectEruda = true;
    } else if (!arg.startsWith('-')) {
      parsed.url = arg;
    }
    i++;
  }

  return parsed;
}

// ============================================================
// Load .browsercompare.json config
// ============================================================
async function loadConfigFile() {
  const configPath = path.resolve(process.cwd(), '.browsercompare.json');
  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(raw);
    console.log(`\uD83D\uDCC4 Loaded config from ${configPath}`);
    return config;
  } catch {
    return {};
  }
}

// ============================================================
// Main
// ============================================================
const fileConfig = await loadConfigFile();
const cliArgs = parseArgs(process.argv.slice(2));

// Merge order: defaults < config file < CLI args
const config = { ...DEFAULTS, ...fileConfig, ...cliArgs };

const results = await captureScreenshots(config);
await generateReport(results, config, __dirname);
