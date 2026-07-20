# Services API — Postman Testing Guide

**Base URL:** `https://soniamalikbackend.mtscorporate.com/api`

All authenticated requests require:

```
Authorization: Bearer YOUR_TOKEN
```

**Roles:**

| Role       | Can Do                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| `PROVIDER` | Create/edit/delete own services, view own bookings, interests, messages |
| `ADMIN`    | View all services, approve/reject/feature/ban                           |
| `USER`     | Browse approved services, Book Now, Register Interest, send messages    |

---

## 0. Authentication

### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "yourpassword"
}
```

> Copy the `token` from the response and use it as `Bearer TOKEN` in the Authorization header.

---

## Fixed Allowed Values

These values are strictly validated by the API.

### providerType (pick ONE)

```
Physiotherapist
Sports Massage Therapist
Strength & Conditioning Coach
Nutritionist
Mental Health & Wellbeing
Coach / Trainer
Other
```

### sessionTypes (array — pick any combination)

```
In Clinic
Home Visits
Online Video
```

### sports (array — pick any combination)

```
Football
Squash
Rugby
Netball
Cricket
Padel
Tennis
Badminton
Golf
Running
Other
```

### participantResponseType (pick ONE)

```
BY_DEFAULT            → shows "Book Now" button
ADD_BOOKING_LINK      → shows external booking link
ALLOW_REGISTER_INTEREST → shows "Register Interest" button
```

---

## 1. Create a Service (PROVIDER)

**`POST /api/services`**  
Auth: `PROVIDER_TOKEN`  
Content-Type: `multipart/form-data`

> In Postman: Body tab → form-data. For the `logo` field, set type to **File**.

> **Note:** All `image` and `bookingLink` fields are **stored and returned** as full URLs:
>
> - `image`: `https://soniamalikbackend.mtscorporate.com/uploads/services/filename.png`
> - `bookingLink`: `https://soniamalikbackend.mtscorporate.com/services/{id}/book`
>
> The system automatically prepends the backend URL when saving images to the database.

| Field                    | Type | Required | Example                                        |
| ------------------------ | ---- | -------- | ---------------------------------------------- |
| title                    | text | ✅       | Women's Sports Physio                          |
| providerName             | text | ✅       | Apex Performance Therapy Centre                |
| description              | text | ✅       | This physiotherapy service is designed...      |
| contactName              | text |          | Jane Doe                                       |
| providerPhone            | text |          | +447700900000                                  |
| providerEmail            | text |          | info@apex.com                                  |
| clinicName               | text |          | The Wellness Centre                            |
| addressLine1             | text |          | 123 High Street                                |
| city                     | text |          | Richmond                                       |
| postcode                 | text |          | TW9 1AB                                        |
| providerType             | text |          | Physiotherapist _(see allowed values above)_   |
| listingHeadline          | text |          | Expert physio for women in sport               |
| aboutService             | text |          | Our specialist services...                     |
| sessionTypes             | text |          | `["In Clinic","Home Visits"]` _(JSON array)_   |
| sports                   | text |          | `["Football","Squash","Rugby"]` _(JSON array)_ |
| professionalRegistration | text |          | HCPC Registered, CSP Member                    |
| insuranceInPlace         | text |          | `true`                                         |
| participantResponseType  | text |          | `BY_DEFAULT`                                   |
| logo                     | file |          | _(attach PNG/JPG)_                             |

**Example form-data values:**

```
title: Women's Sports Physio
providerName: Apex Performance Therapy Centre
description: This physiotherapy service is designed specifically for women athletes.
contactName: Jane Doe
providerPhone: +447700900000
providerEmail: info@apex.com
clinicName: The Wellness Centre
addressLine1: 123 High Street
city: Richmond
postcode: TW9 1AB
providerType: Physiotherapist
listingHeadline: Expert physio for women in sport
aboutService: We help women recover and perform at their best.
sessionTypes: ["In Clinic","Home Visits"]
sports: ["Football","Squash","Rugby","Netball"]
professionalRegistration: HCPC Registered, CSP Member
insuranceInPlace: true
participantResponseType: BY_DEFAULT
logo: [attach image file]
```

**Response (201):**

```json
{
  "success": true,
  "message": "Service submitted for approval",
  "data": {
    "service": {
      "id": "SERVICE_ID",
      "title": "Women's Sports Physio",
      "image": "https://soniamalikbackend.mtscorporate.com/uploads/services/logo-1234567890.png",
      "bookingLink": "https://soniamalikbackend.mtscorporate.com/services/SERVICE_ID/book",
      "status": "PENDING",
      "isApproved": false,
      "providerType": "Physiotherapist",
      "sports": ["Football", "Squash", "Rugby", "Netball"],
      "sessionTypes": ["In Clinic", "Home Visits"],
      "insuranceInPlace": true,
      "participantResponseType": "BY_DEFAULT"
    }
  }
}
```

> **Save the `id` as `SERVICE_ID`** for use in following requests.

**Validation error example (400):**

```json
{
  "success": false,
  "message": "providerType must be one of: Physiotherapist, Sports Massage Therapist, ..."
}
```

---

## 2. Provider — View Own Services (Any Status)

**`GET /api/services/provider/my`**  
Auth: `PROVIDER_TOKEN`

Filters:

