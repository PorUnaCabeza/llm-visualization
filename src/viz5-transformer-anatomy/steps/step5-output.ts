import { Arrow3D, Box3D, Create, Line3D, Sphere, Text, type ThreeDScene } from 'manim-web';
import { JOURNEY_WAYPOINTS, OUTPUT_PROBS } from '../constants';
import { type V3, t } from '../utils';

// ─── Step 5: Unembedding → Softmax → probability distribution ───
//
// The real computation is:
//   logit_w = final_vector · W_U[:, w]   (dot product with each vocab word's direction)
//   prob_w  = softmax(logits)
//
// Geometrically: words whose unembedding vectors point closest to the final vector
// win. We visualise this as a "star field" of candidate words scattered around the
// journey's last tip — the closer the star, the higher the logit → higher probability.

// Unit-ish directions for each candidate word, hand-picked to sit in the
// left/upper hemisphere of the final tip (away from the probability panel).
const VOCAB_DIRS: V3[] = [
  [ 0.1,  0.1,  0.9],  // 面
  [-0.5,  0.3,  0.7],  // 粥
  [-0.3, -0.5,  0.8],  // 饺子
  [-0.7,  0.2,  0.4],  // 汤
  [-0.5,  0.6,  0.3],  // 米饭
  [-0.8, -0.4,  0.2],  // 拉面
];
// Distances roughly proportional to -log(prob) → closer = more likely
const VOCAB_DISTS = [0.8, 1.3, 1.6, 1.9, 2.2, 2.5];

export async function step5Output(scene: ThreeDScene): Promise<string> {
  const baseX = 4;
  const baseZ = 5;

  // Final tip = sum of journey deltas
  const lastTip: V3 = JOURNEY_WAYPOINTS.reduce<V3>(
    (acc, wp) => [acc[0] + wp.delta[0], acc[1] + wp.delta[1], acc[2] + wp.delta[2]],
    [0, 0, 0],
  );

  // ─── Unembedding: place vocab words as "stars" near the final tip ───
  const unembedLbl = new Text({ text: 'Unembedding', fontSize: 20, color: '#F4D03F' });
  unembedLbl.moveTo(t([lastTip[0] - 1.8, lastTip[1] + 0.5, lastTip[2] + 2.2]));
  scene.addFixedOrientationMobjects(unembedLbl);
  scene.add(unembedLbl);

  const unembedEq = new Text({ text: 'logit_w = v · W_U[:, w]', fontSize: 14, color: '#bbbbbb' });
  unembedEq.moveTo(t([lastTip[0] - 1.8, lastTip[1] + 0.5, lastTip[2] + 1.7]));
  scene.addFixedOrientationMobjects(unembedEq);
  scene.add(unembedEq);

  OUTPUT_PROBS.forEach((item, i) => {
    const [dx, dy, dz] = VOCAB_DIRS[i];
    const dist = VOCAB_DISTS[i];
    const pos: V3 = [
      lastTip[0] + dx * dist,
      lastTip[1] + dy * dist,
      lastTip[2] + dz * dist,
    ];
    const isWinner = i === 0;

    // Line from final tip to this candidate word — opacity ∝ probability
    scene.add(new Line3D({
      start: t(lastTip),
      end:   t(pos),
      color: isWinner ? '#F4D03F' : '#58C4DD',
      opacity: 0.2 + item.prob * 1.8,
    }));

    // Word sphere
    scene.add(new Sphere({
      center: t(pos),
      radius: isWinner ? 0.14 : 0.1,
      color: isWinner ? '#F4D03F' : '#58C4DD',
      opacity: 0.55 + item.prob,
    }));

    // Word label
    const wordLbl = new Text({
      text: item.word,
      fontSize: isWinner ? 20 : 17,
      color: isWinner ? '#F4D03F' : '#58C4DD',
    });
    wordLbl.moveTo(t([pos[0] + 0.28, pos[1], pos[2] + 0.28]));
    scene.addFixedOrientationMobjects(wordLbl);
    scene.add(wordLbl);
  });

  // ─── Transformation arrow → Softmax panel ───
  const softLabel = new Text({ text: 'Softmax', fontSize: 20, color: '#F4D03F' });
  softLabel.moveTo(t([baseX + 2, 0, baseZ + 1.5]));
  scene.addFixedOrientationMobjects(softLabel);
  scene.add(softLabel);

  const arrow = new Arrow3D({
    start: t(lastTip),
    end:   t([baseX, 0, baseZ + 0.5]),
    color: '#F4D03F',
    shaftRadius: 0.03,
    tipLength: 0.25,
    tipRadius: 0.1,
    opacity: 0.8,
  });
  scene.add(arrow);
  await scene.play(new Create(arrow, { duration: 0.7 }));

  // ─── Probability bars ───
  OUTPUT_PROBS.forEach((item, i) => {
    const z = baseZ - i * 0.65;
    const barLen = item.prob * 5;
    const isWinner = i === 0;

    scene.add(new Box3D({
      width: barLen, height: 0.35, depth: 0.25,
      center: t([baseX + barLen / 2, 0, z]),
      color: isWinner ? '#F4D03F' : '#58C4DD',
      opacity: 0.5 + item.prob,
    }));

    const wordLabel = new Text({
      text: item.word,
      fontSize: 17,
      color: isWinner ? '#F4D03F' : '#dddddd',
    });
    wordLabel.moveTo(t([baseX - 0.7, 0, z]));
    scene.addFixedOrientationMobjects(wordLabel);
    scene.add(wordLabel);

    const pctLabel = new Text({
      text: `${Math.round(item.prob * 100)}%`,
      fontSize: 15,
      color: isWinner ? '#F4D03F' : '#cccccc',
    });
    pctLabel.moveTo(t([baseX + barLen + 0.5, 0, z]));
    scene.addFixedOrientationMobjects(pctLabel);
    scene.add(pctLabel);
  });

  scene.render();
  return '第6步：final 向量与词表中每个词的 unembedding 向量点积 → logits → Softmax → 概率。"面" 的向量最接近 → 32%';
}
