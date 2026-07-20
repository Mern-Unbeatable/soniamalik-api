# News API Documentation

## Overview
Complete News management system with Admin-only CRUD operations and public read access for all users (authenticated and anonymous).

## Base URL
```
Local: http://localhost:3000/api/news
Production: https://soniamalikbackend.mtscorporate.com/api/news
```

## Authentication
- **Public Routes**: Open to all users (authenticated and non-authenticated)
- **Admin Routes**: Require JWT authentication with ADMIN role
- **Authorization Header**: `Authorization: Bearer <JWT_TOKEN>`

## Data Model

### News Object
```json
{
  "id": "string (UUID)",
  "title": "string (required, max 255 chars)",
  "content": "string (required)",
  "excerpt": "string (optional, short summary)",
  "image": "string (URL, optional)",
  "status": "enum (DRAFT | PUBLISHED | ARCHIVED)",
  "authorId": "string (UUID)",
  "publishedAt": "datetime (ISO 8601, nullable)",
  "views": "integer (default: 0)",
  "createdAt": "datetime (ISO 8601)",
  "updatedAt": "datetime (ISO 8601)"
}
```

### News Status Enum
- `DRAFT` - Not visible to public, only admins can see
- `PUBLISHED` - Visible to all users
- `ARCHIVED` - Hidden from public list, only accessible via direct link

---

## API Endpoints

### 1. Get All News (Public)
Retrieve paginated list of published news articles with search and filtering.

**Endpoint**: `GET /api/news`

**Access**: Public (optionalAuth - works with or without authentication)

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number |
| limit | integer | No | 12 | Items per page |
| search | string | No | - | Search in title, content, excerpt |
| status | string | No | PUBLISHED | Status filter (Admin only can use) |

**Notes**:
- Non-admin users always see only PUBLISHED news
- Admin users can filter by status (DRAFT, PUBLISHED, ARCHIVED)
- Results ordered by publishedAt (newest first)

**Request Example**:
```bash
# Public access - no token needed
curl -X GET "http://localhost:3000/api/news?page=1&limit=10&search=football"

# Admin access - with token, can filter by status
curl -X GET "http://localhost:3000/api/news?status=DRAFT" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "News retrieved successfully",
  "data": [
    {
      "id": "uuid-1",
      "title": "Breaking: Football Championship Finals",
      "content": "Full article content here...",
      "excerpt": "Championship finals scheduled for next week",
      "image": "https://soniamalikbackend.mtscorporate.com/uploads/news/news1.jpg",
      "status": "PUBLISHED",
      "authorId": "admin-uuid",
      "publishedAt": "2024-02-17T10:00:00.000Z",
      "views": 1524,
      "createdAt": "2024-02-15T08:30:00.000Z",
      "updatedAt": "2024-02-17T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 48,
    "itemsPerPage": 10
  }
}
```

---

### 2. Get News by ID (Public)
Retrieve single news article by ID. Automatically tracks views.

**Endpoint**: `GET /api/news/:id`

**Access**: Public (optionalAuth)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | News article ID |

**Notes**:
- Automatically increments view count
- Non-published news only visible to admins
- Returns 403 if non-admin tries to access non-published news

**Request Example**:
```bash
curl -X GET "http://localhost:3000/api/news/uuid-1"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "News retrieved successfully",
  "data": {
    "id": "uuid-1",
    "title": "Breaking: Football Championship Finals",
    "content": "Complete article content with all details...",
    "excerpt": "Championship finals scheduled for next week",
    "image": "https://soniamalikbackend.mtscorporate.com/uploads/news/news1.jpg",
    "status": "PUBLISHED",
    "authorId": "admin-uuid",
    "publishedAt": "2024-02-17T10:00:00.000Z",
    "views": 1525,
    "createdAt": "2024-02-15T08:30:00.000Z",
    "updatedAt": "2024-02-17T10:00:00.000Z"
  }
}
```

**Error Response** (403 Forbidden):
```json
{
  "success": false,
  "message": "This news article is not available",
  "error": null
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "News not found",
  "error": null
}
```

---

### 3. Create News (Admin Only)
Create new news article with optional image upload.

**Endpoint**: `POST /api/news`

**Access**: Admin only (requires authentication)

