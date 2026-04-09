/* ==========================================
   学术个人主页 — 核心脚本
   Excel 驱动 CMS：读取 Excel → 解析 → 渲染
   布局：固定侧边栏 + 单页滚动
   ========================================== */

// DOM 元素引用
const langToggle = document.getElementById('langToggle');
const sidebarContentEl = document.getElementById('sidebarContent');
const sectionsEl = document.getElementById('sections');
const loadStatusEl = document.getElementById('loadStatus');

let currentLang = 'zh';

// Excel 文件路径（中/英）
const workbookPathByLang = {
  zh: './网站内容.xlsx',
  en: './网站内容_英文.xlsx',
};

// 缓存已加载的工作簿，避免重复请求
const workbookCache = { zh: null, en: null };

// 中英文 UI 文案
const i18n = {
  zh: {
    siteName: '德胜 | 个人主页',
    loading: '正在读取网站内容.xlsx ...',
    loaded: '已根据网站内容表格自动生成页面。',
    emptyModule: '该模块暂无内容。',
    fileType: '文件',
    brokenAsset: '资源未找到：',
    parseFail: '自动读取表格失败。请以本地服务器方式打开页面后重试。',
    pdfLoading: 'PDF加载中...',
    pdfFail: 'PDF渲染失败：',
  },
  en: {
    siteName: 'Desheng | Homepage',
    loading: 'Loading workbook ...',
    loaded: 'Page generated from workbook.',
    emptyModule: 'No content in this section yet.',
    fileType: 'File',
    brokenAsset: 'Asset not found: ',
    parseFail: 'Failed to load workbook. Please open via a local HTTP server.',
    pdfLoading: 'Loading PDF...',
    pdfFail: 'PDF render failed: ',
  },
};

// 支持的文件扩展名
const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'];
const docExts = ['pdf'];

/* ========== 工具函数 ========== */

function t(key) {
  return i18n[currentLang][key] || key;
}

function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (i18n[lang][key]) el.textContent = i18n[lang][key];
  });
  langToggle.textContent = lang === 'zh' ? 'EN' : '中文';
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function normalizeAssetName(name) {
  if (!name) return '';
  let raw = String(name).trim().replace(/^\.\//, '');
  const lower = raw.toLowerCase();
  const known = [...imageExts, ...docExts];
  for (const ext of known) {
    if (lower.endsWith(`.${ext}`)) return raw;
    if (lower.endsWith(ext) && !lower.endsWith(`.${ext}`)) {
      return `${raw.slice(0, -ext.length)}.${ext}`;
    }
  }
  return raw;
}

function detectAssetType(value) {
  const name = normalizeAssetName(value);
  const lower = name.toLowerCase();
  if (imageExts.some((ext) => lower.endsWith(`.${ext}`))) return { type: 'image', path: name };
  if (docExts.some((ext) => lower.endsWith(`.${ext}`))) return { type: 'document', path: name };
  return { type: 'text', path: '' };
}

// LaTeX 风格内联标记 → HTML
function convertInlineMarkup(text) {
  let html = text
    .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
    .replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '<a href="$1" target="_blank" rel="noopener">$2</a>');
  html = html.replace(
    /(^|[\s(])((https?:\/\/)[^\s<]+)/g,
    '$1<a href="$2" target="_blank" rel="noopener">$2</a>'
  );
  return html;
}

/* ========== 内容节点构建 ========== */

function buildTextNode(value) {
  const wrapper = document.createElement('div');
  wrapper.className = 'content-item text-item';
  const lines = String(value).split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return wrapper;
  for (const line of lines) {
    if (line.startsWith('>')) {
      const quote = document.createElement('blockquote');
      quote.innerHTML = convertInlineMarkup(line.replace(/^>\s?/, ''));
      wrapper.appendChild(quote);
    } else {
      const p = document.createElement('p');
      p.innerHTML = convertInlineMarkup(line);
      wrapper.appendChild(p);
    }
  }
  return wrapper;
}

function buildImageNode(path) {
  const item = document.createElement('div');
  item.className = 'content-item media-item';
  const img = document.createElement('img');
  img.className = 'content-image';
  img.src = path;
  img.alt = '';
  img.loading = 'lazy';
  img.addEventListener('error', () => {
    item.classList.add('asset-error');
    item.textContent = `${t('brokenAsset')}${path}`;
  });
  item.appendChild(img);
  return item;
}

/* ========== PDF 渲染 ========== */

async function renderPdfCanvases(pdfPath, hostEl) {
  if (!window.pdfjsLib) return false;
  try {
    const pdf = await window.pdfjsLib.getDocument({
      url: encodeURI(pdfPath),
      disableWorker: true,
    }).promise;
    hostEl.innerHTML = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(1.6, 780 / base.width);
      const vp = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.className = 'content-pdf-canvas';
      canvas.width = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      hostEl.appendChild(canvas);
    }
    return true;
  } catch (err) {
    return false;
  }
}

