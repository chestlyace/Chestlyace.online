"use client";

import dynamic from "next/dynamic";

// The particle stage is its own chunk, loaded when the footer is near the screen:
// nothing waits on it (design.md §13.61).
export const ParticleStageLazy = dynamic(() => import("./ParticleStage"), {
  ssr: false,
});
