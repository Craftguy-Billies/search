/* YouTube Downloader — Frontend */

const API_BASE = window.location.origin;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const urlInput = $('#url-input');
const fetchBtn = $('#fetch-btn');
const statusEl = $('#status');
const loadingEl = $('#loading');
const videoInfo = $('#video-info');
const thumbnail = $('#thumbnail');
const videoTitle = $('#video-title');
const videoUploader = $('#video-uploader');
const videoDuration = $('#video-duration');
const formatsSection = $('#formats-section');
const formatList = $('#format-list');
const downloadBtn = $('#download-btn');
const themeToggle = $('#theme-toggle');

let currentInfo = null;
let selectedFormatId = 'bestvideo+bestaudio';

/* ── Theme ── */

function loadTheme() {
  const theme = localStorage.getItem('ytdl-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
}

themeToggle.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ytdl-theme', next);
  themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
});

loadTheme();

/* ── Helpers ── */

function showStatus(msg, type) {
  statusEl.className = 'status ' + type;
  statusEl.textContent = msg;
}

function hideStatus() {
  statusEl.className = 'status';
  statusEl.textContent = '';
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h) parts.push(h + 'h');
  if (m) parts.push(m + 'm');
  parts.push(s + 's');
  return parts.join(' ');
}

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB';
  return mb.toFixed(0) + ' MB';
}

/* ── Fetch video info ── */

async function fetchInfo() {
  const url = urlInput.value.trim();
  if (!url) {
    showStatus('Please enter a YouTube URL', 'error');
    return;
  }

  hideStatus();
  fetchBtn.disabled = true;
  fetchBtn.textContent = '⏳ Fetching';
  videoInfo.classList.remove('visible');
  formatsSection.classList.remove('visible');
  loadingEl.classList.add('visible');

  try {
    const res = await fetch(API_BASE + '/api/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!res.ok) {
      showStatus(data.error || 'Failed to fetch video info', 'error');
      return;
    }

    currentInfo = data;
    renderVideoInfo(data);
    renderFormats(data.streams);
  } catch (err) {
    showStatus('Network error. Is the server running?', 'error');
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.textContent = 'Fetch ▸';
    loadingEl.classList.remove('visible');
  }
}

/* ── Render video info ── */

function renderVideoInfo(info) {
  thumbnail.src = info.thumbnail || '';
  videoTitle.textContent = info.title;
  videoUploader.textContent = info.uploader ? '📺 ' + info.uploader : '';
  videoDuration.textContent = info.duration ? '⏱ ' + formatDuration(info.duration) : '';
  videoInfo.classList.add('visible');
}

/* ── Render format options ── */

function renderFormats(streams) {
  formatList.innerHTML = '';
  formatsSection.classList.add('visible');

  if (!streams || streams.length === 0) {
    formatList.innerHTML =
      '<p style="color:var(--text-dim);padding:12px;">No formats available.</p>';
    return;
  }

  streams.forEach((s, i) => {
    const label = s.special ? s.label : `${s.label} · ${s.ext.toUpperCase()}`;
    const size = s.filesize ? formatSize(s.filesize) : '';

    const div = document.createElement('label');
    div.className = 'format-option' + (i === 0 ? ' selected' : '');

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'format';
    radio.value = s.format_id;
    if (i === 0) radio.checked = true;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'format-label';
    labelSpan.textContent = label;

    div.append(radio, labelSpan);

    if (s.ext && !s.special) {
      const extSpan = document.createElement('span');
      extSpan.className = 'format-ext';
      extSpan.textContent = s.ext;
      div.append(extSpan);
    }

    if (size) {
      const sizeSpan = document.createElement('span');
      sizeSpan.className = 'format-size';
      sizeSpan.textContent = size;
      div.append(sizeSpan);
    }

    radio.addEventListener('change', (e) => {
      $$('.format-option').forEach((el) => el.classList.remove('selected'));
      div.classList.add('selected');
      selectedFormatId = e.target.value;
    });

    formatList.appendChild(div);
  });

  // Select the first option by default
  selectedFormatId = streams[0]?.format_id || 'bestvideo+bestaudio';
}

/* ── Download ── */

function download() {
  const url = urlInput.value.trim();
  if (!url || !currentInfo) {
    showStatus('Fetch a video first', 'error');
    return;
  }

  const params = new URLSearchParams({ url, format_id: selectedFormatId, dl: '1' });
  window.location.href = API_BASE + '/api/download?' + params.toString();
}

/* ── Events ── */

fetchBtn.addEventListener('click', fetchInfo);
downloadBtn.addEventListener('click', download);

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchInfo();
});
