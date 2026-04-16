import { Arrow3D, Box3D, Line3D, Sphere, Text, type ThreeDScene } from 'manim-web';
import {
  ATT_HEIGHT,
  ATT_TOP_Z,
  NUM_SPACING,
  START_X,
  TOKEN_COUNT,
  TOKEN_SPACING,
  VEC_DIM,
} from '../constants';
import { addArcLine, addResidualBypass, addVectorColumn } from '../primitives';
import { genVec, seededRandom, t } from '../utils';

// ─── Step 1: Attention block (with Embedding vectors + residual stream + Q/K/V) ───

const ARC_COLORS = ['#CCCC44', '#AACC33', '#DDAA22', '#88BB55', '#EEBB44'];
const RES_COLOR = '#F4D03F';
const Q_COLOR = '#3FCB99';  // Query
const K_COLOR = '#58C4DD';  // Key
const V_COLOR = '#C77DDD';  // Value

const HIGHLIGHT_IDX = 4;  // "想" — highlighted as the example token

// Meaningful attention pattern FROM the highlighted token.
// Lets the arcs tell a story instead of looking random.
const HIGHLIGHT_ATTENTIONS: { to: number; strength: number }[] = [
  { to: 11, strength: 0.9 },  // ___   (the query itself)
  { to: 9,  strength: 0.8 },  // 腾腾  (food descriptor)
  { to: 5,  strength: 0.7 },  // 吃    (action verb)
  { to: 7,  strength: 0.5 },  // 碗    (container)
  { to: 1,  strength: 0.4 },  // 饿    (motivation)
];

