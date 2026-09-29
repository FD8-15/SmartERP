import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";

import userRouter from "./routes/user.routes.js";
import companyRouter from "./routes/company.routes.js";
import unitRouter from "./routes/unit.routes.js";
import categoryRouter from "./routes/categories.routes.js";
import itemRouter from "./routes/item.routes.js";
import supplierRouter from "./routes/supplier.routes.js";
import purchaseVoucherRouter from "./routes/purchase_voucher.routes.js";
import paymentVoucherRouter from "./routes/payment_voucher.routes.js";
import customerRouter from "./routes/customer.routes.js";
import salesVoucherRouter from "./routes/sale_voucher.routes.js";
import receiptVoucherRouter from "./routes/receipt_voucher.routes.js";
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/unit", unitRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/item", itemRouter);
app.use("/api/v1/supplier", supplierRouter);
app.use("/api/v1/purchase-voucher", purchaseVoucherRouter);
app.use("/api/v1/payment-voucher", paymentVoucherRouter);
app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/sales-voucher", salesVoucherRouter);
app.use("/api/v1/receipt-voucher", receiptVoucherRouter);

app.use((err, req, res, next) => {
    console.log("DB ERROR:", err.code, err.constraint, err.message);
    res.status(err.statusCode || 500).json({
        statusCode: err.statusCode || 500,
        message: err.message || "Something went wrong",
        success: false,
        errors: err.errors || []
    });
});

export default app;