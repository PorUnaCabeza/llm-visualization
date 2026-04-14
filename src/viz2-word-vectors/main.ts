import {
  ThreeDScene,
  ThreeDAxes,
  Sphere,
  Text,
} from 'manim-web';

interface WordData {
  word: string;
  pos: [number, number, number];
  color: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  '动物': '#58C4DD',
  '国家': '#83C167',
  '食物': '#FFFF00',
  '情感': '#FC6255',
  '职业': '#9A72AC',
  '其他': '#CCCCCC',
};

function cluster(cx: number, cy: number, cz: number, spread: number, count: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const phi = Math.PI / 4 + (Math.random() - 0.5) * Math.PI * 0.4;
    const r = spread * (0.5 + Math.random() * 0.5);
    pts.push([
      cx + r * Math.sin(phi) * Math.cos(theta),
      cy + r * Math.sin(phi) * Math.sin(theta),
      cz + r * Math.cos(phi),
    ]);
  }
  return pts;
}

const animalWords = ['猫', '狗', '虎', '狮', '鹰', '鱼', '蛇', '马', '鸡', '牛'];
const countryWords = ['中国', '日本', '美国', '法国', '德国', '巴西', '印度', '韩国'];
const foodWords = ['米饭', '面条', '寿司', '披萨', '汉堡', '饺子', '拉面'];
const emotionWords = ['开心', '悲伤', '愤怒', '恐惧', '惊讶', '喜欢', '讨厌'];
const jobWords = ['医生', '律师', '教师', '程序员', '设计师', '厨师', '工程师'];
const otherWords = ['国王', '女王', '男人', '女人'];

const animalPts = cluster(-4, 3, 2, 1.2, animalWords.length);
const countryPts = cluster(4, -2, 1, 1.4, countryWords.length);
const foodPts = cluster(-3, -3, -2, 1.1, foodWords.length);
const emotionPts = cluster(3, 3, -1, 1.2, emotionWords.length);
const jobPts = cluster(0, -4, 3, 1.3, jobWords.length);
const otherPts = cluster(1, 1, -3, 0.9, otherWords.length);

const wordData: WordData[] = [
  ...animalWords.map((w, i) => ({ word: w, pos: animalPts[i], color: CATEGORY_COLORS['动物'], category: '动物' })),
  ...countryWords.map((w, i) => ({ word: w, pos: countryPts[i], color: CATEGORY_COLORS['国家'], category: '国家' })),
  ...foodWords.map((w, i) => ({ word: w, pos: foodPts[i], color: CATEGORY_COLORS['食物'], category: '食物' })),
  ...emotionWords.map((w, i) => ({ word: w, pos: emotionPts[i], color: CATEGORY_COLORS['情感'], category: '情感' })),
  ...jobWords.map((w, i) => ({ word: w, pos: jobPts[i], color: CATEGORY_COLORS['职业'], category: '职业' })),
  ...otherWords.map((w, i) => ({ word: w, pos: otherPts[i], color: CATEGORY_COLORS['其他'], category: '其他' })),
];

const container = document.getElementById('container')!;
const legendEl = document.getElementById('legend')!;
const autoRotateBtn = document.getElementById('autoRotateBtn') as HTMLButtonElement;

const scene = new ThreeDScene(container, {
  width: 900,
  height: 560,
  backgroundColor: '#1c1c1c',
  phi: 70 * (Math.PI / 180),
  theta: -40 * (Math.PI / 180),
  distance: 28,
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

const axes = new ThreeDAxes({
  xRange: [-6, 6, 2],
  yRange: [-6, 6, 2],
  zRange: [-6, 6, 2],
  axisColor: '#444444',
  showTicks: true,
  tickLength: 0.1,
  tipLength: 0.25,
  tipRadius: 0.1,
  shaftRadius: 0.008,
});
scene.add(axes);

wordData.forEach((wd) => {
  const [x, y, z] = wd.pos;
  const sphere = new Sphere({
    center: [x, z, -y],
    radius: 0.22,
    color: wd.color,
    opacity: 0.9,
  });
  scene.add(sphere);

  const label = new Text({
    text: wd.word,
    fontSize: 14,
    color: wd.color,
  });
  label.moveTo([x + 0.35, z + 0.35, -y]);
  scene.addFixedOrientationMobjects(label);
  scene.add(label);
});

legendEl.innerHTML = Object.entries(CATEGORY_COLORS)
  .map(([cat, col]) => `<div class="legend-item"><div class="legend-dot" style="background:${col}"></div>${cat}</div>`)
  .join('');

let autoRotating = false;
autoRotateBtn.addEventListener('click', () => {
  autoRotating = !autoRotating;
  autoRotateBtn.textContent = autoRotating ? '⏹ 停止旋转' : '⟳ 自动旋转';
  const oc = scene.orbitControls;
  if (oc) {
    oc.setAutoRotate(autoRotating);
    oc.setAutoRotateSpeed(1.5);
    if (autoRotating) {
      function rotateLoop() {
        if (!autoRotating) return;
        oc!.update();
        scene.render();
        requestAnimationFrame(rotateLoop);
      }
      rotateLoop();
    }
  }
});

scene.render();
