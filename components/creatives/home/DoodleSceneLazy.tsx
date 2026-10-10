"use client";

import dynamic from "next/dynamic";

// The scene is its own chunk, loaded after the page is interactive: the hero's text
// and buttons are in the HTML from the first paint and never wait on it.
export const DoodleSceneLazy = dynamic(() => import("./DoodleScene"), {
  ssr: false,
});
