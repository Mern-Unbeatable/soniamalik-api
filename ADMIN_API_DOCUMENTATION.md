# Admin API Documentation

## Overview

Admin APIs provide user management functionality including suspension and user moderation capabilities.

**Base URL**: `/api/admin`

**Authentication**: All admin endpoints require authentication and `ADMIN` role.

**Authorization Header**:

```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get All Suspended Users

**Endpoint**: `GET /api/admin/suspended-users`

**Description**: Retrieve a paginated list of all suspended users.

**Authentication**: Required (ADMIN role)

**Query Parameters**:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search by name or email

**Example Request**:

```http
GET /api/admin/suspended-users?page=1&limit=20&search=john
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "cm5abc123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "role": "USER",
      "status": "SUSPENDED",
      "suspensionReason": "Violation of community guidelines - posting spam content repeatedly",
      "suspendedAt": "2026-03-26T10:30:00.000Z",
      "avatar": "https://example.com/avatars/johndoe.jpg",
      "createdAt": "2025-12-15T08:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

### 2. Suspend User

**Endpoint**: `POST /api/admin/users/:id/suspend`

**Description**: Suspend a user with a specific reason. Suspended users cannot perform any actions in the system.

**Authentication**: Required (ADMIN role)

**URL Parameters**:

- `id` (required): User ID to suspend

**Request Body**:

```json
{
  "reason": "Violation of community guidelines - posting inappropriate content"
}
```

**Validation Rules**:

- `reason`: Required, must be between 10 and 500 characters

**Example Request**:

```http
POST /api/admin/users/cm5abc123/suspend
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "reason": "Violation of community guidelines - posting spam content repeatedly"
}
```

**Example Success Response**:

```json
{
  "success": true,
  "message": "User suspended successfully",
  "data": {
    "user": {
      "id": "cm5abc123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "role": "USER",
      "status": "SUSPENDED",
      "suspensionReason": "Violation of community guidelines - posting spam content repeatedly",
      "suspendedAt": "2026-03-26T15:24:36.123Z"
    }
  }
}
```

**Error Responses**:

**400 Bad Request** - Missing or invalid reason:

```json
{
  "success": false,
  "message": "Suspension reason is required"
}
```

**400 Bad Request** - User already suspended:

```json
{
  "success": false,
  "message": "User is already suspended"
}
```

**400 Bad Request** - Admin trying to suspend themselves:

```json
{
  "success": false,
  "message": "You cannot suspend yourself"
}
```

**404 Not Found** - User not found:

```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 3. Unsuspend User

**Endpoint**: `POST /api/admin/users/:id/unsuspend`

**Description**: Restore a suspended user's account to active status.

**Authentication**: Required (ADMIN role)

**URL Parameters**:

- `id` (required): User ID to unsuspend

**Example Request**:

```http
POST /api/admin/users/cm5abc123/unsuspend
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Success Response**:

```json
{
  "success": true,
  "message": "User unsuspended successfully",
  "data": {
    "user": {
      "id": "cm5abc123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "role": "USER",
      "status": "ACTIVE",
      "suspensionReason": null,
      "suspendedAt": null
    }
  }
}
```

**Error Responses**:

**400 Bad Request** - User is not suspended:

```json
{
  "success": false,
  "message": "User is not suspended"
}
```

**404 Not Found** - User not found:

```json
{
  "success": false,
  "message": "User not found"
}
```

---

## User Roles

The system supports the following user roles:

- `USER`: Regular users
- `ADMIN`: Administrators (can access all admin endpoints)
- `PROVIDER`: Service providers
- `COACH`: Coaches

**Note**: Admins can suspend any role including PROVIDER and COACH.

---

## User Status

Users can have the following statuses:

- `ACTIVE`: User can perform all actions
- `INACTIVE`: User account is deactivated
- `SUSPENDED`: User is suspended and cannot perform any actions

**Important**: When a user is suspended, they receive a 403 Forbidden error with the message "Your account has been suspended. Please contact support." when trying to access any authenticated endpoint.

---

## Common Error Responses

**401 Unauthorized** - No token or invalid token:

```json
{
  "success": false,
  "message": "No token provided"
}
```

**403 Forbidden** - User is not admin:

```json
{
  "success": false,
  "message": "Access denied. Required role: ADMIN"
}
```

**403 Forbidden** - User account is suspended:

```json
{
  "success": false,
  "message": "Your account has been suspended. Please contact support."
}
```

**500 Internal Server Error**:

```json
{
  "success": false,
  "message": "Error message details"
}
```

---

## Testing with cURL

### Suspend a user:

```bash
curl -X POST http://localhost:5000/api/admin/users/cm5abc123/suspend \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Violation of community guidelines - posting spam content repeatedly"
  }'
```

### Unsuspend a user:

```bash
curl -X POST http://localhost:5000/api/admin/users/cm5abc123/unsuspend \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get all suspended users:

```bash
curl -X GET "http://localhost:5000/api/admin/suspended-users?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Database Schema

### User Model Suspension Fields:

```prisma
model User {
  id               String      @id @default(cuid())
  email            String      @unique
  name             String?
  role             Role        @default(USER)
  status           UserStatus  @default(ACTIVE)
  suspensionReason String?     // Reason for suspension
  suspendedAt      DateTime?   // Timestamp when user was suspended
  // ... other fields
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

---

## Notes

- Admins cannot suspend themselves
- Suspended users are immediately blocked from all authenticated endpoints
- Suspension reason must be between 10 and 500 characters
- When unsuspending, the suspensionReason and suspendedAt fields are cleared
- The suspension system works for all user roles: USER, PROVIDER, and COACH
