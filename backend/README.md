# Backend (API)

Node.js + TypeScript + Express API for the Compliance Document Analyzer.

## Setup

```bash
cd backend
npm install

cp .env.example .env
```

## Run

```bash
npm run dev
```

API health check: http://localhost:8000/api/health

## Database (SQLite + Drizzle)

```bash
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Tests

```bash
cd backend
npm test
npm run test:coverage
```
