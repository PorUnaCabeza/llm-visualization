# LLM 可视化项目 — 需求与进展记录

## 项目背景

为周末 AI 圆桌科普演讲制作可交互的 3D 可视化网页，风格参考 3Blue1Brown，技术栈为 `manim-web` (TypeScript) + Vite。

---

## 可视化总览

| 编号 | 名称 | 路径 | 状态 |
|------|------|------|------|
| Viz1 | 下一个词预测循环 | `src/viz1-next-word/` | ✅ 完成 |
| Viz2 | 词向量空间（3D 散点） | `src/viz2-word-vectors/` | ✅ 完成 |
| Viz3 | King − Man + Woman ≈ Queen | `src/viz3-vector-arithmetic/` | ✅ 完成 |
| Viz4 | Temperature 交互调节 | `src/viz4-temperature/` | ✅ 完成 |
| Viz5 | Transformer 解剖（核心） | `src/viz5-transformer-anatomy/` | ✅ 完成，持续迭代中 |

---

## Viz5: Transformer 解剖 — 详细需求演化

### 初始需求

用户提供了两张 3Blue1Brown 截图（token embedding 流经 transformer、注意力连线），要求做一个 3D 可视化模型解释 LLM 的内部构成。

### 六步骤结构（最终版）

| 步骤 | 内容 | 说明 |
|------|------|------|
| Step 0 | Token 展示 | 输入文本"我饿了，想吃一碗热腾腾的___"拆分为 12 个 token |
| Step 1 | Attention（含 Embedding） | Token → 向量（Embedding）→ 进入 Attention 透明盒子，弧线表示 token 间交流 |
| Step 2 | Feedforward | 每个向量独立通过同一个神经网络，输出新向量 |
| Step 3 | 重复层 × 96 | Attention + Feedforward 结构重复 96 层，展示 LLM 深度 |
| Step 4 | 向量旅程（Journey） | "___" 的向量在每一层被逐步修正，首尾相连的折线走势 |
| Step 5 | 概率输出 | 最终向量 → Softmax → 概率分布（面 32%、粥 21%…） |

---

## 迭代记录（按时间线）

### 第 1 轮：基础 4 个可视化
- 创建了 Viz1-4，深色背景 `#1c1c1c`，3Blue1Brown 标志蓝 `#58C4DD`

### 第 2 轮：3D 坐标轴
- **用户反馈**："词向量空间，都看不到坐标轴"
- **修复**：给 Viz2、Viz3 添加 `ThreeDAxes`

### 第 3 轮：Viz5 初版
- **用户需求**：提供 3B1B 截图，要求做 Transformer 解剖 3D 模型
- **参考图理解**（见下方详细分析）
- 创建了 Token → Embedding → Attention → Feedforward → 输出 的 5 步动画

### 第 4 轮：Attention/Feedforward 内部细节
- **用户反馈**："Attention 块和 Feedforward 块根本看不出来里面有东西"
- **参考图 3**：展示 Attention 盒子内部的密集蓝/红连线
- **修复**：Attention 内部加白色节点 + 密集蓝红连线；Feedforward 改为开放式 3 层神经网络

### 第 5 轮：矩阵在 Attention 里
- **用户反馈**：提供新参考图，"矩阵是不是应该就在 Attention 里面"
- **参考图 4**：清晰展示向量列（带数字）排在 Attention 盒子内部，通过半透明玻璃可见
- **修复**：移除内部节点和连线，Attention 盒子内直接显示带括号的数字向量列

### 第 6 轮：相机控制
- **用户反馈**："我没办法上下左右拖动"
- **修复**：启用 `screenSpacePanning`，添加方向键支持（WASD 风格）

### 第 7 轮：重复层
- **用户反馈**："最终是要经过很多层这样的结构吗，体现一下"
- **修复**：新增 step3_repetitions，4 个 ghost layer 沿 Y 轴递退

### 第 8 轮：Embedding 放入 Attention
- **用户反馈**："Embedding 应该放在 Attention 里"
- **修复**：合并 step1_embeddings → step1_attention，Token 通过箭头直接进入 Attention 盒子并在内部显示向量

### 第 9 轮：透明度修复
- **用户反馈**："Attention 盒子不是透明的，我看不到里面的内容！"
- **修复**：移除实体 Box3D 填充，仅保留 wireframe

### 第 10 轮：重复层内容
- **用户反馈**："重复层里也要体现出跟第一层一样的内容，现在重复层里都是空的"
- **修复**：Ghost 层内添加向量列（每 4 个 token）和 NN 切片