**Content-Type**: `multipart/form-data` (when uploading image) OR `application/json`

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Article title (max 255 chars) |
| content | string | Yes | Full article content |
| excerpt | string | No | Short summary/preview text |
| image | file | No | Image file (jpeg/jpg/png/gif/webp, max 10MB) |
| status | string | No | DRAFT or PUBLISHED (default: DRAFT) |

**Notes**:
- If status is PUBLISHED, publishedAt is automatically set to current time
- Image uploads to `uploads/news/` directory
- Full image URL automatically generated

**Request Example (with image)**:
```bash
curl -X POST "http://localhost:3000/api/news" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -F "title=New Tournament Announcement" \
  -F "content=We are excited to announce the upcoming basketball tournament..." \
  -F "excerpt=Basketball tournament registration now open" \
  -F "image=@/path/to/image.jpg" \
  -F "status=PUBLISHED"
```

**Request Example (JSON, no image)**:
```bash
curl -X POST "http://localhost:3000/api/news" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Training Program",
    "content": "We are launching a new training program for beginners...",
    "excerpt": "Beginner training program starts next month",
    "status": "DRAFT"
  }'
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "News created successfully",
  "data": {
    "id": "uuid-2",
    "title": "New Tournament Announcement",
    "content": "We are excited to announce the upcoming basketball tournament...",
    "excerpt": "Basketball tournament registration now open",
    "image": "https://soniamalikbackend.mtscorporate.com/uploads/news/1708167412345-tournament.jpg",
    "status": "PUBLISHED",
    "authorId": "admin-uuid",
    "publishedAt": "2024-02-17T10:30:12.345Z",
    "views": 0,
    "createdAt": "2024-02-17T10:30:12.345Z",
    "updatedAt": "2024-02-17T10:30:12.345Z"
  }
}
```

**Error Response** (403 Forbidden):
```json
{
  "success": false,
  "message": "Access denied. Admin role required.",
  "error": null
}
```

---

### 4. Update News (Admin Only)
Update existing news article with optional image replacement.

**Endpoint**: `PUT /api/news/:id`

**Access**: Admin only (requires authentication)

**Content-Type**: `multipart/form-data` (when uploading image) OR `application/json`

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | News article ID |

**Request Body** (all fields optional):
| Field | Type | Description |
|-------|------|-------------|
| title | string | Updated title |
| content | string | Updated content |
| excerpt | string | Updated excerpt |
| image | file | New image file (replaces old one) |
| status | string | Updated status (DRAFT/PUBLISHED/ARCHIVED) |

**Notes**:
- Only provided fields are updated
- If status changes to PUBLISHED and publishedAt is null, it's set to current time
- Old image is not automatically deleted (manual cleanup may be needed)

**Request Example**:
```bash
curl -X PUT "http://localhost:3000/api/news/uuid-2" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -F "title=Updated Tournament Announcement" \
  -F "status=PUBLISHED"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "News updated successfully",
  "data": {
    "id": "uuid-2",
    "title": "Updated Tournament Announcement",
    "content": "We are excited to announce the upcoming basketball tournament...",
    "excerpt": "Basketball tournament registration now open",
    "image": "https://soniamalikbackend.mtscorporate.com/uploads/news/1708167412345-tournament.jpg",
    "status": "PUBLISHED",
    "authorId": "admin-uuid",
    "publishedAt": "2024-02-17T10:30:12.345Z",
    "views": 25,
    "createdAt": "2024-02-17T10:30:12.345Z",
    "updatedAt": "2024-02-17T11:45:30.123Z"
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "News not found",
  "error": null
}
```

---

### 5. Delete News (Admin Only)
Permanently delete news article.

**Endpoint**: `DELETE /api/news/:id`

**Access**: Admin only (requires authentication)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | News article ID |

**Notes**:
- Deletion is permanent and cannot be undone
- Image file is not automatically deleted from filesystem

**Request Example**:
```bash
curl -X DELETE "http://localhost:3000/api/news/uuid-2" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "News deleted successfully",
  "data": null
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "News not found",
  "error": null
}
```

---

### 6. Publish News (Admin Only)
Convenience endpoint to publish a draft news article.

**Endpoint**: `PATCH /api/news/:id/publish`

**Access**: Admin only (requires authentication)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | News article ID |

**Notes**:
- Sets status to PUBLISHED
- Sets publishedAt to current time
- Equivalent to: `PUT /api/news/:id` with `{ "status": "PUBLISHED" }`

