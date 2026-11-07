import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "SmartERP API",
      version: "1.0.0",
      description: `
## Overview

SmartERP is a Tally-style cloud billing, inventory, and accounting ERP backend built with Express.js and PostgreSQL.

### Architecture Highlights

- **Authentication & Sessions:** Stateful JWT tokens delivered via secure, HTTP-only cookies (\`accessToken\` and \`refreshToken\`).
- **Multi-Tenant Company Access:** Isolated company workspaces. Users are granted role-based permissions (\`owner\`, \`manager\`, \`employee\`) per company via the \`company_users\` junction.
- **Request Validation:** Strict request body, URL path parameter, and query parameter validation powered by Zod schemas.
- **Transactional Integrity:** Complex business operations (purchase vouchers, sales vouchers, payments, and receipts) run in atomic PostgreSQL transactions (\`BEGIN\` / \`COMMIT\` / \`ROLLBACK\`).
- **Real-Time Inventory Tracking:** Stock levels (\`current_quantity\`) automatically increment upon purchase voucher creation and decrement upon sales voucher creation with pre-sale stock sufficiency checks.
- **Cumulative Voucher Settlement:** Payment and receipt vouchers validate that cumulative payments never exceed invoice totals.

### API Response Format

All responses follow predictable JSON envelope structures:

#### Success Response
\`\`\`json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success",
  "success": true
}
\`\`\`

#### Error Response
\`\`\`json
{
  "statusCode": 400,
  "message": "Validation failed",
  "success": false,
  "errors": [
    {
      "field": "body.field_name",
      "message": "Specific error explanation"
    }
  ]
}
\`\`\`
      `,
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    tags: [
      {
        name: "Users",
        description: "User registration, authentication, login sessions, and cookie-based logout.",
      },
      {
        name: "Companies",
        description: "Company workspace management, tenant settings, and user role assignments.",
      },
      {
        name: "Units",
        description: "Measurement units for inventory products (e.g., Kilogram, Litre, Piece).",
      },
      {
        name: "Categories",
        description: "Classification categories for items and inventory grouping.",
      },
      {
        name: "Items",
        description: "Product catalog, SKU management, pricing defaults, and inventory stock tracking.",
      },
      {
        name: "Suppliers",
        description: "Supplier contact information, address details, and 15-character GST numbers.",
      },
      {
        name: "Customers",
        description: "Customer accounts, 10-digit mobile contact numbers, and company directory.",
      },
      {
        name: "Purchase Vouchers",
        description: "Inward stock purchases with supplier verification, line items, and automated stock incrementation.",
      },
      {
        name: "Sales Vouchers",
        description: "Outward sales billing with stock sufficiency checks, automated inventory decrements, and total calculations.",
      },
      {
        name: "Payment Vouchers",
        description: "Outward payments to suppliers against purchase vouchers with outstanding balance enforcement.",
      },
      {
        name: "Receipt Vouchers",
        description: "Inward customer payment collections against sales vouchers with remaining amount tracking.",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "Authenticated session access token delivered automatically via HTTP-only cookie.",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
