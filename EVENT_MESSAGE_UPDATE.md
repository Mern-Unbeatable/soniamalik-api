# Event Message Update - Remove Subject Field

## Overview

Removed the `subject` field from the EventMessage model to simplify event messaging between organizers and participants.

## Changes Made

### 1. Database Schema (prisma/schema.prisma)

**Removed:**

- `subject` field from EventMessage model

**Updated Model:**

```prisma
model EventMessage {
    id          String   @id @default(uuid())
    eventId     String
    event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
    senderId    String
    sender      User     @relation("SentEventMessages", fields: [senderId], references: [id], onDelete: Cascade)
    recipientId String
    recipient   User     @relation("ReceivedEventMessages", fields: [recipientId], references: [id], onDelete: Cascade)
    message     String   @db.Text
    isRead      Boolean  @default(false)
    readAt      DateTime?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    @@index([eventId])
    @@index([senderId])
    @@index([recipientId])
    @@map("event_messages")
}
```

### 2. Migration File

**Created:** `prisma/migrations/20260413000000_remove_subject_from_event_messages/migration.sql`

```sql
-- AlterTable
ALTER TABLE "event_messages" DROP COLUMN "subject";
```

### 3. Service Layer (src/services/eventMessage.service.js)

**Updated Function:**

```javascript
export async function sendEventMessage(
  eventId,
  senderId,
  recipientId,
  message, // subject parameter removed
) {
  // ... implementation
  const eventMessage = await prisma.eventMessage.create({
    data: {
      eventId,
      senderId,
      recipientId,
      message, // subject removed
    },
    // ... rest of implementation
  });
}
```

### 4. Controller Layer (src/controllers/event.controller.js)

**Updated Validation:**

```javascript
export async function sendEventMessage(req, res) {
  try {
    const { id } = req.params;
    const { recipientId, message } = req.body; // subject removed

    if (!recipientId || !message) { // subject check removed
      return res.status(400).json({
        success: false,
        message: "recipientId and message are required",
      });
    }

    const eventMessage = await eventMessageService.sendEventMessage(
      id,
      req.user.id,
      recipientId,
      message, // subject parameter removed
    );
    // ... rest of implementation
  }
}
```

### 5. Documentation (EVENTS_API_TESTING.md)

**Updated API Examples:**

**Send Message Request:**

```json
{
  "recipientId": "user-uuid-456",
  "message": "Looking forward to seeing you at tomorrow's training session!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "message-uuid",
    "eventId": "event-uuid-123",
    "senderId": "provider-uuid",
    "recipientId": "user-uuid-456",
    "message": "Looking forward to seeing you at tomorrow's training session!",
    "isRead": false,
    "readAt": null,
    "createdAt": "2026-02-17T12:00:00Z",
    "event": {
      "id": "event-uuid-123",
      "title": "Football Training"
    },
    "sender": {
      "id": "provider-uuid",
      "name": "Coach Sarah",
      "role": "COACH"
    },
    "recipient": {
      "id": "user-uuid-456",
      "name": "John Doe"
    }
  }
}
```

## Migration Steps

### Step 1: Apply Migration

```bash
npx prisma migrate deploy
```

or

```bash
npx prisma db push
```

### Step 2: Restart Server

```bash
npm run dev
```

## API Changes

### Endpoint: POST /api/events/:id/messages

**Before:**

```json
{
  "recipientId": "user-uuid",
  "subject": "Event Reminder",
  "message": "Don't forget the event!"
}
```

**After:**

```json
{
  "recipientId": "user-uuid",
  "message": "Don't forget the event!"
}
```

### Required Fields

- ✅ `recipientId` - Required
- ✅ `message` - Required
- ❌ `subject` - **REMOVED**

## Breaking Changes

⚠️ **This is a breaking change for frontend applications!**

- Remove `subject` field from all event messaging API calls
- Update message creation forms to remove subject input
- Update message display components (no subject to show)

## Benefits

1. **Simpler API** - Fewer required fields
2. **Less Validation** - No need to validate subject field
3. **Better UX** - Direct message communication without subject overhead
4. **Cleaner Data** - Message content is self-explanatory

## Testing

### Test Send Message

```bash
# Request
POST /api/events/{eventId}/messages
Authorization: Bearer PROVIDER_TOKEN

{
  "recipientId": "user-uuid",
  "message": "Looking forward to seeing you at the event!"
}

# Expected Response
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "...",
    "message": "Looking forward to seeing you at the event!",
    ... (no subject field)
  }
}
```

### Test Get Messages

```bash
# Request
GET /api/events/{eventId}/messages
Authorization: Bearer TOKEN

# Expected Response
{
  "success": true,
  "data": [
    {
      "id": "...",
      "message": "Event message content",
      ... (no subject field)
    }
  ]
}
```

## Rollback (If Needed)

If you need to rollback this change:

1. Add subject field back to schema:

```prisma
model EventMessage {
    // ... other fields
    subject     String
    message     String   @db.Text
    // ... other fields
}
```

2. Create rollback migration:

```sql
ALTER TABLE "event_messages" ADD COLUMN "subject" TEXT NOT NULL DEFAULT 'Event Message';
```

3. Update code to include subject parameter again

---

**Date:** April 13, 2026
**Status:** ✅ Complete
**Breaking Change:** Yes
