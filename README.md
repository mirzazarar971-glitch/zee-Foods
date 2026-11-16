# Zee Foods — Full-Stack Restaurant Platform with AI Chatbot

A production-style MERN restaurant website for **Zee Foods** (Lahore) with a premium storefront, cart and checkout, secure order tracking, customer accounts, and a complete admin dashboard. The AI support assistant, **Zara**, answers from the live database and falls back to a keyword FAQ engine when no LLM key is configured.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, React Router 6, Tailwind CSS 3, Framer Motion, Recharts, Lucide |
| Backend | Node.js (LTS), Express 4, Mongoose 8, JWT, bcryptjs, Zod, Multer, Helmet |
| Database | MongoDB — Atlas, local MongoDB, or the bundled persistent embedded MongoDB |
| Auth | JWT bearer tokens, role-based access (`customer` / `admin`), bcrypt password hashing |
| AI | OpenAI-compatible Chat Completions via the backend + deterministic FAQ fallback |

---

## Windows 10/11 x64 — quick start

### 1. Verify prerequisites

Open **PowerShell** or **Command Prompt**:

```powershell
node -v
npm -v
```

Use Node.js **20 LTS or newer** (Node 24 works). If missing, install from <https://nodejs.org> and reopen the terminal.

### 2. Install dependencies

From the project root (`zee-foods`):

```powershell
npm install
npm run install:all
```

`npm install` installs the root tooling (`concurrently`, `sharp`). `install:all` installs the API and client workspaces.

### 3. Create environment files

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

Generate a strong JWT secret and paste it into `server/.env` as `JWT_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. MongoDB

You have three options — no code changes required.

**A. Embedded MongoDB (default, zero setup)**
Leave `MONGO_URI=` empty. On first start the API launches a persistent embedded MongoDB under `server/.data/mongo` (powered by `mongodb-memory-server`). Data survives restarts. The first launch needs internet access to download the MongoDB binary.

**B. MongoDB Atlas**
Create a free cluster at <https://www.mongodb.com/atlas>, add your IP, create a database user, then set:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/zeefoods?retryWrites=true&w=majority
```

**C. Local MongoDB Community Server**
Start `mongod`, then set:

```env
MONGO_URI=mongodb://127.0.0.1:27017/zeefoods
```

If an external URI is unreachable, the API logs a warning and automatically falls back to the embedded database instead of crashing.

### 5. Seed the demo menu

Auto-seeding runs on boot when `SEED_ON_EMPTY=true` (the default) and the database is empty. You can also force a full demo seed:

```powershell
npm run seed
```

This loads 10 categories, 42 menu items, 4 coupons, 22 sample orders, 146 reviews, 8 FAQs, restaurant settings, and demo accounts.

> `npm run seed` rewrites demo data. Stop the API first before a manual re-seed.

### 6. Run the app

```powershell
npm run dev
```

| Service | URL |
|---|---|
| Storefront | <http://localhost:5173> |
| API | <http://localhost:5000/api/health> |
| Admin dashboard | <http://localhost:5173/admin> |

Vite proxies `/api` and `/uploads` to `http://localhost:5000`, so no CORS setup is needed in development.

To run the services separately:

```powershell
npm run server
npm run client
```

### 7. Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@zeefoods.pk` | `Admin@123` |
| Customer | `ali@example.com` | `Customer@123` |

Other seeded customers use the same `Customer@123` password. Change these before any real deployment.

---

## Production build

```powershell
npm run build
npm run start
```

`npm run build` outputs the optimized SPA to `client/dist`. `npm run start` runs the API in production mode. Host `client/dist` on any static host, or preview locally with:

```powershell
npm run preview --prefix client
```

For a separate API origin, set `VITE_API_URL=https://your-api.example.com/api` in `client/.env` before building, and add the storefront origin to `CLIENT_URL` in `server/.env` (`CLIENT_URL` accepts a comma-separated list).

**Production requirements**

- `NODE_ENV=production`
- A real, long `JWT_SECRET` (the API refuses to start without one in production)
- A reachable MongoDB URI (Atlas/local recommended)
- HTTPS termination and secure hosting for the uploaded `server/uploads` directory

