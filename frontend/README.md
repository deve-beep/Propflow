# PropFlow — Frontend

React + Vite + Tailwind CSS. Premium real-estate SaaS interface — charcoal/terracotta/sand palette, editorial typography, no generic AI-dashboard styling.

## Stack

- React 19, Vite, Tailwind CSS 3
- React Router 7
- Framer Motion (page/section animations)
- React Three Fiber + drei (landing page 3D hero, lazy-loaded)
- React Leaflet (property map)
- Recharts (analytics charts)
- Socket.IO client (real-time chat, presence, notifications)
- Axios with automatic access-token refresh

## 1. Install

```bash
cd frontend
npm install
```

## 2. Configure

```bash
cp .env.example .env
```

By default this points at `http://localhost:5000/api` — set `VITE_API_URL` to your deployed backend URL for production.

## 3. Run

```bash
npm run dev
```

Opens on `http://localhost:5173`. Make sure the backend is running and seeded first — see `../backend/README.md`.

## 4. Build

```bash
npm run build
npm run preview   # serve the production build locally to sanity-check it
```

## Structure

```
src/
  components/    reusable UI (property cards, filters, layout chrome, primitives)
  pages/         route-level views, grouped by audience (public, auth, agent, customer, admin, developer)
  layouts/       PublicLayout (navbar+footer) and DashboardLayout (sidebar, role-aware nav)
  context/       AuthContext (session), SocketContext (real-time)
  services/      axios client + one service module per backend resource
  utils/         formatting helpers (currency, area, dates)
```

## Routing & roles

| Area | Path prefix | Roles |
|---|---|---|
| Public site | `/`, `/properties`, `/map`, `/agents`, `/compare` | anyone |
| Auth | `/login`, `/register`, `/register-company` | anyone |
| CRM | `/crm/*` | AGENT, BROKER, PROPERTY_MANAGER, COMPANY_ADMIN |
| Agency admin | `/agency/*` | COMPANY_ADMIN |
| Customer account | `/account/*` | CUSTOMER |
| Platform admin | `/admin` | SUPER_ADMIN |
| Developer | `/developer` | DEVELOPER |

All dashboard routes are lazy-loaded and code-split per page, so the initial bundle only ships what a first-time visitor to the public site actually needs.

## Real-time

`SocketContext` connects automatically once a user is authenticated, using the same JWT as REST calls. It powers:
- Live chat (`MessagesPage`) — send/receive, read receipts
- Presence (online/offline dots next to conversation partners)
- Push notifications into the notification center without a page refresh

## Deployment

**Vercel** (recommended): connect the repo, set the root directory to `frontend`, set `VITE_API_URL` as an environment variable pointing at your deployed backend, and deploy — `vercel.json` already handles SPA routing rewrites.

```bash
npm run build   # outputs to dist/
```

Any static host works equally well (Netlify, Cloudflare Pages) as long as it rewrites all paths to `index.html`.
