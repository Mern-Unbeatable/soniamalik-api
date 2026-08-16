import cron from "node-cron";
import prisma from "../config/database.js";

let eventStatusTask = null;
let isRunning = false;

function parseTimeString(timeValue) {
    if (!timeValue || typeof timeValue !== "string") {
        return null;
    }

    const raw = timeValue.trim().toLowerCase();
    if (!raw) {
        return null;
    }

    // Handle 12-hour format with AM/PM (e.g., "2:30 PM", "2 PM", "02:30pm")
    const twelveHourMatch = raw.match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*(am|pm)$/);
    if (twelveHourMatch) {
        let hour = parseInt(twelveHourMatch[1], 10);
        const minute = parseInt(twelveHourMatch[2] || "0", 10);
        const second = parseInt(twelveHourMatch[3] || "0", 10);
        const meridiem = twelveHourMatch[4];

        if (isNaN(hour) || isNaN(minute) || isNaN(second)) {
            return null;
        }

        if (hour < 1 || hour > 12 || minute < 0 || minute > 59 || second < 0 || second > 59) {
            return null;
        }

        // Convert 12-hour to 24-hour
        if (meridiem === "am") {
            if (hour === 12) hour = 0;
        } else { // pm
            if (hour !== 12) hour += 12;
        }

        return { hour, minute, second };
    }

    // Handle 24-hour format (e.g., "14:30", "14:30:15", "8:32")
    const twentyFourHourMatch = raw.match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?$/);
    if (twentyFourHourMatch) {
        const hour = parseInt(twentyFourHourMatch[1], 10);
        const minute = parseInt(twentyFourHourMatch[2] || "0", 10);
        const second = parseInt(twentyFourHourMatch[3] || "0", 10);

        if (isNaN(hour) || isNaN(minute) || isNaN(second)) {
            return null;
        }

        if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
            return null;
        }

        return { hour, minute, second };
    }

    return null;
}

function combineDateTime(dateValue, timeValue, fallbackToEndOfDay = false) {
    if (!dateValue) {
        return null;
    }

    const sourceDate = new Date(dateValue);
    if (isNaN(sourceDate.getTime())) {
        return null;
    }

    // Extract date components in UTC to avoid timezone issues
    const year = sourceDate.getUTCFullYear();
    const month = sourceDate.getUTCMonth();
    const day = sourceDate.getUTCDate();

    const parsedTime = parseTimeString(timeValue);
    if (parsedTime) {
        // Create UTC date with the parsed time
        return new Date(Date.UTC(year, month, day, parsedTime.hour, parsedTime.minute, parsedTime.second, 0));
    }

    // If no time provided, use defaults
    if (fallbackToEndOfDay) {
        // For end date without time, use end of day (23:59:59.999)
        return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    }

    // For start date without time, use start of day (00:00:00.000)
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

async function runEventStatusUpdate() {
    if (isRunning) {
        return;
    }

    isRunning = true;

    try {
        const now = new Date();

        // Get all active events that need status updates
        const candidates = await prisma.event.findMany({
            where: {
                isApproved: true,
                status: {
                    in: ["APPROVED", "UPCOMING", "ONGOING"],
                },
            },
            select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                startTime: true,
                endDate: true,
                endTime: true,
            },
        });

        let updatedCount = 0;
        let completedCount = 0;
        let ongoingCount = 0;
        let upcomingCount = 0;

        for (const event of candidates) {
            // Combine date and time with proper timezone handling
            const startDateTime = combineDateTime(event.startDate, event.startTime);
            const endDateTime = combineDateTime(event.endDate, event.endTime, true);

            if (!startDateTime || !endDateTime) {
                continue;
            }

            let nextStatus = event.status;

            // Check if event is completed
            if (now.getTime() >= endDateTime.getTime()) {
                nextStatus = "COMPLETED";
                completedCount++;
            }
            // Check if event is ongoing (started but not ended)
            else if (now.getTime() >= startDateTime.getTime() && now.getTime() < endDateTime.getTime()) {
                nextStatus = "ONGOING";
                ongoingCount++;
            }
            // Check if event is upcoming (not started yet)
            else if (now.getTime() < startDateTime.getTime()) {
                nextStatus = "UPCOMING";
                upcomingCount++;
            }

            // Update status if changed
            if (nextStatus !== event.status) {
                const updateData = {
                    status: nextStatus,
                };

                // If event is completed, remove featured status
                if (nextStatus === "COMPLETED") {
                    updateData.isFeatured = false;
                    updateData.featuredAt = null;
                    updateData.featuredBy = null;
                }

                await prisma.event.update({
                    where: { id: event.id },
                    data: updateData,
                });

                updatedCount += 1;
            }
        }

        // Cleanup featured events that shouldn't be featured anymore
        const cleanupFeatured = await prisma.event.updateMany({
            where: {
                isFeatured: true,
                status: {
                    in: ["COMPLETED", "PAST", "BANNED", "REJECTED", "CANCELLED"],
                },
            },
            data: {
                isFeatured: false,
                featuredAt: null,
                featuredBy: null,
            },
        });

        if (updatedCount > 0 || cleanupFeatured.count > 0) {
            console.log(
                `Event status cron executed: ` +
                `updated=${updatedCount} ` +
                `(completed=${completedCount}, ongoing=${ongoingCount}, upcoming=${upcomingCount}), ` +
                `featuredCleanup=${cleanupFeatured.count}`
            );
        } else {
            console.log("Event status cron: No changes needed");
        }
    } catch (err) {
        console.error("Event status cron failed:", err);
    } finally {
        isRunning = false;
    }
}

export const startEventStatusCron = () => {
    if (eventStatusTask) {
        return;
    }

    // Run every minute for near real-time status transitions
    eventStatusTask = cron.schedule("* * * * *", runEventStatusUpdate, {
        scheduled: true,
        timezone: "UTC",
    });

    // Run immediately on startup
    runEventStatusUpdate();
};

export const stopEventStatusCron = () => {
    if (eventStatusTask) {
        eventStatusTask.stop();
        eventStatusTask = null;
    }
};