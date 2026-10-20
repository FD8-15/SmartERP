import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "SmartERP API",
      version: "1.0.0",
      description: "API documentation for the SmartERP backend",
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