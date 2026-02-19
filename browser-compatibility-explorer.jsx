import { useState, useCallback } from "react";

const BROWSER_PROFILES = {
  safari_ios: {
    name: "Safari (iOS)",
    engine: "WebKit",
    color: "#5c8aff",
    icon: "🧭",
    platform: "iOS",
    quirks: [
      { id: "vh", label: "100vh includes URL bar", severity: "high", css: { height: "100vh" }, note: "Content hidden behind URL bar. Fix: use 100dvh" },
      { id: "safe-area", label: "Safe area insets (notch)", severity: "high", css: { paddingTop: "47px", paddingBottom: "34px" }, note: "Requires viewport-fit=cover + env(safe-area-inset-*)" },
      { id: "input-zoom", label: "Auto-zoom on input focus", severity: "medium", css: {}, note: "Zooms in if font-size < 16px. Fix: min 16px on inputs" },
      { id: "sticky", label: "position:sticky in overflow", severity: "medium", css: {}, note: "Breaks inside overflow:hidden/auto containers" },
      { id: "backdrop", label: "-webkit-backdrop-filter", severity: "low", css: {}, note: "Requires -webkit- prefix for backdrop-filter" },
      { id: "date-parse", label: "Strict Date() parsing", severity: "medium", css: {}, note: 'new Date("2024-01-15 10:00") fails — needs T separator' },
      { id: "font-render", label: "Core Text font rendering", severity: "low", css: {}, note: "Slightly different text metrics, line-height, kerning" },
      { id: "rubber-band", label: "Rubber-band overscroll", severity: "low", css: {}, note: "Native elastic scrolling, can't be fully disabled" },
    ],
  },
  chrome_android: {
    name: "Chrome (Android)",
    engine: "Chromium/Blink",
    color: "#4caf50",
    icon: "🌐",
    platform: "Android",
    quirks: [
      { id: "vh", label: "100vh = visible area", severity: "info", css: {}, note: "More predictable than Safari — URL bar collapses" },
      { id: "font-render", label: "HarfBuzz/Skia text rendering", severity: "low", css: {}, note: "Different font metrics vs Safari. Text may wrap differently" },
      { id: "overscroll", label: "Overscroll glow effect", severity: "low", css: {}, note: "Blue glow at scroll boundaries instead of rubber-band" },
      { id: "select", label: "Native <select> styling", severity: "medium", css: {}, note: "Different dropdown appearance vs iOS. Hard to customize." },
      { id: "scrollbar", label: "Visible thin scrollbar", severity: "low", css: {}, note: "Shows thin scrollbar by default; iOS hides it" },
    ],
  },
  firefox_android: {
    name: "Firefox (Android)",
    engine: "Gecko",
    color: "#ff9800",
    icon: "🦊",
    platform: "Android",
    quirks: [
      { id: "subgrid", label: "subgrid support", severity: "low", css: {}, note: "Firefox had subgrid before Chrome/Safari" },
      { id: "backdrop", label: "backdrop-filter", severity: "medium", css: {}, note: "Had late support for backdrop-filter (post v103)" },
      { id: "scroll-snap", label: "Scroll snap differences", severity: "medium", css: {}, note: "Slightly different snap point settling behavior" },
      { id: "font-render", label: "Font rendering", severity: "low", css: {}, note: "Uses its own text shaping — visible differences in CJK text" },
    ],
  },
  facebook_inapp: {
    name: "Facebook In-App",
    engine: "WebKit (iOS) / Chromium (Android)",
    color: "#e91e63",
    icon: "📲",
    platform: "Both",
    quirks: [
      { id: "js-inject", label: "Meta Pixel JS injection", severity: "high", css: {}, note: "Facebook injects tracking JS that can conflict with your code" },
      { id: "viewport", label: "Header eats viewport height", severity: "high", css: { paddingTop: "56px" }, note: "In-app chrome bar reduces usable viewport unpredictably" },
      { id: "cookies", label: "Isolated cookie jar", severity: "high", css: {}, note: "Cookies not shared with Safari/Chrome — OAuth flows break" },
      { id: "localStorage", label: "localStorage may be cleared", severity: "high", css: {}, note: "Storage is sandboxed and can be wiped between sessions" },
      { id: "window-open", label: "window.open() blocked", severity: "medium", css: {}, note: "Popups and new windows are blocked" },
      { id: "download", label: "File downloads fail", severity: "medium", css: {}, note: "PDF/file downloads often fail silently" },
      { id: "deep-link", label: "Deep links unreliable", severity: "medium", css: {}, note: "Universal links / app links may not trigger" },
    ],
  },
  instagram_inapp: {
    name: "Instagram In-App",
    engine: "WebKit (iOS) / Chromium (Android)",
    color: "#c2185b",
    icon: "📷",
    platform: "Both",
    quirks: [
      { id: "js-inject", label: "Meta tracking injection", severity: "high", css: {}, note: "Same Meta Pixel injection as Facebook" },
      { id: "viewport", label: "Swipe-to-close interferes", severity: "high", css: {}, note: "Swipe gestures can conflict with scroll/swipe UI" },
      { id: "cookies", label: "Isolated storage", severity: "high", css: {}, note: "Same cookie isolation as Facebook in-app" },
      { id: "navigation", label: "No URL bar / back button", severity: "medium", css: {}, note: "Users can't see URL, navigate, or refresh" },
      { id: "file-input", label: "<input type=file> limited", severity: "medium", css: {}, note: "File upload may not work or shows limited options" },
    ],
  },
  tiktok_inapp: {
    name: "TikTok In-App",
    engine: "WebKit (iOS) / Chromium (Android)",
    color: "#9c27b0",
    icon: "🎵",
    platform: "Both",
    quirks: [
      { id: "viewport", label: "Viewport height reduced", severity: "high", css: { paddingTop: "48px" }, note: "TikTok header bar is always present" },
      { id: "js-inject", label: "ByteDance JS injection", severity: "high", css: {}, note: "Injects BytedanceWebview bridge scripts" },
      { id: "cookies", label: "Isolated cookie jar", severity: "high", css: {}, note: "Cookies not shared with system browser" },
      { id: "webrtc", label: "WebRTC blocked", severity: "medium", css: {}, note: "Camera/mic access typically blocked" },
      { id: "gesture", label: "Swipe conflict", severity: "medium", css: {}, note: "Vertical swipes conflict with TikTok's swipe-to-close" },
    ],
  },
  wechat_inapp: {
    name: "WeChat In-App",
    engine: "X5/WebKit",
    color: "#00c853",
    icon: "💬",
    platform: "Both",
    quirks: [
      { id: "engine", label: "X5 engine (not standard WebKit)", severity: "high", css: {}, note: "Android uses Tencent X5 engine — different rendering than Chrome" },
      { id: "jssdk", label: "WeChat JS-SDK required", severity: "high", css: {}, note: "Many features (share, pay, scan) need WeChat JS-SDK integration" },
      { id: "cookies", label: "Isolated storage", severity: "high", css: {}, note: "Completely sandboxed from system browser" },
      { id: "ssl", label: "Strict SSL requirements", severity: "medium", css: {}, note: "Non-HTTPS content may be blocked entirely" },
      { id: "cache", label: "Aggressive caching", severity: "medium", css: {}, note: "Very aggressive page caching — hard to bust" },
    ],
  },
  line_inapp: {
    name: "LINE In-App",
    engine: "WebKit (iOS) / Chromium (Android)",
    color: "#00b900",
    icon: "💚",
    platform: "Both",
    quirks: [
      { id: "liff", label: "LIFF framework integration", severity: "medium", css: {}, note: "LINE's LIFF SDK provides native-like features" },
      { id: "cookies", label: "Isolated cookies", severity: "high", css: {}, note: "Storage not shared with system browser" },
      { id: "back-button", label: "Back button behavior", severity: "medium", css: {}, note: "Back button behavior is unpredictable" },
    ],
  },
};