- `?status=PENDING`
- `?status=ACTIVE`
- `?page=1&limit=20`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "SERVICE_ID",
        "title": "Women's Sports Physio",
        "status": "PENDING",
        "isApproved": false,
        "_count": { "bookings": 0, "messages": 0 }
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20 }
  }
}
```

---

## 3. Admin — View All Services

**`GET /api/services/admin/all`**  
Auth: `ADMIN_TOKEN`

Filters: `?status=PENDING&sport=Football&search=physio&page=1&limit=20`

Returns: listing title, provider name, sports, postcode, status, engagement counts.

---

## 4. Admin — Approve Service ✅

**`PATCH /api/services/:SERVICE_ID/approve`**  
Auth: `ADMIN_TOKEN`  
No body required.

```json
{ "success": true, "message": "Service approved successfully" }
```

---

## 5. Admin — Reject Service ❌

**`PATCH /api/services/:SERVICE_ID/reject`**  
Auth: `ADMIN_TOKEN`  
Content-Type: `application/json`

```json
{
  "reason": "Missing professional registration details. Please provide HCPC membership number."
}
```

> `reason` is **required** — returns 400 if omitted.

---

## 6. Admin — Feature Service ⭐

**`PATCH /api/services/:SERVICE_ID/feature`**  
Auth: `ADMIN_TOKEN`  
No body. Toggles `FEATURED` ↔ `ACTIVE`.

---

## 7. Admin — Ban Service 🚫

**`PATCH /api/services/:SERVICE_ID/ban`**  
Auth: `ADMIN_TOKEN`  
Content-Type: `application/json`

```json
{ "reason": "Repeated policy violations regarding false credentials." }
```

---

## 8. Get All Approved Services (Public Listing)

**`GET /api/services`**

No auth required.

Filters:

- `?sport=Football` — filter by sport (exact match from allowed list)
- `?postcode=SW1` — partial postcode search
- `?search=physio` — search in title, headline, description, provider name, city
- `?page=1&limit=12`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "SERVICE_ID",
        "title": "Women's Sports Physio",
        "listingHeadline": "Expert physio for women in sport",
        "providerName": "Apex Performance Therapy Centre",
        "providerType": "Physiotherapist",
        "city": "Richmond",
        "postcode": "TW9 1AB",
        "sports": ["Football", "Squash"],
        "sessionTypes": ["In Clinic", "Home Visits"],
        "insuranceInPlace": true,
        "isFeatured": false,
        "participantResponseType": "BY_DEFAULT",
        "bookingLink": "https://soniamalikbackend.mtscorporate.com/services/SERVICE_ID/book",
        "image": "https://soniamalikbackend.mtscorporate.com/uploads/services/logo.jpg",
        "_count": { "bookings": 3 }
      }
    ],
    "pagination": { "total": 10, "page": 1, "limit": 12 }
  }
}
```

---

## 9. Get Single Service

**`GET /api/services/:SERVICE_ID`**

No auth required for approved services. PROVIDER/ADMIN required for unapproved.

---

## 10. Book Now — One-Click (USER) 📅

**`POST /api/services/:SERVICE_ID/book`**  
Auth: `USER_TOKEN`  
**No body required.** Name, email, phone are auto-fetched from the user's account.

**Behavior:**

- ✅ If user has registered interest → **interest is automatically removed** and booking is created
- ❌ If user already has a booking → returns 409 error

