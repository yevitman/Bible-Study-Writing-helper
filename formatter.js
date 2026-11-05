// 원고 서식 자동 적용기 엔진 (Original Code 100% Faithful Implementation)

let currentFormatterTab = 'docs';
let formatterImageMap = new Map();
let formatterImageCounter = 0;
const FORMATTER_IMAGE_TOKEN_RE = /\[\[\[IMG_(\d+)\]\]\]/g;

// 성경 본문 및 신앙고백 원문 주황색 (#E65100)
const BIBLE_COLOR = '#E65100';
const VERSE_NUM_COLOR = '#E65100';

const formatterKeys = { 
  docs: 'manuscript_formatter_v17_docs', 
  blog: 'manuscript_formatter_v17_blog' 
};
const formatterFormatKeys = { 
  docs: 'manuscript_formatter_v17_docs_formatted', 
  blog: 'manuscript_formatter_v17_blog_formatted' 
};

const formatterProfiles = {
  docs: { body: '11pt', line: '1.25', gap: '0pt', title: '18pt', h1: '16pt', h2: '14pt', h3: '13pt', h4: '9pt', bible: '9pt', indent: '0.5in' },
  blog: { body: '10pt', line: '1.5', gap: '0pt', title: '18pt', h1: '16pt', h2: '14pt', h3: '12pt', h4: '9pt', bible: '9pt', indent: '0pt' }
};

let formatterToastTimeout = null;
function setFormatterStatus(message, isWarningOrError = false, type = 'success') {
  const statusToast = document.getElementById('statusToast');
  const statusText = document.getElementById('statusText');
  if (!statusToast || !statusText) return;

  if (!message) {
    statusToast.className = 'status-toast';
    statusToast.style.display = 'none';
    return;
  }
  statusText.textContent = message;
  const appliedType = isWarningOrError ? (type === 'error' ? 'error' : 'warning') : 'success';
  statusToast.className = `status-toast show ${appliedType}`;
  statusToast.style.display = 'flex';
  if (formatterToastTimeout) clearTimeout(formatterToastTimeout);
  if (appliedType === 'success') {
    formatterToastTimeout = setTimeout(() => {
      statusToast.className = 'status-toast';
      statusToast.style.display = 'none';
    }, 5000);
  }
}

function hideFormatterToast() {
  const statusToast = document.getElementById('statusToast');
  if (statusToast) {
    statusToast.className = 'status-toast';
    statusToast.style.display = 'none';
  }
}

function openDraftDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open('manuscript_formatter_v24', 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('drafts')) {
        req.result.createObjectStore('drafts');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function saveFormatterDraft() {
  const editor = document.getElementById('editor');
  if (!editor) return;
  const html = editor.innerHTML;
  let localOk = true;
  try {
    localStorage.setItem(formatterKeys[currentFormatterTab], html);
  } catch (e) {
    localOk = false;
  }
  openDraftDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite');
    tx.objectStore('drafts').put(html, formatterKeys[currentFormatterTab]);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  })).catch(() => {
    if (!localOk) setFormatterStatus('기기 저장 공간이 부족하여 원고를 저장하지 못했습니다.', true, 'error');
  });
}

function clearCurrentDraft() {
  const tabName = currentFormatterTab === 'docs' ? '구글독스' : '블로그';
  if (!window.confirm(`${tabName} 탭의 입력 원고와 저장된 서식 데이터를 모두 초기화할까요?\n\n다른 탭의 원고는 안전하게 유지됩니다.`)) return;
  const editor = document.getElementById('editor');
  try {
    localStorage.removeItem(formatterKeys[currentFormatterTab]);
    localStorage.removeItem(formatterFormatKeys[currentFormatterTab]);
    openDraftDB().then(db => {
      const tx = db.transaction('drafts', 'readwrite');
      tx.objectStore('drafts').delete(formatterKeys[currentFormatterTab]);
    }).catch(() => {});
    if (editor) editor.innerHTML = '';
    setFormatterStatus(`${tabName} 탭 원고와 저장 데이터를 초기화했습니다.`);
  } catch (e) {
    setFormatterStatus('저장 데이터 초기화에 실패했습니다.', true, 'error');
  }
}

