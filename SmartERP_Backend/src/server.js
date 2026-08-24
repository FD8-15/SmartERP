import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import { connectDB } from "./db/db.js";

import userRouter from "./routes/user.routes.js"
import companyRouter from "./routes/company.routes.js"

const app = express();

app.use(express.json());
app.use(cookieParser());


app.use("/api/v1/users",userRouter)
app.use("/api/v1/company", companyRouter);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
  });
};

startServer();