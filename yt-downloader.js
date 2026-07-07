/* ============================================
   YouTube Video Downloader — Frontend Logic
   ============================================ */

const DOM = {
  urlInput: document.getElementById('ytUrl'),
  fetchBtn: document.getElementById('ytFetchBtn'),
  error: document.getElementById('ytError'),
  loading: document.getElementById('ytLoading'),
  card: document.getElementById('ytVideoCard'),
  thumb: document.getElementById('ytThumb'),
  title: document.getElementById('ytTitle'),
  author: document.getElementById('ytAuthor'),
  duration: document.getElementById('ytDuration'),
  formatsCount: document.getElementById('ytFormatsCount'),
  formatList: document.getElementById('ytFormatList'),
};

function showError(msg) {
  DOM.error.textContent = msg;
  DOM.error.classList.add('visible');
}

function hideError() {
  DOM.error.classList.remove('visible');
}

function setLoading(on) {
  DOM.loading.classList.toggle('visible', on);
  DOM.fetchBtn.disabled = on;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h) parts.push(h);
  parts.push(String(m).padStart(h ? 2 : 1, '0'));
  parts.push(String(s).padStart(2, '0'));
  return parts.join(':');
}

function qualityLabel(f) {
  if (f.hasVideo && f.hasAudio) return `${f.quality} (video+audio)`;
  if (f.hasVideo) return `${f.quality} (video only)`;
  return `${f.quality} (audio only)`;
}

function renderFormats(formats, videoUrl) {
  DOM.formatList.innerHTML = '';

  const grouped = { recommended: [], video: [], audio: [] };

  // Prioritize video+audio combos, then video-only, then audio-only
  formats.forEach(f => {
    if (f.hasVideo && f.hasAudio) grouped.recommended.push(f);
    else if (f.hasVideo) grouped.video.push(f);
    else grouped.audio.push(f);
  });

  // Sort by quality (higher first)
  const sortByQuality = (a, b) => {
    const aNum = parseInt(a.quality) || 0;
    const bNum = parseInt(b.quality) || 0;
    return bNum - aNum;
  };
  grouped.recommended.sort(sortByQuality);
  grouped.video.sort(sortByQuality);

  const allFormats = [
    ...grouped.recommended,
    ...grouped.video,
    ...grouped.audio,
  ];

  allFormats.forEach(f => {
    const item = document.createElement('div');
    item.className = 'yt-format-item';

    const info = document.createElement('div');
    info.className = 'yt-format-info';

    const quality = document.createElement('span');
    quality.className = 'yt-format-quality';
    quality.textContent = qualityLabel(f);

    const detail = document.createElement('span');
    detail.className = 'yt-format-detail';
    detail.textContent = `${f.container} · ${f.approxSize}`;

    info.appendChild(quality);
    info.appendChild(detail);

    const link = document.createElement('a');
    link.className = 'yt-format-download';
    link.href = `/api/download?url=${encodeURIComponent(videoUrl)}&itag=${f.itag}`;
    link.textContent = '⬇ Download';

    item.appendChild(info);
    item.appendChild(link);
    DOM.formatList.appendChild(item);
  });
}

async function fetchVideo() {
  const url = DOM.urlInput.value.trim();
  if (!url) {
    showError('Please paste a YouTube video URL');
    return;
  }

  hideError();
  setLoading(true);
  DOM.card.classList.remove('visible');

  try {
    const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Failed to fetch video');
      return;
    }

    DOM.thumb.src = data.thumbnail;
    DOM.thumb.alt = data.title;
    DOM.title.textContent = data.title;
    DOM.author.textContent = `🎤 ${data.author || 'Unknown'}`;
    DOM.duration.textContent = `⏱️ ${formatDuration(data.duration)}`;
    DOM.formatsCount.textContent = `📦 ${data.formats.length} formats`;

    renderFormats(data.formats, url);
    DOM.card.classList.add('visible');
  } catch (err) {
    showError('Network error. Is the server running?');
  } finally {
    setLoading(false);
  }
}

// Enter key to fetch
DOM.urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') DOM.fetchBtn.click();
});

DOM.fetchBtn.addEventListener('click', fetchVideo);