function loadFormatterDraft(tab) {
  const editor = document.getElementById('editor');
  if (!editor) return;
  const readLocal = () => {
    try {
      return localStorage.getItem(formatterKeys[tab]) || localStorage.getItem(formatterFormatKeys[tab]) || '';
    } catch (e) {
      return '';
    }
  };
  const fallback = () => {
    if (currentFormatterTab === tab && editor) editor.innerHTML = readLocal();
  };
  openDraftDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readonly');
    const req = tx.objectStore('drafts').get(formatterKeys[tab]);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  })).then(saved => {
    if (currentFormatterTab === tab && editor) editor.innerHTML = saved ?? readLocal();
  }).catch(fallback);
}

function switchFormatterTab(tab) {
  if (tab === currentFormatterTab) return;
  saveFormatterDraft();
  currentFormatterTab = tab;
  const tabs = document.querySelectorAll('.fmt-tab, .tab');
  tabs.forEach(b => {
    if (b.dataset.tab) {
      b.classList.toggle('active', b.dataset.tab === tab);
    } else if (b.id === 'fmtTabDocs') {
      b.classList.toggle('active', tab === 'docs');
    } else if (b.id === 'fmtTabBlog') {
      b.classList.toggle('active', tab === 'blog');
    }
  });
  loadFormatterDraft(tab);
  setFormatterStatus(tab === 'docs' ? '구글독스 원고 입력 화면으로 전환했습니다.' : '블로그 원고 입력 화면으로 전환했습니다.');
}

async function imageDataUrl(file) {
  const raw = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
  if (/^data:image\/(png|jpeg|jpg|gif);base64,/i.test(raw)) return raw;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('이미지 변환 실패'));
    img.src = raw;
  });
}

function insertHtmlAtCursor(html) {
  const editor = document.getElementById('editor');
  if (!editor) return;
  editor.focus();
  const sel = getSelection();
  if (!sel || !sel.rangeCount) {
    editor.insertAdjacentHTML('beforeend', html);
    return;
  }
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const box = document.createElement('div');
  box.innerHTML = html;
  const frag = document.createDocumentFragment();
  while (box.firstChild) frag.appendChild(box.firstChild);
  const last = frag.lastChild;
  range.insertNode(frag);
  if (last) {
    range.setStartAfter(last);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

function normalizePastedHtml(html) {
  const box = document.createElement('div');
  box.innerHTML = html;
  box.querySelectorAll('script,style,iframe,object,embed').forEach(n => n.remove());
  box.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(a => {
      if (/^on/i.test(a.name)) el.removeAttribute(a.name);
    });
    if (el.tagName === 'IMG') {
      const src = el.getAttribute('src') || '';
      if (!/^data:image\/(png|jpeg|jpg|gif);base64,/i.test(src)) {
        el.remove();
        return;
      }
      el.removeAttribute('srcset');
      el.style.maxWidth = '100%';
      el.style.height = 'auto';
      el.setAttribute('data-pasted-image', '1');
    }
  });
  return box.innerHTML;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function cleanLine(line) {
  return line.replace(/^\s{0,3}#{1,6}\s*/, '').replace(/^\s*>\s?/, '').replace(/\s+$/, '').trim();
}

function getLines() {
  const editor = document.getElementById('editor');
  formatterImageMap = new Map();
  formatterImageCounter = 0;
  if (!editor) return [];
  const clone = editor.cloneNode(true);
  clone.querySelectorAll('img').forEach(img => {
    const id = formatterImageCounter++;
    formatterImageMap.set(id, {
      src: img.getAttribute('src') || '',
      alt: img.getAttribute('alt') || '이미지',
      width: Number(img.getAttribute('width')) || img.naturalWidth || 0,
      height: Number(img.getAttribute('height')) || img.naturalHeight || 0
    });
    img.replaceWith(document.createTextNode(`[[[IMG_${id}]]]`));
  });
  const blockTags = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'LI']);
  let raw = '';
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      raw += node.nodeValue;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === 'BR') {
      raw += '\n';
      return;
    }
    const block = blockTags.has(node.tagName);
    if (block && raw && !raw.endsWith('\n')) raw += '\n';
    [...node.childNodes].forEach(walk);
    if (block && !raw.endsWith('\n')) raw += '\n';
  };
  [...clone.childNodes].forEach(walk);
  return raw.replace(/\r/g, '').split('\n').map(x => cleanLine(x)).filter((x, i, a) => !(i === 0 && x === '') && !(i === a.length - 1 && x === ''));
}

