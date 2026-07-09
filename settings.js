/* ============================================
   Settings Page — Scripts
   ============================================ */

const SETTINGS_KEY = 'search_settings';

/* ── Defaults ── */
const DEFAULTS = {
  displayName: 'Guest User',
  userEmail: 'guest@search.app',
  userBio: '',
  avatar: '',
  theme: 'dark',
  fontSize: 'medium',
  reducedMotion: false,
  emailNotifications: true,
  pushNotifications: true,
  soundEffects: false,
  publicProfile: true,
  analytics: true,
};

/* ── Storage helpers ── */
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/* ── Apply settings to UI ── */
function applySettingsToUI(settings) {
  // Profile
  const displayName = document.getElementById('displayName');
  const userEmail = document.getElementById('userEmail');
  const userBio = document.getElementById('userBio');
  const avatarPreview = document.getElementById('avatarPreview');
  if (displayName) displayName.value = settings.displayName;
  if (userEmail) userEmail.value = settings.userEmail;
  if (userBio) userBio.value = settings.userBio;
  if (avatarPreview && settings.avatar) {
    avatarPreview.textContent = '';
    avatarPreview.style.backgroundImage = `url(${settings.avatar})`;
    avatarPreview.style.backgroundSize = 'cover';
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
}

function applyFontSize(size) {
  const sizes = { small: '14px', medium: '16px', large: '18px' };
  document.documentElement.style.fontSize = sizes[size] || '16px';
}

function applyReducedMotion(reduced) {
  document.documentElement.style.setProperty(
    '--transition-speed',
    reduced ? '0s' : '0.3s'
  );
}

function syncToggleGroup(container, activeValue) {
  if (!container) return;
  container.querySelectorAll('.toggle-btn').forEach((btn) => {
    const matches = btn.dataset.theme === activeValue
      || btn.dataset.size === activeValue;
    btn.classList.toggle('active', matches);
  });
}

function syncSwitch(id, checked) {
  const el = document.getElementById(id);
  if (el) el.checked = checked;
}

/* ── Toast notification ── */
function showToast(message) {
  const existing = document.querySelector('.settings-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'settings-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/* ── Load all settings ── */
function loadAllSettings() {
  const settings = loadSettings();

  applySettingsToUI(settings);
  applyTheme(settings.theme);
  applyFontSize(settings.fontSize);
  applyReducedMotion(settings.reducedMotion);

  syncToggleGroup(document.getElementById('themeSelect'), settings.theme);
  syncToggleGroup(document.getElementById('fontSizeSelect'), settings.fontSize);
  syncSwitch('reducedMotion', settings.reducedMotion);
  syncSwitch('emailNotifications', settings.emailNotifications);
  syncSwitch('pushNotifications', settings.pushNotifications);
  syncSwitch('soundEffects', settings.soundEffects);
  syncSwitch('publicProfile', settings.publicProfile);
  syncSwitch('analytics', settings.analytics);

  // Update landing page theme toggle icon too
  const landingToggle = document.getElementById('themeToggle');
  if (landingToggle) {
    landingToggle.textContent = settings.theme === 'light' ? '☀️' : '🌙';
  }
}

/* ── Initialise ── */
document.addEventListener('DOMContentLoaded', () => {
  loadAllSettings();

  // ── Theme toggle buttons ──
  document.querySelectorAll('#themeSelect .toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      const settings = loadSettings();
      settings.theme = theme;
      saveSettings(settings);
      applyTheme(theme);
      syncToggleGroup(document.getElementById('themeSelect'), theme);

      // Keep landing page button in sync
      const landingToggle = document.getElementById('themeToggle');
      if (landingToggle) landingToggle.textContent = theme === 'light' ? '☀️' : '🌙';
      localStorage.setItem('landing_theme', theme);

      showToast(`Theme changed to ${theme === 'light' ? 'Light' : 'Dark'}`);
    });
  });

  // ── Font size ──
  document.querySelectorAll('#fontSizeSelect .toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      const settings = loadSettings();
      settings.fontSize = size;
      saveSettings(settings);
      applyFontSize(size);
      syncToggleGroup(document.getElementById('fontSizeSelect'), size);
      showToast(`Font size: ${size}`);
    });
  });

  // ── Toggle switches ──
  document.querySelectorAll('.switch input[type="checkbox"]').forEach((input) => {
    input.addEventListener('change', () => {
      const settings = loadSettings();
      const key = input.id;
      if (key in settings) {
        settings[key] = input.checked;
        saveSettings(settings);

        if (key === 'reducedMotion') {
          applyReducedMotion(input.checked);
        }
      }
    });
  });

  // ── Profile save ──
  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const settings = loadSettings();
      settings.displayName = document.getElementById('displayName').value;
      settings.userEmail = document.getElementById('userEmail').value;
      settings.userBio = document.getElementById('userBio').value;
      saveSettings(settings);
      showToast('Profile saved');
    });
  }

  // ── Avatar upload ──
  const avatarBtn = document.getElementById('avatarUploadBtn');
  if (avatarBtn) {
    avatarBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg';
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
          showToast('File too large. Max 2MB.');
          return;
        }
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          const dataUrl = reader.result;
          const settings = loadSettings();
          settings.avatar = dataUrl;
          saveSettings(settings);
          const preview = document.getElementById('avatarPreview');
          if (preview) {
            preview.textContent = '';
            preview.style.backgroundImage = `url(${dataUrl})`;
            preview.style.backgroundSize = 'cover';
          }
          showToast('Photo updated');
        });
        reader.readAsDataURL(file);
      });
      input.click();
    });
  }

  // ── Export data ──
  const exportBtn = document.getElementById('exportDataBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = JSON.stringify(loadSettings(), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'search-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported');
    });
  }

  // ── Reset settings ──
  const resetBtn = document.getElementById('resetSettingsBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all settings to defaults?')) {
        localStorage.removeItem(SETTINGS_KEY);
        loadAllSettings();
        showToast('Settings reset to defaults');
      }
    });
  }

  // ── Delete account ──
  const deleteBtn = document.getElementById('deleteAccountBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('Are you sure? This cannot be undone.')) {
        if (confirm('Really delete your account? All data will be lost.')) {
          localStorage.clear();
          loadAllSettings();
          showToast('Account deleted (demo)');
        }
      }
    });
  }
});
