import { Arrow3D, Line3D, Sphere, Text, ThreeDAxes, type ThreeDScene } from 'manim-web';
import { ANALOGY_POSITIONS } from '../constants';
import { addWordSphere } from '../primitives';
import { t, type V3 } from '../utils';

// ─── Step 6: The classic word-vector magic: king − man + woman ≈ queen ───
//
// Not a random parlor trick. Because E is learned from predictive loss on
// real text, directions in the space become interpretable axes. The vector
// (king − man) encodes "royalty", and adding it to "woman" lands near "queen".

export function step6Analogy(scene: ThreeDScene): string {
  // Title
  const title = new Text({
    text: '⑥ 词向量代数 — 方向即语义',
    fontSize: 22, color: '#B98A0E',
  });
  title.moveTo(t([0, 0, 4.5]));
  scene.addFixedOrientationMobjects(title);
  scene.add(title);

  const sub = new Text({
    text: '国王 − 男人 + 女人  ≈  女王',
    fontSize: 18, color: '#B98A0E',
  });
  sub.moveTo(t([0, 0, 3.9]));
  scene.addFixedOrientationMobjects(sub);
  scene.add(sub);

  // Faint axes for orientation
  scene.add(new ThreeDAxes({
    xRange: [-4, 4, 1],
    yRange: [-2, 2, 1],
    zRange: [-1, 4, 1],
    axisColor: '#bfb6a0',
    showTicks: false,
    tipLength: 0.2, tipRadius: 0.07, shaftRadius: 0.005,
  }));

  // The four words — placed by ANALOGY_POSITIONS so they form a parallelogram
  const man = ANALOGY_POSITIONS['男人'];
  const king = ANALOGY_POSITIONS['国王'];
  const woman = ANALOGY_POSITIONS['女人'];
  const queen = ANALOGY_POSITIONS['女王'];

  const MAN_COLOR = '#1F6F89';
  const KING_COLOR = '#5C3F70';
  const WOMAN_COLOR = '#C76F92';
  const QUEEN_COLOR = '#B98A0E';

  addWordSphere(scene, man,   '男人',  MAN_COLOR,   0.26, 16, [0.4, 0, -0.45]);
  addWordSphere(scene, king,  '国王',  KING_COLOR,  0.26, 16, [0.4, 0,  0.45]);
  addWordSphere(scene, woman, '女人',  WOMAN_COLOR, 0.26, 16, [0.4, 0, -0.45]);
  addWordSphere(scene, queen, '女王',  QUEEN_COLOR, 0.26, 16, [0.4, 0,  0.45]);

  // Vector 1: 男人 → 国王 (this is the "royalty" direction)
  scene.add(new Arrow3D({
    start: t(man),
    end:   t(king),
    color: '#3F7A26',
    opacity: 0.95,
    shaftRadius: 0.028, tipLength: 0.2, tipRadius: 0.09,
  }));
  const royaltyMid: V3 = [
    (man[0] + king[0]) / 2 - 0.6,
    0,
    (man[2] + king[2]) / 2,
  ];
  const roy = new Text({ text: '+"王权"', fontSize: 13, color: '#3F7A26' });
  roy.moveTo(t(royaltyMid));
  scene.addFixedOrientationMobjects(roy);
  scene.add(roy);

  // Vector 2: 女人 → 女王 (should be parallel to vector 1 — same royalty direction)
  scene.add(new Arrow3D({
    start: t(woman),
    end:   t(queen),
    color: '#3F7A26',
    opacity: 0.95,
    shaftRadius: 0.028, tipLength: 0.2, tipRadius: 0.09,
  }));
  const royaltyMid2: V3 = [
    (woman[0] + queen[0]) / 2 - 0.6,
    0,
    (woman[2] + queen[2]) / 2,
  ];
  const roy2 = new Text({ text: '+"王权"', fontSize: 13, color: '#3F7A26' });
  roy2.moveTo(t(royaltyMid2));
  scene.addFixedOrientationMobjects(roy2);
  scene.add(roy2);

  // Vector 3: 男人 → 女人 (gender direction)
  scene.add(new Arrow3D({
    start: t(man),
    end:   t(woman),
    color: '#C76F92',
    opacity: 0.95,
    shaftRadius: 0.028, tipLength: 0.2, tipRadius: 0.09,
  }));
  const genderMid: V3 = [
    (man[0] + woman[0]) / 2,
    0,
    man[2] - 0.4,
  ];
  const gen = new Text({ text: '+"阴性"', fontSize: 13, color: '#C76F92' });
  gen.moveTo(t(genderMid));
  scene.addFixedOrientationMobjects(gen);
  scene.add(gen);

  // Vector 4: 国王 → 女王 (should be parallel to vector 3 — same gender direction)
  scene.add(new Arrow3D({
    start: t(king),
    end:   t(queen),
    color: '#C76F92',
    opacity: 0.7,
    shaftRadius: 0.022, tipLength: 0.18, tipRadius: 0.08,
  }));

  // Dashed parallelogram frame (for the "shape"-reading crowd)
  const dash = (s: V3, e: V3, color: string, op = 0.3) =>
    scene.add(new Line3D({ start: t(s), end: t(e), color, opacity: op }));

  // The "predicted queen" — compute as king − man + woman, check it ≈ queen
  const predicted: V3 = [
    king[0] - man[0] + woman[0],
    king[1] - man[1] + woman[1],
    king[2] - man[2] + woman[2],
  ];
  // Ghost sphere showing where algebra lands
  scene.add(new Sphere({
    center: t(predicted),
    radius: 0.22,
    color: '#B98A0E',
    opacity: 0.35,
  }));
  dash(predicted, queen, '#B98A0E', 0.6);

  const predLbl = new Text({
    text: '国王 − 男人 + 女人',
    fontSize: 11, color: '#B98A0E',
  });
  predLbl.moveTo(t([predicted[0] - 0.2, 0, predicted[2] + 0.7]));
  scene.addFixedOrientationMobjects(predLbl);
  scene.add(predLbl);

  const predLbl2 = new Text({
    text: '= 落点 ≈ 女王',
    fontSize: 11, color: '#B98A0E',
  });
  predLbl2.moveTo(t([predicted[0] - 0.2, 0, predicted[2] + 0.35]));
  scene.addFixedOrientationMobjects(predLbl2);
  scene.add(predLbl2);

  // Key insight
  const i1 = new Text({
    text: '→ 同一"方向"编码同一种语义关系（性别、王权、单复数、语种…）',
    fontSize: 12, color: '#444',
  });
  i1.moveTo(t([0, 0, -2.5]));
  scene.addFixedOrientationMobjects(i1);
  scene.add(i1);

  const i2 = new Text({
    text: 'Word2Vec (2013) 的经典发现 — 线性结构从未被显式编程，是训练自然涌现的',
    fontSize: 12, color: '#666',
  });
  i2.moveTo(t([0, 0, -3.0]));
  scene.addFixedOrientationMobjects(i2);
  scene.add(i2);

  scene.render();
  return '第6步：平行四边形！"国王−男人" 和 "女王−女人" 是同一方向 — 向量空间里的"王权"轴。语义变成几何。';
}