### 第 11 轮：性能优化（第一波）
- **问题**："卡死了？""现在渲染会卡住"
- **根因**：`Text` 对象过多 + 密集 Line3D
- **修复**：精简 ghost 层（减少 Text，用 addBracketOutline 替代完整向量列，缩减 NN 规模）

### 第 12 轮：Feedforward 剖面
- **用户反馈**：提供新参考图，"展示出前馈神经网络的一个剖面"
- **参考图 5**：展示一个神经网络的横截面（输入层 → 隐藏层 → 输出层），每个 token 独立通过
- **修复**：每个 token 有独立的 NN slice（3 层球体 + 蓝红连线），输出向量列在 FF 盒子下方

### 第 13 轮：输出位置
- **用户反馈**："最终的结果，应该在第一层还是最后一层体现出来呢"
- **修复**：输出移到最后一个 ghost layer 末端

### 第 14 轮：层间流动连线
- **用户反馈**："保留吧，但是体现一下 Feedforward 输出就是下一层 Attention 的输入"
- 添加了金色弧线连接 FF 输出到下一层 Attention
- **后续反馈**："这个线太丑了，删掉吧" → 已删除

### 第 15 轮：注意力弧线全层覆盖
- **用户反馈**："注意力弧线，现在只有第一层有，给每层都体现出来"
- **修复**：`addArcLine` 加入 yOffset 参数，所有 ghost 层都有弧线

### 第 16 轮：换例句 + 性能优化（第二波）
- **用户反馈**："从前有一座山…这个例子不是很好，换成一个更容易理解的"
- 换为"我饿了，想吃一碗热腾腾的___"
- 进一步精简 ghost 层对象数量

### 第 17 轮：完整度与折线走势
- **用户需求**：
  1. 第 1 层和最后一层恢复完整参数量（体现 LLM 复杂性）
  2. 2~N-1 层可以删减
  3. Journey 阶段改为首尾相连的折线走势（参考 3B1B）
  4. 关闭自动播放
- **修复**：
  - 第 1 层 Attention：每个 token 1~2 条弧线 + 白点
  - 第 1 层 Feedforward：5→7→5 神经元密连接
  - 最后一层 ghost 同第 1 层待遇：完整向量列 + 完整 NN + 完整弧线
  - 中间层：1-2 层中等精简，3 层最简
  - Journey：delta 模式折线，每段箭头从上一段终点出发，加淡白总向量线
  - 移除 `setTimeout(autoPlay, 600)`

---

## 对 3Blue1Brown 参考图的理解

### 参考图 1 & 2：Transformer 全局架构
**来源**：3Blue1Brown "Transformers" / "Large Language Models explained briefly" 系列截图

**视觉要素**：
- Token 在顶部横排，每个 token 下方挂一个**竖直的数字向量列**（方括号包裹，内有 `+1.3`, `-7.8` 等实际数值）
- 向量列就是 Embedding 的结果
- 最后一个 token 的向量列底部引出箭头 → 概率分布柱状图（water 51%, river 19%…）
- 整体暗色背景，科技感

**对应实现**：Step 0（Token 展示）+ Step 1（Attention 含 Embedding）+ Step 5（概率输出）

### 参考图 3：Attention 内部连线
**视觉要素**：
- Attention 是一个半透明灰色盒子
- 内部有向量列（可透视）
- 向量列之间有**密集的蓝色（正权重）和红色（负权重）细线**穿梭，表示注意力权重
- 盒子上方有**彩色弧线**连接不同 token，表示 token 之间互相"交流"
- 白色小圆点标记弧线端点

**我的理解**：这表现的是多头自注意力（Multi-Head Self-Attention）的本质——每个 token 的向量都在和其他所有 token 的向量做加权求和，蓝线/红线的密度和颜色深浅代表权重大小和正负。弧线是一种抽象化的表达，实际底层是 Q·K^T 矩阵乘法得到的 attention score。

**对应实现**：Step 1 的弧线 + 向量列

### 参考图 4：向量列清晰可见
**视觉要素**：
- Attention 盒子玻璃质感极强，内部的数字向量列**完全清晰可见**
- 每个向量列用方括号框住，每个数字单独一行
- 某个特定 token（如 "bank"）的向量列用**高亮色括号**标注
- 盒子标注 "Attention"

**我的理解**：3B1B 强调的是"向量是核心载体"。Attention 操作的输入和输出都是向量，盒子只是一个"加工车间"，你要能透过盒子看到这些向量在里面被加工。高亮括号引导观众关注特定 token 的向量变化。

