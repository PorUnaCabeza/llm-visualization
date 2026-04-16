import { Line3D, Text, type ThreeDScene } from 'manim-web';
import { CATEGORY_COLORS, CLOUD_WORDS } from '../constants';
import { addWordSphere } from '../primitives';
import { seededRandom, t, type V3 } from '../utils';

// ─── Step 5: Training result → the word cloud ───
//
// The payoff: after billions of training steps, rows of E are no longer random.
// Semantically-similar words end up with similar vectors → clusters in space.
// We take d_model dims → project to the first 3 for viz.

const GRID_SIZE = 6;
const GRID_STEP = 2;

// Draw a thick, colored axis as a 3×3 bundle of Line3D (manim-web has no line
// width). Mirrors the trick used in viz5 step4-journey.
function drawAxes(scene: ThreeDScene) {
  // Faint grid lines on the floor (z = 0 plane in logical coords)
  for (let i = -GRID_SIZE; i <= GRID_SIZE; i += GRID_STEP) {
    if (i === 0) continue;
    scene.add(new Line3D({ start: t([i, -GRID_SIZE, 0]), end: t([i, GRID_SIZE, 0]), color: '#666666', opacity: 0.7 }));
    scene.add(new Line3D({ start: t([-GRID_SIZE, i, 0]), end: t([GRID_SIZE, i, 0]), color: '#666666', opacity: 0.7 }));
  }

  const D = 0.05;
  const drawAxis = (s: V3, e: V3, color: string, axis: 'x' | 'y' | 'z') => {
    for (const a of [-D, 0, D]) {
      for (const b of [-D, 0, D]) {
        let off: V3;
        if (axis === 'x') off = [0, a, b];
        else if (axis === 'y') off = [a, 0, b];
        else off = [a, b, 0];
        scene.add(new Line3D({
          start: t([s[0] + off[0], s[1] + off[1], s[2] + off[2]]),
          end:   t([e[0] + off[0], e[1] + off[1], e[2] + off[2]]),
          color, opacity: 1.0,
        }));
      }
    }
  };
  drawAxis([-GRID_SIZE, 0, 0], [GRID_SIZE, 0, 0], '#FC6255', 'x');
  drawAxis([0, -GRID_SIZE, 0], [0, GRID_SIZE, 0], '#83C167', 'y');
  drawAxis([0, 0, -GRID_SIZE], [0, 0, GRID_SIZE], '#58C4DD', 'z');

  const xL = new Text({ text: 'x', fontSize: 16, color: '#FC6255' });
  xL.moveTo(t([GRID_SIZE + 0.4, 0, 0]));
  scene.addFixedOrientationMobjects(xL); scene.add(xL);

  const yL = new Text({ text: 'y', fontSize: 16, color: '#83C167' });
  yL.moveTo(t([0, GRID_SIZE + 0.4, 0]));
  scene.addFixedOrientationMobjects(yL); scene.add(yL);

  const zL = new Text({ text: 'z', fontSize: 16, color: '#58C4DD' });
  zL.moveTo(t([-0.4, 0, GRID_SIZE + 0.4]));
  scene.addFixedOrientationMobjects(zL); scene.add(zL);
}

function clusterPoints(
  cx: number, cy: number, cz: number,
  spread: number, count: number,
  rng: () => number,
): V3[] {
  const pts: V3[] = [];
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.5;
    const phi = Math.PI / 4 + (rng() - 0.5) * Math.PI * 0.4;
    const r = spread * (0.5 + rng() * 0.5);
    pts.push([
      cx + r * Math.sin(phi) * Math.cos(theta),
      cy + r * Math.sin(phi) * Math.sin(theta),
      cz + r * Math.cos(phi),
    ]);
  }
  return pts;
}

export function step5Cloud(scene: ThreeDScene): string {
  // Title (kept up-top so it reads clearly)
  const title = new Text({
    text: '⑤ 训练完成后 — 语义空间涌现',
    fontSize: 22, color: '#58C4DD',
  });
  title.moveTo(t([0, 0, 7.5]));
  scene.addFixedOrientationMobjects(title);
  scene.add(title);

  const sub = new Text({
    text: '每行 E 都是空间中的一个点。近义词聚成簇，远义词相互远离',
    fontSize: 13, color: '#dddddd',
  });
  sub.moveTo(t([0, 0, 7.1]));
  scene.addFixedOrientationMobjects(sub);
  scene.add(sub);

  drawAxes(scene);

  // Place clusters
  const rng = seededRandom(17);
  CLOUD_WORDS.forEach((c) => {
    const pts = clusterPoints(c.cx, c.cy, c.cz, c.spread, c.words.length, rng);
    const color = CATEGORY_COLORS[c.category] || '#dddddd';
    c.words.forEach((w, i) => {
      addWordSphere(scene, pts[i], w, color, 0.2, 13, [0.3, 0, 0.3]);
    });
  });

  // Horizontal legend strip right under the subtitle
  const legZ = 6.4;
  const legEntries = Object.entries(CATEGORY_COLORS).slice(0, 5);
  const legSpacing = 1.6;
  const legStart = -((legEntries.length - 1) * legSpacing) / 2;
  legEntries.forEach(([cat, col], i) => {
    const lbl = new Text({ text: `● ${cat}`, fontSize: 12, color: col });
    lbl.moveTo(t([legStart + i * legSpacing, 0, legZ]));
    scene.addFixedOrientationMobjects(lbl);
    scene.add(lbl);
  });

  // Key insight caption
  const insight = new Text({
    text: '距离 ≈ 语义差异    |    方向 ≈ 语义关系',
    fontSize: 13, color: '#F4D03F',
  });
  insight.moveTo(t([0, 0, -6.8]));
  scene.addFixedOrientationMobjects(insight);
  scene.add(insight);

  scene.render();
  return '第5步：训练后的 E 里，猫/狗/马 聚在一起，国家聚在一起。向量空间出现了人类可以理解的语义结构。';
}
