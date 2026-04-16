import { Box3D, Line3D, Sphere, Text, type ThreeDScene } from 'manim-web';
import { fmtNum, t, type V3 } from './utils';

/**
 * Horizontal one-hot bar. Draws `cellCount` small squares left-to-right from
 * `leftCenter`, with cell `litIdx` highlighted. Optionally adds a "..." marker
 * at the right to hint at truncation.
 */
export function addOneHotBar(
  scene: ThreeDScene,
  leftCenter: V3,
  cellCount: number,
  litIdx: number,
  litColor = '#F4D03F',
  cellSize = 0.22,
  gap = 0.02,
  showTruncation = true,
) {
  for (let i = 0; i < cellCount; i++) {
    const x = leftCenter[0] + i * (cellSize + gap) + cellSize / 2;
    const isLit = i === litIdx;
    scene.add(new Box3D({
      width: cellSize, height: cellSize, depth: cellSize,
      center: t([x, leftCenter[1], leftCenter[2]]),
      color: isLit ? litColor : '#777777',
      opacity: isLit ? 1.0 : 0.85,
    }));
    if (isLit) {
      // "1" label above the lit cell
      const one = new Text({ text: '1', fontSize: 11, color: '#000' });
      one.moveTo(t([x, leftCenter[1] - 0.02, leftCenter[2]]));
      scene.addFixedOrientationMobjects(one);
      scene.add(one);
    }
  }

  if (showTruncation) {
    const tailX = leftCenter[0] + cellCount * (cellSize + gap) + 0.15;
    const dots = new Text({ text: '⋯', fontSize: 18, color: '#aaaaaa' });
    dots.moveTo(t([tailX, leftCenter[1], leftCenter[2]]));
    scene.addFixedOrientationMobjects(dots);
    scene.add(dots);
  }
}

/**
 * 2D grid of colored cells — our schematic of the embedding matrix E.
 * Values are drawn in [-1, 1]; blue = positive, red = negative, opacity = |v|.
 * Returns per-row center positions so callers can attach arrows/labels.
 */
export function addMatrixGrid(
  scene: ThreeDScene,
  topLeft: V3,
  values: number[][],
  cellSize: number,
  highlightRow = -1,
): { rowCenter: V3; rowEnd: V3 }[] {
  const rows = values.length;
  const cols = values[0].length;
  const results: { rowCenter: V3; rowEnd: V3 }[] = [];

  for (let r = 0; r < rows; r++) {
    const zCenter = topLeft[2] - r * cellSize;
    for (let c = 0; c < cols; c++) {
      const xCenter = topLeft[0] + c * cellSize;
      const v = values[r][c];
      const isPos = v >= 0;
      const mag = Math.min(1, Math.abs(v));
      scene.add(new Box3D({
        width: cellSize * 0.9, height: cellSize * 0.9, depth: cellSize * 0.9,
        center: t([xCenter, topLeft[1], zCenter]),
        color: isPos ? '#58C4DD' : '#FC6255',
        opacity: 0.35 + mag * 0.6,
      }));
    }
    const rowCenterX = topLeft[0] + ((cols - 1) * cellSize) / 2;
    const rowEndX = topLeft[0] + (cols - 1) * cellSize + cellSize / 2;
    results.push({
      rowCenter: [rowCenterX, topLeft[1], zCenter],
      rowEnd: [rowEndX, topLeft[1], zCenter],
    });
  }

  // Highlight outline
  if (highlightRow >= 0 && highlightRow < rows) {
    const z = topLeft[2] - highlightRow * cellSize;
    const zTop = z + cellSize / 2 + 0.04;
    const zBot = z - cellSize / 2 - 0.04;
    const xL = topLeft[0] - cellSize / 2 - 0.04;
    const xR = topLeft[0] + (cols - 1) * cellSize + cellSize / 2 + 0.04;
    const HL = '#F4D03F';
    const edge = (s: V3, e: V3) =>
      scene.add(new Line3D({ start: t(s), end: t(e), color: HL, opacity: 1 }));
    edge([xL, topLeft[1], zTop], [xR, topLeft[1], zTop]);
    edge([xL, topLeft[1], zBot], [xR, topLeft[1], zBot]);
    edge([xL, topLeft[1], zTop], [xL, topLeft[1], zBot]);
    edge([xR, topLeft[1], zTop], [xR, topLeft[1], zBot]);
  }

  return results;
}

/** Column of numbers in brackets — renders a dense vector. */
export function addVectorColumn(
  scene: ThreeDScene,
  topCenter: V3,
  values: number[],
  color: string,
  bracketColor: string,
  fontSize = 13,
  spacing = 0.32,
) {
  const colHeight = values.length * spacing;
  const bTop = topCenter[2] + 0.15;
  const bBot = topCenter[2] - colHeight - 0.05;
  const x = topCenter[0];
  const y = topCenter[1];

  const lx = x - 0.42;
  scene.add(new Line3D({ start: t([lx, y, bTop]), end: t([lx + 0.14, y, bTop]), color: bracketColor, opacity: 0.85 }));
  scene.add(new Line3D({ start: t([lx, y, bBot]), end: t([lx + 0.14, y, bBot]), color: bracketColor, opacity: 0.85 }));
  scene.add(new Line3D({ start: t([lx, y, bTop]), end: t([lx,        y, bBot]), color: bracketColor, opacity: 0.85 }));

  const rx = x + 0.42;
  scene.add(new Line3D({ start: t([rx, y, bTop]), end: t([rx - 0.14, y, bTop]), color: bracketColor, opacity: 0.85 }));
  scene.add(new Line3D({ start: t([rx, y, bBot]), end: t([rx - 0.14, y, bBot]), color: bracketColor, opacity: 0.85 }));
  scene.add(new Line3D({ start: t([rx, y, bTop]), end: t([rx,        y, bBot]), color: bracketColor, opacity: 0.85 }));

  values.forEach((v, i) => {
    const z = topCenter[2] - i * spacing - spacing / 2;
    const label = new Text({ text: fmtNum(v), fontSize, color });
    label.moveTo(t([x, y, z]));
    scene.addFixedOrientationMobjects(label);
    scene.add(label);
  });
}

/** A word-sphere with a nearby text label. Returns the sphere center. */
export function addWordSphere(
  scene: ThreeDScene,
  pos: V3,
  word: string,
  color: string,
  radius = 0.22,
  fontSize = 14,
  labelOffset: V3 = [0.35, 0, 0.35],
) {
  scene.add(new Sphere({
    center: t(pos),
    radius,
    color,
    opacity: 0.92,
  }));
  const label = new Text({ text: word, fontSize, color });
  label.moveTo(t([pos[0] + labelOffset[0], pos[1] + labelOffset[1], pos[2] + labelOffset[2]]));
  scene.addFixedOrientationMobjects(label);
  scene.add(label);
}

/** Lightweight rectangular frame (4 edges) around a rectangle in x–z plane. */
export function addRect(
  scene: ThreeDScene,
  topLeft: V3,
  width: number,
  height: number,
  color: string,
  opacity = 0.4,
) {
  const [x, y, z] = topLeft;
  const edge = (s: V3, e: V3) =>
    scene.add(new Line3D({ start: t(s), end: t(e), color, opacity }));
  edge([x,         y, z],          [x + width, y, z]);
  edge([x + width, y, z],          [x + width, y, z - height]);
  edge([x + width, y, z - height], [x,         y, z - height]);
  edge([x,         y, z - height], [x,         y, z]);
}
