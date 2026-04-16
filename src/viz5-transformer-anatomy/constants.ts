import type { V3 } from './utils';

// ─── Input / output data ───

export const TOKENS = ['我', '饿', '了', '，', '想', '吃', '一', '碗', '热', '腾腾', '的', '___'];

export const TOKEN_COLORS = [
  '#58C4DD', '#58C4DD', '#58C4DD', '#888888',
  '#83C167', '#83C167', '#83C167', '#83C167',
  '#83C167', '#83C167', '#83C167', '#F4D03F',
];

export const OUTPUT_PROBS = [
  { word: '面',   prob: 0.32 },
  { word: '粥',   prob: 0.21 },
  { word: '饺子', prob: 0.16 },
  { word: '汤',   prob: 0.13 },
  { word: '米饭', prob: 0.10 },
  { word: '拉面', prob: 0.08 },
];

// ─── Vector + row geometry ───

export const VEC_DIM = 7;
export const NUM_SPACING = 0.42;
export const VEC_HEIGHT = VEC_DIM * NUM_SPACING;

export const TOKEN_COUNT = TOKENS.length;
export const TOKEN_SPACING = 1.4;
export const START_X = -((TOKEN_COUNT - 1) * TOKEN_SPACING) / 2;

// ─── Vertical z-levels for the stacked blocks ───

export const EMBED_TOP_Z = 1.5;
export const BLOCK_GAP = 0.6;
export const ATT_TOP_Z = EMBED_TOP_Z - VEC_HEIGHT - BLOCK_GAP;
export const ATT_HEIGHT = VEC_HEIGHT + 1.0;
export const FF_TOP_Z = ATT_TOP_Z - ATT_HEIGHT - BLOCK_GAP;
export const FF_HEIGHT = ATT_HEIGHT;

// ─── Ghost layers in step 3: each replica recedes further into depth ───

export const LAYER_DEPTH_STEP = 3.2;
export const NUM_GHOST_LAYERS = 4;

// ─── Journey waypoints in step 4 ───
// Each entry is a delta from the previous arrow's tip, forming a chain.

export const JOURNEY_WAYPOINTS: {
  delta: V3;
  color: string;
  label: string;
  layerText: string;
}[] = [
  { delta: [ 2.5, 0.3, 1.0], color: '#58C4DD', label: '___（未知）',    layerText: 'Embedding'   },
  { delta: [ 0.8, 1.2, 1.5], color: '#3FCB99', label: '跟「吃」有关',   layerText: '第 1~24 层'  },
  { delta: [-0.5, 0.8, 1.2], color: '#C77DDD', label: '热的食物',       layerText: '第 25~48 层' },
  { delta: [-0.8, 0.6, 1.0], color: '#83C167', label: '一碗热腾腾的…',  layerText: '第 49~72 层' },
  { delta: [-0.4, 0.5, 0.8], color: '#F4D03F', label: '→ 面',          layerText: '第 73~96 层' },
];
