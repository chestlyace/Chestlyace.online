// The ripple on project images (design.md §14.5). One WebGL canvas is shared by
// every card: it is created on the first hover (so nothing runs until a visitor
// hovers), moved into the hovered card's image, and draws that image as a plane
// whose pixels are pushed outward by ripples that start at the pointer and fade
// over about 600ms. While no ripple is alive the canvas is hidden and the page's
// normal <img> shows; 5 seconds after the last hover everything is torn down.
// If the image can't be read as a texture (no CORS), nothing happens.

import type { Mesh, Program, Renderer, Texture } from "ogl";

const MAX_RIPPLES = 6;
const LIFETIME_S = 0.7;
const MIN_SPACING_PX = 28;
const MIN_INTERVAL_MS = 70;
const TEAR_DOWN_AFTER_MS = 5000;

const VERTEX = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D uImage;
  uniform vec2 uCover;       // object-fit: cover, as a UV scale
  uniform float uAspect;     // width / height of the card's image box
  uniform vec4 uRipples[${MAX_RIPPLES}]; // x, y (uv, y up), age (s), strength
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 push = vec2(0.0);
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = uRipples[i];
      if (r.w > 0.0) {
        vec2 d = uv - r.xy;
        d.x *= uAspect;
        float dist = length(d);
        float front = r.z * 0.55;
        float ring = exp(-pow((dist - front) / 0.1, 2.0));
        float fade = exp(-r.z * 3.2) * r.w;
        push += normalize(d + 0.0001) * sin((dist - front) * 46.0) * ring * fade * 0.014;
      }
    }
    vec2 st = (uv + push - 0.5) * uCover + 0.5;
    gl_FragColor = texture2D(uImage, st);
  }
