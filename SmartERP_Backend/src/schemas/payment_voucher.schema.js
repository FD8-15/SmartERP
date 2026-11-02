import { z } from "zod";

const positiveId = z.coerce
    .number()
    .int()
    .positive("ID must be a positive integer");

// POST /:company_id/:voucher_id/:supplier_id
export const createPaymentVoucherSchema = z.object({
    params: z.object({
        company_id: positiveId,
        voucher_id: positiveId,
        supplier_id: positiveId
    }),

    body: z.object({
        paid_amt: z.coerce
            .number({
                required_error: "paid_amt is required",
                invalid_type_error: "paid_amt must be a number"
            })
            .positive("paid_amt must be a positive number"),

        date: z
            .string({
                required_error: "Date is required",
                invalid_type_error: "Date must be a string"
            })
            .trim()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),

        mode: z
            .string({
                required_error: "Mode is required",
                invalid_type_error: "Mode must be a string"
            })
            .trim()
            .min(1, "Mode cannot be empty")
    })
});

// PATCH /:company_id/:voucher_id/:supplier_id/:payment_id
export const updatePaymentVoucherSchema = z.object({
    params: z.object({
        company_id: positiveId,
        voucher_id: positiveId,
        supplier_id: positiveId,
        payment_id: positiveId
    }),

    body: z.object({
        amtNew: z.coerce
            .number({
                required_error: "amtNew is required",
                invalid_type_error: "amtNew must be a number"
            })
            .positive("amtNew must be a positive number")
    })
});

// GET /:company_id/:voucher_id/:supplier_id/:payment_id
export const getOnePaymentVoucherSchema = z.object({
    params: z.object({
        company_id: positiveId,
        voucher_id: positiveId,
        supplier_id: positiveId,
        payment_id: positiveId
    })
});

// GET /:company_id/:voucher_id/:supplier_id
export const getPaymentsByPurchaseVoucherSchema = z.object({
    params: z.object({
        company_id: positiveId,
        voucher_id: positiveId,
        supplier_id: positiveId
    })
});

// GET /:company_id
export const getAllPaymentVouchersSchema = z.object({
    params: z.object({
        company_id: positiveId
    }),

    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().trim().optional()
    }).optional()
});
