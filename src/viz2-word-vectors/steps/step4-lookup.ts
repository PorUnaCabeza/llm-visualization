import { Arrow3D, Box3D, Text, type ThreeDScene } from 'manim-web';
import { D_MODEL, D_VIS, VOCAB_SIZE } from '../constants';
import { addMatrixGrid, addOneHotBar, addVectorColumn } from '../primitives';
import { seededRandom, t } from '../utils';

// ─── Step 4: Lookup = one-hot · E = row-i of E ───
//
// The point: the embedding "layer" is mathematically a matrix multiplication
// between a one-hot vector and the embedding matrix E, but because one-hot
// only has one non-zero entry, in practice it's just a row lookup: E[id].

const HIGHLIGHT_ROW = 5;   // arbitrary "猫" row
const MAT_CELL = 0.32;
const MAT_ROWS = 12;

export function step4Lookup(scene: ThreeDScene): string {
  // Title
  const title = new Text({ text: '④ 查表 = 选一行', fontSize: 22, color: '#B98A0E' });
  title.moveTo(t([0, 0, 3.8]));
  scene.addFixedOrientationMobjects(title);
  scene.add(title);

  const sub = new Text({
    text: 'one_hot(id) · E  ≡  E[id]   — 数学是乘法，代码就是一次行索引',
    fontSize: 13, color: '#666',
  });
  sub.moveTo(t([0, 0, 3.15]));
  scene.addFixedOrientationMobjects(sub);
  scene.add(sub);

  // ─── Left: vertical one-hot column representing the input ───
  const onehotX = -4.2;
  const onehotTopZ = 2.5;
  // Draw as a horizontal mini-bar, rotated via vertical stacking of tiny cells
  const cells = MAT_ROWS;
  const cellSize = MAT_CELL;
  for (let r = 0; r < cells; r++) {
    const z = onehotTopZ - r * cellSize;
    const isLit = r === HIGHLIGHT_ROW;
    const val = isLit ? '1' : '0';
    const col = isLit ? '#F4D03F' : '#444';
    const boxColor = isLit ? '#F4D03F' : '#bfb6a0';
    // Colored square
    scene.add(new Box3D({
      width: cellSize * 0.92, height: cellSize * 0.92, depth: cellSize * 0.92,
      center: t([onehotX, 0, z]),
      color: boxColor,
      opacity: isLit ? 1.0 : 0.55,
    }));
    const lbl = new Text({ text: val, fontSize: 11, color: isLit ? '#000' : '#888' });
    lbl.moveTo(t([onehotX, -0.01, z]));
    scene.addFixedOrientationMobjects(lbl);
    scene.add(lbl);
  }
  // Column header
  const ohTitle = new Text({ text: 'one_hot(猫)', fontSize: 12, color: '#B98A0E' });
  ohTitle.moveTo(t([onehotX, 0, onehotTopZ + 0.6]));
  scene.addFixedOrientationMobjects(ohTitle);
  scene.add(ohTitle);
  const ohDim = new Text({ text: `长度 ${VOCAB_SIZE.toLocaleString()}`, fontSize: 10, color: '#888' });
  ohDim.moveTo(t([onehotX, 0, onehotTopZ - cells * cellSize + 0.1]));
  scene.addFixedOrientationMobjects(ohDim);
  scene.add(ohDim);

  // ─── Middle: the matrix E with highlighted row ───
  const matTopLeft: [number, number, number] = [-3.2, 0, onehotTopZ];
  const rng = seededRandom(42);
  const values: number[][] = [];
  for (let r = 0; r < MAT_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < D_VIS; c++) {
      row.push(rng() * 2 - 1);
    }
    values.push(row);
  }
  const rowInfo = addMatrixGrid(scene, matTopLeft, values, MAT_CELL, HIGHLIGHT_ROW);

  // E header
  const eTitle = new Text({ text: 'E', fontSize: 18, color: '#3F7A26' });
  eTitle.moveTo(t([matTopLeft[0] + D_VIS * MAT_CELL / 2, 0, matTopLeft[2] + 0.8]));
  scene.addFixedOrientationMobjects(eTitle);
  scene.add(eTitle);
  const eShape = new Text({
    text: `[${VOCAB_SIZE.toLocaleString()} × ${D_MODEL}]`,
    fontSize: 10, color: '#888',
  });
  eShape.moveTo(t([matTopLeft[0] + D_VIS * MAT_CELL / 2, 0, matTopLeft[2] + 0.45]));
  scene.addFixedOrientationMobjects(eShape);
  scene.add(eShape);

  // "=" arrow from matrix row to dense vector
  const rowEnd = rowInfo[HIGHLIGHT_ROW].rowEnd;
  const arrowStart: [number, number, number] = [rowEnd[0] + 0.3, 0, rowEnd[2]];
  const denseTopX = 1.6;
  const denseCenterZ = rowEnd[2] + 0.55 * D_VIS / 2;   // we shift dense up a bit visually

  scene.add(new Arrow3D({
    start: t(arrowStart),
    end:   t([denseTopX - 0.7, 0, rowEnd[2]]),
    color: '#B98A0E', opacity: 0.9,
    shaftRadius: 0.025, tipLength: 0.2, tipRadius: 0.08,
  }));
  const eqLabel = new Text({ text: '=  E[2031]', fontSize: 12, color: '#B98A0E' });
  eqLabel.moveTo(t([(arrowStart[0] + denseTopX - 0.7) / 2, 0, rowEnd[2] + 0.35]));
  scene.addFixedOrientationMobjects(eqLabel);
  scene.add(eqLabel);

  // ─── Right: the dense vector (8 visible dims) ───
  const denseVals = values[HIGHLIGHT_ROW];
  const denseTopZ = 2.0;
  addVectorColumn(scene, [denseTopX, 0, denseTopZ], denseVals, '#B98A0E', '#B98A0E');

  const denseTitle = new Text({ text: '"猫" 的稠密向量', fontSize: 13, color: '#B98A0E' });
  denseTitle.moveTo(t([denseTopX, 0, denseTopZ + 0.55]));
  scene.addFixedOrientationMobjects(denseTitle);
  scene.add(denseTitle);

  const denseDim = new Text({ text: `d_model = ${D_MODEL}`, fontSize: 11, color: '#666' });
  denseDim.moveTo(t([denseTopX, 0, denseTopZ - denseVals.length * 0.32 - 0.35]));
  scene.addFixedOrientationMobjects(denseDim);
  scene.add(denseDim);

  // ─── Right-most: formula + complexity punchline ───
  const boxX = 3.8;
  const boxZ = 2.2;

  const bt = new Text({ text: '核心事实', fontSize: 14, color: '#444' });
  bt.moveTo(t([boxX, 0, boxZ]));
  scene.addFixedOrientationMobjects(bt);
  scene.add(bt);

  const l1 = new Text({ text: '从 50000 维稀疏', fontSize: 11, color: '#2a2a2a' });
  l1.moveTo(t([boxX, 0, boxZ - 0.55]));
  scene.addFixedOrientationMobjects(l1);
  scene.add(l1);

  const l2 = new Text({ text: `→ ${D_MODEL} 维稠密`, fontSize: 11, color: '#2a2a2a' });
  l2.moveTo(t([boxX, 0, boxZ - 0.95]));
  scene.addFixedOrientationMobjects(l2);
  scene.add(l2);

  const l3 = new Text({ text: '每个维度都学到一个', fontSize: 11, color: '#444' });
  l3.moveTo(t([boxX, 0, boxZ - 1.55]));
  scene.addFixedOrientationMobjects(l3);
  scene.add(l3);

  const l4 = new Text({ text: '"语义坐标"，例如：', fontSize: 11, color: '#444' });
  l4.moveTo(t([boxX, 0, boxZ - 1.95]));
  scene.addFixedOrientationMobjects(l4);
  scene.add(l4);

  const exs = [
    { text: 'd1 ≈ 生命 / 无生命', c: '#1F6F89' },
    { text: 'd2 ≈ 具体 / 抽象',  c: '#3F7A26' },
    { text: 'd3 ≈ 大 / 小',       c: '#FC6255' },
    { text: 'd4 ≈ 积极 / 消极',  c: '#5C3F70' },
  ];
  exs.forEach((e, i) => {
    const lbl = new Text({ text: e.text, fontSize: 10, color: e.c });
    lbl.moveTo(t([boxX, 0, boxZ - 2.55 - i * 0.32]));
    scene.addFixedOrientationMobjects(lbl);
    scene.add(lbl);
  });

  scene.render();
  return '第4步：嵌入层 = one-hot × E。因为 one-hot 只有一个 1，结果等于 E 的第 id 行 — 所以工程上直接索引。';
}
