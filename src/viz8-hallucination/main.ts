export {};

// Each topic has 3 candidate answers tuned for different training-density tiers.
// "g" = grounded (correct), "f" = fabricated.
// At low density we show the fabricated version with most words red;
// at mid we show a partially-grounded version;
// at high we show the fully-grounded version.
type AnswerWord = { text: string; grounded: boolean };

type Topic = {
  id: string;
  // Three precomposed answers from low → high density. Same surface style!
  low:  AnswerWord[];
  mid:  AnswerWord[];
  high: AnswerWord[];
};

const TOPICS: Record<string, Topic> = {
  celebrity: {
    id: 'celebrity',
    // low density: still answers fluently, mostly fabricated specifics
    low: [
      { text: '爱因斯坦于 ', grounded: true },
      { text: '1903 年', grounded: false },
      { text: '在', grounded: true },
      { text: '《Nature》', grounded: false },
      { text: '上发表了', grounded: true },
      { text: '《时空与引力》', grounded: false },
      { text: '一文，奠定了狭义相对论。', grounded: true },
    ],
    mid: [
      { text: '爱因斯坦于 ', grounded: true },
      { text: '1905 年', grounded: true },
      { text: '在', grounded: true },
      { text: '《Annalen der Physik》', grounded: true },
      { text: '上发表了', grounded: true },
      { text: '《关于光的产生》', grounded: false },
      { text: '一文，奠定了狭义相对论。', grounded: true },
    ],
    high: [
      { text: '爱因斯坦于 ', grounded: true },
      { text: '1905 年', grounded: true },
      { text: '在', grounded: true },
      { text: '《Annalen der Physik》', grounded: true },
      { text: '上发表了', grounded: true },
      { text: '《论动体的电动力学》', grounded: true },
      { text: '一文，奠定了狭义相对论。', grounded: true },
    ],
  },

  poem: {
    id: 'poem',
    low: [
      { text: '《静夜思》是李白', grounded: true },
      { text: '于公元 715 年', grounded: false },
      { text: '在', grounded: true },
      { text: '长安客居期间', grounded: false },
      { text: '所作，开篇"', grounded: true },
      { text: '床前明月光，疑是地上霜', grounded: true },
      { text: '"流传千古。', grounded: true },
    ],
    mid: [
      { text: '《静夜思》是李白', grounded: true },
      { text: '约公元 726 年前后', grounded: true },
      { text: '在', grounded: true },
      { text: '扬州旅居时', grounded: false },
      { text: '所作，开篇"', grounded: true },
      { text: '床前明月光，疑是地上霜', grounded: true },
      { text: '"流传千古。', grounded: true },
    ],
    high: [
      { text: '《静夜思》写作时间', grounded: true },
      { text: '尚有争议，多数学者认为约公元 726 年', grounded: true },
      { text: '；', grounded: true },
      { text: '具体地点不可考', grounded: true },
      { text: '。开篇"', grounded: true },
      { text: '床前明月光，疑是地上霜', grounded: true },
      { text: '"流传千古。', grounded: true },
    ],
  },

  future: {
    id: 'future',
    // truly out-of-distribution: even at "high density" model has no real answer
    low: [
      { text: '2026 年图灵奖授予', grounded: false },
      { text: '陈昱辉教授', grounded: false },
      { text: '，表彰其在', grounded: false },
      { text: '分布式一致性算法（RAFT-X 协议）', grounded: false },
      { text: '方面的开创性贡献。', grounded: false },
    ],
    mid: [
      { text: '2026 年图灵奖授予', grounded: false },
      { text: 'Yoshua Bengio', grounded: false },
      { text: '与', grounded: false },
      { text: 'Geoffrey Hinton', grounded: false },
      { text: '，表彰其在深度学习方面的奠基性贡献。', grounded: false },
    ],
    // even "high" can't ground — best the model can do is hedge
    high: [
      { text: '我无法确定 2026 年图灵奖得主 ——', grounded: true },
      { text: '该奖项尚未公布', grounded: true },
      { text: '，', grounded: true },
      { text: '我的训练数据没有覆盖这个时间点。', grounded: true },
      { text: '建议查询 ACM 官方公告。', grounded: true },
    ],
  },
};

const topicSel       = document.getElementById('topicSel')      as HTMLSelectElement;
const densitySlider  = document.getElementById('densitySlider') as HTMLInputElement;
const densityVal     = document.getElementById('densityVal')!;
const densityFill    = document.getElementById('densityFill')!  as HTMLElement;
const densityOutput  = document.getElementById('densityOutput')!;
const confBar        = document.getElementById('confBar')!      as HTMLElement;
const confVal        = document.getElementById('confVal')!;

function pickTier(density: number, topicId: string): 'low' | 'mid' | 'high' {
  // future-knowledge topic: model can never have it grounded UNLESS very high (where it learns to hedge)
  if (topicId === 'future') {
    if (density < 700) return 'low';
    if (density < 950) return 'mid';
    return 'high'; // hedging response
  }
  if (density < 100)  return 'low';
  if (density < 600)  return 'mid';
  return 'high';
}

function render() {
  const d = parseInt(densitySlider.value, 10);
  const topicId = topicSel.value;
  densityVal.textContent = `${d.toLocaleString()} 次`;
  densityFill.style.width = `${(d / 1000) * 100}%`;

  const tier = pickTier(d, topicId);
  const ans = TOPICS[topicId][tier];

  // render words colored by grounded/fab
  densityOutput.innerHTML = '';
  ans.forEach(w => {
    const span = document.createElement('span');
    span.className = w.grounded ? 'word-grounded' : 'word-fab';
    span.textContent = w.text;
    densityOutput.appendChild(span);
  });

  // confidence: deliberately stays high regardless — that's the whole point
  // tiny dip only when the model explicitly hedges (future + high tier)
  const isHedging = topicId === 'future' && tier === 'high';
  const conf = isHedging ? 22 : (88 + Math.floor(d / 1000 * 8)); // 88–96, or 22 when hedging
  confBar.style.width = `${conf}%`;
  confBar.style.background = isHedging ? '#F4D03F' : '#58C4DD';
  confVal.textContent = `${conf}%`;
  confVal.style.color = isHedging ? '#F4D03F' : '#58C4DD';
}

topicSel.addEventListener('change', () => {
  // when switching topic, reset slider to a sensible default
  if (topicSel.value === 'future') densitySlider.value = '300';
  else if (topicSel.value === 'celebrity') densitySlider.value = '800';
  else densitySlider.value = '500';
  render();
});
densitySlider.addEventListener('input', render);

render();
