import { z } from "zod";

export const createInterestRequestSchema = z.object({
    sportName: z.string().min(1, "Sport name is required"),
    otherSportName: z.string().optional().nullable(),
    level: z.enum(["NEW_TO_SPORT", "SOME_EXPERIENCE", "REGULAR_PLAYER", "COMPETITIVE"]),
    preferredDays: z.array(z.enum(["WEEKDAY_EVENINGS", "WEEKDAY_DAYTIME", "SATURDAY", "SUNDAY", "FLEXIBLE"])),
    preference: z.enum(["WOMEN_ONLY", "MIXED", "NO_PREFERENCE"]),
    wantToHelpStart: z.boolean().default(false)
});

export const updateRequestStatusSchema = z.object({
    status: z.enum(["PENDING", "CONTACTED", "RESOLVED"]),
    adminNotes: z.string().optional().nullable()
});
