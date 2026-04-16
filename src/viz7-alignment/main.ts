export {};

const STAGE_DETAILS = [
  {
    title: '预训练（Pre-training）',
    body: `模型在几十 TB 的网络文本上，通过不断预测下一个词来学习语言的统计规律。<br><br>
<span class="hi">结果是什么？</span> 一个强大的"语言模拟器"——它能补全任何文本，但不知道"有帮助"是什么意思。<br><br>
<span class="note">Karpathy 称之为"做互联网的梦"（dreaming the internet）</span>`,
    list: [
      ['📊', '训练规模：数千亿到数万亿 token'],
      ['💻', '算力：数千块 GPU 训练数周到数月'],
      ['⚠️', '局限：会"补全"有害内容、没有对话意识'],
      ['✅', '优点：形成了对世界知识的广泛表示'],
    ],
  },
  {
    title: '监督微调 SFT（Supervised Fine-Tuning）',
    body: `人工标注者按照"理想助手"的方式写出标准答案，让模型在这批数据上继续训练。<br><br>
<span class="hi">结果是什么？</span> 模型学会了"助手风格"——有结构、有格式、会正面回答问题。<br><br>
<span class="note">通常只需要数万到数十万条标注数据，相比预训练数据小得多</span>`,
    list: [
      ['👤', '标注员按指南写高质量问答对'],
      ['🎯', '继续在 Base Model 上训练（较少步数）'],
      ['⚠️', '局限：回答风格仍可能死板、可能过度顺从'],
      ['✅', '优点：从"补全文本"变成"对话回答"'],
    ],
  },
  {
    title: '人类反馈强化学习 RLHF',
    body: `人类对模型的多个输出进行排序（A > B > C）。先用这些排名训练一个"奖励模型"，再用强化学习（PPO）让主模型最大化奖励分数。<br><br>
<span class="hi">结果是什么？</span> 模型学会了"人类偏好"——有帮助、诚实、无害（Helpful · Honest · Harmless = 3H）。<br><br>
<span class="note">这是 InstructGPT / ChatGPT 的核心突破，论文于 2022 年发表</span>`,
    list: [
      ['🏆', '奖励模型（Reward Model）：从人类排名中学习偏好'],
      ['🔄', 'PPO：强化学习算法，最大化奖励同时保持与 SFT 接近'],
      ['⚠️', '局限：奖励模型可能被"破解"（reward hacking）'],
      ['✅', '优点：对齐了人类价值观，大幅减少有害输出'],
    ],
  },
];

const pipeStages  = document.querySelectorAll<HTMLElement>('.pipe-stage');
const cards       = [
  document.getElementById('card0')!,
  document.getElementById('card1')!,
  document.getElementById('card2')!,
];
const detailTitle    = document.getElementById('detailTitle')!;
const detailBody     = document.getElementById('detailBody')!;
const detailList     = document.getElementById('detailList')!;
const rlhfRankPanel  = document.getElementById('rlhfRankPanel')!;

function activateStage(idx: number) {
  pipeStages.forEach((s, i) => s.classList.toggle('active', i === idx));
  cards.forEach((c, i) => c.classList.toggle('highlight', i === idx));

  const d = STAGE_DETAILS[idx];
  detailTitle.textContent = d.title;
  detailBody.innerHTML = d.body;
  detailList.innerHTML = d.list
    .map(([icon, text]) => `<div class="detail-item"><div class="icon">${icon}</div><div>${text}</div></div>`)
    .join('');

  rlhfRankPanel.classList.toggle('visible', idx === 2);
}

// ─── RLHF ranking sub-panel ───
const RLHF_CANDIDATES: Record<string, string> = {
  A: '听到这个消息我也挺难过的。今晚有空吗？我请你吃那家你最爱的烤肉，吃完再聊聊。',
  B: '失恋是人生常态，时间会冲淡一切。想开点就好。',
  C: '研究表明失恋会激活大脑前扣带回，与生理疼痛共享神经机制。建议保持规律作息和适度运动。',
};
let rankOrder: string[] = ['A', 'B', 'C'];
const rankList  = document.getElementById('rankList')!;
const prefPairs = document.getElementById('prefPairs')!;

function renderRankList() {
  rankList.innerHTML = '';
  rankOrder.forEach((id, idx) => {
    const card = document.createElement('div');
    card.className = 'rank-card';
    if (idx === 0) card.classList.add('is-first');
    if (idx === rankOrder.length - 1) card.classList.add('is-last');
    card.innerHTML = `
      <div class="rank-pos">${idx + 1}</div>
      <div class="rank-text"><b>${id}.</b>${RLHF_CANDIDATES[id]}</div>
      <div class="rank-arrows">
        <button class="rank-arrow" data-dir="up"   data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>▲</button>
        <button class="rank-arrow" data-dir="down" data-idx="${idx}" ${idx === rankOrder.length - 1 ? 'disabled' : ''}>▼</button>
      </div>
    `;
    rankList.appendChild(card);
  });
  rankList.querySelectorAll<HTMLButtonElement>('.rank-arrow').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir!;
      const idx = parseInt(btn.dataset.idx!, 10);
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= rankOrder.length) return;
      [rankOrder[idx], rankOrder[swap]] = [rankOrder[swap], rankOrder[idx]];
      renderRankList();
    });
  });
  let html = '';
  for (let i = 0; i < rankOrder.length; i++) {
    for (let j = i + 1; j < rankOrder.length; j++) {
      html += `<span class="pref-pair">${rankOrder[i]} &gt; ${rankOrder[j]}</span>`;
    }
  }
  prefPairs.innerHTML = html;
}
renderRankList();

pipeStages.forEach((stage, i) => {
  stage.addEventListener('click', () => activateStage(i));
});
cards.forEach((card, i) => {
  card.addEventListener('click', () => activateStage(i));
});

// Auto-cycle through stages every 3.5s on load
let cycleTimer: ReturnType<typeof setTimeout>;
function startCycle() {
  let i = 0;
  activateStage(0);
  cycleTimer = setInterval(() => {
    i = (i + 1) % 3;
    activateStage(i);
  }, 3500);
}

// Stop auto-cycle on any user interaction
let userInteracted = false;
[...pipeStages, ...cards].forEach(el => {
  el.addEventListener('click', () => {
    if (!userInteracted) {
      userInteracted = true;
      clearInterval(cycleTimer);
    }
  });
});

startCycle();
