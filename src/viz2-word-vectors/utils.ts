export type V3 = [number, number, number];

/** Logical (x, y, z) → manim-web's y-up coords (z becomes screen-up). */
export function t(p: V3): V3 {
  return [p[0], p[2], -p[1]];
}

/** Park-Miller seeded PRNG. */
export function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function fmtNum(v: number): string {
  const s = Math.abs(v).toFixed(2);
  return v >= 0 ? `+${s}` : `−${s}`;
}
