export {};

// ─── DOM handles ───
const stepInfoEl = document.getElementById('stepInfo')!;
const playBtn    = document.getElementById('playBtn') as HTMLButtonElement;
const prevBtn    = document.getElementById('prevBtn') as HTMLButtonElement;
const nextBtn    = document.getElementById('nextBtn') as HTMLButtonElement;
const resetBtn   = document.getElementById('resetBtn') as HTMLButtonElement;

const sec1 = document.getElementById('sec1')!;
const sec2 = document.getElementById('sec2')!;
const sec3 = document.getElementById('sec3')!;
const sec4 = document.getElementById('sec4')!;
const sections = [sec1, sec2, sec3, sec4];

const STEP_INFO = [
  '模型里有数十亿个参数——就像数十亿个旋钮，初始化时随机设置。',
  '向前传播：输入上文，模型给出每个词的概率。Loss 衡量"预测离正确答案有多远"。',
  '反向传播：用 loss 计算每个旋钮应该转多少——让正确答案的概率变高一点。重复数十万次。',
  '训练结束：旋钮转到了合适的位置，模型从输出乱码变成了输出连贯文本。',
];

let currentStep = -1;
let isAnimating = false;
let animAbort: AbortController | null = null;

// ─── Helpers ───

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')); });
  });
}

function showSection(idx: number) {
  sections.forEach((s, i) => {
    s.classList.toggle('active', i === idx);
    s.style.display = i === idx ? 'block' : 'none';
  });
}

function updateNav() {
  prevBtn.disabled = currentStep <= 0;
  nextBtn.disabled = currentStep >= sections.length - 1;
  stepInfoEl.textContent = currentStep >= 0 ? `第 ${currentStep + 1} / ${sections.length} 步　${STEP_INFO[currentStep]}` : '';
}

// ─── Step 1: Knob grid ───

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return ((s >>> 0) / 0xffffffff);
  };
}

function buildKnobGrid(containerId: string, count = 256) {
  const grid = document.getElementById(containerId)!;
  grid.innerHTML = '';
  const rng = seededRng(42);
  for (let i = 0; i < count; i++) {
    const knob = document.createElement('div');
    knob.className = 'knob';
    const tick = document.createElement('div');
    tick.className = 'tick';
    const angle = rng() * 240 - 120; // -120° to +120°
    tick.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    knob.appendChild(tick);
    grid.appendChild(knob);
  }
}

async function animateKnobsRandom(containerId: string, signal: AbortSignal) {
  const knobs = document.getElementById(containerId)!.querySelectorAll<HTMLElement>('.knob');
  const rng = seededRng(99);
  // stagger random animation
  for (let i = 0; i < knobs.length; i += 4) {
    if (signal.aborted) return;
    for (let j = i; j < Math.min(i + 4, knobs.length); j++) {
      const k = knobs[j];
      const tick = k.querySelector<HTMLElement>('.tick')!;
      const angle = rng() * 240 - 120;
      tick.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    }
    await sleep(20, signal);
  }
}

async function runStep1(signal: AbortSignal) {
  buildKnobGrid('knobGrid');
  // animate once to show they're all random and different
  await sleep(600, signal);
  await animateKnobsRandom('knobGrid', signal);
}

// ─── Step 2: Forward pass + loss curve ───

async function runStep2(signal: AbortSignal) {
  // highlight tokens sequentially
  const toks = ['tok1','tok2','tok3','tok4','tok5'];
  for (const id of toks) {
    if (signal.aborted) return;
    document.getElementById(id)!.classList.add('active');
    await sleep(200, signal);
  }
  await sleep(300, signal);

  // show prediction bars — initial wrong distribution
  const bars: [string, number, boolean][] = [
    ['山', 3,  true],
    ['城', 8,  false],
    ['庙', 22, false],
  ];
  for (const [word, pct, isCorrect] of bars) {
    if (signal.aborted) return;
    const bar = document.getElementById(`bar${word}`)!;
    const pctEl = document.getElementById(`pct${word}`)!;
    bar.style.width = `${pct}%`;
    pctEl.textContent = `${pct}%`;
    if (isCorrect) {
      bar.classList.add('correct');
      bar.classList.remove('predicted');
    }
    await sleep(150, signal);
  }

  // correct answer has low prob
  const barCorrect = document.getElementById('barCorrect')!;
  const pctCorrect = document.getElementById('pctCorrect')!;
  barCorrect.style.width = '3%';
  pctCorrect.textContent = '3%';

  await sleep(600, signal);

  // show loss value
  const lossValue = document.getElementById('lossValue')!;
  lossValue.textContent = '3.51';
  lossValue.style.color = '#FC6255';

  await sleep(400, signal);

  // draw loss curve
  drawLossCurve(3.51, 0);
}

