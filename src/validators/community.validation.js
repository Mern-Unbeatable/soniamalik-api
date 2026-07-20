import { z } from "zod";

export const createPostSchema = z.object({
    title: z.string().min(1, "Title is required").min(3, "Title must be at least 3 characters"),
    description: z.string().min(1, "Description is required").min(10, "Description must be at least 10 characters"),

    category: z.enum(["STORIES", "QUESTIONS", "SUPPORT"], {
        errorMap: () => ({ message: "Category must be STORIES, QUESTIONS, or SUPPORT" })
    }),

    sport: z.string().optional(),
    tags: z.array(z.string()).optional(),
    // SUPPORT category specific fields
    location: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    helpType: z.enum(["Sub", "Referee", "Player Cover", "Volunteer", "Other"]).optional(),
}).refine((data) => {
    // If category is SUPPORT, validate required fields
    if (data.category === "SUPPORT") {
        if (!data.location) return false;
        if (!data.date) return false;
        if (!data.time) return false;
        if (!data.helpType) return false;
    }
    return true;

}, {
    message: "SUPPORT posts require location, date, time, and helpType fields",
    path: ["category"],
});

export const updatePostSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    sport: z.string().optional(),
    tags: z.array(z.string()).optional(),
    location: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    helpType: z.string().optional(),
});

export const createCommentSchema = z.object({
    content: z.string().min(1, "Comment content is required").trim(),
});

export const updateCommentSchema = z.object({
    content: z.string().min(1, "Comment content is required").trim(),
});

export const createReplySchema = z.object({
    content: z.string().min(1, "Reply content is required").trim(),
});

export const updateReplySchema = z.object({
    content: z.string().min(1, "Reply content is required").trim(),
});