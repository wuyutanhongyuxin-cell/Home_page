const langToggle = document.getElementById('langToggle');
const tabsEl = document.getElementById('tabs');
const panelsEl = document.getElementById('panels');
const loadStatusEl = document.getElementById('loadStatus');

let currentLang = 'zh';

const workbookPathByLang = {
  zh: './网站内容.xlsx',
  en: './网站内容_英文.xlsx',
};

const workbookCache = {
  zh: null,
  en: null,
};

const i18n = {
  zh: {
    siteName: '[姓名] | 个人主页',
    loading: '正在读取网站内容.xlsx ...',
    loaded: '已根据网站内容表格自动生成页面。',
    emptySheet: '该切页暂无内容。',
    emptyModule: '该模块暂无内容。',
    fileType: '文件',
    brokenAsset: '资源未找到：',
    parseFail: '自动读取表格失败。请以本地服务器方式打开页面后重试。',
    pdfLoading: 'PDF加载中...',
    pdfFail: 'PDF渲染失败：',
  },
  en: {
    siteName: '[Name] | Personal Homepage',
    loading: 'Loading workbook ...',
    loaded: 'Page generated from workbook.',
    emptySheet: 'No content in this page yet.',
    emptyModule: 'No content in this section yet.',
    fileType: 'File',
    brokenAsset: 'Asset not found: ',
    parseFail: 'Automatic workbook loading failed. Please open this page via a local server and retry.',
    pdfLoading: 'Loading PDF...',
    pdfFail: 'PDF render failed: ',
  },
};

const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'];
const docExts = ['pdf'];

function t(key) {
  return i18n[currentLang][key] || key;
}

function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });

  langToggle.textContent = lang === 'zh' ? 'EN' : '中文';
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function normalizeAssetName(name) {
  if (!name) return '';
  let raw = String(name).trim();
  raw = raw.replace(/^\.\//, '');
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

  if (imageExts.some((ext) => lower.endsWith(`.${ext}`))) {
    return { type: 'image', path: name };
  }

  if (docExts.some((ext) => lower.endsWith(`.${ext}`))) {
    return { type: 'document', path: name };
  }

  return { type: 'text', path: '' };
}

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

function buildTextNode(value) {
  const wrapper = document.createElement('div');
  wrapper.className = 'content-item text-item';

  const lines = String(value)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

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

async function renderPdfCanvases(pdfPath, hostEl) {
  if (!window.pdfjsLib) {
    return false;
  }

  const encodedPath = encodeURI(pdfPath);

  try {
    const loadingTask = window.pdfjsLib.getDocument({
      url: encodedPath,
      disableWorker: true,
    });
    const pdf = await loadingTask.promise;

    hostEl.innerHTML = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1 });
      const maxRenderWidth = 780;
      const scale = Math.min(1.6, maxRenderWidth / baseViewport.width);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.className = 'content-pdf-canvas';
      const ctx = canvas.getContext('2d');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
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

  const fallbackText = document.createElement('p');
  fallbackText.className = 'muted';
  fallbackText.textContent = `${t('pdfFail')}${pdfPath}`;
  obj.appendChild(fallbackText);

  hostEl.appendChild(obj);
}

async function renderPdfAsset(pdfPath, hostEl) {
  const ok = await renderPdfCanvases(pdfPath, hostEl);
  if (!ok) {
    renderPdfFallback(pdfPath, hostEl);
  }
}

function buildPdfNode(path) {
  const item = document.createElement('div');
  item.className = 'content-item media-item';

  const viewer = document.createElement('div');
  viewer.className = 'content-pdf';
  viewer.textContent = t('pdfLoading');

  item.appendChild(viewer);
  renderPdfAsset(path, viewer);

  return item;
}

function createModule(title, values) {
  const card = document.createElement('article');
  card.className = 'card module-card';

  const h3 = document.createElement('h3');
  h3.textContent = title || t('fileType');
  card.appendChild(h3);

  const body = document.createElement('div');
  body.className = 'module-body';

  const validValues = values.filter((v) => !isBlank(v));
  if (!validValues.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = t('emptyModule');
    body.appendChild(empty);
    card.appendChild(body);
    return card;
  }

  const mediaColumn = document.createElement('div');
  mediaColumn.className = 'media-float';

  const textFlow = document.createElement('div');
  textFlow.className = 'text-flow';

  let mediaCount = 0;
  let textCount = 0;

  validValues.forEach((value) => {
    const { type, path } = detectAssetType(value);

    if (type === 'image') {
      mediaColumn.appendChild(buildImageNode(path));
      mediaCount += 1;
    } else if (type === 'document') {
      mediaColumn.appendChild(buildPdfNode(path));
      mediaCount += 1;
    } else {
      textFlow.appendChild(buildTextNode(value));
      textCount += 1;
    }
  });

  if (mediaCount && textCount) {
    body.classList.add('with-media-text');
    body.appendChild(mediaColumn);
    body.appendChild(textFlow);
  } else if (mediaCount) {
    body.appendChild(mediaColumn);
  } else {
    body.appendChild(textFlow);
  }

  card.appendChild(body);
  return card;
}

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
    const colCount = Math.max(...table.map((row) => row.length), 0);

    const modules = [];
    for (let c = 0; c < colCount; c += 1) {
      const title = String(headerRow[c] || '').trim();
      const values = [];

      for (let r = 1; r < table.length; r += 1) {
        values.push(table[r]?.[c] ?? '');
      }

      if (!title && values.every((v) => isBlank(v))) {
        continue;
      }
      modules.push({ title: title || `${t('fileType')} ${c + 1}`, values });
    }

    pages.push({ name: sheetName, modules });
  });

  return pages;
}

