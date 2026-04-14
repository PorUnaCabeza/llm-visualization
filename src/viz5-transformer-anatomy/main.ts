import {
  ThreeDScene,
  Box3D,
  Sphere,
  Line3D,
  Arrow3D,
  Text,
  FadeIn,
  Create,
} from 'manim-web';

type V3 = [number, number, number];

function t(p: V3): V3 {
  return [p[0], p[2], -p[1]];
}

const TOKENS = ['我', '饿', '了', '，', '想', '吃', '一', '碗', '热', '腾腾', '的', '___'];
const TOKEN_COLORS = [
  '#58C4DD', '#58C4DD', '#58C4DD', '#666666',
  '#83C167', '#83C167', '#83C167', '#83C167',
  '#83C167', '#83C167', '#83C167', '#F4D03F',
];

const OUTPUT_PROBS = [
  { word: '面', prob: 0.32 },
  { word: '粥', prob: 0.21 },
  { word: '饺子', prob: 0.16 },
  { word: '汤', prob: 0.13 },
  { word: '米饭', prob: 0.10 },
  { word: '拉面', prob: 0.08 },
];

const VEC_DIM = 9;
const TOKEN_SPACING = 1.4;
const TOKEN_COUNT = TOKENS.length;
const START_X = -((TOKEN_COUNT - 1) * TOKEN_SPACING) / 2;
const NUM_SPACING = 0.42;
const VEC_HEIGHT = VEC_DIM * NUM_SPACING;

const EMBED_TOP_Z = 1.5;
const BLOCK_GAP = 1.2;
const ATT_TOP_Z = EMBED_TOP_Z - VEC_HEIGHT - BLOCK_GAP;
const ATT_HEIGHT = VEC_HEIGHT + 1.6;
const FF_TOP_Z = ATT_TOP_Z - ATT_HEIGHT - BLOCK_GAP;
const FF_HEIGHT = ATT_HEIGHT;
const OUTPUT_Z = FF_TOP_Z - FF_HEIGHT - 1.5;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function genVec(seed: number): number[] {
  const rng = seededRandom(seed);
  return Array.from({ length: VEC_DIM }, () => +(rng() * 18 - 9).toFixed(1));
}

function fmtNum(v: number): string {
  const s = v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1);
  return s;
}

const container = document.getElementById('container')!;
const stepInfoEl = document.getElementById('stepInfo')!;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;

const scene = new ThreeDScene(container, {
  width: container.clientWidth || window.innerWidth,
  height: container.clientHeight || window.innerHeight,
  backgroundColor: '#0a0a0a',
  phi: 90 * (Math.PI / 180),
  theta: -90,
  distance: 24,
  fov: 36,
  enableOrbitControls: true,
  orbitControlsOptions: {
    enableDamping: true,
    dampingFactor: 0.08,
  },
});

window.addEventListener('resize', () => {
  scene.resize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
});

const rawControls = scene.orbitControls!.getControls();
rawControls.screenSpacePanning = true;
rawControls.panSpeed = 1.2;
rawControls.listenToKeyEvents(window);
rawControls.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };
rawControls.keyPanSpeed = 15;

let currentStep = -1;
let isAnimating = false;

