import { z } from "zod";

const companyBodyFields = {
    company_name: z
        .string({
            required_error: "Company name is required",
            invalid_type_error: "Company name must be a string"
        })
        .trim()
        .min(2, "Company name must contain at least 2 characters")
        .max(255, "Company name cannot exceed 255 characters"),

    email: z
        .string({
            required_error: "Email is required",
            invalid_type_error: "Email must be a string"
        })
        .trim()
        .email("Invalid email format"),

    address: z
        .string({
            required_error: "Address is required",
            invalid_type_error: "Address must be a string"
        })
        .trim()
        .min(1, "Address is required")
        .max(500, "Address cannot exceed 500 characters"),

    contact_number: z
        .string({
            required_error: "Contact number is required",
            invalid_type_error: "Contact number must be a string"
        })
        .trim()
        .regex(/^[6-9]\d{9}$/, "Contact number must be a valid 10-digit Indian phone number"),

    state: z
        .string({
            required_error: "State is required",
            invalid_type_error: "State must be a string"
        })
        .trim()
        .min(2, "State must contain at least 2 characters")
        .max(100, "State cannot exceed 100 characters"),

    gst_no: z
        .string({
            required_error: "GST number is required",
            invalid_type_error: "GST number must be a string"
        })
        .trim()
        .regex(
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
            "Invalid GST number format"
        ),

    financial_year_start: z
        .string({
            required_error: "Financial year start is required",
            invalid_type_error: "Financial year start must be a string"
        })
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),

    financial_year_end: z
        .string({
            required_error: "Financial year end is required",
            invalid_type_error: "Financial year end must be a string"
        })
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD")
};

export const createCompanySchema = z.object({
    body: z.object(companyBodyFields).refine(
        (data) => new Date(data.financial_year_end) >= new Date(data.financial_year_start),
        {
            message: "Financial year end must be after or equal to financial year start",
            path: ["financial_year_end"]
        }
    )
});

export const updateCompanySchema = z.object({
    body: z.object({
        ...companyBodyFields,
        company_id: z.coerce.number().int().positive().optional()
    }).refine(
        (data) => new Date(data.financial_year_end) >= new Date(data.financial_year_start),
        {
            message: "Financial year end must be after or equal to financial year start",
            path: ["financial_year_end"]
        }
    ),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    })
});

export const companyIdParamsSchema = z.object({
    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    })
});

export const addUserToCompanySchema = z.object({
    body: z.object({
        email: z
            .string({
                required_error: "Email is required",
                invalid_type_error: "Email must be a string"
            })
            .trim()
            .email("Invalid email format"),

        role: z
            .string({
                required_error: "Role is required",
                invalid_type_error: "Role must be a string"
            })
            .trim()
            .toLowerCase()
            .pipe(
                z.enum(["manager", "employee"], {
                    errorMap: () => ({ message: "Role must be manager or employee" })
                })
            )
    }),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    })
});
