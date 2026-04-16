import { Arrow3D, Create, Line3D, Sphere, Text, type ThreeDScene } from 'manim-web';
import { JOURNEY_WAYPOINTS } from '../constants';
import { type V3, t } from '../utils';

// ─── Step 4: Vector journey — how "___" gets refined through the layers ───

const GRID_SIZE = 6;
const GRID_STEP = 1.5;

function drawGrid(scene: ThreeDScene) {
  for (let i = -GRID_SIZE; i <= GRID_SIZE; i += GRID_STEP) {
    scene.add(new Line3D({ start: t([i, -GRID_SIZE, 0]), end: t([i, GRID_SIZE, 0]), color: '#bfb6a0', opacity: 0.5 }));
    scene.add(new Line3D({ start: t([-GRID_SIZE, i, 0]), end: t([GRID_SIZE, i, 0]), color: '#bfb6a0', opacity: 0.5 }));
  }
  scene.add(new Line3D({ start: t([-GRID_SIZE, 0, 0]), end: t([GRID_SIZE, 0, 0]), color: '#8c7f6a', opacity: 0.6 }));
  scene.add(new Line3D({ start: t([0, -GRID_SIZE, 0]), end: t([0, GRID_SIZE, 0]), color: '#8c7f6a', opacity: 0.6 }));
  scene.add(new Line3D({ start: t([0, 0, 0]),          end: t([0, 0, 6]),         color: '#8c7f6a', opacity: 0.6 }));
}

export async function step4Journey(scene: ThreeDScene): Promise<string> {
  scene.clear();

  const sentence = new Text({ text: '我 饿 了 ， 想 吃 一 碗 热 腾腾 的', fontSize: 14, color: '#666' });
  sentence.moveTo(t([0, 0, 7.5]));
  scene.addFixedOrientationMobjects(sentence);
  scene.add(sentence);

  const qLabel = new Text({ text: '___', fontSize: 20, color: '#B98A0E' });
  qLabel.moveTo(t([0, 0, 6.8]));
  scene.addFixedOrientationMobjects(qLabel);
  scene.add(qLabel);

  drawGrid(scene);

  const origin: V3 = [0, 0, 0];
  scene.add(new Sphere({ center: t(origin), radius: 0.12, color: '#1F6F89', opacity: 0.9 }));

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

    const lbl = new Text({ text: wp.label, fontSize: 13, color: wp.color });
    lbl.moveTo(t([tip[0] + 0.5, tip[1] + 0.3, tip[2] + 0.3]));
    scene.addFixedOrientationMobjects(lbl);
    scene.add(lbl);

    const layerLbl = new Text({ text: wp.layerText, fontSize: 9, color: '#777' });
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
    color: '#8c7f6a',
    shaftRadius: 0.02,
    tipLength: 0.2,
    tipRadius: 0.08,
    opacity: 0.3,
  }));

  scene.render();
  return '第5步："___" 的向量在每一层被逐步修正 — 从未知，到理解上下文「饿→吃→热腾腾」，最终指向"面"';
}