function addVectorColumn(
  x: number,
  topZ: number,
  values: number[],
  textColor: string,
  bracketColor: string,
  yOffset = 0,
) {
  const colHeight = values.length * NUM_SPACING;

  // Bracket lines (left side [ )
  const bx = x - 0.35;
  const bTop = topZ + 0.15;
  const bBot = topZ - colHeight - 0.15;
  // Top horizontal
  scene.add(new Line3D({ start: t([bx, yOffset, bTop]), end: t([bx + 0.12, yOffset, bTop]), color: bracketColor, opacity: 0.6 }));
  // Bottom horizontal
  scene.add(new Line3D({ start: t([bx, yOffset, bBot]), end: t([bx + 0.12, yOffset, bBot]), color: bracketColor, opacity: 0.6 }));
  // Vertical
  scene.add(new Line3D({ start: t([bx, yOffset, bTop]), end: t([bx, yOffset, bBot]), color: bracketColor, opacity: 0.6 }));

  // Bracket lines (right side ] )
  const rx = x + 0.35;
  scene.add(new Line3D({ start: t([rx, yOffset, bTop]), end: t([rx - 0.12, yOffset, bTop]), color: bracketColor, opacity: 0.6 }));
  scene.add(new Line3D({ start: t([rx, yOffset, bBot]), end: t([rx - 0.12, yOffset, bBot]), color: bracketColor, opacity: 0.6 }));
  scene.add(new Line3D({ start: t([rx, yOffset, bTop]), end: t([rx, yOffset, bBot]), color: bracketColor, opacity: 0.6 }));

  // Number labels
  values.forEach((v, d) => {
    const z = topZ - d * NUM_SPACING;
    const numLabel = new Text({
      text: fmtNum(v),
      fontSize: 12,
      color: textColor,
    });
    numLabel.moveTo(t([x, yOffset, z]));
    scene.addFixedOrientationMobjects(numLabel);
    scene.add(numLabel);
  });

  // "..." dots
  const dotsLabel = new Text({ text: '⋮', fontSize: 10, color: '#555' });
  dotsLabel.moveTo(t([x, yOffset, topZ - values.length * NUM_SPACING + 0.05]));
  scene.addFixedOrientationMobjects(dotsLabel);
  scene.add(dotsLabel);
}

function addGlassBox(
  centerX: number,
  centerZ: number,
  width: number,
  height: number,
  depth: number,
  color: string,
  yOffset = 0,
) {
  // Wireframe only — no solid fill so interior content is fully visible
  const wire = new Box3D({
    width,
    height,
    depth,
    center: t([centerX, yOffset, centerZ]),
    color,
    opacity: 0.35,
    wireframe: true,
  });
  scene.add(wire);
}

function addArcLine(x1: number, x2: number, topZ: number, color: string, opacity: number, yOffset = 0) {
  const span = Math.abs(x2 - x1);
  const arcHeight = 0.5 + span * 0.08;
  const segments = 6;

  for (let s = 0; s < segments; s++) {
    const t1 = s / segments;
    const t2 = (s + 1) / segments;

    const px1 = x1 + (x2 - x1) * t1;
    const pz1 = topZ + arcHeight * Math.sin(t1 * Math.PI);
    const px2 = x1 + (x2 - x1) * t2;
    const pz2 = topZ + arcHeight * Math.sin(t2 * Math.PI);

    scene.add(new Line3D({
      start: t([px1, yOffset, pz1]),
      end: t([px2, yOffset, pz2]),
      color,
      opacity,
    }));
  }
}

// ─── Step 0: Tokens ───

async function step0_tokens() {
  scene.clear();

  TOKENS.forEach((tok, i) => {
    const x = START_X + i * TOKEN_SPACING;
    const label = new Text({ text: tok, fontSize: 16, color: TOKEN_COLORS[i] });
    label.moveTo(t([x, 0, 4]));
    scene.addFixedOrientationMobjects(label);
    scene.add(label);
  });

  scene.render();
  stepInfoEl.textContent = '第1步：输入文本被拆分成 Token（词元）';
}

// ─── Step 1: Attention block (with Embedding inside) ───
// Tokens → arrows → vectors appear inside the Attention glass box

