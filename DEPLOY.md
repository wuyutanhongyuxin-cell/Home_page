# 部署指南 — GitHub Pages

## 前提条件
1. 拥有 GitHub 账号
2. 已创建 GitHub 仓库

## 部署步骤

### 1. 启用 GitHub Pages
1. 进入仓库 Settings → Pages
2. Source 选择 **GitHub Actions**

### 2. 推送代码
```bash
git init
git add .
git commit -m "feat: 初始化学术个人主页"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

### 3. 验证部署
- 进入 Actions 标签页，确认 workflow 运行成功
- 访问 `https://你的用户名.github.io/你的仓库名/`

## 更新内容
1. 修改 `网站内容.xlsx` 或 `网站内容_英文.xlsx`
2. 推送到 main 分支
3. GitHub Actions 自动重新部署

## 本地预览
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve .
```
然后访问 http://localhost:8000

## 注意事项
- 所有资源文件（图片、PDF、Excel）必须放在仓库根目录
- 不需要任何构建工具，纯静态部署
- Excel 文件名不要修改（`网站内容.xlsx` 和 `网站内容_英文.xlsx`）
