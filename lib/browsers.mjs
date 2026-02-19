/**
 * Browser/device/UA profile definitions
 */

import { chromium, webkit, firefox, devices } from 'playwright';

// ============================================================
// In-App Browser User Agent Strings
// ============================================================
export const IN_APP_UA_STRINGS = {
  facebook_ios: {
    name: 'Facebook In-App (iOS)',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E219 [FBAN/FBIOS;FBAV/454.0.0.43.109;FBBV/568067598;FBDV/iPhone16,2;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBRV/569644498]',
    engine: 'webkit',
    device: 'iPhone 15 Pro',
  },
  facebook_android: {
    name: 'Facebook In-App (Android)',
    ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UQ1A.240205.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/121.0.6167.178 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/454.0.0.43.109;]',
    engine: 'chromium',
    device: 'Pixel 7',
  },
  instagram_ios: {
    name: 'Instagram In-App (iOS)',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E219 Instagram 321.0.2.22.102 (iPhone16,2; iOS 17_4; en_US; en; scale=3.00; 1290x2796; 569644498)',
    engine: 'webkit',
    device: 'iPhone 15 Pro',
  },
  instagram_android: {
    name: 'Instagram In-App (Android)',
    ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.178 Mobile Safari/537.36 Instagram 321.0.2.22.102 Android',
    engine: 'chromium',
    device: 'Pixel 7',
  },
  tiktok_ios: {
    name: 'TikTok In-App (iOS)',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E219 BytedanceWebview/d8a21c6 TikTok/33.7.4 ByteLocale/en',
    engine: 'webkit',
    device: 'iPhone 15 Pro',
  },
  tiktok_android: {
    name: 'TikTok In-App (Android)',
    ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.178 Mobile Safari/537.36 BytedanceWebview TikTok/33.7.4',
    engine: 'chromium',
    device: 'Pixel 7',
  },
  wechat: {
    name: 'WeChat In-App',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E219 MicroMessenger/8.0.47(0x18002f2f) NetType/4G Language/en',
    engine: 'webkit',
    device: 'iPhone 15 Pro',
  },
  line: {
    name: 'LINE In-App',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E219 Safari Line/14.3.1',
    engine: 'webkit',
    device: 'iPhone 15 Pro',
  },
  twitter_ios: {
    name: 'Twitter/X In-App (iOS)',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E219 Twitter for iPhone/10.24',
    engine: 'webkit',
    device: 'iPhone 15 Pro',
  },
  snapchat: {
    name: 'Snapchat In-App',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E219 Snapchat/12.76.0.33',
    engine: 'webkit',
    device: 'iPhone 15 Pro',
  },
};

// ============================================================
// Default Device Presets
// ============================================================
export const DEFAULT_DEVICES = [
  'iPhone 15 Pro',
  'iPhone 13',
  'iPhone SE (3rd generation)',
  'Pixel 7',
  'Galaxy S9+',
  'iPad Pro 11',
  'Desktop Chrome',
  'Desktop Safari',
  'Desktop Firefox',
];

/**
 * Determine the platform for a Playwright device descriptor.
 * @param {object} device - Playwright device descriptor (from `devices[name]`)
 * @returns {'ios' | 'android' | 'desktop'}
 */
export function getPlatform(device) {
  if (!device.isMobile) return 'desktop';
  return device.defaultBrowserType === 'webkit' ? 'ios' : 'android';
}

// ============================================================
// Browser Launchers
// ============================================================
export const BROWSER_LAUNCHERS = {
  chromium: { launcher: chromium, label: 'Chromium (Chrome)' },
  webkit: { launcher: webkit, label: 'WebKit (Safari)' },
  firefox: { launcher: firefox, label: 'Firefox' },
};
