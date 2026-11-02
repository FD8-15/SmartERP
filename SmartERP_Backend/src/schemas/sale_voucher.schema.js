import { z } from "zod";

const saleItemSchema = z.object({
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

export const createSaleVoucherSchema = z.object({
    body: z.object({
        date: z
            .string({
                required_error: "Date is required",
                invalid_type_error: "Date must be a string"
            })
            .trim()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),

        items: z
            .array(saleItemSchema, {
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

        customer_id: z.coerce
            .number()
            .int()
            .positive("Customer ID must be a positive integer"),

        contact_no: z
            .string({
                required_error: "Contact number is required",
                invalid_type_error: "Contact number must be a string"
            })
            .trim()
            .regex(
                /^[6-9]\d{9}$/,
                "Contact number must be a valid 10-digit Indian mobile number"
            )
    })
});

export const updateSaleVoucherSchema = z.object({
    body: z.object({
        items: z
            .array(saleItemSchema, {
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

        sales_id: z.coerce
            .number()
            .int()
            .positive("Sales ID must be a positive integer")
    })
});

export const getSaleVouchersSchema = z.object({
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

export const saleVoucherIdParamsSchema = z.object({
    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer"),

        sales_id: z.coerce
            .number()
            .int()
            .positive("Sales ID must be a positive integer")
    })
});
