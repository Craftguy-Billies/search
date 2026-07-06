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

const displayEl = document.getElementById('timer-display');
const phaseLabel = document.getElementById('phase-label');
const progressFill = document.getElementById('progress-fill');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const sessionCountEl = document.getElementById('session-count');
const themeToggle = document.getElementById('theme-toggle');
const appEl = document.querySelector('.app');

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

  if (state.isFinished) {
    startBtn.textContent = '▶ Start';
  } else if (state.isRunning) {
    startBtn.textContent = '▶ Start';
  } else {
    startBtn.textContent = '▶ Start';
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

  if (state.phase === 'focus') {
    state.sessionCount += 1;
    updateSessionStats();
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

updateDisplay();
updatePhaseLabel();
updateSessionStats();
updateRunningClass();
updateButtons();
applyTheme(loadTheme());
