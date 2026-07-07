/* ============================================
   <yt-player> — YouTube Video Displayer Web Component
   Reusable custom element with Shadow DOM.
   Drop it into any HTML page:
     <yt-player playlist history></yt-player>
   ============================================ */

const YT_PLAYER_STYLES = `
  :host {
    --ytp-radius: 12px;
    --ytp-bg: var(--card-bg, rgba(255,255,255,0.04));
    --ytp-border: var(--card-border, rgba(255,255,255,0.06));
    --ytp-text: var(--text-primary, #fff);
    --ytp-text-sec: var(--text-secondary, rgba(255,255,255,0.6));
    --ytp-text-dim: var(--text-dim, rgba(255,255,255,0.3));
    --ytp-accent: #ee5a24;
    --ytp-error: #ff4444;

    display: block;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--ytp-text);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  .ytp-container {
    background: var(--ytp-bg);
    border: 1px solid var(--ytp-border);
    border-radius: var(--ytp-radius);
    overflow: hidden;
    backdrop-filter: blur(10px);
    transition: background 0.3s, border-color 0.3s;
  }

  /* ── Input ── */
  .ytp-input-area {
    display: flex;
    gap: 8px;
    padding: 16px;
    border-bottom: 1px solid var(--ytp-border);
  }

  .ytp-input-area input {
    flex: 1;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--ytp-border);
    background: rgba(255,255,255,0.05);
    color: var(--ytp-text);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    min-width: 0;
  }

  .ytp-input-area input::placeholder { color: var(--ytp-text-dim); }
  .ytp-input-area input:focus { border-color: var(--ytp-accent); }

  .ytp-input-area button {
    padding: 10px 18px;
    border-radius: 8px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    white-space: nowrap;
  }

  .ytp-input-area button:active { transform: scale(0.97); }

  .ytp-btn-play {
    background: var(--ytp-accent);
    color: #fff;
  }

  .ytp-btn-play:hover { opacity: 0.9; }

  .ytp-btn-add {
    background: var(--ytp-bg);
    color: var(--ytp-text);
    border: 1px solid var(--ytp-border) !important;
  }

  .ytp-btn-add:hover { background: rgba(255,255,255,0.08); }

  /* ── Error ── */
  .ytp-error {
    display: none;
    padding: 8px 16px;
    background: rgba(255,68,68,0.1);
    border-bottom: 1px solid rgba(255,68,68,0.2);
    color: var(--ytp-error);
    font-size: 13px;
  }

  .ytp-error.visible { display: block; }

  /* ── Layout ── */
  .ytp-body {
    display: grid;
    grid-template-columns: 1fr;
  }

  .ytp-body.has-sidebar {
    grid-template-columns: 1fr 280px;
  }

  @media (max-width: 700px) {
    .ytp-body.has-sidebar { grid-template-columns: 1fr; }
  }

  /* ── Player ── */
  .ytp-player-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
  }

  .ytp-player-wrap iframe {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    border: none;
  }

  .ytp-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.55);
    color: #fff;
    text-align: center;
    padding: 24px;
  }

  .ytp-placeholder-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.7; }
  .ytp-placeholder h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
  .ytp-placeholder p { font-size: 13px; opacity: 0.6; }

  /* ── Now Playing ── */
  .ytp-now-playing {
    display: none;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid var(--ytp-border);
    align-items: center;
  }

  .ytp-now-playing.visible { display: flex; }

  .ytp-now-playing img {
    width: 72px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
    background: rgba(255,255,255,0.05);
  }

  .ytp-now-info { flex: 1; min-width: 0; }
  .ytp-now-title { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ytp-now-channel { font-size: 12px; color: var(--ytp-text-sec); margin-top: 2px; }

  /* ── Sidebar ── */
  .ytp-sidebar {
    border-left: 1px solid var(--ytp-border);
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 700px) {
    .ytp-sidebar { border-left: none; border-top: 1px solid var(--ytp-border); }
  }

  .ytp-tabs {
    display: flex;
    border-bottom: 1px solid var(--ytp-border);
  }

  .ytp-tab {
    flex: 1;
    padding: 12px 8px;
    background: none;
    border: none;
    color: var(--ytp-text-sec);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.2s, background 0.2s;
  }

  .ytp-tab:hover { color: var(--ytp-text); background: rgba(255,255,255,0.03); }
  .ytp-tab.active { color: var(--ytp-text); box-shadow: inset 0 -2px 0 var(--ytp-accent); }

  .ytp-tab-content { display: none; flex-direction: column; flex: 1; }
  .ytp-tab-content.active { display: flex; }

  .ytp-list {
    flex: 1;
    min-height: 150px;
    max-height: 320px;
    overflow-y: auto;
    padding: 6px;
  }

  .ytp-list::-webkit-scrollbar { width: 4px; }
  .ytp-list::-webkit-scrollbar-track { background: transparent; }
  .ytp-list::-webkit-scrollbar-thumb { background: var(--ytp-border); border-radius: 2px; }

  .ytp-empty {
    text-align: center;
    padding: 32px 12px;
    color: var(--ytp-text-dim);
    font-size: 13px;
  }

  /* ── List Items ── */
  .ytp-item {
    display: flex;
    gap: 8px;
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
    position: relative;
  }

  .ytp-item:hover { background: rgba(255,255,255,0.06); }
  .ytp-item.active { background: rgba(238,90,36,0.12); border: 1px solid rgba(238,90,36,0.25); }

  .ytp-item img {
    width: 72px;
    height: 40px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
    background: rgba(255,255,255,0.05);
  }

  .ytp-item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .ytp-item-title { font-size: 12px; font-weight: 600; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .ytp-item-meta { font-size: 11px; color: var(--ytp-text-dim); margin-top: 2px; }

  .ytp-item-remove {
    position: absolute;
    top: 4px; right: 4px;
    width: 20px; height: 20px;
    border-radius: 50%;
    border: none;
    background: rgba(0,0,0,0.5);
    color: #fff;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .ytp-item:hover .ytp-item-remove { opacity: 1; }

  .ytp-clear-btn {
    display: none;
    width: 100%;
    padding: 10px;
    border: none;
    border-top: 1px solid var(--ytp-border);
    background: none;
    color: var(--ytp-text-dim);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s, background 0.2s;
  }

  .ytp-clear-btn:hover { color: var(--ytp-error); background: rgba(255,68,68,0.06); }
  .ytp-clear-btn.visible { display: block; }
`;

