import { Arrow3D, Text, type ThreeDScene } from 'manim-web';
import { DEMO_WORDS, VOCAB_SIZE } from '../constants';
import { t } from '../utils';

// ─── Step 1: Words are symbols → give each one an integer ID ───
//
// Motivation: computers eat numbers, not characters. First step of any NLP
// pipeline is tokenization — splitting text into tokens, then mapping each
// token to an integer via a learned vocabulary table.

// Which words to show in this step (a short, readable slice).
const SHOWN = ['猫', '狗', '国王', '男人', '女人', '中国'];

export function step1Ids(scene: ThreeDScene): string {
  const items = DEMO_WORDS.filter((w) => SHOWN.includes(w.word));

  // Layout: words across the top, arrows pointing down to (word → id) rows.
  const topZ = 2.4;
  const midZ = 1.4;
  const spacing = 1.5;
  const totalW = (items.length - 1) * spacing;
  const startX = -totalW / 2;

  // Title
  const title = new Text({ text: '① 词 → Token ID', fontSize: 22, color: '#1F6F89' });
  title.moveTo(t([0, 0, 4.0]));
  scene.addFixedOrientationMobjects(title);
  scene.add(title);

  const sub = new Text({
    text: `词表（vocabulary）是一个字典 {token: id}，大约 ${VOCAB_SIZE.toLocaleString()} 项`,
    fontSize: 13, color: '#666',
  });
  sub.moveTo(t([0, 0, 3.3]));
  scene.addFixedOrientationMobjects(sub);
  scene.add(sub);

  items.forEach((it, i) => {
    const x = startX + i * spacing;

    // Word at the top
    const word = new Text({ text: it.word, fontSize: 26, color: it.color });
    word.moveTo(t([x, 0, topZ]));
    scene.addFixedOrientationMobjects(word);
    scene.add(word);

    // Arrow downward
    scene.add(new Arrow3D({
      start: t([x, 0, topZ - 0.5]),
      end:   t([x, 0, midZ + 0.15]),
      color: '#888',
      opacity: 0.6,
      shaftRadius: 0.02, tipLength: 0.15, tipRadius: 0.07,
    }));

    // ID below
    const idLabel = new Text({ text: it.id.toString(), fontSize: 16, color: '#1c1c1c' });
    idLabel.moveTo(t([x, 0, midZ - 0.1]));
    scene.addFixedOrientationMobjects(idLabel);
    scene.add(idLabel);
  });

  // Sample vocab table, placed BELOW the words so it doesn't get clipped in narrow viewports.
  const tableZ0 = -0.5;
  const vocabTitle = new Text({ text: '词表（示意） vocabulary.json', fontSize: 13, color: '#444' });
  vocabTitle.moveTo(t([0, 0, tableZ0 + 0.5]));
  scene.addFixedOrientationMobjects(vocabTitle);
  scene.add(vocabTitle);

  // Lay the entries out horizontally in two rows
  const entries: { token: string; id: number }[] = [
    { token: 'the',  id: 1 },
    { token: 'of',   id: 2 },
    { token: '中国', id: 127 },
    { token: '男人', id: 305 },
    { token: '猫',   id: 2031 },
    { token: '狗',   id: 2034 },
    { token: '国王', id: 8472 },
    { token: '女王', id: 8473 },
  ];
  const eSpacing = 1.1;
  const eStart = -((entries.length - 1) * eSpacing) / 2;
  entries.forEach((e, i) => {
    const x = eStart + i * eSpacing;
    const k = new Text({ text: e.token, fontSize: 12, color: '#444' });
    k.moveTo(t([x, 0, tableZ0 - 0.1]));
    scene.addFixedOrientationMobjects(k);
    scene.add(k);

    const sep = new Text({ text: ':', fontSize: 12, color: '#888' });
    sep.moveTo(t([x, 0, tableZ0 - 0.55]));
    scene.addFixedOrientationMobjects(sep);
    scene.add(sep);

    const v = new Text({ text: e.id.toString(), fontSize: 12, color: '#1F6F89' });
    v.moveTo(t([x, 0, tableZ0 - 1.0]));
    scene.addFixedOrientationMobjects(v);
    scene.add(v);
  });

  // Punchline: IDs are arbitrary
  const caveat = new Text({
    text: '⚠ ID 只是编号 — 2031 和 2032 未必语义相关',
    fontSize: 13, color: '#FC6255',
  });
  caveat.moveTo(t([0, 0, -2.5]));
  scene.addFixedOrientationMobjects(caveat);
  scene.add(caveat);

  scene.render();
  return '第1步：tokenization — 每个词在词表里都有一个整数 ID。但 ID 是任意的，本身不携带语义。';
}
