import { Line3D, Text, type ThreeDScene } from 'manim-web';
import { NUM_SPACING } from './constants';
import { fmtNum, t } from './utils';

/** Render a column of numbers wrapped in [ ] brackets — used for vectors. */
export function addVectorColumn(
  scene: ThreeDScene,
  x: number,
  topZ: number,
  values: number[],
  textColor: string,
  bracketColor: string,
  yOffset = 0,
) {
  const colHeight = values.length * NUM_SPACING;
  const bTop = topZ + 0.15;
  const bBot = topZ - colHeight - 0.15;

  // Left [
  const lx = x - 0.35;
  scene.add(new Line3D({ start: t([lx, yOffset, bTop]), end: t([lx + 0.12, yOffset, bTop]), color: bracketColor, opacity: 0.6 }));
  scene.add(new Line3D({ start: t([lx, yOffset, bBot]), end: t([lx + 0.12, yOffset, bBot]), color: bracketColor, opacity: 0.6 }));
  scene.add(new Line3D({ start: t([lx, yOffset, bTop]), end: t([lx,        yOffset, bBot]), color: bracketColor, opacity: 0.6 }));

  // Right ]
  const rx = x + 0.35;
  scene.add(new Line3D({ start: t([rx, yOffset, bTop]), end: t([rx - 0.12, yOffset, bTop]), color: bracketColor, opacity: 0.6 }));
  scene.add(new Line3D({ start: t([rx, yOffset, bBot]), end: t([rx - 0.12, yOffset, bBot]), color: bracketColor, opacity: 0.6 }));
  scene.add(new Line3D({ start: t([rx, yOffset, bTop]), end: t([rx,        yOffset, bBot]), color: bracketColor, opacity: 0.6 }));

  // Numbers
  values.forEach((v, d) => {
    const z = topZ - d * NUM_SPACING;
    const label = new Text({ text: fmtNum(v), fontSize: 16, color: textColor });
    label.moveTo(t([x, yOffset, z]));
    scene.addFixedOrientationMobjects(label);
    scene.add(label);
  });

  // "..." tail
  const dots = new Text({ text: '⋮', fontSize: 14, color: '#aaa' });
  dots.moveTo(t([x, yOffset, topZ - values.length * NUM_SPACING + 0.05]));
  scene.addFixedOrientationMobjects(dots);
  scene.add(dots);
}

/** Arc line between two x positions — attention-style connection. */
export function addArcLine(
  scene: ThreeDScene,
  x1: number,
  x2: number,
  topZ: number,
  color: string,
  opacity: number,
  yOffset = 0,
) {
  const arcHeight = 0.5 + Math.abs(x2 - x1) * 0.08;
  const segments = 6;

  for (let s = 0; s < segments; s++) {
    const t1 = s / segments;
    const t2v = (s + 1) / segments;
    const p1x = x1 + (x2 - x1) * t1;
    const p1z = topZ + arcHeight * Math.sin(t1 * Math.PI);
    const p2x = x1 + (x2 - x1) * t2v;
    const p2z = topZ + arcHeight * Math.sin(t2v * Math.PI);
    scene.add(new Line3D({
      start: t([p1x, yOffset, p1z]),
      end:   t([p2x, yOffset, p2z]),
      color,
      opacity,
    }));
  }
}

/**
 * Residual-stream bypass: short elbows + vertical line beside a vector column,
 * visually "skipping" a transformer block (x = x + block(x)). Optional ⊕ marker
 * at the bottom indicates the merge point.
 */
export function addResidualBypass(
  scene: ThreeDScene,
  x: number,
  topZ: number,
  bottomZ: number,
  color: string,
  opacity: number,
  yOffset = 0,
  showPlus = false,
) {
  const offsetX = 0.6;
  const bx = x + 0.35;
  const rx = x + offsetX;
  // Top elbow (column → bypass)
  scene.add(new Line3D({ start: t([bx, yOffset, topZ]),    end: t([rx, yOffset, topZ]),    color, opacity }));
  // Vertical bypass
  scene.add(new Line3D({ start: t([rx, yOffset, topZ]),    end: t([rx, yOffset, bottomZ]), color, opacity }));
  // Bottom elbow (bypass → column)
  scene.add(new Line3D({ start: t([rx, yOffset, bottomZ]), end: t([bx, yOffset, bottomZ]), color, opacity }));

  if (showPlus) {
    const plus = new Text({ text: '⊕', fontSize: 22, color });
    plus.moveTo(t([bx - 0.1, yOffset, bottomZ]));
    scene.addFixedOrientationMobjects(plus);
    scene.add(plus);
  }
}

/** Lightweight [ ] outline with no numbers — used for ghost-layer vector placeholders. */
export function addBracketOutline(
  scene: ThreeDScene,
  x: number,
  topZ: number,
  height: number,
  yOff: number,
  color: string,
  opacity: number,
) {
  const bx = x - 0.35;
  const rx = x + 0.35;
  const bTop = topZ + 0.15;
  const bBot = topZ - height - 0.15;

  // Left [
  scene.add(new Line3D({ start: t([bx, yOff, bTop]), end: t([bx,       yOff, bBot]), color, opacity }));
  scene.add(new Line3D({ start: t([bx, yOff, bTop]), end: t([bx + 0.1, yOff, bTop]), color, opacity }));
  scene.add(new Line3D({ start: t([bx, yOff, bBot]), end: t([bx + 0.1, yOff, bBot]), color, opacity }));
  // Right ]
  scene.add(new Line3D({ start: t([rx, yOff, bTop]), end: t([rx,       yOff, bBot]), color, opacity }));
  scene.add(new Line3D({ start: t([rx, yOff, bTop]), end: t([rx - 0.1, yOff, bTop]), color, opacity }));
  scene.add(new Line3D({ start: t([rx, yOff, bBot]), end: t([rx - 0.1, yOff, bBot]), color, opacity }));
}
