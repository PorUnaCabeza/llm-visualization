import {
  ThreeDScene,
  ThreeDAxes,
  Sphere,
  Line3D,
  Arrow3D,
  Text,
  FadeIn,
  Create,
} from 'manim-web';

const KING_COLOR = '#F4D03F';
const MAN_COLOR = '#FC6255';
const WOMAN_COLOR = '#83C167';
const QUEEN_COLOR = '#58C4DD';
const DIM_COLOR = '#444444';
const DASH_COLOR = '#555555';

const KING: [number, number, number] = [-2, 2, 1];
const MAN: [number, number, number] = [-2, -1, -1];
const WOMAN: [number, number, number] = [2, -1, 1];
const QUEEN: [number, number, number] = [2, 2, 3];

function toThree(p: [number, number, number]): [number, number, number] {
  return [p[0], p[2], -p[1]];
}

const container = document.getElementById('container')!;
const formulaEl = document.getElementById('formula')!;
const stepInfoEl = document.getElementById('stepInfo')!;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;

const scene = new ThreeDScene(container, {
  width: 900,
  height: 520,
  backgroundColor: '#1c1c1c',
  phi: 65 * (Math.PI / 180),
  theta: -35 * (Math.PI / 180),
  distance: 22,
  fov: 35,
  enableOrbitControls: true,
  orbitControlsOptions: {
    enableDamping: true,
    dampingFactor: 0.08,
  },
});

{
  const rc = scene.orbitControls!.getControls();
  rc.screenSpacePanning = true;
  rc.panSpeed = 1.2;
  rc.listenToKeyEvents(window);
  rc.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };
  rc.keyPanSpeed = 15;
}

let currentStep = -1;
let isAnimating = false;

const allMobjects: any[] = [];

function addAxes() {
  const axes = new ThreeDAxes({
    xRange: [-4, 4, 2],
    yRange: [-4, 4, 2],
    zRange: [-4, 4, 2],
    axisColor: '#444444',
    showTicks: true,
    tickLength: 0.1,
    tipLength: 0.25,
    tipRadius: 0.1,
    shaftRadius: 0.008,
  });
  scene.add(axes);
}

function makeLabel(text: string, pos: [number, number, number], color: string, fontSize = 18) {
  const label = new Text({ text, fontSize, color });
  const tp = toThree(pos);
  label.moveTo([tp[0] + 0.4, tp[1] + 0.4, tp[2]]);
  return label;
}

function makeSphere(pos: [number, number, number], color: string, radius = 0.2, opacity = 0.9) {
  const tp = toThree(pos);
  return new Sphere({ center: tp, radius, color, opacity });
}

async function step0() {
  scene.clear();
  allMobjects.length = 0;
  addAxes();

  const kingS = makeSphere(KING, KING_COLOR, 0.25);
  const kingL = makeLabel('国王 👑', KING, KING_COLOR);

  const manS = makeSphere(MAN, DIM_COLOR, 0.18, 0.3);
  const manL = makeLabel('男人', MAN, DIM_COLOR, 14);

  const womanS = makeSphere(WOMAN, DIM_COLOR, 0.18, 0.3);
  const womanL = makeLabel('女人', WOMAN, DIM_COLOR, 14);

  const queenS = makeSphere(QUEEN, DIM_COLOR, 0.18, 0.3);
  const queenL = makeLabel('女王', QUEEN, DIM_COLOR, 14);

  [kingS, kingL, manS, manL, womanS, womanL, queenS, queenL].forEach((m) => {
    scene.add(m);
    allMobjects.push(m);
  });

  scene.addFixedOrientationMobjects(kingL, manL, womanL, queenL);

  await scene.play(new FadeIn(kingS, { duration: 0.8 }));

  formulaEl.innerHTML = '<span class="king">国王</span>';
  stepInfoEl.textContent = '起点：空间中的"国王"';
}

