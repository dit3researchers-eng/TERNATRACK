/* TERNATRACK - shared UI pieces: icons, toast, modal, page shells */
(function (T) {
  var esc = T.esc;

  var ic = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  T.icons = {
    grid: ic('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    bars: ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    file: ic('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'),
    check: ic('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>'),
    mega: ic('<path d="M3 11v3l12 5V6zM15 8a4 4 0 0 1 0 9M6 14l1 6h3l-1-5"/>'),
    user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    bell: ic('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4"/>'),
    gear: ic('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2L10 21h4l.6-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>'),
    upload: ic('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'),
    chat: ic('<path d="M4 5h16v11H9l-5 4z"/>'),
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>'
  };

  T.toast = function (msg) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  };

  /* modal(html, onMount) -> returns close fn */
  T.modal = function (html, onMount, wide) {
    T.closeModal();
    var bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal-bg';
    bg.innerHTML = '<div class="modal" role="dialog" aria-modal="true"' + (wide ? ' style="width:820px"' : '') + '><button class="x" aria-label="Close">&times;</button>' + html + '</div>';
    document.body.appendChild(bg);
    bg.addEventListener('mousedown', function (e) { if (e.target === bg) T.closeModal(); });
    bg.querySelector('.x').onclick = T.closeModal;
    if (onMount) onMount(bg.querySelector('.modal'));
    return T.closeModal;
  };
  T.closeModal = function () { var m = document.getElementById('modal-bg'); if (m) m.remove(); };
  T.confirm = function (msg, yes) {
    T.modal('<h3>Please confirm</h3><p>' + esc(msg) + '</p><div class="actions"><button class="btn outline" data-no>Cancel</button><button class="btn" data-yes>Yes</button></div>', function (m) {
      m.querySelector('[data-no]').onclick = T.closeModal;
      m.querySelector('[data-yes]').onclick = function () { T.closeModal(); yes(); };
    });
  };

  T.chip = function (c, text) { return '<span class="chip ' + c + '">' + esc(text) + '</span>'; };
  T.colorChip = function (c) { return T.chip(T.COLORS[c].cls, T.COLORS[c].label); };

  T.barangayOptions = function (sel, withPlaceholder) {
    var o = withPlaceholder ? '<option value="">Choose your barangay</option>' : '';
    T.db().brgys.forEach(function (b) { o += '<option value="' + b.id + '"' + (String(sel) === String(b.id) ? ' selected' : '') + '>' + esc(b.name) + '</option>'; });
    return o;
  };

  /* ---------- Public shell ---------- */
  var NAV = [
    ['announcements', 'Announcements', 'r'], ['transparency', 'Transparency Corner', 'y'], ['forms', 'Service Forms', 'r'],
    ['documents', 'Official Documents', 'y'], ['community', 'Community Information', 'r'], ['feedback', 'Feedback', 'y']
  ];
  T.publicShell = function (active, body, hero) {
    var s = T.user();
    var right = s
      ? '<a class="btn" href="#/' + s.role + '/overview">Dashboard</a>'
      : '<a class="btn" href="#/login">Login</a><a class="btn outline" href="#/signup">Sign up</a>';
    var nav = NAV.map(function (n) {
      return '<a class="tab ' + n[2] + (n[0] === active ? ' on' : '') + '" href="#/public/' + n[0] + '">' + n[1] + '</a>';
    }).join('');
    return '<header class="pub-header"><a class="brand" href="#/public/announcements"><b>TERNATRACK</b><small>DILG MUNICIPAL OFFICE - TERNATE, CAVITE</small></a><div class="pub-actions">' + right + '</div></header>' +
      (hero || '') +
      '<div class="' + (hero ? '' : 'pub-nav') + '"><div class="nav-row" style="' + (hero ? '' : '') + '">' + nav +
      '<form class="search-box" id="search-form">' + T.icons.search + '<input id="search-input" type="search" placeholder="Search" value="' + esc(T.searchQ || '') + '" aria-label="Search"></form></div></div>' +
      '<main class="page">' + body + '</main>' +
      '<button class="fab" id="fab-chat">' + T.icons.chat.replace('<svg', '<svg width="20" height="20"') + 'Ask Questions</button>';
  };

  /* ---------- Auth shell ---------- */
  T.authShell = function (headline, sub, card, footHtml, backHref) {
    return '<div class="auth"><section class="auth-left"><a class="brand" href="#/public/announcements"><b>TERNATRACK</b><small>DILG MUNICIPAL OFFICE - TERNATE, CAVITE</small></a>' +
      '<div><h1>' + headline + '</h1><p>' + sub + '</p></div><div class="foot">' + footHtml + '</div></section>' +
      '<section class="auth-right">' + (backHref ? '<button class="back" data-back="' + backHref + '">&larr; Back</button>' : '') + card + '</section></div>';
  };

  /* ---------- Dashboard shell ---------- */
  var ADMIN_NAV = [['overview', 'Overview', 'grid'], ['barangays', 'Barangays', 'bars'], ['reports', 'Reports', 'file'], ['improvement', 'Improvement', 'check'], ['content', 'Public Content', 'mega'], ['accounts', 'Accounts', 'user'], ['activity', 'Activity and Alerts', 'bell'], ['settings', 'Settings', 'gear']];
  var SEC_NAV = [['overview', 'Overview', 'grid'], ['submit', 'Submit Report', 'upload'], ['reports', 'My Reports', 'file'], ['improvement', 'Improvement', 'check'], ['page', 'Public Page', 'mega'], ['feedback', 'Resident Feedback', 'chat'], ['settings', 'Settings', 'gear']];
  T.dashShell = function (role, active, body) {
    var u = T.user();
    var nav = (role === 'admin' ? ADMIN_NAV : SEC_NAV).map(function (n) {
      return '<a class="' + (n[0] === active ? 'on' : '') + '" href="#/' + role + '/' + n[0] + '">' + T.icons[n[2]] + n[1] + '</a>';
    }).join('');
    return '<div class="dash-top"><b>TERNATRACK</b><div class="right"><span class="avatar" title="' + esc(u.name) + '">' + (role === 'admin' ? 'AD' : esc(T.initials(u.name))) + '</span><button class="btn" id="signout">Sign out</button></div></div>' +
      '<div class="dash"><aside class="side">' + nav + '</aside><main class="main">' + body + '</main></div>';
  };

  T.seg = function (items, active, base) {
    return '<div class="seg">' + items.map(function (i) { return '<button data-go="' + base + i[0] + '" class="' + (i[0] === active ? 'on' : '') + '">' + i[1] + '</button>'; }).join('') + '</div>';
  };
})(window.T);
