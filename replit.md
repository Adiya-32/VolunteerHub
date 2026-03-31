# Sun Proactive - Volunteer Matching Platform

## Overview

Sun Proactive is a full-stack volunteer matching web app that uses AI to help coordinators create tasks and automatically match them with the best-fit volunteers based on skills and availability.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/sun-proactive)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini for chatbot)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080, served at /api)
│   └── sun-proactive/      # React + Vite frontend (served at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/ # OpenAI AI integration client
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **volunteers** — name, email, phone, skills (array), availability, location, bio, totalHours
- **tasks** — title, description, requiredSkills (array), location, date, duration, volunteersNeeded, status, coordinatorName
- **matches** — taskId, volunteerId, status, matchScore

## Key Features

1. **AI Chatbot Task Creation** (`POST /api/chat`): Coordinators chat with an AI that interviews them to gather task details. When complete, returns structured task data with `isComplete: true`.
2. **Volunteer Registration** (`POST /api/volunteers`): Volunteers register with their skills, availability, and location.
3. **Smart Matching** (`GET /api/tasks/:id/matches`): Returns volunteers ranked by match score based on skill overlap with task requirements.
4. **Task Management**: Full CRUD for tasks with status tracking (open, in_progress, completed, cancelled).
5. **Match Assignment** (`POST /api/matches`): Assign volunteers to tasks.

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI proxy URL (auto-provisioned by Replit AI Integrations)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (auto-provisioned by Replit AI Integrations)
- `PORT` — Server port (auto-assigned)
- `SESSION_SECRET` — Session secret

## Development Commands

- `pnpm --filter @workspace/api-server run dev` — Start the API server
- `pnpm --filter @workspace/sun-proactive run dev` — Start the frontend
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API client from OpenAPI spec
- `pnpm --filter @workspace/db run push` — Push database schema changes
