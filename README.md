# SmartERP Backend

A multi-company ERP REST API for managing **inventory, purchases, sales, payments, and receipts**. Built with **Node.js, Express 5, and PostgreSQL**, with cookie-based JWT authentication and per-company role-based access control.



\

---

## Overview

SmartERP allows a single user to manage multiple companies, with each company maintaining its own isolated data and user permissions.

The system supports:

* Master data such as items, categories, units, suppliers, and customers
* Purchase and sales vouchers
* Payment and receipt vouchers
* Automatic stock updates
* Company-level role-based access control
* JWT authentication using `httpOnly` cookies
* PostgreSQL transactions for multi-step voucher operations

Every company-scoped request is restricted to users who belong to that company.

---

## Main Features

* **Multi-company support** — a user can own up to 5 companies
* **Multi-tenant data isolation** — company-scoped resources use `company_id`
* **Role-based access control** — `owner`, `manager`, and `employee`
* **JWT authentication** — access and refresh tokens using `httpOnly` cookies
* **Inventory management** — items, SKU, brand, GST, prices, stock, status
* **Purchase workflow** — supplier → purchase voucher → payment
* **Sales workflow** — customer → sales voucher → receipt
* **Automatic stock management**

  * Purchases increase stock
  * Sales decrease stock
  * Sales are rejected when stock is insufficient
* **Outstanding balance protection**

  * Payments cannot exceed purchase outstanding
  * Receipts cannot exceed sales outstanding
* **Database transactions** — voucher operations use `BEGIN`, `COMMIT`, and `ROLLBACK`
* **Centralized error handling**
* **Integration testing** with Vitest and Supertest
* **Company-level authorization middleware**

---

## Tech Stack

| Area             | Technology                    |
| ---------------- | ----------------------------- |
| Runtime          | Node.js (ES Modules)          |
| Framework        | Express `^5.2.1`              |
| Database         | PostgreSQL via `pg` `^8.22.0` |
| Authentication   | `jsonwebtoken` `^9.0.3`       |
| Password Hashing | `bcrypt` `^6.0.0`             |
| Cookies          | `cookie-parser` `^1.4.7`      |
| Configuration    | `dotenv` `^17.4.2`            |
| Testing          | Vitest `^5.0.0`               |
| API Testing      | Supertest `^7.2.2`            |

---

## Project Structure

```text
SmartERP/
└── SmartERP_Backend/
    ├── package.json
    ├── src/
    │   ├── server.js
    │   ├── app.js
    │   ├── db/
    │   │   ├── db.js
    │   │   └── schema.sql
    │   ├── routes/
    │   ├── controllers/
    │   ├── middlewares/
    │   │   ├── jwt.js
    │   │   ├── company_access.middleware.js
    │   │   └── checkRole.middleware.js
    │   └── utils/
    │       ├── ApiError.js
    │       ├── ApiResponse.js
    │       ├── asyncHandler.js
    │       ├── generateTokens.js
    │       └── calculate_total.js
    └── tests/
        ├── helpers/
        ├── user.test.js
        ├── company.test.js
        ├── item.test.js
        ├── supplier.test.js
        ├── customers.test.js
        ├── purchase_voucher.test.js
        ├── payment_voucher.test.js
        ├── sale_voucher.test.js
        └── receipt_voucher.test.js
```

### Entry Points

* `src/server.js` — database connection and HTTP server startup
* `src/app.js` — Express application, middleware, routes, and error handling

Tests import `src/app.js` directly without starting the HTTP server.

---

## Installation and Setup

### Prerequisites

* Node.js 18+
* PostgreSQL 14+
* npm

### 1. Clone the repository

```bash
git clone https://github.com/FD8-15/SmartERP.git
cd SmartERP/SmartERP_Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure PostgreSQL

Create the database and apply the schema:

```bash
createdb smarterp_db
psql -d smarterp_db -f src/db/schema.sql
```

### 4. Configure environment variables

Create a `.env` file using the variables shown below.

### 5. Start the server

```bash
node src/server.js
```

The server listens on the configured `PORT` (default: `3000`).

---

## Environment Variables

Create:

```text
SmartERP_Backend/.env
```

Example:

```env
PORT=3000

ACCESS_TOKEN_SECRET=<long-random-secret>
ACCESS_TOKEN_EXPIRY=15m

