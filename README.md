# Qony AI Frontend

Next.js App Router frontend for Qony AI, rebuilt as a structured problem-solving product rather than a generic CRUD shell. The app now includes:

- a public landing page at `/`
- a global top navigation for every non-canvas route
- a lightweight Next-side auth layer with protected app routes
- a dedicated project detail route between dashboard and canvas
- a premium React Flow workspace with rank-aware nodes, minimap, drag/pan/zoom, constrained edges, and auto-layout
- an AI framework recommender that can insert or refresh Rank 4 analysis nodes from the active branch
- a print-ready PDF export flow for both the graph board and the narrative preview
- a typed live/mock API adapter so the frontend remains usable without the backend

## Routes

- `/`
  Marketing landing page aligned to the reference visual direction
- `/dashboard`
  Protected project hub with project creation, search, sorting, and case cards
- `/login`
  Public sign-in page for the frontend session
- `/profile`
  Protected profile page surfaced from the header account menu
- `/project/[projectId]`
  Project detail view for metadata, workspace readiness, and routing into ingest/canvas/export
- `/project/ingest`
  File upload + raw text ingest flow with progress and extracted-node preview
- `/workspace/[projectId]`
  Core DAG editor with graph canvas, project back button, manual edge creation, copilot patching, and graph PDF export
- `/export/preview/[projectId]`
  Deck-style report preview with active narrative content and PDF export
- `/export/graph/[projectId]`
  Print-ready graph board for browser PDF export
- `/about`
  Product and workflow overview

## Frontend Structure

```text
qony-fe/
  app/
    api/qony/[...segments]/
    about/
    dashboard/
    export/graph/[projectId]/
    export/preview/[projectId]/
    project/[projectId]/
    project/ingest/
    workspace/[projectId]/
  src/
    components/
      layout/
      ui/
    features/
      dashboard/
      export-graph/
      export-preview/
      ingest/
      landing/
      project-detail/
      workspace/
    lib/
      api/
      types/
      utils.ts
      workspace/
```

## API Modes

The frontend exposes one internal API surface at `/api/qony/...`.

- `auto`
  Try the real backend first, then fall back to the mock adapter if the request cannot connect
- `live`
  Always use the backend defined by `QONY_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL`
- `mock`
  Always use the in-process mock store with seeded projects and workspaces

## Environment

```bash
cp .env.example .env.local
```

Available variables:

- `QONY_API_BASE_URL`
  Real backend base URL used by server-side requests
- `NEXT_PUBLIC_API_BASE_URL`
  Real backend base URL used by client-side internal proxy requests
- `QONY_API_MODE`
  `auto`, `live`, or `mock` for server-side access
- `NEXT_PUBLIC_QONY_API_MODE`
  `auto`, `live`, or `mock` for browser-side access
- `QONY_AUTH_SECRET`
  Secret used to sign the frontend auth session cookie

Recommended local setup:

- backend available: keep both mode vars at `auto`
- frontend-only work: set both mode vars to `mock`

## Install and Run

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## Validation

Lint:

```bash
npm run lint
```

Type-check:

```bash
npx tsc --noEmit
```

Tests:

```bash
npm test
```

Production build:

```bash
npx next build --webpack
```

`next build` in Turbopack mode can hit sandbox-specific CSS worker restrictions in constrained environments; webpack mode was verified successfully.

## Product Flow

- `/login` → sign in to create a session
- `/dashboard` → review all projects
- `/project/[projectId]` → inspect one project in detail
- `/workspace/[projectId]` → edit the graph in the fullscreen canvas
- `/export/preview/[projectId]` or `/export/graph/[projectId]` → export the case as PDF

## Workspace Notes

- The graph is intentionally constrained to the six Qony ranks.
- The canvas route has no global top nav; it only exposes a back-to-project control in the upper-left corner.
- Nodes can be dragged freely on the canvas with snap-to-grid behavior.
- Edge creation is limited to adjacent ranks only.
- Auto-layout uses Dagre to rebalance the canvas.
- The right rail includes AI framework recommendations that map the active branch into Rank 4 framework nodes.
- Graph PDF export opens a dedicated print-ready route and uses the browser print dialog for Save as PDF.
- The mock API includes seeded projects so the full product flow can be exercised without the backend.

## Frontend local setup checklist

- Install dependencies:
  `npm install`
- Start the app:
  `npm run dev`
- Configure env vars:
  copy `.env.example` to `.env.local`
- Set the auth secret:
  define `QONY_AUTH_SECRET` in `.env.local`
- Use the mock API when the backend is unavailable:
  set `QONY_API_MODE=mock` and `NEXT_PUBLIC_QONY_API_MODE=mock`
- Test the workspace page:
  log in first, open a real project from `/dashboard`, continue to `/project/[projectId]`, then open the canvas
- Verify graph editor behavior:
  drag a node, connect adjacent ranks, run `Auto-layout`, open graph PDF export, apply an AI framework to a Rank 3 branch, and submit a copilot patch
- Run checks:
  `npm run lint`, `npx tsc --noEmit`, `npm test`, `npx next build --webpack`