function renderInline(text) {
  let html = escapeHtml(String(text));
  html = html.replace(FORMATTER_IMAGE_TOKEN_RE, (_, id) => {
    const im = formatterImageMap.get(Number(id));
    if (!im || !im.src) return '';
    return `<img data-image-id="${id}" src="${escapeHtml(im.src)}" alt="${escapeHtml(im.alt)}" style="max-width:100%;height:auto;display:block;margin:8px auto;border-radius:6px;">`;
  });
  return html;
}

// 성경 장 제목 분석 (예: "로마서 12장 1절", "로마서 12장 1-2절", "로마서 12장", "로마서 12:1")
function parseChapterHeader(t) {
  let match = t.match(/^([가-힣]{1,10}(?:\s*[가-힣]{1,10})?)\s*(\d+)장(?:\s*(\d+)(?:[~-]\d+)?절)?(?:\s*\([^)]*\))?$/);
  if (match) {
    return {
      book: match[1].trim(),
      chapter: Number(match[2]),
      startVerse: match[3] ? Number(match[3]) : null,
      full: t
    };
  }
  match = t.match(/^([가-힣]{1,10}(?:\s*[가-힣]{1,10})?)\s*(\d+)\s*:\s*(\d+)(?:[~-]\d+)?(?:\s*\([^)]*\))?$/);
  if (match) {
    return {
      book: match[1].trim(),
      chapter: Number(match[2]),
      startVerse: Number(match[3]),
      full: t
    };
  }
  return null;
}

function isMajorHeading(t) {
  return /^(결론|정리|맺음말|마치며|나가며|서론|들어가는 말|나오는 말|참고한 연구 자료|참고문헌)\s*$/.test(t) ||
         /^(제\s*\d+장|제\s*\d+절|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+[.)、]?|\d+[.)、])\s*\S/.test(t);
}

function isSubHeading(t) {
  return /^(\d+\.\d+|[가-힣][.)])\s*\S/.test(t) || /^【[^】]+】$/.test(t);
}

function makeParagraph(tag, text, style, extra = '') {
  return `<${tag} style="${style}" ${extra}>${renderInline(text)}</${tag}>`;
}

// 성경 절 파싱 (절 번호가 생략된 경우 장 제목에서 얻은 defaultNumber 자동 보정)
function parseVerseLine(line, defaultNumber = null) {
  const firstMatch = line.match(/^\s*(\d{1,3})(?:절|[.)、:])?\s*(\S[\s\S]*)?$/);
  let firstNum = null;
  let rest = '';

  if (firstMatch && firstMatch[1]) {
    firstNum = Number(firstMatch[1]);
    rest = (firstMatch[2] || '').trim();
  } else if (defaultNumber !== null) {
    firstNum = defaultNumber;
    rest = line.trim();
  } else {
    return null;
  }

  const markerRe = /(?:^|\s)(\d{1,3})(?:절)?[.)、]?\s+/g;
  const markers = [];
  let match;
  while ((match = markerRe.exec(rest))) {
    const number = Number(match[1]);
    const index = match.index + (match[0].startsWith(' ') ? 1 : 0);
    const tokenLength = match[0].trimStart().length;
    if (number >= 1 && number <= 176) markers.push({ index, number, tokenLength });
  }
  const verses = [{ number: firstNum, text: rest.slice(0, markers.length ? markers[0].index : rest.length).trim() }];
  markers.forEach((m, i) => {
    const next = markers[i + 1];
    verses.push({ number: m.number, text: rest.slice(m.index + m.tokenLength, next ? next.index : rest.length).trim() });
  });
  return verses;
}

