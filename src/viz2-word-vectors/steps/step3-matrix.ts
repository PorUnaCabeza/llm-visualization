import { Box3D, Text, type ThreeDScene } from 'manim-web';
import { D_MODEL, D_VIS, VOCAB_SIZE } from '../constants';
import { addMatrixGrid } from '../primitives';
import { seededRandom, t } from '../utils';

// ─── Step 3: The embedding matrix E — taught as "每个词的特征卡" ───
//
// Karpathy's framing (Deep Dive into LLMs, around the Transformer internals
// segment): "every possible token has kind of like a vector that represents
// it inside the neural network" — the *distributed representation*.
//
// So we don't lead with the matrix. We lead with ONE word's concrete vector:
// a mini "stat card" for 猫, with each dimension labeled as a pretend
// semantic axis (生命感, 可爱度, 危险度…). That's schematic — real embeddings
// learn entangled features — but it gives the reader a hook to understand
// WHY numbers in E mean something. The matrix E is then revealed as just
// "50,000 of these cards stacked".

// Fake-but-plausible feature values for 猫's 8 visible dims.
// The labels are pedagogical, not literal — real models don't have clean
// axes like this. Signs/magnitudes chosen so the bar chart looks varied.
const CAT_FEATURES_TRAINED = [
  { name: 'd1', label: '生命感',   value:  0.82 },
  { name: 'd2', label: '具体度',   value:  0.65 },
  { name: 'd3', label: '可爱度',   value:  0.73 },
  { name: 'd4', label: '危险度',   value: -0.28 },
  { name: 'd5', label: '体型',     value: -0.35 },
  { name: 'd6', label: '家养度',   value:  0.77 },
  { name: 'd7', label: '叫声响度', value:  0.44 },
  { name: 'd8', label: '敏捷度',   value:  0.51 },
];

// Untrained: same 8 dims but values are random and labels are question marks
// (because before training, no dimension has any semantic meaning).
const CAT_FEATURES_UNTRAINED = [
  { name: 'd1', label: '?', value:  0.13 },
  { name: 'd2', label: '?', value: -0.71 },
  { name: 'd3', label: '?', value:  0.42 },
  { name: 'd4', label: '?', value: -0.55 },
  { name: 'd5', label: '?', value:  0.28 },
  { name: 'd6', label: '?', value: -0.63 },
  { name: 'd7', label: '?', value:  0.85 },
  { name: 'd8', label: '?', value: -0.19 },
];

const CAT_ROW = 4;   // row of 猫 in the matrix — must line up with ROW_LABELS below.