class YTPlayer extends HTMLElement {
  static get observedAttributes() {
    return ['playlist', 'history', 'width'];
  }

  #root;
  #els = {};
  #player = null;
  #playlist = [];
  #history = [];
  #currentId = null;
  #apiReady = false;
  #queue = [];
  #pendingMeta = new Map();

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
    this.#root.innerHTML = `<style>${YT_PLAYER_STYLES}</style>${this.#template()}`;
  }

  #template() {
    return `
      <div class="ytp-container">
        <div class="ytp-input-area">
          <input type="url" placeholder="Paste YouTube URL or video ID…" autocomplete="off" spellcheck="false">
          <button class="ytp-btn-play" data-action="play">▶ Play</button>
          <button class="ytp-btn-add" data-action="add">+ Add</button>
        </div>
        <div class="ytp-error"></div>

        <div class="ytp-body">
          <div class="ytp-main">
            <div class="ytp-player-wrap">
              <div class="ytp-placeholder">
                <div class="ytp-placeholder-icon">🎬</div>
                <h3>No video loaded</h3>
                <p>Paste a YouTube URL and click <strong>Play</strong></p>
              </div>
              <div class="ytp-player-target"></div>
            </div>
            <div class="ytp-now-playing">
              <img alt="" loading="lazy">
              <div class="ytp-now-info">
                <div class="ytp-now-title"></div>
                <div class="ytp-now-channel"></div>
              </div>
            </div>
          </div>

          <div class="ytp-sidebar" id="sidebar">
            <div class="ytp-tabs">
              <button class="ytp-tab active" data-tab="playlist">📋 Playlist</button>
              <button class="ytp-tab" data-tab="history">🕐 History</button>
            </div>
            <div class="ytp-tab-content active" data-tab="playlist">
              <div class="ytp-list"></div>
              <button class="ytp-clear-btn" data-action="clear-playlist">Clear All</button>
            </div>
            <div class="ytp-tab-content" data-tab="history">
              <div class="ytp-list"></div>
              <button class="ytp-clear-btn" data-action="clear-history">Clear All</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.#cacheEls();
    this.#loadState();
    this.#bindEvents();
    this.#render();
    this.#updateSidebar();
    this.#ensureIFrameAPI();

    // Expose methods on the element itself
    this.loadVideo = this.#play.bind(this);
    this.addToPlaylist = this.#addToPlaylist.bind(this);
  }

  disconnectedCallback() {
    // Cleanup global listeners if needed
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'playlist' || name === 'history') {
      this.#updateSidebar();
    }
  }

  // ── Public Properties ──

  get videoId() { return this.#currentId; }

  get playlistItems() { return [...this.#playlist]; }

  get historyItems() { return [...this.#history]; }

  // ── DOM Cache ──

  #cacheEls() {
    const s = this.#root;
    this.#els = {
      input: s.querySelector('.ytp-input-area input'),
      playBtn: s.querySelector('[data-action="play"]'),
      addBtn: s.querySelector('[data-action="add"]'),
      error: s.querySelector('.ytp-error'),
      placeholder: s.querySelector('.ytp-placeholder'),
      playerTarget: s.querySelector('.ytp-player-target'),
      nowPlaying: s.querySelector('.ytp-now-playing'),
      nowThumb: s.querySelector('.ytp-now-playing img'),
      nowTitle: s.querySelector('.ytp-now-info .ytp-now-title'),
      nowChannel: s.querySelector('.ytp-now-info .ytp-now-channel'),
      sidebar: s.querySelector('#sidebar'),
      tabs: s.querySelectorAll('.ytp-tab'),
      playlistList: s.querySelector('[data-tab="playlist"] .ytp-list'),
      historyList: s.querySelector('[data-tab="history"] .ytp-list'),
      clearPlaylist: s.querySelector('[data-action="clear-playlist"]'),
      clearHistory: s.querySelector('[data-action="clear-history"]'),
      body: s.querySelector('.ytp-body'),
    };
  }

  #updateSidebar() {
    const hasPlaylist = this.hasAttribute('playlist');
    const hasHistory = this.hasAttribute('history');
    this.#els.sidebar.style.display = (hasPlaylist || hasHistory) ? 'flex' : 'none';
    this.#els.body.classList.toggle('has-sidebar', hasPlaylist || hasHistory);

    // Show only relevant tabs
    this.#els.tabs.forEach(tab => {
      const isPlaylist = tab.dataset.tab === 'playlist';
      tab.style.display = (isPlaylist && hasPlaylist) || (!isPlaylist && hasHistory) ? '' : 'none';
    });
  }

  // ── Storage ──

  #storageKey(key) { return `yt-player-${key}`; }

  #loadState() {
    const prefix = 'yt-player';
    try {
      this.#playlist = JSON.parse(localStorage.getItem(`${prefix}-playlist`)) || [];
      this.#history = JSON.parse(localStorage.getItem(`${prefix}-history`)) || [];
    } catch {
      this.#playlist = [];
      this.#history = [];
    }
  }

  #saveState() {
    localStorage.setItem(this.#storageKey('playlist'), JSON.stringify(this.#playlist));
    localStorage.setItem(this.#storageKey('history'), JSON.stringify(this.#history));
  }

  // ── Error ──

  #showError(msg) {
    this.#els.error.textContent = msg;
    this.#els.error.classList.add('visible');
    setTimeout(() => this.#els.error.classList.remove('visible'), 4000);
  }

  // ── Video ID extraction ──

  extractId(input) {
    const s = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    const m1 = s.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
    if (m1) return m1[1];
    const m2 = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m2) return m2[1];
    const m3 = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (m3) return m3[1];
    return null;
  }

  // ── Metadata ──

  async #fetchMeta(id) {
    if (this.#pendingMeta.has(id)) return this.#pendingMeta.get(id);
    const p = fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); });
    this.#pendingMeta.set(id, p);
    try { return await p; } finally { this.#pendingMeta.delete(id); }
  }

  // ── Play ──

  #play(id) {
    this.#currentId = id;
    this.#els.placeholder.style.display = 'none';

    if (!this.#apiReady) {
      this.#queue.push(id);
      return;
    }

    this.#player.loadVideoById(id);
    this.#addToHistory(id);
    this.#updateNowPlaying(id);
    this.#render();

    this.dispatchEvent(new CustomEvent('play', { detail: { id }, bubbles: true }));
  }

  async #updateNowPlaying(id) {
    const np = this.#els;
    np.nowPlaying.classList.add('visible');
    np.nowThumb.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    try {
      const meta = await this.#fetchMeta(id);
      np.nowTitle.textContent = meta.title || 'Unknown';
      np.nowChannel.textContent = meta.author_name || '';
    } catch {
      np.nowTitle.textContent = 'Video';
      np.nowChannel.textContent = '';
    }
  }

  // ── Input handling ──

  #getInputId() {
    const raw = this.#els.input.value.trim();
    if (!raw) { this.#showError('Paste a YouTube URL or video ID'); return null; }
    const id = this.extractId(raw);
    if (!id) { this.#showError('Could not extract video ID from that URL'); return null; }
    return id;
  }

  // ── Playlist ──

  #addToPlaylist(id) {
    if (this.#playlist.some(v => v.id === id)) {
      this.#showError('Already in playlist');
      return;
    }
    this.#playlist.push({ id, title: null, channel: null });
    this.#saveState();
    this.#renderList('playlist');
    // Fetch metadata asynchronously
    this.#fetchMeta(id).then(meta => {
      const item = this.#playlist.find(v => v.id === id);
      if (item) { item.title = meta.title; item.channel = meta.author_name; }
      this.#saveState();
      this.#renderList('playlist');
    }).catch(() => {});
  }

  #removeFromPlaylist(id) {
    this.#playlist = this.#playlist.filter(v => v.id !== id);
    this.#saveState();
    this.#renderList('playlist');
  }

  #clearPlaylist() {
    this.#playlist = [];
    this.#saveState();
    this.#renderList('playlist');
  }

  // ── History ──

  #addToHistory(id) {
    this.#history = this.#history.filter(v => v.id !== id);
    this.#history.unshift({ id, title: null, channel: null, ts: Date.now() });
    if (this.#history.length > 50) this.#history = this.#history.slice(0, 50);
    this.#saveState();
    this.#fetchMeta(id).then(meta => {
      const item = this.#history.find(v => v.id === id);
      if (item) { item.title = meta.title; item.channel = meta.author_name; }
      this.#saveState();
      this.#renderList('history');
    }).catch(() => {});
  }

  #clearHistory() {
    this.#history = [];
    this.#saveState();
    this.#renderList('history');
  }

  #timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  // ── Rendering ──

  #render() {
    this.#renderList('playlist');
    this.#renderList('history');
  }

  #renderList(type) {
    const items = type === 'playlist' ? this.#playlist : this.#history;
    const list = type === 'playlist' ? this.#els.playlistList : this.#els.historyList;
    const clearBtn = type === 'playlist' ? this.#els.clearPlaylist : this.#els.clearHistory;

    if (items.length === 0) {
      list.innerHTML = `<div class="ytp-empty">${type === 'playlist' ? 'Playlist is empty' : 'No watch history yet'}</div>`;
      clearBtn.classList.remove('visible');
      return;
    }

    clearBtn.classList.add('visible');
    list.innerHTML = items.map(v => {
      const isActive = v.id === this.#currentId;
      const meta = type === 'history' && v.ts
        ? `${v.channel || ''}${v.channel ? ' · ' : ''}${this.#timeAgo(v.ts)}`
        : (v.channel || '');
      return `
        <div class="ytp-item${isActive ? ' active' : ''}" data-id="${v.id}">
          <img src="https://img.youtube.com/vi/${v.id}/default.jpg" alt="" loading="lazy">
          <div class="ytp-item-info">
            <div class="ytp-item-title">${v.title || 'Loading…'}</div>
            <div class="ytp-item-meta">${meta}</div>
          </div>
          ${type === 'playlist' ? '<button class="ytp-item-remove" data-id="'+v.id+'">✕</button>' : ''}
        </div>
      `;
    }).join('');

    list.querySelectorAll('.ytp-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.ytp-item-remove')) return;
        this.#play(el.dataset.id);
      });
    });

    if (type === 'playlist') {
      list.querySelectorAll('.ytp-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.#removeFromPlaylist(btn.dataset.id);
        });
      });
    }
  }

  // ── Events ──

  #bindEvents() {
    const els = this.#els;

    els.playBtn.addEventListener('click', () => {
      const id = this.#getInputId();
      if (id) { this.#play(id); els.input.value = ''; }
    });

    els.addBtn.addEventListener('click', () => {
      const id = this.#getInputId();
      if (id) { this.#addToPlaylist(id); els.input.value = ''; }
    });

    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') els.playBtn.click();
    });

    els.clearPlaylist.addEventListener('click', () => this.#clearPlaylist());
    els.clearHistory.addEventListener('click', () => this.#clearHistory());

    els.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab.style.display === 'none') return;
        els.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        this.#root.querySelectorAll('.ytp-tab-content').forEach(c => {
          c.classList.toggle('active', c.dataset.tab === target);
        });
      });
    });
  }

  // ── YouTube IFrame API ──

  #ensureIFrameAPI() {
    if (window.YT && window.YT.Player) {
      this.#onAPIReady();
      return;
    }
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    // Poll for YT readiness
    const check = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(check);
        this.#onAPIReady();
      }
    }, 200);
  }

  #onAPIReady() {
    this.#player = new YT.Player(this.#els.playerTarget, {
      height: '100%',
      width: '100%',
      playerVars: { autoplay: 1, rel: 0 },
      events: {
        onReady: () => {
          this.#apiReady = true;
          this.#queue.forEach(id => this.#player.loadVideoById(id));
          this.#queue = [];
        },
      },
    });
  }
}

customElements.define('yt-player', YTPlayer);
