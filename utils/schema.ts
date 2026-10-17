import { z } from "zod";
import { commonValidations } from "./validation";

// Registration schema
export const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters"),

  phone: z
    .string()
    .trim()
    .min(8, "Phone number must be at least 8 characters")
    .max(20, "Phone number must not exceed 20 characters"),

  email: commonValidations.email,
  password: commonValidations.password,
});

// Login schema
export const loginSchema = z.object({
  email: commonValidations.email,
  password: z.string().min(1, "Password is required"),
});

// Generic schema for backward compatibility
const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

export default schema;