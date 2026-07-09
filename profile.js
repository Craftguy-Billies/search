/* ============================================
   Profile Page — Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Tab switching ── */
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach((tc) => {
        tc.classList.remove('active');
      });

      const target = document.getElementById(`tab-${tab}`);
      if (target) target.classList.add('active');
    });
  });

  /* ── Load profile from localStorage (set by settings page) ── */
  function loadProfile() {
    try {
      const raw = localStorage.getItem('search_settings');
      if (!raw) return;
      const settings = JSON.parse(raw);

      const nameEl = document.getElementById('profileName');
      const bioEl = document.getElementById('profileBio');
      const avatarEl = document.getElementById('profileAvatar');

      if (settings.displayName && nameEl) {
        nameEl.textContent = settings.displayName;
      }
      if (settings.userBio && bioEl) {
        bioEl.textContent = settings.userBio;
      }
      if (settings.avatar && avatarEl) {
        avatarEl.textContent = '';
        avatarEl.style.backgroundImage = `url(${settings.avatar})`;
        avatarEl.style.backgroundSize = 'cover';
      }

      // Derive handle from display name
      const handle = document.getElementById('profileHandle');
      if (handle) {
        const name = settings.displayName || 'Guest User';
        handle.textContent = `@${name.toLowerCase().replace(/\s+/g, '')}`;
      }
    } catch {
      // Use defaults
    }
  }

  loadProfile();
});