export async function step1Attention(scene: ThreeDScene): Promise<string> {
  const blockWidth = (TOKEN_COUNT - 1) * TOKEN_SPACING + 2.5;
  const blockCenterZ = ATT_TOP_Z - ATT_HEIGHT / 2;
  const vecTopZ = ATT_TOP_Z - 0.5;
  const vecBotZ = vecTopZ - VEC_DIM * NUM_SPACING;

  // ─── Glass box + title ───
  scene.add(new Box3D({
    width: blockWidth, height: ATT_HEIGHT, depth: 2.0,
    center: t([0, 0, blockCenterZ]),
    color: '#6688aa', opacity: 0.35, wireframe: true,
  }));

  const title = new Text({ text: 'Attention', fontSize: 32, color: '#58C4DD' });
  title.moveTo(t([0, 1.5, ATT_TOP_Z + 0.5]));
  scene.addFixedOrientationMobjects(title);
  scene.add(title);

  // ─── Token → arrow → embedding vector inside the box ───
  for (let i = 0; i < TOKEN_COUNT; i++) {
    const x = START_X + i * TOKEN_SPACING;

    scene.add(new Arrow3D({
      start: t([x, 0, 2.25]),
      end:   t([x, 0, ATT_TOP_Z + 0.15]),
      color: '#888888', opacity: 0.55,
      shaftRadius: 0.02, tipLength: 0.16, tipRadius: 0.07,
    }));

    addVectorColumn(scene, x, vecTopZ, genVec(200 + i * 31), '#cfd8e2', '#7799bb');
  }

  // ─── Highlight bracket on "想" ───
  const hx = START_X + HIGHLIGHT_IDX * TOKEN_SPACING;
  const hTopZ = vecTopZ + 0.18;
  const hBotZ = vecBotZ - 0.18;
  const hi = (s: [number, number, number], e: [number, number, number]) =>
    scene.add(new Line3D({ start: t(s), end: t(e), color: '#58C4DD', opacity: 0.9 }));
  hi([hx - 0.38, 0, hTopZ], [hx - 0.38, 0, hBotZ]);
  hi([hx - 0.38, 0, hTopZ], [hx - 0.25, 0, hTopZ]);
  hi([hx - 0.38, 0, hBotZ], [hx - 0.25, 0, hBotZ]);
  hi([hx + 0.38, 0, hTopZ], [hx + 0.38, 0, hBotZ]);
  hi([hx + 0.38, 0, hTopZ], [hx + 0.25, 0, hTopZ]);
  hi([hx + 0.38, 0, hBotZ], [hx + 0.25, 0, hBotZ]);

  // ─── Faint vertical guides under each token ───
  for (let i = 0; i < TOKEN_COUNT; i++) {
    const x = START_X + i * TOKEN_SPACING;
    scene.add(new Line3D({
      start: t([x, 0, ATT_TOP_Z + 0.3]),
      end:   t([x, 0, ATT_TOP_Z - ATT_HEIGHT]),
      color: '#888888', opacity: 0.18,
    }));
  }

  // ─── Attention arcs: random background + meaningful highlight pattern ───
  const arcRng = seededRandom(777);
  for (let i = 0; i < TOKEN_COUNT; i++) {
    if (i === HIGHLIGHT_IDX) continue;  // highlighted token gets its own set
    const numArcs = 1 + Math.floor(arcRng() * 2);
    for (let a = 0; a < numArcs; a++) {
      let j = Math.floor(arcRng() * TOKEN_COUNT);
      if (j === i) j = (j + 1) % TOKEN_COUNT;
      const color = ARC_COLORS[Math.floor(arcRng() * ARC_COLORS.length)];
      const opacity = 0.2 + arcRng() * 0.25;  // dimmed so the story pops
      addArcLine(
        scene,
        START_X + i * TOKEN_SPACING,
        START_X + j * TOKEN_SPACING,
        ATT_TOP_Z + 0.3,
        color,
        opacity,
      );
    }
  }

  // Highlighted: "想" attends to food-related context tokens, weights ~ softmax
  for (const { to, strength } of HIGHLIGHT_ATTENTIONS) {
    addArcLine(
      scene,
      hx,
      START_X + to * TOKEN_SPACING,
      ATT_TOP_Z + 0.3,
      RES_COLOR,
      strength,
    );
  }

  // Arc entry dots
  for (let i = 0; i < TOKEN_COUNT; i++) {
    const x = START_X + i * TOKEN_SPACING;
    scene.add(new Sphere({
      center: t([x, 0, ATT_TOP_Z + 0.3]),
      radius: 0.09, color: '#58C4DD', opacity: 0.9,
    }));
  }

  // ─── Residual stream bypass on every token ───
  for (let i = 0; i < TOKEN_COUNT; i++) {
    const x = START_X + i * TOKEN_SPACING;
    const isHighlight = i === HIGHLIGHT_IDX;
    addResidualBypass(
      scene,
      x,
      ATT_TOP_Z + 0.1,
      ATT_TOP_Z - ATT_HEIGHT - 0.1,
      RES_COLOR,
      isHighlight ? 0.9 : 0.22,
      0,
      isHighlight,
    );
  }

  // Residual stream side label (to the right of the last token)
  const sideX = START_X + (TOKEN_COUNT - 1) * TOKEN_SPACING + 1.6;
  const resLbl = new Text({ text: '残差流', fontSize: 18, color: RES_COLOR });
  resLbl.moveTo(t([sideX, 0, blockCenterZ + 0.3]));
  scene.addFixedOrientationMobjects(resLbl);
  scene.add(resLbl);

  const resEq = new Text({ text: 'x ← x + attn(x)', fontSize: 14, color: '#bbb' });
  resEq.moveTo(t([sideX, 0, blockCenterZ - 0.2]));
  scene.addFixedOrientationMobjects(resEq);
  scene.add(resEq);

  // ─── Q / K / V decomposition on the highlighted token ───
  // Small colored badges ABOVE the vector column: the vec gets projected into Q, K, V
  const qkvZ = vecTopZ + 0.55;
  const qLbl = new Text({ text: 'Q', fontSize: 18, color: Q_COLOR });
  qLbl.moveTo(t([hx - 0.3, 0, qkvZ]));
  scene.addFixedOrientationMobjects(qLbl);
  scene.add(qLbl);

  const kLbl = new Text({ text: 'K', fontSize: 18, color: K_COLOR });
  kLbl.moveTo(t([hx, 0, qkvZ]));
  scene.addFixedOrientationMobjects(kLbl);
  scene.add(kLbl);

  const vLbl = new Text({ text: 'V', fontSize: 18, color: V_COLOR });
  vLbl.moveTo(t([hx + 0.3, 0, qkvZ]));
  scene.addFixedOrientationMobjects(vLbl);
  scene.add(vLbl);

  // ─── Formula panel on the LEFT of the block ───
  const formulaX = START_X - 2.8;
  const formulaZ0 = blockCenterZ + 1.2;

  const fTitle = new Text({ text: '注意力机制', fontSize: 18, color: '#dddddd' });
  fTitle.moveTo(t([formulaX, 0, formulaZ0]));
  scene.addFixedOrientationMobjects(fTitle);
  scene.add(fTitle);

  const fQ = new Text({ text: 'Q = x · W_Q  (查询)', fontSize: 14, color: Q_COLOR });
  fQ.moveTo(t([formulaX, 0, formulaZ0 - 0.55]));
  scene.addFixedOrientationMobjects(fQ);
  scene.add(fQ);

  const fK = new Text({ text: 'K = x · W_K  (键)',   fontSize: 14, color: K_COLOR });
  fK.moveTo(t([formulaX, 0, formulaZ0 - 0.95]));
  scene.addFixedOrientationMobjects(fK);
  scene.add(fK);

  const fV = new Text({ text: 'V = x · W_V  (值)',   fontSize: 14, color: V_COLOR });
  fV.moveTo(t([formulaX, 0, formulaZ0 - 1.35]));
  scene.addFixedOrientationMobjects(fV);
  scene.add(fV);

  const fScore = new Text({ text: '分数_ij = Q_i · K_j', fontSize: 14, color: '#cccccc' });
  fScore.moveTo(t([formulaX, 0, formulaZ0 - 1.95]));
  scene.addFixedOrientationMobjects(fScore);
  scene.add(fScore);

  const fSoft = new Text({ text: '权重 = softmax(分数)', fontSize: 14, color: '#cccccc' });
  fSoft.moveTo(t([formulaX, 0, formulaZ0 - 2.35]));
  scene.addFixedOrientationMobjects(fSoft);
  scene.add(fSoft);

  const fSum = new Text({ text: 'Σ权重 = 1   (每行归一)', fontSize: 12, color: '#aaaaaa' });
  fSum.moveTo(t([formulaX, 0, formulaZ0 - 2.7]));
  scene.addFixedOrientationMobjects(fSum);
  scene.add(fSum);

  const fOut = new Text({ text: 'attn(x) = Σ 权重_j · V_j', fontSize: 14, color: '#cccccc' });
  fOut.moveTo(t([formulaX, 0, formulaZ0 - 3.3]));
  scene.addFixedOrientationMobjects(fOut);
  scene.add(fOut);

  scene.render();
  return '第2步：每个向量投影成 Q/K/V → 弧线粗细 = Q·K 的 softmax 权重（和为 1）。输出加回黄色残差流，不是替换';
}
