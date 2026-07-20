# Events Database Migration Guide

This guide will help you apply the database schema changes for the enhanced Events system.

## Schema Changes

The following changes have been made to the Event and EventRegistration models:

### Event Model Changes:
- ✅ Added `sportType` (String) - Sport type like Football, Cricket, etc.
- ✅ Added `startTime` (String) - Event start time (HH:MM format)
- ✅ Added `endTime` (String) - Event end time (HH:MM format)
- ✅ Added `venueName` (String) - Venue name
- ✅ Added `city` (String) - City where event is located
- ✅ Added `fullAddress` (Text) - Complete address
- ✅ Added `googleMapLink` (String, optional) - Google Maps link
- ✅ Added `minAge` (Int, optional) - Minimum age requirement
- ✅ Added `skillLevel` (Enum) - BEGINNER, INTERMEDIATE, ADVANCED, ALL_LEVELS
- ✅ Added `organizerName` (String) - Organizer name
- ✅ Added `organizerPhone` (String) - Organizer phone
- ✅ Added `organizerEmail` (String) - Organizer email
- ✅ Added `isApproved` (Boolean) - Approval flag (default: false)
- ✅ Added `rejectionReason` (Text, optional) - Reason if rejected
- ✅ Changed `status` enum - Added PENDING, APPROVED, REJECTED, removed PENDING
- ✅ Changed `eventType` enum - Added MATCH, TRIAL
- ✅ Removed `location` field (replaced by fullAddress and city)
- ✅ Removed `isPublished` field (replaced by isApproved)

### EventRegistration Model Changes:
- ✅ Made `userId` optional (String?) - Support non-authenticated registrations
- ✅ Added `fullName` (String) - Participant name
- ✅ Added `email` (String) - Participant email
- ✅ Added `phoneNumber` (String) - Participant phone
- ✅ Added `status` (String) - Registration status (pending, confirmed, cancelled)
- ✅ Added `notes` (Text, optional) - Additional notes
- ✅ Added `createdAt` and `updatedAt` timestamps
- ✅ Removed unique constraint on `eventId_userId` (to support multiple anonymous registrations)

### New Enum Types:
- ✅ Added `SkillLevel` enum (BEGINNER, INTERMEDIATE, ADVANCED, ALL_LEVELS)

---

## Migration Methods

You have two options to apply these changes:

### Option 1: Using Prisma DB Push (Recommended for Development)

This method directly pushes schema changes to the database without creating migration files.

```bash
cd soniamalikbackend
npx prisma db push
```

**Pros:**
- Quick and simple
- No migration files to manage

**Cons:**
- No migration history
- Not recommended for production

---

### Option 2: Using Prisma Migrate (Recommended for Production)

This method creates migration files that can be version controlled.

#### Step 1: Create Migration

```bash
cd soniamalikbackend
npx prisma migrate dev --name update_events_with_enhanced_fields
```

If you encounter shadow database issues, try:

```bash
npx prisma migrate dev --name update_events_with_enhanced_fields --create-only
```

This creates the migration file without applying it.

#### Step 2: Review Migration

Check the generated migration file in:
```
prisma/migrations/[timestamp]_update_events_with_enhanced_fields/migration.sql
```

#### Step 3: Apply Migration

For development:
```bash
npx prisma migrate dev
```

For production:
```bash
npx prisma migrate deploy
```

---

## Manual Migration SQL

If automated migration fails, you can run this SQL manually:

