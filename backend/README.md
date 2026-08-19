# PropFlow — Backend API

Real Estate CRM & Property Management SaaS. Node.js / Express / MongoDB / Socket.IO.

## Stack

- Express 4, Mongoose 8
- JWT auth (access + refresh, httpOnly cookie) with bcrypt password hashing
- Multi-tenant (company-scoped) data isolation via middleware
- Socket.IO for real-time chat, typing indicators, presence, and notifications
- Cloudinary for image/document storage
- json2csv + pdfkit for report export
- AI property assistant (Anthropic-compatible, with a keyword-based fallback if no API key is set)

## 1. Prerequisites

- Node.js 18+
- A MongoDB connection string — easiest is a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster
- (Optional) A Cloudinary account for image uploads
- (Optional) An Anthropic (or other) API key for the AI assistant — works without one, just with simpler query parsing

## 2. Install

```bash
cd backend
npm install
```

## 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in at minimum:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/propflow?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<any long random string>
JWT_REFRESH_SECRET=<a different long random string>
```

Everything else (Cloudinary, SMTP, AI key) is optional for local development — the app degrades gracefully:
- No SMTP configured → verification/reset emails are logged to the console instead of sent.
- No AI key configured → the AI assistant falls back to a simple keyword parser (still queries real data).
- No Cloudinary configured → image upload endpoints will fail, but everything else works.

## 4. Seed the database

This wipes and repopulates the database with a full demo dataset: 1 company, 32+ agents, 110+ properties, 55+ customers, 210+ leads, developers, projects/buildings/units, appointments, deals, conversations, and notifications — all realistic Indian data (no Lorem ipsum).

```bash
npm run seed
```

### Demo accounts (created by the seed script)

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@propflow.app | SuperAdmin@123 |
| Company Admin | admin@horizonrealty.in | Admin@123 |
| Agent | agent@horizonrealty.in | Agent@123 |
| Customer | customer@example.com | Customer@123 |

## 5. Run

```bash
npm run dev     # nodemon, auto-restart
# or
npm start       # production
```

The API starts on `http://localhost:5000` by default. Health check: `GET /api/health`.

## API overview

All responses follow `{ success, message, data?, meta? }`. Errors follow `{ success: false, message, details? }`.

| Base path | Covers |
|---|---|
| `/api/auth` | register, login, logout, refresh, forgot/reset password, email verification, profile |
| `/api/companies` | tenant workspace settings, staff list, super-admin company management |
| `/api/properties` | search/filter/browse, CRUD, publish workflow, images, favorites, compare, map |
| `/api/leads` | CRM leads, kanban pipeline, notes, activity history |
| `/api/appointments` | visit scheduling and status workflow |
| `/api/deals` | deal pipeline, commission, closing |
| `/api/agents` | agent directory, profile, performance |
| `/api/developers` | developer profiles |
| `/api/projects` | projects, buildings, units |
| `/api/units` | unit status updates |
| `/api/analytics` | CRM dashboard, company analytics, platform analytics (super admin) |
| `/api/messages` | conversation list + history (real-time send is via Socket.IO) |
| `/api/notifications` | notification center |
| `/api/documents` | document upload/list/delete |
| `/api/reports` | CSV/PDF export (properties, leads, agents, sales, revenue, appointments) |
| `/api/investment` | EMI, rental yield, appreciation, ROI calculators |
| `/api/ai` | natural-language property search |

## Socket.IO events

Connect with `io(url, { auth: { token: accessToken } })`.

- `conversation:join` / `conversation:leave`
- `message:send` (ack-based) → broadcasts `message:new`
- `typing:start` / `typing:stop`
- `message:read`
- `notification:new` (server → client, pushed by the notification service)
- `presence:online` / `presence:offline`

## Multi-tenancy

Every staff-created resource (properties, leads, deals, etc.) carries a `company` field. The `enforceTenant` middleware derives `req.tenantId` from the authenticated user's JWT and every controller filters by it — company A can never query company B's data. `SUPER_ADMIN` bypasses tenant scoping for platform-level views; `CUSTOMER` accounts are not bound to a single tenant since they browse across companies.

## Deployment

- **Backend**: Render or Railway — set the same env vars from `.env.example` in the dashboard, build command `npm install`, start command `npm start`.
- **Database**: MongoDB Atlas.
- **Storage**: Cloudinary.

No secrets are ever sent to the frontend — the JWT secrets, DB credentials, Cloudinary secret, and AI API key only ever live server-side.
