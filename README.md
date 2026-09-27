# i-Prep

i-Prep stores interview experiences and questions in a local SQLite database.

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
