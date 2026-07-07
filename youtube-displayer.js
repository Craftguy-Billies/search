/* ============================================
   YouTube Video Player — Frontend Logic
   ============================================ */

const YTD = {
  // ── Extract video ID from various URL formats ──
  extractId(input) {
    const s = input.trim();
    // Bare 11-char video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    // youtube.com/watch?v=
    const m1 = s.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
    if (m1) return m1[1];
    // youtu.be/
    const m2 = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m2) return m2[1];
    // youtube.com/embed/
    const m3 = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (m3) return m3[1];
    return null;
  },

  // ── Storage keys ──
  STORAGE: { PLAYLIST: 'ytd_playlist', HISTORY: 'ytd_history' },

  // ── State ──
  player: null,
  playlist: [],
  history: [],
  currentId: null,
  ready: false,
  queue: [],

  // ── DOM refs ──
  dom: {},

  init() {
    this.dom = {
      urlInput: document.getElementById('ytdUrl'),
      playBtn: document.getElementById('ytdPlayBtn'),
      addBtn: document.getElementById('ytdAddBtn'),
      error: document.getElementById('ytdError'),
      placeholder: document.getElementById('ytdPlaceholder'),
      player: document.getElementById('ytdPlayer'),
      nowPlaying: document.getElementById('ytdNowPlaying'),
      nowThumb: document.getElementById('ytdNowThumb'),
      nowTitle: document.getElementById('ytdNowTitle'),
      nowChannel: document.getElementById('ytdNowChannel'),
      playlistList: document.getElementById('ytdPlaylistList'),
      historyList: document.getElementById('ytdHistoryList'),
      playlistTab: document.getElementById('ytdPlaylistTab'),
      historyTab: document.getElementById('ytdHistoryTab'),
      clearPlaylist: document.getElementById('ytdClearPlaylist'),
      clearHistory: document.getElementById('ytdClearHistory'),
      tabs: document.querySelectorAll('.ytd-tab'),
    };

    this.loadState();
    this.bindEvents();
    this.renderPlaylist();
    this.renderHistory();
  },

  loadState() {
    try {
      this.playlist = JSON.parse(localStorage.getItem(this.STORAGE.PLAYLIST)) || [];
      this.history = JSON.parse(localStorage.getItem(this.STORAGE.HISTORY)) || [];
    } catch {
      this.playlist = [];
      this.history = [];
    }
  },

  saveState() {
    localStorage.setItem(this.STORAGE.PLAYLIST, JSON.stringify(this.playlist));
    localStorage.setItem(this.STORAGE.HISTORY, JSON.stringify(this.history));
  },

  // ── Toast-like error ──
  showError(msg) {
    this.dom.error.textContent = msg;
    this.dom.error.classList.add('visible');
    setTimeout(() => this.dom.error.classList.remove('visible'), 4000);
  },

  // ── Fetch video metadata via oEmbed ──
  async fetchMeta(id) {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Could not fetch video info');
    return res.json();
  },

  // ── Play a video by ID ──
  play(id) {
    this.currentId = id;
    this.dom.placeholder.style.display = 'none';
    this.dom.nowPlaying.style.display = 'flex';

    if (!this.ready) {
      // Queue if API not ready yet
      this.queue.push(id);
      return;
    }

    this.player.loadVideoById(id);
    this.addToHistory(id);
    this.updateNowPlaying(id);
    this.renderPlaylist();
    this.renderHistory();
  },

  // ── Update "now playing" bar with metadata ──
  async updateNowPlaying(id) {
    this.dom.nowThumb.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    this.dom.nowThumb.alt = '';
    try {
      const meta = await this.fetchMeta(id);
      this.dom.nowTitle.textContent = meta.title || 'Unknown';
      this.dom.nowChannel.textContent = meta.author_name || 'Unknown channel';
    } catch {
      this.dom.nowTitle.textContent = 'Video';
      this.dom.nowChannel.textContent = '';
    }
  },

  // ── Handle URL input (play or add) ──
  getInputId() {
    const raw = this.dom.urlInput.value.trim();
    if (!raw) { this.showError('Please paste a YouTube URL or video ID'); return null; }
    const id = this.extractId(raw);
    if (!id) { this.showError('Invalid YouTube URL — could not extract video ID'); return null; }
    return id;
  },

  // ── Playlist ──
  addToPlaylist(id) {
    if (this.playlist.some(v => v.id === id)) {
      this.showError('Already in playlist');
      return;
    }
    this.playlist.push({ id, title: null, channel: null });
    this.saveState();
    this.renderPlaylist();
    // Fetch metadata asynchronously
    this.fetchMeta(id).then(meta => {
      const item = this.playlist.find(v => v.id === id);
      if (item) { item.title = meta.title; item.channel = meta.author_name; }
      this.saveState();
      this.renderPlaylist();
    }).catch(() => {});
  },

  removeFromPlaylist(id) {
    this.playlist = this.playlist.filter(v => v.id !== id);
    this.saveState();
    this.renderPlaylist();
  },

  renderPlaylist() {
    const list = this.dom.playlistList;
    if (this.playlist.length === 0) {
      list.innerHTML = '<div class="ytd-empty">Playlist is empty — add some videos!</div>';
      this.dom.clearPlaylist.classList.remove('visible');
      return;
    }
    this.dom.clearPlaylist.classList.add('visible');
    list.innerHTML = this.playlist.map(v => `
      <div class="ytd-list-item${v.id === this.currentId ? ' active' : ''}" data-id="${v.id}">
        <img src="https://img.youtube.com/vi/${v.id}/default.jpg" alt="" loading="lazy">
        <div class="ytd-list-item-info">
          <div class="ytd-list-item-title">${v.title || 'Loading…'}</div>
          <div class="ytd-list-item-meta">${v.channel || ''}</div>
        </div>
        <button class="ytd-list-item-remove" data-id="${v.id}">✕</button>
      </div>
    `).join('');

    // Click to play
    list.querySelectorAll('.ytd-list-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.ytd-list-item-remove')) return;
        this.play(el.dataset.id);
      });
    });
    // Remove buttons
    list.querySelectorAll('.ytd-list-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeFromPlaylist(btn.dataset.id);
      });
    });
  },

  // ── History ──
  addToHistory(id) {
    this.history = this.history.filter(v => v.id !== id);
    this.history.unshift({ id, title: null, channel: null, ts: Date.now() });
    if (this.history.length > 50) this.history = this.history.slice(0, 50);
    this.saveState();
    // Fetch metadata
    this.fetchMeta(id).then(meta => {
      const item = this.history.find(v => v.id === id);
      if (item) { item.title = meta.title; item.channel = meta.author_name; }
      this.saveState();
      this.renderHistory();
    }).catch(() => {});
  },

  clearHistory() {
    this.history = [];
    this.saveState();
    this.renderHistory();
  },

  clearPlaylist() {
    this.playlist = [];
    this.saveState();
    this.renderPlaylist();
  },

  renderHistory() {
    const list = this.dom.historyList;
    if (this.history.length === 0) {
      list.innerHTML = '<div class="ytd-empty">No watch history yet</div>';
      this.dom.clearHistory.classList.remove('visible');
      return;
    }
    this.dom.clearHistory.classList.add('visible');
    list.innerHTML = this.history.map(v => `
      <div class="ytd-list-item${v.id === this.currentId ? ' active' : ''}" data-id="${v.id}">
        <img src="https://img.youtube.com/vi/${v.id}/default.jpg" alt="" loading="lazy">
        <div class="ytd-list-item-info">
          <div class="ytd-list-item-title">${v.title || 'Loading…'}</div>
          <div class="ytd-list-item-meta">${v.channel ? v.channel + ' · ' : ''}${this.timeAgo(v.ts)}</div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.ytd-list-item').forEach(el => {
      el.addEventListener('click', () => this.play(el.dataset.id));
    });
  },

  timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  },

  // ── Events ──
  bindEvents() {
    this.dom.playBtn.addEventListener('click', () => {
      const id = this.getInputId();
      if (id) { this.play(id); this.dom.urlInput.value = ''; }
    });

    this.dom.addBtn.addEventListener('click', () => {
      const id = this.getInputId();
      if (id) { this.addToPlaylist(id); this.dom.urlInput.value = ''; }
    });

    this.dom.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.dom.playBtn.click();
    });

    this.dom.clearPlaylist.addEventListener('click', () => this.clearPlaylist());
    this.dom.clearHistory.addEventListener('click', () => this.clearHistory());

    // Tabs
    this.dom.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.dom.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        this.dom.playlistTab.classList.toggle('active', target === 'playlist');
        this.dom.historyTab.classList.toggle('active', target === 'history');
      });
    });
  },
};

// ── YouTube IFrame API callback ──
function onYouTubeIframeAPIReady() {
  YTD.player = new YT.Player('ytdPlayer', {
    height: '100%',
    width: '100%',
    playerVars: { autoplay: 1, rel: 0 },
    events: {
      onReady: () => {
        YTD.ready = true;
        // Process queued plays
        YTD.queue.forEach(id => YTD.player.loadVideoById(id));
        YTD.queue = [];
      },
    },
  });
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => YTD.init());