**Response (201):**

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": "BOOKING_ID",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "phoneNumber": "+1234567890",
      "type": "booking",
      "status": "pending",
      "paymentStatus": "pending"
    }
  }
}
```

**Error (409):**

```json
{
  "success": false,
  "message": "You have already booked this service"
}
```

---

## 11. Register Interest — One-Click (USER) 🔔

**`POST /api/services/:SERVICE_ID/interest`**  
Auth: `USER_TOKEN`  
**No body required.**

**Behavior:**

- ✅ If user has no booking or interest → creates interest
- ❌ If user already has a booking → returns 409 error (cannot register interest after booking)
- ❌ If user already has registered interest → returns 409 error

**Response (201):**

```json
{
  "success": true,
  "message": "Interest registered successfully",
  "data": {
    "interest": {
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "phoneNumber": "+1234567890",
      "type": "interest",
      "status": "pending",
      "paymentStatus": "not_applicable"
    }
  }
}
```

**Error (409) - Already Booked:**

```json
{
  "success": false,
  "message": "You have already booked this service. Cannot register interest."
}
```

**Error (409) - Already Registered:**

```json
{
  "success": false,
  "message": "You have already registered interest in this service"
}
```

---

## 12. Provider — View Bookings (Name, Phone, Email) 📋

**`GET /api/services/:SERVICE_ID/bookings`**  
Auth: `PROVIDER_TOKEN`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "BOOKING_ID",
        "fullName": "Jane Doe",
        "phoneNumber": "+1234567890",
        "email": "jane@example.com",
        "status": "pending",
        "createdAt": "2026-04-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 13. Provider — View Registered Interests 📋

**`GET /api/services/:SERVICE_ID/interests`**  
Auth: `PROVIDER_TOKEN`

Same response format as bookings above.

---

## 14. Send Message to Provider (USER) 💬

**`POST /api/services/:SERVICE_ID/messages`**  
Auth: `USER_TOKEN`  
Content-Type: `application/json`

```json
{
  "message": "Hi, I'd like to know more about your in-clinic sessions for post-surgery recovery."
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

---

## 15. Provider — View All Enquiries 📨

**`GET /api/services/:SERVICE_ID/messages`**  
Auth: `PROVIDER_TOKEN`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "MESSAGE_ID",
        "senderName": "Jane Doe",
        "senderPhone": "+1234567890",
        "senderEmail": "jane@example.com",
        "message": "Hi, I'd like to know more about your in-clinic sessions.",
        "isRead": false,
        "createdAt": "2026-04-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 16. Mark Message as Read (PROVIDER)

**`PATCH /api/services/messages/:MESSAGE_ID/read`**  
Auth: `PROVIDER_TOKEN`  
No body required.

---

## 17. Update Booking Status (PROVIDER)

**`PATCH /api/services/bookings/:BOOKING_ID/status`**  
Auth: `PROVIDER_TOKEN`  
Content-Type: `application/json`

```json
{ "status": "confirmed" }
```

| Valid Status | Meaning             |
| ------------ | ------------------- |
| `pending`    | Default on creation |
| `confirmed`  | Provider confirmed  |
| `upcoming`   | Appointment set     |
| `completed`  | Session done        |
| `cancelled`  | Cancelled           |

---

## 18. Update Service (PROVIDER)

**`PUT /api/services/:SERVICE_ID`**  
Auth: `PROVIDER_TOKEN`  
Content-Type: `multipart/form-data`

Send only the fields you want to change. Same allowed values for `providerType`, `sports`, `sessionTypes`, `participantResponseType` apply.

Attach `logo` file key to update the image.

**Example — update sports and session types:**

```
sports: ["Tennis","Netball","Cricket"]
sessionTypes: ["Online Video"]
```

---

## 19. Delete Service (PROVIDER)

**`DELETE /api/services/:SERVICE_ID`**  
Auth: `PROVIDER_TOKEN`

```json
{ "success": true, "message": "Service deleted successfully" }
```

---

## 20. Provider Dashboard

**`GET /api/services/dashboard`**  
Auth: `PROVIDER_TOKEN`

Returns total views, bookings, revenue, and recent activity across all own services.

---

## 21. Provider Analytics

**`GET /api/services/analytics`**  
Auth: `PROVIDER_TOKEN`

Returns per-service analytics (views, bookings, revenue).

---

## Reference Tables

### Service Status

| Status             | Label     | Description                        |
| ------------------ | --------- | ---------------------------------- |
| `PENDING` | Pending   | Submitted, awaiting admin review   |
| `ACTIVE`           | Live      | Approved, visible to public        |
| `FEATURED`         | Featured  | Approved + shown first in listings |
| `INACTIVE`         | Inactive  | Rejected by admin                  |
| `BANNED`           | Banned    | Banned by admin                    |
| `SUSPENDED`        | Suspended | Suspended                          |

### Provider Types

```
Physiotherapist
Sports Massage Therapist
Strength & Conditioning Coach
Nutritionist
Mental Health & Wellbeing
Coach / Trainer
Other
```

### Session Types

```
In Clinic
Home Visits
Online Video
```

### Sports

```
Football  |  Squash  |  Rugby  |  Netball  |  Cricket
Padel     |  Tennis  |  Badminton  |  Golf  |  Running  |  Other
```

### participantResponseType

```
BY_DEFAULT             → Book Now button
ADD_BOOKING_LINK       → External booking link
ALLOW_REGISTER_INTEREST → Register Interest button
```

---

## Error Codes

| Code | Meaning                                                                   |
| ---- | ------------------------------------------------------------------------- |
| 400  | Validation failed (invalid value, missing required field, missing reason) |
| 401  | No token or invalid token                                                 |
| 403  | Wrong role or not the service owner                                       |
| 404  | Service / booking / message not found                                     |
| 409  | Already booked / already registered interest                              |
| 500  | Server error                                                              |

---

## Postman Environment Variables

| Variable         | Where to get it                                  |
| ---------------- | ------------------------------------------------ |
| `BASE_URL`       | `https://soniamalikbackend.mtscorporate.com/api` |
| `PROVIDER_TOKEN` | Login response → `data.token`                    |
| `USER_TOKEN`     | Login response → `data.token`                    |
| `ADMIN_TOKEN`    | Login response → `data.token`                    |
| `SERVICE_ID`     | Create service response → `data.service.id`      |
| `BOOKING_ID`     | View bookings response → `data.bookings[0].id`   |
| `MESSAGE_ID`     | View messages response → `data.messages[0].id`   |

**Postman Test script to auto-save token on login:**

```js
if (pm.response.json().success) {
  pm.environment.set("PROVIDER_TOKEN", pm.response.json().data.token);
}
```

---

Last Updated: April 2026

---

## 0. Authentication — Get Tokens

### Login as PROVIDER

```
POST /api/auth/login

{
  "email": "provider@example.com",
  "password": "yourpassword"
}
```

### Login as USER

```
POST /api/auth/login

{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

### Login as ADMIN

```
POST /api/auth/login

{
  "email": "admin@essahub.com",
  "password": "yourpassword"
}
```

> Save token as `PROVIDER_TOKEN`, `USER_TOKEN`, `ADMIN_TOKEN`. Set env variable `SERVICE_ID` from step 1 response.

---

## 1. Create a Service (PROVIDER)

**`POST /api/services`**  
Auth: `PROVIDER_TOKEN`  
Content-Type: `multipart/form-data`

| Field                    | Example Value                   | Notes                                                   |
| ------------------------ | ------------------------------- | ------------------------------------------------------- |
| title                    | Women's Sports Physio           | Required                                                |
| providerName             | Apex Performance Therapy Centre | Required                                                |
| description              | This physiotherapy service...   | Required                                                |
| contactName              | Jane Doe                        |                                                         |
| providerPhone            | +447700900000                   |                                                         |
| providerEmail            | info@apex.com                   |                                                         |
| clinicName               | The Wellness Centre             |                                                         |
| addressLine1             | 123 High Street                 |                                                         |
| city                     | Richmond                        |                                                         |
| postcode                 | TW9 1AB                         |                                                         |
| providerType             | Physiotherapist                 |                                                         |
| listingHeadline          | Expert physio for women         |                                                         |
| aboutService             | Our specialist services...      |                                                         |
| sessionTypes             | `["In Clinic","Home Visits"]`   | JSON array string                                       |
| sports                   | `["Football","Squash","Rugby"]` | JSON array string                                       |
| professionalRegistration | HCPC Registered, CSP Member     |                                                         |
| insuranceInPlace         | true                            |                                                         |
| participantResponseType  | BY_DEFAULT                      | BY_DEFAULT / ADD_BOOKING_LINK / ALLOW_REGISTER_INTEREST |
| logo                     | (attach image file)             | PNG/JPG                                                 |

**Response (201):**

```json
{
  "success": true,
  "message": "Service submitted for approval",
  "data": {
    "service": {
      "id": "SERVICE_ID",
      "bookingLink": "/services/SERVICE_ID/book",
      "status": "PENDING",
      "isApproved": false
    }
  }
}
```

---

## 2. Provider — View Own Services (Any Status)

**`GET /api/services/provider/my`**  
Auth: `PROVIDER_TOKEN`

Filters: `?status=PENDING` or `?status=ACTIVE&page=1&limit=20`

---

## 3. Admin — View All Services

**`GET /api/services/admin/all`**  
Auth: `ADMIN_TOKEN`

Filters: `?status=PENDING&sport=Football&search=physio`

Returns: listing title, provider, category/sports, postcode, status, engagement counts.

---

## 4. Admin — Approve Service ✅

**`PATCH /api/services/:SERVICE_ID/approve`**  
Auth: `ADMIN_TOKEN`  
No body needed.

---

## 5. Admin — Reject Service ❌

**`PATCH /api/services/:SERVICE_ID/reject`**  
Auth: `ADMIN_TOKEN`

```json
{ "reason": "Missing professional registration details." }
```

---

## 6. Admin — Feature Service ⭐

**`PATCH /api/services/:SERVICE_ID/feature`**  
Auth: `ADMIN_TOKEN`  
No body. Toggles Featured ↔ Active.

---

## 7. Admin — Ban Service 🚫

**`PATCH /api/services/:SERVICE_ID/ban`**  
Auth: `ADMIN_TOKEN`

```json
{ "reason": "Repeated policy violations." }
```

---

## 8. Get All Approved Services (Public)

**`GET /api/services`**

Filters: `?sport=Football&postcode=SW1&search=physio&page=1&limit=12`

---

## 9. Get Single Service

**`GET /api/services/:SERVICE_ID`**

> Unapproved services are only shown to their PROVIDER or ADMIN.

---

## 10. Book Now — One-Click (USER) 📅

**`POST /api/services/:SERVICE_ID/book`**  
Auth: `USER_TOKEN`  
**No body required.** Name, email, phone auto-fetched from user account.

**Behavior:**

- ✅ If user has registered interest → **interest is removed** and booking is created
- ❌ If user already has a booking → returns 409 error

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "phoneNumber": "+1234567890",
      "type": "booking",
      "status": "pending"
    }
  }
}
```

> Returns 409 if user already booked this service.

---

## 11. Register Interest — One-Click (USER) 🔔

**`POST /api/services/:SERVICE_ID/interest`**  
Auth: `USER_TOKEN`  
**No body required.**

**Behavior:**

- ✅ If no booking or interest → creates interest
- ❌ If already booked → returns 409 error (cannot register interest after booking)
- ❌ If already registered interest → returns 409 error

```json
{
  "success": true,
  "message": "Interest registered successfully",
  "data": {
    "interest": { "type": "interest", "paymentStatus": "not_applicable", ... }
  }
}
```

> Error 409: "You have already booked this service. Cannot register interest."

---

## 12. Provider — View Bookings (Name, Phone, Email)

**`GET /api/services/:SERVICE_ID/bookings`**  
Auth: `PROVIDER_TOKEN`

```json
{
  "data": {
    "bookings": [
      {
        "fullName": "Jane Doe",
        "phoneNumber": "+1234567890",
        "email": "jane@example.com",
        "status": "pending",
        "createdAt": "2026-04-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 13. Provider — View Registered Interests

**`GET /api/services/:SERVICE_ID/interests`**  
Auth: `PROVIDER_TOKEN`

Same format as bookings above.

---

## 14. Send Message to Provider (USER) 💬

**`POST /api/services/:SERVICE_ID/messages`**  
Auth: `USER_TOKEN`

```json
{ "message": "Hi, I'd like to know more about your in-clinic sessions." }
```

---

## 15. Provider — View All Enquiries (Name, Phone, Email, Message, Date)

**`GET /api/services/:SERVICE_ID/messages`**  
Auth: `PROVIDER_TOKEN`

```json
{
  "data": {
    "messages": [
      {
        "senderName": "Jane Doe",
        "senderPhone": "+1234567890",
        "senderEmail": "jane@example.com",
        "message": "Hi, I'd like to know more...",
        "isRead": false,
        "createdAt": "2026-04-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 16. Mark Message as Read (PROVIDER)

**`PATCH /api/services/messages/:MESSAGE_ID/read`**  
Auth: `PROVIDER_TOKEN`

---

## 17. Update Booking Status (PROVIDER)

**`PATCH /api/services/bookings/:BOOKING_ID/status`**  
Auth: `PROVIDER_TOKEN`

```json
{ "status": "confirmed" }
```

Valid: `pending` | `confirmed` | `completed` | `cancelled` | `upcoming`

---

## 18. Update Service (PROVIDER)

**`PUT /api/services/:SERVICE_ID`**  
Auth: `PROVIDER_TOKEN`  
Content-Type: `multipart/form-data`

Send only fields to update. Attach `logo` key to update image.

---

## 19. Delete Service (PROVIDER)

**`DELETE /api/services/:SERVICE_ID`**  
Auth: `PROVIDER_TOKEN`

---

## 20. Provider Dashboard

**`GET /api/services/dashboard`**  
Auth: `PROVIDER_TOKEN`

---

## Service Status Values

| Status             | UI Label | Description                       |
| ------------------ | -------- | --------------------------------- |
| `PENDING` | Pending  | Submitted, awaiting review        |
| `ACTIVE`           | Live     | Approved, visible to public       |
| `FEATURED`         | Featured | Approved + featured (shown first) |
| `INACTIVE`         | Inactive | Rejected by admin                 |
| `BANNED`           | Banned   | Banned by admin                   |

---

## Error Codes

| Code | Meaning                                      |
| ---- | -------------------------------------------- |
| 400  | Validation failed or missing reason          |
| 401  | No token or invalid token                    |
| 403  | Wrong role or not service owner              |
| 404  | Service / booking / message not found        |
| 409  | Already booked / already registered interest |
| 500  | Server error                                 |

---

Last Updated: April 2026

## API Endpoints

### 1. Create Service (PROVIDER/ADMIN)

**Endpoint:** `POST {{baseUrl}}/api/services`  
**Auth:** Required (PROVIDER or ADMIN)  
**Content-Type:** `multipart/form-data` (for image upload)  
**Description:** Creates a new service and submits it for admin approval

**Form-Data Fields:**

| Field         | Type    | Required | Description                                                 |
| ------------- | ------- | -------- | ----------------------------------------------------------- |
| title         | text    | Yes      | Service title                                               |
| description   | text    | Yes      | Service description                                         |
| serviceType   | text    | Yes      | COACHING, TRAINING, THERAPY, CONSULTATION, NUTRITION, OTHER |
| fullAddress   | text    | Yes      | Complete address                                            |
| providerName  | text    | Yes      | Name of service provider                                    |
| providerPhone | text    | Yes      | Contact phone number                                        |
| providerEmail | text    | Yes      | Valid email address                                         |
| googleMapLink | text    | No       | Google Maps link                                            |
| image         | file    | No       | Service image (jpeg, jpg, png, gif, webp - max 5MB)         |
| price         | number  | No       | Price (default: 0)                                          |
| duration      | number  | No       | Duration in minutes (default: 60)                           |
| isOnline      | boolean | No       | Online service (default: false)                             |
| visibility    | text    | No       | "public" or "private" (default: "public")                   |
| availableDays | text    | No       | Days available                                              |
| timeSlots     | text    | No       | Available time slots                                        |
| category      | text    | No       | Service category                                            |
| aboutService  | text    | No       | Detailed description                                        |
| whoServiceFor | text    | No       | Target audience                                             |

**Postman Setup:**

1. Set method to `POST`
2. Select **Body** tab
3. Choose **form-data** (not x-www-form-urlencoded)
4. Add text fields with their values
5. For `image` field: Select **File** type from dropdown, then click "Select Files"
6. Add `Authorization: Bearer <token>` header

**Example Request (form-data):**

```
title: HeatX Physio Clinic
description: Professional physiotherapy services for athletes
serviceType: CONSULTATION
fullAddress: Dhaka
googleMapLink: https://maps.google.com/?q=123+Main+Street
providerName: Dr. John Smith
providerPhone: +1234567890
providerEmail: john.smith@heatx.com
image: [Select File] - clinic-photo.jpg
price: 120
duration: 60
isOnline: false
visibility: public
availableDays: Monday, Wednesday, Friday
timeSlots: 9:00 AM - 5:00 PM
category: Healthcare
aboutService: We provide comprehensive physiotherapy services
whoServiceFor: Athletes, post-surgery patients
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Service created and submitted for approval",
  "data": {
    "service": {
      "id": "service_id_here",
      "title": "HeatX Physio Clinic",
      "status": "PENDING",
      "isApproved": false,
      "image": "/uploads/services/clinic-photo-1234567890-987654321.jpg",
      "providerName": "Dr. John Smith",
      "providerPhone": "+1234567890",
      "providerEmail": "john.smith@heatx.com",
      "fullAddress": "Dhaka",
      "price": 120,
      "duration": 60,
      "provider": {
        "id": "provider_id",
        "name": "Provider Name",
        "email": "provider@essahub.com",
        "role": "PROVIDER"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Image Access:**

- Uploaded images are stored on the server
- Image URL format: `{{baseUrl}}/uploads/services/filename.jpg`
- Example: `http://localhost:3000/uploads/services/clinic-photo-1234567890.jpg`

**Image Requirements:**

- **Allowed formats:** JPEG, JPG, PNG, GIF, WEBP
- **Maximum size:** 5MB
- **Field name:** `image` (in form-data)

**Error Response (400 - Invalid File):**

```json
{
  "success": false,
  "message": "Only image files are allowed (jpeg, jpg, png, gif, webp)"
}
```

**Error Response (400 - File Too Large):**

```json
{
  "success": false,
  "message": "File too large. Maximum size is 5MB"
}
```

---

### 2. Get All Services

**Endpoint:** `GET {{baseUrl}}/api/services`  
**Auth:** Public  
**Description:** Get list of services with pagination and filters

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 8000)
- `serviceType` - Filter by service type
- `status` - Filter by status (PENDING, ACTIVE, INACTIVE)
- `isApproved` - Filter by approval status ("true" or "false")
- `search` - Search in title and description

**Examples:**

1. Get all approved services (Public view):

```
GET {{baseUrl}}/api/services?isApproved=true
```

2. Get pending services (Admin view):

```
GET {{baseUrl}}/api/services?status=PENDING
```

3. Search services:

```
GET {{baseUrl}}/api/services?search=physio&isApproved=true
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "service_id",
        "title": "HeatX Physio Clinic",
        "description": "Professional physiotherapy services",
        "serviceType": "Physiotherapy",
        "status": "ACTIVE",
        "isApproved": true,
        "providerName": "Dr. John Smith",
        "providerPhone": "+1234567890",
        "providerEmail": "john.smith@heatx.com",
        "fullAddress": "123 Main Street, Downtown, City 12345",
        "googleMapLink": "https://maps.google.com/?q=123+Main+Street",
        "visibility": "public",
        "availableDays": "Monday, Wednesday, Friday",
        "timeSlots": "9:00 AM - 5:00 PM",
        "category": "Healthcare",
        "aboutService": "Comprehensive physiotherapy services...",
        "whoServiceFor": "Athletes, post-surgery patients...",
        "price": 100,
        "duration": 60,
        "provider": {
          "id": "provider_id",
          "name": "Provider Name",
          "email": "provider@essahub.com",
          "role": "PROVIDER"
        },
        "_count": {
          "bookings": 5
        },
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 8000,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 3. Get Service by ID

**Endpoint:** `GET {{baseUrl}}/api/services/:id`  
**Auth:** Public for approved services, Private for pending (Provider/Admin only)  
**Description:** Get detailed service information including bookings

**Success Response (200):**

```json
{
  "success": true,
  "message": "Service retrieved successfully",
  "data": {
    "service": {
      "id": "service_id",
      "title": "HeatX Physio Clinic",
      "description": "Professional physiotherapy services",
      "serviceType": "Physiotherapy",
      "fullAddress": "123 Main Street, Downtown, City 12345",
      "googleMapLink": "https://maps.google.com/?q=123+Main+Street",
      "providerName": "Dr. John Smith",
      "providerPhone": "+1234567890",
      "providerEmail": "john.smith@heatx.com",
      "image": "https://example.com/images/heatx-clinic.jpg",
      "price": 100,
      "duration": 60,
      "isOnline": false,
      "status": "ACTIVE",
      "isApproved": true,
      "visibility": "public",
      "availableDays": "Monday, Wednesday, Friday",
      "timeSlots": "9:00 AM - 5:00 PM",
      "category": "Healthcare",
      "aboutService": "We provide comprehensive physiotherapy services...",
      "whoServiceFor": "Athletes, post-surgery patients...",
      "provider": {
        "id": "provider_id",
        "name": "Provider Name",
        "email": "provider@essahub.com",
        "avatar": "avatar_url",
        "role": "PROVIDER"
      },
      "bookings": [
        {
          "id": "booking_id",
          "fullName": "Jane Doe",
          "email": "jane@example.com",
          "phoneNumber": "+1987654321",
          "aboutMe": "I'm an athlete recovering from knee injury",
          "status": "confirmed",
          "bookingDate": "2024-01-20T14:00:00Z",
          "user": {
            "id": "user_id",
            "name": "Jane Doe",
            "email": "jane@example.com"
          },
          "createdAt": "2024-01-15T12:00:00Z"
        }
      ],
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

### 4. Update Service Approval Status (ADMIN Only)

**Endpoint:** `PATCH {{baseUrl}}/api/services/:id/approval-status`  
**Auth:** Required (ADMIN only)  
**Description:** Approve or reject a pending service

**To Approve Service:**

```json
{
  "action": "approve"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Service approved successfully",
  "data": {
    "service": {
      "id": "service_id",
      "title": "HeatX Physio Clinic",
      "status": "ACTIVE",
      "isApproved": true,
      "provider": {
        "id": "provider_id",
        "name": "Provider Name",
        "email": "provider@essahub.com"
      },
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

**To Reject Service:**

```json
{
  "action": "reject",
  "reason": "Incomplete documentation"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Service rejected",
  "data": {
    "service": {
      "id": "service_id",
      "title": "HeatX Physio Clinic",
      "status": "INACTIVE",
      "isApproved": false,
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

---

### 5. Create Service Booking (Public)

**Endpoint:** `POST {{baseUrl}}/api/services/:id/bookings`  
**Auth:** Optional (works with or without authentication)  
**Description:** Submit booking form for a service (contact form submission)

**Request Body:**

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phoneNumber": "+1987654321",
  "aboutMe": "I'm an athlete recovering from a knee injury and would like to schedule an appointment for assessment and treatment planning.",
  "notes": "Prefer morning appointments",
  "bookingDate": "2024-01-20T14:00:00Z"
}
```

**Required Fields:**

- `fullName` - Full name
- `email` - Valid email address
- `phoneNumber` - Contact phone number

**Optional Fields:**

- `aboutMe` - Details about the user/reason for booking
- `notes` - Additional notes
- `bookingDate` - Preferred date/time

**Success Response (201):**

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": "booking_id",
      "serviceId": "service_id",
      "userId": "user_id_or_null",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "phoneNumber": "+1987654321",
      "aboutMe": "I'm an athlete recovering from a knee injury...",
      "notes": "Prefer morning appointments",
      "status": "pending",
      "bookingDate": "2024-01-20T14:00:00Z",
      "service": {
        "id": "service_id",
        "title": "HeatX Physio Clinic",
        "serviceType": "Physiotherapy",
        "providerName": "Dr. John Smith",
        "providerPhone": "+1234567890",
        "providerEmail": "john.smith@heatx.com"
      },
      "user": {
        "id": "user_id",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "createdAt": "2024-01-15T12:00:00Z"
    }
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": "Service is not approved yet"
}
```

---

### 6. Get Service Bookings (PROVIDER/ADMIN)

**Endpoint:** `GET {{baseUrl}}/api/services/:id/bookings`  
**Auth:** Required (PROVIDER or ADMIN)  
**Description:** Get all bookings for a specific service (Active Sessions)

**Authorization:**

- Provider can only view bookings for their own services
- Admin can view bookings for any service

**Success Response (200):**

```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": {
    "bookings": [
      {
        "id": "booking_id_1",
        "fullName": "Jane Doe",
        "email": "jane@example.com",
        "phoneNumber": "+1987654321",
        "aboutMe": "Athlete recovering from knee injury",
        "notes": "Prefer morning appointments",
        "status": "confirmed",
        "bookingDate": "2024-01-20T14:00:00Z",
        "user": {
          "id": "user_id",
          "name": "Jane Doe",
          "email": "jane@example.com",
          "avatar": "avatar_url"
        },
        "createdAt": "2024-01-15T12:00:00Z"
      },
      {
        "id": "booking_id_2",
        "fullName": "John Smith",
        "email": "john@example.com",
        "phoneNumber": "+1234567890",
        "aboutMe": "Post-surgery rehabilitation needed",
        "status": "pending",
        "bookingDate": "2024-01-22T10:00:00Z",
        "user": null,
        "createdAt": "2024-01-16T09:00:00Z"
      }
    ]
  }
}
```

**Error Response (403):**

```json
{
  "success": false,
  "error": "Not authorized to view these bookings"
}
```

---

### 7. Update Booking Status (PROVIDER/ADMIN)

**Endpoint:** `PATCH {{baseUrl}}/api/services/bookings/:bookingId/status`  
**Auth:** Required (PROVIDER or ADMIN)  
**Description:** Update the status of a booking

**Request Body:**

```json
{
  "status": "confirmed"
}
```

**Valid Status Values:**

- `pending` - Initial status
- `confirmed` - Booking confirmed by provider
- `upcoming` - Appointment is upcoming
- `completed` - Service completed
- `cancelled` - Booking cancelled

**Success Response (200):**

```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "booking": {
      "id": "booking_id",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "phoneNumber": "+1987654321",
      "status": "confirmed",
      "bookingDate": "2024-01-20T14:00:00Z",
      "service": {
        "id": "service_id",
        "title": "HeatX Physio Clinic",
        "serviceType": "Physiotherapy"
      },
      "user": {
        "id": "user_id",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "updatedAt": "2024-01-15T13:00:00Z"
    }
  }
}
```

---

### 8. Update Service

**Endpoint:** `PUT {{baseUrl}}/api/services/:id`  
**Auth:** Required (Provider can update own, Admin can update any)  
**Description:** Update service details

**Request Body:** (All fields optional)

```json
{
  "title": "Updated Service Name",
  "description": "Updated description",
  "price": 150,
  "availableDays": "Monday, Tuesday, Wednesday",
  "timeSlots": "8:00 AM - 6:00 PM"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Service updated successfully",
  "data": {
    "service": {
      "id": "service_id",
      "title": "Updated Service Name",
      "description": "Updated description",
      "price": 150,
      "updatedAt": "2024-01-15T14:00:00Z"
    }
  }
}
```

---

### 9. Delete Service

**Endpoint:** `DELETE {{baseUrl}}/api/services/:id`  
**Auth:** Required (Provider can delete own, Admin can delete any)  
**Description:** Delete a service

**Success Response (200):**

```json
{
  "success": true,
  "message": "Service deleted successfully"
}
```

---

### 10. Get Provider Dashboard Summary

**Endpoint:** `GET {{baseUrl}}/api/services/dashboard`  
**Auth:** Required (PROVIDER or ADMIN)  
**Description:** Get comprehensive dashboard with total views, bookings, revenue, and recent activity

**Success Response (200):**

```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "dashboard": {
      "summary": {
        "totalViews": 1250,
        "totalBookings": 45,
        "totalRevenue": 4500.0,
        "averageRating": 4.65
      },
      "services": {
        "active": 5,
        "pending": 2,
        "inactive": 1
      },
      "recentBookings": [
        {
          "id": "booking_id",
          "fullName": "Jane Doe",
          "email": "jane@example.com",
          "phoneNumber": "+1987654321",
          "status": "confirmed",
          "bookingDate": "2024-01-20T14:00:00Z",
          "service": {
            "id": "service_id",
            "title": "HeatX Physio Clinic",
            "serviceType": "Physiotherapy"
          },
          "user": {
            "id": "user_id",
            "name": "Jane Doe",
            "email": "jane@example.com"
          },
          "createdAt": "2024-01-15T12:00:00Z"
        }
      ]
    }
  }
}
```

---

## Analytics Tracking System

The system automatically tracks analytics for each service to provide insights to providers.

### Automatic Tracking Features:

#### 1. **Views Tracking**

- **Triggered:** Every time `GET /api/services/:id` is called
- **Who is tracked:** Public users, regular users, coaches
- **Who is NOT tracked:** Service provider viewing their own service, admins
- **Purpose:** Measure genuine interest in the service

#### 2. **Bookings Tracking**

- **Triggered:** When `POST /api/services/:id/bookings` creates a new booking
- **Action:** Increments booking count by 1
- **Purpose:** Track total booking requests received

#### 3. **Revenue Tracking**

- **Triggered:** When booking status changes from any status to "completed"
- **Action:** Adds the service price to total revenue
- **Purpose:** Calculate total earnings from completed services
- **Note:** Revenue is only added once per booking (prevents double counting)

#### 4. **Analytics Record Creation**

- **Triggered:** Automatically when admin approves a service
- **Initial State:** `{ views: 0, bookings: 0, revenue: 0, rating: null }`
- **Purpose:** Ensure every approved service has an analytics record

### Analytics Flow Example:

```
1. PROVIDER creates service
   → Status: PENDING
   → No analytics yet

2. ADMIN approves service
   → Status: ACTIVE, isApproved: true
   → Analytics created: { views: 0, bookings: 0, revenue: 0 }

3. PUBLIC user views service detail
   → Analytics: { views: 1, bookings: 0, revenue: 0 }

4. USER submits booking (service price: $100)
   → Analytics: { views: 1, bookings: 1, revenue: 0 }
   → Revenue not added yet (booking is pending)

5. PROVIDER confirms booking
   → Status changed to "confirmed"
   → Analytics: { views: 1, bookings: 1, revenue: 0 }

6. PROVIDER marks booking as completed
   → Status changed to "completed"
   → Analytics: { views: 1, bookings: 1, revenue: 100 }
   → Revenue added!

7. Another user views the service
   → Analytics: { views: 2, bookings: 1, revenue: 100 }
```

### Dashboard Metrics:

**Total Views:** Sum of all views across all provider's services  
**Total Bookings:** Sum of all bookings across all provider's services  
**Total Revenue:** Sum of all revenue across all provider's services  
**Average Rating:** Average rating across all provider's services  
**Service Counts:** Number of active, pending, and inactive services  
**Recent Bookings:** Last 10 bookings across all provider's services

---

## Complete Workflow Testing

### Test Scenario: Complete Service Provider Journey

#### Step 1: Provider Creates Service

```
POST {{baseUrl}}/api/services
Authorization: Bearer <provider_token>

{
  "title": "HeatX Physio Clinic",
  "description": "Professional physiotherapy services",
  "serviceType": "Physiotherapy",
  "fullAddress": "123 Main Street, Downtown, City 12345",
  "providerName": "Dr. John Smith",
  "providerPhone": "+1234567890",
  "providerEmail": "john.smith@heatx.com"
}
```

✅ Service created with status: PENDING, isApproved: false

#### Step 2: Admin Views Pending Services

```
GET {{baseUrl}}/api/services?status=PENDING
Authorization: Bearer <admin_token>
```

✅ See all pending services awaiting approval

#### Step 3: Admin Approves Service

```
PATCH {{baseUrl}}/api/services/{service_id}/approval-status
Authorization: Bearer <admin_token>

{
  "action": "approve"
}
```

✅ Service status changed to ACTIVE, isApproved: true

#### Step 4: Public Views Approved Services

```
GET {{baseUrl}}/api/services?isApproved=true
```

✅ Service visible to public, no auth required

#### Step 5: User Views Service Details

```
GET {{baseUrl}}/api/services/{service_id}
```

✅ See full service details including provider contact info

#### Step 6: User Submits Booking Form

```
POST {{baseUrl}}/api/services/{service_id}/bookings

{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phoneNumber": "+1987654321",
  "aboutMe": "Athlete recovering from knee injury",
  "bookingDate": "2024-01-20T14:00:00Z"
}
```

✅ Booking created with status: pending

#### Step 7: Provider Views Bookings (Active Sessions)

```
GET {{baseUrl}}/api/services/{service_id}/bookings
Authorization: Bearer <provider_token>
```

✅ See all booking inquiries for their service

#### Step 8: Provider Confirms Booking

```
PATCH {{baseUrl}}/api/services/bookings/{booking_id}/status
Authorization: Bearer <provider_token>

{
  "status": "confirmed"
}
```

✅ Booking status updated to confirmed

---

## Error Codes

| Status Code | Description                              |
| ----------- | ---------------------------------------- |
| 200         | Success                                  |
| 201         | Created                                  |
| 400         | Bad Request (validation error)           |
| 401         | Unauthorized (no token or invalid token) |
| 403         | Forbidden (insufficient permissions)     |
| 404         | Not Found                                |
| 500         | Internal Server Error                    |

---

## Common Validation Errors

### Create Service Errors:

```json
{
  "success": false,
  "errors": [
    { "field": "title", "message": "Service title is required" },
    { "field": "providerEmail", "message": "Valid provider email is required" },
    { "field": "fullAddress", "message": "Full address is required" }
  ]
}
```

### Create Booking Errors:

```json
{
  "success": false,
  "errors": [
    { "field": "fullName", "message": "Full name is required" },
    { "field": "email", "message": "Valid email is required" },
    { "field": "phoneNumber", "message": "Phone number is required" }
  ]
}
```

---

## Testing Tips

1. **Login First**: Get JWT tokens for different roles using login endpoint
2. **Test Permissions**: Try accessing endpoints with wrong roles to verify authorization
3. **Test Approval Flow**: Create service → verify pending → approve as admin → verify active
4. **Test Public Booking**: Submit booking without authentication (don't send Authorization header)
5. **Test Provider Dashboard**: Provider should only see their own services and bookings
6. **Test Search**: Use search parameter to find services by title or description
7. **Test Filters**: Combine multiple filters (serviceType, status, isApproved)

---

## Postman Collection Setup

### Environment Variables

```
baseUrl: http://localhost:3000
adminToken: <jwt_token_for_admin>
providerToken: <jwt_token_for_provider>
userToken: <jwt_token_for_user>
currentServiceId: <service_id_from_create_response>
currentBookingId: <booking_id_from_create_response>
```

### Pre-request Scripts (for authenticated requests)

```javascript
pm.request.headers.add({
  key: "Authorization",
  value: "Bearer " + pm.environment.get("providerToken"),
});
```

### Tests (extract IDs from responses)

```javascript
// After creating service
const response = pm.response.json();
if (response.success) {
    pm.environment.set('currentServiceId', response.data.service.id);
}

// After creating booking
const response = pm.response.json();
---

Last Updated: April 2026
```