REFRESH_TOKEN_SECRET=<different-long-random-secret>
REFRESH_TOKEN_EXPIRY=7d
```

| Variable               | Purpose                          |
| ---------------------- | -------------------------------- |
| `PORT`                 | Server port                      |
| `ACCESS_TOKEN_SECRET`  | Signs and verifies access tokens |
| `ACCESS_TOKEN_EXPIRY`  | Access token lifetime            |
| `REFRESH_TOKEN_SECRET` | Signs refresh tokens             |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime           |

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> Never commit `.env` or real secrets to Git.

### Current Database Configuration

The PostgreSQL connection settings are currently defined in `src/db/db.js` rather than being fully loaded from environment variables.

---

## Database

The database schema is defined in:

```text
src/db/schema.sql
```
<img width="900" height="1202" alt="image" src="https://github.com/user-attachments/assets/ef0264de-a4c4-4056-be22-aa6ed0a4fedc" />

### Main Tables

| Table                    | Purpose                           |
| ------------------------ | --------------------------------- |
| `users`                  | User accounts                     |
| `companies`              | Company information               |
| `company_users`          | User/company membership and role  |
| `categories`             | Item categories                   |
| `units`                  | Measurement units                 |
| `items`                  | Products, pricing, GST, and stock |
| `suppliers`              | Suppliers                         |
| `customers`              | Customers                         |
| `purchase_voucher`       | Purchase voucher headers          |
| `purchase_voucher_items` | Purchase line items               |
| `payment_voucher`        | Supplier payments                 |
| `sales_voucher`          | Sales voucher headers             |
| `sales_voucher_items`    | Sales line items                  |
| `receipt_vouchers`       | Customer receipts                 |

### Relationships

```text
users
  │
  └──< company_users >── companies
                           │
                           ├── categories
                           ├── units
                           ├── items
                           ├── suppliers ──< purchase_voucher ──< purchase_voucher_items
                           │                       │
                           │                       └──< payment_voucher
                           │
                           └── customers ──< sales_voucher ──< sales_voucher_items
                                                   │
                                                   └──< receipt_vouchers
