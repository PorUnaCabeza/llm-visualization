import { Text, type ThreeDScene } from 'manim-web';
import { VOCAB_SIZE } from '../constants';
import { addOneHotBar } from '../primitives';
import { t } from '../utils';

// ─── Step 2: ID → One-hot → why it's a terrible representation ───
//
// Mathematically, the textbook "first" embedding of a token is a one-hot
// vector of length VOCAB_SIZE: all zeros except a 1 at the token's ID.
// It's a useful mental model because the embedding lookup IS matrix multiply
// with this one-hot — but as a representation it's a disaster:
//   • 50,000+ dimensions
//   • every two distinct words are orthogonal (cosine = 0)
//   • no notion of similarity

const CELLS = 16;  // visible cells; the rest is "…"

// Fixed showcase: 猫 at cell 3, 狗 at cell 9 — close IDs, but orthogonal.
const EXAMPLES = [
  { word: '猫', id: 2031, litCell: 3,  color: '#58C4DD' },
  { word: '狗', id: 2034, litCell: 9,  color: '#58C4DD' },
  { word: '国王', id: 8472, litCell: 13, color: '#C77DDD' },
];

export function step2OneHot(scene: ThreeDScene): string {
  // Title
  const title = new Text({ text: '② One-hot 编码（教科书式第一步）', fontSize: 22, color: '#F4D03F' });
  title.moveTo(t([0, 0, 3.8]));
  scene.addFixedOrientationMobjects(title);
  scene.add(title);

  const sub = new Text({
    text: `把 ID 变成一个长度 ${VOCAB_SIZE.toLocaleString()} 的向量，只有 ID 位置是 1，其它全为 0`,
    fontSize: 13, color: '#dddddd',
  });
  sub.moveTo(t([0, 0, 3.15]));
  scene.addFixedOrientationMobjects(sub);
  scene.add(sub);

  // Axis marker: index 0 ... VOCAB_SIZE-1
  const cellStride = 0.24;
  const barLeftX = -2.2;  // tuned so word-labels-on-left and end-of-bar-equation both fit
  const barRightX = barLeftX + CELLS * cellStride;

  const leftLbl = new Text({ text: '0', fontSize: 10, color: '#dddddd' });
  leftLbl.moveTo(t([barLeftX - 0.2, 0, 2.3]));
  scene.addFixedOrientationMobjects(leftLbl);
  scene.add(leftLbl);

  const rightLbl = new Text({ text: `${VOCAB_SIZE.toLocaleString()}`, fontSize: 10, color: '#dddddd' });
  rightLbl.moveTo(t([barRightX + 0.9, 0, 2.3]));
  scene.addFixedOrientationMobjects(rightLbl);
  scene.add(rightLbl);

  // Three one-hot bars stacked
  EXAMPLES.forEach((ex, i) => {
    const z = 1.6 - i * 1.3;

    // word + id label on the left
    const word = new Text({ text: ex.word, fontSize: 20, color: ex.color });
    word.moveTo(t([barLeftX - 1.1, 0, z]));
    scene.addFixedOrientationMobjects(word);
    scene.add(word);

    const id = new Text({ text: `ID = ${ex.id}`, fontSize: 11, color: '#dddddd' });
    id.moveTo(t([barLeftX - 1.1, 0, z - 0.38]));
    scene.addFixedOrientationMobjects(id);
    scene.add(id);

    // the bar
    addOneHotBar(scene, [barLeftX, 0, z], CELLS, ex.litCell, ex.color);

    // bracket equation on the right
    const eq = new Text({
      text: `长度 ${VOCAB_SIZE.toLocaleString()}`,
      fontSize: 11, color: '#dddddd',
    });
    eq.moveTo(t([barRightX + 1.2, 0, z]));
    scene.addFixedOrientationMobjects(eq);
    scene.add(eq);
  });

  // The punchline — three problems (centered, stacked vertically so they read on any width)
  const problemsZ = -2.4;
  const pTitle = new Text({ text: '为什么 one-hot 不够用？', fontSize: 13, color: '#FC6255' });
  pTitle.moveTo(t([0, 0, problemsZ]));
  scene.addFixedOrientationMobjects(pTitle);
  scene.add(pTitle);

  const p1 = new Text({ text: '① 维度爆炸：每个词一个 50000 维向量', fontSize: 12, color: '#eeeeee' });
  p1.moveTo(t([0, 0, problemsZ - 0.5]));
  scene.addFixedOrientationMobjects(p1);
  scene.add(p1);

  const p2 = new Text({ text: '② 两两正交：cos(猫, 狗) = 0', fontSize: 12, color: '#eeeeee' });
  p2.moveTo(t([0, 0, problemsZ - 0.9]));
  scene.addFixedOrientationMobjects(p2);
  scene.add(p2);

  const p3 = new Text({ text: '③ 零语义：猫·狗 = 猫·汽车 = 猫·愤怒 = 0', fontSize: 12, color: '#eeeeee' });
  p3.moveTo(t([0, 0, problemsZ - 1.3]));
  scene.addFixedOrientationMobjects(p3);
  scene.add(p3);

  scene.render();
  return '第2步：one-hot 只是把 ID 展平成超长稀疏向量。所有词彼此正交，距离相同 — 完全没有语义。';
}
