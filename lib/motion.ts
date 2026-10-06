// Motion constants shared by every component (design.md §8).

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

// Anything the user touches: critically damped, no bounce.
export const SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;

// Solves a CSS cubic-bezier curve for use as a JS easing function (Lenis).
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (t: number) => number {
  const sample = (a: number, b: number, c: number, t: number) =>
    ((1 - 3 * c + 3 * a) * t + (3 * c - 6 * a)) * t * t + 3 * a * t;
  const slope = (a: number, b: number, c: number, t: number) =>
    3 * (1 - 3 * c + 3 * a) * t * t + 2 * (3 * c - 6 * a) * t + 3 * a;

  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const error = sample(x1, 0, x2, t) - x;
      const derivative = slope(x1, 0, x2, t);
      if (Math.abs(error) < 1e-6) break;
      if (Math.abs(derivative) < 1e-6) break;
      t -= error / derivative;
    }
    // Bisection fallback keeps the result in range for steep curves.
    let low = 0;
    let high = 1;
    for (let i = 0; i < 20 && Math.abs(sample(x1, 0, x2, t) - x) > 1e-6; i++) {
      if (sample(x1, 0, x2, t) < x) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return sample(y1, 0, y2, t);
  };
}

export const easeInOut = cubicBezier(...EASE_IN_OUT);
