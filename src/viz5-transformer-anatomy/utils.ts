import { VEC_DIM } from './constants';

export type V3 = [number, number, number];

/**
 * Maps logical (x, y, z) — where z is screen-vertical and y is depth-into-scene —
 * into manim-web's coordinate system (y = up, -z = into the screen).
 */
export function t(p: V3): V3 {
  return [p[0], p[2], -p[1]];
}

/** Park–Miller PRNG; deterministic so the visualization looks identical across runs. */
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Pseudo-random embedding-style vector: VEC_DIM values in [-9, 9] with one decimal. */
export function genVec(seed: number): number[] {
  const rng = seededRandom(seed);
  return Array.from({ length: VEC_DIM }, () => +(rng() * 18 - 9).toFixed(1));
}

/** Format a float with an explicit sign: "+3.2" / "-1.7". */
export function fmtNum(v: number): string {
  return v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1);
}
