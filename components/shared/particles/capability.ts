// Whether the footer can draw its particle wordmark (design.md §13.61): motion is
// allowed, the connection is not in Save-Data mode and WebGL exists. Otherwise the
// footer keeps the solid wordmark of §13.8.
let webgl: boolean | undefined;

function hasWebGL(): boolean {
  if (webgl !== undefined) return webgl;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    webgl = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl = false;
  }
  return webgl;
}

export function saveData(): boolean {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean };
    }
  ).connection;
  return Boolean(connection?.saveData);
}

const REDUCED = "(prefers-reduced-motion: reduce)";

export function particlesCapable(): boolean {
  if (window.matchMedia(REDUCED).matches || saveData()) return false;
  return hasWebGL();
}

export function subscribeMotion(onChange: () => void): () => void {
  const media = window.matchMedia(REDUCED);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
