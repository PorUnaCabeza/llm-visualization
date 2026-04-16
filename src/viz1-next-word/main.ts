export {};

// ─── Story steps ───
interface Step {
  currentText: string;
  candidates: { word: string; prob: number }[];
  selectedIndex: number;
  annotation?: string;
  showSamplingExplain?: boolean;
}

const STEPS: Step[] = [
  {
    currentText: '从前有一座',
    candidates: [
      { word: '山', prob: 0.62 },
      { word: '城', prob: 0.18 },
      { word: '桥', prob: 0.09 },
      { word: '塔', prob: 0.06 },
      { word: '庙', prob: 0.05 },
    ],
    selectedIndex: 0,
  },
  {
    currentText: '从前有一座山',
    candidates: [
      { word: '，', prob: 0.45 },
      { word: '上', prob: 0.25 },
      { word: '里', prob: 0.15 },
      { word: '下', prob: 0.10 },
      { word: '。', prob: 0.05 },
    ],
    selectedIndex: 0,
  },
  {
    currentText: '从前有一座山，',
    candidates: [
      { word: '山', prob: 0.38 },
      { word: '山上', prob: 0.28 },
      { word: '山里', prob: 0.18 },
      { word: '有', prob: 0.10 },
      { word: '住', prob: 0.06 },
    ],
    selectedIndex: 0,
  },
  {
    currentText: '从前有一座山，山',
    candidates: [
      { word: '上', prob: 0.42 },
      { word: '里', prob: 0.30 },
      { word: '下', prob: 0.15 },
      { word: '中', prob: 0.08 },
      { word: '前', prob: 0.05 },
    ],
    selectedIndex: 1,  // not the top! demonstrates sampling
    annotation: '⚠ 第二名被选中了 — 这就是"采样"',
    showSamplingExplain: true,
  },
  {
    currentText: '从前有一座山，山里',
    candidates: [
      { word: '有', prob: 0.55 },
      { word: '住', prob: 0.22 },
      { word: '藏', prob: 0.10 },
      { word: '传', prob: 0.08 },
      { word: '的', prob: 0.05 },
    ],
    selectedIndex: 0,
  },
  {
    currentText: '从前有一座山，山里有',
    candidates: [
      { word: '一', prob: 0.40 },
      { word: '个', prob: 0.25 },
      { word: '座', prob: 0.18 },
      { word: '很', prob: 0.10 },
      { word: '位', prob: 0.07 },
    ],
    selectedIndex: 0,
  },
  {
    currentText: '从前有一座山，山里有一',
    candidates: [
      { word: '座', prob: 0.35 },
      { word: '个', prob: 0.30 },
      { word: '位', prob: 0.15 },
      { word: '条', prob: 0.12 },
      { word: '片', prob: 0.08 },
    ],
    selectedIndex: 0,
  },
  {
    currentText: '从前有一座山，山里有一座',
    candidates: [
      { word: '庙', prob: 0.65 },
      { word: '寺', prob: 0.15 },
      { word: '塔', prob: 0.10 },
      { word: '洞', prob: 0.06 },
      { word: '屋', prob: 0.04 },
    ],
    selectedIndex: 0,
  },
];

const FINAL_TEXT = '从前有一座山，山里有一座庙';

// ─── DOM handles ───
const textContent   = document.getElementById('textContent')!;
const probBarsEl    = document.getElementById('probBars')!;
const annotationEl  = document.getElementById('annotation')!;
const playBtn       = document.getElementById('playBtn') as HTMLButtonElement;
const resetBtn      = document.getElementById('resetBtn') as HTMLButtonElement;
const phaseLabel    = document.getElementById('phaseLabel')!;
const probTitle     = document.getElementById('probTitle')!;
const vocabOverview = document.getElementById('vocabOverview')!;
const vocabDensity  = document.getElementById('vocabDensity')!;
const vocabNote     = document.getElementById('vocabNote')!;
const completePanel = document.getElementById('completePanel')!;
const completeStory = document.getElementById('completeStory')!;
const samplingExplain = document.getElementById('samplingExplain')!;

