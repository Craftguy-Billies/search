/* ============================================
   YouTube Displayer — Player & Playlist Logic
   ============================================ */

const STORAGE_KEY = 'yt_playlist';
const HISTORY_KEY = 'yt_history';
const MAX_HISTORY = 50;

/* ── State ── */

let player = null;
let currentVideoId = null;
let playlist = loadPlaylist();
let history = loadHistory();
let activeTab = 'playlist';

/* ── DOM refs ── */

const playerWrapper = document.getElementById('player-wrapper');
const playerPlaceholder = document.getElementById('player-placeholder');
const playerEl = document.getElementById('player');
const videoInfo = document.getElementById('video-info');
const videoTitle = document.getElementById('video-title');
const videoChannel = document.getElementById('video-channel');
const videoInput = document.getElementById('video-input');
const addBtn = document.getElementById('add-btn');
const themeToggle = document.getElementById('theme-toggle');
const playlistPanel = document.getElementById('playlist-panel');
const historyPanel = document.getElementById('history-panel');
const listCounter = document.getElementById('list-counter');

/* ── YouTube URL parsing ── */

function extractVideoId(input) {
  const trimmed = input.trim();
  // Already a bare video ID (11 chars, alphanumeric + _ and -)
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  // Standard youtube.com/watch?v=...
  const match = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/* ── oEmbed fetch ── */

async function fetchVideoMetadata(videoId) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('oEmbed failed');
    return await res.json();
  } catch {
    return { title: `YouTube Video`, author_name: 'YouTube' };
  }
}

/* ── Player ── */

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onload = () => {
      window.onYouTubeIframeAPIReady = resolve;
    };
    document.head.appendChild(tag);
  });
}

let apiLoaded = false;

async function playVideo(videoId) {
  if (currentVideoId === videoId && player) return;

  currentVideoId = videoId;

  if (!apiLoaded) {
    await loadYouTubeAPI();
    apiLoaded = true;
  }

  playerPlaceholder.style.display = 'none';
  playerEl.style.display = '';

  if (player) {
    player.loadVideoById(videoId);
  } else {
    player = new YT.Player('player', {
      videoId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
      },
    });
  }

  // Fetch metadata and update UI
  const meta = await fetchVideoMetadata(videoId);
  videoTitle.textContent = meta.title || `YouTube Video`;
  videoChannel.textContent = meta.author_name || 'YouTube';
  videoInfo.style.display = '';

  // Save to history and refresh views
  addToHistory(videoId, meta.title || 'YouTube Video', meta.author_name || 'YouTube');
  renderPlaylist();
}

/* ── Playlist ── */

function loadPlaylist() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function savePlaylist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlist));
  } catch { /* noop */ }
}

function addToPlaylist(videoId) {
  // Don't add duplicates
  if (playlist.some(v => v.id === videoId)) return false;

  // Use a simple unique title fallback until oEmbed loads
  playlist.push({ id: videoId, title: 'Loading…', channel: '' });
  savePlaylist();
  renderPlaylist();

  // Fetch metadata asynchronously
  fetchVideoMetadata(videoId).then(meta => {
    const entry = playlist.find(v => v.id === videoId);
    if (entry) {
      entry.title = meta.title || `YouTube Video`;
      entry.channel = meta.author_name || 'YouTube';
      savePlaylist();
      renderPlaylist();
    }
  });

  // Auto-play the added video
  playVideo(videoId);
  return true;
}

function removeFromPlaylist(videoId) {
  playlist = playlist.filter(v => v.id !== videoId);
  savePlaylist();
  renderPlaylist();

  if (currentVideoId === videoId) {
    currentVideoId = null;
    if (player) {
      player.destroy();
      player = null;
    }
    playerEl.style.display = 'none';
    playerPlaceholder.style.display = 'flex';
    videoInfo.style.display = 'none';
  }
}

