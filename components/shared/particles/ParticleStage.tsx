"use client";

import { Geometry, Mesh, Program, Renderer } from "ogl";
import { useEffect, useRef, type RefObject } from "react";
import {
  apertureForm,
  bezierForm,
  bracesForm,
  cameraForm,
  cloudForm,
  latticeForm,
  mulberry32,
  sampleMask,
  wheelForm,
  wordBox,
} from "@/lib/particles/shapes";
import {
  CLOUD,
  LOOP,
  SPIN_RADIANS_PER_SECOND,
  Timeline,
  type Form,
} from "@/lib/particles/timeline";

const VERTEX = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec4 aSeed; // delay, size (css px), phase a, phase b
  uniform float uMix;
  uniform float uTime;
  uniform float uAspect;
  uniform float uAngleFrom;
  uniform float uAngleTo;
  uniform float uDistort;  // the noise at mid-morph, in stage units
  uniform float uPush;
  uniform float uRadius;
  uniform float uInfluence;
  uniform vec2 uPointer;
  uniform float uPress;
  uniform vec2 uBlob;
  uniform float uBlobRadius;
  uniform float uDpr;
  uniform vec3 uColor;
  uniform vec3 uBlobColor;
  varying vec3 vColor;

  vec3 rotY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  void main() {
    // Each dot leaves a little after the one before it and arrives a little later.
    float t = clamp((uMix - aSeed.x * 0.35) / 0.65, 0.0, 1.0);
    float e = t * t * (3.0 - 2.0 * t);
    vec3 a = rotY(aFrom, uAngleFrom);
    vec3 b = rotY(aTo, uAngleTo);
    vec3 p = mix(a, b, e);

    // The distortion: a smooth push along a noise field, nothing at either end.
    float k = sin(3.14159265 * e);
    vec3 noise = vec3(
      sin(p.y * 6.0 + uTime * 1.3 + aSeed.z * 6.2832),
      sin(p.x * 5.0 + p.z * 4.0 - uTime * 1.1 + aSeed.w * 6.2832),
      cos(p.x * 4.0 - p.y * 3.0 + uTime * 0.9)
    );
    p += noise * k * uDistort;

    // A barely visible drift, so a held form is alive.
    p.xy += 0.0035 * vec2(
      sin(uTime * 0.8 + aSeed.z * 6.2832),
      cos(uTime * 0.7 + aSeed.w * 6.2832)
    );

    // The pointer pushes the dots away, strongest at the pointer.
    vec2 away = p.xy - uPointer;
    float dist = length(away);
    float f = clamp(1.0 - dist / uRadius, 0.0, 1.0);
    p.xy += (away / max(dist, 0.0001)) * f * f * uPush * uInfluence;

    // Press and hold: every dot gathers into one blob at the pointer.
    float pr = clamp(uPress * 1.5 - aSeed.x * 0.5, 0.0, 1.0);
    pr = pr * pr * (3.0 - 2.0 * pr);
    float angle = aSeed.z * 6.2832;
    float radius = sqrt(fract(aSeed.w * 7.13 + aSeed.x * 3.7));
    vec2 spread = vec2(cos(angle), sin(angle)) * radius;
    vec2 wobble = vec2(
      sin(uTime * 3.0 + aSeed.w * 31.0),
      cos(uTime * 2.6 + aSeed.z * 29.0)
    ) * 0.12;
    vec3 blob = vec3(uBlob + (spread + wobble) * uBlobRadius, 0.0);
    p = mix(p, blob, pr);
    vColor = mix(uColor, uBlobColor, pr);

    float w = 1.0 - p.z * 0.45;
    gl_Position = vec4(p.x / (uAspect * 0.5), p.y / 0.5, 0.0, max(w, 0.3));
    gl_PointSize = aSeed.y * uDpr / max(w, 0.3);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = 0.85 * (1.0 - smoothstep(0.32, 0.5, d));
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// Any CSS colour (a hex, rgb(), color-mix()…) as 0..1 red, green, blue: painted into
// one pixel and read back.
function cssColor(value: string): [number, number, number] {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [0.5, 0.5, 0.5];
  ctx.fillStyle = "#808080";
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

// A word drawn in the footer's own display font into a hidden canvas.
function wordMask(text: string, family: string) {
  const size = 240;
  const pad = 4;
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return null;
  probe.font = `${size}px ${family}`;
  const m = probe.measureText(text);
  const left = m.actualBoundingBoxLeft;
  const ink = Math.ceil(left + m.actualBoundingBoxRight);
  const ascent = Math.ceil(m.actualBoundingBoxAscent);
  const descent = Math.ceil(m.actualBoundingBoxDescent);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, ink + pad * 2);
  canvas.height = Math.max(1, ascent + descent + pad * 2);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.font = `${size}px ${family}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000";
  ctx.fillText(text, pad + left, pad + ascent);
  const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const alpha = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3];
  return { alpha, width: canvas.width, height: canvas.height };
}

function dotCount(): number {
  const wide = window.innerWidth >= 1024;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (wide && fine) return 36000;
  return window.innerWidth >= 640 ? 22000 : 12000;
}

const PRESS_MS = { mouse: 250, touch: 400 };

// The footer's particle wordmark (design.md §13.61): one `Points` draw of N dots; each
// has its place in the form it is leaving and the one it is heading to, and the vertex
// shader does the morph, the distortion, the pointer's push and the press blob. The
// forms are prepared on the CPU (the words from a hidden canvas, the rest from
// formulas); the loop and the tap are `Timeline`. Decorative: `aria-hidden`.
export default function ParticleStage({
  fontSource,
  words,
  onReady,
  onFail,
}: {
  /** The solid wordmark: its font is the one the words are drawn in. */
  fontSource: RefObject<HTMLElement | null>;
  /** The three words after the name, in the page's language. */
  words: { developer: string; designer: string; photographer: string };
  onReady: () => void;
  onFail: () => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef({ onReady, onFail });
  useEffect(() => {
    callbacks.current = { onReady, onFail };
  });

  useEffect(() => {
    const host = stage.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let cancelled = false;
    const cleanups: Array<() => void> = [];
    const fail = () => {
      if (!cancelled) callbacks.current.onFail();
    };

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        canvas,
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      fail();
      return;
    }
    const gl = renderer.gl;
    const onLost = (event: Event) => {
      event.preventDefault();
      fail();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    cleanups.push(() => canvas.removeEventListener("webglcontextlost", onLost));

    const count = dotCount();
    const timeline = new Timeline();
    const family = fontSource.current
      ? getComputedStyle(fontSource.current).fontFamily
      : "sans-serif";

    // --- the dots' buffers
    const seeds = new Float32Array(count * 4);
    const seedRng = mulberry32(99);
    for (let i = 0; i < count; i++) {
      seeds[i * 4] = seedRng();
      seeds[i * 4 + 1] = 1.4 + seedRng() * 1.0;
      seeds[i * 4 + 2] = seedRng();
      seeds[i * 4 + 3] = seedRng();
    }
    const geometry = new Geometry(gl, {
      aFrom: { size: 3, data: new Float32Array(count * 3) },
      aTo: { size: 3, data: new Float32Array(count * 3) },
      aSeed: { size: 4, data: seeds },
    });

    const uniforms = {
      uMix: { value: 0 },
      uTime: { value: 0 },
      uAspect: { value: 2.2857 },
      uAngleFrom: { value: 0 },
      uAngleTo: { value: 0 },
      uDistort: { value: 0.2 },
      uPush: { value: 0.12 },
      uRadius: { value: 0.25 },
      uInfluence: { value: 0 },
      uPointer: { value: [0, 0] },
      uPress: { value: 0 },
      uBlob: { value: [0, 0] },
      uBlobRadius: { value: 0.07 },
      uDpr: { value: renderer.dpr },
      uColor: { value: [0.1, 0.1, 0.1] },
      uBlobColor: { value: [0.76, 0.25, 0.05] },
    };
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    program.setBlendFunc(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    const mesh = new Mesh(gl, { geometry, program, mode: gl.POINTS });

    // --- sizes and colours
    let width = 1;
    let height = 1;
    let builtFor = 0;
    const forms = new Map<number, Float32Array>();
    let cloud: Float32Array | null = null;

    const measure = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      renderer.setSize(width, height);
      const aspect = width / height;
      uniforms.uAspect.value = aspect;
      uniforms.uDistort.value = 120 / height / 1.3;
      uniforms.uPush.value = 70 / height;
      uniforms.uRadius.value = 140 / height;
      uniforms.uBlobRadius.value = 40 / height;
      // The words depend on the stage's shape: prepare them again if it changed.
      if (builtFor && Math.abs(aspect - builtFor) > 0.05) {
        forms.clear();
        cloud = null;
        builtFor = aspect;
        syncBuffers();
      }
    };

    const readColors = () => {
      const style = getComputedStyle(host);
      uniforms.uColor.value = cssColor(style.color);
      const accent = style.getPropertyValue("--primary-text").trim();
      if (accent) uniforms.uBlobColor.value = cssColor(accent);
    };

    // --- the forms
    const build = (index: number): Float32Array => {
      const form: Form = LOOP[index];
      const rng = mulberry32(1000 + index);
      const aspect = uniforms.uAspect.value;
      switch (form.kind) {
        case "word": {
          const text =
            (words as Record<string, string>)[form.id] ?? form.text ?? "";
          const mask = wordMask(text, family);
          if (!mask) return cloudForm(count, aspect, rng);
          const box = wordBox(mask.width, mask.height, aspect);
          return sampleMask(
            mask.alpha,
            mask.width,
            mask.height,
            count,
            box,
            rng,
          );
        }
        case "braces":
          return bracesForm(count, rng);
        case "lattice":
          return latticeForm(count, rng);
        case "bezier":
          return bezierForm(count, rng);
        case "wheel":
          return wheelForm(count, rng);
        case "camera":
          return cameraForm(count, rng);
        case "aperture":
          return apertureForm(count, rng);
      }
    };
    const formAt = (index: number): Float32Array => {
      if (index === CLOUD) {
        cloud ??= cloudForm(count, uniforms.uAspect.value, mulberry32(7));
        return cloud;
      }
      let points = forms.get(index);
      if (!points) {
        points = build(index);
        forms.set(index, points);
      }
      return points;
    };

    function syncBuffers() {
      const from = timeline.morphing ? timeline.from : timeline.to;
      geometry.attributes.aFrom.data = formAt(from);
      geometry.attributes.aFrom.needsUpdate = true;
      geometry.attributes.aTo.data = formAt(timeline.to);
      geometry.attributes.aTo.needsUpdate = true;
      // The next form is prepared while this one is held.
      if (!timeline.morphing) {
        const next = timeline.next;
        window.setTimeout(() => {
          if (!cancelled) formAt(next);
        }, 60);
      }
    }

    // --- the pointer: a push, a press-and-hold blob, a tap
    let pointerOn = false;
    const pointer = { x: 0, y: 0 };
    const blob = { x: 0, y: 0 };
    let influence = 0;
    let press = 0;
    let pressTarget = 0;
    let pressTimer: number | undefined;
    let down: { x: number; y: number; at: number; held: boolean } | null = null;

    const place = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const aspect = rect.width / rect.height;
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * aspect;
      pointer.y = -((event.clientY - rect.top) / rect.height - 0.5);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        if (
          down &&
          Math.hypot(event.clientX - down.x, event.clientY - down.y) > 10
        )
          window.clearTimeout(pressTimer);
        if (down?.held) place(event);
        return;
      }
      place(event);
      pointerOn = true;
    };
    const onLeave = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerOn = false;
      release();
    };
    const release = () => {
      window.clearTimeout(pressTimer);
      pressTarget = 0;
    };
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      place(event);
      if (event.pointerType !== "touch") pointerOn = true;
      down = {
        x: event.clientX,
        y: event.clientY,
        at: performance.now(),
        held: false,
      };
      const wait =
        event.pointerType === "touch" ? PRESS_MS.touch : PRESS_MS.mouse;
      window.clearTimeout(pressTimer);
      pressTimer = window.setTimeout(() => {
        if (!down) return;
        down.held = true;
        blob.x = pointer.x;
        blob.y = pointer.y;
        pressTarget = 1;
      }, wait);
    };
    const onUp = (event: PointerEvent) => {
      const was = down;
      down = null;
      release();
      if (!was || event.button !== 0) return;
      const moved = Math.hypot(event.clientX - was.x, event.clientY - was.y);
      if (!was.held && moved < 10 && timeline.skip()) syncBuffers();
    };
    const onCancel = () => {
      down = null;
      release();
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onCancel);
    cleanups.push(() => {
      window.clearTimeout(pressTimer);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onCancel);
    });

    // --- visibility, size and theme
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    observer.observe(host);
    const resize = new ResizeObserver(measure);
    resize.observe(host);
    const theme = new MutationObserver(readColors);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    cleanups.push(() => {
      observer.disconnect();
      resize.disconnect();
      theme.disconnect();
    });

    // --- the loop
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let announced = false;
    let slowTime = 0;
    let slowFrames = 0;
    let thinned = false;
    const spins = (index: number) => index >= 0 && Boolean(LOOP[index].spin);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      time += dt;

      const event = timeline.update(dt);
      if (event.started || event.ended) syncBuffers();

      influence +=
        ((pointerOn ? 1 : 0) - influence) * (1 - Math.exp(-dt / 0.12));
      press += (pressTarget - press) * (1 - Math.exp(-dt / 0.18));
      const follow = 1 - Math.exp(-dt / 0.1);
      if (pressTarget > 0 || press > 0.01) {
        blob.x += (pointer.x - blob.x) * follow;
        blob.y += (pointer.y - blob.y) * follow;
      }

      const from = timeline.morphing ? timeline.from : timeline.to;
      uniforms.uMix.value = timeline.morphing ? timeline.mix : 0;
      uniforms.uTime.value = time;
      uniforms.uAngleFrom.value = spins(from)
        ? time * SPIN_RADIANS_PER_SECOND
        : 0;
      uniforms.uAngleTo.value = spins(timeline.to)
        ? time * SPIN_RADIANS_PER_SECOND
        : 0;
      uniforms.uPointer.value = [pointer.x, pointer.y];
      uniforms.uInfluence.value = influence;
      uniforms.uPress.value = press;
      uniforms.uBlob.value = [blob.x, blob.y];

      renderer.render({ scene: mesh });

      if (!announced) {
        announced = true;
        callbacks.current.onReady();
      }
      // A slow device gets 60% of the dots, once.
      if (!thinned) {
        slowTime += dt;
        slowFrames += 1;
        if (slowTime >= 2) {
          if ((slowTime / slowFrames) * 1000 > 24) {
            geometry.setDrawRange(0, Math.floor(count * 0.6));
            thinned = true;
          }
          slowTime = 0;
          slowFrames = 0;
        }
      }
    };

    // The words need the font: start once it is ready.
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      measure();
      builtFor = uniforms.uAspect.value;
      readColors();
      try {
        syncBuffers();
      } catch {
        fail();
        return;
      }
      last = performance.now();
      raf = requestAnimationFrame(frame);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cleanups.forEach((run) => run());
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [fontSource, words]);

  return (
    <div
      ref={stage}
      aria-hidden="true"
      className="absolute inset-0 touch-pan-y text-foreground"
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