async function step1() {
  const manS = makeSphere(MAN, MAN_COLOR, 0.22, 0.8);
  const manL = makeLabel('男人 🧔', MAN, MAN_COLOR);
  scene.add(manS, manL);
  scene.addFixedOrientationMobjects(manL);
  allMobjects.push(manS, manL);

  const tp1 = toThree(KING);
  const tp2 = toThree(MAN);
  const arrow = new Arrow3D({
    start: tp1,
    end: tp2,
    color: MAN_COLOR,
    shaftRadius: 0.04,
    tipLength: 0.3,
    tipRadius: 0.12,
  });
  scene.add(arrow);
  allMobjects.push(arrow);
  await scene.play(new Create(arrow, { duration: 1.0 }));

  formulaEl.innerHTML = '<span class="king">国王</span><span class="op">−</span><span class="man">男人</span>';
  stepInfoEl.textContent = '减去"男人"方向 → 剥离"男性"语义';
}

async function step2() {
  const womanS = makeSphere(WOMAN, WOMAN_COLOR, 0.22, 0.8);
  const womanL = makeLabel('女人 👩', WOMAN, WOMAN_COLOR);
  scene.add(womanS, womanL);
  scene.addFixedOrientationMobjects(womanL);
  allMobjects.push(womanS, womanL);

  const tpKing = toThree(KING);
  const tpWoman = toThree(WOMAN);
  const arrow = new Arrow3D({
    start: tpKing,
    end: tpWoman,
    color: WOMAN_COLOR,
    shaftRadius: 0.04,
    tipLength: 0.3,
    tipRadius: 0.12,
  });
  scene.add(arrow);
  allMobjects.push(arrow);
  await scene.play(new Create(arrow, { duration: 1.0 }));

  formulaEl.innerHTML =
    '<span class="king">国王</span><span class="op">−</span><span class="man">男人</span>' +
    '<span class="op">+</span><span class="woman">女人</span>';
  stepInfoEl.textContent = '加上"女人"方向 → 注入"女性"语义';
}

async function step3() {
  const queenS = makeSphere(QUEEN, QUEEN_COLOR, 0.28, 1.0);
  const queenL = makeLabel('女王 👸', QUEEN, QUEEN_COLOR, 20);
  scene.add(queenS, queenL);
  scene.addFixedOrientationMobjects(queenL);
  allMobjects.push(queenS, queenL);

  await scene.play(new FadeIn(queenS, { duration: 0.8 }));

  const dashPoints: [number, number, number][][] = [
    [KING, QUEEN],
    [MAN, WOMAN],
    [KING, MAN],
    [QUEEN, WOMAN],
  ];
  for (const [a, b] of dashPoints) {
    const line = new Line3D({
      start: toThree(a),
      end: toThree(b),
      color: DASH_COLOR,
      lineWidth: 1,
    });
    scene.add(line);
    allMobjects.push(line);
  }

  scene.render();

  formulaEl.innerHTML =
    '<span class="king">国王</span><span class="op">−</span><span class="man">男人</span>' +
    '<span class="op">+</span><span class="woman">女人</span>' +
    '<span class="approx">≈</span><span class="queen">女王</span>';
  stepInfoEl.textContent = '终点恰好落在"女王"附近！平行四边形关系揭示了语义的几何结构';
}

const steps = [step0, step1, step2, step3];

async function nextStep() {
  if (isAnimating) return;
  isAnimating = true;
  nextBtn.disabled = true;

  currentStep++;
  if (currentStep >= steps.length) {
    currentStep = steps.length - 1;
    isAnimating = false;
    nextBtn.disabled = true;
    return;
  }

  try {
    await steps[currentStep]();
  } catch (e) {
    console.error(e);
  }

  isAnimating = false;
  nextBtn.disabled = currentStep >= steps.length - 1;
}

async function autoPlay() {
  if (isAnimating) return;
  playBtn.disabled = true;
  currentStep = -1;

  for (let i = 0; i < steps.length; i++) {
    await nextStep();
    if (i < steps.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  playBtn.disabled = false;
}

function reset() {
  scene.clear();
  allMobjects.length = 0;
  addAxes();
  currentStep = -1;
  formulaEl.innerHTML = '';
  stepInfoEl.textContent = '';
  nextBtn.disabled = false;
  playBtn.disabled = false;
  isAnimating = false;
  scene.render();
}

playBtn.addEventListener('click', autoPlay);
nextBtn.addEventListener('click', nextStep);
resetBtn.addEventListener('click', reset);

setTimeout(autoPlay, 600);