```sql
-- Step 1: Add new enum type for SkillLevel
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS');

-- Step 2: Update EventStatus enum
-- First, add new values
ALTER TYPE "EventStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "EventStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "EventStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Step 3: Update EventType enum
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'MATCH';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'TRIAL';

-- Step 4: Add new columns to events table
ALTER TABLE "events" 
  ADD COLUMN IF NOT EXISTS "sportType" TEXT NOT NULL DEFAULT 'Football',
  ADD COLUMN IF NOT EXISTS "startTime" TEXT NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS "endTime" TEXT NOT NULL DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS "venueName" TEXT NOT NULL DEFAULT 'TBA',
  ADD COLUMN IF NOT EXISTS "city" TEXT NOT NULL DEFAULT 'London',
  ADD COLUMN IF NOT EXISTS "fullAddress" TEXT NOT NULL DEFAULT 'TBA',
  ADD COLUMN IF NOT EXISTS "googleMapLink" TEXT,
  ADD COLUMN IF NOT EXISTS "minAge" INTEGER,
  ADD COLUMN IF NOT EXISTS "skillLevel" "SkillLevel" NOT NULL DEFAULT 'ALL_LEVELS',
  ADD COLUMN IF NOT EXISTS "organizerName" TEXT NOT NULL DEFAULT 'Organizer',
  ADD COLUMN IF NOT EXISTS "organizerPhone" TEXT NOT NULL DEFAULT '+0000000000',
  ADD COLUMN IF NOT EXISTS "organizerEmail" TEXT NOT NULL DEFAULT 'organizer@example.com',
  ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Step 5: Drop old columns from events table (if they exist)
ALTER TABLE "events" 
  DROP COLUMN IF EXISTS "location",
  DROP COLUMN IF EXISTS "isPublished";

-- Step 6: Update existing events to new status values
UPDATE "events" 
SET "status" = 'PENDING' 
WHERE "status" = 'PENDING';

-- Step 7: Remove unique constraint on event_registrations
-- (This will be replaced by allowing multiple anonymous registrations)
ALTER TABLE "event_registrations" 
  DROP CONSTRAINT IF EXISTS "event_registrations_eventId_userId_key";

-- Step 8: Make userId nullable and add new fields to event_registrations
ALTER TABLE "event_registrations"
  ALTER COLUMN "userId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "fullName" TEXT NOT NULL DEFAULT 'Anonymous',
  ADD COLUMN IF NOT EXISTS "email" TEXT NOT NULL DEFAULT 'anonymous@example.com',
  ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT NOT NULL DEFAULT '+0000000000',
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 9: Remove defaults after initial data is populated
ALTER TABLE "events" 
  ALTER COLUMN "sportType" DROP DEFAULT,
  ALTER COLUMN "startTime" DROP DEFAULT,
  ALTER COLUMN "endTime" DROP DEFAULT,
  ALTER COLUMN "venueName" DROP DEFAULT,
  ALTER COLUMN "city" DROP DEFAULT,
  ALTER COLUMN "fullAddress" DROP DEFAULT,
  ALTER COLUMN "organizerName" DROP DEFAULT,
  ALTER COLUMN "organizerPhone" DROP DEFAULT,
  ALTER COLUMN "organizerEmail" DROP DEFAULT;

ALTER TABLE "event_registrations"
  ALTER COLUMN "fullName" DROP DEFAULT,
  ALTER COLUMN "email" DROP DEFAULT,
  ALTER COLUMN "phoneNumber" DROP DEFAULT;
```

---

## Verification Steps

After applying the migration, verify the changes:

### 1. Check Prisma Client is Updated

```bash
npx prisma generate
```

### 2. Verify Database Schema

Connect to your database and run:

```sql
-- Check events table structure
\d events

-- Check event_registrations table structure  
\d event_registrations

-- Check enum types
\dT+ "SkillLevel"
\dT+ "EventStatus"
\dT+ "EventType"
```

### 3. Test API Endpoints

1. **Create a test event:**
   ```bash
   POST /api/events
   # Include all new required fields
   ```

2. **Check the response:**
   - Verify `sportType`, `city`, `venueName`, etc. are saved
   - Verify `status` is `PENDING`
   - Verify `isApproved` is `false`

3. **Test approval:**
   ```bash
   PATCH /api/events/:id/approval-status
   Body: { "action": "approve" }
   ```

4. **Test registration:**
   ```bash
   POST /api/events/:id/register
   Body: { "fullName": "Test", "email": "test@test.com", "phoneNumber": "+123" }
   ```

---

## Rollback (If Needed)

If you need to rollback the migration:

### Using Prisma Migrate

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back [migration_name]

