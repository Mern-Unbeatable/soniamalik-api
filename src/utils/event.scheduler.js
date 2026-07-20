import schedule from "node-schedule";
import prisma from "../config/database.js";

let schedulerJob = null;

export function startEventScheduler() {
  console.log(" Starting Event Auto-Status Scheduler...");

  // Run every 5 minutes
  schedulerJob = schedule.scheduleJob("*/5 * * * *", async () => {
    try {
      console.log(" Running event status update...");
      await updateEventStatuses();
    } catch (error) {
      console.error(" Error updating event statuses:", error);
    }
  });

  // Also run immediately on startup
  updateEventStatuses();

  console.log(" Event Auto-Status Scheduler started successfully");
}

export function stopEventScheduler() {
  if (schedulerJob) {
    schedulerJob.cancel();
    console.log(" Event Auto-Status Scheduler stopped");
  }
}

async function updateEventStatuses() {
  const now = new Date();

  try {
    // 1. Update APPROVED events to UPCOMING (24 hours before start)
    const dayBeforeNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const approvedToUpcoming = await prisma.event.updateMany({
      where: {
        status: "APPROVED",
        startDate: {
          lte: dayBeforeNow,
        },
      },
      data: {
        status: "UPCOMING",
      },
    });

    if (approvedToUpcoming.count > 0) {
      console.log(
        `📅 Updated ${approvedToUpcoming.count} events from APPROVED to UPCOMING`,
      );
    }

    // 2. Update UPCOMING events to ONGOING (when start time is reached)
    const upcomingEvents = await prisma.event.findMany({
      where: {
        status: "UPCOMING",
        startDate: {
          lte: now,
        },
      },
    });

    for (const event of upcomingEvents) {
      // Check if startTime has passed
      const startDateTime = combineDateTime(event.startDate, event.startTime);

      if (now >= startDateTime) {
        await prisma.event.update({
          where: { id: event.id },
          data: { status: "ONGOING" },
        });
        console.log(`▶️ Event "${event.title}" started (UPCOMING -> ONGOING)`);
      }
    }

    // 3. Update ONGOING events to COMPLETED/PAST (when end time is passed)
    const ongoingEvents = await prisma.event.findMany({
      where: {
        status: "ONGOING",
      },
    });

    for (const event of ongoingEvents) {
      const endDateTime = combineDateTime(event.endDate, event.endTime);

      if (now >= endDateTime) {
        await prisma.event.update({
          where: { id: event.id },
          data: {
            status: "COMPLETED",
            isFeatured: false, // Remove from featured when completed
            featuredAt: null,
            featuredBy: null,
          },
        });
        console.log(
          `✅ Event "${event.title}" completed (ONGOING -> COMPLETED)`,
        );
      }
    }

    // 4. Update old APPROVED/UPCOMING events that missed the transition to PAST
    const missedEvents = await prisma.event.findMany({
      where: {
        status: {
          in: ["APPROVED", "UPCOMING"],
        },
        endDate: {
          lt: now,
        },
      },
    });

    for (const event of missedEvents) {
      const endDateTime = combineDateTime(event.endDate, event.endTime);

      if (now >= endDateTime) {
        await prisma.event.update({
          where: { id: event.id },
          data: {
            status: "PAST",
            isFeatured: false,
            featuredAt: null,
            featuredBy: null,
          },
        });
        console.log(
          `📦 Event "${event.title}" moved to PAST (missed transition)`,
        );
      }
    }

    // 5. Cleanup: Remove featured flag from PAST/COMPLETED/BANNED events
    const cleanupFeatured = await prisma.event.updateMany({
      where: {
        isFeatured: true,
        status: {
          in: ["PAST", "COMPLETED", "BANNED", "REJECTED", "CANCELLED"],
        },
      },
      data: {
        isFeatured: false,
        featuredAt: null,
        featuredBy: null,
      },
    });

    if (cleanupFeatured.count > 0) {
      console.log(
        `🧹 Removed featured flag from ${cleanupFeatured.count} inactive events`,
      );
    }
  } catch (error) {
    console.error("❌ Error in updateEventStatuses:", error);
    throw error;
  }
}

// Helper function to combine date and time strings into a Date object
function combineDateTime(dateString, timeString) {
  if (!dateString) return new Date();

  const date = new Date(dateString);

  if (timeString) {
    // Parse time string (e.g., "14:30:00" or "14:30")
    const timeParts = timeString.split(":");
    const hours = parseInt(timeParts[0]) || 0;
    const minutes = parseInt(timeParts[1]) || 0;
    const seconds = parseInt(timeParts[2]) || 0;

    date.setHours(hours, minutes, seconds);
  }

  return date;
}

// Manual trigger for testing
export async function triggerEventStatusUpdate() {
  console.log("🔧 Manual trigger: Updating event statuses...");
  await updateEventStatuses();
  console.log("✅ Manual update completed");
}

// | Time               | Status    |
// | ------------------ | --------- |
// | Event created      | APPROVED  |
// | 1 day before       | UPCOMING  |
// | Start time reached | ONGOING   |
// | End time passed    | COMPLETED |
// | Old/missed         | PAST      |