```

Items reference categories and units within the same company, preventing cross-company references.

---

## Authentication and Authorization

Protected company routes use middleware in the following order:

### 1. `auth`

`middlewares/jwt.js`

* Reads the `accessToken` cookie
* Verifies the JWT
* Attaches the authenticated user to `req.user`
* Returns `401` for missing or invalid authentication

### 2. `company_access`

`middlewares/company_access.middleware.js`

* Checks that the user belongs to the requested company
* Uses `:company_id`
* Attaches the user's role to `req.companyRole`
* Returns `403` when the user is not a company member

### 3. `checkRole(...)`

`middlewares/checkRole.middleware.js`

* Restricts write operations according to company role
* Returns `403` when the role is not permitted

### Authentication Flow

On login, the API creates:

* `accessToken`
* `refreshToken`

These are stored in `httpOnly` cookies.

The refresh token is also stored on the user record and cleared during logout.

---

## Roles and Permissions

Roles are assigned per company.

| Capability                | Owner | Manager | Employee |
| ------------------------- | :---: | :-----: | :------: |
| Read company data         |   ✅   |    ✅    |     ✅    |
| Create/update master data |   ✅   |    ✅    |     ❌    |
| Create/update vouchers    |   ✅   |    ✅    |     ❌    |
| Delete categories         |   ✅   |    ✅    |     ❌    |
| Add employees             |   ✅   |    ✅    |     ❌    |
| Add managers              |   ✅   |    ❌    |     ❌    |
| Update company details    |   ✅   |    ❌    |     ❌    |

Additional rules:

* A company creator automatically becomes its owner.
* `owner` cannot be assigned through the add-user endpoint.
* Managers can add employees but cannot add other managers.
* A user can own a maximum of 5 companies.
* Company names must be unique per owner, case-insensitively.

---

# API Reference

**Base path:**

```text
/api/v1
```

Unless stated otherwise, protected endpoints require the `accessToken` cookie.

---

## Users

Base path:

```text
/users
```

| Method | Endpoint    | Purpose                    | Auth      |
| ------ | ----------- | -------------------------- | --------- |
| POST   | `/register` | Create user account        | None      |
| POST   | `/login`    | Log in and set cookies     | None      |
| POST   | `/logout`   | Clear authentication state | Logged in |

---

## Companies

Base path:

```text
/company
```

| Method | Endpoint             | Purpose               | Access         |
| ------ | -------------------- | --------------------- | -------------- |
| POST   | `/`                  | Create company        | Logged in      |
| GET    | `/`                  | List user's companies | Logged in      |
| GET    | `/:company_id`       | Get company details   | Member         |
| POST   | `/:company_id/users` | Add user to company   | Owner, Manager |
| PATCH  | `/:company_id`       | Update company        | Owner          |

---

## Master Data

| Resource   | Base Path   |
| ---------- | ----------- |
| Categories | `/category` |
| Units      | `/unit`     |
| Items      | `/item`     |
| Suppliers  | `/supplier` |
| Customers  | `/customer` |

Typical operations include:

```text
POST    /:company_id
GET     /:company_id
GET     /:company_id/:resource_id
PATCH   /:company_id/:resource_id
DELETE  /:company_id/:resource_id
```

Create/update operations are restricted by role.

### Item Example

```text
POST  /api/v1/item/:company_id
GET   /api/v1/item/:company_id
GET   /api/v1/item/:company_id/:item_id
PATCH /api/v1/item/:company_id/:item_id
```

Item creation includes fields such as:

* `item_name`
* `sku`
* `brand`
* `category_id`
* `unit_id`
* `gst_percentage`
* `default_purchase_price`
* `default_selling_price`
* `current_quantity`
* `status`

`current_quantity` is not changed through normal item updates; stock is changed through voucher operations.

---

## Purchase Vouchers

```text
POST   /purchase-voucher/:company_id
GET    /purchase-voucher/:company_id
GET    /purchase-voucher/:company_id/:voucher_id
PATCH  /purchase-voucher/:company_id/:voucher_id
```

Purchase creation:

* Resolves the supplier using its GST number
* Uses each item's default purchase price
* Creates voucher and line items
* Increases stock
* Runs inside a database transaction

---

## Payment Vouchers

```text
POST   /payment-voucher/:company_id/:voucher_id/:supplier_id
GET    /payment-voucher/:company_id
GET    /payment-voucher/:company_id/:voucher_id/:supplier_id
GET    /payment-voucher/:company_id/:voucher_id/:supplier_id/:payment_id
PATCH  /payment-voucher/:company_id/:voucher_id/:supplier_id/:payment_id
```

Payments are checked against the outstanding purchase balance before being saved.

---

## Sales Vouchers

```text
POST   /sales-voucher/:company_id/:customer_id/:contact_no
GET    /sales-voucher/:company_id
GET    /sales-voucher/:company_id/:sales_id
PATCH  /sales-voucher/:company_id/:sales_id
```

Sales creation:

* Resolves the customer
* Uses each item's default selling price
* Checks available stock
* Rejects insufficient stock
* Decreases stock
* Runs inside a database transaction

---

## Receipt Vouchers

```text
POST   /receipt-voucher/:company_id/:sales_id
GET    /receipt-voucher/:company_id
GET    /receipt-voucher/:company_id/:receipt_id
GET    /receipt-voucher/:company_id/:sales_id/:customer_id
PATCH  /receipt-voucher/:company_id/:sales_id/:receipt_id
```

Receipts are validated against the outstanding sales balance before being saved.

---

## Example Requests

### Create Purchase Voucher

```http
POST /api/v1/purchase-voucher/1
Content-Type: application/json

{
  "date": "2026-04-15",
  "gst_no": "27ABCDE1234F1Z5",
  "items": [
    { "item_id": 3, "qty": 50 },
    { "item_id": 7, "qty": 20 }
  ]
}
```

### Create Sales Voucher

```http
POST /api/v1/sales-voucher/1/12/9876543210
Content-Type: application/json

{
  "date": "2026-04-16",
  "items": [
    { "item_id": 3, "qty": 5 }
  ]
}
```

### Record Payment

```http
POST /api/v1/payment-voucher/1/4/2
Content-Type: application/json

{
  "paid_amt": 2500,
  "date": "2026-04-18",
  "mode": "UPI"
}
```

---

## ERP Workflows

### Purchase

```text
Supplier
   ↓
Purchase Voucher
   ↓
Purchase Items
   ↓
Stock Increases
   ↓
Payment
```

### Sales

```text
Customer
   ↓
Sales Voucher
   ↓
Sales Items
   ↓
Stock Decreases
   ↓
Receipt
```

### Outstanding Calculation

Purchase:

```text
Outstanding = Purchase Total - Payments
```

Sales:

```text
Outstanding = Sales Total - Receipts
```

Payments and receipts cannot exceed the remaining outstanding balance.

---

## Database Transactions

Voucher operations use database transactions:

```text
BEGIN
  ↓