# Or reset entire database (⚠️ CAUTION: Deletes all data)
npx prisma migrate reset
```

### Manual Rollback SQL

```sql
-- Remove new columns
ALTER TABLE "events" 
  DROP COLUMN IF EXISTS "sportType",
  DROP COLUMN IF EXISTS "startTime",
  DROP COLUMN IF EXISTS "endTime",
  DROP COLUMN IF EXISTS "venueName",
  DROP COLUMN IF EXISTS "city",
  DROP COLUMN IF EXISTS "fullAddress",
  DROP COLUMN IF EXISTS "googleMapLink",
  DROP COLUMN IF EXISTS "minAge",
  DROP COLUMN IF EXISTS "skillLevel",
  DROP COLUMN IF EXISTS "organizerName",
  DROP COLUMN IF EXISTS ("organizerPhone"),
  DROP COLUMN IF EXISTS "organizerEmail",
  DROP COLUMN IF EXISTS "isApproved",
  DROP COLUMN IF EXISTS "rejectionReason";

-- Add back old columns
ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT false;

-- Revert event_registrations
ALTER TABLE "event_registrations"
  ALTER COLUMN "userId" SET NOT NULL,
  DROP COLUMN IF EXISTS "fullName",
  DROP COLUMN IF EXISTS "email",
  DROP COLUMN IF EXISTS "phoneNumber",
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "notes",
  DROP COLUMN IF EXISTS "createdAt",
  DROP COLUMN IF EXISTS "updatedAt";

-- Recreate unique constraint
ALTER TABLE "event_registrations"
  ADD CONSTRAINT "event_registrations_eventId_userId_key" UNIQUE ("eventId", "userId");

-- Drop new enums (cannot be done if in use)
-- DROP TYPE IF EXISTS "SkillLevel";
```

---

## Troubleshooting

### Issue: "Column already exists"

**Solution:** Some columns may already exist. The migration SQL uses `IF NOT EXISTS` to handle this. If running manually, you can skip those columns.

---

### Issue: "Cannot add value to enum"

**Solution:** PostgreSQL doesn't allow removing enum values easily. You may need to:

1. Create a new enum type
2. Alter the column to use the new type
3. Drop the old type

Or simply add new values (existing values remain).

---

### Issue: "Default value required for non-nullable column"

**Solution:** The SQL provides default values for new NOT NULL columns. After migration, you should update existing records with proper values:

```sql
UPDATE "events" 
SET 
  "sportType" = 'General',
  "venueName" = 'TBA',
  "city" = 'TBA'
WHERE "sportType" IS NULL;
```

---

### Issue: "Migration failed on shadow database"

**Solution:** Use `--skip-shadow-check` or `--create-only` flag:

```bash
npx prisma migrate dev --name update_events --create-only
```

Then manually apply with:

```bash
npx prisma migrate deploy
```

---

## Data Migration (Optional)

If you have existing events, you may want to populate the new fields:

```sql
-- Update existing events with default organizer data
UPDATE "events" e
SET 
  "organizerName" = u.name,
  "organizerPhone" = COALESCE(u.phone, '+0000000000'),
  "organizerEmail" = u.email,
  "sportType" = 'General Sports',
  "city" = SPLIT_PART(e.location, ',', -1),
  "fullAddress" = e.location,
  "venueName" = SPLIT_PART(e.location, ',', 1),
  "startTime" = '09:00',
  "endTime" = '17:00'
FROM "users" u
WHERE e."organizerId" = u.id
  AND e."sportType" = 'Football';  -- Only update if not already set
```

---

## Next Steps

After successful migration:

1. ✅ Restart your backend server
2. ✅ Test event creation with new fields
3. ✅ Test approval workflow
4. ✅ Test registration (both authenticated and anonymous)
5. ✅ Verify analytics tracking
6. ✅ Test all filter options

Refer to `EVENTS_API_TESTING.md` for complete API testing guide.

---

## Support

If you encounter issues:

1. Check Prisma schema file (`prisma/schema.prisma`)
2. Verify database connection in `.env`
3. Run `npx prisma validate` to check schema validity
4. Check database logs for specific errors
5. Try `npx prisma db push` as fallback

---

**Migration Created:** February 16, 2026
**Schema Version:** Enhanced Events v1.0  
**Prisma Version:** 6.2.0+
