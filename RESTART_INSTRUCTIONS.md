# Server Restart Instructions

## ✅ Changes Applied

The database schema has been successfully updated to make `eventId` optional in the `EventRegistration` model. This allows brand notifications to work without an associated event.

## 🔧 What Changed

**File:** `prisma/schema.prisma`

```prisma
model EventRegistration {
    id            String   @id @default(uuid())
    eventId       String?  // ← Now optional (was required)
    event         Event?   @relation(...) // ← Now optional
    // ... rest of fields
}
```

**Database:** The column `eventId` in `event_registrations` table is now nullable.

## 🚀 Next Steps

To apply these changes to your running server:

### Option 1: Restart the Server (Recommended)

1. Stop the current server (Ctrl+C in the terminal)
2. Run: `npx prisma generate`
3. Run: `npm run dev`

### Option 2: Quick Restart Without Generation

Just restart the server (Ctrl+C then `npm run dev`). The database is already updated.

## 🧪 Test Brand Notification

After restart, try the brand notification endpoint:

```bash
POST /api/brands/notify
Headers: Authorization: Bearer YOUR_TOKEN
Body: {} # Empty body - automatic!
```

Expected response:

```json
{
  "success": true,
  "message": "Thank you! We'll notify you when new brands become available in the marketplace"
}
```

## 📋 Migration Details

- **Migration File:** `20260414143000_make_eventid_optional_for_brand_notifications/migration.sql`
- **SQL Executed:** `ALTER TABLE "event_registrations" ALTER COLUMN "eventId" DROP NOT NULL;`
- **Status:** ✅ Successfully applied to database

---

**Note:** The Prisma client couldn't be regenerated while the server was running, but the database schema is already updated. A simple server restart will resolve this.
