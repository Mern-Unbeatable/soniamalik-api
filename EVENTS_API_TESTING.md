# Events API Testing Guide

Complete documentation for testing the Events management system with Postman or any REST client.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Setup](#authentication-setup)
3. [Event Workflow](#event-workflow)
4. [API Endpoints](#api-endpoints)
5. [Admin Event Management](#admin-event-management)
6. [Provider/Coach Event Views](#providercoach-event-views)
7. [Event Messaging System](#event-messaging-system)
8. [Auto-Status Update Scheduler](#auto-status-update-scheduler)
9. [Filter & Search Options](#filter--search-options)
10. [Testing Scenarios](#testing-scenarios)
11. [Common Issues](#common-issues)

---

## Overview

The Events system supports a complete workflow:

1. **PROVIDER or COACH** creates an event (status: PENDING)
2. **ADMIN** approves or rejects the event
3. After approval, event becomes visible to **PUBLIC**
4. **Anyone** (authenticated or not) can register/join the event
5. **Organizers** can view registrations and manage them
6. **System** automatically tracks views, registrations, and analytics

### Event Types

- `MATCH` - Competitive matches
- `TOURNAMENT` - Multi-team tournaments
- `TRIAL` - Player trials/tryouts
- `TRAINING` - Training sessions
- `WORKSHOP` - Educational workshops
- `SEMINAR` - Educational seminars
- `COMPETITION` - General competitions
- `MEETUP` - Community meetups

### Skill Levels

- `BEGINNER` - Entry level
- `INTERMEDIATE` - Mid level
- `ADVANCED` - Expert level
- `ALL_LEVELS` - Open to all

### Event Statuses

- `PENDING` - Awaiting admin approval
- `APPROVED` - Approved and visible to public
- `REJECTED` - Rejected by admin
- `UPCOMING` - Scheduled for future (auto-updated 24h before start)
- `ONGOING` - Currently happening (auto-updated when event starts)
- `COMPLETED` - Finished (auto-updated when event ends)
- `CANCELLED` - Cancelled
- `FEATURED` - Manually promoted by admin (appears first in lists)
- `PAST` - Old events (auto-updated after completion)
- `BANNED` - Removed by admin for policy violations

---

## Authentication Setup

Most event endpoints require authentication. Some are public with optional authentication.

### Get Authentication Token

**POST** `/api/auth/login`

```json
{
  "email": "provider@essahub.com",
  "password": "demo123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "provider@essahub.com",
      "role": "PROVIDER"
    }
  }
}
```

### Using the Token

For all protected endpoints, add the token to request headers:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Test Users

- **Admin**: `admin@essahub.com` / `demo123`
- **Provider**: `provider@essahub.com` / `demo123`
- **Coach**: `moxat49277@desiys.com` / `demo123`
- **User**: `user@essahub.com` / `demo123`

---

## Event Workflow

### Complete Workflow Example

1. **Provider/Coach creates event** → Status: `PENDING`, **Booking link auto-generated** ✅
2. **Provider/Coach shares booking link** → Users can register immediately (no need to wait for admin approval)
3. **Users register via booking link** → System validates date & capacity only
4. **Admin reviews event** → Approves or Rejects (doesn't affect existing registrations)
5. **If approved** → Status: `APPROVED`, analytics created, event visible in public listing
6. **Users browse events** → Can filter by city, sport, skill level, etc.
7. **System tracks** → Views, registrations automatically tracked

**Key Points:**

- 🔗 Booking link works **immediately** after event creation
- ✅ Users can register **before admin approval** via booking link
- 📅 Only validates: event date hasn't passed & capacity available
- 🚫 No role/permission checks for registration
- 📊 Admin approval only affects public visibility, not registration ability

### 🔗 Automatic Booking Link Generation

**Every event gets a unique booking link automatically when created:**

- **Format:** `{frontendUrl}/events/{eventId}/book`
- **When:** Generated immediately upon event creation
- **Who can share:** Provider/Coach receives the booking link in the create event response
- **Usage:** Share this link on social media, email, or directly with participants

**Example:**

```json
{
  "bookingLink": "http://localhost:5173/events/abc-123-xyz/book"
}
```

**Benefits:**

- ✅ No manual link creation needed
- ✅ Unique link for each event
- ✅ Direct access to event registration page
- ✅ Works immediately after event creation (no approval needed for link generation)
- ✅ **Users can register immediately via booking link (no admin approval required)**
- ✅ **Only validates date and capacity** - not admin approval status

**Registration Flow:**

1. Provider/Coach creates event → Gets booking link instantly
2. Share booking link with participants (WhatsApp, Email, Social Media)
3. **Users click link → Fill registration form → Register immediately**
4. System validates:
   - ✅ Event hasn't ended (endDate + endTime check)
   - ✅ Event has available capacity
   - ✅ Event not banned/cancelled
5. Registration successful - No waiting for admin approval needed!

---

## API Endpoints

### 1. Get All Events (Public)

Get list of approved events with filtering and pagination.

**GET** `/api/events`

**Headers:**

```
Authorization: Bearer TOKEN (optional - if provided, can see own pending events)
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `status` - Filter by status (ADMIN only)
- `eventType` - Filter by type (MATCH, TOURNAMENT, TRIAL, TRAINING, etc.)
- `city` - Filter by city
- `skillLevel` - Filter by skill level (BEGINNER, INTERMEDIATE, ADVANCED, ALL_LEVELS)
- `sportType` - Filter by sport (e.g., Football, Cricket)
- `organizerRole` - Filter by organizer role (PROVIDER, COACH)
- `dateFilter` - Filter by date (upcoming, thisWeek, thisMonth)
- `search` - Search in title, description, sport, city, venue

**Ordering:**

Events are automatically ordered by:

1. **Featured status** (featured events appear first)
2. **Featured date** (most recently featured first)
3. **Creation date** (newest first)

This means **featured events always appear at the top** of the list.

**Example Request:**

```
GET /api/events?city=London&sportType=Football&skillLevel=INTERMEDIATE&page=1&limit=10
```

**Response:**

```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "events": [
      {
        "id": "uuid",
        "title": "Women's Football Trial",
        "sportType": "Football",
        "description": "Professional trial for women's football team",
        "eventType": "TRIAL",
        "status": "APPROVED",
        "startDate": "2026-03-12T00:00:00.000Z",
        "endDate": "2026-03-12T00:00:00.000Z",
        "startTime": "14:00",
        "endTime": "17:00",
        "venueName": "Sunny Lions Stadium",
        "city": "London",
        "fullAddress": "1901 Thornridge Cir. Shiloh",
        "googleMapLink": "https://maps.google.com/...",
        "minAge": 18,
        "maxParticipants": 50,
        "currentParticipants": 12,
        "skillLevel": "INTERMEDIATE",
        "registrationFee": 0,
        "image": "https://soniamalikbackend.mtscorporate.com/uploads/events/event-image.jpg",
        "organizerName": "Sunny Lions FC",
        "organizerPhone": "+1234567890",
        "organizerEmail": "info@sunnylions.com",
        "isApproved": true,
        "bookingLink": "http://localhost:5173/events/uuid/book",
        "createdAt": "2026-02-16T10:00:00.000Z",
        "updatedAt": "2026-02-16T10:30:00.000Z",
        "organizer": {
          "id": "uuid",
          "name": "John Smith",
          "email": "provider@essahub.com",
          "role": "PROVIDER"
        },
        "_count": {
          "registrations": 12
        }
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### 2. Get Event by ID (Authentication Required)

Get detailed information about a specific event. Automatically tracks views (except for admins and event organizers). **Only authenticated users can view event details.**

**GET** `/api/events/:id`

**Headers:**

```
Authorization: Bearer TOKEN (required)
```

**Example Request:**

```
GET /api/events/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "Event retrieved successfully",
  "data": {
    "id": "uuid",
    "title": "Women's Football Trial",
    "sportType": "Football",
    "description": "Professional trial for women's football team...",
    "eventType": "TRIAL",
    "status": "APPROVED",
    "startDate": "2026-03-12T00:00:00.000Z",
    "endDate": "2026-03-12T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "17:00",
    "venueName": "Sunny Lions Stadium",
    "city": "London",
    "fullAddress": "1901 Thornridge Cir. Shiloh, London",
    "googleMapLink": "https://maps.google.com/...",
    "minAge": 18,
    "maxParticipants": 50,
    "currentParticipants": 12,
    "skillLevel": "INTERMEDIATE",
    "registrationFee": 0,
    "image": "https://soniamalikbackend.mtscorporate.com/uploads/events/event.jpg",
    "organizerName": "Sunny Lions FC",
    "organizerPhone": "+1234567890",
    "organizerEmail": "info@sunnylions.com",
    "organizerId": "uuid",
    "isApproved": true,
    "rejectionReason": null,
    "bookingLink": "http://localhost:5173/events/uuid/book",
    "createdAt": "2026-02-16T10:00:00.000Z",
    "updatedAt": "2026-02-16T10:30:00.000Z",
    "organizer": {
      "id": "uuid",
      "name": "John Smith",
      "email": "provider@essahub.com",
      "role": "PROVIDER"
    },
    "registrations": [
      {
        "id": "uuid",
        "fullName": "Jane Doe",
        "email": "jane@example.com",
        "phoneNumber": "+1234567890",
        "status": "confirmed",
        "registeredAt": "2026-02-16T12:00:00.000Z"
      }
    ],
    "analytics": [
      {
        "id": "uuid",
        "views": 156,
        "registrations": 12,
        "revenue": 0,
        "completionRate": 0
      }
    ]
  }
}
```

---

### 3. Create Event (PROVIDER, COACH, ADMIN)

Create a new event. Status will be set to `PENDING` automatically.

**POST** `/api/events`

**Headers:**

```
Authorization: Bearer PROVIDER_OR_COACH_TOKEN
Content-Type: multipart/form-data
```

**Form Data Fields:**

| Field             | Type   | Required | Description                                                        |
| ----------------- | ------ | -------- | ------------------------------------------------------------------ |
| `title`           | string | Yes      | Event title                                                        |
| `sportType`       | string | Yes      | Sport type (e.g., Football, Cricket)                               |
| `description`     | string | Yes      | Full event description                                             |
| `eventType`       | enum   | Yes      | MATCH, TOURNAMENT, TRIAL, TRAINING, etc.                           |
| `startDate`       | date   | Yes      | Event start date (YYYY-MM-DD)                                      |
| `endDate`         | date   | Yes      | Event end date (YYYY-MM-DD)                                        |
| `startTime`       | string | Yes      | Start time (HH:MM format)                                          |
| `endTime`         | string | Yes      | End time (HH:MM format)                                            |
| `venueName`       | string | Yes      | Venue name                                                         |
| `city`            | string | Yes      | City                                                               |
| `fullAddress`     | string | Yes      | Complete address                                                   |
| `googleMapLink`   | string | No       | Google Maps link                                                   |
| `minAge`          | number | No       | Minimum age requirement                                            |
| `maxParticipants` | number | No       | Maximum participants allowed                                       |
| `skillLevel`      | enum   | No       | BEGINNER, INTERMEDIATE, ADVANCED, ALL_LEVELS (default: ALL_LEVELS) |
| `registrationFee` | number | No       | Registration fee (default: 0)                                      |
| `organizerName`   | string | Yes      | Organizer name                                                     |
| `organizerPhone`  | string | Yes      | Organizer phone                                                    |
| `organizerEmail`  | string | Yes      | Organizer email                                                    |
| `image`           | file   | No       | Event image (max 10MB, jpeg/jpg/png/gif/webp)                      |

**Example Request (Postman):**

1. Select `POST` method
2. Enter URL: `http://localhost:3000/api/events`
3. Go to **Headers** tab:
   - Add: `Authorization: Bearer YOUR_TOKEN`
4. Go to **Body** tab:
   - Select `form-data`
   - Add all fields as shown above
   - For `image` field, select type `File` and choose image

**Form Data Example:**

```
title: Women's Football Trial
sportType: Football
description: Professional trial for women's football team...
eventType: TRIAL
startDate: 2026-03-12
endDate: 2026-03-12
startTime: 14:00
endTime: 17:00
venueName: Sunny Lions Stadium
city: London
fullAddress: 1901 Thornridge Cir. Shiloh, London
googleMapLink: https://maps.google.com/...
minAge: 18
maxParticipants: 50
skillLevel: INTERMEDIATE
registrationFee: 0
organizerName: Sunny Lions FC
organizerPhone: +1234567890
organizerEmail: info@sunnylions.com
image: [SELECT FILE]
```

**Response:**

```json
{
  "success": true,
  "message": "Event created successfully with booking link generated",
  "data": {
    "id": "uuid",
    "title": "Women's Football Trial",
    "sportType": "Football",
    "status": "PENDING",
    "isApproved": false,
    "image": "https://soniamalikbackend.mtscorporate.com/uploads/events/event-1234567890.jpg",
    "organizerId": "uuid",
    "bookingLink": "http://localhost:5173/events/uuid/book",
    "createdAt": "2026-02-16T10:00:00.000Z",
    "updatedAt": "2026-02-16T10:00:00.000Z",
    "organizer": {
      "id": "uuid",
      "name": "John Smith",
      "email": "provider@essahub.com",
      "role": "PROVIDER"
    }
  }
}
```

**✅ Booking Link:** The `bookingLink` is automatically generated when the event is created. Share this link with users to allow direct booking/registration for your event.

**Frontend Booking URL Format:**

- Development: `http://localhost:5173/events/{eventId}/book`
- Production: `https://soniamalik14.mtscorporate.com/events/{eventId}/book`

---

### 4. Update Event (Organizer or Admin)

Update an existing event. If updated by organizer (not admin) after approval, status resets to `PENDING`.

**PUT** `/api/events/:id`

**Headers:**

```
Authorization: Bearer TOKEN
Content-Type: multipart/form-data
```

**Form Data:** Same fields as create, all optional (only include fields you want to update)

**Example Request:**

```
PUT /api/events/550e8400-e29b-41d4-a716-446655440000

Form Data:
maxParticipants: 60
registrationFee: 10
```

**Response:**

```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "id": "uuid",
    "title": "Women's Football Trial",
    "maxParticipants": 60,
    "registrationFee": 10,
    "status": "PENDING",
    "updatedAt": "2026-02-16T11:00:00.000Z"
  }
}
```

---

### 5. Delete Event (Organizer or Admin)

Delete an event.

**DELETE** `/api/events/:id`

**Headers:**

```
Authorization: Bearer TOKEN
```

**Example Request:**

```
DELETE /api/events/550e8400-e29b-41d4-a716-446655440000
```

**Response:**

```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

---

### 6. Approve or Reject Event (ADMIN Only) - Single Route

Admin can approve or reject events using a single endpoint.

**PATCH** `/api/events/:id/approval-status`

**Headers:**

```
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

**Body:**

```json
{
  "action": "approve",
  "rejectionReason": "Optional rejection reason if action is reject"
}
```

**Actions:**

- `approve` - Approve the event (creates analytics record)
- `reject` - Reject the event with optional reason

**Example Request (Approve):**

```json
{
  "action": "approve"
}
```

**Example Request (Reject):**

```json
{
  "action": "reject",
  "rejectionReason": "Event details are incomplete. Please provide more information about safety measures."
}
```

**Response (Approved):**

```json
{
  "success": true,
  "message": "Event approved successfully",
  "data": {
    "id": "uuid",
    "title": "Women's Football Trial",
    "status": "APPROVED",
    "isApproved": true,
    "rejectionReason": null,
    "updatedAt": "2026-02-16T10:30:00.000Z"
  }
}
```

**Response (Rejected):**

```json
{
  "success": true,
  "message": "Event rejected successfully",
  "data": {
    "id": "uuid",
    "title": "Women's Football Trial",
    "status": "REJECTED",
    "isApproved": false,
    "rejectionReason": "Event details are incomplete...",
    "updatedAt": "2026-02-16T10:30:00.000Z"
  }
}
```

---

### 7. Register/Join Event (Public)

Anyone can register for an event using the booking link. **No admin approval or authentication required** - both authenticated and non-authenticated users can join.

**Registration Validation (Automatic):**

- ✅ Event must not have ended (checks endDate + endTime)
- ✅ Event must have available capacity (currentParticipants < maxParticipants)
- ✅ Event must not be BANNED or CANCELLED
- ✅ User cannot register twice for the same event

**No Checks Required:**

- ❌ Admin approval status - users can register even if event is PENDING
- ❌ User authentication - anonymous registration allowed
- ❌ User role - anyone can register

**POST** `/api/events/:id/register`

**Headers:**

```
Authorization: Bearer TOKEN (optional)
Content-Type: application/json
```

**Body:**

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phoneNumber": "+1234567890",
  "notes": "Looking forward to participating"
}
```

**Example Request:**

```
POST /api/events/550e8400-e29b-41d4-a716-446655440000/register

Body:
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phoneNumber": "+1234567890",
  "notes": "Excited to join this event"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully registered for event",
  "data": {
    "id": "uuid",
    "eventId": "uuid",
    "userId": "uuid (if authenticated, otherwise null)",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phoneNumber": "+1234567890",
    "notes": "Excited to join this event",
    "status": "pending",
    "paymentStatus": "pending",
    "registeredAt": "2026-02-16T12:00:00.000Z",
    "createdAt": "2026-02-16T12:00:00.000Z"
  }
}
```

**Possible Error Responses:**

```json
// Event has ended
{
  "success": false,
  "message": "Event registration closed - event has ended"
}

// Event is full
{
  "success": false,
  "message": "Event is full"
}

// Event is banned or cancelled
{
  "success": false,
  "message": "Event is banned and not accepting registrations"
}

// Already registered
{
  "success": false,
  "message": "Already registered for this event"
}
```

---

### 8. Get Event Registrations (Organizer or Admin)

View all registrations for an event.

**GET** `/api/events/:id/registrations`

**Headers:**

```
Authorization: Bearer ORGANIZER_OR_ADMIN_TOKEN
```

**Example Request:**

```
GET /api/events/550e8400-e29b-41d4-a716-446655440000/registrations
```

**Response:**

```json
{
  "success": true,
  "message": "Event registrations retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "userId": "uuid",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "phoneNumber": "+1234567890",
      "notes": "Excited to join",
      "status": "confirmed",
      "paymentStatus": "paid",
      "registeredAt": "2026-02-16T12:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "avatar": "avatar.jpg"
      }
    }
  ]
}
```

---

### 9. Update Registration Status (Organizer or Admin)

Update the status of a registration.

**PATCH** `/api/events/registrations/:registrationId/status`

**Headers:**

```
Authorization: Bearer ORGANIZER_OR_ADMIN_TOKEN
Content-Type: application/json
```

**Body:**

```json
{
  "status": "confirmed"
}
```

**Status Options:**

- `pending` - Awaiting confirmation
- `confirmed` - Confirmed
- `cancelled` - Cancelled

**Example Request:**

```
PATCH /api/events/registrations/550e8400-e29b-41d4-a716-446655440000/status

Body:
{
  "status": "confirmed"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration status updated successfully",
  "data": {
    "id": "uuid",
    "status": "confirmed",
    "updatedAt": "2026-02-16T13:00:00.000Z"
  }
}
```

---

### 10. Get Event Analytics (Admin)

Get analytics for all approved events or specific event.

**GET** `/api/events/analytics/all`

**Headers:**

```
Authorization: Bearer ADMIN_TOKEN
```

**Query Parameters:**

- `eventId` - Filter by specific event ID
- `startDate` - Filter from date
- `endDate` - Filter to date

**Example Request:**

```
GET /api/events/analytics/all?eventId=550e8400-e29b-41d4-a716-446655440000
```

**Response:**

```json
{
  "success": true,
  "message": "Event analytics retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "views": 256,
      "registrations": 42,
      "completionRate": 0,
      "revenue": 420,
      "rating": null,
      "createdAt": "2026-02-16T10:30:00.000Z",
      "updatedAt": "2026-02-16T14:00:00.000Z",
      "event": {
        "id": "uuid",
        "title": "Women's Football Trial",
        "eventType": "TRIAL",
        "sportType": "Football",
        "status": "APPROVED",
        "startDate": "2026-03-12T00:00:00.000Z",
        "endDate": "2026-03-12T00:00:00.000Z",
        "city": "London",
        "image": "https://soniamalikbackend.mtscorporate.com/uploads/events/event.jpg"
      }
    }
  ]
}
```

---

### 11. Get Organizer Dashboard (PROVIDER or COACH)

Get dashboard data for the authenticated organizer showing their events and metrics.

**GET** `/api/events/my/dashboard`

**Headers:**

```
Authorization: Bearer PROVIDER_OR_COACH_TOKEN
```

**Example Request:**

```
GET /api/events/my/dashboard
```

**Response:**

```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "metrics": {
      "totalEvents": 15,
      "approvedEvents": 10,
      "pendingEvents": 3,
      "rejectedEvents": 2,
      "totalViews": 1542,
      "totalRegistrations": 234,
      "totalRevenue": 2340
    },
    "events": [
      {
        "id": "uuid",
        "title": "Women's Football Trial",
        "status": "APPROVED",
        "currentParticipants": 42,
        "maxParticipants": 50,
        "analytics": [
          {
            "views": 256,
            "registrations": 42,
            "revenue": 420
          }
        ],
        "_count": {
          "registrations": 42
        }
      }
    ],
    "recentRegistrations": [
      {
        "id": "uuid",
        "fullName": "Jane Doe",
        "email": "jane@example.com",
        "phoneNumber": "+1234567890",
        "status": "confirmed",
        "createdAt": "2026-02-16T12:00:00.000Z",
        "event": {
          "id": "uuid",
          "title": "Women's Football Trial",
          "eventType": "TRIAL",
          "sportType": "Football"
        },
        "user": {
          "id": "uuid",
          "name": "Jane Doe",
          "email": "jane@example.com"
        }
      }
    ]
  }
}
```

---

### 12. Get Organizer's Events

Get all events created by the authenticated organizer with filtering.

**GET** `/api/events/my/list`

**Headers:**

```
Authorization: Bearer PROVIDER_OR_COACH_TOKEN
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `status` - Filter by status (PENDING, APPROVED, REJECTED, etc.)

**Example Request:**

```
GET /api/events/my/list?status=PENDING&page=1&limit=10
```

**Response:**

```json
{
  "success": true,
  "message": "Organizer events retrieved successfully",
  "data": {
    "events": [
      {
        "id": "uuid",
        "title": "Women's Football Trial",
        "status": "PENDING",
        "startDate": "2026-03-12T00:00:00.000Z",
        "currentParticipants": 0,
        "maxParticipants": 50,
        "analytics": [],
        "_count": {
          "registrations": 0
        }
      }
    ],
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## Filter & Search Options

### By City

```
GET /api/events?city=London
```

### By Sport Type

```
GET /api/events?sportType=Football
```

### By Event Type

```
GET /api/events?eventType=TRIAL
```

### By Skill Level

```
GET /api/events?skillLevel=INTERMEDIATE
```

### By Organizer Role

```
GET /api/events?organizerRole=PROVIDER
```

### By Date

```
GET /api/events?dateFilter=upcoming
GET /api/events?dateFilter=thisWeek
GET /api/events?dateFilter=thisMonth
```

### Search

```
GET /api/events?search=football
```

### Combined Filters

```
GET /api/events?city=London&sportType=Football&skillLevel=INTERMEDIATE&dateFilter=upcoming&page=1&limit=10
```

---

## Testing Scenarios

### Scenario 1: Complete Event Creation Workflow

1. **Login as Provider**

   ```
   POST /api/auth/login
   Body: { "email": "provider@essahub.com", "password": "demo123" }
   ```

2. **Create Event**

   ```
   POST /api/events
   Headers: Authorization: Bearer TOKEN
   Form-data: [all event fields + image]
   ```

3. **Verify Status**
   - Check response: status should be "PENDING"
   - isApproved should be false

4. **Login as Admin**

   ```
   POST /api/auth/login
   Body: { "email": "admin@essahub.com", "password": "demo123" }
   ```

5. **Approve Event**

   ```
   PATCH /api/events/:id/approval-status
   Headers: Authorization: Bearer ADMIN_TOKEN
   Body: { "action": "approve" }
   ```

6. **Verify Approval**
   - Check response: status should be "APPROVED"
   - isApproved should be true
   - Analytics record created

7. **View Event (Authenticated User)**

   ```
   GET /api/events/:id
   Headers: Authorization: Bearer USER_TOKEN
   ```

8. **Register for Event**

   ```
   POST /api/events/:id/register
   Body: { "fullName": "Test User", "email": "test@example.com", "phoneNumber": "+123456" }
   ```

9. **Check Analytics**

   ```
   GET /api/events/analytics/all?eventId=:id
   Headers: Authorization: Bearer ADMIN_TOKEN
   ```

   - Should show: views incremented, registrations incremented

---

### Scenario 2: Filter and Search

1. **Get All Football Events**

   ```
   GET /api/events?sportType=Football
   ```

2. **Get Upcoming Events in London**

   ```
   GET /api/events?city=London&dateFilter=upcoming
   ```

3. **Get Beginner Level Training**

   ```
   GET /api/events?eventType=TRAINING&skillLevel=BEGINNER
   ```

4. **Search for "trial"**
   ```
   GET /apiapi/events?search=trial
   ```

---

### Scenario 3: Organizer Dashboard

1. **Login as Provider/Coach**

   ```
   POST /api/auth/login
   Body: { "email": "provider@essahub.com", "password": "demo123" }
   ```

2. **Get Dashboard**

   ```
   GET /api/events/my/dashboard
   Headers: Authorization: Bearer TOKEN
   ```

   - Should show: total events, metrics, recent registrations

3. **Get My Events**

   ```
   GET /api/events/my/list?status=APPROVED
   Headers: Authorization: Bearer TOKEN
   ```

4. **View Event Registrations**

   ```
   GET /api/events/:id/registrations
   Headers: Authorization: Bearer TOKEN
   ```

5. **Confirm Registration**
   ```
   PATCH /api/events/registrations/:registrationId/status
   Headers: Authorization: Bearer TOKEN
   Body: { "status": "confirmed" }
   ```

---

### Scenario 4: Event Rejection

1. **Login as Admin**

   ```
   POST /api/auth/login
   Body: { "email": "admin@essahub.com", "password": "demo123" }
   ```

2. **Reject Event with Reason**

   ```
   PATCH /api/events/:id/approval-status
   Headers: Authorization: Bearer ADMIN_TOKEN
   Body: {
     "action": "reject",
     "rejectionReason": "Incomplete safety information. Please add emergency contact details."
   }
   ```

3. **Verify Rejection**
   - Check response: status should be "REJECTED"
   - isApproved should be false
   - rejectionReason should be saved

4. **Provider Views Rejected Event**

   ```
   GET /api/events/:id
   Headers: Authorization: Bearer PROVIDER_TOKEN
   ```

   - Should see rejection reason

---

## Admin Event Management

### Overview

Admins have enhanced controls over events including:

- **Feature Events**: Highlight important events (displayed at top of lists)
- **Ban Events**: Remove inappropriate or problematic events
- **Role-based Views**: Special filtering for different admin views

### Event Statuses Enhanced

In addition to regular statuses, the system now supports:

- `FEATURED` - Manually promoted events (displayed first in lists)
- `PAST` - Events that have finished (auto-updated by scheduler)
- `BANNED` - Events removed by admin for policy violations

### Admin Views

Admins can filter events by special view types:

**GET** `/api/events?viewType=pending`

**View Types:**

- `pending` - Events awaiting approval (PENDING status)
- `featured` - Featured events currently active
- `live` - Currently ongoing events (ONGOING status)
- `past` - Completed events (PAST, COMPLETED statuses)
- `banned` - Banned events

**Example:**

```
GET /api/events?viewType=featured&page=1&limit=20
Headers: Authorization: Bearer ADMIN_TOKEN
```

---

### 1. Toggle Feature Status (Like/Dislike Behavior)

Admin can feature or unfeature events by calling the same endpoint. Works like a like/dislike button - calling it toggles the state automatically.

**PATCH** `/api/events/:id/feature`

**Headers:**

```
Authorization: Bearer ADMIN_TOKEN
```

**Body:** None required (automatically toggles based on current state)

**Example Request:**

```
PATCH /api/events/event-uuid-123/feature
Headers: Authorization: Bearer ADMIN_TOKEN
```

**Response (When Featuring):**

```json
{
  "success": true,
  "message": "Event featured successfully",
  "data": {
    "id": "event-uuid-123",
    "title": "Women's Football Championship",
    "isFeatured": true,
    "featuredAt": "2026-02-17T10:30:00Z",
    "featuredBy": "admin-uuid"
  }
}
```

**Response (When Unfeaturing):**

```json
{
  "success": true,
  "message": "Event unfeatured successfully",
  "data": {
    "id": "event-uuid-123",
    "isFeatured": false,
    "featuredAt": null,
    "featuredBy": null
  }
}
```

**How It Works:**

- **First call:** Event is not featured → becomes featured
- **Second call:** Event is featured → becomes unfeatured
- **Third call:** Event is not featured → becomes featured again
- And so on...

**Business Rules:**

- Only approved, upcoming, or ongoing events can be featured
- Cannot feature banned or rejected events
- Cannot feature pending approval events (must approve first)
- **Featured events automatically appear at the top** of GET `/api/events` (public listing)
- Featured events are ordered by: featured status → most recently featured → newest

---

### 2. Toggle Ban Status (Ban/Unban with Single Endpoint)

Admin can ban or unban events by calling the same endpoint. Works like a toggle - calling it switches between banned and unbanned states.

**PATCH** `/api/events/:id/ban`

**Headers:**

```
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

**Body (Required only when banning):**

```json
{
  "bannedReason": "Inappropriate content in description"
}
```

**Example Request (Ban Event):**

```
PATCH /api/events/event-uuid-123/ban
Headers: Authorization: Bearer ADMIN_TOKEN

{
  "bannedReason": "Violates community guidelines - discriminatory content"
}
```

**Response (When Banning):**

```json
{
  "success": true,
  "message": "Event banned successfully",
  "data": {
    "id": "event-uuid-123",
    "title": "Problematic Event",
    "status": "BANNED",
    "bannedReason": "Violates community guidelines - discriminatory content",
    "bannedAt": "2026-02-17T11:00:00Z",
    "isFeatured": false
  }
}
```

**Example Request (Unban Event - Same Endpoint):**

```
PATCH /api/events/event-uuid-123/ban
Headers: Authorization: Bearer ADMIN_TOKEN
(No body needed)
```

**Response (When Unbanning):**

```json
{
  "success": true,
  "message": "Event unbanned successfully",
  "data": {
    "id": "event-uuid-123",
    "status": "PENDING",
    "bannedReason": null,
    "bannedAt": null
  }
}
```

**How It Works:**

- **First call (with bannedReason):** Event is not banned → becomes banned
- **Second call (no body needed):** Event is banned → becomes unbanned (returns to PENDING)
- **Third call (with bannedReason):** Event is not banned → becomes banned again
- And so on...

**Business Rules:**

- Banned reason is required when banning (first call or odd calls)
- No body needed when unbanning (even calls)
- Banning an event automatically unfeatures it
- Banned events are hidden from public views
- Organizer can view their banned events with ban reason
- After unbanning, event returns to PENDING and must be re-approved

---

## Provider/Coach Event Views

### Overview

Providers and Coaches have special view types to manage their events:

**GET** `/api/events?viewType=upcoming`

**View Types:**

- `upcoming` - Approved events scheduled for future (APPROVED, UPCOMING statuses, startDate >= now)
- `completed` - Finished events (COMPLETED, PAST statuses)
- `pending` - Events awaiting admin approval (PENDING)
- `cancelled` - Cancelled events (CANCELLED status)

**Important:** These views automatically filter to show only the authenticated user's own events.

**Example:**

```
GET /api/events?viewType=upcoming&page=1&limit=20
Headers: Authorization: Bearer PROVIDER_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "events": [
      {
        "id": "uuid-1",
        "title": "Football Training Session",
        "status": "APPROVED",
        "startDate": "2026-03-01",
        "organizerId": "provider-uuid"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

## Event Messaging System

### Overview

The messaging system allows event organizers (PROVIDER/COACH) to communicate with registered participants.

**Features:**

- Organizer can send messages to any registered user
- Messages are stored (not live chat)
- Users can mark messages as read/unread
- Track read status and timestamps

**Use Cases:**

- Send event updates to participants
- Share important information before event
- Notify of changes in venue, time, etc.
- Post-event thank you or feedback requests

---

### 1. Send Message to Participant

Send a message from organizer to a registered participant.

**POST** `/api/events/:id/messages`

**Headers:**

```
Authorization: Bearer PROVIDER_OR_COACH_TOKEN
Content-Type: application/json
```

**Request Body:**

```json
{
  "recipientId": "user-uuid-123",
  "message": "Hello! The event venue has been changed to Central Sports Complex. Please arrive 15 minutes early for registration."
}
```

**Example:**

```
POST /api/events/event-uuid-123/messages
Headers: Authorization: Bearer PROVIDER_TOKEN

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

**Business Rules:**

- Only event organizer can send messages
- Recipient must be registered for the event
- Message is required
- Messages cannot be edited after sending (delete and resend if needed)

**Error Responses:**

```json
// Recipient not registered
{
  "success": false,
  "message": "Recipient is not registered for this event"
}

// Not event organizer
{
  "success": false,
  "message": "Only event organizer can send messages for this event"
}
```

---

### 2. Get Messages for an Event

View all messages for a specific event (organizer sees all, participants see only theirs).

**GET** `/api/events/:id/messages`

**Headers:**

```
Authorization: Bearer TOKEN
```

**Example:**

```
GET /api/events/event-uuid-123/messages
Headers: Authorization: Bearer PROVIDER_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "Event messages retrieved successfully",
  "data": [
    {
      "id": "message-uuid-1",
      "message": "New venue: Central Complex",
      "isRead": true,
      "readAt": "2026-02-17T13:00:00Z",
      "createdAt": "2026-02-17T12:00:00Z",
      "sender": {
        "name": "Coach Sarah",
        "role": "COACH"
      },
      "recipient": {
        "name": "John Doe"
      }
    }
  ]
}
```

**Authorization Rules:**

- Admin sees all messages
- Organizer sees all messages for their event
- Participants see only messages sent to them or from them

---

### 3. Get Received Messages

Get all messages received by the current user (inbox).

**GET** `/api/events/messages/received`

**Headers:**

```
Authorization: Bearer USER_TOKEN
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `isRead` - Filter by read status (true/false)

**Example:**

```
GET /api/events/messages/received?isRead=false&page=1&limit=10
Headers: Authorization: Bearer USER_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "Received messages retrieved successfully",
  "data": {
    "messages": [
      {
        "id": "message-uuid",
        "message": "Don't forget tomorrow's session!",
        "isRead": false,
        "readAt": null,
        "createdAt": "2026-02-17T12:00:00Z",
        "event": {
          "id": "event-uuid-123",
          "title": "Football Training",
          "startDate": "2026-02-18"
        },
        "sender": {
          "id": "coach-uuid",
          "name": "Coach Sarah",
          "role": "COACH"
        }
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "unreadCount": 3
  }
}
```

---

### 4. Get Sent Messages

Get all messages sent by the current user (outbox).

**GET** `/api/events/messages/sent`

**Headers:**

```
Authorization: Bearer PROVIDER_OR_COACH_TOKEN
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Example:**

```
GET /api/events/messages/sent?page=1&limit=10
```

**Response:**

```json
{
  "success": true,
  "message": "Sent messages retrieved successfully",
  "data": {
    "messages": [
      {
        "id": "message-uuid",
        "message": "Venue Change - New location: Central Complex",
        "event": {
          "title": "Football Training"
        },
        "recipient": {
          "name": "John Doe"
        }
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

### 5. Mark Message as Read

Mark a specific message as read.

**PATCH** `/api/events/messages/:messageId/read`

**Headers:**

```
Authorization: Bearer USER_TOKEN
```

**Example:**

```
PATCH /api/events/messages/message-uuid-123/read
```

**Response:**

```json
{
  "success": true,
  "message": "Message marked as read",
  "data": {
    "id": "message-uuid-123",
    "isRead": true,
    "readAt": "2026-02-17T14:00:00Z"
  }
}
```

**Business Rules:**

- Only recipient can mark message as read
- Cannot mark already-read messages again (returns 400 error)

---

### 6. Mark All Messages as Read

Mark all received messages as read at once.

**PATCH** `/api/events/messages/read-all`

**Headers:**

```
Authorization: Bearer USER_TOKEN
```

**Example:**

```
PATCH /api/events/messages/read-all
```

**Response:**

```json
{
  "success": true,
  "message": "All messages marked as read",
  "data": {
    "success": true,
    "markedCount": 5
  }
}
```

---

### 7. Get Unread Message Count

Get the count of unread messages for current user.

**GET** `/api/events/messages/unread/count`

**Headers:**

```
Authorization: Bearer USER_TOKEN
```

**Example:**

```
GET /api/events/messages/unread/count
```

**Response:**

```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "unreadCount": 3
  }
}
```

**Use Case:** Display notification badge with unread count in mobile/web UI.

---

### 8. Delete a Message

Delete a message (sender, recipient, or admin can delete).

**DELETE** `/api/events/messages/:messageId`

**Headers:**

```
Authorization: Bearer TOKEN
```

**Example:**

```
DELETE /api/events/messages/message-uuid-123
```

**Response:**

```json
{
  "success": true,
  "message": "Message deleted successfully",
  "data": {
    "success": true,
    "message": "Message deleted successfully"
  }
}
```

**Authorization:**

- Sender can delete their sent messages
- Recipient can delete received messages
- Admin can delete any message

---

## Auto-Status Update Scheduler

### Overview

The system automatically updates event statuses based on dates and times:

**Transitions:**

1. **APPROVED → UPCOMING** - 24 hours before event start
2. **UPCOMING → ONGOING** - When startDate + startTime is reached
3. **ONGOING → COMPLETED** - When endDate + endTime is passed
4. **Auto-cleanup** - Removes featured flag from PAST/COMPLETED/BANNED events

**Schedule:** Runs every 5 minutes automatically when server starts.

**Manual Trigger:** Not currently exposed via API (admin can trigger from server console if needed).

### Status Flow Diagram

```
CREATE EVENT
     ↓
PENDING (awaiting admin)
     ↓
[Admin Approves]
     ↓
APPROVED (visible to public)
     ↓
[24h before start]
     ↓
UPCOMING (imminent event)
     ↓
[startDate + startTime reached]
     ↓
ONGOING (currently happening)
     ↓
[endDate + endTime passed]
     ↓
COMPLETED (auto-updated)
```

**Alternative Paths:**

- Admin Rejects → REJECTED (manual)
- Admin Bans → BANNED (manual)
- Organizer Cancels → CANCELLED (manual)
- Featured flag can be added/removed at any approved/upcoming/ongoing stage

### Database Fields Updated by Scheduler

- `status` - Updated based on date/time
- `isFeatured` - Set to false for inactive events
- `featuredAt` - Set to null for inactive events
- `featuredBy` - Set to null for inactive events

**Note:** Scheduler logs all status changes to console for monitoring.

---

## Testing the New Features

### Test Scenario 1: Feature Event Workflow (Toggle Behavior)

1. **Create and Approve Event (Admin)**

   ```
   POST /api/events (as COACH)
   PATCH /api/events/:id/approval-status (as ADMIN) - approve
   ```

2. **Feature the Event (First Click)**

   ```
   PATCH /api/events/:id/feature
   Headers: Authorization: Bearer ADMIN_TOKEN
   ```

   - Response: `"Event featured successfully"`
   - `isFeatured: true`

3. **Verify Featured Event Appears First**

   ```
   GET /api/events
   ```

   - Featured event should appear at the top of the list
   - All other approved events appear below

4. **Unfeature the Event (Second Click - Same Endpoint)**

   ```
   PATCH /api/events/:id/feature
   Headers: Authorization: Bearer ADMIN_TOKEN
   ```

   - Response: `"Event unfeatured successfully"`
   - `isFeatured: false`

5. **Verify Event Returns to Normal Order**

   ```
   GET /api/events
   ```

   - Event appears in normal order (by creation date)

6. **Feature Again (Third Click)**

   ```
   PATCH /api/events/:id/feature
   ```

   - Response: `"Event featured successfully"` again
   - Works like a toggle/like button

---

### Test Scenario 2: Ban Event Workflow (Toggle Behavior)

1. **Ban an Event with Reason (First Click)**

   ```
   PATCH /api/events/:id/ban
   Headers: Authorization: Bearer ADMIN_TOKEN

   {
     "bannedReason": "Violates community guidelines"
   }
   ```

   - Response: `"Event banned successfully"`
   - status: `BANNED`

2. **Verify Event is Banned**

   ```
   GET /api/events?viewType=banned
   Headers: Authorization: Bearer ADMIN_TOKEN
   ```

3. **Organizer Views Ban Reason**

   ```
   GET /api/events/:id
   Headers: Authorization: Bearer ORGANIZER_TOKEN
   ```

   - Should see bannedReason in response

4. **Unban the Event (Second Click - Same Endpoint, No Body)**

   ```
   PATCH /api/events/:id/ban
   Headers: Authorization: Bearer ADMIN_TOKEN
   (No body)
   ```

   - Response: `"Event unbanned successfully"`
   - status: `PENDING`
   - Event returns to pending and needs re-approval

5. **Ban Again (Third Click - Provide Reason Again)**

   ```
   PATCH /api/events/:id/ban
   Headers: Authorization: Bearer ADMIN_TOKEN

   {
     "bannedReason": "Still violates guidelines"
   }
   ```

   - Works like a toggle button

---

### Test Scenario 3: Event Messaging Workflow

1. **User Registers for Event**

   ```
   POST /api/events/:id/register
   Headers: Authorization: Bearer USER_TOKEN
   ```

2. **Organizer Sends Message to User**

   ```
   POST /api/events/:id/messages
   Headers: Authorization: Bearer COACH_TOKEN

   {
     "recipientId": "user-uuid",
     "message": "We're excited to have you. Please arrive 15min early."
   }
   ```

3. **User Checks Inbox**

   ```
   GET /api/events/messages/received?isRead=false
   Headers: Authorization: Bearer USER_TOKEN
   ```

   - Should see 1 unread message

4. **User Checks Unread Count**

   ```
   GET /api/events/messages/unread/count
   Headers: Authorization: Bearer USER_TOKEN
   ```

   - Should return unreadCount: 1

5. **User Reads Message**

   ```
   PATCH /api/events/messages/:messageId/read
   Headers: Authorization: Bearer USER_TOKEN
   ```

6. **Verify Read Status**

   ```
   GET /api/events/messages/received
   ```

   - Message should have isRead: true and readAt timestamp

7. **Organizer Views Sent Messages**
   ```
   GET /api/events/messages/sent
   Headers: Authorization: Bearer COACH_TOKEN
   ```

---

### Test Scenario 4: Role-Based Views

**As Admin:**

```
GET /api/events?viewType=pending
GET /api/events?viewType=featured
GET /api/events?viewType=live
GET /api/events?viewType=past
GET /api/events?viewType=banned
```

**As Provider/Coach:**

```
GET /api/events?viewType=upcoming   (only my upcoming events)
GET /api/events?viewType=completed  (only my completed events)
GET /api/events?viewType=pending    (only my pending events)
GET /api/events?viewType=cancelled  (only my cancelled events)
```

**As Regular User:**

- viewType parameter is ignored
- Only sees approved, public events

---

### Test Scenario 5: Auto-Status Updates

**Prerequisites:**

- Events with dates in the past, present, and future
- Scheduler running (starts automatically with server)

**Steps:**

1. **Create Event with Start Date Tomorrow**

   ```
   POST /api/events
   {
     "startDate": "2026-02-18",
     "endDate": "2026-02-18",
     "startTime": "14:00:00",
     "endTime": "16:00:00"
   }
   ```

2. **Admin Approves**
   - Status: APPROVED

3. **Wait 24h or Manually Update System Time (for testing)**
   - Status automatically changes: APPROVED → UPCOMING

4. **When Start Time Reaches (startDate + startTime)**
   - Status automatically changes: UPCOMING → ONGOING

5. **When End Time Passes (endDate + endTime)**
   - Status automatically changes: ONGOING → COMPLETED

**Monitor Console Logs:**

```
⏰ Running event status update...
📅 Updated 2 events from APPROVED to UPCOMING
▶️ Event "Football Training" started (UPCOMING -> ONGOING)
✅ Event "Cricket Match" completed (ONGOING -> COMPLETED)
```

---

## Common Issues

### Issue 1: "Event not found" when trying to view

**Cause:** You're trying to view a pending event as a non-admin user.

**Solution:** Only approved events are visible to public. Login as admin or the event organizer to view pending events.

---

### Issue 2: Image upload fails with "Only image files are allowed"

**Cause:** File type is not supported.

**Solution:** Use only these formats: jpeg, jpg, png, gif, webp. Max file size: 10MB.

---

### Issue 3: "Not authorized to update this event"

**Cause:** You're trying to update an event you didn't create.

**Solution:** Only the event organizer or admins can update events.

---

### Issue 4: "Event is full"

**Cause:** Maximum participants limit reached.

**Solution:** Organizer needs to increase maxParticipants or event is genuinely full.

---

### Issue 5: "Already registered for this event"

**Cause:** User has already registered for this event.

**Solution:** Cannot register twice. Update existing registration if needed.

---

### Issue 6: Image URL shows null in response

**Cause:** Image not uploaded properly or wrong field name.

**Solution:**

- Make sure Content-Type is `multipart/form-data`
- Use field name `image` (not `file` or other)
- Check file size is under 10MB

---

### Issue 7: "Event registration closed - event has ended"

**Cause:** Event's end date and time have passed.

**Solution:** Registration is closed for past events. Users must register before the event ends.

---

### Issue 8: "Event is banned and not accepting registrations"

**Cause:** Admin has banned or cancelled the event.

**Solution:** Event cannot accept registrations when BANNED or CANCELLED status. Contact admin or organizer for details.

---

## Analytics Tracking

The system automatically tracks:

1. **Views** - Incremented when someone views event details (excludes admin and organizer)
2. **Registrations** - Incremented when someone registers
3. **Revenue** - Calculated based on registration fees
4. **Completion Rate** - Can be updated manually (future feature)

### When Analytics are Created

- Analytics record is automatically created when admin approves an event
- If viewing analytics and some approved events don't have records, they're auto-created

---

## Database Migration

Before testing, ensure the database schema is updated:

```bash
cd soniamalikbackend
npx prisma db push
```

Or create a proper migration:

```bash
npx prisma migrate dev --name update_events_with_enhanced_fields
```

If using production database, use:

```bash
npx prisma migrate deploy
```

---

## Example Postman Collection Structure

```
Events API v2.0
├── Auth
│   ├── Login as Provider
│   ├── Login as Coach
│   ├── Login as Admin
│   └── Login as User
├── Events
│   ├── Get All Events (Public)
│   ├── Get Event by ID (Authentication Required)
│   ├── Filter by City
│   ├── Filter by Sport Type
│   ├── Filter by Skill Level
│   ├── Search Events
│   └── Combined Filters
├── Event Management (Provider/Coach)
│   ├── Create Event
│   ├── Update Event
│   ├── Delete Event
│   ├── Get My Dashboard
│   ├── Get My Events
│   ├── Get My Upcoming Events (viewType=upcoming)
│   ├── Get My Completed Events (viewType=completed)
│   ├── Get My Pending Events (viewType=pending)
│   └── Get My Cancelled Events (viewType=cancelled)
├── Event Registration (Public)
│   ├── Register for Event (Authenticated)
│   ├── Register for Event (Anonymous)
│   └── Get Event Registrations
├── Registration Management (Organizer)
│   ├── View Registrations
│   └── Update Registration Status
├── Admin Actions
│   ├── Approve Event
│   ├── Reject Event
│   ├── Get All Analytics
│   └── Admin Views
│       ├── Get Pending Events (viewType=pending)
│       ├── Get Featured Events (viewType=featured)
│       ├── Get Live Events (viewType=live)
│       ├── Get Past Events (viewType=past)
│       └── Get Banned Events (viewType=banned)
├── Admin Event Management
│   ├── Toggle Feature (Feature/Unfeature)
│   └── Toggle Ban (Ban/Unban)
├── Event Messaging
│   ├── Send Message to Participant
│   ├── Get Event Messages
│   ├── Get Received Messages (Inbox)
│   ├── Get Sent Messages (Outbox)
│   ├── Get Unread Count
│   ├── Mark Message as Read
│   ├── Mark All Messages as Read
│   └── Delete Message
└── Testing Scenarios
    ├── Complete Workflow Test
    ├── Rejection Workflow
    ├── Dashboard Test
    ├── Feature Event Workflow
    ├── Ban Event Workflow
    ├── Event Messaging Workflow
    ├── Role-Based Views Test
    └── Auto-Status Update Test
```

---

## Support

For issues or questions:

- Check the error response message
- Verify authentication token is valid
- Ensure user role has required permissions
- Check database migration is applied
- Review console logs for detailed errors
  7, 2026
  **API Version:** 2.0.0  
  **Base URL:** `http://localhost:3000/api` (Development)
  **Production URL:** `https://soniamalikbackend.mtscorporate.com/api`

**New in v2.0.0:**

- Admin event management (feature, ban, unban)
- Event messaging system (organizer to participants)
- Role-based event views (admin/provider/coach specific filters)
- Auto-status update scheduler (APPROVED → UPCOMING → ONGOING → COMPLETED)
- Enhanced event statuses (FEATURED, PAST, BANNED)
  **API Version:** 1.0.0
  **Base URL:** `http://localhost:3000/api` (Development)
  **Production URL:** `https://soniamalikbackend.mtscorporate.com/api`
