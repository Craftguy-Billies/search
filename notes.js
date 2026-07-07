/* ============================================
   Notebook — App Logic
   ============================================ */

const STORAGE_KEY = 'notebook_notes';
let notes = [];
let activeId = null;
let searchQuery = '';
let saveTimeout = null;

const noteList = document.getElementById('note-list');
const searchInput = document.getElementById('search-input');
const addBtn = document.getElementById('add-btn');
const editorEmpty = document.getElementById('editor-empty');
const editorActive = document.getElementById('editor-active');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const editorMeta = document.getElementById('editor-meta');
const deleteBtn = document.getElementById('delete-btn');
const themeToggle = document.getElementById('theme-toggle');

/* ── Storage ── */

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function loadNotes() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    notes = data ? JSON.parse(data) : [];
  } catch {
    notes = [];
  }
}

/* ── IDs ── */

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ── Time ── */

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function nowISO() {
  return new Date().toISOString();
}

/* ── Filtering ── */

function getFilteredNotes() {
  if (!searchQuery.trim()) return notes;
  const q = searchQuery.toLowerCase();
  return notes.filter(n =>
    n.title.toLowerCase().includes(q) ||
    n.content.toLowerCase().includes(q)
  );
}

/* ── Render ── */

function renderList() {
  const filtered = getFilteredNotes();

  if (filtered.length === 0) {
    noteList.innerHTML = '<div class="note-list-empty">' +
      (searchQuery ? 'No notes match your search' : 'No notes yet') +
      '</div>';
    return;
  }

  noteList.innerHTML = filtered.map(n => {
    const isActive = n.id === activeId;
    const preview = n.content.replace(/\n/g, ' ').slice(0, 60) || 'No content';
    return `
      <div class="note-item ${isActive ? 'active' : ''}" data-id="${n.id}">
        <div class="note-item-title">${escapeHtml(n.title || 'Untitled')}</div>
        <div class="note-item-preview">${escapeHtml(preview)}</div>
        <div class="note-item-date">${formatDate(n.updated)}</div>
      </div>
    `;
  }).join('');

  // Attach click listeners
  noteList.querySelectorAll('.note-item').forEach(el => {
    el.addEventListener('click', () => selectNote(el.dataset.id));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ── Select / Deselect ── */

function selectNote(id) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
    saveCurrentNote();
  }

  activeId = id;
  const note = notes.find(n => n.id === id);
  if (!note) return;

  noteTitle.value = note.title;
  noteContent.value = note.content;
  editorMeta.textContent = formatDate(note.updated);
  editorEmpty.style.display = 'none';
  editorActive.style.display = 'flex';
  renderList();
}

function deselectNote() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
    saveCurrentNote();
  }

  activeId = null;
  noteTitle.value = '';
  noteContent.value = '';
  editorMeta.textContent = '';
  editorEmpty.style.display = 'flex';
  editorActive.style.display = 'none';
  renderList();
}

/* ── CRUD ── */

function createNote() {
  const note = {
    id: generateId(),
    title: '',
    content: '',
    created: nowISO(),
    updated: nowISO(),
  };
  notes.unshift(note);
  saveNotes();
  selectNote(note.id);
  noteTitle.focus();
}

function saveCurrentNote() {
  if (!activeId) return;
  const note = notes.find(n => n.id === activeId);
  if (!note) return;

  const title = noteTitle.value.trim();
  const content = noteContent.value;

  // Remove empty notes
  if (!title && !content.trim()) {
    deleteNote(activeId, true);
    return;
  }

  note.title = title || 'Untitled';
  note.content = content;
  note.updated = nowISO();

  // Auto-save to localStorage
  saveNotes();
  editorMeta.textContent = formatDate(note.updated);
  renderList();
}

function deleteNote(id, skipConfirm) {
  if (!skipConfirm && !confirm('Delete this note?')) return;

  notes = notes.filter(n => n.id !== id);
  saveNotes();

  if (activeId === id) {
    deselectNote();
  } else {
    renderList();
  }
}

/* ── Event handlers ── */

// Auto-save on input with debounce
function handleEditorInput() {
  if (!activeId) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveCurrentNote, 400);
}

noteTitle.addEventListener('input', handleEditorInput);
noteContent.addEventListener('input', handleEditorInput);

// Keyboard shortcuts
noteContent.addEventListener('keydown', (e) => {
  // Escape to go back to list
  if (e.key === 'Escape') {
    e.preventDefault();
    deselectNote();
    searchInput.focus();
  }
});

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  renderList();
});

addBtn.addEventListener('click', createNote);

deleteBtn.addEventListener('click', () => {
  if (activeId) deleteNote(activeId);
});

// Keyboard global shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    createNote();
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

loadNotes();
renderList();
applyTheme(loadTheme());

themeToggle.addEventListener('click', toggleTheme);
