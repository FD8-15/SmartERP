import { mkdirSync, writeFileSync } from "node:fs";
import swaggerSpec from "../config/swagger.js";

// Create the documentation folder if it doesn't exist
mkdirSync("docs", { recursive: true });

// Export the generated OpenAPI specification as JSON
writeFileSync(
  "docs/openapi.json",
  JSON.stringify(swaggerSpec, null, 2)
);

console.log("OpenAPI specification exported to docs/openapi.json");