/* TERNATRACK - Auth: login, 2-step sign up, pending approval */
(function (T) {
  var esc = T.esc;
  var A = T.pages.auth = {};
  var reg = {}; /* sign-up draft held between the two steps */

  var LEFT_LOGIN = ['Reports that keep our <span>barangays on track</span>.', 'Sign in to send, review and follow your barangay reports.'];
  function foot(txt) { return txt + ' <a href="#/public/announcements">Go to the public portal</a>'; }

  A.login = function (role) {
    if (!role) {
      var card = '<div class="auth-card"><h2>Welcome Back</h2><p class="sub">Who is signing in?</p>' +
        '<button class="role-btn" data-go="#/login/admin">DILG Admin</button><button class="role-btn" data-go="#/login/secretary">Barangay Secretary</button>' +
        '<p class="small">Don\'t have an account? <a href="#/signup">Create account</a></p></div>';
      return T.authShell(LEFT_LOGIN[0], LEFT_LOGIN[1], card, foot('Looking for barangay information instead?'), '#/public/announcements');
    }
    var admin = role === 'admin';
    var card2 = '<form class="auth-card" id="login-form"><span class="badge-role">' + (admin ? 'DILG ADMIN' : 'BARANGAY SECRETARY') + '</span>' +
      '<h2>Welcome Back</h2><p class="sub">' + (admin ? 'Sign in with your DILG account.' : 'Sign in to your barangay account.') + '</p>' +
      '<label class="lbl" for="l-id">Email address</label><input class="input" id="l-id" autocomplete="username" placeholder="' + (admin ? 'dilgadmin@gmail.com' : 'barangaysecretary@gmail.com') + '" required>' +
      '<label class="lbl" for="l-pw">Password</label><input class="input" id="l-pw" type="password" autocomplete="current-password" placeholder="Enter your password" required>' +
      '<div class="forgot"><button type="button" class="link" id="forgot">Forgot Password?</button></div><div id="l-err"></div>' +
      '<button class="btn block">Sign in</button>' +
      '<p class="small">Don\'t have an account? <a href="#/signup/' + role + '">Create account</a></p></form>';
    T.after = function () {
      document.getElementById('login-form').onsubmit = function (e) {
        e.preventDefault();
        var id = document.getElementById('l-id').value.trim().toLowerCase(), pw = document.getElementById('l-pw').value;
        var u = T.db().accounts.filter(function (a) { return a.role === role && (a.email.toLowerCase() === id || a.username.toLowerCase() === id); })[0];
        var err = document.getElementById('l-err');
        if (!u || u.password !== pw) { err.innerHTML = '<div class="err">Incorrect email/username or password.</div>'; return; }
        if (u.status === 'Pending') { T.pendingEmail = u.email; location.hash = '#/pending'; return; }
        if (u.status !== 'Active') { err.innerHTML = '<div class="err">This account is inactive. Please contact the DILG Admin.</div>'; return; }
        T.setSession(u);
        T.logActivity(admin ? 'DILG Admin' : T.brgyName(u.barangay), 'Accounts', 'Signed in');
        location.hash = '#/' + role + '/overview';
      };
      document.getElementById('forgot').onclick = function () {
        T.modal('<h3>Forgot password</h3><p>Enter your email address. If the account exists, the DILG Municipal Office will send reset instructions.</p><input class="input" id="fp" type="email" placeholder="Email address"><div class="actions"><button class="btn outline" data-c>Cancel</button><button class="btn" data-s>Send</button></div>', function (m) {
          m.querySelector('[data-c]').onclick = T.closeModal;
          m.querySelector('[data-s]').onclick = function () { if (!m.querySelector('#fp').value.trim()) return; T.closeModal(); T.toast('If that email is registered, reset instructions were sent.'); };
        });
      };
    };
    return T.authShell(LEFT_LOGIN[0], admin ? 'Review reports from all ten barangays in one place.' : 'Send your barangay\'s reports online and see their status.', card2, foot('Looking for barangay information instead?'), '#/login');
  };

  var SIGN_LEFT = ['Join TERNATRACK <span>in two easy steps</span>', 'New accounts are checked by the DILG Admin before they can sign in.'];
  function signFoot() { return foot('Just want barangay information?'); }

  A.signup = function (role, step) {
    if (!role) {
      var c = '<div class="auth-card"><h2>Create Account</h2><p class="sub">Who is signing up?</p>' +
        '<button class="role-btn" data-go="#/signup/admin">DILG Admin</button><button class="role-btn" data-go="#/signup/secretary">Barangay Secretary</button>' +
        '<p class="small">Already have an account? <a href="#/login">Sign in</a></p></div>';
      return T.authShell(SIGN_LEFT[0], SIGN_LEFT[1], c, signFoot(), '#/login');
    }
    var admin = role === 'admin';
    if (step === '2') {
      if (!reg.name) { location.hash = '#/signup/' + role; return ''; }
      var c2 = '<form class="auth-card" id="su2"><div class="steps"><i class="on"></i><i class="on"></i> STEP 2 OF 2</div><h2 style="font-size:27px">Set your username and password</h2>' +
        '<p class="sub">You will use these to sign in.</p>' +
        '<label class="lbl" for="s-u">Username</label><input class="input" id="s-u" autocomplete="username" placeholder="' + (admin ? 'dilg' : 'secretary') + '" required>' +
        '<label class="lbl" for="s-p">Password</label><input class="input" id="s-p" type="password" autocomplete="new-password" placeholder="At least 8 characters" required>' +
        '<label class="lbl" for="s-c">Confirm password</label><input class="input" id="s-c" type="password" autocomplete="new-password" placeholder="Type your password again" required>' +
        '<div id="s-err"></div><button class="btn block" style="margin-top:12px">Create Account</button>' +
        '<p class="small">Already have an account? <a href="#/login/' + role + '">Sign in</a></p></form>';
      T.after = function () {
        document.getElementById('su2').onsubmit = function (e) {
          e.preventDefault();
          var u = document.getElementById('s-u').value.trim(), p = document.getElementById('s-p').value, cf = document.getElementById('s-c').value, err = document.getElementById('s-err');
          var d = T.db(), msg = '';
          if (u.length < 3) msg = 'Username must be at least 3 characters.';
          else if (d.accounts.some(function (a) { return a.username.toLowerCase() === u.toLowerCase(); })) msg = 'That username is already taken.';
          else if (p.length < 8) msg = 'Password must be at least 8 characters.';
          else if (p !== cf) msg = 'Passwords do not match.';
          if (msg) { err.innerHTML = '<div class="err">' + msg + '</div>'; return; }
          d.accounts.push({ id: T.uid('u'), role: role, name: reg.name, email: reg.email, contact: reg.contact, username: u, password: p, barangay: admin ? null : +reg.barangay, status: 'Pending' });
          T.logActivity(reg.name, 'Accounts', 'Requested a new ' + (admin ? 'DILG admin' : 'barangay secretary') + ' account');
          T.save();
          T.pendingEmail = reg.email; reg = {};
          location.hash = '#/pending';
        };
      };
      return T.authShell(SIGN_LEFT[0], SIGN_LEFT[1], c2, signFoot(), '#/signup/' + role);
    }
    var c1 = '<form class="auth-card" id="su1"><div class="steps"><i class="on"></i><i></i> STEP 1 OF 2</div><h2>Create Account</h2><p class="sub">Tell us about yourself.</p>' +
      '<label class="lbl" for="s-n">Full name</label><input class="input" id="s-n" placeholder="Your full name" value="' + esc(reg.name || '') + '" required>' +
      '<label class="lbl" for="s-e">Email address</label><input class="input" id="s-e" type="email" placeholder="' + (admin ? 'dilgadmin@gmail.com' : 'barangaysecretary@gmail.com') + '" value="' + esc(reg.email || '') + '" required>' +
      '<label class="lbl" for="s-t">Contact number</label><input class="input" id="s-t" placeholder="09XX XXX XXXX" value="' + esc(reg.contact || '') + '" required>' +
      (admin ? '' : '<label class="lbl" for="s-b">Barangay</label><select class="input" id="s-b" required>' + T.barangayOptions(reg.barangay, true) + '</select>') +
      '<div id="s-err"></div><button class="btn block" style="margin-top:14px">Next →</button></form>';
    T.after = function () {
      document.getElementById('su1').onsubmit = function (e) {
        e.preventDefault();
        var name = document.getElementById('s-n').value.trim(), email = document.getElementById('s-e').value.trim(), tel = document.getElementById('s-t').value.trim();
        var b = admin ? null : document.getElementById('s-b').value, err = document.getElementById('s-err'), msg = '';
        if (name.length < 3) msg = 'Please enter your full name.';
        else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) msg = 'Please enter a valid email address.';
        else if (!/^(\+?63|0)9\d{9}$/.test(tel.replace(/[\s-]/g, ''))) msg = 'Enter a valid mobile number, like 09XX XXX XXXX.';
        else if (!admin && !b) msg = 'Please choose your barangay.';
        else if (T.db().accounts.some(function (a) { return a.email.toLowerCase() === email.toLowerCase(); })) msg = 'An account with this email already exists.';
        if (msg) { err.innerHTML = '<div class="err">' + msg + '</div>'; return; }
        reg = { name: name, email: email, contact: tel, barangay: b };
        location.hash = '#/signup/' + role + '/2';
      };
    };
    return T.authShell(SIGN_LEFT[0], SIGN_LEFT[1], c1, signFoot(), '#/signup');
  };

  A.pending = function () {
    var card = '<div class="pending-wrap"><div class="pending-card"><div class="dot"></div><h2>Your account is waiting for approval</h2>' +
      '<p>Thank you for signing up. DILG Admin will review your request. We will send an email to the address you gave once it is approved.</p>' +
      '<button class="btn block" data-go="#/login">Back to sign in</button></div></div>';
    return T.authShell('Almost there.', 'The DILG Municipal Office checks every new account to keep barangay records safe.', card, signFoot(), null);
  };
})(window.T);
