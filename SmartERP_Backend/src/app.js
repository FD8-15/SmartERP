import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";

import userRouter from "./routes/user.routes.js";
import companyRouter from "./routes/company.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/company", companyRouter);

app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        statusCode: err.statusCode || 500,
        message: err.message || "Something went wrong",
        success: false,
        errors: err.errors || []
    });
});

export default app;