**Request Example**:
```bash
curl -X PATCH "http://localhost:3000/api/news/uuid-3/publish" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "News published successfully",
  "data": {
    "id": "uuid-3",
    "title": "Training Program Details",
    "content": "Complete training program information...",
    "excerpt": "New training program for all skill levels",
    "image": null,
    "status": "PUBLISHED",
    "authorId": "admin-uuid",
    "publishedAt": "2024-02-17T12:00:00.000Z",
    "views": 0,
    "createdAt": "2024-02-16T09:00:00.000Z",
    "updatedAt": "2024-02-17T12:00:00.000Z"
  }
}
```

---

### 7. Unpublish News (Admin Only)
Convenience endpoint to unpublish/revert news article to draft.

**Endpoint**: `PATCH /api/news/:id/unpublish`

**Access**: Admin only (requires authentication)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | News article ID |

**Notes**:
- Sets status to DRAFT
- Sets publishedAt to null
- Article becomes invisible to public users
- Equivalent to: `PUT /api/news/:id` with `{ "status": "DRAFT", "publishedAt": null }`

**Request Example**:
```bash
curl -X PATCH "http://localhost:3000/api/news/uuid-3/unpublish" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "News unpublished successfully",
  "data": {
    "id": "uuid-3",
    "title": "Training Program Details",
    "content": "Complete training program information...",
    "excerpt": "New training program for all skill levels",
    "image": null,
    "status": "DRAFT",
    "authorId": "admin-uuid",
    "publishedAt": null,
    "views": 15,
    "createdAt": "2024-02-16T09:00:00.000Z",
    "updatedAt": "2024-02-17T12:30:00.000Z"
  }
}
```

---

## Testing Scenarios

### Scenario 1: Public User Access
**Goal**: Verify public users can view published news without authentication

```bash
# 1. View all published news (no token)
curl -X GET "http://localhost:3000/api/news"

# 2. Search for news
curl -X GET "http://localhost:3000/api/news?search=tournament"

# 3. View specific news article (increments view count)
curl -X GET "http://localhost:3000/api/news/uuid-1"

# Expected: All requests succeed, only PUBLISHED news visible
```

---

### Scenario 2: Admin Creates and Publishes News
**Goal**: Create draft news, then publish it

```bash
# 1. Login as admin
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminpassword"
  }'
# Save token from response

# 2. Create draft news
curl -X POST "http://localhost:3000/api/news" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Upcoming Basketball Event",
    "content": "Join us for an exciting basketball tournament next month...",
    "excerpt": "Basketball tournament in March",
    "status": "DRAFT"
  }'
# Save news ID from response

# 3. Verify draft not visible to public
curl -X GET "http://localhost:3000/api/news"
# News should NOT appear in list

# 4. Admin can view draft
curl -X GET "http://localhost:3000/api/news?status=DRAFT" \
  -H "Authorization: Bearer <TOKEN>"
# News SHOULD appear in list

# 5. Publish the news
curl -X PATCH "http://localhost:3000/api/news/<NEWS_ID>/publish" \
  -H "Authorization: Bearer <TOKEN>"

# 6. Verify news now visible to public
curl -X GET "http://localhost:3000/api/news"
# News SHOULD now appear in list
```

---

### Scenario 3: Admin Manages News with Image
**Goal**: Create news with image, update it, then delete

```bash
# 1. Create news with image
curl -X POST "http://localhost:3000/api/news" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "title=Summer Training Camp" \
  -F "content=Join our intensive summer training camp for all age groups..." \
  -F "excerpt=Summer camp registration open" \
  -F "image=@./summer-camp.jpg" \
  -F "status=PUBLISHED"
# Save news ID

# 2. Update news title and replace image
curl -X PUT "http://localhost:3000/api/news/<NEWS_ID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "title=Summer Training Camp - UPDATED" \
  -F "image=@./new-image.jpg"

# 3. View updated news
curl -X GET "http://localhost:3000/api/news/<NEWS_ID>"
# Verify title and image URL updated

# 4. Delete news
curl -X DELETE "http://localhost:3000/api/news/<NEWS_ID>" \
  -H "Authorization: Bearer <TOKEN>"

# 5. Verify deletion
curl -X GET "http://localhost:3000/api/news/<NEWS_ID>"
# Expected: 404 Not Found
```

---

### Scenario 4: Non-Admin User Restrictions
**Goal**: Verify non-admin users cannot perform CRUD operations

