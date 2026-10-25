import { z } from "zod";

const itemFields = {
    item_name: z
        .string()
        .trim()
        .min(2, "Item name must contain at least 2 characters"),

    sku: z
        .string()
        .trim()
        .min(1, "SKU is required"),

    brand: z
        .string()
        .trim()
        .min(1, "Brand is required"),

    category_id: z.coerce
        .number()
        .int()
        .positive("Category ID must be a positive integer"),

    unit_id: z.coerce
        .number()
        .int()
        .positive("Unit ID must be a positive integer"),

    gst_percentage: z.coerce
        .number()
        .min(0, "GST percentage cannot be negative"),

    default_purchase_price: z.coerce
        .number()
        .min(0, "Purchase price cannot be negative"),

    default_selling_price: z.coerce
        .number()
        .min(0, "Selling price cannot be negative"),

    status: z
        .string()
        .trim()
        .min(1, "Status is required")
};

export const createItemSchema = z.object({
    body: z.object({
        ...itemFields,

        current_quantity: z.coerce
            .number()
            .min(0, "Current quantity cannot be negative")
    }),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer")
    })
});

export const updateItemSchema = z.object({
    body: z.object(itemFields),

    params: z.object({
        company_id: z.coerce
            .number()
            .int()
            .positive("Company ID must be a positive integer"),

        item_id: z.coerce
            .number()
            .int()
            .positive("Item ID must be a positive integer")
    })
});

