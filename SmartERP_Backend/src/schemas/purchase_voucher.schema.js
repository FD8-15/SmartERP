import { z } from "zod";

const purchaseItemSchema = z.object({
    item_id: z.coerce
        .number({
            required_error: "Item ID is required",
            invalid_type_error: "Item ID must be a number"
        })
        .int("Item ID must be an integer")
        .positive("Item ID must be a positive integer"),

    qty: z.coerce
        .number({
            required_error: "Quantity is required",
            invalid_type_error: "Quantity must be a number"
        })
        .int("Quantity must be an integer")
        .positive("Quantity must be a positive integer")
});

export const createPurchaseVoucherSchema = z.object({
    body: z.object({
        date: z
            .string({
                required_error: "Date is required",
                invalid_type_error: "Date must be a string"
            })
            .trim()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),

        gst_no: z
            .string({
                required_error: "GST number is required",
                invalid_type_error: "GST number must be a string"
            })
            .trim()
            .length(15, "GST number must contain exactly 15 characters")
            .regex(
                /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/,
                "Invalid GST number format"
            ),

        items: z
            .array(purchaseItemSchema, {
                required_error: "Items array is required",
                invalid_type_error: "Items must be an array"
            })
            .min(1, "Items array must contain at least one item")
    }),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    })
});

export const updatePurchaseVoucherSchema = z.object({
    body: z.object({
        items: z
            .array(purchaseItemSchema, {
                required_error: "Items array is required",
                invalid_type_error: "Items must be an array"
            })
            .min(1, "Items array must contain at least one item")
    }),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer"),

        voucher_id: z.coerce
            .number()
            .int()
            .positive("Voucher ID must be a positive integer")
    })
});

export const getPurchaseVouchersSchema = z.object({
    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    }),

    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().trim().optional()
    }).optional()
});

export const purchaseVoucherIdParamsSchema = z.object({
    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer"),

        voucher_id: z.coerce
            .number()
            .int()
            .positive("Voucher ID must be a positive integer")
    })
});
