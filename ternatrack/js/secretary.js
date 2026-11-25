/* TERNATRACK - Barangay Secretary dashboard */
(function (T) {
  var esc = T.esc;
  var B = T.pages.secretary = {};
  var S = { rtab: 'all', ptab: 'ordinances' };

  function on(sel, fn, root) { (root || document).querySelectorAll(sel).forEach(function (el) { el.addEventListener('click', function (e) { fn(el, e); }); }); }
  function shell(active, body) { return T.dashShell('secretary', active, body); }
  function head(title, sub, right) { return '<div class="head-row"><div><h1>' + title + '</h1><p class="sub">' + sub + '</p></div>' + (right || '') + '</div>'; }
  function me() { return T.user(); }
  function bid() { return me().barangay; }
  function who() { return T.brgyName(bid()); }
  function period() { return new Date().toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }); }
  function status(typeId) { return T.db().compliance[bid()][typeId] || 'n'; }
  function typeOf(id) { return T.db().types.filter(function (t) { return t.id === id; })[0]; }
  function mine() { return T.db().reports.filter(function (r) { return r.barangay === bid(); }); }
  function latest(typeId, st) { return mine().filter(function (r) { return r.typeId === typeId && (!st || r.status === st); }).sort(function (a, b) { return a.sentOn < b.sentOn ? 1 : -1; })[0]; }
  var LABEL = { g: 'On time', y: 'Incomplete', b: 'Late', r: 'No submission', n: 'Not due yet' };
  var ACTION = { g: 'View', y: 'Complete It', b: 'Submit now', r: 'Submit now', n: 'Open' };

  /* ---------- Overview ---------- */
  B.overview = function () {
    var d = T.db(), m = mine(), b = bid();
    var due = d.types.filter(function (t) { return ['y', 'b', 'r'].indexOf(status(t.id)) >= 0; }).length;
    var waiting = m.filter(function (r) { return r.status === 'waiting'; }).length, back = m.filter(function (r) { return r.status === 'sent back'; }), appr = m.filter(function (r) { return r.status === 'verified'; }).length;
    var msgs = back.map(function (r) { return r.name + ' was returned: ' + r.notes; }).concat((d.notes[b] || []).slice(0, 4).map(function (n) { return n.text; })).slice(0, 5);
    var coming = d.types.map(function (t) { return { t: t, n: T.daysUntil(t.due) }; }).filter(function (x) { return x.n >= 0; }).sort(function (a, c) { return a.n - c.n; }).slice(0, 4);
    var body = head(who(), 'Your reports, when they are due, and what to do next.') +
      '<div class="stats">' + [['Due soon', due], ['Waiting for review', waiting], ['Returned to fix', back.length], ['Approved', appr]].map(function (x) { return '<div class="stat"><div class="k">' + x[0] + '</div><div class="v">' + x[1] + '</div></div>'; }).join('') + '</div>' +
      '<div class="two-col" style="grid-template-columns:1.9fr 1fr"><div class="panel"><h3>My periodic reports</h3><div class="tbl-wrap" style="border:0"><table class="tbl"><thead><tr><th>Report</th><th class="c">How often</th><th class="c">Due</th><th class="c">Status</th><th class="c">Action</th></tr></thead><tbody>' +
      d.types.map(function (t) { var s = status(t.id); return '<tr><td>' + esc(t.name) + '</td><td class="c"><span class="chip" style="background:#fff0cf">' + t.freq + '</span></td><td class="c subtle">' + T.fmtDate(t.due) + '</td><td class="c">' + T.chip(s === 'n' ? 'n' : s, LABEL[s]) + '</td><td class="c"><button class="btn ' + (['y', 'b', 'r'].indexOf(s) >= 0 ? '' : 'outline') + ' sm" data-act="' + t.id + '">' + ACTION[s] + '</button></td></tr>'; }).join('') + '</tbody></table></div></div>' +
      '<div class="stack"><div class="panel t-y"><h3 style="margin-top:6px">Message from DILG</h3>' + (msgs.map(function (x) { return '<div class="item" style="font-weight:600">' + esc(x) + '</div>'; }).join('') || '<p class="subtle">Notes on returned reports appear here, with what to fix.</p>') + '</div>' +
      '<div class="panel t-r"><h3 style="margin-top:6px">Coming up</h3>' + (coming.map(function (x) { return '<div class="item">' + esc(x.t.name) + ' due ' + (x.n <= 7 ? 'in ' + x.n + ' day' + (x.n === 1 ? '' : 's') : T.fmtDate(x.t.due)) + '</div>'; }).join('') || '<div class="empty">Nothing coming up.</div>') + '</div></div></div>';
    T.after = function () {
      on('[data-act]', function (el) {
        var id = el.getAttribute('data-act'), s = status(id);
        if (s === 'g') { var r = latest(id); if (r) return viewReport(r); }
        if (s === 'y') { var r2 = latest(id, 'sent back'); if (r2) return (location.hash = '#/secretary/submit/' + r2.id); }
        location.hash = '#/secretary/submit/' + id;
      });
    };
    return shell('overview', body);
  };
  function viewReport(r) {
    T.modal('<h3>' + esc(r.name) + '</h3><div class="kv"><b>Status</b><span>' + T.chip({ verified: 'g', waiting: 'y', 'sent back': 'r' }[r.status], T.statusLabel(r.status)) + '</span><b>Sent</b><span>' + T.fmtDate(r.sentOn) + '</span><b>Date done</b><span>' + (r.details.dateDone ? T.fmtDate(r.details.dateDone) : '—') + '</span><b>Participants</b><span>' + esc(r.details.participants || '—') + '</span><b>What was done</b><span>' + esc(r.details.what) + '</span>' + (r.details.amounts ? '<b>Amounts</b><span>' + esc(r.details.amounts) + '</span>' : '') + '<b>Files</b><span>' + (esc(r.files.join(', ')) || 'none') + '</span>' + (r.notes ? '<b>Notes from DILG</b><span>' + esc(r.notes) + '</span>' : '') + '</div><div class="actions"><button class="btn outline" data-dl>Download</button>' + (r.status === 'sent back' ? '<button class="btn" data-ed>Fix and resubmit</button>' : '') + '</div>', function (m) {
      m.querySelector('[data-dl]').onclick = function () { T.download(r.name.replace(/\W+/g, '_') + '.txt', T.reportText(r)); };
      var e = m.querySelector('[data-ed]'); if (e) e.onclick = function () { T.closeModal(); location.hash = '#/secretary/submit/' + r.id; };
    });
  }

  /* ---------- Submit Report ---------- */
  B.submit = function (sub) {
    var d = T.db(), edit = sub && d.reports.filter(function (r) { return r.id === sub && r.barangay === bid(); })[0] || null;
    var typeId = edit ? edit.typeId : (sub && typeOf(sub) ? sub : d.types[0].id);
    var t = typeOf(typeId);
    var v = edit ? edit.details : { dateDone: '', participants: '', what: t.template, amounts: '' };
    var body = head(edit ? 'Fix and resubmit' : 'Submit Report', edit ? 'Fix what DILG pointed out, then send it again.' : 'Pick the report, fill it in and attach your proof files.') +
      (edit && edit.notes ? '<div class="notice"><span>Message from DILG: ' + esc(edit.notes) + '</span></div>' : '') +
      '<div class="form-card" style="max-width:760px;margin:0"><form id="sub-form"><label class="lbl" style="margin-top:0" for="r-t">Report</label><select class="input" id="r-t"' + (edit ? ' disabled' : '') + '>' + d.types.map(function (x) { return '<option value="' + x.id + '"' + (x.id === typeId ? ' selected' : '') + '>' + esc(x.name) + ' (' + x.freq + ')</option>'; }).join('') + '</select>' +
      '<div class="row2"><div><label class="lbl" for="r-d">Date of activity</label><input class="input" type="date" id="r-d" value="' + esc(v.dateDone) + '"></div><div><label class="lbl" for="r-n">Number of participants</label><input class="input" type="number" min="0" id="r-n" value="' + esc(v.participants) + '"></div></div>' +
      '<div id="r-am-wrap"' + (typeId === 'fdp' ? '' : ' class="hidden"') + '><label class="lbl" for="r-a">Amounts (budget, income, expenses)</label><input class="input" id="r-a" value="' + esc(v.amounts) + '" placeholder="Budget ₱…; Expenses ₱…"></div>' +
      '<label class="lbl" for="r-w">What was done</label><textarea class="input" id="r-w" style="min-height:180px">' + esc(v.what) + '</textarea><p class="hint">Started from the DILG draft template. You can change it.</p>' +
      '<label class="lbl" for="r-f">Report and proof files (photos, PDF)</label><input class="input" type="file" id="r-f" multiple accept="image/*,.pdf,.doc,.docx"><div id="r-fl" class="hint" style="margin-top:6px">' + (edit && edit.files.length ? 'Already attached: ' + esc(edit.files.join(', ')) : '') + '</div><div id="r-e"></div>' +
      '<div style="display:flex;gap:12px;margin-top:16px"><button class="btn" style="flex:1">' + (edit ? 'Resubmit report' : 'Send report') + '</button><button type="button" class="btn outline" data-go="#/secretary/overview">Cancel</button></div></form></div>';
    T.after = function () {
      on('[data-go]', function (el) { location.hash = el.getAttribute('data-go'); });
      var sel = document.getElementById('r-t');
      sel.onchange = function () { var x = typeOf(sel.value); document.getElementById('r-w').value = x.template; document.getElementById('r-am-wrap').classList.toggle('hidden', x.id !== 'fdp'); };
      document.getElementById('r-f').onchange = function (e) { document.getElementById('r-fl').textContent = Array.prototype.map.call(e.target.files, function (f) { return f.name; }).join(', '); };
      document.getElementById('sub-form').onsubmit = function (e) {
        e.preventDefault();
        var tid = edit ? edit.typeId : sel.value, ty = typeOf(tid);
        var files = Array.prototype.map.call(document.getElementById('r-f').files, function (f) { return f.name; });
        var rep = { typeId: tid, details: { dateDone: document.getElementById('r-d').value, participants: document.getElementById('r-n').value, what: document.getElementById('r-w').value.trim(), amounts: tid === 'fdp' ? document.getElementById('r-a').value.trim() : '' }, files: files.length ? files : (edit ? edit.files : []) };
        if (rep.details.what.length < 10) { document.getElementById('r-e').innerHTML = '<div class="err">Please describe what was done.</div>'; return; }
        var missing = T.missingInfo(rep);
        function send() {
          var d2 = T.db(), prev = d2.compliance[bid()][tid], late = ['b', 'r'].indexOf(prev) >= 0 || (edit && edit.late);
          var r = edit || { id: T.uid('r'), barangay: bid(), typeId: tid, category: ty.category, name: ty.name + ' – ' + period(), period: period() };
          r.details = rep.details; r.files = rep.files; r.status = 'waiting'; r.score = null; r.sentOn = T.addDays(0); r.sentBy = me().name; r.late = !!late; r.notes = '';
          if (!edit) d2.reports.unshift(r);
          d2.compliance[bid()][tid] = late ? 'b' : (T.missingInfo(r).length ? 'y' : 'g');
          T.logActivity(who(), 'Reports', (edit ? 'Resubmitted ' : 'Submitted ') + ty.name); T.save(); T.toast('Report sent to DILG for review'); location.hash = '#/secretary/reports';
        }
        if (missing.length) T.confirm('The report helper found: ' + missing.join('; ') + '. Send it anyway?', send); else send();
      };
    };
    return shell('submit', body);
  };

  /* ---------- My Reports ---------- */
  B.reports = function () {
    var m = mine().sort(function (a, b) { return a.sentOn < b.sentOn ? 1 : -1; });
    var tabs = [['all', 'All', m.length], ['waiting', 'Waiting', 0], ['sent back', 'Returned', 0], ['verified', 'Approved', 0]];
    tabs.forEach(function (t) { if (t[0] !== 'all') t[2] = m.filter(function (r) { return r.status === t[0]; }).length; });
    var list = m.filter(function (r) { return S.rtab === 'all' || r.status === S.rtab; });
    var body = head('My Reports', 'Every report you sent, and what DILG decided.') +
      '<div class="mini-tabs">' + tabs.map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (S.rtab === t[0] ? 'on' : '') + '">' + t[1] + ' (' + t[2] + ')</button>'; }).join('') + '</div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Report</th><th>Sent</th><th>Status</th><th>Score</th><th>Notes from DILG</th><th class="c">Action</th></tr></thead><tbody>' +
      (list.map(function (r) { return '<tr><td>' + esc(r.name) + '</td><td class="subtle">' + T.fmtDate(r.sentOn) + '</td><td>' + T.chip({ verified: 'g', waiting: 'y', 'sent back': 'r' }[r.status], r.status === 'verified' ? 'Approved' : r.status === 'sent back' ? 'Returned to fix' : 'Waiting for review') + '</td><td>' + (r.status === 'waiting' ? '—' : (r.score ? T.colorChip(r.score) : '—')) + '</td><td class="subtle" style="max-width:260px">' + esc(r.notes || '—') + '</td><td class="c"><button class="btn outline sm" data-v="' + r.id + '">View</button>' + (r.status === 'sent back' ? ' <button class="btn sm" data-fix="' + r.id + '">Fix</button>' : '') + '</td></tr>'; }).join('') || '<tr><td colspan="6" class="c subtle">No reports here yet.</td></tr>') + '</tbody></table></div>';
    T.after = function () {
      on('[data-tab]', function (el) { S.rtab = el.getAttribute('data-tab'); T.render(); });
      on('[data-v]', function (el) { viewReport(T.db().reports.filter(function (r) { return r.id === el.getAttribute('data-v'); })[0]); });
      on('[data-fix]', function (el) { location.hash = '#/secretary/submit/' + el.getAttribute('data-fix'); });
    };
    return shell('reports', body);
  };

  /* ---------- Improvement ---------- */
  B.improvement = function () {
    var d = T.db(), b = bid(), PC = { Overdue: ['r', 'var(--red)'], 'In progress': ['y', 'var(--yellow)'], 'Not started': ['n', '#ccc'], Done: ['g', 'var(--green)'] };
    var plans = d.plans.filter(function (p) { return p.barangay === b; });
    var bps = d.practices.filter(function (p) { return p.status === 'Published' || p.barangay === b; });
    var body = head('Improvement', 'Follow the fixes ' + who() + ' promised, and share what works.') +
      '<div class="two-col even"><div class="panel"><h3>Action plans</h3>' + (plans.map(function (p) { var s = T.planStatus(p), c = PC[s]; return '<div class="row-item click" data-pl="' + p.id + '"><span>' + esc(p.title) + '<br><span class="subtle">Target ' + T.fmtDate(p.due) + '</span></span><span class="prog"><span class="bar"><i style="width:' + p.progress + '%;background:' + c[1] + '"></i></span>' + p.progress + '% ' + T.chip(c[0], s) + '</span></div>'; }).join('') || '<div class="empty">DILG has not set an action plan for your barangay.</div>') + '</div>' +
      '<div class="panel t-y"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:6px 0 0">Best practices</h3><button class="btn sm" id="add-bp">+ Share yours</button></div><p class="subtle">Good ideas from barangays that others can copy.</p>' +
      bps.map(function (x) { return '<div class="row-item click" data-bp="' + x.id + '"><span>' + esc(x.title) + '<br><span class="subtle">' + T.brgyName(x.barangay) + '</span></span>' + (x.status === 'Published' ? T.chip('p', 'Published') : T.chip('y', 'Waiting')) + '</div>'; }).join('') + '</div></div>';
    T.after = function () {
      on('[data-pl]', function (el) {
        var p = d.plans.filter(function (x) { return x.id === el.getAttribute('data-pl'); })[0];
        T.modal('<h3>' + esc(p.title) + '</h3><label class="lbl">Progress: <span id="pv">' + p.progress + '</span>%</label><input type="range" min="0" max="100" step="5" id="pp" value="' + p.progress + '" style="width:100%;accent-color:var(--red)"><div class="actions"><button class="btn outline" data-c>Cancel</button><button class="btn" data-s>Save progress</button></div>', function (m) {
          m.querySelector('#pp').oninput = function (e) { m.querySelector('#pv').textContent = e.target.value; };
          m.querySelector('[data-c]').onclick = T.closeModal;
          m.querySelector('[data-s]').onclick = function () { p.progress = +m.querySelector('#pp').value; T.logActivity(who(), 'Reports', 'Updated progress of "' + p.title + '" to ' + p.progress + '%'); T.save(); T.closeModal(); T.render(); };
        });
      });
      on('[data-bp]', function (el) { var x = d.practices.filter(function (p) { return p.id === el.getAttribute('data-bp'); })[0]; T.modal('<h3>' + esc(x.title) + '</h3><p class="subtle">' + T.brgyName(x.barangay) + '</p><p>' + esc(x.text) + '</p>'); });
      document.getElementById('add-bp').onclick = function () {
        T.modal('<h3>Share a best practice</h3><label class="lbl">Title</label><input class="input" id="b-t"><label class="lbl">What did you do?</label><textarea class="input" id="b-x"></textarea><p class="hint">DILG will review it before it is published.</p><div id="b-e"></div><div class="actions"><button class="btn outline" data-c>Cancel</button><button class="btn" data-s>Send</button></div>', function (m) {
          m.querySelector('[data-c]').onclick = T.closeModal;
          m.querySelector('[data-s]').onclick = function () {
            var t = m.querySelector('#b-t').value.trim(), x = m.querySelector('#b-x').value.trim(); if (!t || !x) { m.querySelector('#b-e').innerHTML = '<div class="err">Fill in both fields.</div>'; return; }
            d.practices.unshift({ id: T.uid('bp'), title: t, barangay: b, status: 'Waiting', text: x }); T.logActivity(who(), 'Public pages', 'Shared best practice "' + t + '"'); T.save(); T.closeModal(); T.render();
          };
        });
      };
    };
    return shell('improvement', body);
  };

  /* ---------- Public Page ---------- */
  var PT = [['ordinances', 'Ordinances'], ['activities', 'Activities'], ['community', 'Community Information'], ['fdp', 'Disclosure documents']];
  B.page = function () {
    var d = T.db(), b = bid(), tab = S.ptab, inner = '';
    var tabs = '<div class="mini-tabs">' + PT.map(function (t) { return '<button data-pt="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>';
    if (tab === 'ordinances') {
      inner = '<div class="panel"><h3>Post a new ordinance</h3><div class="row2"><div><label class="lbl" style="margin-top:0">Ordinance number</label><input class="input" id="o-n" placeholder="Ordinance No. 2026-001"></div><div><label class="lbl" style="margin-top:0">Date</label><input class="input" type="date" id="o-d" value="' + T.addDays(0) + '"></div></div><label class="lbl">Title</label><input class="input" id="o-t"><div id="o-e"></div><div style="text-align:right;margin-top:12px"><button class="btn" id="o-add">Post for review</button></div></div><div class="panel" style="margin-top:16px"><h3>Your ordinances</h3>' +
        (d.ordinances.filter(function (o) { return o.barangay === b; }).sort(function (a, c) { return a.date < c.date ? 1 : -1; }).map(function (o) { return '<div class="row-item"><span>' + esc(o.number + ' – ' + o.title) + '<br><span class="subtle">' + T.fmtDate(o.date) + '</span></span><span>' + T.chip(o.status === 'Published' ? 'g' : 'y', o.status) + ' <button class="link" data-x="' + o.id + '">Remove</button></span></div>'; }).join('') || '<div class="empty">None yet.</div>') + '</div>';
    } else if (tab === 'activities') {
      inner = '<div class="panel"><h3>Add an activity</h3><div class="row2"><div><label class="lbl" style="margin-top:0">Activity name</label><input class="input" id="a-n"></div><div><label class="lbl" style="margin-top:0">Place</label><input class="input" id="a-p"></div></div><label class="lbl">Date</label><input class="input" type="date" id="a-d" value="' + T.addDays(7) + '" style="max-width:240px"><div id="a-e"></div><div style="text-align:right;margin-top:12px"><button class="btn" id="a-add">Add activity</button></div></div><div class="panel" style="margin-top:16px"><h3>Your activities</h3>' +
        (d.activities.filter(function (a) { return a.barangay === b; }).sort(function (a, c) { return a.date < c.date ? -1 : 1; }).map(function (a) { return '<div class="row-item"><span>' + esc(a.name) + '<br><span class="subtle">' + T.fmtDate(a.date) + ' · ' + esc(a.place) + '</span></span><button class="link" data-xa="' + a.id + '">Remove</button></div>'; }).join('') || '<div class="empty">None yet.</div>') + '</div>';
    } else if (tab === 'community') {
      inner = '<div class="panel"><h3>Community Information</h3>' + [['hazard', 'Hazard maps'], ['evac', 'Evacuation centers and routes'], ['sb', 'Sangguniang Barangay members'], ['sk', 'Sangguniang Kabataan members']].map(function (k) { return '<label class="lbl">' + k[1] + '</label><textarea class="input" style="min-height:100px" data-k="' + k[0] + '">' + esc(d[k[0]][b] || '') + '</textarea>'; }).join('') + '<div style="text-align:right;margin-top:14px"><button class="btn" id="ci-save">Save</button></div></div>';
    } else {
      inner = '<div class="panel"><h3>Add a disclosure document</h3><div class="row2"><div><label class="lbl" style="margin-top:0">Title</label><input class="input" id="f-t" placeholder="Full Disclosure Policy – Q4 2026"></div><div><label class="lbl" style="margin-top:0">File</label><input class="input" type="file" id="f-f" accept=".pdf,.doc,.docx,image/*"></div></div><div id="f-e"></div><div style="text-align:right;margin-top:12px"><button class="btn" id="f-add">Add document</button></div></div><div class="panel" style="margin-top:16px"><h3>Posted documents</h3>' +
        (d.fdpDocs.filter(function (x) { return x.barangay === b; }).map(function (x) { return '<div class="row-item"><span>' + esc(x.title) + '<br><span class="subtle">' + esc(x.file) + '</span></span><button class="link" data-xf="' + x.id + '">Remove</button></div>'; }).join('') || '<div class="empty">None yet.</div>') + '</div>';
    }
    var body = head('Public Page', 'What residents of ' + who() + ' see on the public pages.', '<button class="btn outline" id="view-pub">View public page</button>') + tabs + inner;
    T.after = function () {
      on('[data-pt]', function (el) { S.ptab = el.getAttribute('data-pt'); T.render(); });
      document.getElementById('view-pub').onclick = function () { d.ui.barangay = b; T.save(); location.hash = '#/public/announcements'; };
      var g = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }, err = function (id, m) { document.getElementById(id).innerHTML = '<div class="err">' + m + '</div>'; };
      var add = document.getElementById('o-add');
      if (add) add.onclick = function () {
        if (!g('o-n') || !g('o-t')) return err('o-e', 'Enter the ordinance number and title.');
        d.ordinances.unshift({ id: T.uid('ord'), barangay: b, number: g('o-n'), title: g('o-t'), date: g('o-d'), status: 'For review' }); T.logActivity(who(), 'Public pages', 'Posted a new ordinance for review'); T.save(); T.toast('Sent to DILG for review'); T.render();
      };
      on('[data-x]', function (el) { d.ordinances = d.ordinances.filter(function (o) { return o.id !== el.getAttribute('data-x'); }); T.save(); T.render(); });
      var aa = document.getElementById('a-add');
      if (aa) aa.onclick = function () {
        if (!g('a-n') || !g('a-p')) return err('a-e', 'Enter the name and place.');
        d.activities.push({ id: T.uid('act'), barangay: b, name: g('a-n'), place: g('a-p'), date: g('a-d') }); T.logActivity(who(), 'Public pages', 'Added an activity'); T.save(); T.render();
      };
      on('[data-xa]', function (el) { d.activities = d.activities.filter(function (o) { return o.id !== el.getAttribute('data-xa'); }); T.save(); T.render(); });
      var cs = document.getElementById('ci-save');
      if (cs) cs.onclick = function () { document.querySelectorAll('[data-k]').forEach(function (t) { d[t.getAttribute('data-k')][b] = t.value; }); T.logActivity(who(), 'Public pages', 'Updated Community Information'); T.save(); T.toast('Saved'); };
      var fa = document.getElementById('f-add');
      if (fa) fa.onclick = function () {
        var fl = document.getElementById('f-f').files[0]; if (!g('f-t') || !fl) return err('f-e', 'Enter a title and choose a file.');
        d.fdpDocs.push({ id: T.uid('fdp'), barangay: b, title: g('f-t'), file: fl.name, date: T.addDays(0) }); T.logActivity(who(), 'Public pages', 'Posted a disclosure document'); T.save(); T.render();
      };
      on('[data-xf]', function (el) { d.fdpDocs = d.fdpDocs.filter(function (o) { return o.id !== el.getAttribute('data-xf'); }); T.save(); T.render(); });
    };
    return shell('page', body);
  };

  /* ---------- Resident Feedback ---------- */
  B.feedback = function () {
    var list = T.db().feedback.filter(function (f) { return f.barangay === bid(); });
    var sc = { New: 'r', 'In progress': 'y', Done: 'g' };
    var body = head('Resident Feedback', 'Messages residents of ' + who() + ' sent, and what DILG did about them.') +
      (list.map(function (f) { return '<div class="panel" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:10px"><b>' + esc(f.name || 'Anonymous') + ' · ' + esc(f.type) + '</b>' + T.chip(sc[f.status], f.status) + '</div><div class="subtle">' + T.fmtDate(f.date) + '</div><p>' + esc(f.message) + '</p>' + (f.response ? '<div class="item" style="font-weight:600">DILG response: ' + esc(f.response) + '</div>' : '') + '</div>'; }).join('') || '<div class="empty">No resident messages for your barangay yet.</div>');
    return shell('feedback', body);
  };

  /* ---------- Settings ---------- */
  B.settings = function () {
    var u = me();
    var body = head('Settings', 'Your account for ' + who() + '.') +
      '<div class="two-col even" style="max-width:1000px"><div class="panel"><h3>My details</h3><label class="lbl" for="m-n">Full name</label><input class="input" id="m-n" value="' + esc(u.name) + '"><label class="lbl" for="m-e">Email address</label><input class="input" id="m-e" type="email" value="' + esc(u.email) + '"><label class="lbl" for="m-c">Contact number</label><input class="input" id="m-c" value="' + esc(u.contact) + '"><div id="m-x"></div><div style="text-align:right;margin-top:16px"><button class="btn" id="m-save">Save changes</button></div></div>' +
      '<div class="panel t-y"><h3 style="margin-top:6px">Username and password</h3><label class="lbl" for="u-u">Username</label><input class="input" id="u-u" value="' + esc(u.username) + '"><label class="lbl" for="u-p">New password</label><input class="input" id="u-p" type="password" placeholder="••••••••"><label class="lbl" for="u-c">Confirm password</label><input class="input" id="u-c" type="password" placeholder="••••••••"><div id="u-x"></div><div style="text-align:right;margin-top:16px"><button class="btn outline" id="u-save">Change password</button></div></div></div>';
    T.after = function () { T.bindAccountForms(u); };
    return shell('settings', body);
  };
})(window.T);
