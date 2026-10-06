"use client";

import { Monitor, Moon, Sun, SunMoon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import {
  THEME_LABELS,
  applyTheme,
  nextThemePreference,
  readThemePreference,
  writeThemePreference,
  type ThemePreference,
} from "@/lib/theme";

const THEME_EVENT = "themechange";

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    applyTheme(readThemePreference());
    onChange();
  };
  media.addEventListener("change", onSystemChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onSystemChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

const ICONS: Record<ThemePreference, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const buttonClasses =
  "inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-raised";

export function ThemeToggle({ className }: { className?: string }) {
  const preference = useSyncExternalStore(
    subscribe,
    readThemePreference,
    () => null,
  );

  if (preference === null) {
    return (
      <button
        type="button"
        disabled
        aria-label="Theme"
        className={cn(buttonClasses, className)}
      >
        <SunMoon className="size-5" aria-hidden="true" />
      </button>
    );
  }

  const next = nextThemePreference(preference);
  const Icon = ICONS[preference];
  const label = `Theme: ${THEME_LABELS[preference]}. Switch to ${THEME_LABELS[next]}.`;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        writeThemePreference(next);
        applyTheme(next);
        window.dispatchEvent(new Event(THEME_EVENT));
      }}
      className={cn(buttonClasses, className)}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}
