export type ThemeKey =
  | "default"
  | "light"
  | "catppuccin"
  | "dracula"
  | "amber"
  | "lavender"
  | "system"
  | "custom"

const THEMES: ThemeKey[] = [
  "default",
  "light",
  "catppuccin",
  "dracula",
  "amber",
  "lavender",
  "system",
  "custom",
]

export const THEME_KEYS = THEMES

export function applyTheme(key: ThemeKey): void {
  const theme = THEMES.includes(key) ? key : "default"
  document.documentElement.className = `dark theme-${theme}`
  try {
    localStorage.setItem("soraku:theme", `theme-${theme}`)
  } catch {
    /* ignore quota/private mode */
  }
}

export function getSavedTheme(): ThemeKey {
  try {
    const raw = localStorage.getItem("soraku:theme") || localStorage.getItem("soraku:settings")
    if (!raw) return "default"
    if (raw.startsWith("theme-")) {
      const key = raw.slice("theme-".length) as ThemeKey
      return THEMES.includes(key) ? key : "default"
    }
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.theme === "string" && parsed.theme.startsWith("theme-")) {
        const key = parsed.theme.slice("theme-".length) as ThemeKey
        return THEMES.includes(key) ? key : "default"
      }
    } catch {
      /* fallthrough */
    }
    return "default"
  } catch {
    return "default"
  }
}