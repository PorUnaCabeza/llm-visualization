# LLM 可视化

3Blue1Brown 风格的大语言模型可视化动画，配合演讲科普使用。基于 [manim-web](https://github.com/nickaein/manim-web) 构建，支持可交互操作。

## 包含的可视化

1. **下一个词预测循环** — 逐词出现的文本 + 实时概率分布柱状图
2. **词向量空间** — 50 个中文词在高维空间中的投影，可交互 3D 散点图
3. **King − Man + Woman = Queen** — 词向量算术运算的分步动画
4. **Temperature 对输出的影响** — 拖动滑块实时观察概率分布变化
5. **Transformer 结构解剖** — 3D 拆解 LLM 内部结构的分步动画

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```
