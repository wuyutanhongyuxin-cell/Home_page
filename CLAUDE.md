# CLAUDE.md — 学术个人主页（Academic Homepage）

> 把这个文件放在项目根目录。Claude Code 每次启动自动读取。

---

## [项目专属区域]

### 项目名称
学术个人主页（Academic Homepage）

### 一句话描述
Excel 驱动的静态学术个人主页，支持中英双语，部署于 GitHub Pages。核心理念"Excel 即 CMS"——网站内容完全由 Excel 表格驱动。

### 技术栈
- **语言**：纯静态 HTML / CSS / JavaScript，无构建工具
- **Excel 解析**：SheetJS (xlsx@0.18.5) — CDN 加载
- **PDF 渲染**：pdf.js (pdfjs-dist@3.11.174) — CDN 加载
- **字体**：Google Fonts — Noto Sans SC + Space Grotesk
- **部署**：GitHub Pages（通过 GitHub Actions 自动部署）
- **无 node_modules、无 package.json、无构建步骤**

### 项目结构
```
profile_learned_duan/
├── CLAUDE.md                # 本文件，AI 编程规范
├── tasks/
│   └── todo.md              # 任务追踪
├── index.html               # 页面骨架，极简 HTML
├── style.css                # 全部样式，灰色系学术风格
├── script.js                # 核心逻辑：读取 Excel → 解析 → 动态渲染
├── photo.jpg                # 个人照片（占位）
├── 网站内容.xlsx             # 中文版数据源
├── 网站内容_英文.xlsx         # 英文版数据源
├── DEPLOY.md                # GitHub Pages 部署指南
└── .github/
    └── workflows/
        └── deploy-pages.yml # 自动部署工作流
```

### 当前阶段
**搭建阶段** — 正在 1:1 复制 [CissyDuan/Homepage](https://github.com/CissyDuan/Homepage) 的全部功能和视觉效果，替换为新用户的占位信息。详见 `tasks/todo.md`。

---

## 参考仓库
- **原仓库**：https://github.com/CissyDuan/Homepage
- **目标**：99% 相似度，100% 功能还原
- **原站核心文件**：index.html (1,588B) / style.css (5,340B) / script.js (11,910B)

---

## 数据流架构
1. 页面加载 → `fetch` 读取 `网站内容.xlsx`
2. SheetJS 解析工作簿 → 每个 Sheet 成为一个 Tab 标签页
3. 每列 → 一个模块卡片（列标题=模块标题，列数据=模块内容）
4. 智能识别内容类型（图片/PDF/文本）并渲染

### 内容类型识别 (detectAssetType)
- **图片**: `.png/.jpg/.jpeg/.webp/.gif/.bmp/.svg` → `<img>` 标签
- **PDF**: `.pdf` → pdf.js Canvas 渲染，失败回退 `<object>` 嵌入
- **文本**: 其他 → 段落渲染，支持内联标记

### 文本标记支持 (convertInlineMarkup)
- `\textbf{text}` → `<strong>`
- `\textit{text}` → `<em>`
- `\href{url}{text}` → `<a>` 链接
- 自动识别 `http://` / `https://` URL
- `>` 开头 → `<blockquote>` 引用块

### 中英双语机制
- `langToggle` 按钮切换 `currentLang` (zh/en)
- 加载对应 Excel 文件重新渲染全部页面
- `workbookCache` 缓存已加载的工作簿

---

## 多 Agent 协作规则

### 角色分工
| Agent | 角色 | 职责 |
|-------|------|------|
| **Sonnet 4.6** | 快速实现者 | 生成初版代码（HTML/CSS/JS），承担主要编码工作 |
| **Codex 5.4high** | 代码审查官 | 审查代码质量、与原仓库对比、提出替代方案 |
| **Opus 4.6** | 最终裁决者 | 综合两方意见、做最终决策、确保 100% 效果还原 |

### 辩论流程
```
Sonnet 生成代码 → Codex 审查+替代方案 → Opus 裁决 → 循环直至通过
```

### 调用规则
- Sonnet：通过 Claude Code 内置 Agent (model: sonnet) 调用
- Codex：通过 `/codex` skill 调用 Codex CLI
- Opus：主控 Agent，直接在主对话中执行

---

## 开发者背景

我不是专业开发者，使用 Claude Code 辅助编程。请：
- 代码加中文注释，关键逻辑额外解释
- 遇到复杂问题先给方案让我确认，不要直接大改
- 报错时解释原因 + 修复方案，不要只贴代码
- 优先最简实现，不要过度工程化

---

## 上下文管理规范（核心）

### 文件行数硬限制

| 文件类型 | 最大行数 | 超限动作 |
|----------|----------|----------|
| 单个源代码文件 | **200 行** | 立即拆分为多个文件 |
| 单个模块（目录内所有文件） | **2000 行** | 拆分为子模块 |
| 配置文件 | **100 行** | 拆分为多个配置文件 |

**注意**：原仓库 script.js 约 330 行，在搭建阶段允许保持原样以确保 1:1 还原。搭建完成后再考虑拆分。

### 每个目录必须有 README.md
当一个目录下有 3 个以上文件时，创建 `README.md`。

---

## Sub-Agent 并行调度规则

### 并行派遣条件
- 3+ 个不相关任务
- 不操作同一个文件
- 无输入输出依赖

### 顺序派遣条件
- B 需要 A 的输出
- 操作同一文件
- 范围不明确

---

## 编码规范

### 错误处理
- 所有外部调用（fetch、文件加载）必须 try-catch
- 失败时 graceful degradation：显示友好提示，不崩溃

### 依赖管理
- **不要自行引入新依赖**。需要新库时先问我
- 仅允许 CDN 加载：SheetJS + pdf.js + Google Fonts
- 绝不在代码中硬编码任何密钥

---

## Git 规范

### Commit 信息格式
```
<类型>: <一句话描述>

类型：feat(新功能) | fix(修复) | refactor(重构) | docs(文档) | chore(杂项)
```

### 每次 commit 前
- 确认没有把临时文件提交进去
- 确认页面能正常加载

---

## 沟通规范

### 当我说以下关键词时
| 我说 | 你做 |
|------|------|
| "清理一下" | 执行项目健康度检查 |
| "现在到哪了" | 总结当前进度，参考 tasks/todo.md |
| "省着点" | 减少 token 消耗，回复更简短 |
| "全力跑" | 并行执行，不用每步确认 |