async function step1_attention() {
  const blockWidth = (TOKEN_COUNT - 1) * TOKEN_SPACING + 2.5;
  const blockCenterZ = ATT_TOP_Z - ATT_HEIGHT / 2;

  // Wireframe-only box so interior vectors are fully visible
  scene.add(new Box3D({
    width: blockWidth, height: ATT_HEIGHT, depth: 2.0,
    center: t([0, 0, blockCenterZ]),
    color: '#889aaa', opacity: 0.35, wireframe: true,
  }));

  // "Attention" label on top
  const attLabel = new Text({ text: 'Attention', fontSize: 24, color: '#8BBBDD' });
  attLabel.moveTo(t([0, 1.5, ATT_TOP_Z + 0.5]));
  scene.addFixedOrientationMobjects(attLabel);
  scene.add(attLabel);

  // Arrows from tokens down into the box + vector columns inside
  const vecTopZ = ATT_TOP_Z - 0.5;
  for (let i = 0; i < TOKEN_COUNT; i++) {
    const x = START_X + i * TOKEN_SPACING;

    // Arrow: token → into the box
    scene.add(new Arrow3D({
      start: t([x, 0, 3.6]),
      end: t([x, 0, ATT_TOP_Z + 0.15]),
      color: '#666666', opacity: 0.5,
      shaftRadius: 0.02, tipLength: 0.18, tipRadius: 0.07,
    }));

    // Vector column inside the box (Embedding result)
    const vec = genVec(200 + i * 31);
    addVectorColumn(x, vecTopZ, vec, '#cccccc', '#aaaaaa');
  }

  // Highlight bracket on token 4 ("山")
  const highlightIdx = 4;
  const hx = START_X + highlightIdx * TOKEN_SPACING;
  const hTopZ = vecTopZ + 0.18;
  const hBotZ = vecTopZ - VEC_DIM * NUM_SPACING - 0.18;
  // Left bracket
  scene.add(new Line3D({ start: t([hx - 0.38, 0, hTopZ]), end: t([hx - 0.38, 0, hBotZ]), color: '#58C4DD', opacity: 0.9 }));
  scene.add(new Line3D({ start: t([hx - 0.38, 0, hTopZ]), end: t([hx - 0.25, 0, hTopZ]), color: '#58C4DD', opacity: 0.9 }));
  scene.add(new Line3D({ start: t([hx - 0.38, 0, hBotZ]), end: t([hx - 0.25, 0, hBotZ]), color: '#58C4DD', opacity: 0.9 }));
  // Right bracket
  scene.add(new Line3D({ start: t([hx + 0.38, 0, hTopZ]), end: t([hx + 0.38, 0, hBotZ]), color: '#58C4DD', opacity: 0.9 }));
  scene.add(new Line3D({ start: t([hx + 0.38, 0, hTopZ]), end: t([hx + 0.25, 0, hTopZ]), color: '#58C4DD', opacity: 0.9 }));
  scene.add(new Line3D({ start: t([hx + 0.38, 0, hBotZ]), end: t([hx + 0.25, 0, hBotZ]), color: '#58C4DD', opacity: 0.9 }));

  // Faint vertical guides
  for (let i = 0; i < TOKEN_COUNT; i++) {
    const x = START_X + i * TOKEN_SPACING;
    scene.add(new Line3D({
      start: t([x, 0, ATT_TOP_Z + 0.3]),
      end: t([x, 0, ATT_TOP_Z - ATT_HEIGHT]),
      color: '#555555', opacity: 0.15,
    }));
  }

  // Arc attention lines on TOP of the box (every token, 1-2 arcs)
  const arcRng = seededRandom(777);
  const arcColors = ['#CCCC44', '#AACC33', '#DDAA22', '#88BB55', '#EEBB44'];
  for (let i = 0; i < TOKEN_COUNT; i++) {
    const numArcs = 1 + Math.floor(arcRng() * 2);
    for (let a = 0; a < numArcs; a++) {
      let j = Math.floor(arcRng() * TOKEN_COUNT);
      if (j === i) j = (j + 1) % TOKEN_COUNT;
      const xi = START_X + i * TOKEN_SPACING;
      const xj = START_X + j * TOKEN_SPACING;
      const color = arcColors[Math.floor(arcRng() * arcColors.length)];
      const opacity = 0.4 + arcRng() * 0.5;
      addArcLine(xi, xj, ATT_TOP_Z + 0.3, color, opacity);
    }
  }

  // White dots at arc entry points
  for (let i = 0; i < TOKEN_COUNT; i++) {
    const x = START_X + i * TOKEN_SPACING;
    scene.add(new Sphere({
      center: t([x, 0, ATT_TOP_Z + 0.3]),
      radius: 0.09, color: '#ffffff', opacity: 0.9,
    }));
  }

  scene.render();
  stepInfoEl.textContent =
    '第2步：每个 Token 变成向量（Embedding），进入 Attention 盒子。弧线表示 token 之间互相"交流"，更新含义';
}

// ─── Step 2: Feedforward block ───
// Each token gets its own independent neural network slice:
// input vector → neuron layers → output vector

