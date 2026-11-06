# Delivery App - Frontend (v0.1)

Two React web apps that talk to the Delivery API in `../BE`.

| App | Port | Who it's for |
|---|---|---|
| `apps/customer-web` | 5173 | Customers: register, log in, browse a branch, fill a cart, check out (cash on delivery), follow and cancel orders |
| `apps/admin-web` | 5174 | Admins: approve merchants, work the order queue (accept, prepare, mark ready, reject, cancel) |

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

1. Postman (`BE/postman`): register a **merchant owner**, `Apply as merchant`, `Create branch`, `Create product`.
2. admin-web: sign in as the admin and approve the merchant (this also approves its branches).
3. customer-web: register a customer, open **Browse**, pick the place and add products to the cart.
4. **Cart** > **Checkout**: add a delivery address (type the latitude/longitude or use your current location),
   check the total, and place the order.
5. admin-web > **Orders**: accept it, start preparing, mark it ready.
6. customer-web > **Orders**: the order page shows the new status within 15 seconds.

A place only shows up in Browse once its merchant is approved **and** it has at least one active product, so
step 2 matters. Keep the delivery address within 15 km of the branch.

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
- Browse (`/browse`) is a searchable grid from `GET /branches`; each place opens its menu at `/browse/:branchId`.
  The search waits 300 ms after typing stops before asking the server.
- The cart lives on the server (`CartContext` mirrors it), so it follows the customer across devices. A cart holds
  one branch; adding from another branch asks before replacing it (the API answers `CART_BRANCH_CONFLICT`).
- Checkout asks the API for a quote (`POST /orders/quote`) every time the address or cart changes, so the numbers
  on screen are always the ones the server will charge. The UI never calculates fees.
- Order buttons come from `allowedNextStatuses` in the API response. The status rules live only in the backend.
- An open order page refreshes every 15 seconds (admin order list: every 20) until the order is finished.
- Prices arrive as 2-decimal strings (`"150.00"`); `formatPeso()` formats them for display.

## Known limits

- Browse lists places alphabetically with a name search. There are no categories, ratings or "nearest first" sorting yet.
- Delivery addresses are typed coordinates (or the browser's location): there is no map or address search yet.
- Orders are cash on delivery only, and there is no merchant web portal yet, so admins (or Postman) move orders along.
- Order status updates arrive by polling, not push (live updates come with the rider/tracking phase).
- Tokens live in `localStorage`, which is fine for local development; move to httpOnly cookies before
  production.
- The admin app can approve merchants but not reject or suspend them yet (no endpoint).
- The apps have no automated tests yet. For this update I checked the flows by rendering both apps in a simulated
  browser against the real API; adding Vitest to the repo is a good next step.
- Mobile apps (`customer-mobile`, `rider-mobile`) are not scaffolded yet.
