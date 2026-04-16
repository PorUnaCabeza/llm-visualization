export {};

// ─── Data ───
const WORDS = [
  { word: '山', logit: 4.2 },
  { word: '城', logit: 2.8 },
  { word: '桥', logit: 1.9 },
  { word: '塔', logit: 1.5 },
  { word: '庙', logit: 1.2 },
  { word: '村', logit: 0.8 },
  { word: '洞', logit: 0.5 },
  { word: '湖', logit: 0.3 },
];

// ─── Mode config ───
type Mode = 'greedy' | 'sampling' | 'topk' | 'topp';

const MODE_CONFIG: Record<Mode, {
  title: string;
  desc: string;
  useCase: string;
  formula: string;
  formulaNote: string;
}> = {
  greedy: {
    title: '贪婪（Greedy）',
    desc: '总是选概率最高的词。输出完全确定，每次相同。优点：可预测；缺点：死板重复。',
    useCase: '代码补全、精确翻译、格式化输出',
    formula: '选择：argmax softmax(<span class="hi">l</span>)',
    formulaNote: 'l = logit（模型原始输出），直接取最大值，无随机性',
  },
  sampling: {
    title: '随机采样（Temperature Sampling）',
    desc: '按概率分布随机采样。温度 T 控制"脑洞大小"：T↓更保守，T↑更随机，T≈0等同于贪婪。',
    useCase: '对话、写作助手、通用聊天',
    formula: 'softmax(<span class="hi">l</span>, T) = exp(<span class="hi">l</span>/T) / Σexp(<span class="hi">l\'</span>/T)',
    formulaNote: 'T 出现在分母：T↓ → 概率更集中；T↑ → 概率更分散',
  },
  topk: {
    title: 'Top-K 采样',
    desc: '只保留概率最高的 K 个词，在这 K 个里随机采样（再做一次 softmax 归一化）。避免选到极低概率的奇怪词。',
    useCase: '创意写作、诗歌生成（K = 20~50 是常见设置）',
    formula: 'candidates = top_k(<span class="hi">l</span>, K)<br>选择：sample(softmax(candidates))',
    formulaNote: 'K=1 等同于贪婪；K=N（词表大小）等同于随机采样',
  },
  topp: {
    title: 'Top-P / Nucleus 采样',
    desc: '从累积概率 > P 的最少词集合中采样。比 Top-K 更自适应：词分布锐时取少数词，分布平时取更多词。',
    useCase: '故事生成、头脑风暴（P = 0.9 是常见设置）',
    formula: 'nucleus = {词: 累积概率 ≤ <span class="hi">P</span>}<br>选择：sample(softmax(nucleus))',
    formulaNote: 'P=1.0 等同于随机采样；P≈0 等同于贪婪',
  },
};

// ─── DOM ───
const modeTabs       = document.querySelectorAll<HTMLElement>('.mode-tab');
const modeTitle      = document.getElementById('modeTitle')!;
const modeDesc       = document.getElementById('modeDesc')!;
const useCaseEl      = document.getElementById('useCase')!;
const formulaBox     = document.getElementById('formulaBox')!;
const probBarsEl     = document.getElementById('probBars')!;
const selWord        = document.getElementById('selWord')!;
const selMethod      = document.getElementById('selMethod')!;
const distTitle      = document.getElementById('distTitle')!;

// controls
const tempControls    = document.getElementById('tempControls')!;
const topkControls    = document.getElementById('topkControls')!;
const toppControls    = document.getElementById('toppControls')!;
const greedyPlaceholder = document.getElementById('greedyPlaceholder')!;
const tempSlider      = document.getElementById('tempSlider') as HTMLInputElement;
const tempVal         = document.getElementById('tempVal')!;
const kSlider         = document.getElementById('kSlider') as HTMLInputElement;
const kVal            = document.getElementById('kVal')!;
const pSlider         = document.getElementById('pSlider') as HTMLInputElement;
const pVal            = document.getElementById('pVal')!;
const presetBtns      = document.querySelectorAll<HTMLElement>('.preset-btn[data-temp]');

// resample + frequency
const resampleBtn = document.getElementById('resampleBtn') as HTMLButtonElement;
const freqBox     = document.getElementById('freqBox')!;
const freqBtn     = document.getElementById('freqBtn') as HTMLButtonElement;
const freqBars    = document.getElementById('freqBars')!;
const freqHint    = document.getElementById('freqHint')!;

let currentMode: Mode = 'greedy';

