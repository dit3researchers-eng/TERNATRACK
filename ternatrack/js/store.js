/* TERNATRACK - data store (localStorage) + shared helpers.
   Front-end prototype: all data lives in the browser. */
window.T = window.T || {};
(function (T) {
  var KEY = 'ternatrack.v1';
  var SESSION = 'ternatrack.session';

  /* ---------- helpers ---------- */
  T.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  T.uid = function (p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 9); };
  T.today = function () { var d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  T.addDays = function (n) { var d = T.today(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  T.fmtDate = function (iso) {
    if (!iso) return '—';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  T.fmtDateTime = function (iso) {
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  };
  T.daysUntil = function (iso) {
    var d = new Date(iso + 'T00:00:00');
    return Math.round((d - T.today()) / 86400000);
  };
  T.initials = function (name) {
    var p = String(name || 'U').trim().split(/\s+/);
    return ((p[0] || 'U')[0] + (p.length > 1 ? p[p.length - 1][0] : (p[0][1] || ''))).toUpperCase();
  };

  /* status colour codes */
  T.COLORS = {
    g: { label: 'On time', long: 'On time, complete', cls: 'g' },
    y: { label: 'Incomplete', long: 'Incomplete', cls: 'y' },
    b: { label: 'Late', long: 'Late submission', cls: 'b' },
    r: { label: 'No submission', long: 'No submission', cls: 'r' },
    n: { label: 'N/A', long: 'Not applicable', cls: 'n' }
  };
  T.CORE = [
    { id: 'fdp', col: 'BARANGAY FDP', cat: 'Full Disclosure' },
    { id: 'cleanup', col: 'CLEANUP', cat: 'Weekly Cleanup' },
    { id: 'road', col: 'ROAD', cat: 'Road Clearing' },
    { id: 'meetings', col: 'MEETINGS', cat: 'Meetings' },
    { id: 'garden', col: 'GARDEN', cat: 'Community Garden' }
  ];

  /* ---------- seed ---------- */
  function seed() {
    var rnd = (function (s) { return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; })(7);
    var brgys = []; for (var i = 1; i <= 10; i++) brgys.push({ id: i, name: 'Barangay ' + i });

    var accounts = [
      { id: 'u_admin', role: 'admin', name: 'DILG Administrator', email: 'dilgadmin@gmail.com', contact: '0917 000 0001', username: 'dilg', password: 'dilg1234', barangay: null, status: 'Active' }
    ];
    var secNames = ['Maria Santos', 'Jose Reyes', 'Ana Dela Cruz', 'Pedro Ramos', 'Luz Bautista', 'Rosa Mendoza', 'Carlo Aquino', 'Liza Navarro', 'Ben Castillo', 'Nena Garcia'];
    var stat = ['Active', 'Active', 'Active', 'Pending', 'Inactive', 'Active', 'Pending', 'Active', 'Active', 'Active'];
    for (i = 1; i <= 10; i++) {
      accounts.push({
        id: 'u_sec' + i, role: 'secretary', name: secNames[i - 1],
        email: i === 1 ? 'barangaysecretary@gmail.com' : 'secretary' + i + '@gmail.com',
        contact: '0918 000 00' + (i < 10 ? '0' + i : i),
        username: i === 1 ? 'secretary' : 'secretary' + i,
        password: i === 1 ? 'secretary123' : 'secretary' + i + '123',
        barangay: i, status: stat[i - 1]
      });
    }

    var types = [
      { id: 'fdp', name: 'Barangay Full Disclosure Policy', category: 'Full Disclosure', freq: 'Quarterly', due: T.addDays(5), pub: true,
        template: 'Barangay Full Disclosure Policy – quarterly report\nPeriod covered:\nPostings made (bulletin board / website):\nAnnual budget:\nStatement of income and expenditures (amounts):\nProcurement summary (amounts):\nCertification by the Punong Barangay:' },
      { id: 'cleanup', name: 'Weekly Cleanup', category: 'Weekly Cleanup', freq: 'Monthly', due: T.addDays(2), pub: true,
        template: 'Weekly Cleanup activity\nDate done:\nArea cleaned:\nNumber of participants:\nWhat was done:\nAttach photos as proof.' },
      { id: 'road', name: 'Barangay Road Clearing', category: 'Road Clearing', freq: 'Monthly', due: T.addDays(-3), pub: true,
        template: 'Barangay Road Clearing\nDate of activity:\nRoad / street cleared:\nObstructions removed:\nNumber of participants:\nAttach photos as proof.' },
      { id: 'meetings', name: 'Meetings Conducted', category: 'Meetings', freq: 'Monthly', due: T.addDays(-1), pub: true,
        template: 'Meetings Conducted\nDate of meeting:\nType (Sangguniang Barangay / Assembly):\nNumber of attendees:\nAgenda and resolutions:\nAttach the minutes.' },
      { id: 'garden', name: 'Barangay Community Garden', category: 'Community Garden', freq: 'Quarterly', due: T.addDays(12), pub: true,
        template: 'Barangay Community Garden\nDate of activity:\nPlanting area:\nCrops planted / harvested:\nNumber of participants:\nAttach photos as proof.' },
      { id: 'sem', name: 'Semestral Accomplishment Report', category: 'Semestral', freq: 'Semestral', due: T.addDays(40), pub: false,
        template: 'Semestral Accomplishment Report\nPeriod covered:\nProjects completed:\nFunds used:\nChallenges:' },
      { id: 'ann', name: 'Annual Barangay Report', category: 'Annual', freq: 'Annual', due: T.addDays(95), pub: false,
        template: 'Annual Barangay Report\nYear covered:\nSummary of accomplishments:\nFinancial summary:\nPlans for next year:' }
    ];

    /* compliance grid: 24 green, 12 yellow, 9 blue, 5 red over 10 barangays x 5 reports */
    var pool = [], k;
    for (k = 0; k < 24; k++) pool.push('g');
    for (k = 0; k < 12; k++) pool.push('y');
    for (k = 0; k < 9; k++) pool.push('b');
    for (k = 0; k < 5; k++) pool.push('r');
    for (k = pool.length - 1; k > 0; k--) { var j = Math.floor(rnd() * (k + 1)); var t = pool[k]; pool[k] = pool[j]; pool[j] = t; }
    var compliance = {}, p = 0;
    brgys.forEach(function (b) {
      compliance[b.id] = {};
      T.CORE.forEach(function (c) { compliance[b.id][c.id] = pool[p++]; });
      compliance[b.id].sem = 'n'; compliance[b.id].ann = 'n';
    });

    var scoreList = { 2: 30, 4: 27, 8: 24, 6: 21, 1: 18, 9: 15, 3: 12, 5: 9, 10: 7, 7: 4 };

    /* reports: 24 submitted = 11 verified, 7 waiting, 6 sent back */
    var reports = [];
    var cats = ['cleanup', 'garden', 'fdp', 'road', 'meetings'];
    function mk(n, status, barangay, typeId, opts) {
      var ty = types.filter(function (x) { return x.id === typeId; })[0];
      var sec = accounts.filter(function (a) { return a.barangay === barangay; })[0];
      opts = opts || {};
      var r = {
        id: 'r' + n, name: ty.name + ' – ' + (opts.period || 'Nov 2026'), typeId: typeId, category: ty.category, barangay: barangay,
        period: opts.period || 'Nov 2026', status: status, score: opts.score || null,
        sentOn: T.addDays(-(n % 20) - 1), sentBy: sec ? sec.name : 'Secretary', late: !!opts.late,
        details: { dateDone: opts.noDate ? '' : T.addDays(-(n % 20) - 3), participants: opts.noPart ? '' : String(8 + n), what: opts.what || ('Completed ' + ty.name.toLowerCase() + ' with residents and barangay officials.'), amounts: typeId === 'fdp' ? (opts.noAmt ? '' : 'Budget ₱1,250,000; Expenses ₱840,000') : '' },
        files: opts.noPhoto ? [] : ['photo-1.jpg', 'photo-2.jpg', 'document.pdf'], notes: opts.notes || ''
      };
      reports.push(r);
    }
    var n = 1;
    [[2, 'fdp'], [4, 'cleanup'], [8, 'road'], [6, 'meetings'], [1, 'garden'], [9, 'fdp'], [3, 'cleanup'], [2, 'road'], [4, 'garden'], [8, 'cleanup'], [6, 'fdp']].forEach(function (x) {
      mk(n++, 'verified', x[0], x[1], { score: 'g' });
    });
    [[1, 'cleanup', { late: true, noPhoto: true }], [2, 'garden', { noPart: true }], [3, 'road', { noDate: true, late: true }], [5, 'fdp', { noAmt: true }], [8, 'meetings', {}], [9, 'garden', {}], [10, 'cleanup', { late: true }]].forEach(function (x) {
      mk(n++, 'waiting', x[0], x[1], x[2]);
    });
    [[7, 'cleanup', 'Please attach clear photos of the activity.'], [10, 'fdp', 'Amounts do not match the budget posted.'], [7, 'road', 'Date of activity must be indicated.'], [5, 'meetings', 'Attach signed minutes.'], [3, 'garden', 'State number of participants.'], [4, 'road', 'Resubmit with complete proof files.']].forEach(function (x) {
      mk(n++, 'sent back', x[0], x[1], { notes: x[2], late: x[0] === 7 });
    });
    reports.forEach(function (r) { if (r.status === 'sent back') r.score = 'y'; });

    function ord(b, i, title, ds, status) { return { id: T.uid('ord'), barangay: b, number: 'Ordinance No. 2026-' + (b < 10 ? '0' + b : b) + '-' + (i < 10 ? '0' + i : i), title: title, date: ds, status: status || 'Published' }; }
    var ordinances = [], activities = [], fdpDocs = [], hazard = {}, evac = {}, sb = {}, sk = {};
    var ordT = ['Ordinance Regulating Garbage Collection Schedule', 'Ordinance on Curfew Hours for Minors', 'Ordinance Establishing the Barangay Disaster Fund', 'Ordinance Prohibiting Open Burning', 'Ordinance on Noise Regulation'];
    var actT = [['Barangay Clean-Up Drive', 'Barangay Hall'], ['Free Medical and Dental Mission', 'Barangay Covered Court'], ['Community Garden Planting Day', 'Barangay Garden Plot'], ['Disaster Preparedness Seminar', 'Barangay Hall'], ['Youth Sports Fest', 'Barangay Covered Court']];
    brgys.forEach(function (b) {
      for (var q = 0; q < 5; q++) {
        ordinances.push(ord(b.id, q + 1, ordT[q], T.addDays(-(q * 17 + b.id)), 'Published'));
        activities.push({ id: T.uid('act'), barangay: b.id, name: actT[q][0], date: T.addDays(q * 6 + 3), place: actT[q][1] });
      }
      ['Q1', 'Q2', 'Q3'].forEach(function (qq) { fdpDocs.push({ id: T.uid('fdp'), barangay: b.id, title: 'Full Disclosure Policy – ' + qq + ' 2026', file: 'FDP-B' + b.id + '-' + qq + '-2026.pdf', date: T.addDays(-90 + (qq === 'Q2' ? 30 : qq === 'Q3' ? 60 : 0)) }); });
      hazard[b.id] = 'Flood-prone: low-lying areas near the creek.\nLandslide risk: none reported.\nHazard map for Barangay ' + b.id + ' is posted at the Barangay Hall.';
      evac[b.id] = 'Evacuation Center 1: Barangay Hall, Barangay ' + b.id + '\nEvacuation Center 2: Barangay Elementary School\nRoute: Follow the main road toward the covered court.';
      sb[b.id] = 'Punong Barangay: Hon. Juan Dela Cruz\nKagawad: Hon. R. Santos, Hon. M. Reyes, Hon. A. Garcia, Hon. L. Cruz, Hon. P. Ramos, Hon. T. Bautista, Hon. E. Mendoza\nSecretary: ' + secNames[b.id - 1] + '\nTreasurer: Hon. V. Aquino';
      sk[b.id] = 'SK Chairperson: Hon. Kim Navarro\nSK Kagawad: Hon. J. Reyes, Hon. D. Castillo, Hon. S. Santos, Hon. C. Dela Cruz, Hon. M. Garcia, Hon. N. Lopez, Hon. P. Torres';
    });
    ordinances.push(ord(2, 6, 'Ordinance on Stray Animal Control', T.addDays(-1), 'For review'));

    var services = [
      { id: 'kp', name: 'Katarungang Pambarangay', desc: 'Settling disputes at the barangay level. Forms included.', forms: ['Complaint Form (KP Form 7)', 'Summons Form (KP Form 9)', 'Notice of Hearing (KP Form 8)', 'Amicable Settlement (KP Form 16)'] },
      { id: 'kasambahay', name: 'Kasambahay', desc: 'Registration of household helpers. Forms for the secretary and for the client.', forms: ['Forms for the secretary', 'Forms for the client'] },
      { id: 'vaw', name: 'VAW', desc: 'Help for cases of violence against women and children. Forms for the secretary.', forms: ['Barangay Protection Order Application', 'VAWC Intake Form', 'Referral Form'] },
      { id: 'cso', name: 'CSO and NGO Accreditation', desc: 'For barangay-based civil society organizations and NGOs. Downloadable forms.', forms: ['Downloadable accreditation forms'] }
    ];
    var charter = [
      { id: 'c1', name: 'Barangay Clearance', time: '15 minutes', req: 'Valid ID, Cedula, Proof of residency' },
      { id: 'c2', name: 'Certificate of Indigency', time: '20 minutes', req: 'Valid ID, Letter of request' },
      { id: 'c3', name: 'Certificate of Residency', time: '15 minutes', req: 'Valid ID, Proof of residency' },
      { id: 'c4', name: 'Business Clearance', time: '1 day', req: 'DTI/Mayor\'s permit, Valid ID, Cedula' },
      { id: 'c5', name: 'Katarungang Pambarangay filing', time: '1 hour', req: 'Valid ID, Written complaint' }
    ];
    var chatbot = [
      { id: 'cb1', q: 'How do I get a barangay clearance?', kw: 'clearance barangay clearance requirements', a: 'Bring a valid ID, your Cedula and proof of residency to the barangay hall. Processing takes about 15 minutes. See the Citizen\'s Charter under Official Documents.' },
      { id: 'cb2', q: 'Where can I download forms?', kw: 'forms download form kasambahay katarungan vaw cso', a: 'Open the Service Forms page. Pick a service (Katarungang Pambarangay, Kasambahay, VAW, CSO and NGO Accreditation) then press Download.' },
      { id: 'cb3', q: 'Where is the evacuation center?', kw: 'evacuation center route typhoon flood', a: 'Open Community Information, then Evacuation, to see the evacuation centers and routes of your barangay.' },
      { id: 'cb4', q: 'How can I send a complaint or suggestion?', kw: 'feedback complaint suggestion concern comment', a: 'Go to the Feedback page, write your message, choose your barangay and press Send message. Your name is optional.' },
      { id: 'cb5', q: 'Where can I see the barangay budget?', kw: 'budget disclosure fdp transparency expenses money', a: 'Open Transparency Corner. The Barangay Full Disclosure Policy Portal lists the disclosure documents of your barangay.' },
      { id: 'cb6', q: 'Who are the barangay officials?', kw: 'officials council kagawad sangguniang captain sk', a: 'Open Community Information. See Sangguniang Barangay for the council and Sangguniang Kabataan for the youth council.' }
    ];
    var faqs = [
      { id: 'f1', q: 'Who can use the public portal?', a: 'Anyone. Residents can read announcements, ordinances, forms and the Citizen\'s Charter without an account.' },
      { id: 'f2', q: 'Why do I need an account?', a: 'Only DILG staff and barangay secretaries need accounts to send and review reports.' },
      { id: 'f3', q: 'How long does account approval take?', a: 'The DILG Admin checks every new account. You will get an email when it is approved.' }
    ];

    var feedback = [
      { id: 'fb1', name: 'Roberto Lim', barangay: 1, message: 'The streetlight near the basketball court has been out for two weeks.', type: 'Concern', status: 'New', response: '', date: T.addDays(-1) },
      { id: 'fb2', name: 'Elena Cruz', barangay: 4, message: 'Please post the clean-up schedule on the bulletin board.', type: 'Suggestion', status: 'New', response: '', date: T.addDays(-2) },
      { id: 'fb3', name: '', barangay: 7, message: 'Request for a drainage inspection along Mabini St.', type: 'Request', status: 'In progress', response: 'Inspection scheduled with the municipal engineer.', date: T.addDays(-4) },
      { id: 'fb4', name: 'Mario Tan', barangay: 2, message: 'Thank you for the quick release of my clearance.', type: 'Thank you', status: 'Done', response: 'Salamat po!', date: T.addDays(-6) },
      { id: 'fb5', name: 'Ligaya Perez', barangay: 1, message: 'Can we have a weekend schedule for the barangay hall?', type: 'Request', status: 'New', response: '', date: T.addDays(-1) }
    ];

    var plans = [
      { id: 'p1', title: 'Catch up on late road clearing reports', barangay: 7, progress: 20, status: 'Overdue', due: T.addDays(-5) },
      { id: 'p2', title: 'Train staff on report submission', barangay: 10, progress: 35, status: 'In progress', due: T.addDays(14) },
      { id: 'p3', title: 'Set up weekly cleanup photo log', barangay: 5, progress: 60, status: 'In progress', due: T.addDays(10) },
      { id: 'p4', title: 'Prepare Full Disclosure postings', barangay: 3, progress: 0, status: 'Not started', due: T.addDays(30) },
      { id: 'p5', title: 'Complete meeting minutes backlog', barangay: 9, progress: 80, status: 'In progress', due: T.addDays(7) },
      { id: 'p6', title: 'Digitize resident records', barangay: 1, progress: 100, status: 'Done', due: T.addDays(-10) }
    ];
    var practices = [
      { id: 'bp1', title: 'Photo checklist for cleanup proof', barangay: 1, status: 'Published', text: 'Take a before, during and after photo for each cleanup and attach all three.' },
      { id: 'bp2', title: 'Monthly reminder text to purok leaders', barangay: 2, status: 'Waiting', text: 'Send an SMS reminder one week before report deadlines.' }
    ];

    var log = [
      { id: T.uid('l'), at: T.addDays(0) + 'T09:12:00', who: 'DILG Admin', cat: 'Reports', text: 'Approved Weekly Cleanup of Barangay 4' },
      { id: T.uid('l'), at: T.addDays(0) + 'T08:40:00', who: 'Barangay 3', cat: 'Reports', text: 'Submitted Weekly Cleanup' },
      { id: T.uid('l'), at: T.addDays(-1) + 'T15:05:00', who: 'DILG Admin', cat: 'Accounts', text: 'Approved a new barangay secretary account' },
      { id: T.uid('l'), at: T.addDays(-1) + 'T11:30:00', who: 'DILG Admin', cat: 'Accounts', text: 'Deactivated an account' },
      { id: T.uid('l'), at: T.addDays(-2) + 'T10:00:00', who: 'Barangay 2', cat: 'Public pages', text: 'Posted a new ordinance for review' },
      { id: T.uid('l'), at: T.addDays(-3) + 'T14:20:00', who: 'DILG Admin', cat: 'Public pages', text: 'Updated the service forms' }
    ];

    return {
      v: 1, brgys: brgys, accounts: accounts, types: types, compliance: compliance, scores: scoreList, reports: reports,
      ordinances: ordinances, activities: activities, fdpDocs: fdpDocs, hazard: hazard, evac: evac, sb: sb, sk: sk,
      services: services, charter: charter, chatbot: chatbot, faqs: faqs, feedback: feedback, plans: plans, practices: practices, log: log,
      notes: {}, /* barangay id -> [{at, text}] messages from DILG */
      settings: { points: { g: 3, y: 1, b: -1, r: 0 }, risk: { high: 12, onTrack: 21 } },
      ui: { barangay: 1 }
    };
  }

  /* ---------- persistence ---------- */
  var db = null;
  T.load = function () {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || db.v !== 1) { db = seed(); T.save(); }
    return db;
  };
  T.save = function () { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
  T.db = function () { return db || T.load(); };
  T.reset = function () { localStorage.removeItem(KEY); localStorage.removeItem(SESSION); db = null; T.load(); };

  T.session = function () { try { return JSON.parse(localStorage.getItem(SESSION)); } catch (e) { return null; } };
  T.setSession = function (u) { if (u) localStorage.setItem(SESSION, JSON.stringify({ id: u.id, role: u.role })); else localStorage.removeItem(SESSION); };
  T.user = function () {
    var s = T.session(); if (!s) return null;
    var u = T.db().accounts.filter(function (a) { return a.id === s.id; })[0];
    return u && u.status === 'Active' ? u : null;
  };
  T.logActivity = function (who, cat, text) {
    T.db().log.unshift({ id: T.uid('l'), at: new Date().toISOString(), who: who, cat: cat, text: text });
    T.save();
  };

  /* ---------- derived data ---------- */
  T.brgyName = function (id) { return 'Barangay ' + id; };
  T.points = function (c) { var v = T.db().settings.points[c]; return v == null ? 0 : v; };
  T.riskOf = function (score) {
    var r = T.db().settings.risk;
    if (score < r.high) return 'r';
    if (score >= r.onTrack) return 'g';
    return 'y';
  };
  T.complianceCounts = function () {
    var c = { g: 0, y: 0, b: 0, r: 0 }, d = T.db();
    d.brgys.forEach(function (b) { T.CORE.forEach(function (x) { var s = d.compliance[b.id][x.id]; if (c[s] != null) c[s]++; }); });
    return c;
  };
  T.reportCounts = function () {
    var rs = T.db().reports;
    return {
      submitted: rs.length,
      pending: rs.filter(function (r) { return r.status === 'waiting'; }).length,
      approved: rs.filter(function (r) { return r.status === 'verified'; }).length,
      returned: rs.filter(function (r) { return r.status === 'sent back'; }).length
    };
  };
  T.missingInfo = function (r) {
    var m = [];
    if (!r.files || !r.files.length) m.push('No photo attached');
    if (!r.details.dateDone) m.push('Date of activity is missing');
    if (['cleanup', 'garden', 'road', 'meetings'].indexOf(r.typeId) >= 0 && !String(r.details.participants).trim()) m.push('Number of participants not stated');
    if (r.typeId === 'fdp' && !String(r.details.amounts).trim()) m.push('Some amounts are missing');
    return m;
  };
  T.lateCount = function (b) {
    return T.db().reports.filter(function (r) { return r.barangay === b && r.late; }).length;
  };
  T.statusLabel = function (s) { return { verified: 'Verified', waiting: 'Waiting', 'sent back': 'Sent back' }[s] || s; };

  /* downloads */
  T.download = function (name, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  T.reportText = function (r) {
    var L = ['TERNATRACK – DILG MUNICIPAL OFFICE – TERNATE, CAVITE', '', r.name, 'Barangay: ' + T.brgyName(r.barangay), 'Category: ' + r.category, 'Period: ' + r.period,
      'Status: ' + T.statusLabel(r.status), 'Sent by: ' + r.sentBy + ' on ' + T.fmtDate(r.sentOn), '',
      'Date done: ' + (r.details.dateDone || '—'), 'Participants: ' + (r.details.participants || '—'), 'What was done: ' + r.details.what];
    if (r.details.amounts) L.push('Amounts: ' + r.details.amounts);
    L.push('Files: ' + (r.files.join(', ') || 'none'));
    if (r.notes) L.push('', 'Notes from DILG: ' + r.notes);
    return L.join('\n');
  };
})(window.T);
