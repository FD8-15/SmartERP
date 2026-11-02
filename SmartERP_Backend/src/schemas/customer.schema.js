import { z } from "zod";

const customerFields = {
    name: z
        .string({
            required_error: "Customer name is required",
            invalid_type_error: "Customer name must be a string"
        })
        .trim()
        .min(2, "Customer name must contain at least 2 characters")
        .max(255, "Customer name cannot exceed 255 characters"),

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
};

export const createCustomerSchema = z.object({
    body: z.object({
        ...customerFields
    }),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    })
});

export const updateCustomerSchema = z.object({
    body: z.object({
        ...customerFields
    }),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer"),

        customer_id: z.coerce
            .number()
            .int()
            .positive("Customer ID must be a positive integer")
    })
});

export const getCustomersSchema = z.object({
    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    }),

    query: z
        .object({
            search: z.string().trim().optional(),
            page: z.coerce.number().int().positive().optional(),
            limit: z.coerce.number().int().positive().optional()
        })
        .optional()
});

export const getOneCustomerSchema = z.object({
    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer"),

        customer_id: z.coerce
            .number()
            .int()
            .positive("Customer ID must be a positive integer")
    })
});
