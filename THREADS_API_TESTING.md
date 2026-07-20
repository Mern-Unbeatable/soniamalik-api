# Threads API Testing Guide (Postman)

## Overview
This guide covers testing the Community Threads/Forum API endpoints using Postman.

## Role-Based Access Control

### Access Rules:
- ✅ **USER & ADMIN**: Can view, create threads, post comments, update/delete own threads
- ✅ **PROVIDER & COACH**: Can only view threads (read-only access)
- ❌ **PROVIDER & COACH**: Cannot create threads or post comments

## Authentication Setup

### 1. Get Authentication Token
First, login to get a JWT token:

**Endpoint:** `POST {{baseUrl}}/api/auth/login`

**Request Body:**
```json
{
  "email": "user@essahub.com",
  "password": "demo123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id-here",
      "email": "user@essahub.com",
      "name": "Regular User",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Set Authorization Header
For protected endpoints, add to Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## API Endpoints

### 1. Get All Threads (Public - All Roles)

**Endpoint:** `GET {{baseUrl}}/api/threads`

**Headers:** None required (optional auth)

**Query Parameters (Optional):**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 8000)
- `category` - Filter by category (GENERAL, TRAINING, NUTRITION, INJURY, EQUIPMENT, EVENTS, SUPPORT, OTHER)
- `status` - Filter by status (OPEN, CLOSED, PINNED, ARCHIVED)
- `search` - Search in title and content

**Example Request:**
```
GET {{baseUrl}}/api/threads?category=TRAINING&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "thread-id-1",
      "title": "Best training techniques for beginners",
      "content": "I'm new to sports training and looking for advice...",
      "category": "TRAINING",
      "status": "OPEN",
      "views": 45,
      "isPinned": false,
      "isLocked": false,
      "createdAt": "2026-02-15T10:00:00.000Z",
      "updatedAt": "2026-02-15T10:00:00.000Z",
      "author": {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": null
      },
      "_count": {
        "replies": 12
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 2. Get Thread by ID (Public - All Roles)

**Endpoint:** `GET {{baseUrl}}/api/threads/:id`

**Headers:** None required

**Example Request:**
```
GET {{baseUrl}}/api/threads/thread-id-123
```

**Response:**
```json
{
  "success": true,
  "message": "Thread retrieved successfully",
  "data": {
    "thread": {
      "id": "thread-id-123",
      "title": "How to prevent injuries during training?",
      "content": "I've been experiencing some pain after workouts...",
      "category": "INJURY",
      "status": "OPEN",
      "views": 67,
      "isPinned": false,
      "isLocked": false,
      "createdAt": "2026-02-14T08:30:00.000Z",
      "updatedAt": "2026-02-14T08:30:00.000Z",
      "author": {
        "id": "user-id",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatar": "avatar-url"
      },
      "replies": [
        {
          "id": "reply-id-1",
          "content": "Make sure to warm up properly before exercise...",
          "createdAt": "2026-02-14T09:15:00.000Z",
          "updatedAt": "2026-02-14T09:15:00.000Z",
          "author": {
            "id": "user-id-2",
            "name": "Coach Mike",
            "email": "coach@example.com",
            "avatar": null
          }
        }
      ]
    }
  }
}
```

---

### 3. Create Thread (USER & ADMIN Only)

**Endpoint:** `POST {{baseUrl}}/api/threads`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "What supplements do you recommend for recovery?",
  "content": "I'm looking for natural supplements to help with post-workout recovery. What has worked for you?",
  "category": "NUTRITION"
}
```

**Valid Categories:**
- `GENERAL`
- `TRAINING`
- `NUTRITION`
- `INJURY`
- `EQUIPMENT`
- `EVENTS`
- `SUPPORT`
- `OTHER`

**Success Response (201):**
```json
{
  "success": true,
  "message": "Thread created successfully",
  "data": {
    "thread": {
      "id": "new-thread-id",
      "title": "What supplements do you recommend for recovery?",
      "content": "I'm looking for natural supplements...",
      "category": "NUTRITION",
      "status": "OPEN",
      "views": 0,
      "isPinned": false,
      "isLocked": false,
      "authorId": "user-id",
      "createdAt": "2026-02-15T12:00:00.000Z",
      "updatedAt": "2026-02-15T12:00:00.000Z",
      "author": {
        "id": "user-id",
        "name": "Your Name",
        "email": "your@email.com",
        "avatar": null
      }
    }
  }
}
```

**Error Response for PROVIDER/COACH (403):**
```json
{
  "success": false,
  "message": "Only Users and Admins can post threads and comments. Providers and Coaches have read-only access."
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Thread title is required"
    },
    {
      "field": "category",
      "message": "Valid category is required (GENERAL, TRAINING, NUTRITION, INJURY, EQUIPMENT, EVENTS, SUPPORT, OTHER)"
    }
  ]
}
```

---

### 4. Update Thread (Author or ADMIN Only)

**Endpoint:** `PUT {{baseUrl}}/api/threads/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "title": "Updated title for the thread",
  "content": "Updated content with more details...",
  "category": "TRAINING"
}
```

**Example Request:**
```
PUT {{baseUrl}}/api/threads/thread-id-123