let isPlaying = false;
let animationAbort: AbortController | null = null;

// ─── Helpers ───

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

function renderText(text: string, highlightLast = false) {
  if (highlightLast && text.length > 0) {
    const last = text.slice(-1);
    const rest = text.slice(0, -1);
    textContent.innerHTML = `${rest}<span class="word-highlight word-flash">${last}</span><span class="cursor"></span>`;
  } else {
    textContent.innerHTML = `${text}<span class="cursor"></span>`;
  }
}

function renderProbBars(
  candidates: Step['candidates'],
  selectedIndex = -1,
  showSelection = false,
) {
  probBarsEl.innerHTML = '';
  candidates.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'prob-row';

    const wordEl = document.createElement('div');
    wordEl.className = 'prob-word';
    wordEl.textContent = c.word;

    const barBg = document.createElement('div');
    barBg.className = 'prob-bar-bg';

    const bar = document.createElement('div');
    bar.className = 'prob-bar';
    bar.style.width = '0%';

    if (showSelection) {
      if (i === selectedIndex) {
        bar.classList.add('selected');
      } else if (i === 0 && selectedIndex !== 0) {
        // mark top rank that was NOT chosen (greedy would pick this)
        bar.classList.add('not-selected');
      } else {
        bar.classList.add('not-selected');
      }
    }
    barBg.appendChild(bar);

    const pctEl = document.createElement('div');
    pctEl.className = 'prob-pct';
    pctEl.textContent = `${Math.round(c.prob * 100)}%`;

    row.appendChild(wordEl);
    row.appendChild(barBg);
    row.appendChild(pctEl);
    probBarsEl.appendChild(row);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.width = `${c.prob * 100}%`;
    }));
  });
}

// ─── Phase 0: Opening — full vocab reveal ───

function buildVocabDensity() {
  vocabDensity.innerHTML = '';
  // 64 bars: simulate full vocab distribution. First 5 are "real" top candidates.
  const HEIGHTS = [
    // top 5 visible (real) — will highlight these
    0.62, 0.18, 0.09, 0.06, 0.05,
    // rest: random long tail
    ...Array.from({ length: 59 }, () => Math.random() * 0.04 + 0.002),
  ];
  // Sort so bars roughly descend (it's prettier)
  const topFive = HEIGHTS.slice(0, 5);
  const rest = HEIGHTS.slice(5).sort((a, b) => b - a);
  const all = [...topFive, ...rest];

  all.forEach((h, i) => {
    const bar = document.createElement('div');
    bar.className = 'vbar';
    bar.style.height = '2px'; // start collapsed
    bar.dataset.height = String(h);
    bar.dataset.top = String(i < 5 ? '1' : '0');
    vocabDensity.appendChild(bar);
  });
}

async function animateVocabGrow(signal: AbortSignal) {
  const bars = vocabDensity.querySelectorAll<HTMLElement>('.vbar');
  // Animate all bars growing
  bars.forEach((bar) => {
    const h = parseFloat(bar.dataset.height || '0');
    bar.style.height = `${Math.max(h * 55, 2)}px`;
  });
  await sleep(800, signal);
}

async function highlightTopFive(signal: AbortSignal) {
  const bars = vocabDensity.querySelectorAll<HTMLElement>('.vbar');
  bars.forEach((bar) => {
    if (bar.dataset.top === '1') {
      bar.classList.add('top');
    } else {
      bar.style.opacity = '0.25';
    }
  });
  vocabNote.textContent = '↑ 前 5 个候选词（模型实际计算了约 100,000 个）';
  await sleep(1000, signal);
}

// ─── Phase 1: Story animation ───

