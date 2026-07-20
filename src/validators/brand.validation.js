import { z } from "zod";

export const createBrandSchema = z.object({
    name: z.string({
        required_error: "Brand name is required"
    }).min(1, "Brand name cannot be empty"),

    email: z.string({
        required_error: "Email is required"
    }).email("Invalid email format"),

    phone: z.string({
        required_error: "Phone number is required"
    }).min(1, "Phone number cannot be empty"),

    postCode: z.string({
        required_error: "Post code is required"
    }).min(1, "Post code cannot be empty"),

    businessname: z.string({
        required_error: "Business name is required"
    }).min(1, "Business name cannot be empty"),

    offer: z.string({
        required_error: "Offer is required"
    }).min(1, "Offer cannot be empty"),

    socialMediaLinks: z.string({
        required_error: "Social media links are required"
    }).min(1, "Social media links cannot be empty"),

    message: z.string({
        required_error: "Message is required"
    }).min(1, "Message cannot be empty")
});

export const updateBrandSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    postCode: z.string().optional(),
    businessname: z.string().optional(),
    offer: z.string().optional(),
    socialMediaLinks: z.string().optional(),
    message: z.string().optional()
});