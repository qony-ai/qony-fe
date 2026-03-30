# Qony AI Frontend

Next.js App Router frontend for Qony AI. The current frontend includes:

- Better Auth-based email/password auth
- Google OAuth entry points when provider env vars are configured
- auth-aware navigation and protected app routes
- a dedicated pricing page with Free and Pro plan presentation
- Midtrans-oriented frontend billing flow with success, pending, failed, and canceled result states
- the existing dashboard, ingest, workspace, and export product surfaces
- a typed live/mock API adapter so the frontend remains usable without the backend

## Key Routes

- `/`
  Marketing landing page
- `/login`
  Better Auth sign-in page with email/password and OAuth buttons
- `/register`
  Better Auth sign-up page with email/password and OAuth buttons
- `/pricing`
  Public pricing page with auth-aware upgrade CTA behavior
- `/billing`
  Protected billing dashboard for current plan and subscription state
- `/billing/success`
  Protected success return state after checkout
- `/billing/pending`
  Protected pending return state after checkout
- `/billing/failed`
  Protected failed return state after checkout
- `/billing/cancel`
  Protected canceled return state after checkout
- `/dashboard`
  Protected project hub
- `/profile`
  Protected account page
- `/project/[projectId]`
  Project detail route
- `/project/ingest`
  File upload and raw text ingest flow
- `/workspace/[projectId]`
  Core DAG editor
- `/export/preview/[projectId]`
  Deck-style report preview
- `/export/graph/[projectId]`
  Print-ready graph board
- `/about`
  Product overview

## Frontend Auth

The frontend now uses Better Auth through `/api/auth/*`.

- Server session reads use `auth.api.getSession(...)`
- Browser auth actions use `createAuthClient(...)`
- Protected routes still gate through `requireAuthSession(...)`
- The header hydrates from the server session first, then upgrades to the live client session to avoid guest/auth flicker
- Google OAuth is shown only when `QONY_GOOGLE_CLIENT_ID` and `QONY_GOOGLE_CLIENT_SECRET` are set

### Local auth storage

- If `QONY_AUTH_DATABASE_URL` is set, Better Auth uses Postgres
- If `QONY_AUTH_DATABASE_URL` is missing, the frontend falls back to an in-memory adapter
- `QONY_AUTH_AUTO_MIGRATE=true` runs Better Auth migrations on startup when Postgres is enabled

## Billing and Midtrans Frontend Flow

The pricing and billing UI is frontend-complete, but it assumes the backend already exposes billing endpoints.

Frontend entry points:

- `POST /api/billing/checkout`
- `GET /api/billing/summary`
- `GET /api/billing/status`

Those internal routes forward to backend billing endpoints and normalize the response for the UI.

Expected backend endpoints:

- `GET /api/v1/billing/summary`
- `POST /api/v1/billing/checkout`
- `GET /api/v1/billing/status`

### Billing provider modes

- `QONY_BILLING_PROVIDER=midtrans`
  Always use backend billing responses
- `QONY_BILLING_PROVIDER=mock`
  Keep pricing and billing flows local and deterministic without backend payment infrastructure
- `QONY_BILLING_PROVIDER=auto`
  Try the backend first and fall back to mock billing if the request fails

### Midtrans frontend notes

- The pricing page supports a Midtrans Snap-style frontend flow
- The script is loaded only when a signed-in user can actually upgrade and `NEXT_PUBLIC_QONY_MIDTRANS_CLIENT_KEY` is present
- Result states route into `/billing/success`, `/billing/pending`, `/billing/failed`, or `/billing/cancel`
- In mock mode, checkout resolves locally into the success flow so the full frontend can be tested without a provider account

## API Modes

The frontend exposes one internal proxy surface at `/api/qony/...`.

- `auto`
  Try the real backend first, then fall back to the mock adapter if the request cannot connect
- `live`
  Always use the backend defined by `QONY_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL`
- `mock`
  Always use the in-process mock store with seeded projects and workspaces

## Environment

Copy the template first:

```bash
cp .env.example .env.local
```

Primary variables:

- `QONY_APP_URL`
  Canonical app URL used by Better Auth callback handling
