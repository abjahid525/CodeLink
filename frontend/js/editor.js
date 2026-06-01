import { getStoredUser } from './auth-utils.js';

const STORAGE_KEY = 'codelink-editor';

function getStorageKey() {
  const user = getStoredUser();
  return user?.id ? `${STORAGE_KEY}:${user.id}` : STORAGE_KEY;
}

function escapeHtml(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function saveState(html, css, js) {
  localStorage.setItem(getStorageKey(), JSON.stringify({ html, css, js }));
}

function loadState() {
  const stored = localStorage.getItem(getStorageKey());
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { html: '', css: '', js: '' };
    }
  }
  return { html: '', css: '', js: '' };
}

function setPreview(html, css, js) {
  const iframe = document.querySelector('#preview-frame');
  const content = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>${css}</style>
</head>
<body>
${html}
<script>${js} <\/script>
</body>
</html>
`;
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(content);
  doc.close();
}

function createEditorListeners(showToast) {
  const htmlEditor = document.querySelector('#html-editor');
  const cssEditor = document.querySelector('#css-editor');
  const jsEditor = document.querySelector('#js-editor');
  const runButton = document.querySelector('#run-code');
  const fullscreenButton = document.querySelector('#fullscreen-preview');
  const previewPanel = document.querySelector('.preview-panel');

  const update = () => {
    saveState(htmlEditor.value, cssEditor.value, jsEditor.value);
  };

  htmlEditor.addEventListener('input', update);
  cssEditor.addEventListener('input', update);
  jsEditor.addEventListener('input', update);

  runButton.addEventListener('click', () => {
    setPreview(htmlEditor.value, cssEditor.value, jsEditor.value);
    showToast('Preview updated');
  });

  if (fullscreenButton && previewPanel) {
    fullscreenButton.addEventListener('click', async () => {
      const isFullscreen = document.fullscreenElement === previewPanel;
      try {
        if (isFullscreen) {
          await document.exitFullscreen();
        } else {
          await previewPanel.requestFullscreen();
        }
      } catch {
        previewPanel.classList.toggle('is-fullscreen');
        const fallbackOpen = previewPanel.classList.contains('is-fullscreen');
        fullscreenButton.textContent = fallbackOpen ? 'Exit Fullscreen' : 'Fullscreen';
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const active = document.fullscreenElement === previewPanel;
      previewPanel.classList.toggle('is-fullscreen', active);
      fullscreenButton.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
    });
  }

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && ['s', 'enter'].includes(event.key.toLowerCase())) {
      event.preventDefault();
      setPreview(htmlEditor.value, cssEditor.value, jsEditor.value);
      showToast('Code executed with Ctrl+Enter');
    }
  });
}

export function initEditor(showToast) {
  const state = loadState();
  const html = state.html || '<h2>CodeLink</h2><p>Welcome to your playground.</p>';
  const css = state.css || 'body { font-family: Inter, sans-serif; }';
  const js = state.js || 'console.log("Hello CodeLink");';
  document.querySelector('#html-editor').value = html;
  document.querySelector('#css-editor').value = css;
  document.querySelector('#js-editor').value = js;
  createEditorListeners(showToast);
  setPreview(html, css, js);
}
