# MLedger API – Endpoints & Expected Output

Base URL: `http://localhost:3000` (or `process.env.PORT`). No global prefix.

---

## Root

| Method | Path | Description | Expected output |
|--------|------|-------------|-----------------|
| `GET` | `/` | Health / hello | `string` (e.g. `"Hello World!"`) |

---

## Companies (`/companies`)

| Method | Path | Description | Expected output |
|--------|------|-------------|-----------------|
| `GET` | `/companies` | List all companies | `CompanyListItemDto[]` |
| `POST` | `/companies/onboard` | Create company + admin user | `Company` (entity) |
| `GET` | `/companies/:companyId/users` | Users for a company | `CompanyUserDto[]` |
| `GET` | `/companies/:companyId/shareholders` | Shareholders who participated in share transactions (ledger-based) | `CompanyShareholderDto[]` |

### Output shapes

**CompanyListItemDto**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "registrationNumber": "string",
    "status": "ACTIVE | SUSPENDED"
  }
]
```

**Company** (onboard response)
```json
{
  "id": "uuid",
  "name": "string",
  "registrationNumber": "string",
  "authorizedCapital": "number",
  "issuedCapital": "number",
  "paidUpCapital": "number",
  "parValue": "number",
  "companyCode": "string | null",
  "status": "ACTIVE | SUSPENDED",
  "createdAt": "ISO date",
  "updatedAt": "ISO date",
  "deletedAt": "ISO date | null"
}
```

**CompanyUserDto**
```json
[
  {
    "id": "uuid",
    "fullName": "string",
    "email": "string",
    "phone": "string | null",
    "role": "UserRole",
    "status": "UserStatus"
  }
]
```

**CompanyShareholderDto**
```json
[
  {
    "id": "uuid",
    "fullName": "string",
    "email": "string | null",
    "isActive": true
  }
]
```

### Input (onboard)

**CreateCompanyWithAdminDto** (body)
- `companyName` (string)
- `registrationNumber` (string)
- `authorizedCapital` (number)
- `adminFullName` (string)
- `adminEmail` (email)
- `adminPassword` (string, min 6)

---

## Cap table

| Method | Path | Description | Expected output |
|--------|------|-------------|-----------------|
| `GET` | `/companies/:companyId/cap-table` | Cap table for a company (cached 30s; invalidated on issue/transfer) | `CapTableEntryDto[]` |
| `GET` | `/cap-table/companies/:companyId` | Same as above (legacy route; prefer `/companies/:companyId/cap-table`) | `CapTableEntryDto[]` |

**CapTableEntryDto**
```json
[
  {
    "shareholderId": "uuid",
    "name": "string",
    "email": "string (optional)",
    "shares": 100,
    "ownershipPercentage": 25.5
  }
]
```
- Only shareholders with balance > 0.
- Sorted by `shares` descending.

---

## Shareholders (`/shareholders`)

| Method | Path | Description | Expected output |
|--------|------|-------------|-----------------|
| `POST` | `/shareholders` | Create shareholder (companyId hardcoded in controller) | `Shareholder` (entity) |
| `GET` | `/shareholders` | List shareholders for company (companyId hardcoded) | `Shareholder[]` |
| `GET` | `/shareholders/:id` | Get one shareholder | `Shareholder` (entity) |
| `PATCH` | `/shareholders/:id` | Update shareholder | `Shareholder` (entity) |

**Shareholder** (entity fields typically returned)
- `id`, `fullName`, `phoneNumber`, `email`, `nationalId`, `address`, `isActive`, `company`, `createdAt`, `updatedAt`

**CreateShareholderDto** (body for POST): `fullName`, `phoneNumber`, `email?`, `nationalId?`, `address?`  
**UpdateShareholderDto** (body for PATCH): same fields, all optional.

---

## Shares (`/shares`)

| Method | Path | Description | Expected output |
|--------|------|-------------|-----------------|
| `POST` | `/shares/issue` | Issue shares to a shareholder | `{ transaction, certificate }` |
| `POST` | `/shares/transfer` | Transfer shares between shareholders (companyId hardcoded) | `ShareTransaction` (entity) |

**Issue – body (IssueSharesDto)**
- `companyId` (UUID)
- `shareholderId` (UUID)
- `shares` (integer, min 1)

**Issue – response**
- `transaction`: `ShareTransaction` (ISSUE)
- `certificate`: `ShareCertificate` (certificateNumber, company, shareholder, sharesIssued)

**Transfer – body (TransferSharesDto)**
- `fromShareholderId` (UUID)
- `toShareholderId` (UUID)
- `shares` (integer, min 1)

**Transfer – response**: single `ShareTransaction` (TRANSFER) entity.

---

## Share transactions (`/share-transactions`)

| Method | Path | Description | Expected output |
|--------|------|-------------|-----------------|
| `GET` | `/share-transactions/:id/balance` | Share balance for a shareholder (`:id` = shareholderId) | `number` (received − sent) |

Example: `42` (integer balance).

---

## Auth (`/auth`)

| Method | Path | Description | Expected output |
|--------|------|-------------|-----------------|
| `POST` | `/auth/request-otp` | Request OTP for phone number | `{ message, otp }` |
| `POST` | `/auth/verify-otp` | Verify OTP | `{ message }` |

**Request OTP – body**: `{ "phoneNumber": "string" }` (valid phone format).  
**Verify OTP – body**: `{ "phoneNumber": "string", "code": "string" }`.

**Responses**
- Request: `{ "message": "OTP sent successfully", "otp": "123456" }`
- Verify: `{ "message": "OTP verified successfully" }`

---

## Users (`/users`)

| Method | Path | Description | Expected output |
|--------|------|-------------|-----------------|
| (none) | `/users` | Controller exists; no routes defined | — |

---

## Errors

- **400 Bad Request**: Validation (e.g. invalid body), or business rule (e.g. invalid OTP, insufficient shares).
- **404 Not Found**: e.g. company or shareholder not found (e.g. `getCapTable`, `findOne` shareholder).
- Path params that are UUIDs use `ParseUUIDPipe` where applied (e.g. `companies/:companyId`, `cap-table/companies/:companyId`).

---

## Quick reference table

| Method | Path | Output |
|--------|------|--------|
| GET | `/` | string |
| GET | `/companies` | CompanyListItemDto[] |
| POST | `/companies/onboard` | Company |
| GET | `/companies/:companyId/users` | CompanyUserDto[] |
| GET | `/companies/:companyId/shareholders` | CompanyShareholderDto[] |
| GET | `/companies/:companyId/cap-table` | CapTableEntryDto[] |
| GET | `/cap-table/companies/:companyId` | CapTableEntryDto[] (legacy) |
| POST | `/shareholders` | Shareholder |
| GET | `/shareholders` | Shareholder[] |
| GET | `/shareholders/:id` | Shareholder |
| PATCH | `/shareholders/:id` | Shareholder |
| POST | `/shares/issue` | { transaction, certificate } |
| POST | `/shares/transfer` | ShareTransaction |
| GET | `/share-transactions/:id/balance` | number |
| POST | `/auth/request-otp` | { message, otp } |
| POST | `/auth/verify-otp` | { message } |
