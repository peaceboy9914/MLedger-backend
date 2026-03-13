# MLedger Architecture

## Stack
Backend: NestJS
Database: PostgreSQL
ORM: TypeORM
Frontend: Next.js
Auth: JWT
Messaging: Telegram Bot + Twilio SMS

## Modules

auth
companies
users
shareholders
shares
share-transactions
share-certificates
notifications
billing

## Core Rules

1. **Ledger-based share ownership** – Share balances are never stored; they are always derived from `share_transactions` (balance = received − sent).
2. **Shareholder belongs to a company** – `Shareholder` has a `companyId` relation (FK); `/companies/:companyId/shareholders` queries the Shareholder table directly by company.
3. **Cap table** – Derived from ledger: received = SUM(shares) by `toShareholderId` (ISSUE + TRANSFER); sent = SUM(shares) by `fromShareholderId` (TRANSFER). Balance = received − sent. Total issued = SUM(shares) where type = ISSUE.
4. **Transfers** – `TransferShares` validates that the sender’s balance (derived per company) is sufficient before creating a TRANSFER transaction. Runs inside a DB transaction with `FOR UPDATE` on all ledger rows that affect the sender’s balance for that company, so concurrent transfers cannot both pass validation (no double-spend).
5. **Indexes** – `ShareTransaction` is indexed on `(companyId, type)`, `(companyId, toShareholderId)`, `(companyId, fromShareholderId)` and on each FK for query performance.
6. Authorized capital enforcement; partial share transfer supported; multi-company SaaS; every financial action logged.