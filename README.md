# Qony Frontend

Next.js App Router frontend for the Qony Business Case Intelligence Platform.

## Active product routes

- `/`
  Landing page
- `/(auth)/login`
  Sign-in flow
- `/(auth)/register`
  Sign-up flow
- `/dashboard`
  Project dashboard
- `/project/new`
  Create project flow
- `/project/ingest`
  Document upload and ingestion progress flow
- `/editor/[project_id]`
  Typed graph editor
- `/pricing`
  Pricing page
- `/billing`
  Billing overview
- `/billing/success`
- `/billing/pending`
- `/billing/failed`
- `/billing/cancel`
  Midtrans return states
- `/admin`
- `/admin/users`
- `/admin/revenue`
- `/admin/usage`
- `/admin/flags`
  Admin dashboard pages

## Backend contract

The frontend proxy lives at `/api/qony/*` and forwards to the backend PRD API:

- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/{project_id}`
- `PATCH /api/v1/projects/{project_id}`
- `DELETE /api/v1/projects/{project_id}`
- `GET /api/v1/projects/{project_id}/graph`
- `POST /api/v1/projects/{project_id}/ingest`
- `WS /api/v1/ws/ingest/{job_id}`
- `GET /api/v1/graphs/{graph_id}`
- `PUT /api/v1/graphs/{graph_id}`
- `POST /api/v1/graphs/{graph_id}/ai-edit`
- `POST /api/v1/graphs/{graph_id}/export`
- `POST /api/v1/nodes/{graph_id}`
- `PATCH /api/v1/nodes/{node_id}`
- `DELETE /api/v1/nodes/{node_id}`
- `POST /api/v1/edges/{graph_id}`
- `PATCH /api/v1/edges/{edge_id}`
- `DELETE /api/v1/edges/{edge_id}`
- `GET /api/v1/exports/{job_id}`
- `POST /api/v1/payment/checkout`
- `GET /api/v1/payment/subscription`
- `POST /api/v1/payment/webhook/midtrans`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/metrics`
- `GET /api/v1/admin/flags`

## Auth

- Better Auth powers the frontend auth flow through `/api/auth/*`.
- Protected routes use the current session and mint short-lived internal actor tokens for backend requests.

## Billing

- Billing UI uses Midtrans Snap on the frontend.
- Frontend billing helpers expect backend support at `/api/v1/payment/checkout` and `/api/v1/payment/subscription`.
- Mock billing mode still exists for local UI-only work through `QONY_BILLING_PROVIDER=mock`.

## Environment

Common variables:

- `QONY_APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `QONY_TRUSTED_ORIGINS`
- `QONY_API_BASE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `QONY_AUTH_DATABASE_URL`
- `QONY_AUTH_SECRET`
- `QONY_AUTH_AUTO_MIGRATE`
- `QONY_INTERNAL_ACTOR_SECRET`
- `QONY_INTERNAL_ACTOR_ISSUER`
- `QONY_INTERNAL_ACTOR_AUDIENCE`
- `QONY_GOOGLE_CLIENT_ID`
- `QONY_GOOGLE_CLIENT_SECRET`
- `QONY_BILLING_PROVIDER`
- `NEXT_PUBLIC_QONY_BILLING_PROVIDER`
- `QONY_MIDTRANS_SERVER_KEY`
- `NEXT_PUBLIC_QONY_MIDTRANS_CLIENT_KEY`
- `QONY_MIDTRANS_IS_PRODUCTION`

## Scripts

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```
