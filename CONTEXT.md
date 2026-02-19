# Mobile Browser Compatibility Testing Tool — Project Context

## Project Goal

Build a developer tool that captures and compares how a target webpage renders across different mobile browser environments — including Safari, Chrome, Firefox, and in-app browsers (Facebook, Instagram, TikTok, WeChat, LINE, etc.) — then presents the results in a visual comparison report to identify display differences.

## Why This Matters

Web pages render differently across mobile browsers due to engine differences, platform restrictions, and in-app browser limitations. Developers currently have no easy way to see all these differences at a glance. This tool solves that.

---

## Core Architecture

### Tech Stack
- **Playwright** — ships real Chromium, WebKit (≈Safari), and Firefox engines. This is the foundation.
- **Node.js** (ESM) — CLI tool
- **HTML/CSS/JS** — comparison report viewer (self-contained, no build step)

### How It Works
1. User provides a target URL and configuration options
2. Tool launches each browser engine via Playwright
3. For each browser + device combo, it creates a context with correct viewport, pixel ratio, and user agent
4. For in-app browsers, it uses the matching engine (WebKit for iOS, Chromium for Android) with spoofed user agent strings
5. Screenshots are captured after page load + configurable delay
6. An HTML report is generated for side-by-side visual comparison

### Key Files (starter code already exists)
- `capture.mjs` — main CLI entry point, handles screenshot capture across all browser/device/UA combos
- `report-template.html` — the HTML comparison report with grid/side-by-side/diff views, filtering, lightbox
- `package.json` — project config
- `README.md` — usage documentation

---

## Critical Domain Knowledge

### Rendering Engine Landscape

| Browser | iOS Engine | Android Engine |
|---------|-----------|----------------|
| Safari | WebKit | N/A |
| Chrome | WebKit (forced by Apple) | Chromium/Blink |
| Firefox | WebKit (forced by Apple) | Gecko |
| Facebook In-App | WKWebView (WebKit) | Android WebView (Chromium) |
| Instagram In-App | WKWebView (WebKit) | Android WebView (Chromium) |
| TikTok In-App | WKWebView (WebKit) | Android WebView (Chromium) |
| WeChat In-App | WKWebView (WebKit) | Tencent X5 Engine |
| LINE In-App | WKWebView (WebKit) | Android WebView (Chromium) |

**Key insight**: On iOS, ALL browsers use WebKit. So the real engine-level rendering differences are WebKit vs Blink vs Gecko. In-app browser issues are more about restricted APIs, injected scripts, viewport behavior, and cookie isolation than rendering engine differences.

### Major CSS/JS Compatibility Issues to Test For

1. **`100vh` bug** — Safari's 100vh includes the URL bar, causing content to overflow. Fix: `100dvh`.
2. **Safe area insets** — iPhone notch/Dynamic Island requires `viewport-fit=cover` + `env(safe-area-inset-*)`.
3. **Input auto-zoom** — Safari zooms page when focusing inputs with `font-size < 16px`.
4. **`-webkit-backdrop-filter`** — Safari needs the `-webkit-` prefix.
5. **Flexbox `gap`** — Broken on Safari < 14.1.
6. **Date parsing** — `new Date("2024-01-15 10:00:00")` fails on Safari (needs `T` separator).
7. **`position: sticky`** — Breaks inside overflow containers on Safari.
8. **Font rendering** — Safari uses Core Text, Chrome uses HarfBuzz/Skia — causes different text metrics and line wrapping.

### In-App Browser Specific Problems

| Issue | Affected Browsers | Impact |
|-------|------------------|--------|
| JS injection (tracking scripts) | Facebook, Instagram, TikTok | Can conflict with page JS |
| Cookie/storage isolation | All in-app browsers | OAuth/auth flows break |
| `localStorage` cleared between sessions | Facebook, Instagram | State persistence fails |
| `window.open()` blocked | All in-app browsers | Popups don't work |
| File download fails silently | Most in-app browsers | PDF/file downloads broken |
| Reduced viewport height (header bar) | All in-app browsers | Layout overflow |
| Deep links unreliable | Facebook, Instagram | App links may not trigger |
| Camera/mic (WebRTC) blocked | TikTok, some others | Media features unavailable |
| Swipe gestures conflict | Instagram, TikTok | Scroll/swipe UI breaks |

### In-App Browser User Agent Strings

These are the real UA strings used to detect each in-app browser:

- **Facebook**: Contains `FBAN` or `FBAV`
- **Instagram**: Contains `Instagram`
- **TikTok**: Contains `BytedanceWebview` or `TikTok`
- **WeChat**: Contains `MicroMessenger`
- **LINE**: Contains `Line/`
- **Twitter/X**: Contains `Twitter`
- **Snapchat**: Contains `Snapchat`

---

## Report UI Features (already implemented in starter)

- **Grid View** — all screenshots in a responsive grid
- **Side-by-Side View** — horizontal scroll for direct comparison
- **Compare Mode** — select exactly 2 for diff
- **Filter by Engine** — Chromium / WebKit / Firefox / In-App
- **Filter by Platform** — iOS / Android
- **Click-to-Zoom Lightbox** — full-size inspection
- **Stats Dashboard** — test coverage overview

---

## What's Already Built vs What Needs Work

### ✅ Already built (starter code)
- Core capture logic in `capture.mjs` (CLI args, Playwright launch, screenshot loop, in-app UA spoofing)
- HTML report template with all view modes and filtering
- 10 in-app browser UA profiles
- 6 default device profiles
- Report generation with metadata JSON

### 🔧 Needs improvement / extension
- **Error handling** — more robust error handling, retries for flaky page loads
- **Parallel capture** — currently sequential; could parallelize across browsers
- **CSS diff highlighting** — pixel-diff two screenshots and highlight differences (e.g., using `pixelmatch` or `sharp`)
- **Automated compatibility tests** — inject JS test snippets to check feature support per browser and include results in report
- **Config file support** — allow a `.browsercompare.json` config file instead of CLI args only
- **Watch mode** — re-capture on file change for development workflows
- **CI integration** — output machine-readable results (JSON) for CI pipelines, fail on visual regression thresholds
- **Interactive test page** — a built-in HTML page with known problematic patterns (100vh, sticky, backdrop-filter, date parsing, etc.) that can be used as a reference test target
- **Open in browser button detection** — detect in-app browser and suggest opening in system browser

---

## Device Profiles Available in Playwright

The starter uses these defaults, but Playwright has many more:
- iPhone 15 Pro, iPhone 13, iPhone SE (3rd generation)
- Pixel 7, Galaxy S9+
- iPad Pro 11

Full list: `npx playwright devices` or see Playwright docs.

---

## File Structure Target

```
browser-compare/
├── capture.mjs              # Main CLI tool
├── report-template.html     # HTML report template
├── package.json
├── README.md
├── .browsercompare.json     # Optional config file (TODO)
├── lib/
│   ├── browsers.mjs         # Browser/device/UA profile definitions
│   ├── capture-engine.mjs   # Core capture logic
│   ├── diff.mjs             # Pixel diff engine (TODO)
│   ├── report-generator.mjs # Report HTML generation
│   └── feature-tests.mjs    # Injected JS feature detection tests (TODO)
├── test-pages/
│   └── compatibility.html   # Built-in test page with known issues (TODO)
└── report/                  # Generated output (gitignored)
    ├── index.html
    ├── metadata.json
    └── screenshots/
```
