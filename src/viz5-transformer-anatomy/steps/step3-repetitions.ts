import { Box3D, Line3D, Sphere, Text, type ThreeDScene } from 'manim-web';
import {
  ATT_HEIGHT,
  ATT_TOP_Z,
  FF_HEIGHT,
  FF_TOP_Z,
  LAYER_DEPTH_STEP,
  NUM_GHOST_LAYERS,
  NUM_SPACING,
  START_X,
  TOKEN_COUNT,
  TOKEN_SPACING,
  VEC_DIM,
} from '../constants';
import { addArcLine, addBracketOutline, addVectorColumn } from '../primitives';
import { type V3, genVec, seededRandom, t } from '../utils';

// ─── Step 3: Many repetitions — the block stack recedes into depth (× 96 layers) ───

const ARC_COLORS = ['#CCCC44', '#AACC33', '#DDAA22', '#88BB55', '#EEBB44'];
const GHOST_NN_SIZES = [3, 5, 3];
const GHOST_NN_SPREAD_Y = 0.55;

function drawGhostBoxes(
  scene: ThreeDScene,
  blockWidth: number,
  yOff: number,
  wireFade: number,
) {
  const attCenterZ = ATT_TOP_Z - ATT_HEIGHT / 2;
  const ffCenterZ = FF_TOP_Z - FF_HEIGHT / 2;

  scene.add(new Box3D({
    width: blockWidth, height: ATT_HEIGHT, depth: 2.0,
    center: t([0, yOff, attCenterZ]),
    color: '#6688aa', opacity: wireFade, wireframe: true,
  }));
  scene.add(new Box3D({
    width: blockWidth, height: FF_HEIGHT, depth: 2.0,
    center: t([0, yOff, ffCenterZ]),
    color: '#aa66aa', opacity: wireFade, wireframe: true,
  }));
}

function drawGhostAttention(
  scene: ThreeDScene,
  layer: number,
  yOff: number,
  isDetailed: boolean,
  isFirstGhost: boolean,
) {
  const vecTopZ = ATT_TOP_Z - 0.5;
  const vecColHeight = VEC_DIM * NUM_SPACING;

  // Vector brackets: detailed on first + last ghost, sparse in between
  if (isDetailed) {
    for (let i = 0; i < TOKEN_COUNT; i++) {
      addBracketOutline(
        scene,
        START_X + i * TOKEN_SPACING,
        vecTopZ,
        vecColHeight,
        yOff,
        isFirstGhost ? '#aaa' : '#999',
        isFirstGhost ? 0.4 : 0.45,
      );
    }
    if (isFirstGhost) {
      addVectorColumn(scene, START_X, vecTopZ, genVec(200 + layer * 97), '#cfd8e2', '#7799bb', yOff);
    }
  } else {
    for (let i = 0; i < TOKEN_COUNT; i += 3) {
      addBracketOutline(
        scene,
        START_X + i * TOKEN_SPACING,
        vecTopZ,
        vecColHeight,
        yOff,
        '#888',
        0.25,
      );
    }
  }

  // Attention arcs
  const isLastLayer = layer === NUM_GHOST_LAYERS;
  const arcRng = seededRandom(777 + layer * 131);
  const arcStep = isLastLayer ? 2 : 4;
  const arcOp = isLastLayer ? 0.4 : Math.max(0.15, 0.35 - layer * 0.08);

  for (let i = 0; i < TOKEN_COUNT; i += arcStep) {
    let j = Math.floor(arcRng() * TOKEN_COUNT);
    if (j === i) j = (j + 1) % TOKEN_COUNT;
    const color = ARC_COLORS[Math.floor(arcRng() * ARC_COLORS.length)];
    addArcLine(
      scene,
      START_X + i * TOKEN_SPACING,
      START_X + j * TOKEN_SPACING,
      ATT_TOP_Z + 0.3,
      color,
      arcOp,
      yOff,
    );
  }
  for (let i = 0; i < TOKEN_COUNT; i += arcStep) {
    scene.add(new Sphere({
      center: t([START_X + i * TOKEN_SPACING, yOff, ATT_TOP_Z + 0.3]),
      radius: 0.06, color: '#58C4DD', opacity: arcOp + 0.1,
    }));
  }
}

