# Kai Green Fitness

Premium mobile-first dashboard a gym owner uses on their phone to manage members.

Built with React + Vite. Runs entirely in the browser — members, payments,
plans, and photos all persist in `localStorage`. Zero infra needed; just
build and deploy the static `dist/` folder.

---

## Features

- **Login** (mock auth — any email/password works in the demo)
- **Dashboard** — Total / Active / Expiring / Expired stat cards + Monthly Revenue
- **Members list** — searchable, filterable by status, with photo avatars
- **Add / Edit member** with optional profile photo (client-side compressed)
- **Renew for Next Month** — confirmation modal asks plan + Cash/GPay
  payment method, shows new expiry, and prints the amount on the confirm
  button
- **5-second Undo** for every state-changing action (renew, delete) with a
  progress-bar snackbar
- **Custom membership plans** — owner can add their own plans
  (name + duration + price) from the Account page
- **Finance page** — tap the orange revenue card to drill into month-by-month
  payments split by Cash / GPay
- **IST timezone** for all date math (status thresholds, end dates) regardless
  of device timezone
- **All state persisted in `localStorage`** so demo changes survive refresh

---

## Run locally

```bash
npm install
npm run dev
```

Opens at <http://localhost:3000>. Sign in with anything (or tap the
"demo credentials" hint).

## Production build

```bash
npm run build      # outputs dist/
npm run preview    # serves the built site for a smoke test
```

## Deploy to Netlify

`netlify.toml` is already configured.

**Drag-and-drop:** drop the `dist/` folder onto <https://app.netlify.com/drop>.

**Git-based:** connect this repo in Netlify; it auto-detects the build and
SPA-routing rules.

---

## Stack

| Layer | Choice |
|---|---|
| UI | React 18 |
| Build | Vite 5 |
| Routing | React Router DOM 6 |
| Icons | lucide-react |
| Font | Plus Jakarta Sans |
| State | React Context + `localStorage` |

---

## Project layout

```
kgfGYM/
├── src/
│   ├── pages/        Login · Dashboard · MembersList · MemberDetail
│   │                 MemberForm · Account · Finance
│   ├── components/   Avatar · BottomNav · ConfirmDialog · RenewalModal
│   │                 PlanCreateModal · UndoSnackbar · Toast · icons
│   ├── context/      AuthContext · MembersContext
│   ├── data/         mockMembers.js (seed members + payments)
│   ├── utils/        memberUtils.js · imageUtils.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css     Single global stylesheet (theme tokens + components)
├── netlify.toml      Build + SPA redirect config
├── index.html
├── package.json
└── vite.config.js
```

---

## License

Private — internal demo for Kai Green Fitness.