const SEVERITY_CONFIG = {
  high: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", text: "#ef4444", label: "HIGH" },
  medium: { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)", text: "#fbbf24", label: "MED" },
  low: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", text: "#22c55e", label: "LOW" },
  info: { bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)", text: "#60a5fa", label: "INFO" },
};

const CSS_TEST_CASES = [
  {
    id: "viewport-height",
    name: "100vh vs 100dvh",
    description: "Safari's 100vh includes the URL bar area, causing content overflow",
    code: `.full-height {\n  height: 100vh;  /* Broken on Safari */\n  height: 100dvh; /* Fix: dynamic viewport */\n}`,
    browsers: {
      safari_ios: { status: "broken", note: "100vh includes URL bar — use 100dvh" },
      chrome_android: { status: "works", note: "100vh = visible viewport" },
      facebook_inapp: { status: "broken", note: "Same as Safari + header bar compounds the issue" },
    },
  },
  {
    id: "safe-area",
    name: "Safe Area Insets",
    description: "Handling notch/Dynamic Island on modern iPhones",
    code: `<meta name="viewport"\n  content="..., viewport-fit=cover">\n\n.container {\n  padding-top: env(safe-area-inset-top);\n  padding-bottom: env(safe-area-inset-bottom);\n}`,
    browsers: {
      safari_ios: { status: "required", note: "Must handle for notch devices" },
      chrome_android: { status: "n/a", note: "No notch-style cutouts on most Android" },
      facebook_inapp: { status: "partial", note: "May not respect viewport-fit=cover" },
    },
  },
  {
    id: "backdrop-filter",
    name: "backdrop-filter",
    description: "Glass-morphism / blur effects behind elements",
    code: `.glass {\n  backdrop-filter: blur(10px);\n  -webkit-backdrop-filter: blur(10px);\n}`,
    browsers: {
      safari_ios: { status: "prefix", note: "Needs -webkit- prefix" },
      chrome_android: { status: "works", note: "Works without prefix" },
      firefox_android: { status: "works", note: "Supported since v103" },
    },
  },
  {
    id: "flexbox-gap",
    name: "Flexbox gap",
    description: "gap property in flex containers",
    code: `.flex-container {\n  display: flex;\n  gap: 1rem;\n}`,
    browsers: {
      safari_ios: { status: "caution", note: "Broken on Safari < 14.1 (iOS 14.5)" },
      chrome_android: { status: "works", note: "Supported since Chrome 84" },
      firefox_android: { status: "works", note: "Supported since Firefox 63" },
    },
  },
  {
    id: "date-parsing",
    name: "Date() Constructor",
    description: "JavaScript Date string parsing differences",
    code: `// ❌ Fails on Safari:\nnew Date("2024-01-15 10:00:00")\n\n// ✅ Works everywhere:\nnew Date("2024-01-15T10:00:00")\nnew Date(2024, 0, 15, 10, 0, 0)`,
    browsers: {
      safari_ios: { status: "broken", note: 'Strict parsing — space separator fails' },
      chrome_android: { status: "works", note: "Lenient parsing accepts spaces" },
      firefox_android: { status: "works", note: "Also lenient" },
    },
  },
  {
    id: "input-zoom",
    name: "Input Auto-Zoom",
    description: "Safari zooms the page when focusing inputs with small font sizes",
    code: `/* Fix: ensure inputs are ≥ 16px */\ninput, select, textarea {\n  font-size: 16px;\n}\n\n/* Or disable zoom (not recommended) */\n<meta name="viewport"\n  content="..., maximum-scale=1">`,
    browsers: {
      safari_ios: { status: "broken", note: "Zooms in if font-size < 16px" },
      chrome_android: { status: "works", note: "No auto-zoom behavior" },
      facebook_inapp: { status: "broken", note: "Same zoom behavior as Safari on iOS" },
    },
  },
];