{
  "title": "Best training techniques for beginners - Updated",
  "content": "Updated with more information about proper form..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Thread updated successfully",
  "data": {
    "thread": {
      "id": "thread-id-123",
      "title": "Best training techniques for beginners - Updated",
      "content": "Updated with more information...",
      "category": "TRAINING",
      "status": "OPEN",
      "updatedAt": "2026-02-15T13:00:00.000Z"
    }
  }
}
```

**Error - Not Authorized (403):**
```json
{
  "success": false,
  "message": "Not authorized to update this thread"
}
```

---

### 5. Delete Thread (Author or ADMIN Only)

**Endpoint:** `DELETE {{baseUrl}}/api/threads/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example Request:**
```
DELETE {{baseUrl}}/api/threads/thread-id-123
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Thread deleted successfully"
}
```

**Error - Not Authorized (403):**
```json
{
  "success": false,
  "message": "Not authorized to delete this thread"
}
```

---

### 6. Post Reply/Comment (USER & ADMIN Only)

**Endpoint:** `POST {{baseUrl}}/api/threads/:id/replies`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Great question! I've been using protein powder and it really helps with recovery. Make sure to also get enough sleep!"
}
```

**Example Request:**
```
POST {{baseUrl}}/api/threads/thread-id-123/replies

{
  "content": "I recommend trying BCAA supplements. They've worked well for me."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Reply posted successfully",
  "data": {
    "reply": {
      "id": "reply-id-456",
      "threadId": "thread-id-123",
      "content": "I recommend trying BCAA supplements...",
      "authorId": "user-id",
      "createdAt": "2026-02-15T14:00:00.000Z",
      "updatedAt": "2026-02-15T14:00:00.000Z",
      "author": {
        "id": "user-id",
        "name": "Your Name",
        "email": "your@email.com",
        "avatar": null
      }
    }
  }
}
```

**Error - Thread Locked (400):**
```json
{
  "success": false,
  "message": "Thread is locked"
}
```

**Error - PROVIDER/COACH Role (403):**
```json
{
  "success": false,
  "message": "Only Users and Admins can post threads and comments. Providers and Coaches have read-only access."
}
```

---

### 7. Pin/Unpin Thread (ADMIN Only)

**Endpoint:** `PATCH {{baseUrl}}/api/threads/:id/pin`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN_HERE
```

**Example Request:**
```
PATCH {{baseUrl}}/api/threads/thread-id-123/pin
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Thread pinned successfully",
  "data": {
    "thread": {
      "id": "thread-id-123",
      "title": "Important announcement",
      "isPinned": true
    }
  }
}
```

---

### 8. Lock/Unlock Thread (ADMIN Only)

