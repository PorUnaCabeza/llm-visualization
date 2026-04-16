import { Text, type ThreeDScene } from 'manim-web';
import { START_X, TOKEN_COLORS, TOKEN_SPACING, TOKENS } from '../constants';
import { t } from '../utils';

// ─── Step 0: Tokens — text gets split into word pieces ───

export async function step0Tokens(scene: ThreeDScene): Promise<string> {
  scene.clear();

  TOKENS.forEach((tok, i) => {
    const x = START_X + i * TOKEN_SPACING;
    const label = new Text({ text: tok, fontSize: 16, color: TOKEN_COLORS[i] });
    label.moveTo(t([x, 0, 4]));
    scene.addFixedOrientationMobjects(label);
    scene.add(label);
  });

  scene.render();
  return '第1步：输入文本被拆分成 Token（词元）';
}