**对应实现**：Step 1 的 wireframe-only 盒子 + 内部 `addVectorColumn` + 高亮括号

### 参考图 5：Feedforward 神经网络剖面
**视觉要素**：
- 展示的是一个标准前馈神经网络的横截面
- 多层白色球体（神经元）：输入层 → 隐藏层（更宽）→ 输出层
- 层与层之间有蓝色和红色细线连接，密度高
- 每个 token 独立通过同一个网络（不像 Attention 那样跨 token 交流）

**我的理解**：Feedforward 网络是"知识存储器"——它把 Attention 处理后的向量进一步非线性变换。3B1B 用神经元 + 连线的经典可视化方式让观众直观理解"这就是一个神经网络在处理每个位置的向量"。输入层和输出层大小相同（都是 d_model），隐藏层是 4×d_model（更宽），这在可视化中体现为中间层球体更多。

**对应实现**：Step 2 每个 token 的独立 NN slice（5→7→5 球体 + 蓝红连线）

### 参考图 6（隐含）：向量旅程折线
**视觉要素**：
- 3B1B 在讲解 "bank" 这个词的含义演化时，展示了一条**首尾相连的折线路径**
- 每一段代表一组 Transformer 层的处理结果
- 标签标注含义的逐步变化：bank → river bank → beginning of a story → establishing a setting
- 不是从原点辐射的独立箭头，而是 **链式 delta**——前一段的终点就是下一段的起点

**我的理解**：这体现了 Transformer 的"残差连接"本质——每一层不是从零计算，而是在上一层的基础上做增量修正（residual stream）。向量在高维空间中沿一条路径移动，每段移动对应一组层的"理解提升"。折线比独立箭头更准确地表达了这种逐层累积的语义精化过程。

**对应实现**：Step 4 的 `JOURNEY_WAYPOINTS`（delta 模式折线）+ 淡白总向量线

### 第 18 轮：性能优化（第三波）— step3 卡顿
- **用户反馈**："第三步向第四步前进的时候，会卡上十几秒"
- **根因**：`step3_repetitions` 创建了 ~1300+ 个 3D 对象（其中 ~200 个 `Text` 对象，每个需 canvas→纹理→mesh 完整流程）
- **修复**：
  - Ghost 层向量列改用 `addBracketOutline`（0 个 Text），仅第一层保留 1 个完整向量列作为视觉暗示
  - 所有 ghost 层 NN 统一缩减为 3→5→3，每隔 2-3 个 token 才画一组，每节点只画 1 条连线
  - 弧线密度降低（arcStep 从 1→2 / 3→4），每 token 仅 1 条弧线
  - 标签仅在第一和最后 ghost 层显示
  - 每层构建完毕后 `scene.render()` + `await setTimeout(0)` 让出主线程，避免长时间阻塞
  - 总对象数从 ~1300+ 降至 ~300

### 第 19 轮：全屏显示 + 正面视角
- **用户反馈**："显示区域放大到整个屏幕"、"初始放大一些，正面视角"
- **修复**：
  - HTML 布局改为全屏：`html/body` 100% 宽高 + `overflow: hidden`，`#container` 用 `flex: 1` 撑满
  - 移除标题和副标题，控制按钮改为 `position: fixed; bottom: 0` 的半透明浮层（`.overlay`），带渐变背景
  - Scene 初始化宽高改为动态 `container.clientWidth/clientHeight`，添加 `window resize` 监听调用 `scene.resize()`
  - 相机参数：phi 90°（水平正视）、theta 0°（正面）、distance 28→24（拉近）

---

## 关键技术决策

### 性能优化策略
- `Text` 对象是最大性能杀手（每个字都是独立的 Three.js 网格）
- Ghost 层（2~N-1）用 `addBracketOutline`（6 条 Line3D）替代 `addVectorColumn`（6 条 Line3D + N 个 Text）
- NN 切片的神经元和连接数按层级递减
- `addArcLine` 的 segments 在 ghost 层减少到 6 段

### 坐标系转换
`manim-web` 用 `(x, y, z)` 坐标系（y 朝里，z 朝上），但 Three.js 用 `(x, y, z)` 标准系（y 朝上，z 朝外）。通过 `t()` 函数做映射：`t([x, y, z]) = [x, z, -y]`。

### 控制交互
- `OrbitControls` 支持鼠标旋转、滚轮缩放
- `screenSpacePanning = true` 使触控板平移更直观
- 方向键绑定 `ArrowLeft/Up/Right/Down` 用于键盘平移
- 手动 step-by-step 控制（播放全部 / 下一步 / 重置）