`;

type Ripple = { x: number; y: number; start: number };

type Shared = {
  renderer: Renderer;
  program: Program;
  mesh: Mesh;
  canvas: HTMLCanvasElement;
  textures: Map<string, { texture: Texture; aspect: number } | null>;
  ripples: Ripple[];
  host: HTMLElement | null;
  hostAspect: number;
  frame: number;
  lastSpawn: { x: number; y: number; time: number };
  tearDown: number | undefined;
  ogl: typeof import("ogl");
};

let shared: Shared | null = null;
let starting: Promise<Shared | null> | null = null;

async function create(): Promise<Shared | null> {
  const ogl = await import("ogl");
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className =
    "pointer-events-none absolute inset-0 size-full opacity-0 transition-opacity duration-300";
  let renderer: Renderer;
  try {
    renderer = new ogl.Renderer({
      canvas,
      // Transparent images (a cut-out portrait, a PNG with an empty edge) must
      // stay transparent: the card's own background shows through them.
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
    });
  } catch {
    return null; // no WebGL: the page's <img> stays
  }
  const gl = renderer.gl;
  const uniforms = {
    uImage: { value: null as Texture | null },
    uCover: { value: [1, 1] },
    uAspect: { value: 1 },
    uRipples: { value: new Float32Array(MAX_RIPPLES * 4) },
  };
  const program = new ogl.Program(gl, {
    vertex: VERTEX,
    fragment: FRAGMENT,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new ogl.Mesh(gl, {
    geometry: new ogl.Triangle(gl),
    program,
  });
  return {
    renderer,
    program,
    mesh,
    canvas,
    textures: new Map(),
    ripples: [],
    host: null,
    hostAspect: 1,
    frame: 0,
    lastSpawn: { x: -1e4, y: -1e4, time: 0 },
    tearDown: undefined,
    ogl,
  };
}

function loadTexture(state: Shared, src: string) {
  const cached = state.textures.get(src);
  if (cached !== undefined) return Promise.resolve(cached);
  return new Promise<{ texture: Texture; aspect: number } | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const texture = new state.ogl.Texture(state.renderer.gl, {
          image,
          generateMipmaps: false,
          minFilter: state.renderer.gl.LINEAR,
        });
        const entry = {
          texture,
          aspect: image.naturalWidth / image.naturalHeight,
        };
        state.textures.set(src, entry);
        resolve(entry);
      } catch {
        state.textures.set(src, null);
        resolve(null);
      }
    };
    image.onerror = () => {
      state.textures.set(src, null); // cross-origin without CORS: no ripple
      resolve(null);
    };
    image.src = src;
  });
}

function dispose() {
  const state = shared;
  if (!state) return;
  cancelAnimationFrame(state.frame);
  if (state.host) delete state.host.dataset.rippling;
  state.renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
  state.canvas.remove();
  shared = null;
}

function draw(now: number) {
  const state = shared;
  if (!state || !state.host) return;
  state.frame = 0;

  state.ripples = state.ripples.filter(
    (ripple) => (now - ripple.start) / 1000 < LIFETIME_S,
  );
  const data = state.program.uniforms.uRipples.value as Float32Array;
  data.fill(0);
  state.ripples.forEach((ripple, i) => {
    data[i * 4] = ripple.x;
    data[i * 4 + 1] = ripple.y;
    data[i * 4 + 2] = (now - ripple.start) / 1000;
    data[i * 4 + 3] = 1;
  });
  state.renderer.render({ scene: state.mesh });
  // While the canvas draws, the page's own <img> is hidden (`data-rippling`), so
  // a transparent image doesn't show a second, unmoved copy through it.
  state.host.dataset.rippling = "";
  state.canvas.style.opacity = "1";

  if (state.ripples.length > 0) {
    state.frame = requestAnimationFrame(draw);
  } else {
    delete state.host.dataset.rippling; // back to the page's own <img>
    state.canvas.style.opacity = "0";
  }
}

// Called when the pointer enters a card's image box. `host` is the element the
// canvas fills (it has the same box as the <img>); `src` is the image's address.
export async function rippleEnter(host: HTMLElement, src: string) {
  starting ??= create();
  const state = await starting;
  if (!state) return;
  if (!shared) shared = state;
  window.clearTimeout(state.tearDown);

  const loaded = await loadTexture(state, src);
  if (!loaded || shared !== state) return;

  if (state.canvas.parentElement !== host) {
    host.appendChild(state.canvas);
    state.canvas.style.opacity = "0";
  }
  state.host = host;
  const { width, height } = host.getBoundingClientRect();
  if (width === 0 || height === 0) return;
  state.hostAspect = width / height;
  state.renderer.setSize(width, height);
  state.program.uniforms.uImage.value = loaded.texture;
  state.program.uniforms.uAspect.value = state.hostAspect;
  // object-fit: cover: the image fills the box and the longer side is cropped.
  state.program.uniforms.uCover.value =
    state.hostAspect > loaded.aspect
      ? [1, loaded.aspect / state.hostAspect]
      : [state.hostAspect / loaded.aspect, 1];
}

// Called as the pointer moves over the image box; starts a ripple when it has
// moved far enough since the last one.
export function rippleMove(
  host: HTMLElement,
  clientX: number,
  clientY: number,
) {
  const state = shared;
  if (!state || state.host !== host) return;
  const rect = host.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const now = performance.now();
  const moved = Math.hypot(x - state.lastSpawn.x, y - state.lastSpawn.y);
  if (moved < MIN_SPACING_PX || now - state.lastSpawn.time < MIN_INTERVAL_MS)
    return;

  state.lastSpawn = { x, y, time: now };
  state.ripples.push({ x: x / rect.width, y: 1 - y / rect.height, start: now });
  if (state.ripples.length > MAX_RIPPLES) state.ripples.shift();
  if (!state.frame) state.frame = requestAnimationFrame(draw);
}

// Called when the pointer leaves. Live ripples finish; the shared canvas is torn
// down 5 seconds after the last hover.
export function rippleLeave() {
  const state = shared;
  if (!state) return;
  window.clearTimeout(state.tearDown);
  state.tearDown = window.setTimeout(() => {
    dispose();
    starting = null;
  }, TEAR_DOWN_AFTER_MS);
}