- `NEXT_PUBLIC_APP_URL`
  Public app URL exposed to the browser
- `QONY_TRUSTED_ORIGINS`
  Comma-separated origins allowed by Better Auth
- `QONY_API_BASE_URL`
  Backend base URL for server-side requests
- `NEXT_PUBLIC_API_BASE_URL`
  Backend base URL for browser-driven internal proxy requests
- `QONY_API_MODE`
  `auto`, `live`, or `mock` for server-side app data
- `NEXT_PUBLIC_QONY_API_MODE`
  `auto`, `live`, or `mock` for browser-side app data
- `QONY_AUTH_DATABASE_URL`
  Optional Postgres connection string for Better Auth
- `QONY_AUTH_SECRET`
  Better Auth session secret
- `QONY_AUTH_AUTO_MIGRATE`
  Runs Better Auth migrations when using Postgres
- `QONY_INTERNAL_ACTOR_SECRET`
  Shared secret used to mint short-lived internal actor tokens for backend requests
- `QONY_INTERNAL_ACTOR_ISSUER`
  Issuer claim for internal actor tokens
- `QONY_INTERNAL_ACTOR_AUDIENCE`
  Audience claim for internal actor tokens
- `QONY_GOOGLE_CLIENT_ID`
  Enables Google OAuth button rendering and callback flow
- `QONY_GOOGLE_CLIENT_SECRET`
  Enables Google OAuth button rendering and callback flow
- `QONY_BILLING_PROVIDER`
  `auto`, `mock`, or `midtrans`
- `NEXT_PUBLIC_QONY_BILLING_PROVIDER`
  Optional browser-visible override for local billing-mode coordination
- `QONY_MIDTRANS_SERVER_KEY`
  Backend billing provider credential
- `NEXT_PUBLIC_QONY_MIDTRANS_CLIENT_KEY`
  Public Midtrans Snap client key used by the frontend script loader
- `QONY_MIDTRANS_IS_PRODUCTION`
  `true` for production Snap script URL, otherwise sandbox

### Recommended local setups

Frontend-only work:

```bash
QONY_API_MODE=mock
NEXT_PUBLIC_QONY_API_MODE=mock
QONY_BILLING_PROVIDER=mock
```

Real backend with local frontend:

```bash
QONY_API_MODE=auto
NEXT_PUBLIC_QONY_API_MODE=auto
QONY_BILLING_PROVIDER=auto
```

If you do not want to run Postgres locally for auth, leave `QONY_AUTH_DATABASE_URL` unset and the frontend will use the in-memory Better Auth adapter.

## Install and Run

```bash
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Verification

### Sign in and sign up

1. Open `/register`
2. Create an account with name, email, and password
3. Confirm you land on `/dashboard`
4. Open `/login`
5. Sign out, sign back in, and confirm the header switches to the authenticated state

### Google OAuth

1. Set `QONY_GOOGLE_CLIENT_ID` and `QONY_GOOGLE_CLIENT_SECRET`
2. Open `/login` or `/register`
3. Confirm the Google button is visible
4. Click it and confirm the browser enters the Better Auth social callback flow

### Pricing and upgrade flow

1. Open `/pricing`
2. Confirm Free and Pro plan cards render
3. Confirm the comparison table and billing notes render
4. As a guest, click the Pro CTA and confirm you are redirected into auth
5. As an authenticated free user, click the Pro CTA and confirm checkout starts

### Midtrans flow

1. Set `QONY_BILLING_PROVIDER=midtrans` or `auto`
2. Set `NEXT_PUBLIC_QONY_MIDTRANS_CLIENT_KEY`
3. Confirm the pricing CTA opens Snap or redirects into the billing provider flow
4. Confirm the return state lands on success, pending, failed, or canceled
5. Open `/billing` and confirm the subscription summary matches the latest backend status

## Automated Checks

Lint:

```bash
npm run lint
```

Type-check:

```bash
npx tsc --noEmit
```

Unit tests:

```bash
npm test
```

Browser verification:

```bash
npm run test:browser
```

Production build:

```bash
npx next build --webpack
```

`next build` in webpack mode is the verified production build path for this repository.
