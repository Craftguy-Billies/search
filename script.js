/* ============================================
   Search Landing Page — Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ════════════════════════════════════════════
     Typing Animation — Hero Section
     ════════════════════════════════════════════ */

  (function initTyping() {
    const el = document.getElementById('typed-text');
    if (!el) return;

    const phrases = el.getAttribute('data-words')
      ? JSON.parse(el.getAttribute('data-words'))
      : ['matters most'];

    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let isPaused = false;

    function type() {
      const current = phrases[phraseIdx];

      if (isPaused) {
        isPaused = false;
        isDeleting = true;
        setTimeout(type, 800);
        return;
      }

      if (isDeleting) {
        charIdx--;
        el.textContent = current.substring(0, charIdx);

        if (charIdx === 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          setTimeout(type, 300);
          return;
        }

        setTimeout(type, 30 + Math.random() * 40);
      } else {
        charIdx++;
        el.textContent = current.substring(0, charIdx);

        if (charIdx === current.length) {
          if (phrases.length > 1) {
            isPaused = true;
            setTimeout(type, 2000);
          }
          return;
        }

        setTimeout(type, 50 + Math.random() * 80);
      }
    }

    setTimeout(type, 600);

    // Inject cursor styles
    const style = document.createElement('style');
    style.textContent = `
      #cursor {
        display: inline-block;
        width: 3px;
        height: 1em;
        background: currentColor;
        margin-left: 4px;
        vertical-align: text-bottom;
        animation: blink 0.7s step-end infinite;
        border-radius: 2px;
      }

      @keyframes blink {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  })();

  /* ════════════════════════════════════════════
     Theme Toggle
     ════════════════════════════════════════════ */

  (function initTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    function setTheme(isLight) {
      document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
      toggle.textContent = isLight ? '☀️' : '🌙';
    }

    function toggleTheme() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      setTheme(!isLight);
      localStorage.setItem('landing_theme', isLight ? 'dark' : 'light');
    }

    const saved = localStorage.getItem('landing_theme');
    if (saved === 'light') setTheme(true);

    toggle.addEventListener('click', toggleTheme);
  })();

});
