# DataViz AI — Frontend

Next.js 15 + TypeScript + Tailwind CSS + TanStack Query

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **TanStack Query** (server state)
- **Axios** (HTTP client)

## Setup

```bash
npm install
npm run dev
```

Frontend runs at: http://localhost:3000
Backend API expected at: http://localhost:8000/api/v1

## Structure

```
app/          - Next.js App Router routes + layouts
features/     - Feature-oriented domain modules
  datasets/   - Dataset upload, preview, profiling
  ai-chat/    - Natural language data chat
  dashboards/ - Dashboard builder and viewer
lib/
  api/        - Shared axios client
  query/      - TanStack Query client + key factories
components/   - Shared UI primitives
types/        - Shared TypeScript types
```

## Environment

Copy `.env.local` and set `NEXT_PUBLIC_API_URL` to your backend URL.
