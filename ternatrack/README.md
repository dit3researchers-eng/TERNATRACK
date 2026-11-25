# TERNATRACK

Front-end for the **DILG Municipal Office – Ternate, Cavite** barangay public information portal and report-tracking system. Built with plain HTML, CSS and JavaScript, with a **Jython** static server to run it.

## Run it

**With Jython (2.7+, Java 8+)**

```bash
jython server/server.py          # http://localhost:8080
jython server/server.py 9000     # another port
```

**No server needed:** you can also just open `index.html` in a browser, or host the folder on GitHub Pages.

## Demo accounts

| Role | Email or username | Password |
|---|---|---|
| DILG Admin | `dilgadmin@gmail.com` or `dilg` | `dilg1234` |
| Barangay Secretary (Barangay 1) | `barangaysecretary@gmail.com` or `secretary` | `secretary123` |
| Other secretaries | `secretary2` … `secretary10` | `secretary2123` … |

Barangays 4 and 7 are *Pending*, Barangay 5 is *Inactive* (see Accounts). New sign-ups are *Pending* until the DILG Admin approves them.
To start over, clear the site's local storage (or run `T.reset()` in the browser console).

## What is included

**Public portal** (`#/public/...`): Announcements (barangay picker), Transparency Corner (Full Disclosure Policy portal), Service Forms (Katarungang Pambarangay, Kasambahay, VAW, CSO/NGO), Official Documents (ordinances, Citizen's Charter), Community Information (hazard maps, evacuation, Sangguniang Barangay, Sangguniang Kabataan), Feedback, Search, and the *Ask Questions* chatbot.

**Auth:** role chooser, DILG Admin and Barangay Secretary sign-in, 2-step sign-up, "waiting for approval" screen, forgot-password dialog.

**DILG Admin:** Overview · Barangays (Compliance status with colour codes and scores, reminders; Compare with rankings, map, needs-improvement) · Reports (All reports, To review with scoring and send back/approve, Report helper, Report schedule) · Improvement (action plans, best practices) · Public Content (six editors plus Resident feedback) · Accounts · Activity and Alerts · Settings (My account, Scoring and risk).

**Barangay Secretary:** Overview (due / waiting / returned / approved, periodic reports, messages from DILG) · Submit Report (with DILG draft templates and missing-info check) · My Reports · Improvement · Public Page · Resident Feedback · Settings.

### Scoring
Green = on time, complete · Yellow = incomplete · Blue = late · Red = no submission · Gray = not applicable. Points and risk levels are editable in *Settings → Scoring and risk* (defaults: 3 / 1 / −1 / 0; High risk below 12, Watch 12–20, On track 21+). The design file shows Blue as "1 pt" on the review screen and "−1" in Settings; the Settings value is used everywhere.

## Notes
- This is a front-end prototype. Data and sessions are stored in the browser (`localStorage`); there is no database or real email sending. Passwords are stored in plain text for demo purposes only, so do not reuse real passwords.
- Uploaded files keep their names only. Downloads produce simple text files.
- Replace seed data in `js/store.js` with API calls when a backend is ready.

## Structure

```
index.html
css/styles.css
js/store.js      data, seed data, derived values
js/ui.js         icons, modal, toast, page shells
js/public.js     public portal + chatbot
js/auth.js       sign in / sign up / pending
js/admin.js      DILG Admin pages
js/secretary.js  Barangay Secretary pages
js/app.js        router
server/server.py Jython static server
```
