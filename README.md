# i-Prep

i-Prep is a private interview preparation library for recording interview experiences, collecting questions, and preparing answers in one organized place.

Live browser version: https://kayla-prutti.github.io/i-prep/

The deployed app uses Supabase authentication and private cloud storage. Each user's records are linked to their account and protected by Row Level Security. The local development version can also use the SQLite database included in this repository.

## Why I built i-Prep

Preparing for interviews takes a lot of time, and I noticed that my notes were scattered across different places. Some were saved in Notes on my Mac, while others lived inside conversations with ChatGPT. Important questions, answers, and memories from past interviews were sometimes difficult to find, and occasionally I lost track of them completely.

I created i-Prep to give that information a permanent home. I wanted it to feel like a personal library where I could preserve every interview experience, collect the questions I had been asked, and reuse what I learned when preparing for the next opportunity. Instead of starting over for every interview, I can return to an organized record that becomes more useful over time.

## Design inspiration

The visual theme is inspired by the gray, black, white, and orange colors in my university emblem. The interface also draws from traditional paper filing systems: folders used to store handwritten records and labeled index tabs that separate information into clear categories.

This familiar library and archive style supports the purpose of the app. Interviews are stored as records, questions are organized into type-based folders, and preparation sets bring selected questions and answers together for practice.

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