function renderPdfFallback(pdfPath, hostEl) {
  hostEl.innerHTML = '';
  const obj = document.createElement('object');
  obj.className = 'content-pdf-object';
  obj.type = 'application/pdf';
  obj.data = `${encodeURI(pdfPath)}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  const p = document.createElement('p');
  p.className = 'muted';
  p.textContent = `${t('pdfFail')}${pdfPath}`;
  obj.appendChild(p);
  hostEl.appendChild(obj);
}

function buildPdfNode(path) {
  const item = document.createElement('div');
  item.className = 'content-item media-item';
  const viewer = document.createElement('div');
  viewer.className = 'content-pdf';
  viewer.textContent = t('pdfLoading');
  item.appendChild(viewer);
  renderPdfCanvases(path, viewer).then((ok) => {
    if (!ok) renderPdfFallback(path, viewer);
  });
  return item;
}

/* ========== Excel 解析 ========== */

function parseWorkbook(workbook) {
  const sheets = workbook.SheetNames || [];
  const pages = [];
  sheets.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;
    const table = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
    if (!table.length) {
      pages.push({ name: sheetName, modules: [] });
      return;
    }
    const headerRow = table[0] || [];
    const colCount = Math.max(...table.map((r) => r.length), 0);
    const modules = [];
    for (let c = 0; c < colCount; c++) {
      const title = String(headerRow[c] || '').trim();
      const values = [];
      for (let r = 1; r < table.length; r++) {
        values.push(table[r]?.[c] ?? '');
      }
      if (!title && values.every((v) => isBlank(v))) continue;
      modules.push({ title: title || `${t('fileType')} ${c + 1}`, values });
    }
    pages.push({ name: sheetName, modules });
  });
  return pages;
}

/* ========== 社交链接图标检测 ========== */

function detectSocialType(url) {
  const lower = url.toLowerCase();
  if (lower.includes('github.com')) return { icon: 'fa-brands fa-github', label: 'GitHub' };
  if (lower.includes('scholar.google')) return { icon: 'ai ai-google-scholar ai-lg', label: 'Google Scholar' };
  if (lower.includes('linkedin.com')) return { icon: 'fa-brands fa-linkedin', label: 'LinkedIn' };
  if (lower.includes('orcid.org')) return { icon: 'ai ai-orcid ai-lg', label: 'ORCID' };
  if (lower.includes('twitter.com') || lower.includes('x.com')) return { icon: 'fa-brands fa-x-twitter', label: 'X' };
  if (lower.includes('researchgate.net')) return { icon: 'ai ai-researchgate ai-lg', label: 'ResearchGate' };
  if (lower.includes('zhihu.com')) return { icon: 'fa-brands fa-zhihu', label: '知乎' };
  return { icon: 'fa-solid fa-link', label: 'Link' };
}

/* ========== 侧边栏渲染 ========== */
// 解析「基本信息」列，按内容类型智能分配：头像/姓名/身份/院校/邮箱/社交图标

function renderSidebar(infoModule) {
  sidebarContentEl.innerHTML = '';
  if (!infoModule || !infoModule.values.length) return;

  const values = infoModule.values.filter((v) => !isBlank(v));

  // 分类各项内容
  let photo = null;
  let emailAddr = null;
  const socialLinks = [];
  const textItems = []; // 按顺序: 姓名、身份、院校

  for (const val of values) {
    const str = String(val).trim();

    // 图片文件 → 头像
    const asset = detectAssetType(str);
    if (asset.type === 'image') {
      photo = asset.path;
      continue;
    }

    // 含 @ 且非 \href → 邮箱
    if (str.includes('@') && !str.startsWith('\\href')) {
      emailAddr = str;
      continue;
    }

    // \href{url}{text} → 判断是社交链接还是普通文本（如院校链接）
    const hrefMatch = str.match(/\\href\{([^}]+)\}\{([^}]+)\}/);
    if (hrefMatch) {
      const [, url, text] = hrefMatch;
      const social = detectSocialType(url);
      if (social.label !== 'Link') {
        socialLinks.push({ url, text, ...social });
      } else if (textItems.length < 3) {
        textItems.push(str); // 前三项视为姓名/身份/院校
      } else {
        socialLinks.push({ url, text, icon: 'fa-solid fa-link', label: text });
      }
      continue;
    }

    textItems.push(str);
  }

  const name = textItems[0] || '';
  const identity = textItems[1] || '';
  const affiliation = textItems[2] || '';

  // 构建侧边栏 DOM
  if (photo) {
    const img = document.createElement('img');
    img.className = 'profile-avatar';
    img.src = photo;
    img.alt = name;
    sidebarContentEl.appendChild(img);
  }

  if (name) {
    const h1 = document.createElement('h1');
    h1.className = 'profile-name';
    h1.textContent = name;
    sidebarContentEl.appendChild(h1);
  }

  if (identity) {
    const p = document.createElement('p');
    p.className = 'profile-title';
    p.textContent = identity;
    sidebarContentEl.appendChild(p);
  }

  if (affiliation) {
    const p = document.createElement('p');
    p.className = 'profile-affiliation';
    p.innerHTML = convertInlineMarkup(affiliation);
    sidebarContentEl.appendChild(p);
  }

  if (emailAddr) {
    const p = document.createElement('p');
    p.className = 'profile-email';
    const a = document.createElement('a');
    a.href = `mailto:${emailAddr}`;
    a.textContent = emailAddr;
    p.appendChild(a);
    sidebarContentEl.appendChild(p);
  }

  if (socialLinks.length) {
    const div = document.createElement('div');
    div.className = 'social-links';
    socialLinks.forEach((link) => {
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.title = link.label;
      const i = document.createElement('i');
      i.className = link.icon;
      a.appendChild(i);
      div.appendChild(a);
    });
    sidebarContentEl.appendChild(div);
  }
}

/* ========== 内容区渲染 ========== */
// 将第一列以外的所有列渲染为滚动 section，并生成侧边栏锚点导航

function renderSections(modules) {
  sectionsEl.innerHTML = '';

  const nav = document.createElement('nav');
  nav.className = 'sidebar-nav';

  modules.forEach((mod, index) => {
    const sectionId = `section-${index}`;

    const section = document.createElement('section');
    section.className = 'content-section';
    section.id = sectionId;

    const h2 = document.createElement('h2');
    h2.textContent = mod.title;
    section.appendChild(h2);

    const validValues = mod.values.filter((v) => !isBlank(v));
    if (!validValues.length) {
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = t('emptyModule');
      section.appendChild(p);
    } else {
      validValues.forEach((value) => {
        const { type, path } = detectAssetType(value);
        if (type === 'image') section.appendChild(buildImageNode(path));
        else if (type === 'document') section.appendChild(buildPdfNode(path));
        else section.appendChild(buildTextNode(value));
      });
    }

    sectionsEl.appendChild(section);

    // 侧边栏导航链接
    const a = document.createElement('a');
    a.href = `#${sectionId}`;
    a.textContent = mod.title;
    nav.appendChild(a);
  });

  // 追加导航到侧边栏
  const existingNav = sidebarContentEl.querySelector('.sidebar-nav');
  if (existingNav) existingNav.remove();
  sidebarContentEl.appendChild(nav);
}