function analyzeAndFormat() {
  const editor = document.getElementById('editor');
  if (!editor) return;
  const lines = getLines();
  if (!lines.length) {
    setFormatterStatus('먼저 원고를 입력하거나 붙여넣으세요.', true, 'warning');
    return;
  }
  const p = formatterProfiles[currentFormatterTab];
  const out = [];
  let firstContent = true, insideBible = false, bibleVerses = [];
  let pendingStartVerse = null;
  let referenceSection = false;
  const verseGaps = [];
  let previousVerseNumber = null;

  const flushBible = () => {
    if (!bibleVerses.length) return;
    const content = bibleVerses.map(v => 
      v.number === null 
        ? renderInline(v.text) 
        : `<span class="verse-number" style="font-weight:800;color:${VERSE_NUM_COLOR};white-space:nowrap;">${v.number}</span> ${renderInline(v.text)}`
    ).join(' ');
    // 성경 본문 문단 앞뒤 간격 0 (margin: 0) 및 주황색 (#E65100), 좌우 들여쓰기 적용
    const style = `font-family:'맑은 고딕',Arial,sans-serif;font-size:${p.bible};line-height:${p.line};font-weight:600;color:${BIBLE_COLOR};margin:0;margin-left:${p.indent};margin-right:${p.indent};text-indent:0;text-align:justify;`;
    out.push(`<p data-kind="bible-text" style="${style}">${content}</p>`);
    bibleVerses = [];
    insideBible = false;
    pendingStartVerse = null;
  };

  const addBody = (line) => {
    if (firstContent) {
      firstContent = false;
      const style = `font-family:'맑은 고딕',Arial,sans-serif;font-size:${p.title};font-weight:700;line-height:${p.line};text-align:justify;margin:0;`;
      out.push(`<p data-kind="document-title" style="${style}">${renderInline(line)}</p>`);
      return;
    }
    if (/^참고한 연구 자료$|^참고문헌$/.test(line)) {
      referenceSection = true;
      out.push(makeParagraph('p', line, `font-family:'맑은 고딕',Arial,sans-serif;font-size:${p.h1};font-weight:700;line-height:${p.line};margin:0;text-align:justify;`, 'data-kind="references-heading"'));
      return;
    }
    if (isMajorHeading(line)) {
      out.push(makeParagraph('p', line, `font-family:'맑은 고딕',Arial,sans-serif;font-size:${p.h1};font-weight:700;line-height:${p.line};margin:0;text-align:justify;`, 'data-kind="heading-1"'));
      return;
    }
    if (isSubHeading(line)) {
      out.push(makeParagraph('p', line, `font-family:'맑은 고딕',Arial,sans-serif;font-size:${p.h2};font-weight:700;line-height:${p.line};margin:0;text-align:justify;`, 'data-kind="heading-2"'));
      return;
    }
    if (!referenceSection && /^[가-힣0-9][^.!?]{0,35}$/.test(line) && line.length <= 26 && !/[.!?。]$/.test(line)) {
      out.push(makeParagraph('p', line, `font-family:'맑은 고딕',Arial,sans-serif;font-size:${p.h3};font-weight:700;line-height:${p.line};margin:0;text-align:justify;`, 'data-kind="heading-3"'));
      return;
    }
    // 일반 본문 문단 앞뒤 간격 0 (margin: 0)
    const style = `font-family:'맑은 고딕',Arial,sans-serif;font-size:${p.body};font-weight:400;line-height:${p.line};margin:0;margin-left:0;margin-right:0;text-indent:0;text-align:justify;`;
    out.push(makeParagraph('p', line, style, referenceSection ? 'data-kind="reference-item"' : 'data-kind="body"'));
  };

  lines.forEach(line => {
    // 1. 성경 장 제목 감지 (예: "로마서 12장 1절", "로마서 12장")
    const chapterInfo = parseChapterHeader(line);
    if (chapterInfo) {
      flushBible();
      insideBible = true;
      pendingStartVerse = chapterInfo.startVerse !== null ? chapterInfo.startVerse : 1;
      previousVerseNumber = null;
      // 문단 앞뒤 간격 0 (margin: 0), 성경 본문과 동일한 글자 크기(p.bible) 및 좌우 들여쓰기(p.indent) 적용
      const style = `font-family:'맑은 고딕',Arial,sans-serif;font-size:${p.bible};font-weight:700;line-height:${p.line};margin:0;margin-left:${p.indent};margin-right:${p.indent};text-indent:0;text-align:justify;color:${BIBLE_COLOR};`;
      const chapterTitle = `${chapterInfo.book} ${chapterInfo.chapter}장`;
      out.push(`<p data-kind="bible-heading" style="${style}">${renderInline(chapterTitle)}</p>`);
      return;
    }

    // 2. 성경 인용 처리 중
    if (insideBible) {
      if (line === '') {
        if (bibleVerses.length > 0) {
          flushBible();
          insideBible = false;
          previousVerseNumber = null;
        }
        return;
      }

      const parsed = parseVerseLine(line, pendingStartVerse);
      if (parsed && parsed.length > 0) {
        parsed.forEach(v => {
          if (previousVerseNumber !== null && v.number !== null && v.number !== previousVerseNumber + 1) {
            verseGaps.push(`${previousVerseNumber}절 다음 ${v.number}절`);
          }
          if (v.number !== null) previousVerseNumber = v.number;
        });
        bibleVerses.push(...parsed);
        pendingStartVerse = null;
        return;
      }

      flushBible();
      insideBible = false;
      previousVerseNumber = null;
    }

    // 3. 일반 빈 줄 처리
    if (line === '') {
      flushBible();
      if (out.length) {
        out.push(`<p data-kind="blank-line" style="font-family:'맑은 고딕',Arial,sans-serif;font-size:${p.body};line-height:${p.line};margin:0;padding:0;min-height:1em;"><wbr></p>`);
      }
      insideBible = false;
      previousVerseNumber = null;
      return;
    }

    // 4. 일반 본문 및 제목 처리
    addBody(line);
  });
  flushBible();

  // 문단 정규화:
  // [규칙] 성경 장이름(bible-heading)과 성경 본문(bible-text) 사이에는 빈 줄을 일체 넣지 않음!
  const blankHtml = `<p data-kind="blank-line" style="font-family:'맑은 고딕',Arial,sans-serif;font-size:${p.body};line-height:${p.line};margin:0;padding:0;min-height:1em;"><wbr></p>`;
  const spacedOut = [];
  let previousWasBlank = true;
  let previousKind = '';

  out.forEach(block => {
    const isBlank = /data-kind=["']blank-line["']/.test(block);
    const kindMatch = block.match(/data-kind=["']([^"']+)["']/);
    const currentKind = kindMatch ? kindMatch[1] : '';

    if (isBlank) {
      if (previousKind === 'bible-heading') {
        return;
      }
      if (!previousWasBlank) spacedOut.push(blankHtml);
      previousWasBlank = true;
      return;
    }

    if (previousKind === 'bible-heading' && currentKind === 'bible-text') {
      spacedOut.push(block);
      previousWasBlank = false;
      previousKind = currentKind;
      return;
    }

    if (!previousWasBlank && spacedOut.length) spacedOut.push(blankHtml);
    spacedOut.push(block);
    previousWasBlank = false;
    previousKind = currentKind;
  });

  editor.innerHTML = spacedOut.join('');
  try {
    localStorage.setItem(formatterKeys[currentFormatterTab], editor.innerHTML);
    localStorage.setItem(formatterFormatKeys[currentFormatterTab], editor.innerHTML);
  } catch (e) {
    setFormatterStatus('서식은 적용했으나 기기 저장에 실패했습니다.', true, 'warning');
    return;
  }

  const base = currentFormatterTab === 'docs' ? '구글독스 지정 서식을 적용하고 저장했습니다.' : '블로그 지정 서식을 적용하고 저장했습니다.';
  const audit = verseGaps.length ? ` 절 번호 연속성 확인 필요: ${[...new Set(verseGaps)].join(', ')}.` : '';
  setFormatterStatus(`${base} 성경 장·본문 간격 0 및 절 번호 서식을 적용했습니다.${audit}`, verseGaps.length > 0, verseGaps.length > 0 ? 'warning' : 'success');
}

function docxOut() {
  const editor = document.getElementById('editor');
  if (!editor || !editor.innerText.trim()) {
    setFormatterStatus('빈 원고는 DOCX로 변환할 수 없습니다.', true, 'warning');
    return;
  }
  const escXml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const imageAssets = [];
  const paragraphs = [...editor.children].map(el => {
    const kind = el.dataset.kind || 'body';
    const heading = ({ 'document-title': 'Title', 'heading-1': 'Heading1', 'heading-2': 'Heading2', 'heading-3': 'Heading3', 'bible-heading': 'Heading4' })[kind];
    const isBible = kind === 'bible-text', isTitle = kind === 'document-title', isBlank = kind === 'blank-line';
    const style = el.getAttribute('style') || '';
    const sizeMatch = style.match(/font-size:\s*([\d.]+)pt/i);
    const sizePt = sizeMatch ? parseFloat(sizeMatch[1]) : 10;
    
    // 성경 장과 성경 본문 모두 주황색 E65100 적용
    const colorMatch = style.match(/color:\s*#?([0-9a-f]{6})/i);
    const color = (isBible || kind === 'bible-heading') ? 'E65100' : (colorMatch ? colorMatch[1].toUpperCase() : '202938');
    const bold = isBible || isTitle || /^heading-/.test(kind) || kind === 'bible-heading';
    const align = 'both';
    
    // 문단 앞뒤 간격 엄격히 0 (before: 0, after: 0), 성경 장 및 성경 본문 좌우 0.5인치(720 dxa) 들여쓰기
    const before = 0, after = 0, line = 300;
    const isBibleSection = isBible || kind === 'bible-heading';
    const indLeft = isBibleSection ? 720 : 0;
    const indRight = isBibleSection ? 720 : 0;
    let ppr = `<w:spacing w:before="${before}" w:after="${after}" w:line="${line}" w:lineRule="auto"/><w:jc w:val="${align}"/><w:ind w:left="${indLeft}" w:right="${indRight}" w:firstLine="0"/>`;
    const pStyle = heading ? `<w:pStyle w:val="${heading}"/>` : '';
    const runs = [];
    const runProps = `<w:rPr><w:rFonts w:ascii="Malgun Gothic" w:hAnsi="Malgun Gothic" w:eastAsia="맑은 고딕"/><w:sz w:val="${Math.round(sizePt * 2)}"/><w:color w:val="${color}"/>${bold ? '<w:b/>' : ''}</w:rPr>`;

    const addNodes = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.nodeValue) runs.push(`<w:r>${runProps}<w:t xml:space="preserve">${escXml(node.nodeValue)}</w:t></w:r>`);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.tagName === 'IMG') {
        const src = node.getAttribute('src') || '';
        const m = src.match(/^data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+/=]+)$/i);
        if (!m) return;
        const ext = m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();
        const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
        const index = imageAssets.length + 1;
        const relId = `rIdImage${index}`;
        imageAssets.push({ name: `image${index}.${ext}`, bytes, relId, ext });
        const wpx = Number(node.getAttribute('width')) || node.naturalWidth || 600;
        const hpx = Number(node.getAttribute('height')) || node.naturalHeight || Math.round(wpx * 0.7);
        const max = 5486400;
        let cx = wpx * 9525, cy = hpx * 9525;
        if (cx > max) {
          const scale = max / cx;
          cx = max;
          cy = Math.round(cy * scale);
        }
        runs.push(`<w:r>${runProps}<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${index}" name="${escXml(node.getAttribute('alt') || `Image ${index}`)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${index}" name="${escXml(node.getAttribute('alt') || `Image ${index}`)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`);
        return;
      }
      if (node.tagName === 'BR') {
        runs.push('<w:r><w:br/></w:r>');
        return;
      }
      [...node.childNodes].forEach(addNodes);
    };

    [...el.childNodes].forEach(addNodes);

    if (isBlank) return `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="300" w:lineRule="auto"/><w:ind w:left="0" w:right="0" w:firstLine="0"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Malgun Gothic" w:hAnsi="Malgun Gothic" w:eastAsia="맑은 고딕"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve"> </w:t></w:r></w:p>`;
    return `<w:p><w:pPr>${pStyle}${ppr}</w:pPr>${runs.join('') || '<w:r><w:t></w:t></w:r>'}</w:p>`;
  }).join('');

  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Malgun Gothic" w:hAnsi="Malgun Gothic" w:eastAsia="맑은 고딕"/><w:sz w:val="20"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:before="0" w:after="0" w:line="300" w:lineRule="auto"/><w:jc w:val="both"/><w:ind w:left="0" w:right="0" w:firstLine="0"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:pPr><w:jc w:val="center"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="heading 4"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style></w:styles>`;
  const ct = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${imageAssets.map(im => `<Relationship Id="${im.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${im.name}"/>`).join('')}</Relationships>`;
  const crc32 = a => { let c = ~0; for (const b of a) { c ^= b; for (let j = 0; j < 8; j++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); } return (~c) >>> 0; };
  const enc = new TextEncoder(), locals = [], centrals = []; let offset = 0;
  const u16 = n => [n & 255, n >>> 8 & 255], u32 = n => [n & 255, n >>> 8 & 255, n >>> 16 & 255, n >>> 24 & 255];

  for (const f of [{ n: '[Content_Types].xml', d: ct }, { n: '_rels/.rels', d: rels }, { n: 'word/document.xml', d: doc }, { n: 'word/styles.xml', d: styles }, { n: 'word/_rels/document.xml.rels', d: docRels }, ...imageAssets.map(im => ({ n: `word/media/${im.name}`, d: im.bytes }))]) {
    const name = enc.encode(f.n), data = f.d instanceof Uint8Array ? f.d : enc.encode(f.d), crc = crc32(data);
    const l = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...name, ...data]);
    const c = new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name]);
    locals.push(l); centrals.push(c); offset += l.length;
  }
  const centralSize = centrals.reduce((n, x) => n + x.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(locals.length), ...u16(locals.length), ...u32(centralSize), ...u32(offset), ...u16(0)]);
  const blob = new Blob([...locals, ...centrals, end], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url;

  // 원고 제목 자동 추출 (서식 적용된 document-title 또는 첫 번째 텍스트 줄)
  let docTitle = '';
  const titleEl = editor.querySelector('[data-kind="document-title"]');
  if (titleEl && titleEl.textContent.trim()) {
    docTitle = titleEl.textContent.trim();
  } else {
    const lines = editor.innerText.split('\n').map(s => s.trim()).filter(Boolean);
    if (lines.length > 0) docTitle = lines[0];
  }
  const safeTitle = docTitle.replace(/[/\\?%*:|"<>]/g, '').trim().slice(0, 60) || `원고_${currentFormatterTab === 'docs' ? '구글독스' : '블로그'}`;

  a.download = `${safeTitle}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  setFormatterStatus(`'${safeTitle}.docx' 파일을 다운로드했습니다. 이미지 ${imageAssets.length}개를 포함했습니다.`);
}

