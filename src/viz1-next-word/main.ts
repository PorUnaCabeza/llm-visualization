export {};

interface PredictionStep {
  currentText: string;
  candidates: { word: string; prob: number }[];
  selectedIndex: number;
  annotation?: string;
}

const STEPS: PredictionStep[] = [
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
    selectedIndex: 1,
    annotation: '← 随机采样，不总是选最高概率的',
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

const textContent = document.getElementById('textContent')!;
const probBarsEl = document.getElementById('probBars')!;
const annotationEl = document.getElementById('annotation')!;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;

let isPlaying = false;
let animationAbort: AbortController | null = null;

function renderProbBars(
  candidates: PredictionStep['candidates'],
  selectedIndex: number = -1,
  showSelection: boolean = false
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
    if (showSelection && i === selectedIndex) {
      bar.classList.add('selected');
    } else if (showSelection && i !== selectedIndex) {
      bar.classList.add('dimmed');
    }
    bar.style.width = '0%';
    barBg.appendChild(bar);

    const pctEl = document.createElement('div');
    pctEl.className = 'prob-pct';
    pctEl.textContent = `${Math.round(c.prob * 100)}%`;

    row.appendChild(wordEl);
    row.appendChild(barBg);
    row.appendChild(pctEl);
    probBarsEl.appendChild(row);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.width = `${c.prob * 100}%`;
      });
    });
  });
}

function renderText(text: string, highlightLastWord: boolean = false) {
  if (highlightLastWord && text.length > 0) {
    const lastChar = text[text.length - 1];
    const rest = text.slice(0, -1);
    textContent.innerHTML = `${rest}<span class="word-highlight word-flash">${lastChar}</span><span class="cursor"></span>`;
  } else {
    textContent.innerHTML = `${text}<span class="cursor"></span>`;
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

async function playAnimation() {
  if (isPlaying) return;
  isPlaying = true;
  playBtn.disabled = true;
  animationAbort = new AbortController();
  const signal = animationAbort.signal;

  try {
    while (!signal.aborted) {
      reset();
      await sleep(800, signal);

      for (const step of STEPS) {
        if (signal.aborted) break;

        renderText(step.currentText);
        renderProbBars(step.candidates);
        annotationEl.classList.remove('visible');
        annotationEl.textContent = '';

        await sleep(1200, signal);

        renderProbBars(step.candidates, step.selectedIndex, true);

        if (step.annotation) {
          annotationEl.textContent = step.annotation;
          annotationEl.classList.add('visible');
        }

        await sleep(800, signal);

        const selectedWord = step.candidates[step.selectedIndex].word;
        renderText(step.currentText + selectedWord, true);

        await sleep(600, signal);
      }

      annotationEl.classList.remove('visible');
      await sleep(3000, signal);
    }
  } catch (e) {
    if ((e as DOMException).name !== 'AbortError') throw e;
  } finally {
    isPlaying = false;
    playBtn.disabled = false;
  }
}

function reset() {
  if (animationAbort) {
    animationAbort.abort();
    animationAbort = null;
  }
  isPlaying = false;
  playBtn.disabled = false;
  textContent.innerHTML = '<span class="cursor"></span>';
  probBarsEl.innerHTML = '';
  annotationEl.classList.remove('visible');
  annotationEl.textContent = '';
}

playBtn.addEventListener('click', playAnimation);
resetBtn.addEventListener('click', reset);

setTimeout(playAnimation, 600);
