/* TERNATRACK - hash router + global event wiring */
(function (T) {
  var app;

  function parse() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    return h ? h.split('/').map(decodeURIComponent) : [];
  }

  T.render = function () {
    app = app || document.getElementById('app');
    var p = parse(), html = '', top = p[0] || 'public';
    T.after = null;
    var pages = T.pages;

    if (top === 'public') {
      var pg = pages.public[p[1]] ? p[1] : 'announcements';
      html = pages.public[pg]();
    } else if (top === 'login') {
      html = pages.auth.login(p[1] === 'admin' || p[1] === 'secretary' ? p[1] : null);
    } else if (top === 'signup') {
      html = pages.auth.signup(p[1] === 'admin' || p[1] === 'secretary' ? p[1] : null, p[2]);
    } else if (top === 'pending') {
      html = pages.auth.pending();
    } else if (top === 'admin' || top === 'secretary') {
      var u = T.user();
      if (!u || u.role !== top) { location.hash = '#/login/' + top; return; }
      var mod = pages[top], page = mod[p[1]] ? p[1] : 'overview';
      html = mod[page](p[2], p[3]);
    } else {
      location.hash = '#/public/announcements'; return;
    }
    app.innerHTML = html;
    wire();
    if (T.after) T.after();
  };

  function wire() {
    document.querySelectorAll('#app [data-go]').forEach(function (el) {
      if (el._go) return; el._go = 1;
      el.addEventListener('click', function () { location.hash = el.getAttribute('data-go'); });
    });
    document.querySelectorAll('#app [data-back]').forEach(function (el) {
      el.addEventListener('click', function () { location.hash = el.getAttribute('data-back'); });
    });
    document.querySelectorAll('#app [data-brgy-select]').forEach(function (el) {
      el.addEventListener('change', function () { T.db().ui.barangay = +el.value; T.save(); T.render(); });
    });
    var sf = document.getElementById('search-form');
    if (sf) sf.addEventListener('submit', function (e) {
      e.preventDefault();
      T.searchQ = document.getElementById('search-input').value.trim();
      if (parse()[1] === 'search') T.render(); else location.hash = '#/public/search';
    });
    var fab = document.getElementById('fab-chat');
    if (fab) fab.addEventListener('click', T.openChat);
    var so = document.getElementById('signout');
    if (so) so.addEventListener('click', function () {
      var u = T.user();
      T.confirm('Sign out of TERNATRACK?', function () {
        T.setSession(null); location.hash = '#/login';
      });
    });
  }

  window.addEventListener('hashchange', function () {
    T.closeModal();
    var c = document.getElementById('chat'); if (c) c.remove();
    window.scrollTo(0, 0);
    T.render();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') T.closeModal(); });

  document.addEventListener('DOMContentLoaded', function () {
    T.load();
    app = document.getElementById('app');
    if (!location.hash) location.hash = '#/public/announcements'; else T.render();
  });
})(window.T);
