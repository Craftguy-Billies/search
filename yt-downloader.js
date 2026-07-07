/* ════════════════════════════════════════════
   YouTube Downloader — Frontend Logic
   ════════════════════════════════════════════ */

(function () {
  'use strict';

  const DOM = {
    urlInput: document.getElementById('urlInput'),
    fetchBtn: document.getElementById('fetchBtn'),
    errorBox: document.getElementById('errorBox'),
    errorText: document.getElementById('errorText'),
    loading: document.getElementById('loadingSpinner'),
    videoInfo: document.getElementById('videoInfo'),
    thumbnail: document.getElementById('thumbnail'),
    videoTitle: document.getElementById('videoTitle'),
    uploaderName: document.getElementById('uploaderName'),
    videoDuration: document.getElementById('videoDuration'),
    viewCount: document.getElementById('viewCount'),
    formatGrid: document.getElementById('formatGrid'),
    downloadProgress: document.getElementById('downloadProgress'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
  };

  // ── Helpers ──

  function showError(msg) {
    DOM.errorBox.hidden = false;
    DOM.errorText.textContent = msg;
  }

  function hideError() {
    DOM.errorBox.hidden = true;
  }

  function showLoading() {
    DOM.loading.hidden = false;
    DOM.videoInfo.hidden = true;
    DOM.downloadProgress.hidden = true;
  }

  function hideLoading() {
    DOM.loading.hidden = true;
  }

  function formatCount(n) {
    if (!n) return '';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K';
    return n.toLocaleString();
  }

  function formatDuration(seconds) {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h) parts.push(h);
    parts.push(String(m).padStart(h ? 2 : 1, '0'));
    parts.push(String(s).padStart(2, '0'));
    return parts.join(':');
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return size.toFixed(1) + ' ' + units[i];
  }

  function getApiBase() {
    // In development, the API runs on the same origin
    return '';
  }

  // ── Fetch video info ──

  async function fetchVideoInfo(url) {
    hideError();
    showLoading();

    try {
      const resp = await fetch(
        getApiBase() + '/api/info?url=' + encodeURIComponent(url)
      );
      const data = await resp.json();

      hideLoading();

      if (!resp.ok) {
        showError(data.error || 'Failed to fetch video info');
        return null;
      }

      return data;
    } catch (err) {
      hideLoading();
      showError('Network error. Is the server running?');
      return null;
    }
  }

  // ── Render video info ──

  function renderVideoInfo(data) {
    DOM.thumbnail.src = data.thumbnail || '';
    DOM.thumbnail.alt = data.title;
    DOM.videoTitle.textContent = data.title;

    DOM.uploaderName.textContent = data.uploader;
    DOM.videoDuration.textContent = formatDuration(data.duration);
    DOM.viewCount.textContent = data.view_count
      ? formatCount(data.view_count) + ' views'
      : '';

    // Render format grid
    DOM.formatGrid.innerHTML = '';
    for (const f of data.formats) {
      const card = document.createElement('button');
      card.className = 'format-card';
      card.dataset.formatId = f.format_id;
      card.dataset.url = data.webpage_url;

      const label = document.createElement('span');
      label.className = 'format-label';
      label.textContent = f.label;

      const meta = document.createElement('span');
      meta.className = 'format-meta';

      if (f.filesize) {
        meta.textContent = formatSize(f.filesize);
      }

      const badge = document.createElement('span');
      badge.className = 'format-type-badge ' + f.type.replace('+', '-');
      badge.textContent = f.type;

      card.appendChild(label);
      card.appendChild(meta);
      card.appendChild(badge);

      card.addEventListener('click', () => startDownload(card));
      DOM.formatGrid.appendChild(card);
    }

    DOM.videoInfo.hidden = false;
  }

  // ── Download ──

  async function startDownload(card) {
    const formatId = card.dataset.formatId;
    const url = card.dataset.url;

    DOM.downloadProgress.hidden = false;
    DOM.progressFill.style.width = '10%';
    DOM.progressText.textContent = 'Starting download…';

    try {
      const resp = await fetch(getApiBase() + '/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format_id: formatId }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Download failed' }));
        DOM.progressText.textContent = '❌ ' + (err.error || 'Download failed');
        DOM.progressFill.style.width = '0%';
        return;
      }

      // Get the filename from Content-Disposition
      const disposition = resp.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const filename = match ? match[1].replace(/['"]/g, '') : 'video.mp4';

      DOM.progressFill.style.width = '60%';
      DOM.progressText.textContent = 'Downloading ' + filename + '…';

      // Read the response as a blob
      const blob = await resp.blob();

      DOM.progressFill.style.width = '90%';
      DOM.progressText.textContent = 'Saving file…';

      // Trigger file download
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      DOM.progressFill.style.width = '100%';
      DOM.progressText.textContent = '✅ Download complete!';

      // Reset progress after a moment
      setTimeout(() => {
        DOM.downloadProgress.hidden = true;
        DOM.progressFill.style.width = '0%';
      }, 3000);
    } catch (err) {
      DOM.progressText.textContent = '❌ Network error during download';
      DOM.progressFill.style.width = '0%';
    }
  }

  // ── Event listeners ──

  DOM.fetchBtn.addEventListener('click', async () => {
    const url = DOM.urlInput.value.trim();
    if (!url) {
      showError('Please enter a YouTube URL');
      return;
    }

    const data = await fetchVideoInfo(url);
    if (data) {
      renderVideoInfo(data);
    }
  });

  DOM.urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      DOM.fetchBtn.click();
    }
  });

  // Auto-fetch from URL param
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('url');
  if (urlParam) {
    DOM.urlInput.value = urlParam;
    DOM.fetchBtn.click();
  }
})();