let formatterInitialized = false;
function initFormatter() {
  const editor = document.getElementById('editor');
  if (!editor) return;

  if (!formatterInitialized) {
    editor.addEventListener('input', saveFormatterDraft);
    editor.addEventListener('paste', async e => {
      const cd = e.clipboardData;
      if (!cd) return;
      const html = cd.getData('text/html');
      const files = [...(cd.files || [])].filter(f => f.type.startsWith('image/'));
      const items = [...(cd.items || [])].filter(i => i.kind === 'file' && i.type.startsWith('image/'));
      if (!html && !files.length && !items.length) return;
      e.preventDefault();
      let markup = '';
      if (html) markup = normalizePastedHtml(html);
      const imageFiles = [...files, ...items.map(i => i.getAsFile()).filter(Boolean)];
      const htmlHasImage = !!markup.match(/<img\b/i);
      for (const file of (htmlHasImage ? [] : imageFiles)) {
        try {
          const src = await imageDataUrl(file);
          markup += `<img data-pasted-image="1" src="${src}" alt="붙여넣은 이미지" style="max-width:100%;height:auto;display:block;margin:8px auto;border-radius:6px;">`;
        } catch (err) {
          setFormatterStatus('일부 이미지 파일을 읽지 못했습니다.', true, 'warning');
        }
      }
      if (!markup && cd.getData('text/plain')) markup = escapeHtml(cd.getData('text/plain')).replace(/\n/g, '<br>');
      insertHtmlAtCursor(markup);
      saveFormatterDraft();
      setFormatterStatus(`원고와 이미지 ${(markup.match(/<img\b/gi) || []).length}개를 붙여넣었습니다.`);
    });

    const statusClose = document.getElementById('statusClose');
    if (statusClose) {
      statusClose.addEventListener('click', hideFormatterToast);
    }

    formatterInitialized = true;
  }

  loadFormatterDraft(currentFormatterTab);
}

// Global functions for inline HTML event handlers if any
window.initFormatter = initFormatter;
window.switchFormatterTab = switchFormatterTab;
window.analyzeAndFormat = analyzeAndFormat;
window.docxOut = docxOut;
window.clearCurrentDraft = clearCurrentDraft;
window.hideFormatterToast = hideFormatterToast;
