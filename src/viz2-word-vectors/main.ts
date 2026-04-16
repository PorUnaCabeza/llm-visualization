import { ThreeDScene } from 'manim-web';
import { step1Ids } from './steps/step1-ids';
import { step2OneHot } from './steps/step2-onehot';
import { step3Matrix } from './steps/step3-matrix';
import { step4Lookup } from './steps/step4-lookup';
import { step5Cloud } from './steps/step5-cloud';
import { step6Analogy } from './steps/step6-analogy';

// ─── DOM handles ───

const container = document.getElementById('container')!;
const stepInfoEl = document.getElementById('stepInfo')!;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
const prevBtn = document.getElementById('prevBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const trainToggle = document.getElementById('trainToggle') as HTMLButtonElement;

// ─── Scene ───

const scene = new ThreeDScene(container, {
  width: container.clientWidth || window.innerWidth,
  height: container.clientHeight || window.innerHeight,
  backgroundColor: '#ebe5d4',
  phi: 90 * (Math.PI / 180),
  theta: -90,
  distance: 24,
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

// Keyboard pan
const rawControls = scene.orbitControls!.getControls();
rawControls.screenSpacePanning = true;
rawControls.panSpeed = 1.2;
rawControls.listenToKeyEvents(window);
rawControls.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };
rawControls.keyPanSpeed = 15;

// ─── Orchestration ───
//
// Slide-style: each step clears the scene and redraws its own content.
// This gives each concept its own "page".

// Each entry: (scene) => string. step3 is wrapped to read the live `step3Trained` state.
let step3Trained = true;

const steps: Array<(scene: ThreeDScene) => string | Promise<string>> = [
  step1Ids,
  step2OneHot,
  (scene) => step3Matrix(scene, step3Trained),
  step4Lookup,
  step5Cloud,
  step6Analogy,
];

let currentStep = -1;

function syncTrainToggleUI() {
  trainToggle.style.display = currentStep === 2 ? 'inline-block' : 'none';
  trainToggle.classList.toggle('untrained', !step3Trained);
  trainToggle.textContent = step3Trained ? '当前：训练后 ↺' : '当前：训练前 ↺';
}

async function showStep(i: number) {
  if (i < 0 || i >= steps.length) return;
  nextBtn.disabled = true;
  prevBtn.disabled = true;

  scene.clear();
  currentStep = i;
  syncTrainToggleUI();

  try {
    const info = await steps[i](scene);
    stepInfoEl.textContent = info;
  } catch (e) {
    console.error(e);
  }

  nextBtn.disabled = currentStep >= steps.length - 1;
  prevBtn.disabled = currentStep <= 0;
}

async function autoPlay() {
  playBtn.disabled = true;

  for (let i = 0; i < steps.length; i++) {
    await showStep(i);
    if (i < steps.length - 1) {
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
  playBtn.disabled = false;
}

function reset() {
  scene.clear();
  currentStep = -1;
  stepInfoEl.textContent = '';
  nextBtn.disabled = false;
  prevBtn.disabled = true;
  playBtn.disabled = false;
  scene.render();
}

playBtn.addEventListener('click', autoPlay);
nextBtn.addEventListener('click', () => showStep(currentStep + 1));
prevBtn.addEventListener('click', () => showStep(currentStep - 1));
resetBtn.addEventListener('click', reset);
trainToggle.addEventListener('click', () => {
  step3Trained = !step3Trained;
  if (currentStep === 2) showStep(2);
  else syncTrainToggleUI();
});

// Start at step 1 so the user sees something immediately.
showStep(0);
