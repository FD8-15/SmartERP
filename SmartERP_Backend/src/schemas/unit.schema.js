import { z } from "zod";

export const createUnitSchema = z.object({
    body: z.object({
        unit_name: z
            .string({
                required_error: "Unit name is required",
                invalid_type_error: "Unit name must be a string"
            })
            .trim()
            .min(1, "Unit name is required")
            .max(50, "Unit name cannot exceed 50 characters")
    }),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    })
});

export const updateUnitSchema = z.object({
    body: z.object({
        unit_name: z
            .string({
                required_error: "Unit name is required",
                invalid_type_error: "Unit name must be a string"
            })
            .trim()
            .min(1, "Unit name is required")
            .max(50, "Unit name cannot exceed 50 characters")
    }),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer"),

        unit_id: z.coerce
            .number()
            .int()
            .positive("Unit ID must be a positive integer")
    })
});

export const getUnitsSchema = z.object({
    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    })
});

export const unitIdParamsSchema = z.object({
    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer"),

        unit_id: z.coerce
            .number()
            .int()
            .positive("Unit ID must be a positive integer")
    })
});