async function step2_feedforward() {
  const blockWidth = (TOKEN_COUNT - 1) * TOKEN_SPACING + 2.5;
  const ffCenterZ = FF_TOP_Z - FF_HEIGHT / 2;

  // Wireframe box
  scene.add(new Box3D({
    width: blockWidth, height: FF_HEIGHT, depth: 2.0,
    center: t([0, 0, ffCenterZ]),
    color: '#997799', opacity: 0.3, wireframe: true,
  }));

  // "Feedforward" label
  const ffLabel = new Text({ text: 'Feedforward', fontSize: 24, color: '#AA88CC' });
  ffLabel.moveTo(t([0, 1.5, FF_TOP_Z + 0.5]));
  scene.addFixedOrientationMobjects(ffLabel);
  scene.add(ffLabel);

  // Per-token neural network slices — full complexity
  const nnLayerSizes = [5, 7, 5];
  const sliceHeight = FF_HEIGHT - 0.8;
  const nnLayerZ = [
    FF_TOP_Z - 0.4,
    FF_TOP_Z - 0.4 - sliceHeight / 2,
    FF_TOP_Z - 0.4 - sliceHeight,
  ];
  const sliceSpreadY = 0.7;

  for (let ti = 0; ti < TOKEN_COUNT; ti++) {
    const cx = START_X + ti * TOKEN_SPACING;
    const rng = seededRandom(5000 + ti * 137);
    const nnNodes: V3[][] = [];

    for (let l = 0; l < nnLayerSizes.length; l++) {
      const n = nnLayerSizes[l];
      const nodes: V3[] = [];
      for (let ni = 0; ni < n; ni++) {
        const y = -sliceSpreadY / 2 + (ni / (n - 1)) * sliceSpreadY;
        const z = nnLayerZ[l] + (rng() - 0.5) * 0.2;
        const x = cx + (rng() - 0.5) * 0.15;
        const pos: V3 = [x, y, z];
        nodes.push(pos);
        scene.add(new Sphere({
          center: t(pos),
          radius: l === 1 ? 0.05 : 0.06,
          color: '#ffffff',
          opacity: l === 1 ? 0.55 : 0.8,
        }));
      }
      nnNodes.push(nodes);
    }

    for (let l = 0; l < nnLayerSizes.length - 1; l++) {
      const src = nnNodes[l];
      const dst = nnNodes[l + 1];
      for (let si = 0; si < src.length; si++) {
        const nConn = 2 + Math.floor(rng() * (dst.length - 1));
        const targets = new Set<number>();
        while (targets.size < nConn) targets.add(Math.floor(rng() * dst.length));
        for (const di of targets) {
          const w = rng() * 2 - 1;
          scene.add(new Line3D({
            start: t(src[si]), end: t(dst[di]),
            color: w > 0 ? '#58C4DD' : '#FC6255',
            opacity: 0.1 + Math.abs(w) * 0.3,
          }));
        }
      }
    }
  }

  // Output vector columns below the box
  const outTopZ = FF_TOP_Z - FF_HEIGHT - 0.3;
  for (let i = 0; i < TOKEN_COUNT; i++) {
    const x = START_X + i * TOKEN_SPACING;
    const vec = genVec(700 + i * 53);
    addVectorColumn(x, outTopZ, vec, '#bbaacc', '#776688');
  }

  scene.render();
  stepInfoEl.textContent =
    '第3步：Feedforward — 每个向量独立通过同一个神经网络（白球=神经元，蓝线=正权重，红线=负权重），输出新的向量';
}

// ─── Step 3: Many Repetitions ───

const LAYER_DEPTH_STEP = 3.2;
const NUM_GHOST_LAYERS = 4;

// Lightweight bracket outlines only (no Text objects)
function addBracketOutline(
  x: number, topZ: number, height: number, yOff: number,
  color: string, opacity: number,
) {
  const bx = x - 0.35;
  const rx = x + 0.35;
  const bTop = topZ + 0.15;
  const bBot = topZ - height - 0.15;
  // Left [
  scene.add(new Line3D({ start: t([bx, yOff, bTop]), end: t([bx, yOff, bBot]), color, opacity }));
  scene.add(new Line3D({ start: t([bx, yOff, bTop]), end: t([bx + 0.1, yOff, bTop]), color, opacity }));
  scene.add(new Line3D({ start: t([bx, yOff, bBot]), end: t([bx + 0.1, yOff, bBot]), color, opacity }));
  // Right ]
  scene.add(new Line3D({ start: t([rx, yOff, bTop]), end: t([rx, yOff, bBot]), color, opacity }));
  scene.add(new Line3D({ start: t([rx, yOff, bTop]), end: t([rx - 0.1, yOff, bTop]), color, opacity }));
  scene.add(new Line3D({ start: t([rx, yOff, bBot]), end: t([rx - 0.1, yOff, bBot]), color, opacity }));
}

