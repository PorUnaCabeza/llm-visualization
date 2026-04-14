export {};

const RAW_LOGITS = [
  { word: '山', logit: 4.2 },
  { word: '城', logit: 2.8 },
  { word: '桥', logit: 1.9 },
  { word: '塔', logit: 1.5 },
  { word: '庙', logit: 1.2 },
  { word: '村', logit: 0.8 },
  { word: '洞', logit: 0.5 },
  { word: '湖', logit: 0.3 },
];

const BAR_COLORS = [
  '#58C4DD', '#83C167', '#F4D03F', '#FC6255',
  '#9A72AC', '#FF8C00', '#4ECDC4', '#E8A87C',
];

const DESCRIPTIONS: Record<string, string> = {
  cold: 'T → 0：几乎所有概率集中在最高分的词上。输出变得完全可预测、重复——就像 ChatGPT 在 T=0 时总是生成同一个答案。',
  conservative: 'T = 0.3：保守模式。模型倾向选择高概率词，但偶尔允许次优选项。适合代码生成、翻译等需要准确性的任务。',
  standard: '标准温度。模型在高概率词和低概率词之间取得平衡，生成自然流畅的文本。',
  creative: 'T = 1.5：创意模式。低概率词获得更多机会，输出更多样、更有创意。但也更容易出现离题或不连贯。',
  chaotic: 'T = 3.0：混乱模式。概率分布接近均匀，模型几乎随机选词。输出变成无意义的文字——这就是"高温"的极端。',
};

function softmax(logits: number[], temperature: number): number[] {
  const t = Math.max(temperature, 0.001);
  const scaled = logits.map((l) => l / t);
  const maxScaled = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - maxScaled));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sumExps);
}

const tempSlider = document.getElementById('tempSlider') as HTMLInputElement;
const tempDisplay = document.getElementById('tempDisplay')!;
const probBarsEl = document.getElementById('probBars')!;
const descriptionEl = document.getElementById('description')!;
const presetBtns = document.querySelectorAll('.preset-btn');

function getDescription(temp: number): string {
  if (temp < 0.1) return DESCRIPTIONS.cold;
  if (temp < 0.6) return DESCRIPTIONS.conservative;
  if (temp < 1.3) return DESCRIPTIONS.standard;
  if (temp < 2.2) return DESCRIPTIONS.creative;
  return DESCRIPTIONS.chaotic;
}

function getBarColor(temp: number): string {
  if (temp < 0.1) return '#58C4DD';
  if (temp < 0.6) return '#83C167';
  if (temp < 1.3) return '#F4D03F';
  if (temp < 2.2) return '#FF8C00';
  return '#FC6255';
}

function renderBars(temperature: number) {
  const logits = RAW_LOGITS.map((r) => r.logit);
  const probs = softmax(logits, temperature);

  const maxProb = Math.max(...probs);

  probBarsEl.innerHTML = '';

  RAW_LOGITS.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'prob-row';

    const wordEl = document.createElement('div');
    wordEl.className = 'prob-word';
    wordEl.textContent = item.word;

    const barBg = document.createElement('div');
    barBg.className = 'prob-bar-bg';

    const bar = document.createElement('div');
    bar.className = 'prob-bar';
    const widthPct = maxProb > 0 ? (probs[i] / maxProb) * 100 : 0;
    bar.style.width = `${widthPct}%`;
    bar.style.background = BAR_COLORS[i % BAR_COLORS.length];
    bar.style.opacity = String(0.4 + (probs[i] / maxProb) * 0.6);
    barBg.appendChild(bar);

    const pctEl = document.createElement('div');
    pctEl.className = 'prob-pct';
    const pctValue = probs[i] * 100;
    pctEl.textContent = pctValue < 0.1 ? '<0.1%' : `${pctValue.toFixed(1)}%`;

    row.appendChild(wordEl);
    row.appendChild(barBg);
    row.appendChild(pctEl);
    probBarsEl.appendChild(row);
  });

}

function update() {
  const temp = parseFloat(tempSlider.value);
  tempDisplay.textContent = temp.toFixed(2);
  tempDisplay.style.color = getBarColor(temp);
  descriptionEl.textContent = getDescription(temp);
  renderBars(temp);

  presetBtns.forEach((btn) => {
    const btnTemp = parseFloat((btn as HTMLElement).dataset.temp || '1');
    btn.classList.toggle('active', Math.abs(btnTemp - temp) < 0.05);
  });
}

tempSlider.addEventListener('input', update);

presetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const temp = parseFloat((btn as HTMLElement).dataset.temp || '1');
    tempSlider.value = String(temp);
    update();
  });
});

update();
