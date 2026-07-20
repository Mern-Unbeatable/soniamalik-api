import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const OLD_DB_URL =
  "postgres://postgres:PCYEZEPFW711OHvatu8Agg6VrRZagzeepH3cYvRbY9WemxkEoelYGfVoIzle78Er@147.93.107.217:5533/postgres";
const NEW_DB_URL =
  "postgres://postgres:0WMzy3J38xMzw5tDT0lrcdmOWu1wC78XwdpFawJtCtaLnio5N5x465pXOIl2qWem@187.127.164.72:5534/postgres";

const oldDB = new PrismaClient({ datasources: { db: { url: OLD_DB_URL } } });
const newDB = new PrismaClient({ datasources: { db: { url: NEW_DB_URL } } });

async function copyTable(label, records, insertFn) {
  console.log(`Migrating ${label}... (${records.length} records)`);
  if (records.length > 0) {
    await insertFn(records);
  }
  console.log(`✅ ${label} migrated\n`);
}

async function migrateData() {
  // ── Step 1: push current schema to the new database ─────────────────────
  // prisma db push --force-reset drops all tables then recreates from schema.
  // This bypasses migration history conflicts caused by 0_init containing the
  // full schema while subsequent migrations add the same columns again.
  console.log("🔄 Pushing schema to new database (force-reset)...");
  try {
    execSync("npx prisma db push --force-reset --accept-data-loss", {
      env: { ...process.env, DATABASE_URL: NEW_DB_URL },
      stdio: "inherit",
      cwd: process.cwd(),
    });
    console.log("✅ Schema pushed to new database\n");
  } catch (err) {
    console.error("❌ prisma db push failed:", err.message);
    process.exit(1);
  }

  // ── Step 2: connect to both databases ────────────────────────────────────
  console.log("🔗 Connecting to both databases...");
  await oldDB.$connect();
  await newDB.$connect();
  console.log("✅ Connected\n");

  try {
    console.log("📦 Starting table-by-table data copy...\n");

    // ── Layer 1: no foreign-key dependencies ──────────────────────────────

    // users
    const users = await oldDB.user.findMany();
    await copyTable("Users", users, (rows) =>
      newDB.user.createMany({ data: rows, skipDuplicates: true }),
    );

    // system_settings
    const settings = await oldDB.systemSetting.findMany();
    await copyTable("SystemSettings", settings, (rows) =>
      newDB.systemSetting.createMany({ data: rows, skipDuplicates: true }),
    );

    // home_sections
    const homeSections = await oldDB.homeSection.findMany();
    await copyTable("HomeSections", homeSections, (rows) =>
      newDB.homeSection.createMany({ data: rows, skipDuplicates: true }),
    );

    // ── Layer 2: depend on Layer 1 ────────────────────────────────────────

    // clubs (depends on users)
    const clubs = await oldDB.club.findMany();
    await copyTable("Clubs", clubs, (rows) =>
      newDB.club.createMany({ data: rows, skipDuplicates: true }),
    );

    // events (depends on users)
    const events = await oldDB.event.findMany();
    await copyTable("Events", events, (rows) =>
      newDB.event.createMany({ data: rows, skipDuplicates: true }),
    );

    // products (depends on users)
    const products = await oldDB.product.findMany();
    await copyTable("Products", products, (rows) =>
      newDB.product.createMany({ data: rows, skipDuplicates: true }),
    );

    // orders (depends on users)
    const orders = await oldDB.order.findMany();
    await copyTable("Orders", orders, (rows) =>
      newDB.order.createMany({ data: rows, skipDuplicates: true }),
    );

    // services (depends on users)
    const services = await oldDB.service.findMany();
    await copyTable("Services", services, (rows) =>
      newDB.service.createMany({ data: rows, skipDuplicates: true }),
    );

    // threads (depends on users)
    const threads = await oldDB.thread.findMany();
    await copyTable("Threads", threads, (rows) =>
      newDB.thread.createMany({ data: rows, skipDuplicates: true }),
    );

    // recruitments (depends on users)
    const recruitments = await oldDB.recruitment.findMany();
    await copyTable("Recruitments", recruitments, (rows) =>
      newDB.recruitment.createMany({ data: rows, skipDuplicates: true }),
    );

    // news (depends on users)
    const news = await oldDB.news.findMany();
    await copyTable("News", news, (rows) =>
      newDB.news.createMany({ data: rows, skipDuplicates: true }),
    );

    // community_posts (depends on users)
    const communityPosts = await oldDB.communityPost.findMany();
    await copyTable("CommunityPosts", communityPosts, (rows) =>
      newDB.communityPost.createMany({ data: rows, skipDuplicates: true }),
    );

    // cards (depends on home_sections)
    const cards = await oldDB.card.findMany();
    await copyTable("Cards", cards, (rows) =>
      newDB.card.createMany({ data: rows, skipDuplicates: true }),
    );

    // ── Layer 3: depend on Layer 2 ────────────────────────────────────────

    // event_registrations (depends on events, users)
    const eventRegistrations = await oldDB.eventRegistration.findMany();
    await copyTable("EventRegistrations", eventRegistrations, (rows) =>
      newDB.eventRegistration.createMany({ data: rows, skipDuplicates: true }),
    );

    // event_analytics (depends on events)
    const eventAnalytics = await oldDB.eventAnalytics.findMany();
    await copyTable("EventAnalytics", eventAnalytics, (rows) =>
      newDB.eventAnalytics.createMany({ data: rows, skipDuplicates: true }),
    );

    // event_messages (depends on events, users)
    const eventMessages = await oldDB.eventMessage.findMany();
    await copyTable("EventMessages", eventMessages, (rows) =>
      newDB.eventMessage.createMany({ data: rows, skipDuplicates: true }),
    );

    // order_items (depends on orders, products)
    const orderItems = await oldDB.orderItem.findMany();
    await copyTable("OrderItems", orderItems, (rows) =>
      newDB.orderItem.createMany({ data: rows, skipDuplicates: true }),
    );

    // service_bookings (depends on services, users)
    const serviceBookings = await oldDB.serviceBooking.findMany();
    await copyTable("ServiceBookings", serviceBookings, (rows) =>
      newDB.serviceBooking.createMany({ data: rows, skipDuplicates: true }),
    );

    // service_messages (depends on services, users)
    const serviceMessages = await oldDB.serviceMessage.findMany();
    await copyTable("ServiceMessages", serviceMessages, (rows) =>
      newDB.serviceMessage.createMany({ data: rows, skipDuplicates: true }),
    );

    // service_analytics (depends on services)
    const serviceAnalytics = await oldDB.serviceAnalytics.findMany();
    await copyTable("ServiceAnalytics", serviceAnalytics, (rows) =>
      newDB.serviceAnalytics.createMany({ data: rows, skipDuplicates: true }),
    );

    // thread_replies (depends on threads, users)
    const threadReplies = await oldDB.threadReply.findMany();
    await copyTable("ThreadReplies", threadReplies, (rows) =>
      newDB.threadReply.createMany({ data: rows, skipDuplicates: true }),
    );

    // recruitment_applications (depends on recruitments)
    const recruitmentApplications =
      await oldDB.recruitmentApplication.findMany();
    await copyTable(
      "RecruitmentApplications",
      recruitmentApplications,
      (rows) =>
        newDB.recruitmentApplication.createMany({
          data: rows,
          skipDuplicates: true,
        }),
    );

    // post_likes (depends on community_posts, users)
    const postLikes = await oldDB.postLike.findMany();
    await copyTable("PostLikes", postLikes, (rows) =>
      newDB.postLike.createMany({ data: rows, skipDuplicates: true }),
    );

    // post_comments (self-referential: parentId → post_comments.id)
    // Insert all rows with parentId = null first, then restore parentId
    const postComments = await oldDB.postComment.findMany();
    console.log(`Migrating PostComments... (${postComments.length} records)`);
    if (postComments.length > 0) {
      // Pass 1: insert without parentId to avoid FK cycles
      await newDB.postComment.createMany({
        data: postComments.map(({ parentId: _skip, ...rest }) => ({
          ...rest,
          parentId: null,
        })),
        skipDuplicates: true,
      });
      // Pass 2: restore parentId for child comments
      const children = postComments.filter((c) => c.parentId !== null);
      for (const c of children) {
        await newDB.postComment.update({
          where: { id: c.id },
          data: { parentId: c.parentId },
        });
      }
    }
    console.log("✅ PostComments migrated\n");

    console.log("🎉 Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await oldDB.$disconnect();
    await newDB.$disconnect();
    console.log("🔌 Disconnected from both databases");
  }
}

migrateData().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
