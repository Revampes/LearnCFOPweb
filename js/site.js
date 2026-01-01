(() => {
  const body = document.body;
  const toggle = document.querySelector('[data-theme-toggle]');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const stored = localStorage.getItem('cfop-theme');
  let theme = stored || (prefersDark ? 'dark' : 'light');

  const applyTheme = (next) => {
    body.classList.toggle('theme-dark', next === 'dark');
    toggle?.setAttribute('aria-pressed', next === 'dark');
    const label = toggle?.querySelector('[data-theme-label]');
    if (label) label.textContent = next === 'dark' ? 'Light mode' : 'Dark mode';
    localStorage.setItem('cfop-theme', next);
  };

  applyTheme(theme);

  toggle?.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
  });

  const current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const target = (link.getAttribute('href') || '').toLowerCase();
    if (target === current) link.classList.add('active');
  });
})();