function drawGhostFeedforward(
  scene: ThreeDScene,
  layer: number,
  yOff: number,
  isDetailed: boolean,
) {
  const sliceHeight = FF_HEIGHT - 0.8;
  const nnZ = [FF_TOP_Z - 0.4, FF_TOP_Z - 0.4 - sliceHeight / 2, FF_TOP_Z - 0.4 - sliceHeight];

  if (!isDetailed) {
    // Just dotted hints along the layers
    for (let ti = 0; ti < TOKEN_COUNT; ti += 4) {
      const cx = START_X + ti * TOKEN_SPACING;
      for (let l = 0; l < 3; l++) {
        scene.add(new Sphere({ center: t([cx, yOff, nnZ[l]]), radius: 0.04, color: '#88AACC', opacity: 0.55 }));
      }
    }
    return;
  }

  const isLastLayer = layer === NUM_GHOST_LAYERS;
  const tokenStep = isLastLayer ? 2 : 3;

  for (let ti = 0; ti < TOKEN_COUNT; ti += tokenStep) {
    const cx = START_X + ti * TOKEN_SPACING;
    const rng = seededRandom(8000 + layer * 200 + ti * 37);
    const allNodes: V3[][] = [];

    for (let l = 0; l < 3; l++) {
      const n = GHOST_NN_SIZES[l];
      const nodes: V3[] = [];
      for (let ni = 0; ni < n; ni++) {
        const dy = -GHOST_NN_SPREAD_Y / 2 + (ni / Math.max(n - 1, 1)) * GHOST_NN_SPREAD_Y;
        const pos: V3 = [
          cx + (rng() - 0.5) * 0.1,
          yOff + dy,
          nnZ[l] + (rng() - 0.5) * 0.15,
        ];
        nodes.push(pos);
        scene.add(new Sphere({ center: t(pos), radius: 0.04, color: '#88AACC', opacity: 0.8 }));
      }
      allNodes.push(nodes);
    }

    // Sparse single-connection-per-source edges
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
}

function drawGhostLabels(scene: ThreeDScene, yOff: number) {
  const attL = new Text({ text: 'Attention', fontSize: 16, color: '#58C4DD' });
  attL.moveTo(t([0, yOff + 1.3, ATT_TOP_Z + 0.3]));
  scene.addFixedOrientationMobjects(attL);
  scene.add(attL);

  const ffL = new Text({ text: 'Feedforward', fontSize: 16, color: '#C77DDD' });
  ffL.moveTo(t([0, yOff + 1.3, FF_TOP_Z + 0.3]));
  scene.addFixedOrientationMobjects(ffL);
  scene.add(ffL);
}

function drawRepetitionsCaption(scene: ThreeDScene, blockWidth: number) {
  const dotsY = (NUM_GHOST_LAYERS + 1) * LAYER_DEPTH_STEP;
  const midZ = (ATT_TOP_Z + FF_TOP_Z - FF_HEIGHT) / 2;

  for (let d = 0; d < 3; d++) {
    scene.add(new Sphere({
      center: t([0, dotsY + d * 1.2, midZ]),
      radius: 0.2, color: '#a0b0c0', opacity: 0.6 - d * 0.12,
    }));
  }

  const rep = new Text({ text: '× 96 层', fontSize: 28, color: '#dddddd' });
  rep.moveTo(t([blockWidth / 2 + 2, dotsY, midZ + 1.5]));
  scene.addFixedOrientationMobjects(rep);
  scene.add(rep);

  const sub = new Text({ text: 'Many repetitions', fontSize: 18, color: '#aaaaaa' });
  sub.moveTo(t([blockWidth / 2 + 2, dotsY, midZ + 0.7]));
  scene.addFixedOrientationMobjects(sub);
  scene.add(sub);
}

export async function step3Repetitions(scene: ThreeDScene): Promise<string> {
  const blockWidth = (TOKEN_COUNT - 1) * TOKEN_SPACING + 2.5;

  for (let layer = 1; layer <= NUM_GHOST_LAYERS; layer++) {
    const yOff = layer * LAYER_DEPTH_STEP;
    const wireFade = Math.max(0.12, 0.5 - layer * 0.1);
    const isLastLayer = layer === NUM_GHOST_LAYERS;
    const isFirstGhost = layer === 1;
    const isDetailed = isLastLayer || isFirstGhost;

    drawGhostBoxes(scene, blockWidth, yOff, wireFade);
    drawGhostAttention(scene, layer, yOff, isDetailed, isFirstGhost);
    drawGhostFeedforward(scene, layer, yOff, isDetailed);
    if (isDetailed) drawGhostLabels(scene, yOff);

    // Yield per layer so the main thread stays responsive
    scene.render();
    await new Promise(r => setTimeout(r, 0));
  }

  drawRepetitionsCaption(scene, blockWidth);

  scene.render();
  return '第4步：Attention + Feedforward 结构重复 96 层（GPT-4 级别），每层都在微调向量的含义';
}