async function runStory(signal: AbortSignal) {
  phaseLabel.textContent = '逐词生成中...';
  probTitle.textContent = '候选词概率分布';
  vocabOverview.classList.remove('visible');

  for (const step of STEPS) {
    if (signal.aborted) break;

    renderText(step.currentText);
    renderProbBars(step.candidates);
    annotationEl.classList.remove('visible');
    annotationEl.textContent = '';
    samplingExplain.classList.remove('visible');

    await sleep(1200, signal);

    // show selection
    renderProbBars(step.candidates, step.selectedIndex, true);

    if (step.annotation) {
      annotationEl.textContent = step.annotation;
      annotationEl.classList.add('visible');
    }
    if (step.showSamplingExplain) {
      await sleep(400, signal);
      samplingExplain.classList.add('visible');
      await sleep(1600, signal); // longer pause on the sampling step
    } else {
      await sleep(800, signal);
    }

    const selected = step.candidates[step.selectedIndex].word;
    renderText(step.currentText + selected, true);
    await sleep(600, signal);
  }
}

// ─── Phase 2: Complete reveal ───

async function revealComplete(signal: AbortSignal) {
  if (signal.aborted) return;

  phaseLabel.textContent = '生成完成';
  annotationEl.classList.remove('visible');
  samplingExplain.classList.remove('visible');
  probBarsEl.innerHTML = '';
  probTitle.textContent = '';

  // show complete story character by character with stagger
  textContent.innerHTML = '<span class="cursor"></span>';
  completePanel.classList.add('visible');

  const chars = FINAL_TEXT.split('');
  completeStory.innerHTML = '';
  for (let i = 0; i < chars.length; i++) {
    if (signal.aborted) break;
    const span = document.createElement('span');
    span.className = 'ch';
    span.textContent = chars[i];
    span.style.animationDelay = `${i * 60}ms`;
    completeStory.appendChild(span);
    await sleep(60, signal);
  }

  await sleep(500, signal);

  // note beneath
  const note = document.createElement('div');
  note.style.cssText = 'font-size:12px;color:#555;margin-bottom:8px;';
  note.textContent = `↑ 这 ${chars.length} 个字，来自 ${STEPS.length} 次概率采样`;
  completeStory.after(note);
}

// ─── Main play loop ───

async function playAnimation() {
  if (isPlaying) return;
  isPlaying = true;
  playBtn.disabled = true;
  animationAbort = new AbortController();
  const signal = animationAbort.signal;

  try {
    while (!signal.aborted) {
      doReset();
      await sleep(500, signal);

      // === Phase 0: vocab overview ===
      phaseLabel.textContent = '模型接到提示词…';
      renderText('从前有一座');
      buildVocabDensity();
      vocabOverview.classList.add('visible');
      probTitle.textContent = '下一个词的概率分布（全词表）';
      await sleep(600, signal);
      await animateVocabGrow(signal);
      await sleep(400, signal);
      await highlightTopFive(signal);

      // transition to regular bars
      probTitle.textContent = '候选词概率分布（top 5）';
      renderProbBars(STEPS[0].candidates);
      await sleep(300, signal);

      // === Phase 1: story ===
      await runStory(signal);

      // === Phase 2: complete reveal ===
      await revealComplete(signal);

      // hold before looping
      await sleep(5000, signal);
    }
  } catch (e) {
    if ((e as DOMException).name !== 'AbortError') throw e;
  } finally {
    isPlaying = false;
    playBtn.disabled = false;
  }
}

function doReset() {
  textContent.innerHTML = '<span class="cursor"></span>';
  probBarsEl.innerHTML = '';
  annotationEl.classList.remove('visible');
  annotationEl.textContent = '';
  samplingExplain.classList.remove('visible');
  vocabOverview.classList.remove('visible');
  vocabDensity.innerHTML = '';
  vocabNote.textContent = '';
  completePanel.classList.remove('visible');
  completeStory.innerHTML = '';
  // remove the "X个字" note if exists
  const oldNote = document.querySelector('.complete-panel > div:not(.complete-story):not(.loop-diagram)');
  oldNote?.remove();
  phaseLabel.textContent = '';
  probTitle.textContent = '候选词概率分布';
}

function reset() {
  if (animationAbort) {
    animationAbort.abort();
    animationAbort = null;
  }
  isPlaying = false;
  playBtn.disabled = false;
  doReset();
}

playBtn.addEventListener('click', playAnimation);
resetBtn.addEventListener('click', reset);

setTimeout(playAnimation, 600);