Perform related database operations
  ↓
COMMIT
```

If any step fails:

```text
ROLLBACK
```

This ensures related operations succeed or fail together.

For example, a purchase voucher should not be saved while its stock update fails.

---

## Important Business Rules

* Every company-scoped query is filtered by `company_id`.
* Users can only access companies they belong to.
* Items must use categories and units from the same company.
* Item SKUs are unique within a company.
* Category and unit names are unique within a company.
* Supplier GST numbers are unique within a company.
* Customer contact numbers are unique within a company.
* Negative prices, GST values, and quantities are rejected.
* Sales cannot exceed available stock.
* Payment amounts cannot exceed purchase outstanding.
* Receipt amounts cannot exceed sales outstanding.
* Voucher create/update operations are atomic.
* Stock changes are performed through purchase and sales vouchers rather than normal item updates.

---

## Response Format

### Standard Success Response

```json
{
  "statusCode": 201,
  "data": {
    "...": "..."
  },
  "message": "Purchase voucher created successfully",
  "success": true
}
```

### Standard Error Response

```json
{
  "statusCode": 400,
  "message": "Cannot pay more than outstanding amount",
  "success": false,
  "errors": []
}
```

### Common Status Codes

| Status | Meaning                                 |
| ------ | --------------------------------------- |
| `200`  | Successful request                      |
| `201`  | Resource created                        |
| `400`  | Validation or business-rule failure     |
| `401`  | Authentication required / invalid token |
| `403`  | Access denied                           |
| `404`  | Resource not found                      |
| `409`  | Duplicate/conflicting resource          |
| `500`  | Unexpected server error                 |

Some authentication endpoints use their own response shape.

---

## Testing

Tests use **Vitest** and **Supertest** and exercise the real Express application together with PostgreSQL.

Run tests with:

```bash
npm test
```

For a single non-watch run:

```bash
npx vitest run
```

Current integration test coverage spans:

| Test File                  | Area                                        |
| -------------------------- | ------------------------------------------- |
| `user.test.js`             | Registration, login, logout, authentication |
| `company.test.js`          | Companies, membership, role rules           |
| `item.test.js`             | Items, SKU rules, company isolation         |
| `supplier.test.js`         | Supplier operations and isolation           |
| `customers.test.js`        | Customer operations and isolation           |
| `purchase_voucher.test.js` | Purchases, stock, totals, rollback          |
| `payment_voucher.test.js`  | Payments and outstanding balances           |
| `sale_voucher.test.js`     | Sales, stock, rollback                      |
| `receipt_voucher.test.js`  | Receipts and outstanding balances           |

The current test suite contains **210 integration test cases**.

> Use a dedicated test database rather than production data.

---

## Current Limitations

The current version still has some areas planned for improvement:

* Database credentials are still configured in `src/db/db.js`
* Refresh-token route integration is incomplete
* Request validation is currently handled manually in controllers
* List endpoints do not yet support pagination/filtering consistently
* Some database schema details need to be kept synchronized with the current code
* Advanced concurrency protection for stock updates is not yet implemented
* Some voucher/master-data delete or cancel operations are not yet available

---

## Roadmap

### API & Backend

*  Zod request validation
*  Centralized request validation layer
*  Pagination
*  Search and filtering
*  API versioning improvements
*  OpenAPI / Swagger documentation
*  Idempotency support

### Database

*  Advanced concurrency handling
*  Row-level locking
*  Indexing strategy
*  Query optimization
*  `EXPLAIN ANALYZE`
*  Advanced PostgreSQL queries
*  Connection-pool tuning

### Production

*  Docker
*  Docker Compose
*  CI pipeline
*  Structured logging
*  Monitoring
*  AWS deployment

### Reporting

*  Sales reports
*  Purchase reports
*  Stock reports
*  Customer outstanding
*  Supplier outstanding
*  GST reporting

### Future Architecture

*  Redis and caching
*  Background jobs / queues
*  Advanced system design
*  Scalability improvements
*  AI-powered ERP features

---

## Author

**Raj Naik**

SmartERP is a personal backend project built to explore real-world ERP workflows, PostgreSQL transactions, authentication, authorization, inventory management, and production-oriented backend engineering.

---

Made with  using **Node.js, Express, and PostgreSQL**.
