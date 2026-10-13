# Silver Bank

A complete, functional full-stack banking application called **Silver Bank** built with React + Vite (frontend), Express + Sequelize + PostgreSQL (backend). The backend implements secure authentication (JWT + refresh tokens), double-entry ledger, atomic transfers, RBAC, audit logging, and idempotency. Monetary values use integer minor units (kobo) as the source of truth.

## Project Structure

- `frontend/` - React application (Vite, Tailwind CSS, React Router, Axios)
- `backend/` - Express REST API with Sequelize models, migrations, and seeders

## Quick Start

### Prerequisites
- Node.js 18+ (tested on 24.14.0)
- PostgreSQL 15+ (local instance provided on port 5433 for development)

### Backend Setup

```bash
cd silver-bank/backend
npm install
cp .env.example .env
# Update .env if needed (defaults work with local DB on 5433)
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev  # starts on http://localhost:4000
```

### Frontend Setup

```bash
cd silver-bank/frontend
npm install
cp .env.example .env.local
npm run dev  # starts on http://localhost:5173
```

### Tests

Backend tests:
```bash
cd silver-bank/backend
NODE_ENV=test npx jest --runInBand --forceExit
```

## API Documentation

See `backend/API.md` for endpoint details.

## Features

- Secure registration & login (bcrypt, JWT, refresh tokens)
- Account management (balances, status, dashboard)
- Atomic internal transfers with double-entry ledger
- Transaction PIN created from the dashboard after signup and required to authorise transfers/withdrawals
- Transaction history, receipts, and recipient lookup
- Beneficiaries, profile, password and PIN change
- Admin dashboard (customers, transactions, audit logs, reconciliation, freeze/unfreeze accounts)
- Idempotency for financial operations, rate limiting, security headers, ownership checks

## Deployment

- Frontend: Vercel (use `VITE_API_URL`)
- Backend: Render/other Node host with managed PostgreSQL. Run migrations via CLI in production.
- Never commit real secrets; use environment variables.

## Demo Credentials

Seeded:
- Admin: `admin@silverbank.test` / `Admin@Silver123`
- Customer: `ada@silverbank.test` / `Customer@123` — transaction PIN `1234`
- Customer: `chidi@silverbank.test` / `Customer@123` — transaction PIN `1234`

## License

MIT