// ─── Softmax ───
function softmax(logits: number[], temp: number): number[] {
  const t = Math.max(temp, 0.001);
  const scaled = logits.map(l => l / t);
  const maxS = Math.max(...scaled);
  const exps = scaled.map(s => Math.exp(s - maxS));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// ─── Real categorical sampling ───
function sampleFromDist(probs: number[], allowedIdx?: Set<number>): number {
  // If allowedIdx is given, restrict to those indices and renormalize.
  let pool: { i: number; p: number }[];
  if (allowedIdx) {
    let total = 0;
    pool = [];
    probs.forEach((p, i) => {
      if (allowedIdx.has(i)) { pool.push({ i, p }); total += p; }
    });
    pool.forEach(x => (x.p /= total));
  } else {
    pool = probs.map((p, i) => ({ i, p }));
  }
  const r = Math.random();
  let cum = 0;
  for (const { i, p } of pool) {
    cum += p;
    if (r <= cum) return i;
  }
  return pool[pool.length - 1].i;
}

// ─── Compute eligibility set + sample one word ───
function computeSelected(probs: number[], mode: Mode, k: number, p: number): {
  idx: number; label: string; eligible: boolean[];
} {
  if (mode === 'greedy') {
    const idx = probs.indexOf(Math.max(...probs));
    return { idx, label: '最高概率（确定性）', eligible: probs.map((_, i) => i === idx) };
  }

  if (mode === 'sampling') {
    const idx = sampleFromDist(probs);
    return {
      idx,
      label: `T=${parseFloat(tempSlider.value).toFixed(2)} · 真随机抽一次`,
      eligible: probs.map(() => true),
    };
  }

  if (mode === 'topk') {
    const sorted = [...probs].map((prob, i) => ({ prob, i })).sort((a, b) => b.prob - a.prob);
    const topK = new Set(sorted.slice(0, k).map(x => x.i));
    const eligible = probs.map((_, i) => topK.has(i));
    const idx = sampleFromDist(probs, topK);
    return { idx, label: `Top-${k} 内随机抽一次`, eligible };
  }

  // top-p
  const sorted = [...probs].map((prob, i) => ({ prob, i })).sort((a, b) => b.prob - a.prob);
  let cum = 0;
  const nucleus: number[] = [];
  for (const item of sorted) {
    nucleus.push(item.i);
    cum += item.prob;
    if (cum >= p) break;
  }
  const nucleusSet = new Set(nucleus);
  const eligible = probs.map((_, i) => nucleusSet.has(i));
  const idx = sampleFromDist(probs, nucleusSet);
  return { idx, label: `Top-P (${p.toFixed(2)}) 内随机抽一次`, eligible };
}

// Get current eligibility set (without sampling) — used for frequency runner.
function currentEligibilitySet(probs: number[], mode: Mode, k: number, p: number): Set<number> | undefined {
  if (mode === 'greedy' || mode === 'sampling') return undefined;
  if (mode === 'topk') {
    const sorted = [...probs].map((prob, i) => ({ prob, i })).sort((a, b) => b.prob - a.prob);
    return new Set(sorted.slice(0, k).map(x => x.i));
  }
  const sorted = [...probs].map((prob, i) => ({ prob, i })).sort((a, b) => b.prob - a.prob);
  let cum = 0;
  const nucleus: number[] = [];
  for (const item of sorted) {
    nucleus.push(item.i);
    cum += item.prob;
    if (cum >= p) break;
  }
  return new Set(nucleus);
}

// ─── Render bars ───
function render() {
  const temp   = parseFloat(tempSlider.value);
  const k      = parseInt(kSlider.value, 10);
  const p      = parseFloat(pSlider.value);
  const mode   = currentMode;

  const logits = WORDS.map(w => w.logit);
  const probs  = softmax(logits, mode === 'sampling' ? temp : 1.0);
  const maxP   = Math.max(...probs);

  const { idx: selIdx, label: selLabel, eligible } = computeSelected(probs, mode, k, p);

  // cumulative for top-p
  const sortedByProb = [...probs].map((prob, i) => ({ prob, i })).sort((a, b) => b.prob - a.prob);
  const cumulatives = new Map<number, number>();
  let cum = 0;
  for (const { prob, i } of sortedByProb) {
    cum += prob;
    cumulatives.set(i, cum);
  }

  probBarsEl.innerHTML = '';
  WORDS.forEach(({ word }, i) => {
    const pct = probs[i];
    const widthPct = (pct / maxP) * 100;

    const row = document.createElement('div');
    row.className = 'prob-row';

    const wordEl = document.createElement('div');
    wordEl.className = 'prob-word';
    wordEl.textContent = word;

    const bg = document.createElement('div');
    bg.className = 'prob-bar-bg';

    const bar = document.createElement('div');
    bar.className = 'prob-bar';
    bar.style.width = `${widthPct}%`;

    if (i === selIdx && (mode === 'greedy')) {
      bar.classList.add('greedy');
    } else if (i === selIdx) {
      bar.classList.add('selected');
    } else if (!eligible[i]) {
      bar.classList.add('excluded');
    } else if (mode === 'topp' && eligible[i]) {
      bar.classList.add('nucleus');
    } else {
      bar.classList.add('eligible');
    }

    bg.appendChild(bar);

    const pctEl = document.createElement('div');
    pctEl.className = 'prob-pct';
    const pctVal = pct * 100;
    pctEl.textContent = pctVal < 0.1 ? '<0.1%' : `${pctVal.toFixed(1)}%`;

    row.appendChild(wordEl);
    row.appendChild(bg);
    row.appendChild(pctEl);
    probBarsEl.appendChild(row);
  });

  // update selected word callout (with flash animation on each new sample)
  selWord.textContent = WORDS[selIdx].word;
  selWord.classList.remove('flash');
  void selWord.offsetWidth; // restart animation
  selWord.classList.add('flash');
  selMethod.textContent = selLabel;

  // resample button + freq panel: only for stochastic modes
  const isStochastic = mode !== 'greedy';
  resampleBtn.style.display = isStochastic ? 'inline-block' : 'none';
  freqBox.style.display     = isStochastic ? 'block' : 'none';
  // clear any previous frequency display when params change
  freqBars.innerHTML = '';
  freqHint.textContent = isStochastic
    ? '点击按钮，看在当前参数下，采 50 次的实际频次分布'
    : '';

  // update dist title
  if (mode === 'sampling') {
    distTitle.textContent = `softmax(T=${temp.toFixed(2)}) 概率分布`;
  } else {
    distTitle.textContent = 'softmax 概率分布（T=1.0）';
  }
}

// ─── Frequency runner: sample N times and animate the histogram ───
let freqRunning = false;
async function runFrequency(n: number) {
  if (freqRunning) return;
  freqRunning = true;
  freqBtn.disabled = true;

  const temp   = parseFloat(tempSlider.value);
  const k      = parseInt(kSlider.value, 10);
  const p      = parseFloat(pSlider.value);
  const mode   = currentMode;

  const logits = WORDS.map(w => w.logit);
  const probs  = softmax(logits, mode === 'sampling' ? temp : 1.0);
  const eligibility = currentEligibilitySet(probs, mode, k, p);

  const counts = new Array(WORDS.length).fill(0);

  // pre-render zeroed bars
  freqBars.innerHTML = '';
  WORDS.forEach((w, i) => {
    const row = document.createElement('div');
    row.className = 'freq-row';
    row.innerHTML = `
      <div class="freq-word">${w.word}</div>
      <div class="freq-bar-bg"><div class="freq-bar" id="freqBar${i}" style="width:0%"></div></div>
      <div class="freq-count" id="freqCount${i}">0</div>
    `;
    freqBars.appendChild(row);
  });

  for (let s = 0; s < n; s++) {
    const idx = sampleFromDist(probs, eligibility);
    counts[idx]++;
    // update bars (cheap — just 8 elements)
    const max = Math.max(...counts, 1);
    counts.forEach((c, i) => {
      const bar = document.getElementById(`freqBar${i}`)!;
      const cnt = document.getElementById(`freqCount${i}`)!;
      bar.style.width = `${(c / max) * 100}%`;
      cnt.textContent = String(c);
    });
    await new Promise(r => setTimeout(r, 35));
  }

  // summary line
  const distinctCount = counts.filter(c => c > 0).length;
  freqHint.textContent = `↑ 50 次采样命中了 ${distinctCount} 个不同的词。改一下参数再来一次试试。`;

  freqRunning = false;
  freqBtn.disabled = false;
}

// ─── Mode switch ───
function switchMode(mode: Mode) {
  currentMode = mode;

  // tabs
  modeTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));

  // info
  const cfg = MODE_CONFIG[mode];
  modeTitle.textContent = cfg.title;
  modeDesc.textContent = cfg.desc;
  useCaseEl.innerHTML = `<strong>适用：</strong>${cfg.useCase}`;
  formulaBox.innerHTML = `<div class="eq">${cfg.formula}</div><div style="margin-top:6px;color:#555;font-size:11px;">${cfg.formulaNote}</div>`;

  // controls
  tempControls.style.display    = mode === 'sampling' ? 'block' : 'none';
  topkControls.style.display    = mode === 'topk'     ? 'block' : 'none';
  toppControls.style.display    = mode === 'topp'     ? 'block' : 'none';
  greedyPlaceholder.style.display = mode === 'greedy' ? 'block' : 'none';

  render();
}

// ─── Events ───
modeTabs.forEach(tab => {
  tab.addEventListener('click', () => switchMode(tab.dataset.mode as Mode));
});

tempSlider.addEventListener('input', () => {
  tempVal.textContent = parseFloat(tempSlider.value).toFixed(2);
  presetBtns.forEach(btn => {
    btn.classList.toggle('active', Math.abs(parseFloat(btn.dataset.temp || '1') - parseFloat(tempSlider.value)) < 0.05);
  });
  render();
});

kSlider.addEventListener('input', () => {
  kVal.textContent = kSlider.value;
  render();
});

pSlider.addEventListener('input', () => {
  pVal.textContent = parseFloat(pSlider.value).toFixed(2);
  render();
});

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const t = parseFloat(btn.dataset.temp || '1');
    tempSlider.value = String(t);
    tempVal.textContent = t.toFixed(2);
    presetBtns.forEach(b => b.classList.toggle('active', Math.abs(parseFloat(b.dataset.temp || '1') - t) < 0.05));
    render();
  });
});

resampleBtn.addEventListener('click', () => render());
freqBtn.addEventListener('click', () => runFrequency(50));

// init
switchMode('greedy');
