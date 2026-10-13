# Silver Bank API

Base URL (dev): `http://localhost:4000/api`

## Health
- `GET /health` - service status

## Auth
- `POST /auth/register` - register new customer (201), sets no cookies by default; returns user+account+tokens via /login flow
- `POST /auth/login` - email/password, returns access token and user+account; sets httpOnly refresh cookie
- `POST /auth/refresh` - refresh access token using cookie
- `POST /auth/logout` - clear cookie
- `GET /auth/me` - current user (requires Bearer token)

## Accounts
- `GET /accounts/dashboard` - account, recent tx, notifications
- `GET /accounts/me` - account details
- `GET /accounts/me/balance` - balance details
- `GET /accounts/me/transactions` - paginated transaction history (query: page, limit, type, status, direction, from, to, search)

## Transfers
- `POST /transfers/lookup-recipient` - minimal recipient info (no sensitive data)
- `POST /transfers` - create transfer (idempotent via `idempotencyKey` header/body)
- `GET /transfers/:reference` - get owned transfer details
- `GET /transfers/:reference/receipt` - printable receipt

## Beneficiaries
- `GET /beneficiaries` - list
- `POST /beneficiaries` - create/save
- `DELETE /beneficiaries/:id` - remove

## Profile
- `GET /profile` - profile+account
- `PATCH /profile` - update permitted fields (fullName, phone)
- `PATCH /profile/password` - change password (rotates tokens)

## Admin
- `GET /admin/statistics` - overview
- `GET /admin/customers` - customers list
- `GET /admin/transactions` - all transactions
- `PATCH /admin/accounts/:id/status` - set account status
- `GET /admin/audit-logs` - audit entries
- `GET /admin/reconciliation` - ledger reconciliation report

## Notes
- All money is in integer minor units (kobo). Responses include formatted amounts.
- Transfers require sufficient balance and active accounts; frozen/closed accounts cannot send/receive in restricted flows.
- Double-entry: every completed transfer creates 1 DEBIT + 1 CREDIT with equal amounts and same currency.
- Database-level checks prevent negative balances; transactions use row locks in consistent order.
- Never trust client-supplied user/account IDs; identity derived from token.
- Generic login errors to avoid user enumeration.
- Secrets never exposed in responses.