const STATUS_ICONS = {
  works: "✅",
  broken: "❌",
  prefix: "⚠️",
  partial: "🟡",
  required: "🔵",
  caution: "⚠️",
  "n/a": "➖",
};

export default function BrowserCompare() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBrowsers, setSelectedBrowsers] = useState(["safari_ios", "chrome_android", "facebook_inapp"]);
  const [expandedQuirk, setExpandedQuirk] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleBrowser = useCallback((key) => {
    setSelectedBrowsers((prev) =>
      prev.includes(key) ? prev.filter((b) => b !== key) : [...prev, key]
    );
  }, []);

  const filteredTestCases = CSS_TEST_CASES.filter(
    (tc) =>
      !searchTerm ||
      tc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#06080c",
      color: "#e6edf3",
      fontFamily: "'DM Sans', -apple-system, system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "24px 28px 20px",
        borderBottom: "1px solid #21262d",
        background: "linear-gradient(180deg, #0d1117 0%, #06080c 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div style={{
            width: 38, height: 38,
            background: "linear-gradient(135deg, #5c8aff, #4caf50)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem",
          }}>🔍</div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Mobile Browser Compatibility Explorer
          </h1>
        </div>
        <p style={{ fontSize: "0.82rem", color: "#8b949e", maxWidth: 600 }}>
          Compare rendering quirks, CSS differences, and API gaps across Safari, Chrome, Firefox, and in-app browsers
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, padding: "12px 28px",
        borderBottom: "1px solid #21262d", background: "#0d1117",
      }}>
        {[
          { id: "overview", label: "Browser Quirks" },
          { id: "css-tests", label: "CSS/JS Compatibility" },
          { id: "detection", label: "Detection Code" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: activeTab === tab.id ? "1px solid #388bfd" : "1px solid transparent",
              background: activeTab === tab.id ? "rgba(56,139,253,0.12)" : "transparent",
              color: activeTab === tab.id ? "#58a6ff" : "#8b949e",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Browser Selector */}
      <div style={{
        padding: "16px 28px",
        borderBottom: "1px solid #21262d",
        display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
      }}>
        <span style={{ fontSize: "0.75rem", color: "#484f58", marginRight: 4, fontWeight: 600 }}>COMPARE:</span>
        {Object.entries(BROWSER_PROFILES).map(([key, b]) => (
          <button
            key={key}
            onClick={() => toggleBrowser(key)}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: `1px solid ${selectedBrowsers.includes(key) ? b.color : "#21262d"}`,
              background: selectedBrowsers.includes(key) ? `${b.color}18` : "transparent",
              color: selectedBrowsers.includes(key) ? b.color : "#8b949e",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {b.icon} {b.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 28px" }}>
        {/* ====== Overview Tab ====== */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {selectedBrowsers.map((bKey) => {
              const browser = BROWSER_PROFILES[bKey];
              if (!browser) return null;
              return (
                <div key={bKey} style={{
                  background: "#0d1117",
                  border: "1px solid #21262d",
                  borderRadius: 10,
                  overflow: "hidden",
                }}>
                  <div style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid #21262d",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{browser.icon}</span>
                        <span>{browser.name}</span>
                        <span style={{
                          fontSize: "0.65rem", padding: "2px 8px", borderRadius: 4,
                          background: `${browser.color}18`, color: browser.color,
                          border: `1px solid ${browser.color}33`, fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          {browser.engine}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.73rem", color: "#484f58", marginTop: 2 }}>
                        Platform: {browser.platform}
                      </div>
                    </div>
                    <div style={{
                      display: "flex", gap: 6,
                    }}>
                      {["high", "medium", "low"].map((sev) => {
                        const count = browser.quirks.filter((q) => q.severity === sev).length;
                        if (count === 0) return null;
                        const cfg = SEVERITY_CONFIG[sev];
                        return (
                          <span key={sev} style={{
                            fontSize: "0.68rem", padding: "2px 7px", borderRadius: 4,
                            background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
                            fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {count} {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ padding: "4px 0" }}>
                    {browser.quirks.map((quirk) => {
                      const sev = SEVERITY_CONFIG[quirk.severity];
                      const isExpanded = expandedQuirk === `${bKey}-${quirk.id}`;
                      return (
                        <div
                          key={quirk.id}
                          onClick={() => setExpandedQuirk(isExpanded ? null : `${bKey}-${quirk.id}`)}
                          style={{
                            padding: "10px 18px",
                            borderBottom: "1px solid #161b2288",
                            cursor: "pointer",
                            transition: "background 0.1s",
                            background: isExpanded ? "#161b22" : "transparent",
                          }}
                          onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "#0d111799"; }}
                          onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{
                              fontSize: "0.6rem", padding: "1px 6px", borderRadius: 3,
                              background: sev.bg, color: sev.text, border: `1px solid ${sev.border}`,
                              fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                              minWidth: 36, textAlign: "center",
                            }}>
                              {sev.label}
                            </span>
                            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{quirk.label}</span>
                            <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#484f58" }}>
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>
                          {isExpanded && (
                            <div style={{
                              marginTop: 10, padding: "10px 14px",
                              background: "#06080c", borderRadius: 6, border: "1px solid #21262d",
                              fontSize: "0.78rem", color: "#8b949e", lineHeight: 1.6,
                            }}>
                              {quirk.note}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ====== CSS Tests Tab ====== */}
        {activeTab === "css-tests" && (
          <div>
            <input
              type="text"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%", maxWidth: 400, padding: "9px 14px",
                background: "#0d1117", border: "1px solid #21262d", borderRadius: 8,
                color: "#e6edf3", fontSize: "0.82rem", marginBottom: 20,
                fontFamily: "inherit", outline: "none",
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filteredTestCases.map((tc) => (
                <div key={tc.id} style={{
                  background: "#0d1117", border: "1px solid #21262d",
                  borderRadius: 10, overflow: "hidden",
                }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #21262d" }}>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, marginBottom: 4 }}>{tc.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "#8b949e" }}>{tc.description}</div>
                  </div>

                  {/* Code block */}
                  <div style={{
                    padding: "14px 18px",
                    background: "#06080c",
                    borderBottom: "1px solid #21262d",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.72rem",
                    lineHeight: 1.7,
                    color: "#79c0ff",
                    whiteSpace: "pre-wrap",
                    overflowX: "auto",
                  }}>
                    {tc.code}
                  </div>

                  {/* Browser results */}
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {Object.entries(tc.browsers).map(([bKey, result]) => {
                      const browser = BROWSER_PROFILES[bKey];
                      if (!browser) return null;
                      return (
                        <div key={bKey} style={{
                          flex: "1 1 200px", padding: "12px 18px",
                          borderRight: "1px solid #21262d11",
                          borderBottom: "1px solid #21262d44",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <span>{browser.icon}</span>
                            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: browser.color }}>
                              {browser.name}
                            </span>
                            <span style={{ fontSize: "0.9rem" }}>{STATUS_ICONS[result.status]}</span>
                          </div>
                          <div style={{
                            fontSize: "0.72rem", color: "#8b949e", lineHeight: 1.5,
                          }}>
                            {result.note}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====== Detection Code Tab ====== */}
        {activeTab === "detection" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              {
                title: "🔍 Detect In-App Browsers",
                code: `const ua = navigator.userAgent || '';

const browser = {
  // In-app browsers
  isFacebook:  /FBAN|FBAV/.test(ua),
  isInstagram: /Instagram/.test(ua),
  isTikTok:    /BytedanceWebview|TikTok/.test(ua),
  isLINE:      /Line\\//.test(ua),
  isWeChat:    /MicroMessenger/.test(ua),
  isTwitter:   /Twitter/.test(ua),
  isSnapchat:  /Snapchat/.test(ua),
  
  // Standard browsers
  isSafari:       /^((?!chrome|android).)*safari/i.test(ua),
  isIOSChrome:    /CriOS/.test(ua),
  isAndroidChrome:/Chrome\\/[\\d.]+ Mobile/.test(ua) 
                   && /Android/.test(ua),
  isFirefox:      /Firefox/.test(ua),
  
  // Platform
  isIOS:     /iPhone|iPad|iPod/.test(ua),
  isAndroid: /Android/.test(ua),
  
  // Any in-app browser
  get isInApp() {
    return this.isFacebook || this.isInstagram 
      || this.isTikTok || this.isLINE 
      || this.isWeChat || this.isTwitter 
      || this.isSnapchat;
  }
};

// Usage: Show "Open in Browser" button
if (browser.isInApp) {
  showOpenInBrowserPrompt();
}`,
              },
              {
                title: "🧪 CSS Feature Detection",
                code: `// Dynamic viewport units
const hasDvh = CSS.supports('height', '100dvh');

// Backdrop filter  
const hasBackdrop = CSS.supports('backdrop-filter', 'blur(10px)')
  || CSS.supports('-webkit-backdrop-filter', 'blur(10px)');

// Safe area support
const hasSafeArea = CSS.supports(
  'padding-top', 'env(safe-area-inset-top)'
);

// Container queries
const hasContainer = CSS.supports('container-type', 'inline-size');

// Apply fixes conditionally
document.documentElement.classList.toggle('no-dvh', !hasDvh);
document.documentElement.classList.toggle('no-safe-area', !hasSafeArea);`,
              },
              {
                title: "📐 Viewport Height Fix",
                code: `/* CSS: Robust full-height with fallbacks */
.full-height {
  height: 100vh;                          /* Fallback */
  height: -webkit-fill-available;         /* Safari fallback */
  height: 100dvh;                         /* Modern fix */
}

/* JS: Calculate real viewport height */
function setRealVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style
    .setProperty('--vh', \`\${vh}px\`);
}
window.addEventListener('resize', setRealVh);
setRealVh();

/* Usage: */
.full-height-js {
  height: calc(var(--vh, 1vh) * 100);
}`,
              },
              {
                title: "🛡️ Safe Area Handling",
                code: `<!-- Step 1: Enable in viewport meta -->
<meta name="viewport" 
  content="width=device-width, initial-scale=1, 
           viewport-fit=cover">

<!-- Step 2: CSS -->
<style>
  :root {
    --sat: env(safe-area-inset-top, 0px);
    --sar: env(safe-area-inset-right, 0px);
    --sab: env(safe-area-inset-bottom, 0px);
    --sal: env(safe-area-inset-left, 0px);
  }
  
  .header {
    padding-top: calc(16px + var(--sat));
  }
  
  .bottom-nav {
    padding-bottom: calc(12px + var(--sab));
  }
  
  .content {
    padding-left: calc(16px + var(--sal));
    padding-right: calc(16px + var(--sar));
  }
</style>`,
              },
            ].map((block) => (
              <div key={block.title} style={{
                background: "#0d1117", border: "1px solid #21262d",
                borderRadius: 10, overflow: "hidden",
              }}>
                <div style={{
                  padding: "12px 18px", borderBottom: "1px solid #21262d",
                  fontSize: "0.88rem", fontWeight: 700,
                }}>
                  {block.title}
                </div>
                <pre style={{
                  padding: "16px 18px", margin: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.7rem", lineHeight: 1.7,
                  color: "#79c0ff", overflowX: "auto",
                  background: "#06080c",
                }}>
                  {block.code}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