function renderPlaylist() {
  if (playlist.length === 0) {
    playlistPanel.innerHTML = '<div class="list-empty">Your playlist is empty</div>';
    updateCounter(0);
    return;
  }

  playlistPanel.innerHTML = playlist.map(v => `
    <div class="list-item${v.id === currentVideoId ? ' active' : ''}" data-id="${v.id}">
      <img class="list-item-thumb" src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg"
        alt="" loading="lazy" onerror="this.style.display='none'">
      <div class="list-item-body">
        <div class="list-item-title">${escapeHtml(v.title)}</div>
        <div class="list-item-channel">${escapeHtml(v.channel)}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-sm btn-secondary play-btn" data-id="${v.id}">▶</button>
        <button class="btn btn-sm btn-ghost remove-btn" data-id="${v.id}">✕</button>
      </div>
    </div>
  `).join('');

  updateCounter(playlist.length);

  // Event delegation for list item clicks
  playlistPanel.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.list-item-actions')) return;
      playVideo(item.dataset.id);
    });
  });

  playlistPanel.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playVideo(btn.dataset.id);
    });
  });

  playlistPanel.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromPlaylist(btn.dataset.id);
    });
  });
}

/* ── History ── */

function loadHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* noop */ }
}

function addToHistory(videoId, title, channel) {
  history = history.filter(h => h.id !== videoId);
  history.unshift({ id: videoId, title, channel, timestamp: Date.now() });
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  saveHistory();
  if (activeTab === 'history') renderHistory();
}

function renderHistory() {
  if (history.length === 0) {
    historyPanel.innerHTML = '<div class="list-empty">No watch history yet</div>';
    return;
  }

  historyPanel.innerHTML = history.map(h => `
    <div class="list-item" data-id="${h.id}">
      <img class="list-item-thumb" src="https://i.ytimg.com/vi/${h.id}/mqdefault.jpg"
        alt="" loading="lazy" onerror="this.style.display='none'">
      <div class="list-item-body">
        <div class="list-item-title">${escapeHtml(h.title)}</div>
        <div class="list-item-channel">${escapeHtml(h.channel)} · ${timeAgo(h.timestamp)}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-sm btn-secondary play-btn" data-id="${h.id}">▶</button>
      </div>
    </div>
  `).join('');

  historyPanel.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.list-item-actions')) return;
      playVideo(item.dataset.id);
    });
  });

  historyPanel.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playVideo(btn.dataset.id);
    });
  });
}

/* ── Helpers ── */

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function timeAgo(timestamp) {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function updateCounter(count) {
  listCounter.textContent = `${count} video${count !== 1 ? 's' : ''}`;
}

/* ── Tabs ── */

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  playlistPanel.style.display = tab === 'playlist' ? '' : 'none';
  historyPanel.style.display = tab === 'history' ? '' : 'none';
  if (tab === 'history') renderHistory();
}

/* ── Theme ── */

function loadTheme() {
  try {
    return localStorage.getItem('landing_theme') === 'light';
  } catch {
    return false;
  }
}

function applyTheme(isLight) {
  document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
  themeToggle.textContent = isLight ? '☀️' : '🌙';
}

function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  applyTheme(!isLight);
  try {
    localStorage.setItem('landing_theme', isLight ? 'dark' : 'light');
  } catch { /* noop */ }
}

/* ── Input handling ── */

function handleAdd() {
  const raw = videoInput.value;
  const videoId = extractVideoId(raw);

  if (!videoId) {
    videoInput.style.borderColor = 'var(--accent)';
    videoInput.focus();
    setTimeout(() => { videoInput.style.borderColor = ''; }, 800);
    return;
  }

  videoInput.value = '';
  videoInput.style.borderColor = '';

  if (addToPlaylist(videoId)) {
    // Switch to playlist tab to show the new item
    if (activeTab !== 'playlist') switchTab('playlist');
  }
}

/* ── Init ── */

videoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAdd();
});
addBtn.addEventListener('click', handleAdd);

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});
themeToggle.addEventListener('click', toggleTheme);

applyTheme(loadTheme());
renderPlaylist();
renderHistory();
updateCounter(playlist.length);
