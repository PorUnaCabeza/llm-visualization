import { Arrow3D, Create, Line3D, Sphere, Text, type ThreeDScene } from 'manim-web';
import { JOURNEY_WAYPOINTS } from '../constants';
import { type V3, t } from '../utils';

// ─── Step 4: Vector journey — how "___" gets refined through the layers ───

const GRID_SIZE = 6;
const GRID_STEP = 1.5;

function drawGrid(scene: ThreeDScene) {
  // Grid lines — slightly brighter so they're visible against #0a0a0a.
  for (let i = -GRID_SIZE; i <= GRID_SIZE; i += GRID_STEP) {
    if (i === 0) continue;  // axes drawn separately, brighter
    scene.add(new Line3D({ start: t([i, -GRID_SIZE, 0]), end: t([i, GRID_SIZE, 0]), color: '#666666', opacity: 0.85 }));
    scene.add(new Line3D({ start: t([-GRID_SIZE, i, 0]), end: t([GRID_SIZE, i, 0]), color: '#666666', opacity: 0.85 }));
  }
  // Axes — bright + drawn as a 3×3 bundle (offsets in both perpendicular dirs)
  // for visual thickness, since Line3D doesn't expose line width reliably.
  const D = 0.05;
  const drawAxis = (s: V3, e: V3, color: string, axis: 'x' | 'y' | 'z') => {
    for (const a of [-D, 0, D]) {
      for (const b of [-D, 0, D]) {
        let off: V3;
        if (axis === 'x') off = [0, a, b];      // perpendicular to x: y, z
        else if (axis === 'y') off = [a, 0, b]; // perpendicular to y: x, z
        else off = [a, b, 0];                   // perpendicular to z: x, y
        scene.add(new Line3D({
          start: t([s[0] + off[0], s[1] + off[1], s[2] + off[2]]),
          end:   t([e[0] + off[0], e[1] + off[1], e[2] + off[2]]),
          color, opacity: 1.0,
        }));
      }
    }
  };
  drawAxis([-GRID_SIZE, 0, 0], [GRID_SIZE, 0, 0], '#FC6255', 'x');  // X axis - red
  drawAxis([0, -GRID_SIZE, 0], [0, GRID_SIZE, 0], '#83C167', 'y');  // Y axis - green
  drawAxis([0, 0, 0],          [0, 0, 6],         '#58C4DD', 'z');  // Z axis - blue

  // Axis tip labels
  const xL = new Text({ text: 'x', fontSize: 16, color: '#FC6255' });
  xL.moveTo(t([GRID_SIZE + 0.4, 0, 0]));
  scene.addFixedOrientationMobjects(xL); scene.add(xL);

  const yL = new Text({ text: 'y', fontSize: 16, color: '#83C167' });
  yL.moveTo(t([0, GRID_SIZE + 0.4, 0]));
  scene.addFixedOrientationMobjects(yL); scene.add(yL);

  const zL = new Text({ text: 'z', fontSize: 16, color: '#58C4DD' });
  zL.moveTo(t([-0.4, 0, 6.2]));
  scene.addFixedOrientationMobjects(zL); scene.add(zL);
}

export async function step4Journey(scene: ThreeDScene): Promise<string> {
  scene.clear();

  const sentence = new Text({ text: '我 饿 了 ， 想 吃 一 碗 热 腾腾 的', fontSize: 18, color: '#cccccc' });
  sentence.moveTo(t([0, 0, 7.5]));
  scene.addFixedOrientationMobjects(sentence);
  scene.add(sentence);

  const qLabel = new Text({ text: '___', fontSize: 28, color: '#F4D03F' });
  qLabel.moveTo(t([0, 0, 6.8]));
  scene.addFixedOrientationMobjects(qLabel);
  scene.add(qLabel);

  drawGrid(scene);

  const origin: V3 = [0, 0, 0];
  scene.add(new Sphere({ center: t(origin), radius: 0.12, color: '#58C4DD', opacity: 0.9 }));

  // Chained waypoint arrows — each arrow starts where the previous one ended
  let prevTip: V3 = [0, 0, 0];
  for (const wp of JOURNEY_WAYPOINTS) {
    const tip: V3 = [
      prevTip[0] + wp.delta[0],
      prevTip[1] + wp.delta[1],
      prevTip[2] + wp.delta[2],
    ];

    const arrow = new Arrow3D({
      start: t(prevTip),
      end:   t(tip),
      color: wp.color,
      shaftRadius: 0.04,
      tipLength: 0.3,
      tipRadius: 0.12,
      opacity: 0.85,
    });
    scene.add(arrow);
    await scene.play(new Create(arrow, { duration: 0.6 }));

    scene.add(new Sphere({ center: t(tip), radius: 0.1, color: wp.color, opacity: 0.9 }));

    const lbl = new Text({ text: wp.label, fontSize: 18, color: wp.color });
    lbl.moveTo(t([tip[0] + 0.5, tip[1] + 0.3, tip[2] + 0.3]));
    scene.addFixedOrientationMobjects(lbl);
    scene.add(lbl);

    const layerLbl = new Text({ text: wp.layerText, fontSize: 13, color: '#aaaaaa' });
    layerLbl.moveTo(t([tip[0] + 0.5, tip[1] + 0.3, tip[2] - 0.2]));
    scene.addFixedOrientationMobjects(layerLbl);
    scene.add(layerLbl);

    scene.render();
    await new Promise(r => setTimeout(r, 800));

    prevTip = tip;
  }

  // Faint straight arrow from origin to final tip — the net result
  scene.add(new Arrow3D({
    start: t(origin),
    end:   t(prevTip),
    color: '#dddddd',
    shaftRadius: 0.02,
    tipLength: 0.2,
    tipRadius: 0.08,
    opacity: 0.4,
  }));

  scene.render();
  return '第5步："___" 的向量在每一层被逐步修正 — 从未知，到理解上下文「饿→吃→热腾腾」，最终指向"面"';
}