function drawLossCurve(currentLoss: number, progress: number) {
  const canvas = document.getElementById('lossCurveCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // axes
  ctx.strokeStyle = '#bfb6a0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 10);
  ctx.lineTo(30, H - 20);
  ctx.lineTo(W - 10, H - 20);
  ctx.stroke();

  // axis labels
  ctx.fillStyle = '#888';
  ctx.font = '10px sans-serif';
  ctx.fillText('loss', 2, 14);
  ctx.fillText('训练步数 →', W - 60, H - 4);

  // draw the curve: exponential decay shape
  const steps = 200;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // loss from ~3.5 → ~0.8 with exponential decay + noise
    const noise = (Math.sin(i * 7.3) * 0.05 + Math.cos(i * 3.1) * 0.04) * (1 - t * 0.8);
    const l = 0.8 + (3.5 - 0.8) * Math.exp(-t * 3.5) + noise;
    const x = 30 + (t * (W - 40));
    const y = (H - 20) - ((3.8 - l) / 3.5) * (H - 30);
    pts.push([x, y]);
  }

  // full curve dim
  ctx.strokeStyle = '#bfb6a0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
  ctx.stroke();

  // progress highlight
  const progressPts = pts.slice(0, Math.floor(progress * pts.length) + 1);
  if (progressPts.length > 1) {
    ctx.strokeStyle = '#FC6255';
    ctx.lineWidth = 2;
    ctx.beginPath();
    progressPts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.stroke();

    // current dot
    const last = progressPts[progressPts.length - 1];
    ctx.beginPath();
    ctx.arc(last[0], last[1], 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FC6255';
    ctx.fill();
  }

  // target zone
  ctx.fillStyle = 'rgba(131,193,103,0.1)';
  ctx.fillRect(W * 0.7, (H - 20) - (2.7 / 3.5) * (H - 30), W * 0.3, (H - 20) - ((H - 20) - (2.7 / 3.5) * (H - 30)));
  ctx.fillStyle = '#888';
  ctx.font = '9px sans-serif';
  ctx.fillText('目标区', W * 0.72, (H - 20) - (2.5 / 3.5) * (H - 30) - 4);
}

// ─── Step 3: Backprop knob animation ───

const LOSS_START = 3.51;
const LOSS_END   = 0.85;
const TOTAL_STEPS_SHOWN = 300_000;

function setStep3Progress(t: number) {
  // t ∈ [0, 1]
  const loss = LOSS_END + (LOSS_START - LOSS_END) * Math.exp(-t * 3.5);
  const stepNum = Math.floor(t * TOTAL_STEPS_SHOWN);
  const lossEl = document.getElementById('s3pLoss')!;
  const stepEl = document.getElementById('s3pStep')!;
  const barEl  = document.getElementById('s3pBar')!;
  lossEl.textContent = loss.toFixed(2);
  stepEl.textContent = stepNum.toLocaleString();
  lossEl.classList.toggle('mid', loss <= 2.0 && loss > 1.2);
  lossEl.classList.toggle('low', loss <= 1.2);
  // bar shrinks as loss decreases (relative to span)
  const frac = (loss - LOSS_END) / (LOSS_START - LOSS_END);
  barEl.style.width = `${(0.05 + 0.95 * frac) * 100}%`;
}

async function runStep3(signal: AbortSignal) {
  buildKnobGrid('knobGrid2');
  const knobs = document.getElementById('knobGrid2')!.querySelectorAll<HTMLElement>('.knob');
  const rng = seededRng(77);
  const N = knobs.length;

  // Pre-assign gradient magnitude tiers: ~20% large, ~60% medium, ~20% small
  // (real gradients follow a similar skewed distribution)
  const gradScale: number[] = [];
  knobs.forEach((k, i) => {
    const r = rng();
    let tier: 'grad-high' | 'grad-med' | 'grad-low';
    let scale: number;
    if (r < 0.18) { tier = 'grad-high'; scale = 1.0; }
    else if (r < 0.78) { tier = 'grad-med';  scale = 0.3; }
    else               { tier = 'grad-low';  scale = 0.06; }
    k.classList.add(tier);
    gradScale.push(scale);
  });

  setStep3Progress(0);

  const rng2 = seededRng(42);
  const ripples = 3;
  const totalIters = ripples * N;
  let iterCount = 0;
  for (let r = 0; r < ripples; r++) {
    if (signal.aborted) return;
    for (let i = 0; i < N; i++) {
      if (signal.aborted) return;
      const k = knobs[i];
      const tick = k.querySelector<HTMLElement>('.tick')!;
      k.classList.remove('updating', 'done');
      void k.offsetWidth; // force reflow
      k.classList.add('updating');
      const delta = (rng2() - 0.5) * 50 * gradScale[i];
      const cur = parseFloat(tick.style.transform.match(/rotate\(([^d]+)deg\)/)?.[1] || '0');
      tick.style.transform = `translateX(-50%) rotate(${cur + delta}deg)`;
      iterCount++;
      // throttle DOM updates: every 6 iters is enough for smooth visible motion
      if (iterCount % 6 === 0) setStep3Progress(iterCount / totalIters);
      await sleep(12, signal);
      k.classList.remove('updating');
      k.classList.add('done');
    }
    await sleep(300, signal);
  }

  // final: snap to fully trained
  setStep3Progress(1);
  knobs.forEach(k => {
    k.classList.remove('updating');
    k.classList.add('done');
  });
}

// ─── Orchestration ───

async function showStep(idx: number) {
  if (idx < 0 || idx >= sections.length) return;

  // Abort any in-flight animation so navigation is always responsive
  if (animAbort) { animAbort.abort(); animAbort = null; }
  isAnimating = false;

  isAnimating = true;
  animAbort = new AbortController();
  const signal = animAbort.signal;

  prevBtn.disabled = true;
  nextBtn.disabled = true;

  currentStep = idx;
  showSection(idx);
  updateNav();

  try {
    if (idx === 0) await runStep1(signal);
    if (idx === 1) await runStep2(signal);
    if (idx === 2) await runStep3(signal);
    // step 4 (compare) needs no animation
  } catch (e) {
    if ((e as DOMException).name !== 'AbortError') throw e;
  }

  isAnimating = false;
  updateNav();
}

let isPlaying = false;

async function doAutoPlay() {
  if (isPlaying) return;
  isPlaying = true;
  playBtn.disabled = true;
  currentStep = -1;
  try {
    for (let i = 0; i < sections.length; i++) {
      await showStep(i);
      if (i < sections.length - 1) await sleep(2800);
    }
  } finally {
    isPlaying = false;
    playBtn.disabled = false;
  }
}

function doReset() {
  if (animAbort) { animAbort.abort(); animAbort = null; }
  isAnimating = false;
  isPlaying = false;
  currentStep = -1;
  playBtn.disabled = false;
  prevBtn.disabled = true;
  nextBtn.disabled = false;
  stepInfoEl.textContent = '';
  sections.forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });

  // reset step 2 DOM state
  ['tok1','tok2','tok3','tok4','tok5'].forEach(id => {
    document.getElementById(id)?.classList.remove('active');
  });
  ['山','城','庙'].forEach(w => {
    const bar = document.getElementById(`bar${w}`);
    if (bar) bar.style.width = '0%';
    const pct = document.getElementById(`pct${w}`);
    if (pct) pct.textContent = '0%';
  });
  const lv = document.getElementById('lossValue');
  if (lv) { lv.textContent = '—'; lv.style.color = '#FC6255'; }
  const bc = document.getElementById('barCorrect');
  if (bc) bc.style.width = '0%';
  const pc = document.getElementById('pctCorrect');
  if (pc) pc.textContent = '0%';

  // reset step-3 progress widget
  const s3pStep = document.getElementById('s3pStep');
  const s3pLoss = document.getElementById('s3pLoss');
  const s3pBar  = document.getElementById('s3pBar');
  if (s3pStep) s3pStep.textContent = '0';
  if (s3pLoss) { s3pLoss.textContent = LOSS_START.toFixed(2); s3pLoss.classList.remove('mid', 'low'); }
  if (s3pBar)  s3pBar.style.width = '100%';
}

playBtn.addEventListener('click', doAutoPlay);
prevBtn.addEventListener('click', () => showStep(currentStep - 1));
nextBtn.addEventListener('click', () => showStep(currentStep + 1));
resetBtn.addEventListener('click', doReset);

// start at step 1 automatically
showStep(0);
