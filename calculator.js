/* ============================================
   Calculator — App Logic
   ============================================ */

const state = {
  current: '0',
  previous: '',
  operation: null,
  overwrite: false,
  justEvaluated: false,
};

const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');

/* ── Display ── */

function updateDisplay() {
  resultEl.textContent = state.current;
  resultEl.classList.toggle('shrink', state.current.length > 10);

  if (state.operation && state.previous) {
    const opSymbol = getOpSymbol(state.operation);
    expressionEl.textContent = `${formatNumber(state.previous)} ${opSymbol}`;
  } else {
    expressionEl.textContent = '';
  }
}

function formatNumber(num) {
  const n = parseFloat(num);
  if (!isFinite(n)) return num;
  return n.toLocaleString(undefined, { maximumFractionDigits: 10 });
}

function getOpSymbol(op) {
  const map = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
  return map[op] || op;
}

/* ── Input ── */

function inputDigit(digit) {
  if (state.justEvaluated && !state.operation) {
    state.current = digit;
    state.justEvaluated = false;
    state.overwrite = false;
    updateDisplay();
    return;
  }

  if (state.overwrite) {
    state.current = digit;
    state.overwrite = false;
  } else {
    state.current = state.current === '0' ? digit : state.current + digit;
  }
  updateDisplay();
}

function inputDecimal() {
  if (state.justEvaluated && !state.operation) {
    state.current = '0.';
    state.justEvaluated = false;
    state.overwrite = false;
    updateDisplay();
    return;
  }

  if (state.overwrite) {
    state.current = '0.';
    state.overwrite = false;
    updateDisplay();
    return;
  }

  if (!state.current.includes('.')) {
    state.current += '.';
  }
  updateDisplay();
}

/* ── Operations ── */

function setOperation(op) {
  if (state.operation && !state.overwrite) {
    calculate();
  }

  state.previous = state.current;
  state.operation = op;
  state.overwrite = true;
  state.justEvaluated = false;

  document.querySelectorAll('.btn-operator').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`[data-action="${op}"]`);
  if (btn) btn.classList.add('active');

  updateDisplay();
}

function calculate() {
  if (!state.operation) return;

  const prev = parseFloat(state.previous);
  const curr = parseFloat(state.current);

  if (isNaN(prev) || isNaN(curr)) return;

  let result;
  switch (state.operation) {
    case 'add':
      result = prev + curr;
      break;
    case 'subtract':
      result = prev - curr;
      break;
    case 'multiply':
      result = prev * curr;
      break;
    case 'divide':
      result = curr === 0 ? 'Error' : prev / curr;
      break;
    default:
      return;
  }

  if (result === 'Error') {
    state.current = 'Error';
  } else {
    state.current = String(parseFloat(result.toFixed(10)));
  }

  state.previous = '';
  state.operation = null;
  state.overwrite = true;
  state.justEvaluated = true;

  document.querySelectorAll('.btn-operator').forEach(b => b.classList.remove('active'));
  updateDisplay();
}

/* ── Functions ── */

function clearAll() {
  state.current = '0';
  state.previous = '';
  state.operation = null;
  state.overwrite = false;
  state.justEvaluated = false;
  document.querySelectorAll('.btn-operator').forEach(b => b.classList.remove('active'));
  updateDisplay();
}

function backspace() {
  if (state.overwrite || state.justEvaluated) {
    clearAll();
    return;
  }

  state.current = state.current.length > 1 ? state.current.slice(0, -1) : '0';
  updateDisplay();
}

function percent() {
  const num = parseFloat(state.current);
  if (!isNaN(num)) {
    state.current = String(num / 100);
    state.overwrite = true;
    updateDisplay();
  }
}

/* ── Event handlers ── */

function handleButtonClick(e) {
  const btn = e.currentTarget;

  if (btn.dataset.value !== undefined) {
    const val = btn.dataset.value;
    if (val === '.') {
      inputDecimal();
    } else {
      inputDigit(val);
    }
    return;
  }

  const action = btn.dataset.action;

  switch (action) {
    case 'clear':
      clearAll();
      break;
    case 'backspace':
      backspace();
      break;
    case 'percent':
      percent();
      break;
    case 'equals':
      calculate();
      break;
    case 'add':
    case 'subtract':
    case 'multiply':
    case 'divide':
      setOperation(action);
      break;
  }
}

function handleKeyboard(e) {
  const key = e.key;

  if (/^[0-9]$/.test(key)) {
    e.preventDefault();
    inputDigit(key);
    return;
  }

  switch (key) {
    case '.':
      e.preventDefault();
      inputDecimal();
      break;
    case 'Enter':
    case '=':
      e.preventDefault();
      calculate();
      break;
    case 'Backspace':
      e.preventDefault();
      backspace();
      break;
    case 'Escape':
      e.preventDefault();
      clearAll();
      break;
    case '%':
      e.preventDefault();
      percent();
      break;
    case '+':
      e.preventDefault();
      setOperation('add');
      break;
    case '-':
      e.preventDefault();
      setOperation('subtract');
      break;
    case '*':
      e.preventDefault();
      setOperation('multiply');
      break;
    case '/':
      e.preventDefault();
      setOperation('divide');
      break;
  }
}

/* ── Theme ── */

function loadTheme() {
  try {
    return localStorage.getItem('calc_theme') === 'light';
  } catch {
    return false;
  }
}

function applyTheme(isLight) {
  document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
  document.getElementById('themeToggle').textContent = isLight ? '☀️' : '🌙';
}

function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  applyTheme(!isLight);
  try {
    localStorage.setItem('calc_theme', isLight ? 'dark' : 'light');
  } catch { /* noop */ }
}

/* ── Init ── */

document.querySelectorAll('.calc-buttons .btn').forEach(btn => {
  btn.addEventListener('click', handleButtonClick);
});

document.getElementById('themeToggle').addEventListener('click', toggleTheme);

document.addEventListener('keydown', handleKeyboard);

applyTheme(loadTheme());
updateDisplay();
