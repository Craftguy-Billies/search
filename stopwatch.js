/* ============================================
   Stopwatch — Timer Logic
   ============================================ */

const state = {
  elapsed: 0,       // milliseconds
  isRunning: false,
  intervalId: null,
  laps: [],
  startedAt: 0,
};

const displayEl = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const lapBtn = document.getElementById('lap-btn');
const resetBtn = document.getElementById('reset-btn');
const lapsList = document.getElementById('laps-list');
const lapCountEl = document.getElementById('lap-count');
const themeToggle = document.getElementById('theme-toggle');

/* ── Display ── */

function formatTime(ms) {
  const totalCs = Math.floor(ms / 10);
  const centiseconds = totalCs % 100;
  const totalSeconds = Math.floor(totalCs / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function updateDisplay() {
  displayEl.textContent = formatTime(state.elapsed);
}

/* ── Laps ── */

function findBestLap() {
  if (state.laps.length === 0) return -1;
  let bestIdx = 0;
  let bestTime = state.laps[0];
  for (let i = 1; i < state.laps.length; i++) {
    if (state.laps[i] < bestTime) {
      bestTime = state.laps[i];
      bestIdx = i;
    }
  }
  return bestIdx;
}

function renderLaps() {
  if (state.laps.length === 0) {
    lapsList.innerHTML = '<div class="laps-empty">No laps recorded yet</div>';
    lapCountEl.textContent = '0 laps';
    return;
  }

  const bestIdx = findBestLap();

  lapsList.innerHTML = state.laps.map((lapTime, i) => {
    const isBest = i === bestIdx && state.laps.length > 1;
    return `
      <div class="lap-entry ${isBest ? 'lap-entry-best' : ''}">
        <span class="lap-entry-num">Lap ${i + 1}${isBest ? ' ★' : ''}</span>
        <span class="lap-entry-time">${formatTime(lapTime)}</span>
      </div>
    `;
  }).join('');

  lapCountEl.textContent = `${state.laps.length} lap${state.laps.length !== 1 ? 's' : ''}`;
}

/* ── Controls ── */

function updateButtons() {
  startBtn.textContent = state.isRunning ? '⏸ Stop' : '▶ Start';
  lapBtn.disabled = !state.isRunning;
  resetBtn.disabled = state.isRunning || state.elapsed === 0;
}

function startTimer() {
  if (state.isRunning) return;

  state.isRunning = true;
  state.startedAt = Date.now() - state.elapsed;
  updateButtons();

  state.intervalId = setInterval(() => {
    state.elapsed = Date.now() - state.startedAt;
    updateDisplay();
  }, 10);
}

function stopTimer() {
  if (!state.isRunning) return;

  clearInterval(state.intervalId);
  state.intervalId = null;
  state.isRunning = false;
  state.elapsed = Date.now() - state.startedAt;
  updateButtons();
}

function resetTimer() {
  if (state.isRunning) return;

  state.elapsed = 0;
  state.laps = [];
  updateDisplay();
  renderLaps();
  updateButtons();
}

function recordLap() {
  if (!state.isRunning) return;

  state.laps.push(state.elapsed);
  renderLaps();
}

/* ── Keyboard ── */

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.key === ' ' || e.key === 'Space') {
    e.preventDefault();
    if (state.isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  } else if (e.key === 'l' || e.key === 'L') {
    if (state.isRunning) {
      e.preventDefault();
      recordLap();
    }
  }
});

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

/* ── Init ── */

startBtn.addEventListener('click', () => {
  if (state.isRunning) {
    stopTimer();
  } else {
    startTimer();
  }
});

lapBtn.addEventListener('click', recordLap);

resetBtn.addEventListener('click', resetTimer);

themeToggle.addEventListener('click', toggleTheme);

updateDisplay();
renderLaps();
updateButtons();
applyTheme(loadTheme());