export function step3Matrix(scene: ThreeDScene, trained: boolean = true): string {
  const CAT_FEATURES = trained ? CAT_FEATURES_TRAINED : CAT_FEATURES_UNTRAINED;
  const accent     = trained ? '#3F7A26' : '#FC6255';
  const cardAccent = trained ? '#B98A0E' : '#FC6255';
  // ─── Title ───
  const title = new Text({
    text: trained
      ? '③ 词向量 — 每个词都有一张"特征卡"'
      : '③ 训练前 — 每个词的"特征卡"还是空白',
    fontSize: 22, color: accent,
  });
  title.moveTo(t([0, 0, 3.8]));
  scene.addFixedOrientationMobjects(title);
  scene.add(title);

  const sub = new Text({
    text: trained
      ? `每个 token 在网络里 = 一个 ${D_MODEL} 维向量（distributed representation）`
      : `每个 token 也是一个 ${D_MODEL} 维向量 —— 但每一维都是随机数，没有意义`,
    fontSize: 13, color: '#666',
  });
  sub.moveTo(t([0, 0, 3.15]));
  scene.addFixedOrientationMobjects(sub);
  scene.add(sub);

  // ═══════════════════════════════════════════════════
  // LEFT: one concrete word's vector as a bar-chart card
  // ═══════════════════════════════════════════════════
  const cardLabelX = -4.0;
  const barZeroX = -2.5;            // the "0" axis of the bar chart
  const maxBarLen = 1.2;
  const cardTopZ = 2.5;
  const rowHeight = 0.38;

  // Card header
  const cardTitle = new Text({
    text: trained ? '"猫" 的向量' : '"猫" 的向量（训练前）',
    fontSize: 18, color: cardAccent,
  });
  cardTitle.moveTo(t([barZeroX - 0.2, 0, cardTopZ]));
  scene.addFixedOrientationMobjects(cardTitle);
  scene.add(cardTitle);

  const cardHint = new Text({
    text: trained
      ? '（示意：每一维 = 一种"语义轴"，模型自己学出来）'
      : '（每一维都是随机初始化的浮点数，还没"学"出含义）',
    fontSize: 10, color: '#888',
  });
  cardHint.moveTo(t([barZeroX - 0.2, 0, cardTopZ - 0.42]));
  scene.addFixedOrientationMobjects(cardHint);
  scene.add(cardHint);

  // Zero line (vertical, light grey)
  const barRowsTopZ = cardTopZ - 1.0 + rowHeight * 0.4;
  const barRowsBotZ = cardTopZ - 1.0 - (CAT_FEATURES.length - 1) * rowHeight - rowHeight * 0.4;
  scene.add(new Box3D({
    width: 0.015,
    height: 0.015,
    depth: barRowsTopZ - barRowsBotZ,
    center: t([barZeroX, 0, (barRowsTopZ + barRowsBotZ) / 2]),
    color: '#a89f86',
    opacity: 0.7,
  }));

  // Bars
  CAT_FEATURES.forEach((f, i) => {
    const z = cardTopZ - 1.0 - i * rowHeight;

    // Left-side label
    const lbl = new Text({
      text: `${f.name}  ${f.label}`,
      fontSize: 10,
      color: '#444',
    });
    lbl.moveTo(t([cardLabelX, 0, z]));
    scene.addFixedOrientationMobjects(lbl);
    scene.add(lbl);

    // Bar — grows from zero line outward in the sign's direction
    const sign = f.value >= 0 ? 1 : -1;
    const len = Math.abs(f.value) * maxBarLen;
    const barCenterX = barZeroX + sign * len / 2;
    const col = sign > 0 ? '#1F6F89' : '#C04545';
    scene.add(new Box3D({
      width: Math.max(len, 0.02),
      height: 0.22,
      depth: 0.22,
      center: t([barCenterX, 0, z]),
      color: col,
      opacity: 0.85,
    }));

    // Value text always on the far right, aligned column
    const valText = (f.value >= 0 ? '+' : '−') + Math.abs(f.value).toFixed(2);
    const v = new Text({ text: valText, fontSize: 10, color: col });
    v.moveTo(t([barZeroX + maxBarLen + 0.55, 0, z]));
    scene.addFixedOrientationMobjects(v);
    scene.add(v);
  });

  // Ellipsis hint
  const ellZ = cardTopZ - 1.0 - CAT_FEATURES.length * rowHeight;
  const ell = new Text({
    text: `⋮   共 ${D_MODEL} 维`,
    fontSize: 11, color: '#888',
  });
  ell.moveTo(t([barZeroX, 0, ellZ]));
  scene.addFixedOrientationMobjects(ell);
  scene.add(ell);

  // ═══════════════════════════════════════════════════
  // RIGHT: 50,000 cards stacked = matrix E
  // ═══════════════════════════════════════════════════
  const MAT_CELL = 0.26;
  const MAT_ROWS = 12;
  const matTopLeft: [number, number, number] = [1.8, 0, 1.9];
  const matCenterX = matTopLeft[0] + ((D_VIS - 1) * MAT_CELL) / 2;
  const matRightX = matTopLeft[0] + D_VIS * MAT_CELL;

  // Bridge text above matrix
  const eHeader = new Text({
    text: '把 50,000 张这样的卡一行一行叠起来 →',
    fontSize: 11, color: '#444',
  });
  eHeader.moveTo(t([matCenterX, 0, matTopLeft[2] + 0.85]));
  scene.addFixedOrientationMobjects(eHeader);
  scene.add(eHeader);

  const eTitle = new Text({ text: '嵌入矩阵  E', fontSize: 17, color: '#3F7A26' });
  eTitle.moveTo(t([matCenterX, 0, matTopLeft[2] + 0.45]));
  scene.addFixedOrientationMobjects(eTitle);
  scene.add(eTitle);

  // Build matrix values; overwrite 猫's row with our feature values so the
  // colored row visually matches the card on the left.
  const rng = seededRandom(42);
  const values: number[][] = [];
  for (let r = 0; r < MAT_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < D_VIS; c++) {
      row.push(rng() * 2 - 1);
    }
    values.push(row);
  }
  values[CAT_ROW] = CAT_FEATURES.map((f) => f.value);

  const rowInfo = addMatrixGrid(scene, matTopLeft, values, MAT_CELL, CAT_ROW);

  // Column headers
  for (let c = 0; c < D_VIS; c++) {
    const x = matTopLeft[0] + c * MAT_CELL;
    const lbl = new Text({ text: `d${c + 1}`, fontSize: 9, color: '#888' });
    lbl.moveTo(t([x, 0, matTopLeft[2] + 0.2]));
    scene.addFixedOrientationMobjects(lbl);
    scene.add(lbl);
  }
  const ellRight = new Text({ text: `⋯  ${D_MODEL}`, fontSize: 9, color: '#888' });
  ellRight.moveTo(t([matRightX + 0.1, 0, matTopLeft[2] + 0.2]));
  scene.addFixedOrientationMobjects(ellRight);
  scene.add(ellRight);

  // Row labels (words) — dim except 猫 which is highlighted
  const ROW_LABELS = [
    'the', 'of', '中国', '男人',
    '猫',   // CAT_ROW = 4
    '狗', '国王', '女王', '快乐', '…', '…', '…',
  ];
  rowInfo.forEach((r, i) => {
    const word = ROW_LABELS[i];
    const isCat = i === CAT_ROW;
    const isEllipsis = word === '…';
    const lbl = new Text({
      text: word,
      fontSize: 10,
      color: isCat ? '#B98A0E' : isEllipsis ? '#aaa' : '#666',
    });
    lbl.moveTo(t([matTopLeft[0] - 0.55, 0, r.rowCenter[2]]));
    scene.addFixedOrientationMobjects(lbl);
    scene.add(lbl);
  });

  // Shape + params below matrix
  const matBotZ = matTopLeft[2] - (MAT_ROWS - 1) * MAT_CELL - MAT_CELL / 2;
  const factsZ = matBotZ - 0.35;

  const shape = new Text({
    text: `[ ${VOCAB_SIZE.toLocaleString()} × ${D_MODEL} ]`,
    fontSize: 13, color: '#2a2a2a',
  });
  shape.moveTo(t([matCenterX, 0, factsZ]));
  scene.addFixedOrientationMobjects(shape);
  scene.add(shape);

  const paramCount = VOCAB_SIZE * D_MODEL;
  const param = new Text({
    text: `≈ ${(paramCount / 1e6).toFixed(1)}M 可训练参数`,
    fontSize: 12, color: '#B98A0E',
  });
  param.moveTo(t([matCenterX, 0, factsZ - 0.4]));
  scene.addFixedOrientationMobjects(param);
  scene.add(param);

  // ═══════════════════════════════════════════════════
  // BOTTOM: the payoff — what training does to these vectors
  // ═══════════════════════════════════════════════════
  const noteZ = -3.3;
  const note1 = new Text({
    text: trained
      ? '训练后：近义词的行 → 向量相似（"猫" 和 "狗" 距离近）'
      : '训练前：E 完全随机 — "猫" 和 "桌子" 的距离没有任何意义',
    fontSize: 12, color: accent,
  });
  note1.moveTo(t([0, 0, noteZ]));
  scene.addFixedOrientationMobjects(note1);
  scene.add(note1);

  const note2 = new Text({
    text: trained
      ? '每一维代表什么？没有人预先定义，反向传播自己"学"出来'
      : '↑ 用顶部按钮切换"训练前 / 训练后"，看 38M 参数从随机变成有意义',
    fontSize: 11, color: '#666',
  });
  note2.moveTo(t([0, 0, noteZ - 0.4]));
  scene.addFixedOrientationMobjects(note2);
  scene.add(note2);

  scene.render();
  return trained
    ? '第3步：每个 token 在网络里都是一个 768 维向量 — 它的"语义特征卡"。把 5 万张卡堆起来 = 嵌入矩阵 E ≈ 38.4M 可训练参数。'
    : '第3步（训练前）：嵌入矩阵 E 完全随机，每一维都是无意义的浮点数。训练把这些数字"拧"成有结构的语义空间。';
}
