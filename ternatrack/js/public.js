/* TERNATRACK - Public portal pages */
(function (T) {
  var esc = T.esc;
  T.pages = T.pages || {};
  var P = T.pages.public = {};

  function brgy() { return T.db().ui.barangay || 1; }
  function pill() {
    return '<select class="pill-select" data-brgy-select aria-label="Barangay">' + T.barangayOptions(brgy()) + '</select>';
  }
  function published(list) { return list.filter(function (o) { return o.status === 'Published'; }); }
  function lines(t) { return esc(t).replace(/\n/g, '<br>'); }

  /* ---------- Announcements ---------- */
  P.announcements = function () {
    var b = brgy(), d = T.db();
    var ords = published(d.ordinances).filter(function (o) { return o.barangay === b; }).sort(function (a, c) { return a.date < c.date ? 1 : -1; });
    var acts = d.activities.filter(function (a) { return a.barangay === b; }).sort(function (a, c) { return a.date < c.date ? -1 : 1; });
    var hero = '<section class="hero"><div><div class="eyebrow">BARANGAY PUBLIC INFORMATION PORTAL</div>' +
      '<h1>Information that keeps our <span>community informed.</span></h1>' +
      '<p>Access barangay records, local services, transparency reports, and important community updates.</p></div>' +
      '<div class="hero-card"><label for="hero-brgy">Choose your barangay</label><select class="field-select" id="hero-brgy" data-brgy-select>' + T.barangayOptions(b) + '</select></div></section>';
    var body = '<h2 class="title">Announcements</h2><div class="grid2" style="margin-top:20px">' +
      '<div class="card top-r"><h3>New Ordinances</h3>' +
      (ords.slice(0, 3).map(function (o) { return '<div class="row-item click" data-ord="' + o.id + '"><span>' + esc(o.number + ' – ' + o.title) + '</span><span class="meta">' + T.fmtDate(o.date) + '</span></div>'; }).join('') || '<div class="empty">No ordinances posted yet.</div>') + '</div>' +
      '<div class="card top-y"><h3>Activities</h3>' +
      (acts.slice(0, 3).map(function (a) { return '<div class="row-item"><span>' + esc(a.name) + '</span><span class="meta">' + T.fmtDate(a.date) + ' · ' + esc(a.place) + '</span></div>'; }).join('') || '<div class="empty">No activities posted yet.</div>') + '</div></div>';
    T.after = function () {
      document.querySelectorAll('[data-ord]').forEach(function (el) { el.onclick = function () { showOrdinance(el.getAttribute('data-ord')); }; });
    };
    return T.publicShell('announcements', body, hero);
  };
  function showOrdinance(id) {
    var o = T.db().ordinances.filter(function (x) { return x.id === id; })[0]; if (!o) return;
    T.modal('<h3>' + esc(o.number) + '</h3><div class="kv"><b>Title</b><span>' + esc(o.title) + '</span><b>Barangay</b><span>' + T.brgyName(o.barangay) + '</span><b>Date</b><span>' + T.fmtDate(o.date) + '</span></div><div class="actions"><button class="btn yellow" data-dl>Download</button></div>', function (m) {
      m.querySelector('[data-dl]').onclick = function () { T.download(o.number.replace(/\W+/g, '_') + '.txt', o.number + '\n' + o.title + '\n' + T.brgyName(o.barangay) + '\nDate: ' + o.date); };
    });
  }

  /* ---------- Transparency Corner ---------- */
  P.transparency = function () {
    var b = brgy(), docs = T.db().fdpDocs.filter(function (x) { return x.barangay === b; }).sort(function (a, c) { return a.date < c.date ? 1 : -1; });
    var body = '<div class="page-top"><h2 class="title">Transparency Corner</h2>' + pill() + '</div>' +
      '<div class="card" style="max-width:670px;min-height:480px"><h3>Barangay Full Disclosure Policy Portal</h3>' +
      '<p class="desc">Documents disclosed by ' + T.brgyName(b) + ' under the Full Disclosure Policy.</p>' +
      (docs.map(function (x) { return '<div class="row-item"><span>' + esc(x.title) + '<br><span class="subtle">' + esc(x.file) + ' · ' + T.fmtDate(x.date) + '</span></span><button class="dl" data-fdp="' + x.id + '">Download</button></div>'; }).join('') || '<div class="empty">No disclosure documents yet.</div>') + '</div>';
    T.after = function () {
      document.querySelectorAll('[data-fdp]').forEach(function (el) {
        el.onclick = function () {
          var x = T.db().fdpDocs.filter(function (y) { return y.id === el.getAttribute('data-fdp'); })[0];
          T.download(x.file.replace(/\.pdf$/, '') + '.txt', x.title + '\n' + T.brgyName(x.barangay) + '\nPosted: ' + x.date);
        };
      });
    };
    return T.publicShell('transparency', body);
  };

  /* ---------- Service Forms ---------- */
  P.forms = function () {
    var d = T.db();
    var cards = d.services.map(function (s, i) {
      var c = (i === 0 || i === 3) ? 'top-r' : 'top-y';
      var first = s.forms.slice(0, 2);
      return '<div class="card ' + c + '"><h3>' + (i + 1) + '. ' + esc(s.name) + '</h3><p class="desc">' + esc(s.desc) + '</p>' +
        first.map(function (f) { return '<div class="row-item"><span>' + esc(f) + '</span><button class="dl" data-form="' + s.id + '|' + esc(f) + '">Download</button></div>'; }).join('') +
        '<div style="margin-top:20px"><button class="link" data-open-forms="' + s.id + '">Open all forms →</button></div></div>';
    }).join('');
    var body = '<h2 class="title">Service Forms</h2><p class="sub">Pick a service, then download the forms you need.</p><div class="grid2 tight">' + cards + '</div>';
    T.after = function () {
      document.querySelectorAll('[data-form]').forEach(function (el) {
        el.onclick = function () { var p = el.getAttribute('data-form').split('|'); downloadForm(p[0], p[1]); };
      });
      document.querySelectorAll('[data-open-forms]').forEach(function (el) {
        el.onclick = function () {
          var s = T.db().services.filter(function (x) { return x.id === el.getAttribute('data-open-forms'); })[0];
          T.modal('<h3>' + esc(s.name) + '</h3><p class="desc">' + esc(s.desc) + '</p>' + s.forms.map(function (f) { return '<div class="row-item"><span>' + esc(f) + '</span><button class="dl" data-f="' + esc(f) + '">Download</button></div>'; }).join(''), function (m) {
            m.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { downloadForm(s.id, b.getAttribute('data-f')); }; });
          });
        };
      });
    };
    return T.publicShell('forms', body);
  };
  function downloadForm(sid, name) {
    var s = T.db().services.filter(function (x) { return x.id === sid; })[0];
    T.download(name.replace(/[^\w]+/g, '_') + '.txt', 'TERNATRACK – ' + s.name + '\n' + name + '\n\nName: ____________________\nAddress: __________________\nDate: ____________________\nSignature: ________________\n\n(Blank form template. Replace with the official form file when available.)');
    T.toast('Downloading ' + name);
  }

  /* ---------- Official Documents ---------- */
  P.documents = function () {
    var b = brgy(), d = T.db();
    var ords = published(d.ordinances).filter(function (o) { return o.barangay === b; }).sort(function (a, c) { return a.date < c.date ? 1 : -1; });
    var body = '<div class="page-top"><h2 class="title">Official Documents</h2>' + pill() + '</div><div class="grid2 tight">' +
      '<div class="card top-r" style="min-height:470px;display:flex;flex-direction:column"><h3>1. Ordinances</h3><p class="desc">Official ordinances of your barangay, posted by the barangay secretary.</p>' +
      (ords.slice(0, 4).map(function (o) { return '<div class="row-item click" data-ord="' + o.id + '"><span>' + esc(o.number + ' – ' + o.title) + '</span><span class="meta">' + T.fmtDate(o.date) + '</span></div>'; }).join('') || '<div class="empty">No ordinances posted yet.</div>') +
      '<div style="margin-top:auto;padding-top:20px"><button class="link" id="all-ords">See all ordinances →</button></div></div>' +
      '<div class="card top-y" style="min-height:470px;display:flex;flex-direction:column"><h3>2. Citizen\'s Charter</h3><p class="desc">The services offered, what you need to bring and how long each takes.</p>' +
      d.charter.slice(0, 4).map(function (c) { return '<div class="row-item"><span>' + esc(c.name) + '</span><span class="meta">' + esc(c.time) + '</span></div>'; }).join('') +
      '<div style="margin-top:auto;padding-top:20px"><button class="link" id="full-charter">Open the full charter →</button></div></div></div>';
    T.after = function () {
      document.querySelectorAll('[data-ord]').forEach(function (el) { el.onclick = function () { showOrdinance(el.getAttribute('data-ord')); }; });
      document.getElementById('all-ords').onclick = function () {
        T.modal('<h3>All ordinances – ' + T.brgyName(b) + '</h3>' + (ords.map(function (o) { return '<div class="row-item click" data-o="' + o.id + '"><span>' + esc(o.number + ' – ' + o.title) + '</span><span class="meta">' + T.fmtDate(o.date) + '</span></div>'; }).join('') || '<div class="empty">None yet.</div>'), function (m) {
          m.querySelectorAll('[data-o]').forEach(function (e) { e.onclick = function () { showOrdinance(e.getAttribute('data-o')); }; });
        }, true);
      };
      document.getElementById('full-charter').onclick = function () {
        T.modal('<h3>Citizen\'s Charter</h3>' + T.db().charter.map(function (c) { return '<div class="charter-item"><b>' + esc(c.name) + '</b><span class="subtle">Time needed: ' + esc(c.time) + '</span><br><span class="subtle">What to bring: ' + esc(c.req) + '</span></div>'; }).join(''), null, true);
      };
    };
    return T.publicShell('documents', body);
  };

  /* ---------- Community Information ---------- */
  P.community = function () {
    var b = brgy(), d = T.db();
    var items = [
      ['hazard', '1. Hazard Maps', 'Areas at risk of floods and other hazards.', d.hazard[b], 'left-r'],
      ['evac', '2. Evacuation', 'Evacuation centers and routes.', d.evac[b], 'left-y'],
      ['sb', '3. Sangguniang Barangay', 'Your barangay council members.', d.sb[b], 'left-y'],
      ['sk', '4. Sangguniang Kabataan', 'Your youth council members.', d.sk[b], 'left-r']
    ];
    var body = '<div class="page-top"><h2 class="title">Community Information</h2>' + pill() + '</div><div class="grid2 tight">' +
      items.map(function (i) {
        return '<div class="card ' + i[4] + '"><h3>' + i[1] + '</h3><p class="desc">' + i[2] + '</p><div class="placeholder-box" style="text-align:left;justify-content:flex-start;align-items:flex-start;max-height:150px;font-size:13px">' + (i[3] ? lines(i[3]) : 'Not yet posted.') + '</div><button class="link" data-info="' + i[0] + '">Open →</button></div>';
      }).join('') + '</div>';
    T.after = function () {
      document.querySelectorAll('[data-info]').forEach(function (el) {
        el.onclick = function () {
          var it = items.filter(function (x) { return x[0] === el.getAttribute('data-info'); })[0];
          T.modal('<h3>' + esc(it[1].replace(/^\d\.\s*/, '')) + ' – ' + T.brgyName(b) + '</h3><p>' + (it[3] ? lines(it[3]) : 'Not yet posted.') + '</p>');
        };
      });
    };
    return T.publicShell('community', body);
  };

  /* ---------- Feedback ---------- */
  P.feedback = function () {
    var body = '<h2 class="title">Feedback</h2><div class="form-card" style="margin-top:22px"><h3>Comments and Suggestions</h3><p class="desc">Tell us what is working and what needs attention.</p>' +
      '<form id="fb-form"><div class="row2"><div><label class="lbl" for="fb-name">Your name (optional)</label><input class="input" id="fb-name"></div>' +
      '<div><label class="lbl" for="fb-b">Your barangay</label><select class="input" id="fb-b" style="border-color:var(--ink)">' + T.barangayOptions(brgy()) + '</select></div></div>' +
      '<label class="lbl" for="fb-msg">Your message</label><textarea class="input" id="fb-msg" style="min-height:200px" placeholder="Write your comment or suggestion here" required></textarea>' +
      '<div id="fb-err"></div><button class="btn block" style="margin-top:14px">Send message</button></form></div>';
    T.after = function () {
      document.getElementById('fb-form').onsubmit = function (e) {
        e.preventDefault();
        var msg = document.getElementById('fb-msg').value.trim();
        if (msg.length < 5) { document.getElementById('fb-err').innerHTML = '<div class="err">Please write your message.</div>'; return; }
        var d = T.db();
        d.feedback.unshift({ id: T.uid('fb'), name: document.getElementById('fb-name').value.trim(), barangay: +document.getElementById('fb-b').value, message: msg, type: 'Concern', status: 'New', response: '', date: T.addDays(0) });
        T.save();
        document.getElementById('fb-form').reset();
        document.getElementById('fb-err').innerHTML = '<div class="ok">Thank you! Your message was sent to the DILG Municipal Office.</div>';
      };
    };
    return T.publicShell('feedback', body);
  };

  /* ---------- Search ---------- */
  P.search = function () {
    var q = (T.searchQ || '').toLowerCase().trim(), d = T.db(), res = [];
    function hit(s) { return String(s).toLowerCase().indexOf(q) >= 0; }
    if (q) {
      d.ordinances.forEach(function (o) { if (o.status === 'Published' && hit(o.number + ' ' + o.title)) res.push(['Ordinance', o.number + ' – ' + o.title, T.brgyName(o.barangay), '#/public/documents', o.barangay]); });
      d.activities.forEach(function (a) { if (hit(a.name + ' ' + a.place)) res.push(['Activity', a.name, T.brgyName(a.barangay) + ' · ' + T.fmtDate(a.date), '#/public/announcements', a.barangay]); });
      d.services.forEach(function (s) { s.forms.concat([s.name]).forEach(function (f) { if (hit(f + ' ' + s.name)) res.push(['Service form', f, s.name, '#/public/forms']); }); });
      d.charter.forEach(function (c) { if (hit(c.name + ' ' + c.req)) res.push(['Citizen\'s Charter', c.name, c.time, '#/public/documents']); });
      d.fdpDocs.forEach(function (f) { if (hit(f.title + ' ' + f.file)) res.push(['Disclosure', f.title, T.brgyName(f.barangay), '#/public/transparency', f.barangay]); });
      d.faqs.forEach(function (f) { if (hit(f.q + ' ' + f.a)) res.push(['FAQ', f.q, f.a, '#/public/search']); });
      ['hazard', 'evac', 'sb', 'sk'].forEach(function (k) { d[k] && Object.keys(d[k]).forEach(function (b) { if (hit(d[k][b])) res.push(['Community information', { hazard: 'Hazard maps', evac: 'Evacuation', sb: 'Sangguniang Barangay', sk: 'Sangguniang Kabataan' }[k], T.brgyName(b), '#/public/community', +b]); }); });
    }
    var body = '<h2 class="title">Search results</h2><p class="sub">' + (q ? res.length + ' result(s) for “' + esc(T.searchQ) + '”' : 'Type something in the search box.') + '</p>' +
      (res.slice(0, 60).map(function (r, i) { return '<div class="row-item click" data-r="' + i + '"><span><b>' + esc(r[1]) + '</b><br><span class="subtle">' + esc(r[0]) + ' · ' + esc(r[2]) + '</span></span><span class="link">Open →</span></div>'; }).join('') || (q ? '<div class="empty">No results found. Try another word or use Ask Questions.</div>' : ''));
    T.after = function () {
      document.querySelectorAll('[data-r]').forEach(function (el) {
        el.onclick = function () { var r = res[+el.getAttribute('data-r')]; if (r[4]) T.db().ui.barangay = r[4], T.save(); location.hash = r[3]; if (r[3] === '#/public/search') T.render(); };
      });
    };
    return T.publicShell('', body);
  };

  /* ---------- Chatbot ---------- */
  T.openChat = function () {
    if (document.getElementById('chat')) { document.getElementById('chat').remove(); return; }
    var d = T.db();
    var box = document.createElement('div'); box.className = 'chat'; box.id = 'chat';
    box.innerHTML = '<header><span>Ask Questions</span><button aria-label="Close chat">&times;</button></header><div class="msgs" id="msgs"></div>' +
      '<div class="sugg">' + d.chatbot.slice(0, 4).map(function (c) { return '<button>' + esc(c.q) + '</button>'; }).join('') + '</div>' +
      '<form><input placeholder="Type your question" aria-label="Your question"><button class="btn sm">Send</button></form>';
    document.body.appendChild(box);
    var msgs = box.querySelector('#msgs');
    function add(t, who) { var m = document.createElement('div'); m.className = 'msg ' + who; m.textContent = t; msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight; }
    function answer(q) {
      var words = q.toLowerCase().split(/\W+/).filter(function (w) { return w.length > 2; }), best = null, bs = 0;
      T.db().chatbot.concat(T.db().faqs.map(function (f) { return { q: f.q, kw: '', a: f.a }; })).forEach(function (c) {
        var hay = (c.q + ' ' + c.kw).toLowerCase(), s = 0;
        words.forEach(function (w) { if (hay.indexOf(w) >= 0) s++; });
        if (s > bs) { bs = s; best = c; }
      });
      return best && bs > 0 ? best.a : 'Sorry, I do not have an answer for that yet. Please send it through the Feedback page and the DILG Municipal Office will reply.';
    }
    add('Hello! I can answer common questions about barangay services, forms and records. What would you like to know?', 'bot');
    function ask(q) { add(q, 'me'); setTimeout(function () { add(answer(q), 'bot'); }, 250); }
    box.querySelector('header button').onclick = function () { box.remove(); };
    box.querySelectorAll('.sugg button').forEach(function (b) { b.onclick = function () { ask(b.textContent); }; });
    box.querySelector('form').onsubmit = function (e) { e.preventDefault(); var i = box.querySelector('input'); if (i.value.trim()) { ask(i.value.trim()); i.value = ''; } };
    box.querySelector('input').focus();
  };
})(window.T);
