# Qony AI Frontend

Next.js App Router frontend for Qony AI. This repo intentionally keeps UI presentation minimal and focuses on route-level integration with the backend API.

## Implemented Routes

- `/dashboard`
  Project listing plus create, update, and delete actions
- `/project/ingest`
  Raw text ingest into the backend graph initialization flow
- `/workspace/[projectId]`
  Workspace graph fetch plus mutation actions for add node, add edge, delete node, and AI patch
- `/export/preview/[projectId]`
  Export-ready traversal preview for complete branches

## Frontend Structure

```text
qony-fe/
  app/
    dashboard/
    project/ingest/
    workspace/[projectId]/
    export/preview/[projectId]/
  src/
    lib/
      api/
      types/
    features/
      dashboard/
      ingest/
      workspace/
      export-preview/
```

## Environment

```bash
cp .env.example .env.local
```

Variables:

- `QONY_API_BASE_URL`
  Used by server-side route fetches. Use `http://127.0.0.1:8000` locally.
- `NEXT_PUBLIC_API_BASE_URL`
  Used by browser-side mutations. Use `http://localhost:8000` locally.

## Start

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

## Validation

Lint:

```bash
npm run lint
```

Type-check:

```bash
npx tsc --noEmit
```

## Notes

- The frontend treats the backend graph as the single source of truth.
- It does not keep an independent client-side graph model beyond temporary form state.
- If the backend is unavailable, route pages render explicit error states instead of placeholder mock data.