---

## Features

### Storefront
- Animated hero with the exact headline **“Cravings? We've Got You Covered!”**, offers, testimonials, why-choose-us, hours, newsletter.
- Menu with categories, debounced search, price/rating sorting, pagination, featured and popular badges.
- Product pages with sizes/variants, toppings/add-ons, quantity, special instructions, reviews and related items.
- Persistent cart with coupon validation, delivery-fee progress, live totals from the server.
- Checkout for delivery or takeaway, cash on delivery, and an optional online-payment method controlled from admin settings.
- Order confirmation with a unique `ZF-XXXXXX` number and a secure tracking page (order number + phone must match).
- Accounts: register/login, profile, change password, saved addresses, order history, cancellation.
- Floating AI chat on every customer page with typing indicator, quick prompts, session history and WhatsApp human support.

### Admin dashboard (`/admin`, admin-only)
- Overview KPIs and Recharts revenue charts (daily, weekly, monthly), status breakdown, popular products, recent orders.
- Orders: status tabs, search, date filtering, detail view, kitchen status transitions, payment status, internal notes, printable receipts.
- Products: CRUD, multipart image upload, categories, pricing, variants, add-ons, ingredients, search tags, availability / featured / popular toggles.
- Categories, customers (with lifetime spend and order history), coupons (percentage/fixed, limits, expiry, enable/disable).
- Chatbot: provider status, conversation logs, transcripts, conversation deletion, FAQ knowledge base CRUD, welcome message and logging controls.
- Restaurant settings: identity, contact, delivery fees, thresholds, ETA, online payment flag, announcement bar, opening hours, social links.

### AI assistant
- Backend-only LLM integration: `OPENAI_API_KEY` is read from `server/.env` and never sent to the browser.
- Product prices, discounts, hours and order statuses are loaded from MongoDB for each reply — the assistant is instructed not to invent them.
- Roman Urdu and English are supported.
- With no key, Zara uses database-backed FAQs and keyword matching, so the widget remains fully functional.
- Chat endpoint is rate-limited and validated; the admin can disable logging for privacy.

---

## Environment variables

### `server/.env`
| Variable | Purpose |
|---|---|
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | `development` / `production` |
| `CLIENT_URL` | Allowed CORS origin(s), comma separated |
| `MONGO_URI` | MongoDB URI (`MONGODB_URI` also accepted); leave empty for embedded MongoDB |
| `JWT_SECRET` | Long random secret used to sign tokens |
| `SEED_ON_EMPTY` | `false` disables automatic demo seeding |
| `OPENAI_API_KEY` | Optional; enables LLM replies |
| `AI_BASE_URL` | OpenAI-compatible base URL (default `https://api.openai.com/v1`) |
| `AI_MODEL` | Model name (default `gpt-4o-mini`) |

### `client/.env`
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Optional API origin; defaults to `/api` through the Vite proxy |

Never commit `.env` files. Only the `.env.example` templates belong in version control.

---

## API overview

All endpoints are prefixed with `/api`.

| Route | Highlights |
|---|---|
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | JWT auth, bcrypt hashing |
| `GET /users/me`, `PUT /users/me`, `PUT /users/me/password` | Profile and password |
| `GET/POST/PUT/DELETE /users/me/addresses` | Saved addresses |
| `GET /products`, `GET /products/:slug` | Search, filters, sorting, pagination, related items |
| `GET /categories` | Active categories with product counts |
| `POST /orders`, `GET /orders/track`, `GET /orders/mine` | Server-priced orders, secure tracking, history |
| `PATCH /orders/mine/:id/cancel` | Customer cancellation (pending/confirmed only) |
| `POST /coupons/validate` | Coupon evaluation (always HTTP 200 with `valid`) |
| `GET /reviews/product/:id`, `POST /reviews` | Product reviews |
| `POST /chatbot/message` | Rate-limited AI/FAQ reply |
| `GET /settings/public` | Safe public restaurant settings |
| `GET /admin/stats` | Dashboard analytics |
| `GET/PATCH /admin/orders...` | Order management and status updates |
| `GET/POST/PUT/DELETE /admin/products...` | Product CRUD with image upload |
| `GET/POST/PUT/DELETE /admin/categories...`, `/admin/coupons...` | Catalog and promotions |
| `GET /admin/customers...` | Customer profiles and order history |
| `GET/DELETE /admin/chatbot/conversations...`, `POST/PUT/DELETE /admin/faqs...` | Chatbot operations |
| `GET/PUT /admin/settings` | Restaurant configuration |

