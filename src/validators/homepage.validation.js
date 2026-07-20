import { z } from "zod";

// ==================== ENUMS ====================
const pageTypeEnum = z.enum(["LANDING", "ABOUT_US", "COLLABORATE", "HOME"]);

// ==================== BASE SCHEMAS ====================

const baseSectionSchema = {
    page: pageTypeEnum,
    title: z.string({
        required_error: "Title is required",
    }).min(1, "Title is required").max(200, "Title too long"),
    subtitle: z.string().max(500, "Subtitle too long").optional().or(z.literal("")),
    description: z.string().max(5000, "Description too long").optional().or(z.literal("")),
    image: z.string().url("Invalid image URL").optional().or(z.literal("")),
    // Multiple images array for about page
    aboutImages: z.array(z.string().url("Invalid image URL")).optional().default([]),

    founderInfo: z.string().optional().or(z.literal("")),
    sportsProviderImg: z.string().url("Invalid image URL").optional().or(z.literal("")),
    sportsProviderDescription: z.string().optional().or(z.literal("")),
    supportImg: z.string().url("Invalid image URL").optional().or(z.literal("")),
    supportDescription: z.string().optional().or(z.literal("")),
    brandImg: z.string().url("Invalid image URL").optional().or(z.literal("")),
    brandDescription: z.string().optional().or(z.literal("")),

    sectionTitle: z.string().optional().nullable(),
    sectionSubTitle: z.string().optional().nullable(),
    sportTitle: z.string().optional().nullable(),
    sportSubTitle: z.string().optional().nullable()

};

// ==================== HOME SECTION SCHEMAS ====================

export const createSectionSchema = z.object(baseSectionSchema);

// Update section schema (all fields optional)
export const updateSectionSchema = z.object({
    page: pageTypeEnum.optional(),
    title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
    subtitle: z.string().max(500, "Subtitle too long").optional().or(z.literal("")),
    description: z.string().max(5000, "Description too long").optional().or(z.literal("")),
    image: z.string().url("Invalid image URL").optional().or(z.literal("")),
    aboutImages: z.array(z.string().url("Invalid image URL")).optional(),
    founderInfo: z.string().optional().or(z.literal("")),
    sportsProviderImg: z.string().url("Invalid image URL").optional().or(z.literal("")),
    sportsProviderDescription: z.string().optional().or(z.literal("")),
    supportImg: z.string().url("Invalid image URL").optional().or(z.literal("")),
    supportDescription: z.string().optional().or(z.literal("")),
    brandImg: z.string().url("Invalid image URL").optional().or(z.literal("")),
    brandDescription: z.string().optional().or(z.literal("")),
});

// ==================== CARD SCHEMAS ====================

const baseCardSchema = {

    title: z.string({
        required_error: "Title is required",
    }).min(1, "Title is required"),
    subtitle: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    image: z.string().url("Invalid image URL").optional().or(z.literal("")),

};

export const createCardSchema = z.object(baseCardSchema);
export const updateCardSchema = createCardSchema.partial();

// ==================== ID PARAM SCHEMA ====================

export const idParamSchema = z.object({
    id: z.string({
        required_error: "ID is required",
    }).uuid("Invalid ID format"),
});

// ==================== QUERY SCHEMAS ====================

export const getActiveSectionsQuerySchema = z.object({
    page: pageTypeEnum.optional(),
});

export const getAllSectionsQuerySchema = z.object({
    pageType: pageTypeEnum.optional(),
    isActive: z.union([z.string(), z.boolean()]).optional()
        .transform((val) => {
            if (val === undefined) return undefined;
            return val === "true" || val === true;
        }),
    page: z.union([z.string(), z.number()]).optional()
        .transform((val) => (val ? Number(val) : 1))
        .refine((val) => val >= 1, { message: "Page must be at least 1" }),
    limit: z.union([z.string(), z.number()]).optional()
        .transform((val) => (val ? Number(val) : 100))
        .refine((val) => val >= 1 && val <= 100, { message: "Limit must be between 1 and 100" }),
});

export const getAllCardsQuerySchema = z.object({
    sectionId: z.string().uuid("Invalid section ID format").optional(),
    isActive: z.union([z.string(), z.boolean()]).optional()
        .transform((val) => {
            if (val === undefined) return undefined;
            return val === "true" || val === true;
        }),
    page: z.union([z.string(), z.number()]).optional()
        .transform((val) => (val ? Number(val) : 1))
        .refine((val) => val >= 1, { message: "Page must be at least 1" }),
    limit: z.union([z.string(), z.number()]).optional()
        .transform((val) => (val ? Number(val) : 100))
        .refine((val) => val >= 1 && val <= 100, { message: "Limit must be between 1 and 100" }),
});