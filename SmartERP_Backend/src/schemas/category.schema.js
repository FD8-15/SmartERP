import { z } from "zod";

export const createCategorySchema = z.object({
    body: z.object({
        category_name: z
            .string({
                required_error: "Category name is required",
                invalid_type_error: "Category name must be a string"
            })
            .trim()
            .min(2, "Category name must contain at least 2 characters")
            .max(255, "Category name cannot exceed 255 characters")
    }),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    })
});

export const updateCategorySchema = z.object({
    body: z.object({
        category_name: z
            .string({
                required_error: "Category name is required",
                invalid_type_error: "Category name must be a string"
            })
            .trim()
            .min(2, "Category name must contain at least 2 characters")
            .max(255, "Category name cannot exceed 255 characters")
    }),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer"),

        category_id: z.coerce
            .number()
            .int()
            .positive("Category ID must be a positive integer")
    })
});

export const getCategoriesSchema = z.object({
    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    })
});

export const categoryIdParamsSchema = z.object({
    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer"),

        category_id: z.coerce
            .number()
            .int()
            .positive("Category ID must be a positive integer")
    })
});
