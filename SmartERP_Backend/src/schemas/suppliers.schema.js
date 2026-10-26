import { z } from "zod";

const supplierFields = {
    name: z
        .string()
        .trim()
        .min(2, "Supplier name must contain at least 2 characters")
        .max(255, "Supplier name cannot exceed 255 characters"),

    contact_no: z
        .string()
        .regex(
            /^[6-9]\d{9}$/,
            "Contact number must be a valid 10-digit Indian mobile number"
        ),

    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .max(255, "Email cannot exceed 255 characters"),

    address: z
        .string()
        .trim()
        .min(1, "Address is required")
        .max(255, "Address cannot exceed 255 characters"),

    gst_no: z
        .string()
        .trim()
        .length(15, "GST number must contain exactly 15 characters")
        .regex(
            /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/,
            "Invalid GST number format"
        )
};

export const createSupplierSchema = z.object({
    body: z.object({
        ...supplierFields
    }),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    })
});

export const updateSupplierSchema = z.object({
    body: z.object({
        ...supplierFields
    }),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer"),

        supplier_id: z.coerce
            .number()
            .int()
            .positive("Supplier ID must be a positive integer")
    })
});

