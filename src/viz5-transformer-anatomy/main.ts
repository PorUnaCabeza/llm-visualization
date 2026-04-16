import { ThreeDScene } from 'manim-web';
import { step0Tokens } from './steps/step0-tokens';
import { step1Attention } from './steps/step1-attention';
import { step2Feedforward } from './steps/step2-feedforward';
import { step3Repetitions } from './steps/step3-repetitions';
import { step4Journey } from './steps/step4-journey';
import { step5Output } from './steps/step5-output';

// ─── DOM handles ───

const container = document.getElementById('container')!;
const stepInfoEl = document.getElementById('stepInfo')!;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;

// ─── Scene ───

const scene = new ThreeDScene(container, {
  width: container.clientWidth || window.innerWidth,
  height: container.clientHeight || window.innerHeight,
  backgroundColor: '#0a0a0a',
  phi: 90 * (Math.PI / 180),
  theta: -90,
  distance: 28,
  fov: 36,
  enableOrbitControls: true,
  orbitControlsOptions: {
    enableDamping: true,
    dampingFactor: 0.08,
  },
});

window.addEventListener('resize', () => {
  scene.resize(
    container.clientWidth || window.innerWidth,
    container.clientHeight || window.innerHeight,
  );
});

// Per-step camera framing. Steps 0–3 are the wide vertical transformer stack
// (camera back, target shifted down); steps 4–5 are the journey + output, a
// more compact scene → pull the camera in closer with a higher target.
type Framing = { target: [number, number, number]; distance: number };
const FRAMING_BY_STEP: Framing[] = [
  { target: [0, -4, 0], distance: 28 },  // step0: tokens
  { target: [0, -4, 0], distance: 28 },  // step1: attention
  { target: [0, -4, 0], distance: 28 },  // step2: feedforward
  { target: [0, -4, 0], distance: 28 },  // step3: repetitions
  { target: [0,  3, 0], distance: 18 },  // step4: journey
  { target: [0,  3, 0], distance: 18 },  // step5: output
];
scene.orbitControls!.setTarget(FRAMING_BY_STEP[0].target);

// Arrow keys pan the camera; damping is already enabled above.
const rawControls = scene.orbitControls!.getControls();
rawControls.screenSpacePanning = true;
rawControls.panSpeed = 1.2;
rawControls.listenToKeyEvents(window);
rawControls.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };
rawControls.keyPanSpeed = 15;

// ─── Orchestration ───

const steps = [
  step0Tokens,
  step1Attention,
  step2Feedforward,
  step3Repetitions,
  step4Journey,
  step5Output,
];

let currentStep = -1;

async function nextStep() {
  nextBtn.disabled = true;

  currentStep++;
  if (currentStep >= steps.length) {
    currentStep = steps.length - 1;
    nextBtn.disabled = true;
    return;
  }

  try {
    scene.orbitControls!.setTarget(TARGETS_BY_STEP[currentStep]);
    const info = await steps[currentStep](scene);
    stepInfoEl.textContent = info;
  } catch (e) {
    console.error(e);
  }

  nextBtn.disabled = currentStep >= steps.length - 1;
}

async function autoPlay() {
  playBtn.disabled = true;
  currentStep = -1;
  scene.clear();

  for (let i = 0; i < steps.length; i++) {
    await nextStep();
    if (i < steps.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  playBtn.disabled = false;
}

function reset() {
  scene.clear();
  currentStep = -1;
  stepInfoEl.textContent = '';
  nextBtn.disabled = false;
  playBtn.disabled = false;
  scene.render();
}

playBtn.addEventListener('click', autoPlay);
nextBtn.addEventListener('click', nextStep);
resetBtn.addEventListener('click', reset);

// Manual control only — no auto-play on page load.
scene.render();
