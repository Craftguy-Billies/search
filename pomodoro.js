/* ============================================
   Pomodoro — Timer Logic
   ============================================ */

const FOCUS_TIME = 25 * 60;   // 25 minutes in seconds
const BREAK_TIME = 5 * 60;    // 5 minutes in seconds
const CIRCUMFERENCE = 2 * Math.PI * 100; // ~628.32

const state = {
  timeLeft: FOCUS_TIME,
  totalTime: FOCUS_TIME,
  isRunning: false,
  isFinished: false,
  phase: 'focus', // 'focus' | 'break'
  sessionCount: 0,
  intervalId: null,
};

const HISTORY_KEY = 'pomodoro_history';
const MAX_HISTORY = 50;

const displayEl = document.getElementById('timer-display');
const phaseLabel = document.getElementById('phase-label');
const progressFill = document.getElementById('progress-fill');
const progressBarFill = document.getElementById('progress-bar-fill');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const sessionCountEl = document.getElementById('session-count');
const themeToggle = document.getElementById('theme-toggle');
const appEl = document.querySelector('.app');
const historyListEl = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

/* ── Display ── */

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateDisplay() {
  displayEl.textContent = formatTime(state.timeLeft);
  const progress = 1 - state.timeLeft / state.totalTime;
  progressFill.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  progressBarFill.style.width = `${progress * 100}%`;
}

function updateSessionStats() {
  sessionCountEl.textContent = `#${state.sessionCount}`;
}

function updatePhaseLabel() {
  phaseLabel.textContent = state.phase === 'focus' ? 'Focus' : 'Break';
}

function updateRunningClass() {
  appEl.classList.toggle('running', state.isRunning);
  appEl.classList.toggle('finished', state.isFinished);
}

function updateButtons() {
  startBtn.disabled = state.isRunning || state.isFinished;
  pauseBtn.disabled = !state.isRunning;
}

/* ── Session History ── */

function loadHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch { /* noop */ }
}

function addHistoryEntry() {
  const entries = loadHistory();
  entries.unshift({ timestamp: new Date().toISOString() });
  if (entries.length > MAX_HISTORY) entries.length = MAX_HISTORY;
  saveHistory(entries);
  renderHistory(entries);
}

function clearHistory() {
  saveHistory([]);
  renderHistory([]);
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(isoString).toLocaleDateString();
}

function formatTimeAMPM(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function renderHistory(entries) {
  if (!entries || entries.length === 0) {
    historyListEl.innerHTML = '<div class="history-empty">No sessions yet</div>';
    return;
  }

  historyListEl.innerHTML = entries.slice(0, 20).map(e => `
    <div class="history-entry" title="${new Date(e.timestamp).toLocaleString()}">
      <span class="history-entry-time">${timeAgo(e.timestamp)}</span>
      <span class="history-entry-label">${formatTimeAMPM(e.timestamp)}</span>
    </div>
  `).join('');
}

/* ── Sound ── */

function playNotificationSound() {
  // Generates a three-note ascending chime via Web Audio API (no external files)
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    // Three-note chime: C5 → E5 → G5 (ascending major triad)
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.5);
    });
  } catch {
    // Audio not available — silent fallback
  }
}

/* ── Timer core ── */

function tick() {
  if (state.timeLeft <= 0) {
    finishPhase();
    return;
  }

  state.timeLeft -= 1;
  updateDisplay();
}

function finishPhase() {
  stopTimer();
  playNotificationSound();

  if (state.phase === 'focus') {
    state.sessionCount += 1;
    updateSessionStats();
    addHistoryEntry();
    state.phase = 'break';
    state.totalTime = BREAK_TIME;
    state.timeLeft = BREAK_TIME;
    state.isFinished = true;
    updatePhaseLabel();
    updateDisplay();
    updateRunningClass();
    updateButtons();
  } else {
    // Break finished — reset to focus
    state.phase = 'focus';
    state.totalTime = FOCUS_TIME;
    state.timeLeft = FOCUS_TIME;
    state.isFinished = false;
    updatePhaseLabel();
    updateDisplay();
    updateRunningClass();
    updateButtons();
  }

  progressFill.style.strokeDashoffset = '0';
}

/* ── Controls ── */

function startTimer() {
  if (state.isRunning || state.isFinished) return;

  state.isRunning = true;
  state.isFinished = false;
  updateRunningClass();
  updateButtons();

  state.intervalId = setInterval(tick, 1000);
}

function pauseTimer() {
  if (!state.isRunning) return;

  stopTimer();
  state.isRunning = false;
  updateRunningClass();
  updateButtons();
}

function stopTimer() {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

function resetTimer() {
  stopTimer();

  state.isRunning = false;
  state.isFinished = false;
  state.phase = 'focus';
  state.totalTime = FOCUS_TIME;
  state.timeLeft = FOCUS_TIME;

  updatePhaseLabel();
  updateDisplay();
  updateRunningClass();
  updateButtons();

  progressFill.style.strokeDashoffset = '0';
}

/* ── Theme ── */

function loadTheme() {
  try {
    return localStorage.getItem('pomodoro_theme') === 'light';
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
    localStorage.setItem('pomodoro_theme', isLight ? 'dark' : 'light');
  } catch { /* noop */ }
}

/* ── Init ── */

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
themeToggle.addEventListener('click', toggleTheme);
clearHistoryBtn.addEventListener('click', clearHistory);

updateDisplay();
updatePhaseLabel();
updateSessionStats();
updateRunningClass();
updateButtons();
applyTheme(loadTheme());
renderHistory(loadHistory());
