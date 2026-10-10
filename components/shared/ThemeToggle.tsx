"use client";

import { Monitor, Moon, Sun, SunMoon } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  applyTheme,
  nextThemePreference,
  readThemePreference,
  writeThemePreference,
  type ThemePreference,
} from "@/lib/theme";
import { format } from "@/lib/i18n/format";
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

export type ThemeLabels = {
  label: string;
  states: Record<ThemePreference, string>;
  /** "Theme: {current}. Switch to {next}." */
  switch: string;
};

// The admin is English only (docs/i18n.md §1), so it uses these.
const ENGLISH: ThemeLabels = {
  label: "Theme",
  states: { system: "System", light: "Light", dark: "Dark" },
  switch: "Theme: {current}. Switch to {next}.",
};

export function ThemeToggle({
  labels = ENGLISH,
  className,
}: {
  labels?: ThemeLabels;
  className?: string;
}) {
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
        label={labels.label}
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
  const label = format(labels.switch, {
    current: labels.states[preference],
    next: labels.states[next],
  });

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