Prices, discounts, delivery fees and coupon validity are recalculated on the server when an order is placed. The client never dictates final amounts.

---

## Project structure

```
zee-foods/
├─ package.json                 # Root scripts (install:all, dev, seed, build)
├─ client/
│  ├─ public/images/            # Optimized menu and hero imagery
│  ├─ src/
│  │  ├─ components/            # layout, home, menu, cart, admin, ui, chatbot
│  │  ├─ context/               # Auth, Settings, Cart providers
│  │  ├─ hooks/                 # useFetch, usePageTitle
│  │  ├─ lib/                   # axios client, formatting, order helpers
│  │  ├─ pages/                 # customer pages + pages/admin/*
│  │  ├─ App.jsx, main.jsx
│  │  └─ index.css
│  ├─ tailwind.config.js
│  └─ .env.example
├─ server/
│  ├─ config/db.js              # External MongoDB with embedded fallback
│  ├─ controllers/              # auth, products, orders, admin, chatbot...
│  ├─ middleware/               # auth, validation, errors
│  ├─ models/                   # User, Product, Category, Order, Coupon, ...
│  ├─ routes/
│  ├─ services/                 # pricing, chatbot provider
│  ├─ utils/                    # schemas, seed data, helpers
│  ├─ uploads/                  # Uploaded product images
│  ├─ .data/mongo/              # Persistent embedded DB (gitignored)
│  └─ .env.example
└─ tools/                       # Local smoke-test helpers
```

---

## Security notes

- Passwords are hashed with bcrypt; hashes are never serialized to clients.
- JWT tokens are signed server-side; admin routes require `role: "admin"`.
- The AI key exists only in server environment variables. The admin UI displays provider status, never the key.
- Helmet, strict CORS allow-listing, Zod request validation, Mongo sanitization and rate limiting are enabled.
- Order tracking requires the matching order number **and** phone number.
- Uploads are restricted to JPG/PNG/WebP with size limits and randomized file names.
- Coupon and order totals are computed server-side.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `MONGO_URI` connection warning | Check Atlas IP allow-list/user password, start local `mongod`, or leave the URI empty to use the embedded database |
| Port 5000 or 5173 already in use | Close the conflicting process or change `PORT` / Vite `server.port` |
| Embedded DB fails on first boot | Ensure internet access for the MongoDB binary download; retry |
| Login says “Too many login attempts” | Only login/register are rate-limited (30 per 15 min). Wait for the window to reset |
| Images missing after deploy | Copy `client/dist` and ensure `/uploads` is served from the API host / reachable static location |
| Reset demo data | Stop the API, delete `server/.data/mongo` (embedded DB) or drop the database, then `npm run seed` |
| Fonts look default | The app loads Sora and Plus Jakarta Sans from Google Fonts; check network access |

---

## Verification checklist

1. Browse the home page and menu; filter by category, search, and sort.
2. Open a product, choose a size/add-on, add it to the cart.
3. Apply `ZEE10`, checkout as delivery, confirm the order and track it with the order number + phone.
4. Sign in as the customer and review order history and saved addresses.
5. Sign in as the admin, update the order status, and confirm tracking reflects the change.
6. Create/edit a product, category and coupon; upload a product image.
7. Open the chatbot, ask about delivery or prices, and review the conversation in Admin → Chatbot.
8. Print an order receipt from Admin → Order detail.

---

Built for Zee Foods, Lahore — fresh food, fast delivery, zero-compromise code.