function switchTab(targetId) {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach((tab) => {
    const selected = tab.dataset.tab === targetId;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
  });

  panels.forEach((panel) => {
    const show = panel.id === targetId;
    panel.classList.toggle('active', show);
    panel.hidden = !show;
  });
}

function renderPages(pages) {
  tabsEl.innerHTML = '';
  panelsEl.innerHTML = '';

  pages.forEach((page, index) => {
    const tabId = `panel-${index}`;

    const tab = document.createElement('button');
    tab.className = 'tab';
    tab.dataset.tab = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.textContent = page.name;
    tab.addEventListener('click', () => switchTab(tabId));
    tabsEl.appendChild(tab);

    const panel = document.createElement('article');
    panel.id = tabId;
    panel.className = 'panel';
    panel.setAttribute('role', 'tabpanel');
    panel.hidden = true;

    if (!page.modules.length) {
      const emptyCard = document.createElement('section');
      emptyCard.className = 'card';
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = t('emptySheet');
      emptyCard.appendChild(p);
      panel.appendChild(emptyCard);
    } else {
      const grid = document.createElement('section');
      grid.className = `grid ${index === 0 ? 'home-stack' : 'dynamic-grid'}`;

      page.modules.forEach((mod) => {
        grid.appendChild(createModule(mod.title, mod.values));
      });

      panel.appendChild(grid);
    }

    panelsEl.appendChild(panel);
  });

  if (pages.length) {
    switchTab('panel-0');
  }
}

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
    renderPages(pages);
    loadStatusEl.hidden = true;
  } catch (err) {
    setStatus('parseFail', true);
  }
}

langToggle.addEventListener('click', async () => {
  const targetLang = currentLang === 'zh' ? 'en' : 'zh';
  applyLanguage(targetLang);
  await loadAndRenderForLanguage(targetLang);
});

window.addEventListener('DOMContentLoaded', async () => {
  applyLanguage('zh');

  if (!window.XLSX) {
    setStatus('parseFail', true);
    return;
  }

  await loadAndRenderForLanguage('zh');
});
