import { z } from "zod";

const positiveId = z.coerce
    .number()
    .int()
    .positive("ID must be a positive integer");

// POST /:company_id/:sales_id
export const createReceiptVoucherSchema = z.object({
    params: z.object({
        company_id: positiveId,
        sales_id: positiveId
    }),
    body: z.object({
        connect_no: z
            .string({
                required_error: "connect_no is required",
                invalid_type_error: "connect_no must be a string"
            })
            .trim()
            .regex(/^[6-9]\d{9}$/, "Contact number must be a valid 10-digit Indian mobile number"),
        current_amt_paid: z.coerce
            .number({
                required_error: "current_amt_paid is required",
                invalid_type_error: "current_amt_paid must be a number"
            })
            .positive("current_amt_paid must be a positive number"),
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

// PATCH /:company_id/:sales_id/:receipt_id
export const updateReceiptVoucherSchema = z.object({
    params: z.object({
        company_id: positiveId,
        sales_id: positiveId,
        receipt_id: positiveId
    }),
    body: z.object({
        connect_no: z
            .string({
                required_error: "connect_no is required",
                invalid_type_error: "connect_no must be a string"
            })
            .trim()
            .regex(/^[6-9]\d{9}$/, "Contact number must be a valid 10-digit Indian mobile number"),
        current_amt_paid: z.coerce
            .number({
                required_error: "current_amt_paid is required",
                invalid_type_error: "current_amt_paid must be a number"
            })
            .positive("current_amt_paid must be a positive number")
    })
});

export const getOneReceiptVoucherSchema = z.object({
    params: z.object({
        company_id: positiveId,
        receipt_id: positiveId
    })
});

export const getAllReceiptVouchersSchema = z.object({
    params: z.object({
        company_id: positiveId
    })
});

export const getReceiptsBySalesVoucherSchema = z.object({
    params: z.object({
        company_id: positiveId,
        sales_id: positiveId,
        customer_id: positiveId
    }),
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional()
    }).optional()
});
