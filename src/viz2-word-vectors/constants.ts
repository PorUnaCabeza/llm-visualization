import type { V3 } from './utils';

export const VOCAB_SIZE = 50000;
export const D_MODEL = 768;   // real Transformer embedding dim
export const D_VIS = 8;       // columns shown in the matrix view

export interface DemoWord {
  word: string;
  id: number;
  category: string;
  color: string;
}

// Small curated demo vocab. IDs are plausible-looking (not real BPE indices).
export const DEMO_WORDS: DemoWord[] = [
  { word: '猫',   id: 2031,  category: '动物', color: '#1F6F89' },
  { word: '狗',   id: 2034,  category: '动物', color: '#1F6F89' },
  { word: '国王', id: 8472,  category: '人物', color: '#5C3F70' },
  { word: '女王', id: 8473,  category: '人物', color: '#5C3F70' },
  { word: '男人', id:  305,  category: '人物', color: '#5C3F70' },
  { word: '女人', id:  306,  category: '人物', color: '#5C3F70' },
  { word: '跑步', id: 5211,  category: '动作', color: '#3F7A26' },
  { word: '快乐', id: 9830,  category: '情感', color: '#FC6255' },
  { word: '中国', id:  127,  category: '国家', color: '#C97B11' },
  { word: '数字', id: 15230, category: '抽象', color: '#888888' },
];

// Category palette for the cloud step.
export const CATEGORY_COLORS: Record<string, string> = {
  '动物': '#1F6F89',
  '国家': '#C97B11',
  '食物': '#B98A0E',
  '情感': '#FC6255',
  '职业': '#5C3F70',
  '其他': '#888888',
};

// Words used in the cloud step (kept plentiful so clusters look real).
export const CLOUD_WORDS: { category: string; words: string[]; cx: number; cy: number; cz: number; spread: number }[] = [
  { category: '动物', cx: -4, cy:  3, cz:  2, spread: 1.2, words: ['猫', '狗', '虎', '狮', '鹰', '鱼', '蛇', '马', '鸡', '牛'] },
  { category: '国家', cx:  4, cy: -2, cz:  1, spread: 1.4, words: ['中国', '日本', '美国', '法国', '德国', '巴西', '印度', '韩国'] },
  { category: '食物', cx: -3, cy: -3, cz: -2, spread: 1.1, words: ['米饭', '面条', '寿司', '披萨', '汉堡', '饺子', '拉面'] },
  { category: '情感', cx:  3, cy:  3, cz: -1, spread: 1.2, words: ['开心', '悲伤', '愤怒', '恐惧', '惊讶', '喜欢', '讨厌'] },
  { category: '职业', cx:  0, cy: -4, cz:  3, spread: 1.3, words: ['医生', '律师', '教师', '程序员', '设计师', '厨师', '工程师'] },
];

// Hand-placed so king - man + woman = queen exactly (parallelogram).
export const ANALOGY_POSITIONS: Record<string, V3> = {
  '男人':   [ 0.0,   0.0,  0.0],
  '国王':   [ 1.6,   0.0,  2.0],
  '女人':   [-2.6,   0.0,  0.0],
  '女王':   [-1.0,   0.0,  2.0],
};
