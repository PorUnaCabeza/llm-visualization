import { ThreeDAxes, Text, type ThreeDScene } from 'manim-web';
import { CATEGORY_COLORS, CLOUD_WORDS } from '../constants';
import { addWordSphere } from '../primitives';
import { seededRandom, t, type V3 } from '../utils';

// ─── Step 5: Training result → the word cloud ───
//
// The payoff: after billions of training steps, rows of E are no longer random.
// Semantically-similar words end up with similar vectors → clusters in space.
// We take d_model dims → project to the first 3 for viz.

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
    fontSize: 22, color: '#1F6F89',
  });
  title.moveTo(t([0, 0, 7.5]));
  scene.addFixedOrientationMobjects(title);
  scene.add(title);

  const sub = new Text({
    text: '每行 E 都是空间中的一个点。近义词聚成簇，远义词相互远离',
    fontSize: 13, color: '#666',
  });
  sub.moveTo(t([0, 0, 7.1]));
  scene.addFixedOrientationMobjects(sub);
  scene.add(sub);

  // Axes (dim — they're just for orientation)
  scene.add(new ThreeDAxes({
    xRange: [-6, 6, 2],
    yRange: [-6, 6, 2],
    zRange: [-6, 6, 2],
    axisColor: '#bfb6a0',
    showTicks: false,
    tipLength: 0.22,
    tipRadius: 0.08,
    shaftRadius: 0.006,
  }));

  // Place clusters
  const rng = seededRandom(17);
  CLOUD_WORDS.forEach((c) => {
    const pts = clusterPoints(c.cx, c.cy, c.cz, c.spread, c.words.length, rng);
    const color = CATEGORY_COLORS[c.category] || '#888';
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
    fontSize: 13, color: '#B98A0E',
  });
  insight.moveTo(t([0, 0, -5.8]));
  scene.addFixedOrientationMobjects(insight);
  scene.add(insight);

  scene.render();
  return '第5步：训练后的 E 里，猫/狗/马 聚在一起，国家聚在一起。向量空间出现了人类可以理解的语义结构。';
}
