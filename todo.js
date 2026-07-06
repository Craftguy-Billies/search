/* ── State ─────────────────────────────────────────── */
let todos = [];
const STORAGE_KEY = 'taskflow_todos';
const THEME_KEY = 'taskflow_theme';

/* ── DOM refs ──────────────────────────────────────── */
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const countEl = document.getElementById('task-count');
const clearBtn = document.getElementById('clear-btn');
const emptyState = document.getElementById('empty-state');
const themeBtn = document.getElementById('theme-toggle');

/* ── Storage ───────────────────────────────────────── */
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    todos = raw ? JSON.parse(raw) : [];
  } catch {
    todos = [];
  }
}

/* ── Render ────────────────────────────────────────── */
function render() {
  list.innerHTML = '';

  if (todos.length === 0) {
    emptyState.classList.add('visible');
    countEl.textContent = '0 tasks';
    return;
  }

  emptyState.classList.remove('visible');

  const active = todos.filter(t => !t.done).length;
  countEl.textContent = `${active} task${active !== 1 ? 's' : ''}`;

  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' completed' : '');
    li.dataset.index = index;

    /* checkbox */
    const cb = document.createElement('span');
    cb.className = 'checkbox' + (todo.done ? ' checked' : '');
    cb.setAttribute('role', 'checkbox');
    cb.setAttribute('aria-checked', todo.done);
    cb.tabIndex = 0;

    /* text */
    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    /* delete */
    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.innerHTML = '&times;';
    del.setAttribute('aria-label', 'Delete task');

    /* events */
    const toggle = () => toggleTodo(index);
    cb.addEventListener('click', toggle);
    text.addEventListener('click', toggle);
    cb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    del.addEventListener('click', e => { e.stopPropagation(); deleteTodo(index); });

    li.append(cb, text, del);
    list.appendChild(li);
  });
}

/* ── Actions ───────────────────────────────────────── */
function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.unshift({ text: trimmed, done: false });
  save();
  render();
}

function toggleTodo(index) {
  todos[index].done = !todos[index].done;
  save();
  render();
}

function deleteTodo(index) {
  const items = list.children;
  if (items[index]) {
    items[index].classList.add('removing');
    setTimeout(() => {
      todos.splice(index, 1);
      save();
      render();
    }, 250);
  } else {
    todos.splice(index, 1);
    save();
    render();
  }
}

function clearCompleted() {
  const hadCompleted = todos.some(t => t.done);
  if (!hadCompleted) return;
  todos = todos.filter(t => !t.done);
  save();
  render();
}

/* ── Theme ─────────────────────────────────────────── */
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const isLight = saved === 'light';
  document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
  themeBtn.textContent = isLight ? '☀️' : '🌙';
}

function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  html.setAttribute('data-theme', isLight ? 'dark' : 'light');
  themeBtn.textContent = isLight ? '🌙' : '☀️';
  localStorage.setItem(THEME_KEY, isLight ? 'dark' : 'light');
}

/* ── Init ──────────────────────────────────────────── */
loadTheme();
load();
render();

/* ── Event listeners ───────────────────────────────── */
form.addEventListener('submit', e => {
  e.preventDefault();
  addTodo(input.value);
  input.value = '';
  input.focus();
});

clearBtn.addEventListener('click', clearCompleted);
themeBtn.addEventListener('click', toggleTheme);
