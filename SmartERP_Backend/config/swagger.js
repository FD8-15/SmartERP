import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",

   info: {
  title: "SmartERP API",
  version: "1.0.0",
  description: `
## Overview

SmartERP is a billing, inventory, and accounting ERP backend.

This API provides endpoints for managing the resources and
operations supported by SmartERP.

## API Versioning

The current API uses the \`/api/v1\` version prefix.

## Using This Documentation

Explore the available endpoints to understand their HTTP methods,
parameters, request bodies, and responses.

As the API documentation expands, additional resource groups
and detailed request and response examples will be included.
  `,
},

    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
  },

  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;