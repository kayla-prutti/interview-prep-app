# i-Prep

i-Prep stores interview experiences and questions in a local SQLite database.

Live browser version: https://kayla-prutti.github.io/i-prep/

The GitHub Pages build runs entirely in the browser and stores its data in that browser's local storage. It does not publish the local SQLite database.

## Private cloud accounts

The client also supports Supabase authentication and private cloud storage. Apply the migration in `supabase/migrations`, then build with:

```bash
VITE_STORAGE_MODE=supabase \
VITE_SUPABASE_URL=https://your-project.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key \
npm --prefix client run build
```

Every stored row belongs to an authenticated user and is protected by Postgres Row Level Security. The one-time `npm run import:supabase` command creates or locates the target account and imports the local SQLite records into that account. Secret keys and passwords must remain in local environment variables and must never be included in a client build.

## Project layout

```text
client/src/
  components/            Shared visual components
  features/interviews/   Interview table cells, columns, and types
  features/questions/    Question table cells, columns, and types
  lib/                   Interview labels, formatting, and section data
  App.tsx                Application state and screen composition
  types.ts               Shared client data types

server/src/
  lib/validation.ts      Request validation helpers
  routes/interviews.ts   Interview endpoints
  routes/questions.ts    Question endpoints
  routes/practice.ts     Prep interview, practice question, and answer endpoints
  app.ts                 Express middleware and route registration
  database.ts            SQLite connection, schema, and migrations
  server.ts              Server startup only
```

## Run locally

Start the server from the project root:

```bash
npm run dev
```

Start the client in a second terminal:

```bash
cd client
npm run dev
```

The client runs at `http://localhost:5173` and the API runs at `http://localhost:3000`.

## Checks

```bash
npm run typecheck
cd client
npm run build
npm run lint
```
