/* ============================================
   Login Page — Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Password visibility toggle ── */
  const passwordToggle = document.getElementById('passwordToggle');
  const passwordInput = document.getElementById('password');
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      passwordToggle.textContent = isPassword ? '🙈' : '👁';
    });
  }

  /* ── Form submission ── */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const remember = document.querySelector('[name="remember"]').checked;

      // Simple client-side validation
      if (!email || !password) return;

      const submitBtn = loginForm.querySelector('.auth-submit');
      submitBtn.textContent = 'Signing in…';
      submitBtn.disabled = true;

      // Simulate login — in production this would hit an API
      setTimeout(() => {
        submitBtn.textContent = 'Sign In';
        submitBtn.disabled = false;
        alert(`Demo: Logged in as ${email}`);
      }, 1200);
    });
  }

  /* ── Social login buttons ── */
  document.querySelectorAll('.btn-social').forEach((btn) => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.provider;
      btn.textContent = `Connecting…`;
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = btn.innerHTML.replace('Connecting…', provider === 'google' ? 'Google' : 'GitHub');
        btn.disabled = false;
        alert(`Demo: ${provider} login`);
      }, 1000);
    });
  });
});
