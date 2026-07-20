import { z } from "zod";

export const createContactSchema = z.object({
    name: z.string({
        required_error: "Name is required"
    }).min(1, "Name cannot be empty"),

    email: z.string({
        required_error: "Email is required"
    }).email("Invalid email format"),

    subject: z.string({
        required_error: "Subject is required"
    }).min(1, "Subject cannot be empty"),

    message: z.string({
        required_error: "Message is required"
    }).min(1, "Message cannot be empty")
});