/* TERNATRACK - DILG Admin dashboard */
(function (T) {
  var esc = T.esc;
  var A = T.pages.admin = {};
  var S = { rf: { q: '', b: '', cat: '', period: '' }, tab: 'waiting', sel: null, ftab: 'all', fsel: null };

  function on(sel, fn, root) { (root || document).querySelectorAll(sel).forEach(function (el) { el.addEventListener('click', function (e) { fn(el, e); }); }); }
  function shell(active, body) { return T.dashShell('admin', active, body); }
  function head(title, sub, right) { return '<div class="head-row"><div><h1>' + title + '</h1><p class="sub">' + sub + '</p></div>' + (right || '') + '</div>'; }
  function lines(t) { return esc(t).replace(/\n/g, '<br>'); }
  function adminName() { return 'DILG Admin'; }

  /* alerts shared by Overview and Activity */
  T.alerts = function () {
    var d = T.db(), up = [], over = [];
    d.types.forEach(function (t) {
      var n = T.daysUntil(t.due);
      if (n >= 0 && n <= 7) up.push({ n: n, text: t.name + ' is due in ' + n + ' day' + (n === 1 ? '' : 's') });
    });
    up.sort(function (a, b) { return a.n - b.n; });
    d.brgys.forEach(function (b) { T.CORE.forEach(function (c) { if (d.compliance[b.id][c.id] === 'r') over.push(T.brgyName(b.id) + ' - ' + d.types.filter(function (t) { return t.id === c.id; })[0].name); }); });
    return { up: up, over: over };
  };

  /* ---------- Overview ---------- */
  A.overview = function () {
    var d = T.db(), rc = T.reportCounts(), cc = T.complianceCounts(), al = T.alerts();
    var waiting = d.reports.filter(function (r) { return r.status === 'waiting'; }).sort(function (a, b) { return a.barangay - b.barangay; }).slice(0, 6);
    var body = head('All ten barangays', 'A quick look at all ten barangays.') +
      '<div class="stats">' +
      stat('Total barangays', d.brgys.length) + stat('Submitted reports', rc.submitted) + stat('Pending reviews', rc.pending) + stat('Approved reports', rc.approved) + '</div>' +
      '<div class="two-col"><div class="panel"><h3>Reports waiting for your review</h3><div class="tbl-wrap" style="border:0"><table class="tbl"><thead><tr><th>Report</th><th class="c">Barangay</th><th class="c">Sent</th><th class="c">Action</th></tr></thead><tbody>' +
      (waiting.map(function (r) { return '<tr><td>' + esc(r.name) + '</td><td class="c">' + esc(T.brgyName(r.barangay).toUpperCase()) + '</td><td class="c subtle">' + T.fmtDate(r.sentOn) + '</td><td class="c"><button class="btn sm" data-review="' + r.id + '">Review</button></td></tr>'; }).join('') || '<tr><td colspan="4" class="c subtle">Nothing is waiting. Great job!</td></tr>') +
      '</tbody></table></div></div>' +
      '<div class="stack"><div class="panel t-y"><h3 style="margin-top:6px">Compliance at glance</h3>' +
      [['g', 'On time and complete', cc.g], ['y', 'Incomplete', cc.y], ['b', 'Late submission', cc.b], ['r', 'No submission', cc.r]].map(function (x) { return '<div class="item" style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;gap:8px;align-items:center"><i class="dot ' + x[0] + '"></i>' + x[1] + '</span><b>' + x[2] + '</b></div>'; }).join('') + '</div>' +
      '<div class="panel t-r"><h3 style="margin-top:6px">Alerts</h3>' +
      (al.up.slice(0, 3).map(function (a) { return '<div class="item">' + esc(a.text) + '</div>'; }).join('') + al.over.slice(0, 3).map(function (a) { return '<div class="item red">' + esc(a) + ' is overdue</div>'; }).join('') || '<div class="empty">No alerts right now.</div>') + '</div></div></div>';
    T.after = function () { on('[data-review]', function (el) { location.hash = '#/admin/reports/review/' + el.getAttribute('data-review'); }); };
    return shell('overview', body);
  };
  function stat(k, v) { return '<div class="stat"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; }

  /* ---------- Barangays ---------- */
  var BSEG = [['compliance', 'Compliance status'], ['compare', 'Compare']];
  A.barangays = function (sub) {
    sub = sub === 'compare' ? 'compare' : 'compliance';
    return sub === 'compare' ? compare() : compliance();
  };
  function compliance() {
    var d = T.db(), cc = T.complianceCounts();
    var rows = d.brgys.map(function (b) {
      return '<tr><td><b>' + T.brgyName(b.id).toUpperCase() + '</b></td>' + T.CORE.map(function (c) { return '<td class="c">' + T.colorChip(d.compliance[b.id][c.id]) + '</td>'; }).join('') + '<td class="c"><b>' + d.scores[b.id] + '</b></td></tr>';
    }).join('');
    var body = '<div class="head-row"><div><h1>Compliance status</h1><p class="sub">See who is on time, late or missing, and each barangay\'s score.</p></div><div style="display:flex;flex-direction:column;gap:12px;align-items:flex-end">' + T.seg(BSEG, 'compliance', '#/admin/barangays/') + '<button class="btn" id="remind">Send reminder to late and missing</button></div></div>' +
      '<div class="stats">' + [['g', 'On time and complete', cc.g], ['y', 'Incomplete', cc.y], ['b', 'Late submission', cc.b], ['r', 'No submission', cc.r]].map(function (x) { return '<div class="stat"><div class="k"><i class="dot ' + x[0] + '"></i>' + x[1] + '</div><div class="v">' + x[2] + '</div></div>'; }).join('') + '</div>' +
      '<div class="panel"><h3>Status of each barangay</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Barangay</th>' + T.CORE.map(function (c) { return '<th class="c">' + c.col + '</th>'; }).join('') + '<th class="c">Score</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    T.after = function () {
      on('[data-go]', function (el) { location.hash = el.getAttribute('data-go'); });
      document.getElementById('remind').onclick = function () {
        var targets = [];
        d.brgys.forEach(function (b) {
          var issues = T.CORE.filter(function (c) { return ['b', 'r'].indexOf(d.compliance[b.id][c.id]) >= 0; }).map(function (c) { return d.types.filter(function (t) { return t.id === c.id; })[0].name; });
          if (issues.length) {
            targets.push(b.id);
            (d.notes[b.id] = d.notes[b.id] || []).unshift({ at: new Date().toISOString(), text: 'Reminder from DILG: please submit ' + issues.join(', ') + '.' });
          }
        });
        T.logActivity(adminName(), 'Reports', 'Sent reminders to ' + targets.length + ' barangay(s) with late or missing reports');
        T.save();
        T.toast('Reminder sent to ' + targets.length + ' barangay' + (targets.length === 1 ? '' : 's'));
      };
    };
    return shell('barangays', body);
  }

  function compare() {
    var d = T.db();
    var ranked = d.brgys.slice().sort(function (a, b) { return d.scores[b.id] - d.scores[a.id]; });
    var max = Math.max(30, ranked[0] ? d.scores[ranked[0].id] : 30);
    var col = { g: 'var(--green)', y: 'var(--yellow)', r: 'var(--red)' };
    var bars = ranked.map(function (b) { var s = d.scores[b.id], k = T.riskOf(s); return '<div class="bar-row"><span class="nm">' + T.brgyName(b.id) + '</span><div class="bar"><i style="width:' + Math.max(2, s / max * 100) + '%;background:' + col[k] + '"></i></div><span class="num">' + s + '</span></div>'; }).join('');
    /* schematic map: 5 x 2 tiles */
    var tiles = d.brgys.map(function (b, i) {
      var x = (i % 5) * 112 + 8, y = Math.floor(i / 5) * 98 + 8, k = T.riskOf(d.scores[b.id]);
      return '<g><title>' + T.brgyName(b.id) + ' – score ' + d.scores[b.id] + '</title><rect x="' + x + '" y="' + y + '" width="104" height="90" rx="14" fill="' + col[k] + '" opacity=".85"/><text x="' + (x + 52) + '" y="' + (y + 48) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">Brgy ' + b.id + '</text><text x="' + (x + 52) + '" y="' + (y + 66) + '" text-anchor="middle" font-size="11" fill="#fff">' + d.scores[b.id] + ' pts</text></g>';
    }).join('');
    var map = '<div class="map"><svg viewBox="0 0 568 204" width="100%" role="img" aria-label="Map of barangays by risk level">' + tiles + '</svg></div><div class="legend"><span><i class="dot g"></i>Good</span><span><i class="dot y"></i>Watch</span><span><i class="dot r"></i>Needs help</span></div>';
    var need = [];
    ranked.slice().reverse().forEach(function (b) {
      var c = { b: 0, r: 0, y: 0 }; T.CORE.forEach(function (x) { var s = d.compliance[b.id][x.id]; if (c[s] != null) c[s]++; });
      if (c.b) need.push(T.brgyName(b.id) + ' · ' + c.b + ' late report' + (c.b > 1 ? 's' : ''));
      if (c.r) need.push(T.brgyName(b.id) + ' · ' + c.r + ' missing report' + (c.r > 1 ? 's' : ''));
      if (c.y) need.push(T.brgyName(b.id) + ' · ' + c.y + ' incomplete report' + (c.y > 1 ? 's' : ''));
    });
    var stacked = ranked.map(function (b) {
      var c = { g: 0, y: 0, b: 0, r: 0 }; T.CORE.forEach(function (x) { c[d.compliance[b.id][x.id]]++; });
      return '<div class="bar-row"><span class="nm">' + T.brgyName(b.id) + '</span><div class="bar" style="display:flex;height:16px">' + ['g', 'y', 'b', 'r'].map(function (k) { return '<i style="width:' + (c[k] / 5 * 100) + '%;background:var(--' + ({ g: 'green', y: 'yellow', b: 'blue', r: 'red' })[k] + ');border-radius:0" title="' + T.COLORS[k].label + ': ' + c[k] + '"></i>'; }).join('') + '</div></div>';
    }).join('');
    var body = '<div class="head-row"><div><h1>Compare barangays</h1><p class="sub">Scores, trends and the places that need help.</p></div>' + T.seg(BSEG, 'compare', '#/admin/barangays/') + '</div>' +
      '<div class="two-col" style="grid-template-columns:1.9fr 1fr"><div class="stack"><div class="panel"><h3>Scores of each barangay</h3>' + bars + '</div>' +
      '<div class="panel"><h3>Report status mix</h3>' + stacked + '<div class="legend" style="justify-content:flex-start;gap:22px"><span><i class="dot g"></i>On time</span><span><i class="dot y"></i>Incomplete</span><span><i class="dot b"></i>Late</span><span><i class="dot r"></i>No submission</span></div></div></div>' +
      '<div class="stack"><div class="panel"><h3>Map of barangays</h3>' + map + '</div><div class="panel t-r"><h3 style="margin-top:6px">Needs improvement</h3>' + (need.slice(0, 8).map(function (n) { return '<div class="item">' + esc(n) + '</div>'; }).join('') || '<div class="empty">Everything looks good.</div>') + '</div></div></div>';
    T.after = function () { on('[data-go]', function (el) { location.hash = el.getAttribute('data-go'); }); };
    return shell('barangays', body);
  }

  /* ---------- Reports ---------- */
  var RSEG = [['all', 'All reports'], ['review', 'To review'], ['helper', 'Report helper'], ['schedule', 'Report schedule']];
  A.reports = function (sub, arg) {
    sub = RSEG.some(function (x) { return x[0] === sub; }) ? sub : 'all';
    if (sub === 'review') return reviewPage(arg);
    if (sub === 'helper') return helperPage();
    if (sub === 'schedule') return schedulePage();
    return allReports();
  };
  function rseg(a) { return T.seg(RSEG, a, '#/admin/reports/'); }
  function bindSeg() { on('[data-go]', function (el) { location.hash = el.getAttribute('data-go'); }); }

  function allReports() {
    var d = T.db(), periods = {};
    d.reports.forEach(function (r) { periods[r.period] = 1; });
    var body = head('All reports', 'See who is on time, late or missing, and each barangay\'s score.', rseg('all')) +
      '<div class="filters"><input class="input grow" id="f-q" placeholder="Search by report name" value="' + esc(S.rf.q) + '"><select class="input" id="f-b"><option value="">All barangays</option>' + T.barangayOptions(S.rf.b) + '</select>' +
      '<select class="input" id="f-c"><option value="">All categories</option>' + T.CORE.map(function (c) { return '<option' + (S.rf.cat === c.cat ? ' selected' : '') + '>' + c.cat + '</option>'; }).join('') + '</select>' +
      '<select class="input" id="f-p"><option value="">Any period</option>' + Object.keys(periods).map(function (p) { return '<option' + (S.rf.period === p ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Report</th><th>Barangay</th><th>Category</th><th>Period</th><th>Status</th><th class="c">File</th></tr></thead><tbody id="rep-body"></tbody></table></div>';
    T.after = function () {
      bindSeg();
      function draw() {
        var f = S.rf, q = f.q.toLowerCase();
        var list = T.db().reports.filter(function (r) { return (!q || r.name.toLowerCase().indexOf(q) >= 0) && (!f.b || r.barangay === +f.b) && (!f.cat || r.category === f.cat) && (!f.period || r.period === f.period); })
          .sort(function (a, b) { return a.barangay - b.barangay; });
        document.getElementById('rep-body').innerHTML = list.map(function (r) {
          return '<tr><td>' + esc(r.name) + '</td><td>' + T.brgyName(r.barangay) + '</td><td>' + esc(r.category) + '</td><td class="subtle">' + esc(r.period) + '</td><td>' + T.chip({ verified: 'g', waiting: 'y', 'sent back': 'r' }[r.status], T.statusLabel(r.status)) + '</td><td class="c"><button class="btn outline sm" data-dl="' + r.id + '">Download</button></td></tr>';
        }).join('') || '<tr><td colspan="6" class="c subtle">No reports match.</td></tr>';
        on('[data-dl]', function (el) { var r = T.db().reports.filter(function (x) { return x.id === el.getAttribute('data-dl'); })[0]; T.download(r.name.replace(/\W+/g, '_') + '.txt', T.reportText(r)); });
      }
      ['q', 'b', 'c', 'p'].forEach(function (k) {
        var el = document.getElementById('f-' + k), map = { q: 'q', b: 'b', c: 'cat', p: 'period' };
        el.addEventListener(k === 'q' ? 'input' : 'change', function () { S.rf[map[k]] = el.value; draw(); });
      });
      draw();
    };
    return shell('reports', body);
  }

  function defaultScore(r) { return r.late ? 'b' : (T.missingInfo(r).length ? 'y' : 'g'); }

  function reviewPage(arg) {
    var d = T.db();
    if (arg) { var rr = d.reports.filter(function (x) { return x.id === arg; })[0]; if (rr) { S.sel = rr.id; S.tab = rr.status === 'waiting' ? 'waiting' : 'done'; } }
    var waiting = d.reports.filter(function (r) { return r.status === 'waiting'; });
    var done = d.reports.filter(function (r) { return r.status !== 'waiting'; });
    var list = S.tab === 'waiting' ? waiting : done;
    var sel = list.filter(function (r) { return r.id === S.sel; })[0] || list[0] || null;
    if (sel) S.sel = sel.id;
    var chosen = sel ? (S.pick && S.pick.id === sel.id ? S.pick.c : (sel.status === 'waiting' ? defaultScore(sel) : sel.score)) : null;
    var delays = sel ? T.lateCount(sel.barangay) + d.brgys.filter(function (b) { return b.id === sel.barangay; }).reduce(function (n, b) { return n + T.CORE.filter(function (c) { return d.compliance[b.id][c.id] === 'b'; }).length; }, 0) : 0;
    var left = '<div class="panel"><div class="mini-tabs"><button data-tab="waiting" class="' + (S.tab === 'waiting' ? 'on' : '') + '">Waiting (' + waiting.length + ')</button><button data-tab="done" class="' + (S.tab === 'done' ? 'on' : '') + '">Done (' + done.length + ')</button></div>' +
      '<div style="max-height:520px;overflow:auto">' + (list.map(function (r) { return '<div class="item card-i' + (sel && r.id === sel.id ? ' sel' : '') + '" data-pick="' + r.id + '">' + esc(T.brgyName(r.barangay) + ' - ' + r.category) + '<small>Sent ' + T.fmtDate(r.sentOn) + '</small></div>'; }).join('') || '<div class="empty">Nothing here.</div>') + '</div>' +
      (sel ? '<div class="item" style="margin-top:12px;background:#fff6e6">Repeated delays<br><span class="subtle">' + (delays >= 2 ? esc(T.brgyName(sel.barangay)) + ' late ' + delays + ' times this year' : 'No repeated delays for ' + esc(T.brgyName(sel.barangay))) + '</span></div>' : '') + '</div>';
    var right;
    if (!sel) right = '<div class="panel"><div class="empty">Select a report to review.</div></div>';
    else {
      var missing = T.missingInfo(sel);
      right = '<div class="panel"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><h3 style="margin:0">' + esc(T.brgyName(sel.barangay) + ' - ' + sel.category) + '</h3><div class="subtle">Sent by ' + esc(sel.sentBy) + ' on ' + T.fmtDate(sel.sentOn) + '</div></div>' + (sel.late ? T.chip('b', 'Late') : T.chip('g', 'On time')) + '</div>' +
        '<div class="item" style="margin-top:14px;font-weight:600"><span class="subtle" style="font-weight:800;letter-spacing:.3px">REPORT</span><br>' + esc(sel.details.dateDone ? T.fmtDate(sel.details.dateDone) : 'No date') + ' · ' + esc(sel.details.participants ? sel.details.participants + ' participants' : 'participants not stated') + ' · ' + esc(sel.details.what) + (sel.details.amounts ? '<br>Amounts: ' + esc(sel.details.amounts) : '') + '</div>' +
        (missing.length && sel.status === 'waiting' ? '<div class="item" style="background:var(--yel-bg);color:var(--yel-t)">Missing: ' + esc(missing.join(' · ')) + '</div>' : '') +
        '<div class="subtle" style="font-weight:800;margin-bottom:8px">REPORT AND PROOF FILES</div>' + (sel.files.map(function (f, i) { return '<span class="file-chip"><i class="' + (i === 1 ? 'r' : '') + '"></i>' + esc(f) + '</span>'; }).join('') || '<div class="empty">No files attached.</div>') +
        '<div style="font-weight:800;margin-top:10px">Give a score</div><div class="score-row">' + ['g', 'y', 'b', 'r', 'n'].map(function (k) {
          var pts = k === 'n' ? '' : (T.points(k) + (Math.abs(T.points(k)) === 1 ? ' pt' : ' pts'));
          var nm = { g: 'Green', y: 'Yellow', b: 'Blue', r: 'Red', n: 'Gray' }[k];
          return '<div class="score ' + k + (chosen === k ? ' on' : '') + '" data-score="' + k + '"' + (sel.status !== 'waiting' ? ' style="pointer-events:none;opacity:' + (chosen === k ? 1 : .55) + '"' : '') + '><b>' + nm + (pts ? ' - ' + pts : '') + '</b>' + T.COLORS[k].long + '</div>';
        }).join('') + '</div>' +
        '<div style="font-weight:800;margin-bottom:6px">Notes for the secretary (needed when sending back)</div>' +
        '<textarea class="input" id="rv-notes" style="min-height:130px" placeholder="What should be fixed?"' + (sel.status !== 'waiting' ? ' readonly' : '') + '>' + esc(sel.notes) + '</textarea><div id="rv-err"></div>' +
        (sel.status === 'waiting'
          ? '<div class="row2" style="margin-top:14px"><button class="btn outline block" id="send-back">Send back</button><button class="btn block" id="approve">Approve</button></div>'
          : '<div style="margin-top:14px">' + T.chip(sel.status === 'verified' ? 'g' : 'r', T.statusLabel(sel.status)) + '</div>') + '</div>';
    }
    var body = head('Review reports', 'Check each report and its proof, then approve it or send it back with notes.', rseg('review')) + '<div class="two-col review">' + left + right + '</div>';
    T.after = function () {
      bindSeg();
      on('[data-tab]', function (el) { S.tab = el.getAttribute('data-tab'); S.sel = null; S.pick = null; T.render(); });
      on('[data-pick]', function (el) { S.sel = el.getAttribute('data-pick'); S.pick = null; T.render(); });
      on('[data-score]', function (el) { S.pick = { id: sel.id, c: el.getAttribute('data-score') }; S.notesDraft = document.getElementById('rv-notes').value; sel.notes = S.notesDraft; T.render(); });
      if (!sel || sel.status !== 'waiting') return;
      var notes = function () { return document.getElementById('rv-notes').value.trim(); };
      document.getElementById('approve').onclick = function () {
        var d2 = T.db(), r = d2.reports.filter(function (x) { return x.id === sel.id; })[0];
        r.status = 'verified'; r.score = chosen; r.notes = notes();
        d2.scores[r.barangay] = (d2.scores[r.barangay] || 0) + (chosen === 'n' ? 0 : T.points(chosen));
        if (d2.compliance[r.barangay].hasOwnProperty(r.typeId)) d2.compliance[r.barangay][r.typeId] = chosen; else d2.compliance[r.barangay][r.typeId] = chosen;
        (d2.notes[r.barangay] = d2.notes[r.barangay] || []).unshift({ at: new Date().toISOString(), text: r.name + ' was approved.' });
        T.logActivity(adminName(), 'Reports', 'Approved ' + r.name + ' of ' + T.brgyName(r.barangay));
        S.pick = null; S.sel = null; T.save(); T.toast('Report approved'); T.render();
      };
      document.getElementById('send-back').onclick = function () {
        if (!notes()) { document.getElementById('rv-err').innerHTML = '<div class="err">Please write what should be fixed before sending back.</div>'; return; }
        var d2 = T.db(), r = d2.reports.filter(function (x) { return x.id === sel.id; })[0];
        r.status = 'sent back'; r.notes = notes(); r.score = chosen;
        (d2.notes[r.barangay] = d2.notes[r.barangay] || []).unshift({ at: new Date().toISOString(), text: r.name + ' was returned: ' + r.notes });
        T.logActivity(adminName(), 'Reports', 'Sent back ' + r.name + ' of ' + T.brgyName(r.barangay));
        S.pick = null; S.sel = null; T.save(); T.toast('Report sent back to the secretary'); T.render();
      };
    };
    return shell('reports', body);
  }

  function helperPage() {
    var d = T.db();
    var miss = d.reports.filter(function (r) { return r.status === 'waiting' && T.missingInfo(r).length; });
    var body = head('Report helper', 'Draft templates and automatic checks that point out what is missing.', rseg('helper')) +
      '<div class="two-col even" style="grid-template-columns:.9fr 1.3fr"><div class="panel"><h3>Draft report templates</h3><p class="subtle">Secretaries start from these drafts. You can read or change them.</p>' +
      d.types.filter(function (t) { return t.pub; }).map(function (t) { return '<div class="row-item"><span>' + esc(t.name) + '</span><button class="btn outline sm" data-tpl="' + t.id + '">Open</button></div>'; }).join('') + '</div>' +
      '<div class="panel"><h3>Reports with missing information (' + miss.length + ')</h3><p class="subtle">Missing or unclear information found in submitted reports.</p>' +
      (miss.map(function (r) { return '<div class="row-item" style="align-items:center;padding:16px"><span>' + esc(T.brgyName(r.barangay) + ' - ' + r.category) + '<br>' + T.missingInfo(r).map(function (m) { return T.chip('y', m); }).join(' ') + '</span><button class="btn sm" data-open="' + r.id + '">Open report</button></div>'; }).join('') || '<div class="empty">No missing information found.</div>') + '</div></div>';
    T.after = function () {
      bindSeg();
      on('[data-open]', function (el) { location.hash = '#/admin/reports/review/' + el.getAttribute('data-open'); });
      on('[data-tpl]', function (el) {
        var t = T.db().types.filter(function (x) { return x.id === el.getAttribute('data-tpl'); })[0];
        T.modal('<h3>' + esc(t.name) + ' – draft template</h3><textarea class="input" id="tpl" style="min-height:260px">' + esc(t.template) + '</textarea><div class="actions"><button class="btn outline" data-c>Cancel</button><button class="btn" data-s>Save template</button></div>', function (m) {
          m.querySelector('[data-c]').onclick = T.closeModal;
          m.querySelector('[data-s]').onclick = function () { t.template = m.querySelector('#tpl').value; T.save(); T.logActivity(adminName(), 'Reports', 'Updated the ' + t.name + ' template'); T.closeModal(); T.toast('Template saved'); };
        });
      });
    };
    return shell('reports', body);
  }

  function schedulePage() {
    var d = T.db(), F = ['Weekly', 'Monthly', 'Quarterly', 'Semestral', 'Annual'];
    function fopt(sel) { return F.map(function (f) { return '<option' + (f === sel ? ' selected' : '') + '>' + f + '</option>'; }).join(''); }
    var body = head('Report schedule', 'How often each report is due.', rseg('schedule')) +
      '<div class="panel t-y" style="margin-bottom:16px"><h3 style="margin-top:6px">Add a new report</h3><div class="sched-add"><div><label class="lbl" style="margin-top:0" for="n-name">Report name</label><input class="input" id="n-name" placeholder="Name of the new report"></div>' +
      '<div><label class="lbl" style="margin-top:0" for="n-f">How often</label><select class="input" id="n-f" style="border-color:var(--ink)">' + fopt('Monthly') + '</select></div>' +
      '<div><label class="lbl" style="margin-top:0" for="n-d">Due Date</label><input class="input" type="date" id="n-d"></div>' +
      '<div><span class="lbl" style="margin-top:0">Public page</span><label class="check"><input type="checkbox" id="n-p" checked> Show it</label></div><button class="btn" id="add-rep">Add report</button></div><div id="n-err"></div></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Report</th><th>How often</th><th>Due date</th><th>Public page</th></tr></thead><tbody>' +
      d.types.map(function (t) { return '<tr data-t="' + t.id + '"><td>' + esc(t.name) + '</td><td><select class="input" data-f style="width:150px;border-color:var(--ink)">' + fopt(t.freq) + '</select></td><td><input class="input" type="date" data-d value="' + t.due + '" style="width:175px"></td><td><label class="check"><input type="checkbox" data-p' + (t.pub ? ' checked' : '') + '> ' + (t.pub ? 'Public' : 'Internal only') + '</label></td></tr>'; }).join('') +
      '</tbody></table><div style="text-align:right;padding:14px"><button class="btn" id="save-sched">Save schedule</button></div></div>';
    T.after = function () {
      bindSeg();
      document.getElementById('add-rep').onclick = function () {
        var n = document.getElementById('n-name').value.trim(), dt = document.getElementById('n-d').value;
        if (!n || !dt) { document.getElementById('n-err').innerHTML = '<div class="err">Enter the report name and the due date.</div>'; return; }
        d.types.push({ id: T.uid('t'), name: n, category: n, freq: document.getElementById('n-f').value, due: dt, pub: document.getElementById('n-p').checked, template: n + '\nDate:\nDetails:' });
        T.logActivity(adminName(), 'Reports', 'Added the report "' + n + '" to the schedule'); T.save(); T.toast('Report added'); T.render();
      };
      document.getElementById('save-sched').onclick = function () {
        document.querySelectorAll('tr[data-t]').forEach(function (tr) {
          var t = d.types.filter(function (x) { return x.id === tr.getAttribute('data-t'); })[0];
          t.freq = tr.querySelector('[data-f]').value; t.due = tr.querySelector('[data-d]').value || t.due; t.pub = tr.querySelector('[data-p]').checked;
        });
        T.logActivity(adminName(), 'Reports', 'Updated the report schedule'); T.save(); T.toast('Schedule saved'); T.render();
      };
    };
    return shell('reports', body);
  }

  /* ---------- Improvement ---------- */
  function planStatus(p) {
    if (p.progress >= 100) return 'Done';
    if (p.progress <= 0 && T.daysUntil(p.due) >= 0) return 'Not started';
    if (T.daysUntil(p.due) < 0) return 'Overdue';
    return 'In progress';
  }
  T.planStatus = planStatus;
  var PCOL = { Overdue: ['r', 'var(--red)'], 'In progress': ['y', 'var(--yellow)'], 'Not started': ['n', '#ccc'], Done: ['g', 'var(--green)'] };
  A.improvement = function () {
    var d = T.db();
    var body = head('Improvement', 'Follow the fixes barangays promised, and share what works.') +
      '<div class="two-col" style="grid-template-columns:1.25fr 1fr"><div class="panel"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3 style="margin:0">Action plans</h3><button class="btn sm" id="new-plan">+ New action plan</button></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Plan</th><th>Barangay</th><th>Progress</th><th>Status</th></tr></thead><tbody>' +
      d.plans.map(function (p) { var s = planStatus(p), c = PCOL[s]; return '<tr data-plan="' + p.id + '" style="cursor:pointer"><td>' + esc(p.title) + '</td><td>' + T.brgyName(p.barangay) + '</td><td><div class="prog"><div class="bar"><i style="width:' + p.progress + '%;background:' + c[1] + '"></i></div>' + p.progress + '%</div></td><td>' + T.chip(c[0], s) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>' +
      '<div class="panel t-y"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:6px 0 0">Best practices</h3><button class="btn sm" id="new-bp">+ Add</button></div><p class="subtle">Good ideas from barangays that others can copy.</p>' +
      d.practices.map(function (b) { return '<div class="row-item click" data-bp="' + b.id + '"><span>' + esc(b.title) + '<br><span class="subtle">' + T.brgyName(b.barangay) + '</span></span>' + (b.status === 'Published' ? T.chip('p', 'Published') : T.chip('y', 'Waiting')) + '</div>'; }).join('') + '</div></div>';
    T.after = function () {
      document.getElementById('new-plan').onclick = function () { planModal(); };
      on('[data-plan]', function (el) { planModal(d.plans.filter(function (p) { return p.id === el.getAttribute('data-plan'); })[0]); });
      document.getElementById('new-bp').onclick = function () { bpModal(); };
      on('[data-bp]', function (el) { bpModal(d.practices.filter(function (p) { return p.id === el.getAttribute('data-bp'); })[0]); });
    };
    return shell('improvement', body);
  };
  function planModal(p) {
    var d = T.db(), isNew = !p; p = p || { title: '', barangay: 1, progress: 0, due: T.addDays(30) };
    T.modal('<h3>' + (isNew ? 'New action plan' : 'Update action plan') + '</h3><label class="lbl" for="p-t">Plan title</label><input class="input" id="p-t" value="' + esc(p.title) + '">' +
      '<div class="row2"><div><label class="lbl" for="p-b">Barangay</label><select class="input" id="p-b">' + T.barangayOptions(p.barangay) + '</select></div><div><label class="lbl" for="p-d">Target date</label><input class="input" type="date" id="p-d" value="' + p.due + '"></div></div>' +
      '<label class="lbl" for="p-p">Progress: <span id="p-pv">' + p.progress + '</span>%</label><input type="range" id="p-p" min="0" max="100" step="5" value="' + p.progress + '" style="width:100%;accent-color:var(--red)"><div id="p-e"></div>' +
      '<div class="actions">' + (isNew ? '' : '<button class="btn outline" data-del style="margin-right:auto">Delete</button>') + '<button class="btn outline" data-c>Cancel</button><button class="btn" data-s>Save</button></div>', function (m) {
        m.querySelector('#p-p').oninput = function (e) { m.querySelector('#p-pv').textContent = e.target.value; };
        m.querySelector('[data-c]').onclick = T.closeModal;
        var del = m.querySelector('[data-del]'); if (del) del.onclick = function () { d.plans = d.plans.filter(function (x) { return x !== p; }); T.save(); T.closeModal(); T.render(); };
        m.querySelector('[data-s]').onclick = function () {
          var t = m.querySelector('#p-t').value.trim(); if (!t) { m.querySelector('#p-e').innerHTML = '<div class="err">Enter a title.</div>'; return; }
          p.title = t; p.barangay = +m.querySelector('#p-b').value; p.due = m.querySelector('#p-d').value || p.due; p.progress = +m.querySelector('#p-p').value;
          if (isNew) { p.id = T.uid('p'); d.plans.unshift(p); }
          T.logActivity(adminName(), 'Reports', (isNew ? 'Created' : 'Updated') + ' action plan "' + t + '"'); T.save(); T.closeModal(); T.render();
        };
      });
  }
  function bpModal(b) {
    var d = T.db(), isNew = !b; b = b || { title: '', barangay: 1, text: '', status: 'Published' };
    T.modal('<h3>' + (isNew ? 'Add best practice' : 'Best practice') + '</h3><label class="lbl" for="b-t">Title</label><input class="input" id="b-t" value="' + esc(b.title) + '">' +
      '<label class="lbl" for="b-b">Barangay</label><select class="input" id="b-b">' + T.barangayOptions(b.barangay) + '</select><label class="lbl" for="b-x">What they did</label><textarea class="input" id="b-x">' + esc(b.text) + '</textarea><div id="b-e"></div>' +
      '<div class="actions">' + (isNew ? '' : '<button class="btn outline" data-del style="margin-right:auto">Delete</button>') + '<button class="btn outline" data-c>Close</button>' + (!isNew && b.status !== 'Published' ? '<button class="btn yellow" data-pub>Publish</button>' : '') + '<button class="btn" data-s>Save</button></div>', function (m) {
        m.querySelector('[data-c]').onclick = T.closeModal;
        var del = m.querySelector('[data-del]'); if (del) del.onclick = function () { d.practices = d.practices.filter(function (x) { return x !== b; }); T.save(); T.closeModal(); T.render(); };
        function save(pub) {
          var t = m.querySelector('#b-t').value.trim(); if (!t) { m.querySelector('#b-e').innerHTML = '<div class="err">Enter a title.</div>'; return; }
          b.title = t; b.barangay = +m.querySelector('#b-b').value; b.text = m.querySelector('#b-x').value; if (pub) b.status = 'Published';
          if (isNew) { b.id = T.uid('bp'); d.practices.unshift(b); }
          T.logActivity(adminName(), 'Public pages', (pub ? 'Published' : 'Saved') + ' best practice "' + t + '"'); T.save(); T.closeModal(); T.render();
        }
        m.querySelector('[data-s]').onclick = function () { save(false); };
        var pb = m.querySelector('[data-pub]'); if (pb) pb.onclick = function () { save(true); };
      });
  }

  /* ---------- Public content ---------- */
  var CSEG = [['page', 'Page content'], ['feedback', 'Resident feedback']];
  var CARDS = [
    ['programs', 'Programs and accomplishments', 'What each barangay has done. Shown on the Announcements page.', 'r'],
    ['fdp', 'Financial disclosure documents', 'Full Disclosure Policy files for each barangay.', 'y'],
    ['forms', 'Service forms', 'Downloadable forms on the Service Forms page.', 'r'],
    ['community', 'Community Information', 'Hazard maps, evacuation, barangay and youth council members.', 'y'],
    ['chatbot', 'Chatbot answers', 'The questions and answers the chatbot can give.', 'r'],
    ['guides', 'Simple guides and FAQs', 'Plain-language guides and common questions.', 'y']
  ];
  A.content = function (sub) {
    return sub === 'feedback' ? feedbackPage() : contentPage();
  };
  function contentPage() {
    var d = T.db(); d.updated = d.updated || {};
    var pend = d.ordinances.filter(function (o) { return o.status === 'For review'; });
    var body = head('Public page content', 'Everything residents see on the public pages, in one place.', T.seg(CSEG, 'page', '#/admin/content/')) +
      (pend.length ? '<div class="notice"><span>' + pend.length + ' ordinance' + (pend.length > 1 ? 's' : '') + ' posted by barangay secretaries waiting for review.</span><button class="btn sm" id="rev-ord">Review</button></div>' : '') +
      '<div class="cards3">' + CARDS.map(function (c) {
        return '<div class="cc ' + c[3] + '" style="border-top-color:var(--' + (c[3] === 'r' ? 'red' : 'yellow') + ')"><h3>' + c[1] + '</h3><p>' + c[2] + '</p><div class="foot"><span>Updated ' + T.fmtDate(d.updated[c[0]] || T.addDays(-3)) + '</span><button class="btn sm" data-edit="' + c[0] + '">Edit</button></div></div>';
      }).join('') + '</div>';
    T.after = function () {
      on('[data-go]', function (el) { location.hash = el.getAttribute('data-go'); });
      on('[data-edit]', function (el) { editors[el.getAttribute('data-edit')](); });
      var rv = document.getElementById('rev-ord');
      if (rv) rv.onclick = function () {
        T.modal('<h3>Ordinances for review</h3>' + pend.map(function (o) { return '<div class="row-item"><span>' + esc(T.brgyName(o.barangay) + ': ' + o.number + ' – ' + o.title) + '</span><span><button class="btn sm" data-ap="' + o.id + '">Approve</button> <button class="btn outline sm" data-rj="' + o.id + '">Reject</button></span></div>'; }).join(''), function (m) {
          function act(id, ok) { var o = d.ordinances.filter(function (x) { return x.id === id; })[0]; if (ok) o.status = 'Published'; else d.ordinances = d.ordinances.filter(function (x) { return x !== o; }); T.logActivity(adminName(), 'Public pages', (ok ? 'Approved' : 'Rejected') + ' ordinance ' + o.number + ' of ' + T.brgyName(o.barangay)); T.save(); T.closeModal(); T.render(); }
          on('[data-ap]', function (el) { act(el.getAttribute('data-ap'), true); }, m); on('[data-rj]', function (el) { act(el.getAttribute('data-rj'), false); }, m);
        }, true);
      };
    };
    return shell('content', body);
  }
  function touch(key, label) { var d = T.db(); d.updated = d.updated || {}; d.updated[key] = T.addDays(0); T.logActivity(adminName(), 'Public pages', 'Updated ' + label); T.save(); T.closeModal(); T.toast('Saved'); T.render(); }
  var editors = {
    programs: function () {
      var d = T.db();
      T.modal('<h3>Programs and accomplishments</h3><div class="row2"><div><label class="lbl">Barangay</label><select class="input" id="e-b">' + T.barangayOptions(1) + '</select></div><div><label class="lbl">Activity name</label><input class="input" id="e-n"></div></div><div class="row2"><div><label class="lbl">Date</label><input class="input" type="date" id="e-d" value="' + T.addDays(7) + '"></div><div><label class="lbl">Place</label><input class="input" id="e-p"></div></div><div id="e-e"></div><div class="actions"><button class="btn" id="e-add">Add activity</button></div><hr><div id="e-list"></div>', function (m) {
        function list() {
          var b = +m.querySelector('#e-b').value;
          m.querySelector('#e-list').innerHTML = d.activities.filter(function (a) { return a.barangay === b; }).sort(function (a, c) { return a.date < c.date ? -1 : 1; }).map(function (a) { return '<div class="row-item"><span>' + esc(a.name) + '<br><span class="subtle">' + T.fmtDate(a.date) + ' · ' + esc(a.place) + '</span></span><button class="link" data-x="' + a.id + '">Remove</button></div>'; }).join('') || '<div class="empty">No activities.</div>';
          on('[data-x]', function (el) { d.activities = d.activities.filter(function (a) { return a.id !== el.getAttribute('data-x'); }); T.save(); list(); }, m);
        }
        m.querySelector('#e-b').onchange = list;
        m.querySelector('#e-add').onclick = function () {
          var n = m.querySelector('#e-n').value.trim(), p = m.querySelector('#e-p').value.trim(); if (!n || !p) { m.querySelector('#e-e').innerHTML = '<div class="err">Enter the name and place.</div>'; return; }
          d.activities.push({ id: T.uid('act'), barangay: +m.querySelector('#e-b').value, name: n, date: m.querySelector('#e-d').value, place: p }); m.querySelector('#e-n').value = ''; m.querySelector('#e-p').value = ''; m.querySelector('#e-e').innerHTML = ''; T.save(); list();
        };
        list();
        m.querySelector('.actions').insertAdjacentHTML('beforeend', '<button class="btn outline" id="e-done">Done</button>');
        m.querySelector('#e-done').onclick = function () { touch('programs', 'programs and accomplishments'); };
      }, true);
    },
    fdp: function () {
      var d = T.db();
      T.modal('<h3>Financial disclosure documents</h3><div class="row2"><div><label class="lbl">Barangay</label><select class="input" id="e-b">' + T.barangayOptions(1) + '</select></div><div><label class="lbl">Document title</label><input class="input" id="e-n" placeholder="Full Disclosure Policy – Q4 2026"></div></div><label class="lbl">File name</label><input class="input" id="e-f" placeholder="FDP-B1-Q4-2026.pdf"><div id="e-e"></div><div class="actions"><button class="btn" id="e-add">Add document</button><button class="btn outline" id="e-done">Done</button></div><hr><div id="e-list"></div>', function (m) {
        function list() {
          var b = +m.querySelector('#e-b').value;
          m.querySelector('#e-list').innerHTML = d.fdpDocs.filter(function (a) { return a.barangay === b; }).map(function (a) { return '<div class="row-item"><span>' + esc(a.title) + '<br><span class="subtle">' + esc(a.file) + '</span></span><button class="link" data-x="' + a.id + '">Remove</button></div>'; }).join('') || '<div class="empty">No documents.</div>';
          on('[data-x]', function (el) { d.fdpDocs = d.fdpDocs.filter(function (a) { return a.id !== el.getAttribute('data-x'); }); T.save(); list(); }, m);
        }
        m.querySelector('#e-b').onchange = list;
        m.querySelector('#e-add').onclick = function () {
          var n = m.querySelector('#e-n').value.trim(), f = m.querySelector('#e-f').value.trim(); if (!n || !f) { m.querySelector('#e-e').innerHTML = '<div class="err">Enter the title and file name.</div>'; return; }
          d.fdpDocs.push({ id: T.uid('fdp'), barangay: +m.querySelector('#e-b').value, title: n, file: f, date: T.addDays(0) }); m.querySelector('#e-n').value = ''; m.querySelector('#e-f').value = ''; m.querySelector('#e-e').innerHTML = ''; T.save(); list();
        };
        m.querySelector('#e-done').onclick = function () { touch('fdp', 'the financial disclosure documents'); };
        list();
      }, true);
    },
    forms: function () {
      var d = T.db();
      T.modal('<h3>Service forms</h3><p class="subtle">One form name per line. Residents see these on the Service Forms page.</p>' + d.services.map(function (s) { return '<label class="lbl">' + esc(s.name) + '</label><textarea class="input" style="min-height:90px" data-s="' + s.id + '">' + esc(s.forms.join('\n')) + '</textarea>'; }).join('') + '<div class="actions"><button class="btn outline" data-c>Cancel</button><button class="btn" data-sv>Save</button></div>', function (m) {
        m.querySelector('[data-c]').onclick = T.closeModal;
        m.querySelector('[data-sv]').onclick = function () { d.services.forEach(function (s) { var v = m.querySelector('[data-s="' + s.id + '"]').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); if (v.length) s.forms = v; }); touch('forms', 'the service forms'); };
      }, true);
    },
    community: function () {
      var d = T.db(), K = [['hazard', 'Hazard maps'], ['evac', 'Evacuation centers and routes'], ['sb', 'Sangguniang Barangay members'], ['sk', 'Sangguniang Kabataan members']];
      T.modal('<h3>Community Information</h3><label class="lbl">Barangay</label><select class="input" id="e-b">' + T.barangayOptions(1) + '</select><div id="e-f"></div><div class="actions"><button class="btn outline" data-c>Cancel</button><button class="btn" data-sv>Save</button></div>', function (m) {
        function fields() { var b = +m.querySelector('#e-b').value; m.querySelector('#e-f').innerHTML = K.map(function (k) { return '<label class="lbl">' + k[1] + '</label><textarea class="input" style="min-height:95px" data-k="' + k[0] + '">' + esc(d[k[0]][b] || '') + '</textarea>'; }).join(''); }
        fields(); m.querySelector('#e-b').onchange = fields;
        m.querySelector('[data-c]').onclick = T.closeModal;
        m.querySelector('[data-sv]').onclick = function () { var b = +m.querySelector('#e-b').value; K.forEach(function (k) { d[k[0]][b] = m.querySelector('[data-k="' + k[0] + '"]').value; }); touch('community', 'Community Information'); };
      }, true);
    },
    chatbot: function () { qaEditor('chatbot', 'Chatbot answers', true); },
    guides: function () { qaEditor('faqs', 'Simple guides and FAQs', false, 'guides'); }
  };
  function qaEditor(key, title, kw, tkey) {
    var d = T.db(), items = JSON.parse(JSON.stringify(d[key]));
    T.modal('<h3>' + title + '</h3><div id="qa"></div><div class="actions"><button class="btn outline" id="qa-add" style="margin-right:auto">+ Add</button><button class="btn outline" data-c>Cancel</button><button class="btn" id="qa-s">Save</button></div>', function (m) {
      function draw() {
        m.querySelector('#qa').innerHTML = items.map(function (it, i) { return '<div class="item" style="font-weight:500"><label class="lbl" style="margin-top:0">Question</label><input class="input" data-q="' + i + '" value="' + esc(it.q) + '">' + (kw ? '<label class="lbl">Keywords</label><input class="input" data-kw="' + i + '" value="' + esc(it.kw) + '">' : '') + '<label class="lbl">Answer</label><textarea class="input" style="min-height:70px" data-a="' + i + '">' + esc(it.a) + '</textarea><button class="link" data-rm="' + i + '" style="margin-top:6px">Remove</button></div>'; }).join('');
        on('[data-rm]', function (el) { sync(); items.splice(+el.getAttribute('data-rm'), 1); draw(); }, m);
      }
      function sync() { items.forEach(function (it, i) { it.q = m.querySelector('[data-q="' + i + '"]').value; it.a = m.querySelector('[data-a="' + i + '"]').value; if (kw) it.kw = m.querySelector('[data-kw="' + i + '"]').value; }); }
      draw();
      m.querySelector('#qa-add').onclick = function () { sync(); items.push({ id: T.uid('q'), q: '', kw: '', a: '' }); draw(); };
      m.querySelector('[data-c]').onclick = T.closeModal;
      m.querySelector('#qa-s').onclick = function () { sync(); d[key] = items.filter(function (i) { return i.q.trim() && i.a.trim(); }); touch(tkey || key, title.toLowerCase()); };
    }, true);
  }

  function feedbackPage() {
    var d = T.db(), f = d.feedback;
    var list = f.filter(function (x) { return S.ftab === 'all' || x.status === { new: 'New', prog: 'In progress', done: 'Done' }[S.ftab]; });
    var sel = list.filter(function (x) { return x.id === S.fsel; })[0] || list[0] || null; if (sel) S.fsel = sel.id;
    var nNew = f.filter(function (x) { return x.status === 'New'; }).length;
    var sc = { New: 'r', 'In progress': 'y', Done: 'g' };
    var left = '<div class="panel"><div class="mini-tabs">' + [['all', 'All'], ['new', 'New (' + nNew + ')'], ['prog', 'In progress'], ['done', 'Done']].map(function (t) { return '<button data-ft="' + t[0] + '" class="' + (S.ftab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      list.map(function (x) { return '<div class="item card-i' + (sel && x.id === sel.id ? ' sel' : '') + '" data-fp="' + x.id + '"><span style="float:right">' + T.chip(sc[x.status], x.status) + '</span>' + esc((x.name || 'Anonymous') + ' - ' + T.brgyName(x.barangay)) + '<small>' + esc(x.type) + ' ' + T.fmtDate(x.date) + '</small></div>'; }).join('') + (list.length ? '' : '<div class="empty">No feedback here.</div>') + '</div>';
    var right = sel ? '<div class="panel"><h3 style="margin:0">' + esc((sel.name || 'Anonymous') + ' - ' + T.brgyName(sel.barangay)) + '</h3><div class="subtle">Sent on ' + T.fmtDate(sel.date) + '</div><div class="item" style="margin-top:12px;font-weight:600">' + esc(sel.message) + '</div>' +
      '<div class="row2"><div><label class="lbl">Type</label><select class="input" id="fb-t" style="border-color:var(--ink)">' + ['Concern', 'Suggestion', 'Request', 'Thank you'].map(function (t) { return '<option' + (sel.type === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div><div><label class="lbl">Status</label><select class="input" id="fb-s" style="border-color:var(--ink)">' + ['New', 'In progress', 'Done'].map(function (t) { return '<option' + (sel.status === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div></div>' +
      '<label class="lbl">What was done about it</label><textarea class="input" id="fb-r" style="min-height:180px" placeholder="Write the response or action taken">' + esc(sel.response) + '</textarea><button class="btn block" id="fb-save" style="margin-top:14px">Save</button></div>' : '<div class="panel"><div class="empty">Select a message.</div></div>';
    var body = head('Resident feedback', 'Read what residents sent, sort it, and record what was done.', T.seg(CSEG, 'feedback', '#/admin/content/')) + '<div class="two-col review">' + left + right + '</div>';
    T.after = function () {
      on('[data-go]', function (el) { location.hash = el.getAttribute('data-go'); });
      on('[data-ft]', function (el) { S.ftab = el.getAttribute('data-ft'); S.fsel = null; T.render(); });
      on('[data-fp]', function (el) { S.fsel = el.getAttribute('data-fp'); T.render(); });
      var sv = document.getElementById('fb-save');
      if (sv) sv.onclick = function () {
        sel.type = document.getElementById('fb-t').value; sel.status = document.getElementById('fb-s').value; sel.response = document.getElementById('fb-r').value.trim();
        T.logActivity(adminName(), 'Public pages', 'Updated resident feedback from ' + T.brgyName(sel.barangay)); T.save(); T.toast('Saved'); T.render();
      };
    };
    return shell('content', body);
  }

  /* ---------- Accounts ---------- */
  A.accounts = function () {
    var d = T.db(), me = T.user();
    var sc = { Active: 'g', Pending: 'y', Inactive: 'n' };
    var rows = d.accounts.slice().sort(function (a, b) { return (a.role === 'admin' ? 0 : 1) - (b.role === 'admin' ? 0 : 1) || (a.barangay || 0) - (b.barangay || 0); }).map(function (a) {
      var act = a.id === me.id ? '<span class="subtle">You</span>' : a.status === 'Pending' ? '<button class="btn sm" data-ap="' + a.id + '">Approve</button> <button class="btn outline sm" data-dc="' + a.id + '">Decline</button>' : a.status === 'Active' ? '<button class="btn outline sm" data-tg="' + a.id + '">Deactivate</button>' : '<button class="btn outline sm" data-tg="' + a.id + '">Activate</button>';
      return '<tr><td>' + esc(a.name) + '<br><span class="subtle">' + esc(a.email) + '</span></td><td>' + (a.role === 'admin' ? 'DILG Admin' : 'Barangay Secretary') + '</td><td>' + (a.barangay ? T.brgyName(a.barangay) : '—') + '</td><td>' + T.chip(sc[a.status], a.status) + '</td><td style="text-align:right">' + act + '</td></tr>';
    }).join('');
    var body = head('Accounts', 'Add accounts, choose what each person can do, and switch them on or off.', '<button class="btn" id="add-acc">+ Add account</button>') +
      '<div class="panel"><h3>All accounts</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Barangay</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    T.after = function () {
      function get(id) { return d.accounts.filter(function (a) { return a.id === id; })[0]; }
      on('[data-ap]', function (el) { var a = get(el.getAttribute('data-ap')); a.status = 'Active'; T.logActivity(adminName(), 'Accounts', 'Approved a new ' + (a.role === 'admin' ? 'DILG admin' : 'barangay secretary') + ' account'); T.save(); T.toast('Approved. An email notice was queued for ' + a.email); T.render(); });
      on('[data-dc]', function (el) { var a = get(el.getAttribute('data-dc')); T.confirm('Decline and remove the request from ' + a.name + '?', function () { d.accounts = d.accounts.filter(function (x) { return x !== a; }); T.logActivity(adminName(), 'Accounts', 'Declined an account request'); T.save(); T.render(); }); });
      on('[data-tg]', function (el) { var a = get(el.getAttribute('data-tg')); a.status = a.status === 'Active' ? 'Inactive' : 'Active'; T.logActivity(adminName(), 'Accounts', (a.status === 'Active' ? 'Activated' : 'Deactivated') + ' an account'); T.save(); T.render(); });
      document.getElementById('add-acc').onclick = function () {
        T.modal('<h3>Add account</h3><label class="lbl">Role</label><select class="input" id="a-r"><option value="secretary">Barangay Secretary</option><option value="admin">DILG Admin</option></select><label class="lbl">Full name</label><input class="input" id="a-n"><div class="row2"><div><label class="lbl">Email address</label><input class="input" id="a-e" type="email"></div><div><label class="lbl">Contact number</label><input class="input" id="a-c" placeholder="09XX XXX XXXX"></div></div><div class="row2"><div><label class="lbl">Barangay</label><select class="input" id="a-b">' + T.barangayOptions(1) + '</select></div><div><label class="lbl">Username</label><input class="input" id="a-u"></div></div><label class="lbl">Temporary password (8+ characters)</label><input class="input" id="a-p" type="password"><div id="a-x"></div><div class="actions"><button class="btn outline" data-c>Cancel</button><button class="btn" data-s>Create account</button></div>', function (m) {
          m.querySelector('[data-c]').onclick = T.closeModal;
          m.querySelector('#a-r').onchange = function (e) { m.querySelector('#a-b').disabled = e.target.value === 'admin'; };
          m.querySelector('[data-s]').onclick = function () {
            var v = function (i) { return m.querySelector(i).value.trim(); }, role = v('#a-r'), msg = '';
            if (v('#a-n').length < 3) msg = 'Enter the full name.'; else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('#a-e'))) msg = 'Enter a valid email.'; else if (v('#a-u').length < 3) msg = 'Username is too short.'; else if (m.querySelector('#a-p').value.length < 8) msg = 'Password must be 8+ characters.';
            else if (d.accounts.some(function (x) { return x.username.toLowerCase() === v('#a-u').toLowerCase() || x.email.toLowerCase() === v('#a-e').toLowerCase(); })) msg = 'Username or email already exists.';
            if (msg) { m.querySelector('#a-x').innerHTML = '<div class="err">' + msg + '</div>'; return; }
            d.accounts.push({ id: T.uid('u'), role: role, name: v('#a-n'), email: v('#a-e'), contact: v('#a-c'), username: v('#a-u'), password: m.querySelector('#a-p').value, barangay: role === 'admin' ? null : +v('#a-b'), status: 'Active' });
            T.logActivity(adminName(), 'Accounts', 'Added a new account'); T.save(); T.closeModal(); T.render();
          };
        });
      };
    };
    return shell('accounts', body);
  };

  /* ---------- Activity and Alerts ---------- */
  var ASEG = [['all', 'All'], ['reports', 'Reports'], ['accounts', 'Accounts'], ['pages', 'Public pages']];
  A.activity = function (sub) {
    var d = T.db(); sub = sub || 'all';
    var cat = { reports: 'Reports', accounts: 'Accounts', pages: 'Public pages' }[sub];
    var rows = d.log.filter(function (l) { return !cat || l.cat === cat; }).slice(0, 60);
    var al = T.alerts();
    var pendAcc = d.accounts.filter(function (a) { return a.status === 'Pending'; }).length, pendOrd = d.ordinances.filter(function (o) { return o.status === 'For review'; }).length, newFb = d.feedback.filter(function (f) { return f.status === 'New'; }).length;
    var notices = [];
    if (pendAcc) notices.push(pendAcc + ' new account' + (pendAcc > 1 ? 's are' : ' is') + ' waiting');
    if (pendOrd) notices.push(pendOrd + ' ordinance' + (pendOrd > 1 ? 's' : '') + ' waiting for review');
    if (newFb) notices.push(newFb + ' new resident message' + (newFb > 1 ? 's' : ''));
    var body = head('Activity and Alerts', 'A record of what was done, plus deadlines and overdue reports.') +
      '<div class="two-col" style="grid-template-columns:1.9fr 1fr"><div class="panel"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px"><h3 style="margin:0">What happened</h3><div class="mini-tabs" style="margin:0">' + ASEG.map(function (s) { return '<button data-go="#/admin/activity/' + s[0] + '" class="' + (sub === s[0] ? 'on' : '') + '">' + s[1] + '</button>'; }).join('') + '</div></div>' +
      (rows.map(function (l) { return '<div class="act-row"><span class="subtle">' + T.fmtDateTime(l.at) + '</span><b>' + esc(l.who) + '</b><span class="tag">' + esc(l.cat) + '</span><span style="font-weight:700">' + esc(l.text) + '</span></div>'; }).join('') || '<div class="empty">Nothing yet.</div>') + '</div>' +
      '<div class="stack"><div class="panel t-y"><h3 style="margin-top:6px">Coming up</h3>' + (al.up.map(function (a) { return '<div class="item">' + esc(a.text) + '</div>'; }).join('') || '<div class="empty">Nothing due this week.</div>') + '</div>' +
      '<div class="panel t-r"><h3 style="margin-top:6px">Overdue</h3>' + (al.over.slice(0, 8).map(function (a) { return '<div class="item red">' + esc(a) + '</div>'; }).join('') || '<div class="empty">Nothing is overdue.</div>') + '</div>' +
      '<div class="panel"><h3>System notices</h3>' + (notices.map(function (n) { return '<div class="item">' + esc(n) + '</div>'; }).join('') || '<div class="empty">No notices.</div>') + '</div></div></div>';
    T.after = function () { on('[data-go]', function (el) { location.hash = el.getAttribute('data-go'); }); };
    return shell('activity', body);
  };

  /* ---------- Settings ---------- */
  var SSEG = [['account', 'My account'], ['scoring', 'Scoring and risk']];
  A.settings = function (sub) {
    var d = T.db(), me = T.user();
    if (sub === 'scoring') {
      var p = d.settings.points, r = d.settings.risk;
      var body = head('Settings', 'Your account, reminders, and the scoring and risk.', T.seg(SSEG, 'scoring', '#/admin/settings/')) +
        '<div class="panel"><h3>Points for each status</h3><p class="subtle">Used when scoring reports and filling the Compliance status table.</p><div class="points">' +
        [['g', 'Green', 'On time, complete', 'g', p.g], ['y', 'Yellow', 'Incomplete', 'y', p.y], ['b', 'Blue', 'Late', 'b', p.b], ['r', 'Red', 'No submission', 'r', p.r]].map(function (x) { return '<div class="score ' + x[3] + '" style="text-align:left;cursor:default">' + x[1] + '<input type="number" data-pt="' + x[0] + '" value="' + x[4] + '" aria-label="' + x[1] + ' points">' + x[2] + '</div>'; }).join('') +
        '<div class="score n" style="text-align:left;cursor:default">Gray<input value="N/A" disabled aria-label="Gray points">Not applicable</div></div></div>' +
        '<div class="panel t-y" style="margin-top:16px"><h3 style="margin-top:6px">Risk levels</h3><p class="subtle">Used on the Compare barangays map.</p><div class="risks">' +
        '<div class="score r" style="text-align:left;cursor:default">High risk<input type="number" id="rk-h" value="' + r.high + '">Total points below this number</div>' +
        '<div class="score y" style="text-align:left;cursor:default">Watch<input id="rk-w" value="' + r.high + ' to ' + (r.onTrack - 1) + '" disabled>Everything in between</div>' +
        '<div class="score g" style="text-align:left;cursor:default">On track<input type="number" id="rk-o" value="' + r.onTrack + '">Total points from this number</div></div><div id="sc-e"></div>' +
        '<div style="text-align:right;margin-top:10px"><button class="btn" id="sc-save">Save changes</button></div></div>';
      T.after = function () {
        on('[data-go]', function (el) { location.hash = el.getAttribute('data-go'); });
        document.getElementById('sc-save').onclick = function () {
          var np = {}, ok = true;
          document.querySelectorAll('[data-pt]').forEach(function (i) { var v = parseInt(i.value, 10); if (isNaN(v)) ok = false; np[i.getAttribute('data-pt')] = v; });
          var h = parseInt(document.getElementById('rk-h').value, 10), o = parseInt(document.getElementById('rk-o').value, 10);
          if (!ok || isNaN(h) || isNaN(o)) { document.getElementById('sc-e').innerHTML = '<div class="err">Every field needs a whole number.</div>'; return; }
          if (h >= o) { document.getElementById('sc-e').innerHTML = '<div class="err">"High risk" must be lower than "On track".</div>'; return; }
          d.settings.points = np; d.settings.risk = { high: h, onTrack: o };
          T.logActivity(adminName(), 'Reports', 'Updated scoring and risk settings'); T.save(); T.toast('Settings saved'); T.render();
        };
      };
      return shell('settings', body);
    }
    var body2 = head('Settings', 'Your account and scoring and risk.', T.seg(SSEG, 'account', '#/admin/settings/')) +
      '<div class="two-col even" style="max-width:1000px"><div class="panel"><h3>My details</h3><label class="lbl" for="m-n">Full name</label><input class="input" id="m-n" value="' + esc(me.name) + '" placeholder="[Administrator name]"><label class="lbl" for="m-e">Email address</label><input class="input" id="m-e" type="email" value="' + esc(me.email) + '"><label class="lbl" for="m-c">Contact number</label><input class="input" id="m-c" value="' + esc(me.contact) + '"><div id="m-x"></div><div style="text-align:right;margin-top:16px"><button class="btn" id="m-save">Save changes</button></div></div>' +
      '<div class="panel t-y"><h3 style="margin-top:6px">Username and password</h3><label class="lbl" for="u-u">Username</label><input class="input" id="u-u" value="' + esc(me.username) + '"><label class="lbl" for="u-p">New password</label><input class="input" id="u-p" type="password" placeholder="••••••••"><label class="lbl" for="u-c">Confirm password</label><input class="input" id="u-c" type="password" placeholder="••••••••"><div id="u-x"></div><div style="text-align:right;margin-top:16px"><button class="btn outline" id="u-save">Change password</button></div></div></div>';
    T.after = function () {
      on('[data-go]', function (el) { location.hash = el.getAttribute('data-go'); });
      T.bindAccountForms(me);
    };
    return shell('settings', body2);
  };

  /* shared by admin + secretary settings */
  T.bindAccountForms = function (me) {
    var d = T.db();
    document.getElementById('m-save').onclick = function () {
      var n = document.getElementById('m-n').value.trim(), e = document.getElementById('m-e').value.trim(), c = document.getElementById('m-c').value.trim(), x = document.getElementById('m-x');
      if (n.length < 3 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { x.innerHTML = '<div class="err">Enter your name and a valid email.</div>'; return; }
      if (d.accounts.some(function (a) { return a !== me && a.email.toLowerCase() === e.toLowerCase(); })) { x.innerHTML = '<div class="err">That email is already used.</div>'; return; }
      me.name = n; me.email = e; me.contact = c; T.save(); T.toast('Details saved'); T.render();
    };
    document.getElementById('u-save').onclick = function () {
      var u = document.getElementById('u-u').value.trim(), p = document.getElementById('u-p').value, c = document.getElementById('u-c').value, x = document.getElementById('u-x'), msg = '';
      if (u.length < 3) msg = 'Username is too short.'; else if (d.accounts.some(function (a) { return a !== me && a.username.toLowerCase() === u.toLowerCase(); })) msg = 'That username is taken.';
      else if (p && p.length < 8) msg = 'Password must be at least 8 characters.'; else if (p !== c) msg = 'Passwords do not match.';
      if (msg) { x.innerHTML = '<div class="err">' + msg + '</div>'; return; }
      me.username = u; if (p) me.password = p; T.save(); T.toast(p ? 'Password changed' : 'Username saved'); T.render();
    };
  };
})(window.T);