async function step3_repetitions() {
  const blockWidth = (TOKEN_COUNT - 1) * TOKEN_SPACING + 2.5;
  const attCenterZ = ATT_TOP_Z - ATT_HEIGHT / 2;
  const ffCenterZ = FF_TOP_Z - FF_HEIGHT / 2;
  const vecColHeight = VEC_DIM * NUM_SPACING;

  const batchSize = 1;
  let layersDone = 0;

  for (let layer = 1; layer <= NUM_GHOST_LAYERS; layer++) {
    const yOff = layer * LAYER_DEPTH_STEP;
    const wireFade = Math.max(0.12, 0.5 - layer * 0.1);

    scene.add(new Box3D({
      width: blockWidth, height: ATT_HEIGHT, depth: 2.0,
      center: t([0, yOff, attCenterZ]),
      color: '#889aaa', opacity: wireFade, wireframe: true,
    }));

    scene.add(new Box3D({
      width: blockWidth, height: FF_HEIGHT, depth: 2.0,
      center: t([0, yOff, ffCenterZ]),
      color: '#997799', opacity: wireFade, wireframe: true,
    }));

    const isLastLayer = layer === NUM_GHOST_LAYERS;
    const isFirstGhost = layer === 1;

    // Attention box content: only first and last ghost layers get bracket outlines;
    // first ghost layer gets one full vector column as a hint of detail.
    const vecTopZ = ATT_TOP_Z - 0.5;
    if (isLastLayer || isFirstGhost) {
      for (let i = 0; i < TOKEN_COUNT; i++) {
        addBracketOutline(START_X + i * TOKEN_SPACING, vecTopZ, vecColHeight, yOff,
          isLastLayer ? '#aaa' : '#999', isLastLayer ? 0.4 : 0.3);
      }
      if (isFirstGhost) {
        const vec = genVec(200 + 0 * 31 + layer * 97);
        addVectorColumn(START_X, vecTopZ, vec, '#bbbbbb', '#999999', yOff);
      }
    } else {
      for (let i = 0; i < TOKEN_COUNT; i += 3) {
        addBracketOutline(START_X + i * TOKEN_SPACING, vecTopZ, vecColHeight, yOff, '#888', 0.2);
      }
    }

    // Attention arcs — sparse for all ghost layers
    const arcRng = seededRandom(777 + layer * 131);
    const arcColors = ['#CCCC44', '#AACC33', '#DDAA22', '#88BB55', '#EEBB44'];
    const arcStep = isLastLayer ? 2 : 4;
    const arcOp = isLastLayer ? 0.4 : Math.max(0.15, 0.35 - layer * 0.08);
    for (let i = 0; i < TOKEN_COUNT; i += arcStep) {
      let j = Math.floor(arcRng() * TOKEN_COUNT);
      if (j === i) j = (j + 1) % TOKEN_COUNT;
      const xi = START_X + i * TOKEN_SPACING;
      const xj = START_X + j * TOKEN_SPACING;
      const color = arcColors[Math.floor(arcRng() * arcColors.length)];
      addArcLine(xi, xj, ATT_TOP_Z + 0.3, color, arcOp, yOff);
    }
    for (let i = 0; i < TOKEN_COUNT; i += arcStep) {
      const x = START_X + i * TOKEN_SPACING;
      scene.add(new Sphere({
        center: t([x, yOff, ATT_TOP_Z + 0.3]),
        radius: 0.06, color: '#ffffff', opacity: arcOp + 0.1,
      }));
    }

    // Feedforward NN slices — lightweight for all ghost layers
    const sliceHeight = FF_HEIGHT - 0.8;
    const nnZ = [FF_TOP_Z - 0.4, FF_TOP_Z - 0.4 - sliceHeight / 2, FF_TOP_Z - 0.4 - sliceHeight];

    if (isLastLayer || isFirstGhost) {
      const sizes = [3, 5, 3];
      const spreadY = 0.55;
      const tokenStep = isLastLayer ? 2 : 3;
      for (let ti = 0; ti < TOKEN_COUNT; ti += tokenStep) {
        const cx = START_X + ti * TOKEN_SPACING;
        const rng = seededRandom(8000 + layer * 200 + ti * 37);
        const allNodes: V3[][] = [];

        for (let l = 0; l < 3; l++) {
          const n = sizes[l];
          const nodes: V3[] = [];
          for (let ni = 0; ni < n; ni++) {
            const dy = -spreadY / 2 + (ni / Math.max(n - 1, 1)) * spreadY;
            const pos: V3 = [cx + (rng() - 0.5) * 0.1, yOff + dy, nnZ[l] + (rng() - 0.5) * 0.15];
            nodes.push(pos);
            scene.add(new Sphere({ center: t(pos), radius: 0.04, color: '#fff', opacity: 0.55 }));
          }
          allNodes.push(nodes);
        }

        for (let l = 0; l < 2; l++) {
          for (let si = 0; si < allNodes[l].length; si++) {
            const di = Math.floor(rng() * allNodes[l + 1].length);
            const w = rng() * 2 - 1;
            scene.add(new Line3D({
              start: t(allNodes[l][si]), end: t(allNodes[l + 1][di]),
              color: w > 0 ? '#58C4DD' : '#FC6255',
              opacity: 0.1 + Math.abs(w) * 0.2,
            }));
          }
        }
      }
    } else {
      for (let ti = 0; ti < TOKEN_COUNT; ti += 4) {
        const cx = START_X + ti * TOKEN_SPACING;
        for (let l = 0; l < 3; l++) {
          scene.add(new Sphere({ center: t([cx, yOff, nnZ[l]]), radius: 0.04, color: '#fff', opacity: 0.25 }));
        }
      }
    }

    // Labels — only on first and last ghost layers
    if (isLastLayer || isFirstGhost) {
      const attL = new Text({ text: 'Attention', fontSize: 12, color: '#8BBBDD' });
      attL.moveTo(t([0, yOff + 1.3, ATT_TOP_Z + 0.3]));
      scene.addFixedOrientationMobjects(attL);
      scene.add(attL);

      const ffL = new Text({ text: 'Feedforward', fontSize: 12, color: '#AA88CC' });
      ffL.moveTo(t([0, yOff + 1.3, FF_TOP_Z + 0.3]));
      scene.addFixedOrientationMobjects(ffL);
      scene.add(ffL);
    }

    // Yield to the browser after each layer to avoid blocking the main thread
    layersDone++;
    if (layersDone % batchSize === 0) {
      scene.render();
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // "..." dots
  const dotsY = (NUM_GHOST_LAYERS + 1) * LAYER_DEPTH_STEP;
  const midZ = (ATT_TOP_Z + FF_TOP_Z - FF_HEIGHT) / 2;
  for (let d = 0; d < 3; d++) {
    scene.add(new Sphere({
      center: t([0, dotsY + d * 1.2, midZ]),
      radius: 0.2, color: '#ffffff', opacity: 0.7 - d * 0.15,
    }));
  }

  // "× 96 层" label
  const repLabel = new Text({ text: '× 96 层', fontSize: 20, color: '#cccccc' });
  repLabel.moveTo(t([blockWidth / 2 + 2, dotsY, midZ + 1.5]));
  scene.addFixedOrientationMobjects(repLabel);
  scene.add(repLabel);

  const repSub = new Text({ text: 'Many repetitions', fontSize: 14, color: '#888888' });
  repSub.moveTo(t([blockWidth / 2 + 2, dotsY, midZ + 0.7]));
  scene.addFixedOrientationMobjects(repSub);
  scene.add(repSub);

  scene.render();
  stepInfoEl.textContent =
    '第4步：Attention + Feedforward 结构重复 96 层（GPT-4 级别），每层都在微调向量的含义';
}

// ─── Step 4: Vector journey — how "???" gets refined through layers ───

// Journey waypoints: connected chain, each segment = delta from the previous tip
const JOURNEY_WAYPOINTS: { delta: V3; color: string; label: string; layerText: string }[] = [
  { delta: [2.5, 0.3, 1.0],  color: '#58C4DD', label: '___（未知）',       layerText: 'Embedding' },
  { delta: [0.8, 1.2, 1.5],  color: '#66DDAA', label: '跟「吃」有关',     layerText: '第 1~24 层' },
  { delta: [-0.5, 0.8, 1.2], color: '#CC77DD', label: '热的食物',         layerText: '第 25~48 层' },
  { delta: [-0.8, 0.6, 1.0], color: '#83C167', label: '一碗热腾腾的…',    layerText: '第 49~72 层' },
  { delta: [-0.4, 0.5, 0.8], color: '#F4D03F', label: '→ 面',            layerText: '第 73~96 层' },
];

async function step4_journey() {
  scene.clear();

  const sentence = '我 饿 了 ， 想 吃 一 碗 热 腾腾 的';
  const sentenceLabel = new Text({ text: sentence, fontSize: 14, color: '#888' });
  sentenceLabel.moveTo(t([0, 0, 7.5]));
  scene.addFixedOrientationMobjects(sentenceLabel);
  scene.add(sentenceLabel);

  const qLabel = new Text({ text: '___', fontSize: 20, color: '#F4D03F' });
  qLabel.moveTo(t([0, 0, 6.8]));
  scene.addFixedOrientationMobjects(qLabel);
  scene.add(qLabel);

  const gridSize = 6;
  const gridStep = 1.5;
  for (let i = -gridSize; i <= gridSize; i += gridStep) {
    scene.add(new Line3D({
      start: t([i, -gridSize, 0]), end: t([i, gridSize, 0]),
      color: '#333', opacity: 0.3,
    }));
    scene.add(new Line3D({
      start: t([-gridSize, i, 0]), end: t([gridSize, i, 0]),
      color: '#333', opacity: 0.3,
    }));
  }
  scene.add(new Line3D({ start: t([-gridSize, 0, 0]), end: t([gridSize, 0, 0]), color: '#555', opacity: 0.5 }));
  scene.add(new Line3D({ start: t([0, -gridSize, 0]), end: t([0, gridSize, 0]), color: '#555', opacity: 0.5 }));
  scene.add(new Line3D({ start: t([0, 0, 0]), end: t([0, 0, 6]), color: '#555', opacity: 0.5 }));

  const origin: V3 = [0, 0, 0];
  scene.add(new Sphere({ center: t(origin), radius: 0.12, color: '#ffffff', opacity: 0.8 }));

  // Connected chain of arrows: each segment starts where the previous one ended
  let prevTip: V3 = [0, 0, 0];

  for (let i = 0; i < JOURNEY_WAYPOINTS.length; i++) {
    const { delta, color, label, layerText } = JOURNEY_WAYPOINTS[i];
    const tip: V3 = [prevTip[0] + delta[0], prevTip[1] + delta[1], prevTip[2] + delta[2]];

    const arrow = new Arrow3D({
      start: t(prevTip),
      end: t(tip),
      color,
      shaftRadius: 0.04,
      tipLength: 0.3,
      tipRadius: 0.12,
      opacity: 0.85,
    });
    scene.add(arrow);
    await scene.play(new Create(arrow, { duration: 0.6 }));

    // Waypoint dot
    scene.add(new Sphere({ center: t(tip), radius: 0.1, color, opacity: 0.9 }));

    // Label at the waypoint
    const lbl = new Text({ text: label, fontSize: 13, color });
    lbl.moveTo(t([tip[0] + 0.5, tip[1] + 0.3, tip[2] + 0.3]));
    scene.addFixedOrientationMobjects(lbl);
    scene.add(lbl);

    const layerLbl = new Text({ text: layerText, fontSize: 9, color: '#777' });
    layerLbl.moveTo(t([tip[0] + 0.5, tip[1] + 0.3, tip[2] - 0.2]));
    scene.addFixedOrientationMobjects(layerLbl);
    scene.add(layerLbl);

    scene.render();
    await new Promise(r => setTimeout(r, 800));

    prevTip = tip;
  }

  // Dashed line from origin to final tip showing the net result
  const finalTip = prevTip;
  scene.add(new Arrow3D({
    start: t(origin),
    end: t(finalTip),
    color: '#ffffff',
    shaftRadius: 0.02,
    tipLength: 0.2,
    tipRadius: 0.08,
    opacity: 0.3,
  }));

  scene.render();
  stepInfoEl.textContent =
    '第5步："___" 的向量在每一层被逐步修正 — 从未知，到理解上下文「饿→吃→热腾腾」，最终指向"面"';
}

// ─── Step 5: Output — probability distribution shown on the journey scene ───

async function step5_output() {
  // Show output on the right side of the journey vector space
  const baseX = 4;
  const baseZ = 5;

  // "Unembedding + Softmax" label
  const softLabel = new Text({ text: 'Softmax → 概率分布', fontSize: 14, color: '#F4D03F' });
  softLabel.moveTo(t([baseX + 2, 0, baseZ + 1.5]));
  scene.addFixedOrientationMobjects(softLabel);
  scene.add(softLabel);

  // Arrow from last journey waypoint tip to probability area
  let lastDir: V3 = [0, 0, 0];
  for (const wp of JOURNEY_WAYPOINTS) {
    lastDir = [lastDir[0] + wp.delta[0], lastDir[1] + wp.delta[1], lastDir[2] + wp.delta[2]];
  }
  const arrow = new Arrow3D({
    start: t(lastDir),
    end: t([baseX, 0, baseZ + 0.5]),
    color: '#F4D03F',
    shaftRadius: 0.03,
    tipLength: 0.25,
    tipRadius: 0.1,
    opacity: 0.8,
  });
  scene.add(arrow);
  await scene.play(new Create(arrow, { duration: 0.7 }));

  // Probability bars
  OUTPUT_PROBS.forEach((item, i) => {
    const z = baseZ - i * 0.65;
    const barLen = item.prob * 5;

    const bar = new Box3D({
      width: barLen,
      height: 0.35,
      depth: 0.25,
      center: t([baseX + barLen / 2, 0, z]),
      color: '#58C4DD',
      opacity: 0.5 + item.prob,
    });
    scene.add(bar);

    const wordLabel = new Text({ text: item.word, fontSize: 13, color: '#cccccc' });
    wordLabel.moveTo(t([baseX - 0.7, 0, z]));
    scene.addFixedOrientationMobjects(wordLabel);
    scene.add(wordLabel);

    const pctLabel = new Text({
      text: `${Math.round(item.prob * 100)}%`,
      fontSize: 11,
      color: '#999',
    });
    pctLabel.moveTo(t([baseX + barLen + 0.5, 0, z]));
    scene.addFixedOrientationMobjects(pctLabel);
    scene.add(pctLabel);
  });

  scene.render();
  stepInfoEl.textContent =
    '第6步：最终向量通过 Unembedding + Softmax，输出下一个词的概率分布 — "面" 32%';
}

// ─── Orchestration ───

const steps = [step0_tokens, step1_attention, step2_feedforward, step3_repetitions, step4_journey, step5_output];

async function nextStep() {
  if (isAnimating) return;
  isAnimating = true;
  nextBtn.disabled = true;

  currentStep++;
  if (currentStep >= steps.length) {
    currentStep = steps.length - 1;
    isAnimating = false;
    nextBtn.disabled = true;
    return;
  }

  try {
    await steps[currentStep]();
  } catch (e) {
    console.error(e);
  }

  isAnimating = false;
  nextBtn.disabled = currentStep >= steps.length - 1;
}

async function autoPlay() {
  if (isAnimating) return;
  playBtn.disabled = true;
  currentStep = -1;
  scene.clear();

  for (let i = 0; i < steps.length; i++) {
    await nextStep();
    if (i < steps.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  playBtn.disabled = false;
}

function reset() {
  scene.clear();
  currentStep = -1;
  stepInfoEl.textContent = '';
  nextBtn.disabled = false;
  playBtn.disabled = false;
  isAnimating = false;
  scene.render();
}

playBtn.addEventListener('click', autoPlay);
nextBtn.addEventListener('click', nextStep);
resetBtn.addEventListener('click', reset);

// Manual control only — no auto-play
scene.render();
