# Academic Homepage | 学术个人主页

<div align="center">

**Excel 即 CMS** — 零代码搭建你的学术个人主页

[![Deploy to GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github)](https://pages.github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![No Build Tools](https://img.shields.io/badge/Build-None%20Required-brightgreen)]()

[在线演示](#在线演示) | [快速开始](#-快速开始) | [填写指南](#-excel-填写指南) | [部署教程](#-部署到-github-pages) | [English](#english)

</div>

---

## 这是什么？

一个**纯静态**的学术个人主页模板。你不需要写任何代码——只需要编辑 Excel 表格，网站内容就会自动更新。

```
编辑 Excel 表格  →  推送到 GitHub  →  网站自动更新
```

### 核心特性

| 特性 | 说明 |
|------|------|
| **Excel 驱动** | 所有内容写在 Excel 里，网页自动读取并渲染 |
| **中英双语** | 一键切换中文/英文，各自独立的 Excel 数据源 |
| **零构建** | 没有 npm、没有 webpack、没有任何构建步骤 |
| **自动部署** | 推送到 GitHub 即自动发布到 GitHub Pages |
| **智能渲染** | 自动识别文本、图片、PDF 并选择最佳展示方式 |
| **响应式** | 自适应桌面端、平板、手机 |
| **学术风格** | 灰色系极简设计，毛玻璃卡片，浮动光球动画 |

---

## 项目结构

```
Home_page/
│
├── index.html              # 页面骨架（通常不需要修改）
├── style.css               # 样式文件（通常不需要修改）
├── script.js               # 核心逻辑（通常不需要修改）
│
├── 网站内容.xlsx            # 中文内容（你需要编辑这个！）
├── 网站内容_英文.xlsx        # 英文内容（你需要编辑这个！）
├── photo.jpg               # 你的个人照片（替换这个！）
│
├── .github/
│   └── workflows/
│       └── deploy-pages.yml # 自动部署配置
│
├── DEPLOY.md               # 部署指南
└── README.md               # 本文件
```

> **你只需要关心 3 个文件**：两个 Excel + 一张照片。其他文件不需要修改。

---

## 快速开始

### 第一步：Fork 或克隆本仓库

```bash
git clone https://github.com/wuyutanhongyuxin-cell/Home_page.git
cd Home_page
```

### 第二步：替换个人信息

1. **修改姓名占位符**

   打开 `index.html`，将 `[姓名]` 替换为你的真实姓名：

   ```html
   <!-- 第 6 行 -->
   <title>你的姓名 | 个人主页</title>

   <!-- 第 23 行 -->
   <div class="brand" data-i18n="siteName">你的姓名 | 个人主页</div>
   ```

   打开 `script.js`，将 i18n 中的占位符替换：

   ```javascript
   // 第 20 行
   siteName: '你的姓名 | 个人主页',

   // 第 32 行
   siteName: 'Your Name | Personal Homepage',
   ```

2. **替换照片**

   将你的个人照片命名为 `photo.jpg`，放在项目根目录。

3. **编辑 Excel**（详见下方 [Excel 填写指南](#-excel-填写指南)）

### 第三步：本地预览

```bash
# 方式一：Python（推荐）
python -m http.server 8000

# 方式二：Node.js
npx serve .
```

打开浏览器访问 `http://localhost:8000`

### 第四步：推送上线

```bash
git add .
git commit -m "feat: 初始化我的学术主页"
git push origin main
```

等待 1-2 分钟，访问 `https://你的用户名.github.io/Home_page/` 即可看到你的主页。

---

## Excel 填写指南

### 基本规则

```
每个 Sheet（工作表）  →  网页上的一个 Tab 页签
每列的第一行          →  模块标题（卡片标题）
该列剩余行            →  模块内容
```

**图示**：

```
┌─────────────────────────────────────────────────────────────┐
│  Excel Sheet: "主页"                                         │
│                                                             │
│    A列(基本信息)    B列(研究方向)    C列(教育经历)    ...     │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │ 基本信息      │ 研究方向：    │ 教育经历      │  ← 第1行   │
│  ├──────────────┼──────────────┼──────────────┤   (标题)    │
│  │ 个人简介文字   │ 方向1描述     │ 博士经历      │  ← 第2行   │
│  │ photo.jpg    │ 方向2描述     │ 硕士经历      │  ← 第3行   │
│  │              │              │ 本科经历      │  ← 第4行   │
│  └──────────────┴──────────────┴──────────────┘             │
│                                                             │
│  ↓ 渲染为网页 ↓                                              │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ 基本信息  │  │ 研究方向  │  │ 教育经历  │  ← 三张卡片      │
│  │ 简介+照片 │  │ 方向1    │  │ 博/硕/本  │                  │
│  └──────────┘  │ 方向2    │  └──────────┘                  │
│                └──────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

### 内容类型自动识别

在 Excel 单元格中填写不同内容，网页会自动选择最佳展示方式：

| 你在单元格填写 | 网页展示效果 | 示例 |
|--------------|------------|------|
| 普通文字 | 渲染为文本段落 | `我是一名研究员` |
| 图片文件名 | 显示为图片 | `photo.jpg` |
| PDF 文件名 | 渲染 PDF 预览 | `论文.pdf` |
| 含 `\textbf{}` 的文字 | **加粗**显示 | `\textbf{张三}，论文标题` |
| 含 `\textit{}` 的文字 | *斜体*显示 | `\textit{Nature}, 2024` |
| 含 `\href{}{}` 的文字 | 显示为超链接 | `\href{https://xxx.com}{点击查看}` |
| `https://` 开头的 URL | 自动变成可点击链接 | `https://github.com/xxx` |
| `>` 开头的文字 | 显示为引用块 | `>这是一段引用` |

### 支持的文件格式

| 类型 | 格式 | 说明 |
|------|------|------|
| 图片 | `.png` `.jpg` `.jpeg` `.webp` `.gif` `.bmp` `.svg` | 放在项目根目录 |
| 文档 | `.pdf` | 会用 pdf.js 渲染为 Canvas 预览 |

### 模板 Sheet 结构

你的 Excel 模板已包含以下 Sheet，可以按需修改：

**中文版 `网站内容.xlsx`**：

| Sheet 名称 | 用途 | 列数 |
|-----------|------|------|
| 主页 | 基本信息、研究方向、教育经历、发表、项目、授课、学生 | 7 |
| 研究方向1 | 第一个研究方向的详细介绍 | 3 |
| 研究方向2 | 第二个研究方向的详细介绍 | 2 |
| 数据模型开源 | 开源数据集和模型 | 3 |
| 平台系统 | 预留（目前为空） | 0 |

**英文版 `网站内容_英文.xlsx`**：结构完全对应，内容为英文。

> **提示**：你可以自由增删 Sheet、增减列数。网页会自动适配任意结构。

---

## 部署到 GitHub Pages

### 方式一：自动部署（推荐）

本项目已内置 GitHub Actions 工作流，推送到 `main` 分支即自动部署。

**首次设置**：

1. 进入 GitHub 仓库 → **Settings** → **Pages**
2. **Source** 选择 **GitHub Actions**
3. 推送代码到 `main` 分支
4. 等待 Actions 运行完成（约 1-2 分钟）
5. 访问 `https://你的用户名.github.io/Home_page/`

### 方式二：本地预览

```bash
# Python 方式
python -m http.server 8000

# Node.js 方式
npx serve .

# 然后浏览器打开 http://localhost:8000
```

> **注意**：直接双击 `index.html` 打开**无法正常加载** Excel 文件（浏览器安全策略限制）。必须通过 HTTP 服务器访问。

---

## 更新内容

日常更新只需 3 步：

```bash
# 1. 编辑 Excel 文件（用 WPS / Excel / LibreOffice 打开编辑）
# 2. 提交更改
git add 网站内容.xlsx 网站内容_英文.xlsx
git commit -m "update: 更新网站内容"

# 3. 推送
git push
```

网站会在 1-2 分钟内自动更新。

---

## 自定义样式

如果你想调整网站的视觉效果，编辑 `style.css` 中的 CSS 变量即可：

```css
:root {
  --bg: #ececec;           /* 背景色 */
  --ink: #222222;          /* 主文字色 */
  --muted: #5a5a5a;        /* 次要文字色 */
  --card: rgba(255,255,255,0.86);  /* 卡片背景 */
  --accent: #3f3f3f;       /* 强调色 */
}
```

### 响应式断点

| 屏幕宽度 | 布局 |
|---------|------|
| > 960px | 左侧导航栏 + 右侧内容区（桌面端） |
| 680-960px | 导航栏变为水平标签（平板） |
| < 680px | 单栏布局，全部堆叠（手机） |

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| HTML/CSS/JS | - | 页面结构、样式、逻辑 |
| [SheetJS](https://sheetjs.com/) | 0.18.5 | 解析 Excel 文件 |
| [pdf.js](https://mozilla.github.io/pdf.js/) | 3.11.174 | 渲染 PDF 预览 |
| [Google Fonts](https://fonts.google.com/) | - | Noto Sans SC + Space Grotesk |
| [GitHub Actions](https://github.com/features/actions) | - | 自动部署到 GitHub Pages |

所有依赖通过 CDN 加载，**无需安装任何东西**。

---

## 常见问题

<details>
<summary><b>Q: 页面显示"自动读取表格失败"怎么办？</b></summary>

这通常是因为直接双击 `index.html` 打开了文件。浏览器出于安全策略，禁止本地文件通过 `fetch` 读取其他文件。

**解决方案**：使用 HTTP 服务器打开：
```bash
python -m http.server 8000
# 然后访问 http://localhost:8000
```
</details>

<details>
<summary><b>Q: 可以增加更多 Sheet（标签页）吗？</b></summary>

可以！直接在 Excel 中新建 Sheet 即可。网页会自动为每个 Sheet 生成一个标签页。Sheet 的名称就是标签页的标题。
</details>

<details>
<summary><b>Q: 图片和 PDF 放在哪里？</b></summary>

放在项目根目录（和 `index.html` 同级）。然后在 Excel 单元格中填写文件名即可，如 `photo.jpg` 或 `论文.pdf`。
</details>

<details>
<summary><b>Q: 如何修改网站标题和图标？</b></summary>

- **标题**：编辑 `index.html` 第 6 行的 `<title>` 标签
- **品牌名**：编辑 `index.html` 第 23 行的 `.brand` 内容
- **i18n**：同步修改 `script.js` 中 `i18n` 对象的 `siteName`
</details>

<details>
<summary><b>Q: 支持哪些文字格式标记？</b></summary>

| 标记 | 效果 | 示例 |
|------|------|------|
| `\textbf{文字}` | **加粗** | `\textbf{张三}` |
| `\textit{文字}` | *斜体* | `\textit{Nature}` |
| `\href{URL}{文字}` | [超链接] | `\href{https://xxx.com}{点击}` |
| `>文字` | 引用块 | `>这是引用` |
| `https://...` | 自动链接 | 直接粘贴 URL |
</details>

<details>
<summary><b>Q: 如何让中英文版本使用不同的资源文件？</b></summary>

目前两个语言版本共享同一套资源文件（图片/PDF）。如果需要不同资源，将英文版资源用不同文件名保存，然后在英文 Excel 中填写对应文件名即可。
</details>

---

## 致谢

本项目基于 [CissyDuan/Homepage](https://github.com/CissyDuan/Homepage) 构建，感谢原作者的开源贡献。

---

<a name="english"></a>

## English

### What is this?

A **zero-code** academic homepage template. Just edit Excel spreadsheets — your website updates automatically.

### Quick Start

1. Clone this repo
2. Replace `[姓名]` / `[Name]` placeholders with your actual name in `index.html` and `script.js`
3. Replace `photo.jpg` with your photo
4. Edit `网站内容.xlsx` (Chinese) and `网站内容_英文.xlsx` (English) with your content
5. Push to GitHub — the site deploys automatically via GitHub Pages

### How it works

```
Edit Excel  →  Push to GitHub  →  Site auto-updates
```

Each **Sheet** in Excel becomes a **Tab** on the website. Each **column** becomes a **card**. The first row is the card title; remaining rows are the content. Images (`.jpg`, `.png`, etc.) and PDFs (`.pdf`) are auto-detected and rendered appropriately.

### Supported markup in Excel cells

| Markup | Result |
|--------|--------|
| `\textbf{text}` | **Bold** |
| `\textit{text}` | *Italic* |
| `\href{url}{text}` | [Hyperlink] |
| `>text` | Blockquote |
| `https://...` | Auto-linked URL |

---

<div align="center">

**Made with Excel + GitHub Pages**

</div>