**Endpoint:** `PATCH {{baseUrl}}/api/threads/:id/lock`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN_HERE
```

**Example Request:**
```
PATCH {{baseUrl}}/api/threads/thread-id-123/lock
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Thread locked successfully",
  "data": {
    "thread": {
      "id": "thread-id-123",
      "title": "Thread title",
      "isLocked": true
    }
  }
}
```

---

## Testing Scenarios

### Scenario 1: User Creates and Comments on Thread

1. **Login as USER**
   ```
   POST {{baseUrl}}/api/auth/login
   Body: { "email": "user@essahub.com", "password": "demo123" }
   ```

2. **Create Thread**
   ```
   POST {{baseUrl}}/api/threads
   Headers: Authorization: Bearer USER_TOKEN
   Body: {
     "title": "Training tips needed",
     "content": "Looking for advice...",
     "category": "TRAINING"
   }
   ```

3. **View Thread**
   ```
   GET {{baseUrl}}/api/threads/THREAD_ID
   ```

4. **Post Comment**
   ```
   POST {{baseUrl}}/api/threads/THREAD_ID/replies
   Headers: Authorization: Bearer USER_TOKEN
   Body: { "content": "Thanks for suggestions!" }
   ```

### Scenario 2: Provider Tries to Post (Should Fail)

1. **Login as PROVIDER**
   ```
   POST {{baseUrl}}/api/auth/login
   Body: { "email": "provider@essahub.com", "password": "demo123" }
   ```

2. **Try to Create Thread (403 Error Expected)**
   ```
   POST {{baseUrl}}/api/threads
   Headers: Authorization: Bearer PROVIDER_TOKEN
   Body: {
     "title": "Test thread",
     "content": "Test content",
     "category": "GENERAL"
   }
   ```
   **Expected:** 403 Forbidden with message about read-only access

3. **View Threads (Should Work)**
   ```
   GET {{baseUrl}}/api/threads
   Headers: Authorization: Bearer PROVIDER_TOKEN
   ```

### Scenario 3: Admin Manages Threads

1. **Login as ADMIN**
   ```
   POST {{baseUrl}}/api/auth/login
   Body: { "email": "admin@essahub.com", "password": "demo123" }
   ```

2. **Pin Important Thread**
   ```
   PATCH {{baseUrl}}/api/threads/THREAD_ID/pin
   Headers: Authorization: Bearer ADMIN_TOKEN
   ```

3. **Lock Thread**
   ```
   PATCH {{baseUrl}}/api/threads/THREAD_ID/lock
   Headers: Authorization: Bearer ADMIN_TOKEN
   ```

4. **Delete Any Thread**
   ```
   DELETE {{baseUrl}}/api/threads/THREAD_ID
   Headers: Authorization: Bearer ADMIN_TOKEN
   ```

---

## Demo Users for Testing

Use these demo accounts to test different roles:

```javascript
// USER - Can post and comment
Email: user@essahub.com
Password: demo123
Role: USER

// ADMIN - Full access
Email: admin@essahub.com
Password: demo123
Role: ADMIN

// PROVIDER - Read only
Email: provider@essahub.com
Password: demo123
Role: PROVIDER

// COACH - Read only
Email: coach@essahub.com
Password: demo123
Role: COACH
```

---

## Common Error Responses

### 401 Unauthorized (No Token)
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 401 Unauthorized (Invalid Token)
```json
{
  "success": false,
  "message": "Invalid token"
}
```

### 403 Forbidden (Wrong Role)
```json
{
  "success": false,
  "message": "Only Users and Admins can post threads and comments. Providers and Coaches have read-only access."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Thread not found"
}
```

### 400 Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "content",
      "message": "Reply content is required"
    }
  ]
}
```

---

## Postman Collection Setup

### Environment Variables
Create a Postman environment with:
```
baseUrl = http://localhost:3000
userToken = (set after login)
adminToken = (set after admin login)
providerToken = (set after provider login)
```

### Pre-request Script for Token
```javascript
// Automatically set token from login response
pm.environment.set("userToken", pm.response.json().data.token);
```

---

## Testing Checklist

- [ ] Login with all 4 roles (USER, ADMIN, PROVIDER, COACH)
- [ ] View threads without authentication
- [ ] View threads with authentication
- [ ] Filter threads by category
- [ ] Search threads
- [ ] Create thread as USER ✅
- [ ] Create thread as ADMIN ✅
- [ ] Try to create thread as PROVIDER ❌ (should fail)
- [ ] Try to create thread as COACH ❌ (should fail)
- [ ] Post comment as USER ✅
- [ ] Try to post comment as PROVIDER ❌ (should fail)
- [ ] Update own thread
- [ ] Try to update someone else's thread ❌ (should fail)
- [ ] Delete own thread
- [ ] Pin thread as ADMIN ✅
- [ ] Lock thread as ADMIN ✅
- [ ] Try to comment on locked thread ❌ (should fail)

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Thread views increment automatically when viewing thread details
- Pinned threads appear at the top of the list
- Locked threads prevent new replies
- Only thread authors and admins can update/delete threads
- Pagination defaults to 8000 items per page
