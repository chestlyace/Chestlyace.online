"use client";

import { useLayoutEffect } from "react";
import { applyTheme, readThemePreference } from "@/lib/theme";

// Keeps the visitor's theme when the language changes. Each language has its own `<html>`
// (the `[lang]` layout is the root layout), so switching EN | FR in the app swaps the
// document element's props and React drops what THEME_INIT_SCRIPT set (the `dark` class
// and `color-scheme`); the script itself only runs on a full page load. This puts them
// back from the cookie before the browser paints, so there is no flash of the other theme.
export function ThemeSync() {
  useLayoutEffect(() => {
    applyTheme(readThemePreference());
  }, []);
  return null;
}