/* ========== 页面渲染入口 ========== */
// 单页设计：第一个 Sheet → 第一列为侧边栏，其余列为内容 section

function renderPage(pages) {
  const page = pages[0];
  if (!page || !page.modules.length) return;

  const [infoModule, ...contentModules] = page.modules;
  renderSidebar(infoModule);
  renderSections(contentModules);
}

/* ========== 状态与加载 ========== */

function setStatus(messageKey, isError = false) {
  loadStatusEl.textContent = t(messageKey);
  loadStatusEl.classList.toggle('error', isError);
  loadStatusEl.hidden = false;
}

async function loadWorkbookFromPath(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  return XLSX.read(buffer, { type: 'array' });
}

async function loadAndRenderForLanguage(lang) {
  setStatus('loading');
  try {
    let workbook = workbookCache[lang];
    if (!workbook) {
      workbook = await loadWorkbookFromPath(workbookPathByLang[lang]);
      workbookCache[lang] = workbook;
    }
    const pages = parseWorkbook(workbook);
    renderPage(pages);
    loadStatusEl.hidden = true;
  } catch (err) {
    setStatus('parseFail', true);
  }
}

/* ========== 事件绑定 ========== */

langToggle.addEventListener('click', async () => {
  const target = currentLang === 'zh' ? 'en' : 'zh';
  applyLanguage(target);
  await loadAndRenderForLanguage(target);
});

window.addEventListener('DOMContentLoaded', async () => {
  applyLanguage('zh');
  if (!window.XLSX) {
    setStatus('parseFail', true);
    return;
  }
  await loadAndRenderForLanguage('zh');
});
