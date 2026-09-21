(function () {
  function preferred() {
    try {
      var s = localStorage.getItem('jewel-theme');
      if (s === 'light' || s === 'dark') return s;
    } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light' : 'dark';
  }
  function apply(theme) {
    var dark = theme === 'dark';
    document.documentElement.classList.toggle('theme-dark', dark);
    try { localStorage.setItem('jewel-theme', theme); } catch (e) {}
    try { localStorage.setItem('dokka-dark-mode', JSON.stringify(dark)); } catch (e) {}
    var btn = document.getElementById('jewel-theme-btn');
    if (btn) btn.textContent = dark ? 'Light' : 'Dark';
  }
  apply(preferred());
  var btn = document.getElementById('jewel-theme-btn');
  if (btn) btn.addEventListener('click', function () {
    apply(document.documentElement.classList.contains('theme-dark') ? 'light' : 'dark');
  });
  var dokkaBtn = document.getElementById('theme-toggle-button');
  if (dokkaBtn) dokkaBtn.addEventListener('click', function () {
    setTimeout(function () {
      var dark = document.documentElement.classList.contains('theme-dark');
      try { localStorage.setItem('jewel-theme', dark ? 'dark' : 'light'); } catch (e) {}
      var b = document.getElementById('jewel-theme-btn');
      if (b) b.textContent = dark ? 'Light' : 'Dark';
    }, 0);
  });
  window.addEventListener('storage', function (e) {
    if (e.key === 'jewel-theme' && (e.newValue === 'light' || e.newValue === 'dark')) apply(e.newValue);
  });
})();
