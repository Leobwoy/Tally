/**
 * themes.js
 * Defines all color themes for Tally.
 * Each theme maps to a set of CSS custom properties that are injected
 * onto :root at runtime by the ThemeProvider in App.jsx.
 */

/** @typedef {{ name, emoji, primary, accent, soft, bg, card, border, text, sub, nav }} Theme */

/** All available themes keyed by ID */
export const THEMES = {
  sunrise: {
    name:    "Sunrise",
    emoji:   "🌅",
    primary: "#E8845A",
    accent:  "#C85A2A",
    soft:    "#F5C4A1",
    bg:      "#FFF8F3",
    card:    "#FFF0E6",
    border:  "#F0D5C0",
    text:    "#3D1F0A",
    sub:     "#9A6A4A",
    nav:     "#FFF0E6",
  },
  calmsky: {
    name:    "Calm Sky",
    emoji:   "🌤️",
    primary: "#4A90C4",
    accent:  "#2A6094",
    soft:    "#B8D4EE",
    bg:      "#F3F8FF",
    card:    "#E6F0FA",
    border:  "#C8DCEF",
    text:    "#0A1F3D",
    sub:     "#3A6A9A",
    nav:     "#E6F0FA",
  },
  forest: {
    name:    "Forest",
    emoji:   "🌿",
    primary: "#4A8C5A",
    accent:  "#2A5C3A",
    soft:    "#B8D4BE",
    bg:      "#F3FAF5",
    card:    "#E6F5EA",
    border:  "#C0DCCA",
    text:    "#0A2010",
    sub:     "#3A6A4A",
    nav:     "#E6F5EA",
  },
  lavender: {
    name:    "Lavender",
    emoji:   "💜",
    primary: "#7A5AC4",
    accent:  "#4A2A94",
    soft:    "#D4C4EE",
    bg:      "#F8F3FF",
    card:    "#F0E6FA",
    border:  "#DACAEF",
    text:    "#1F0A3D",
    sub:     "#5A3A8A",
    nav:     "#F0E6FA",
  },
};

/** Dark mode overlay — replaces bg/card/border/text/sub/nav when dark mode is on */
export const DARK_TOKENS = {
  bg:     "#0F172A",
  card:   "#1E293B",
  border: "#334155",
  text:   "#F1F5F9",
  sub:    "#94A3B8",
  nav:    "#1E293B",
};

/**
 * Injects theme CSS variables onto :root.
 * Called whenever the user changes theme or toggles dark mode.
 *
 * @param {keyof typeof THEMES} themeId
 * @param {boolean} dark
 */
export function applyTheme(themeId, dark) {
  const theme = THEMES[themeId] ?? THEMES.sunrise;
  const root  = document.documentElement;

  // Always apply the theme's primary/accent/soft — these never change in dark mode
  root.style.setProperty("--color-primary", theme.primary);
  root.style.setProperty("--color-accent",  theme.accent);
  root.style.setProperty("--color-soft",    theme.soft);

  // Apply bg/card/border/text/sub/nav from dark overlay or theme
  const tokens = dark
    ? { ...theme, ...DARK_TOKENS }
    : theme;

  root.style.setProperty("--color-bg",      tokens.bg);
  root.style.setProperty("--color-card",    tokens.card);
  root.style.setProperty("--color-border",  tokens.border);
  root.style.setProperty("--color-text",    tokens.text);
  root.style.setProperty("--color-subtext", tokens.sub);
  root.style.setProperty("--color-nav",     tokens.nav);

  // Update the browser theme-color meta tag to match
  const meta = document.getElementById("theme-color-meta");
  if (meta) meta.setAttribute("content", dark ? DARK_TOKENS.bg : theme.primary);
}
