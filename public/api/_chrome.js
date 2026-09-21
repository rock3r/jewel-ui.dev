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
  window.addEventListener('storage', function (e) {
    if (e.key === 'jewel-theme' && (e.newValue === 'light' || e.newValue === 'dark')) apply(e.newValue);
  });

  function rehome() {
    var top = document.getElementById('jewel-top');
    var toc = document.getElementById('toc-toggle');
    if (top && toc && toc.parentElement !== top) {
      top.insertBefore(toc, top.firstChild.nextSibling);
    }
    var filters = document.getElementById('filter-section');
    var main = document.getElementById('main');
    if (filters && main && !document.getElementById('jewel-filters')) {
      var wrap = document.createElement('div');
      wrap.id = 'jewel-filters';
      wrap.appendChild(filters);
      main.insertBefore(wrap, main.firstChild);
    }
    // Dokka mounts its Ring search into #searchBar. Keep that same node, but pull it
    // out of the hidden #navigation-wrapper so the popup can open.
    var searchBtn = document.getElementById('jewel-search-btn');
    var searchBar = document.getElementById('searchBar');
    if (top && searchBar) {
      searchBar.classList.add('jewel-search-host');
      if (searchBtn) {
        top.insertBefore(searchBar, searchBtn);
        searchBtn.remove();
      } else if (searchBar.parentElement !== top) {
        top.appendChild(searchBar);
      }
    } else if (searchBtn) {
      searchBtn.hidden = true;
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rehome);
  } else {
    rehome();
  }
})();
