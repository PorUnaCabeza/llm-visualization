import { Box3D, Line3D, Sphere, Text, type ThreeDScene } from 'manim-web';
import { FF_HEIGHT, FF_TOP_Z, START_X, TOKEN_COUNT, TOKEN_SPACING } from '../constants';
import { addResidualBypass, addVectorColumn } from '../primitives';
import { type V3, genVec, seededRandom, t } from '../utils';

// ─── Step 2: Feedforward block — each token runs independently through the same NN ───

// Shape matches real FF blocks: expand then contract (d → 4d → d).
// Real Transformers use ~4× (SwiGLU 8/3×). 12/5 ≈ 2.4× here keeps it readable.
const NN_LAYER_SIZES = [5, 12, 5];
const SLICE_SPREAD_Y = 1.0;
const MAX_CONN_PER_SRC = 3;  // cap edges so the wider middle stays readable
const RES_COLOR = '#F4D03F';
const HIGHLIGHT_IDX = 4;

export async function step2Feedforward(scene: ThreeDScene): Promise<string> {
  const blockWidth = (TOKEN_COUNT - 1) * TOKEN_SPACING + 2.5;
  const ffCenterZ = FF_TOP_Z - FF_HEIGHT / 2;

  scene.add(new Box3D({
    width: blockWidth, height: FF_HEIGHT, depth: 2.0,
    center: t([0, 0, ffCenterZ]),
    color: '#aa66aa', opacity: 0.3, wireframe: true,
  }));

  const title = new Text({ text: 'Feedforward', fontSize: 32, color: '#C77DDD' });
  title.moveTo(t([0, 1.5, FF_TOP_Z + 0.5]));
  scene.addFixedOrientationMobjects(title);
  scene.add(title);

  // Per-token NN slices
  const sliceHeight = FF_HEIGHT - 0.8;
  const layerZ = [
    FF_TOP_Z - 0.4,
    FF_TOP_Z - 0.4 - sliceHeight / 2,
    FF_TOP_Z - 0.4 - sliceHeight,
  ];

  for (let ti = 0; ti < TOKEN_COUNT; ti++) {
    const cx = START_X + ti * TOKEN_SPACING;
    const rng = seededRandom(5000 + ti * 137);
    const nodes: V3[][] = [];

    // Neuron spheres
    for (let l = 0; l < NN_LAYER_SIZES.length; l++) {
      const n = NN_LAYER_SIZES[l];
      const layerNodes: V3[] = [];
      for (let ni = 0; ni < n; ni++) {
        const y = -SLICE_SPREAD_Y / 2 + (ni / (n - 1)) * SLICE_SPREAD_Y;
        const z = layerZ[l] + (rng() - 0.5) * 0.2;
        const x = cx + (rng() - 0.5) * 0.15;
        const pos: V3 = [x, y, z];
        layerNodes.push(pos);
        scene.add(new Sphere({
          center: t(pos),
          radius: l === 1 ? 0.05 : 0.06,
          color: '#9A72AC',
          opacity: l === 1 ? 0.55 : 0.8,
        }));
      }
      nodes.push(layerNodes);
    }

    // Weighted connections: blue = positive weight, red = negative
    for (let l = 0; l < NN_LAYER_SIZES.length - 1; l++) {
      const src = nodes[l];
      const dst = nodes[l + 1];
      for (let si = 0; si < src.length; si++) {
        const nConn = 2 + Math.floor(rng() * (MAX_CONN_PER_SRC - 1));
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

  // ─── Residual stream bypass on every token ───
  const ffBotZ = FF_TOP_Z - FF_HEIGHT - 0.1;
  for (let i = 0; i < TOKEN_COUNT; i++) {
    const x = START_X + i * TOKEN_SPACING;
    const isHighlight = i === HIGHLIGHT_IDX;
    addResidualBypass(
      scene,
      x,
      FF_TOP_Z + 0.1,
      ffBotZ,
      RES_COLOR,
      isHighlight ? 0.9 : 0.22,
      0,
      isHighlight,
    );
  }

  // Residual side label
  const sideX = START_X + (TOKEN_COUNT - 1) * TOKEN_SPACING + 1.6;
  const resLbl = new Text({ text: '残差流', fontSize: 18, color: RES_COLOR });
  resLbl.moveTo(t([sideX, 0, ffCenterZ + 0.3]));
  scene.addFixedOrientationMobjects(resLbl);
  scene.add(resLbl);

  const resEq = new Text({ text: 'x ← x + ff(x)', fontSize: 14, color: '#bbb' });
  resEq.moveTo(t([sideX, 0, ffCenterZ - 0.2]));
  scene.addFixedOrientationMobjects(resEq);
  scene.add(resEq);

  // ─── Expansion hint ───
  const expLbl = new Text({ text: '中间层 ≈ 4× 宽', fontSize: 14, color: '#bbb' });
  expLbl.moveTo(t([START_X - 2.8, 0, layerZ[1]]));
  scene.addFixedOrientationMobjects(expLbl);
  scene.add(expLbl);

  // Output vectors below the box
  const outTopZ = FF_TOP_Z - FF_HEIGHT - 0.3;
  for (let i = 0; i < TOKEN_COUNT; i++) {
    const x = START_X + i * TOKEN_SPACING;
    addVectorColumn(scene, x, outTopZ, genVec(700 + i * 53), '#d9c6ee', '#b39cd0');
  }

  scene.render();
  return '第3步：Feedforward — 2 层 NN，中间层扩张 ~4×（存"知识"的地方）。输出加回残差流（黄线）→ 每层只做"微调"，不是"替换"';
}
