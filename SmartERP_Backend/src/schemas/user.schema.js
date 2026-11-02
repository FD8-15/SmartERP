import { z } from "zod";

export const registerUserSchema = z.object({
    body: z.object({
        name: z
            .string({
                required_error: "Name is required",
                invalid_type_error: "Name must be a string"
            })
            .trim()
            .min(2, "Name must contain at least 2 characters")
            .max(100, "Name cannot exceed 100 characters"),

        email: z
            .string({
                required_error: "Email is required",
                invalid_type_error: "Email must be a string"
            })
            .trim()
            .email("Invalid email format"),

        password: z
            .string({
                required_error: "Password is required",
                invalid_type_error: "Password must be a string"
            })
            .min(6, "Password must contain at least 6 characters")
            .max(100, "Password cannot exceed 100 characters")
    })
});

export const loginUserSchema = z.object({
    body: z.object({
        email: z
            .string({
                required_error: "Email is required",
                invalid_type_error: "Email must be a string"
            })
            .trim()
            .email("Invalid email format"),

        password: z
            .string({
                required_error: "Password is required",
                invalid_type_error: "Password must be a string"
            })
            .min(1, "Password is required")
    })
});
