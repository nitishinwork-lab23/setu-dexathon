<div align="center">

# सेतु Setu

### Societal Innovation Collaboration Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green?logo=node.js)](https://nodejs.org/)
[![No Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen)](#)
[![SIH 2026](https://img.shields.io/badge/SIH-2026-orange)](#)

**Problem → Innovation → Impact**

A role-based web platform for the SIH 2026 problem statement (Industry Partnership / Societal Innovation Collaboration Portal — Govt. of Jharkhand). It implements the full front-end journey from citizen report → government review → Innovation Necessity Gate → university matching → student teams → industry marketplace → admin oversight.

[Getting Started](#-getting-started) · [Features](#-features-by-role) · [Architecture](#-architecture) · [Contributing](CONTRIBUTING.md)

</div>

---

## 📋 Table of Contents

- [Getting Started](#-getting-started)
- [Features by Role](#-features-by-role)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Role Themes](#-role-themes)
- [Language Support](#-language-support-en--हि--खो--বাং)
- [Backend & API](#-backend--api)
- [Testing](#-testing)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (for the built-in `fetch` used by `test-server.js`)

### Installation & Running

```bash
# Clone the repository
git clone https://github.com/mustann/setu-platform.git
cd setu-platform

# Start the server (that's it — zero dependencies)
node server.js
```

Open **http://localhost:3000** in your browser.

> **No build step. No framework. No `npm install`.**
> The server is ~90 lines of Node.js using only the standard library.

### Quick Demo

Use the **1-Click Demo Login** buttons on the login screen to instantly explore any role — no credentials needed.

### Alternative: Static Mode

If you'd rather use **Live Server** or `npx serve .` with no backend, that still works — the app detects there's no API and falls back to `localStorage` automatically.

---

## ✨ Features by Role

### 🧑 Citizen
- Google-Classroom-style dashboard of your reports
- Report form with camera capture, voice-note recording, and GPS location
- Support (👍) button on other citizens' reports
- Status timeline: Received → Verified → Assigned → In Development → Pilot → Resolved
- Profile page

### 🏛️ Government / Reviewer
- High / Medium / Low priority board (AI-suggested, reviewer can override)
- Due dates and due-soon alerts
- **Innovation Necessity Gate** — route to routine workflow vs. university pipeline, with AI root-cause analysis
- Cluster view for grouping related reports
- Impact dashboard with KPIs

### 🎓 University
- Challenge marketplace with AI match scores and required capabilities
- Claim / opt-in workflow
- Project workspace with Plan → Prototype → Pilot → Deployed stepper
- Team management
- Editable capability profile

### 🧑‍🎓 Student
- Browse available challenges with skill match indicators
- Skill gaps shown as recommended-learning chips (non-blocking)
- Join teams, track projects
- Skill profile management

### 🤝 Industry Partner
- Maturity-tagged project marketplace (Concept / Prototype / Pilot-Ready)
- Express interest workflow
- Commitments view

### 👑 Admin
- Platform-wide KPIs
- User management (suspend / reactivate)
- Reports & challenges audit table
- Reset demo data button

---

## 🆕 Accountability, phone voting & low-data features

### Accountability board (Citizen: read-only · Government: can reply)
- Every open problem shows its **named authority** and **how many days late** it is, grouped per authority with totals, averages, longest delay and a "replied to late problems" bar.
- Under each late problem the authority can **reply publicly**: *on sick leave · out of station / emergency · not in this position · someone else holds temporary charge (name + designation) · other*, plus a written explanation.
- A reply **never removes or pauses the delay count** and is labelled self-declared. If someone else is named in temporary charge, they appear as the person now responsible ("acting for …") everywhere the responsible person is shown.

### Phone participation (no smartphone, data or literacy needed)
- **Every problem has its own toll-free number** (`voteNumberPrefix` in Settings + 4-digit code, e.g. `1800-22-0104`). Calling it counts as **one vote per phone per problem**; the same phone can vote for other problems.
- **General 24/7 complaint line**: the transcript of the call is matched to open problems. A close match **joins that problem's cluster** (and counts as a vote); otherwise a **new problem** is opened and flagged for an operator.
- Citizen view **Vote & Call** shows the reality-show style vote board and a call simulator; Government view **Helpline Calls** shows every call and its outcome.
- Phone numbers are stored **masked + hashed** only. Use a salted HMAC in production (see `js/ivr-core.js`).
- **Real calls**: point your telephony provider (Exotel / Knowlarity / Twilio …) at the webhooks, with `IVR_SECRET` set:
  `POST /api/ivr/vote {to|code, from}` and `POST /api/ivr/complaint {from, transcript, lang}` (JSON or form-encoded; secret via `x-ivr-secret` header or `?secret=`).
  The provider supplies the numbers, call handling and speech-to-text; the demo numbers here are placeholders.

### Low-bandwidth
- Photos are shrunk in the browser before saving/uploading (≈110 KB budget, ≈40 KB in Low-data mode); the camera asks for a smaller video size.
- **Speak instead of typing** (speech-to-text) and **Listen** (text-to-speech) use the device's own engines — no audio is uploaded. In Low-data mode a voice note with a transcript is sent as text only.

Tests: `node test-ivr.js` (phone logic) and `node test-server.js` (server + webhooks).

## 🏗 Architecture

```
┌─────────────┐         ┌─────────────────┐
│   Browser   │◄───────►│   server.js     │
│  (Vanilla   │  HTTP   │  (Node stdlib)  │
│   HTML/JS)  │         │                 │
└─────────────┘         │  GET /api/state │
                        │  PUT /api/state │
                        │  Static files   │
                        └────────┬────────┘
                                 │
                           ┌─────▼─────┐
                           │ data.json  │
                           │ (file DB)  │
                           └───────────┘
```

- **Single JSON blob** state — last-write-wins (suitable for demo / LAN use)
- `DB.init()` pulls state from `GET /api/state` at boot
- `DB.save()` PUTs the updated snapshot back, debounced by 150ms
- Session (logged-in user) stays in `localStorage` — intentionally per-browser
- State file is written atomically (write-then-rename) to prevent corruption

---

## 📁 Project Structure

```
setu-platform/
├── server.js                 # Backend: static files + GET/PUT /api/state
├── test-server.js            # Server smoke test
├── index.html                # App shell: login screen + dashboard skeleton
├── css/
│   └── styles.css            # Design tokens, per-role themes, all components
├── js/
│   ├── data.js               # Data layer (DB.*) — loads/saves state via server
│   ├── icons.js              # Shared inline SVG icon set
│   ├── i18n.js               # Multilingual support (EN / HI / KH / BN)
│   ├── app.js                # Auth flow, router, sidebar, modal, toast
│   ├── render-citizen.js     # Citizen dashboard & report form
│   ├── render-government.js  # Government priority board & Innovation Gate
│   ├── render-university.js  # University challenge marketplace & workspace
│   ├── render-student.js     # Student challenges & skill profile
│   ├── render-industry.js    # Industry partner marketplace
│   └── render-admin.js       # Admin oversight & settings
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## 🎨 Role Themes

Each role gets its own accent color on a shared white / light-gray canvas:

| Role | Accent | CSS Class | Feel |
|---|---|---|---|
| Citizen | Blue `#2563eb` | `theme-citizen` | Approachable, civic |
| Government | Purple `#7c3aed` | `theme-government` | Authoritative, decisive |
| University | Orange `#ea580c` | `theme-university` | Energetic, academic |
| Student | Green `#16a34a` | `theme-student` | Growth, learning |
| Industry | Amber `#b8860b` | `theme-industry` | Value, partnership |
| Admin | Charcoal `#1f2430` | `theme-admin` | Control, oversight |

Change these in `css/styles.css` under `body.theme-*` — every card, button, tag, and progress bar reads from the same CSS variables (`--accent`, `--accent-ink`, `--accent-soft`), so editing one theme block re-themes the whole role.

---

## 🌐 Language Support (EN / हि / खो / বাং)

The language toggle in the top bar translates the entire app:

| Layer | How it works |
|---|---|
| **Core UI** | Instant offline translation from a hand-checked dictionary in `js/i18n.js` |
| **Free text** | Live translation via [MyMemory API](https://mymemory.translated.net/doc/spec.php) (free, no API key) |
| **Caching** | Every translated string is cached in `localStorage` — translated only once |
| **DOM scan** | `MutationObserver`-backed scan covers all visible text, placeholders, and ARIA labels |
| **English restore** | Switching back to English is instant (original text is memoized per element) |

> **Khortha note:** No public MT engine currently supports Khortha. The dictionary includes genuine Khortha wording for terms we're confident about; everything else falls back to Hindi MT as the closest available option.

---

## ⚙️ Backend & API

| Endpoint | Method | Description |
|---|---|---|
| `/api/state` | `GET` | Returns the full app state as JSON. `204` if no state exists yet. |
| `/api/state` | `PUT` | Replaces the app state. Body must be valid JSON. Max 25 MB. |
| `/*` | `GET` | Serves static files from the project root. |

**Security:**
- Path traversal is blocked (resolved paths must stay within the project root)
- `data.json` is never served as a static file
- Atomic writes via temp file + rename

---

## 🧪 Testing

```bash
# Start the server first
node server.js &

# Run the smoke test
node test-server.js
```

The test verifies:
- Empty state returns `204`
- State round-trips correctly via `PUT` + `GET`
- Invalid JSON is rejected (`400`)
- Bad PUTs don't clobber existing state
- `index.html` is served at `/`
- Path traversal is blocked (`403`)
- `data.json` is not served directly (`403`)

---

## 🗺 Roadmap

Upcoming features to be integrated (see [`js/dev_report.md`](js/dev_report.md) for the full audit):

- [ ] Public landing page with 8-stage workflow diagram
- [ ] Prior-art / solution intelligence search
- [ ] Collaboration charter modal
- [ ] Team formation with skill-gap analysis
- [ ] Complete project workspace (milestone funding, evidence upload, mentor actions)
- [ ] Industry / CSR marketplace
- [ ] Deployment route selection (Govt / Industry / CSR)
- [ ] Local pilot tracking
- [ ] Impact verification pipeline
- [ ] Failure / improvement loop
- [ ] Ecosystem intelligence graph
- [ ] Notification drawer with role-specific events

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built for Smart India Hackathon 2026 — Govt. of Jharkhand**

</div>

### Problem cards & Setu Assistant (add-ons)
- Problem cards now also show **Gate**, **people affected**, **supports**, **cluster size** and an **Inspect** detail view (location/GPS, reporter, 4-phase timeline, who is responsible). Citizen dashboard card images are unchanged.
- **Setu Assistant**: floating chatbot for all roles with suggestion chips, voice input and Listen; answers from a built-in knowledge base plus live data, works offline. Swap `Assistant.answer()` in `js/assistant.js` to connect a real LLM.

### Added from setu-platform-main_5
- Public Transparency Portal (no login), Solution Library, Department Directory and AI Routing, guided demo tour bar, persona switcher, NEP 2020 credits for students, grouped sidebar navigation for all roles, and demo-helpline wording. The chatbot remains the Setu Assistant (`js/assistant.js`).
