"use client";

import { Monitor, Moon, Sun, SunMoon } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  THEME_LABELS,
  applyTheme,
  nextThemePreference,
  readThemePreference,
  writeThemePreference,
  type ThemePreference,
} from "@/lib/theme";
import { IconButton } from "./IconButton";

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

export function ThemeToggle({ className }: { className?: string }) {
  const preference = useSyncExternalStore(
    subscribe,
    readThemePreference,
    () => null,
  );

  // Until the cookie is readable on the client, render an inert placeholder
  // so server and client markup match.
  if (preference === null) {
    return (
      <IconButton
        label="Theme"
        iconKey="pending"
        disabled
        className={className}
      >
        <SunMoon className="size-5" />
      </IconButton>
    );
  }

  const next = nextThemePreference(preference);
  const Icon = ICONS[preference];
  const label = `Theme: ${THEME_LABELS[preference]}. Switch to ${THEME_LABELS[next]}.`;

  return (
    <IconButton
      label={label}
      title={label}
      iconKey={preference}
      onClick={() => {
        writeThemePreference(next);
        applyTheme(next);
        window.dispatchEvent(new Event(THEME_EVENT));
      }}
      className={className}
    >
      <Icon className="size-5" />
    </IconButton>
  );
}
