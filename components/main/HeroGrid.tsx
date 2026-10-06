"use client";

import { useEffect, useRef, useState } from "react";
import { useFinePointer, usePrefersReducedMotion } from "@/lib/media";

const CELL_PX = 32;
const DOT_RADIUS_PX = 1.25;
const RADIUS_PX = 160;
const TRAIL_RADIUS_PX = 200;
const BASE_ALPHA = 0.6;
const START_AFTER_MS = 1400; // after the page's entrance, so it never competes with it

const VERTEX = /* glsl */ `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// One dot per 32px cell. Dots near the pointer swell, are pushed outward, and
// blend toward the accent; a second, slower swell trails the first.
const FRAGMENT = /* glsl */ `
  precision highp float;
  uniform vec2 uSize;        // CSS px
  uniform float uDpr;
  uniform vec2 uPointer;     // CSS px, y down
  uniform vec2 uTrail;
  uniform float uStrength;   // 0..1
  uniform vec3 uBase;
  uniform vec3 uAccent;

  void main() {
    vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
    vec2 center = (floor(p / ${CELL_PX.toFixed(1)}) + 0.5) * ${CELL_PX.toFixed(1)};

    float f = (1.0 - smoothstep(0.0, ${RADIUS_PX.toFixed(1)}, distance(center, uPointer))) * uStrength;
    float t = (1.0 - smoothstep(0.0, ${TRAIL_RADIUS_PX.toFixed(1)}, distance(center, uTrail))) * uStrength * 0.5;

    vec2 away = normalize(center - uPointer + 0.0001);
    vec2 awayTrail = normalize(center - uTrail + 0.0001);
    vec2 dotAt = center + away * f * 6.0 + awayTrail * t * 4.0;

    float radius = ${DOT_RADIUS_PX.toFixed(2)} * (1.0 + f * 1.4 + t * 0.8);
    float coverage = 1.0 - smoothstep(radius - 0.25, radius + 0.5, distance(p, dotAt));

    vec3 color = mix(uBase, uAccent, clamp(f + t * 0.6, 0.0, 1.0));
    float alpha = coverage * ${BASE_ALPHA.toFixed(2)};
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

function readColor(name: string): [number, number, number] {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const hex = value.replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const int = parseInt(full, 16);
  if (Number.isNaN(int) || full.length !== 6) return [0.5, 0.5, 0.5];
  return [(int >> 16) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}

// The hero's background (design.md §14.1, step 5): a static dot grid, with a
// WebGL version laid over it that reacts to the cursor. The canvas is only used
// where a precise pointer exists, motion is allowed, Save-Data is off, and
// WebGL works — and only after the entrance. Everywhere else the static grid
// stays. Decorative: hidden from assistive technology.
export function HeroGrid() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const enabled = fine && !reduced && !saveData;

  useEffect(() => {
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    // Reading a browser setting once, after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (connection?.saveData) setSaveData(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    let disposed = false;
    let stop: (() => void) | undefined;

    const start = async () => {
      let ogl: typeof import("ogl");
      try {
        ogl = await import("ogl");
      } catch {
        return;
      }
      if (disposed) return;

      let renderer: InstanceType<typeof ogl.Renderer>;
      try {
        renderer = new ogl.Renderer({
          canvas,
          alpha: true,
          antialias: false,
          premultipliedAlpha: true,
          dpr: Math.min(window.devicePixelRatio || 1, 1.5),
        });
      } catch {
        return; // no WebGL: the static grid stays
      }
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);

      const uniforms = {
        uSize: { value: [1, 1] },
        uDpr: { value: renderer.dpr },
        uPointer: { value: [-1e4, -1e4] },
        uTrail: { value: [-1e4, -1e4] },
        uStrength: { value: 0 },
        uBase: { value: readColor("--border") },
        uAccent: { value: readColor("--primary") },
      };
      const program = new ogl.Program(gl, {
        vertex: VERTEX,
        fragment: FRAGMENT,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const mesh = new ogl.Mesh(gl, {
        geometry: new ogl.Triangle(gl),
        program,
      });

      const pointer = { x: -1e4, y: -1e4, inside: false };
      let strengthTarget = 0;
      let dirty = true;
      let visible = true;
      let running = false;
      let frame = 0;
      let last = 0;
      let firstFrame = true;

      const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        if (width === 0 || height === 0) return;
        renderer.setSize(width, height);
        uniforms.uSize.value = [width, height];
        dirty = true;
      };

      const draw = (now: number) => {
        frame = 0;
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;

        // Frame-rate independent easing toward the pointer; the trail is slower
        // and the strength falls back to 0 over about 600ms after the pointer
        // leaves.
        const follow = 1 - Math.exp(-dt * 12);
        const trail = 1 - Math.exp(-dt * 3);
        const strength = 1 - Math.exp(-dt * (strengthTarget > 0 ? 10 : 5));
        const p = uniforms.uPointer.value;
        const t = uniforms.uTrail.value;
        if (p[0] < -1e3) {
          p[0] = pointer.x;
          p[1] = pointer.y;
          t[0] = pointer.x;
          t[1] = pointer.y;
        }
        p[0] += (pointer.x - p[0]) * follow;
        p[1] += (pointer.y - p[1]) * follow;
        t[0] += (pointer.x - t[0]) * trail;
        t[1] += (pointer.y - t[1]) * trail;
        uniforms.uStrength.value +=
          (strengthTarget - uniforms.uStrength.value) * strength;

        const settled =
          strengthTarget === 0 && uniforms.uStrength.value < 0.002;
        if (settled) uniforms.uStrength.value = 0;

        // Skip frames while nothing moves.
        if (!settled || dirty) {
          renderer.render({ scene: mesh });
          dirty = false;
          if (firstFrame) {
            firstFrame = false;
            setReady(true);
          }
        }
        if (!settled && visible) frame = requestAnimationFrame(draw);
        else running = false;
      };

      const wake = () => {
        if (running || disposed || !visible || document.hidden) return;
        running = true;
        last = performance.now();
        frame = requestAnimationFrame(draw);
      };

      const onMove = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
        if (inside) {
          pointer.x = x;
          pointer.y = y;
        }
        strengthTarget = inside ? 1 : 0;
        pointer.inside = inside;
        wake();
      };
      const onLeave = () => {
        strengthTarget = 0;
        wake();
      };

      const resizeObserver = new ResizeObserver(() => {
        resize();
        wake();
      });
      resizeObserver.observe(host);

      const visibility = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake();
      });
      visibility.observe(host);

      // Re-read the colours when the theme changes.
      const themeObserver = new MutationObserver(() => {
        uniforms.uBase.value = readColor("--border");
        uniforms.uAccent.value = readColor("--primary");
        dirty = true;
        wake();
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      const onVisibility = () => {
        if (!document.hidden) wake();
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", onVisibility);
      resize();
      wake();

      stop = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        visibility.disconnect();
        themeObserver.disconnect();
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        document.removeEventListener("visibilitychange", onVisibility);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    };

    // After the entrance, when the browser is idle.
    const timer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => void start(), { timeout: 1500 });
      } else {
        void start();
      }
    }, START_AFTER_MS);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      stop?.();
      setReady(false);
    };
  }, [enabled]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
    >
      <div
        className="hero-dots absolute inset-0 transition-opacity duration-700"
        style={{ opacity: ready ? 0 : 1 }}
      />
      {enabled && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full transition-opacity duration-700"
          style={{ opacity: ready ? 1 : 0 }}
        />
      )}
    </div>
  );
}
