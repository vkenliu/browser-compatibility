# 🔍 Browser Compare

A CLI tool to capture and compare screenshots of any webpage across multiple mobile browsers, devices, and in-app browser environments. Built with Playwright, which ships real Chromium, WebKit, and Firefox engines.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install browser engines (downloads ~400MB of browser binaries)
npx playwright install

# 3. Capture screenshots
node capture.mjs https://your-site.com

# 4. Open the report
open report/index.html
```

## Usage Examples

### Basic — all browsers, default devices
```bash
node capture.mjs https://example.com
```

### Compare specific browsers and devices
```bash
node capture.mjs https://example.com \
  --browsers chromium,webkit \
  --devices "iPhone 15 Pro,Pixel 7,iPad Pro 11"
```

### Test in-app browsers (Facebook, Instagram, TikTok, etc.)
```bash
node capture.mjs https://example.com \
  --ua-spoof facebook,instagram,tiktok,wechat,line,twitter,snapchat
```

### Full comparison — everything
```bash
node capture.mjs https://example.com \
  --browsers chromium,webkit,firefox \
  --ua-spoof facebook,instagram,tiktok,wechat,line,twitter,snapchat \
  --delay 3000 \
  --output ./full-report
```

### Custom viewport
```bash
node capture.mjs https://example.com --width 390 --height 844
```

## CLI Options

| Option | Default | Description |
|--------|---------|-------------|
| `--output, -o` | `./report` | Output directory for report and screenshots |
| `--browsers` | `chromium,webkit,firefox` | Comma-separated browser engines |
| `--devices` | See below | Comma-separated Playwright device names |
| `--ua-spoof` | none | In-app browser UA spoofing (see list below) |
| `--delay` | `2000` | Wait ms after page load before screenshot |
| `--full-page` | `true` | Capture full scrollable page |
| `--width, -w` | device default | Custom viewport width |
| `--height, -h` | device default | Custom viewport height |
| `--inject-eruda` | `false` | Inject Eruda debug console |

## Default Devices

- iPhone 15 Pro
- iPhone 13
- iPhone SE (3rd generation)
- Pixel 7
- Galaxy S9+
- iPad Pro 11

## In-App Browser UA Spoofing

| Key | Simulates |
|-----|-----------|
| `facebook` | Facebook iOS + Android in-app browser |
| `instagram` | Instagram iOS + Android in-app browser |
| `tiktok` | TikTok iOS + Android in-app browser |
| `wechat` | WeChat in-app browser |
| `line` | LINE in-app browser |
| `twitter` | Twitter/X iOS in-app browser |
| `snapchat` | Snapchat in-app browser |

Using `--ua-spoof facebook` will test both `facebook_ios` and `facebook_android` variants.

## Report Features

The generated HTML report (`report/index.html`) includes:

- **Grid View** — see all screenshots at once
- **Side-by-Side View** — horizontally scroll through comparisons
- **Compare Mode** — select 2 screenshots for direct comparison
- **Filter by Engine** — Chromium / WebKit / Firefox / In-App
- **Filter by Platform** — iOS / Android
- **Click to Zoom** — lightbox for full-size inspection
- **Stats Dashboard** — overview of test coverage

## How It Works

1. **Playwright** ships with real browser engines (Chromium, WebKit, Firefox) — not simulations
2. For each browser + device combo, it creates a context with the device's viewport, pixel ratio, and user agent
3. For in-app browsers, it uses the real engine that the in-app browser uses (WebKit for iOS, Chromium for Android) but spoofs the user agent string to trigger any UA-specific behavior
4. Screenshots are captured after page load + configurable delay
5. An HTML report is generated for visual comparison

## Using with Claude Code

This tool is designed to work great with Claude Code:

```bash
# Ask Claude Code to test your site
claude "Use browser-compare to test https://my-site.com across all major browsers and in-app browsers, then analyze the differences"

# Or for a specific issue
claude "I think my site's header looks broken on Safari. Use browser-compare to capture screenshots on WebKit vs Chromium for iPhone 15 Pro and show me the differences"
```

## Important Notes

- **WebKit ≈ Safari**: Playwright's WebKit engine closely mirrors Safari's rendering, making it the best option for Safari testing outside of a real Mac/iPhone.
- **In-app UA spoofing**: This spoofs the user agent string but uses the same underlying engine. Real in-app browsers may have additional restrictions (blocked APIs, injected scripts, etc.) that can't be fully simulated.
- **For complete in-app testing**: Use the report to catch rendering issues, but also test on real devices for API/feature restrictions.

## Limitations

| What it captures well | What it can't fully simulate |
|----------------------|----------------------------|
| CSS rendering differences across engines | In-app browser JavaScript restrictions |
| Viewport/safe area behavior | Injected tracking scripts (Meta Pixel, etc.) |
| Font rendering differences | Cookie isolation / OAuth flow issues |
| Layout and responsive behavior | File upload / download restrictions |
| UA-dependent CSS/JS behavior | Navigation/back button behavior |

## License

MIT