```bash
# 1. Login as regular user (USER role)
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "userpassword"
  }'
# Save token

# 2. Try to create news (should fail)
curl -X POST "http://localhost:3000/api/news" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My News",
    "content": "Content here"
  }'
# Expected: 403 Forbidden

# 3. Try to update news (should fail)
curl -X PUT "http://localhost:3000/api/news/<NEWS_ID>" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated"}'
# Expected: 403 Forbidden

# 4. Try to delete news (should fail)
curl -X DELETE "http://localhost:3000/api/news/<NEWS_ID>" \
  -H "Authorization: Bearer <USER_TOKEN>"
# Expected: 403 Forbidden

# 5. Can view published news (should succeed)
curl -X GET "http://localhost:3000/api/news" \
  -H "Authorization: Bearer <USER_TOKEN>"
# Expected: 200 OK with published news list
```

---

### Scenario 5: View Count Tracking
**Goal**: Verify view counter increments correctly

```bash
# 1. Create published news
curl -X POST "http://localhost:3000/api/news" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "View Counter Test",
    "content": "Testing view counting",
    "status": "PUBLISHED"
  }'
# Initial views should be 0

# 2. View news article 3 times
curl -X GET "http://localhost:3000/api/news/<NEWS_ID>"
curl -X GET "http://localhost:3000/api/news/<NEWS_ID>"
curl -X GET "http://localhost:3000/api/news/<NEWS_ID>"

# 3. Check view count
curl -X GET "http://localhost:3000/api/news/<NEWS_ID>"
# views field should be 4 (including this request)
```

---

## Common Error Responses

### Authentication Errors
```json
{
  "success": false,
  "message": "Authentication required",
  "error": null
}
```

### Authorization Errors
```json
{
  "success": false,
  "message": "Access denied. Admin role required.",
  "error": null
}
```

### Validation Errors
```json
{
  "success": false,
  "message": "Validation error: title is required",
  "error": null
}
```

### File Upload Errors
```json
{
  "success": false,
  "message": "Only image files (jpeg, jpg, png, gif, webp) are allowed",
  "error": null
}
```

```json
{
  "success": false,
  "message": "File size exceeds maximum limit of 10MB",
  "error": null
}
```

---

## Implementation Summary

### Files Created/Updated
1. **Controller**: `src/controllers/news.controller.js` - 7 controller functions
2. **Routes**: `src/routes/news.routes.js` - 7 endpoints with proper authentication
3. **Service**: `src/services/news.service.js` - Database operations (already existed)
4. **Schema**: `prisma/schema.prisma` - News model with author relation
5. **Migration**: `prisma/migrations/20260217101511_add_news_author_relation/migration.sql`

### Key Features
- ✅ Public read access for published news (authenticated and anonymous users)
- ✅ Admin-only CRUD operations
- ✅ Image upload with automatic URL generation
- ✅ News status workflow (DRAFT → PUBLISHED → ARCHIVED)
- ✅ Automatic view tracking
- ✅ Full-text search in title, content, excerpt
- ✅ Pagination support
- ✅ Author tracking via authorId relation
- ✅ Publish/unpublish convenience endpoints
- ✅ Role-based access control

### Database Schema
```prisma
model News {
  id          String     @id @default(uuid())
  title       String     @db.VarChar(255)
  content     String
  excerpt     String?
  image       String?
  status      NewsStatus @default(DRAFT)
  authorId    String
  author      User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  publishedAt DateTime?
  views       Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@map("news")
}

enum NewsStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

---

## Next Steps

### To Start Testing:
1. Restart the server to load new Prisma Client:
   ```bash
   npm run dev
   # or
   npm start
   ```

2. Verify routes are loaded:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. Test public access:
   ```bash
   curl http://localhost:3000/api/news
   ```

4. Test admin access (after logging in):
   ```bash
   curl -X POST http://localhost:3000/api/news \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test News","content":"Test content","status":"PUBLISHED"}'
   ```

### Frontend Integration
- Base URL: `https://soniamalikbackend.mtscorporate.com/api/news`
- Use `GET /api/news` for public news listing
- Use `GET /api/news/:id` for single news view
- Admin panel needs CRUD interface with image upload support
- Display `views` counter on news articles
- Show `publishedAt` date for published articles

---

**Documentation Generated**: February 17, 2026
**API Version**: 1.0.0
