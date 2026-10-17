# Delivery App - Frontend (v0.1)

Two React web apps that talk to the Delivery API in `../BE`.

| App | Port | Who it's for |
|---|---|---|
| `apps/customer-web` | 5173 | Customers: register, log in, browse a branch's products |
| `apps/admin-web` | 5174 | Admins: review and approve merchant applications |

React + Vite + TypeScript + Tailwind, as an npm workspace. `packages/shared-types` holds the TypeScript types
that mirror the API (auth responses, `Page<T>`, `Merchant`, `Product`, error body).

## Run it

Start the backend first (see `../BE/README.md`), then:

```bash
npm install
copy apps\customer-web\.env.example apps\customer-web\.env      # macOS/Linux: cp
copy apps\admin-web\.env.example apps\admin-web\.env
npm run dev:customer-web     # http://localhost:5173
npm run dev:admin-web        # http://localhost:5174  (second terminal)
```

Both `.env` files contain `VITE_API_URL="http://localhost:3000/api"`. The URL **includes `/api`**.
The backend's `ALLOWED_ORIGINS` must list both web origins (its default does).

## Signing in to admin-web

Admin accounts can't be created through the API. In `BE/.env` set `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` (10+ characters), run `npx prisma db seed` in `BE`, then sign in with those.
Re-running the seed with an email that already exists promotes that account to `ADMIN`.

## Try the whole flow

1. customer-web: register a customer and sign in.
2. Postman (`BE/postman`): register a **merchant owner**, `Apply as merchant`, `Create branch`, `Create product`.
   Copy the branch ID from the response.
3. admin-web: sign in as the admin and approve the merchant (this also approves its branches).
4. customer-web > Browse: paste the branch ID to see the product.

Products only appear for **approved** branches, so step 3 matters.

## How the apps use the API

- `src/lib/api.ts` is the one axios client. It sends the access token on every request. On a 401 it
  exchanges the refresh token for a new pair and retries once. Refresh tokens rotate, so concurrent
  failures share a single refresh call, and the new refresh token replaces the old one. If the refresh
  fails, the session is cleared and you land on `/login`.
- `getErrorMessage()` turns API errors into one readable line (validation `issues`, `message`, or a
  "can't reach the server" hint).
- `src/lib/session.ts` keeps tokens in `localStorage` under an app-specific prefix, so the two apps never
  share a session. Logging out also revokes the refresh token on the server.
- Lists use the `{ items, page, pageSize, total }` envelope with a shared `Pagination` component.
- Prices arrive as 2-decimal strings (`"150.00"`); `formatPeso()` formats them for display.

## Known limits

- Customers must paste a branch ID: the API has no merchant/branch directory yet.
- Tokens live in `localStorage`, which is fine for local development; move to httpOnly cookies before
  production.
- The admin app can approve merchants but not reject or suspend them yet (no endpoint).
- Mobile apps (`customer-mobile`, `rider-mobile`) are not scaffolded yet.
