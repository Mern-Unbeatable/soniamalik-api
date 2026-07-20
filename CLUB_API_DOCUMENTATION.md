# Club API Documentation

## Overview
Complete Club management system where COACH users can register and manage their club information. Admin can view all clubs while coaches can only view and manage their own club.

## Base URL
```
Local: http://localhost:3000/api/clubs
Production: https://soniamalikbackend.mtscorporate.com/api/clubs
```

## Authentication
- **Coach Routes**: Require JWT authentication with COACH role
- **Admin Routes**: Require JWT authentication with ADMIN role
- **Authorization Header**: `Authorization: Bearer <JWT_TOKEN>`

## Data Model

### Club Object
```json
{
  "id": "string (UUID)",
  "name": "string (required, club name)",
  "description": "string (required, club description)",
  "image": "string (URL, optional, club logo/image)",
  "ownerName": "string (required, owner/manager name)",
  "contactEmail": "string (required, contact email)",
  "contactPhone": "string (required, contact phone)",
  "fullAddress": "string (required, complete address)",
  "website": "string (optional, club website)",
  "groundName": "string (optional, ground/facility name)",
  "groundType": "string (optional, e.g., 'Provider/Service Club')",
  "activePlayers": "integer (default: 0)",
  "coachesCount": "integer (default: 0)",
  "teamsCount": "integer (default: 0)",
  "hostingSessions": "integer (default: 0)",
  "status": "enum (ACTIVE | INACTIVE | PENDING)",
  "coachId": "string (UUID, unique - one club per coach)",
  "coach": {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "createdAt": "datetime (ISO 8601)",
  "updatedAt": "datetime (ISO 8601)"
}
```

### Club Status Enum
- `ACTIVE` - Club is active and operational
- `INACTIVE` - Club is temporarily inactive
- `PENDING` - Club pending admin approval (future use)

---

## API Endpoints

### 1. Get My Club (Coach)
Retrieve the authenticated coach's own club.

**Endpoint**: `GET /api/clubs/my`

**Access**: Coach only (requires authentication)

**Notes**:
- Returns null if coach hasn't created a club yet
- One coach can only have one club

**Request Example**:
```bash
curl -X GET "http://localhost:3000/api/clubs/my" \
  -H "Authorization: Bearer <COACH_TOKEN>"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Club retrieved successfully",
  "data": {
    "id": "club-uuid-1",
    "name": "Ruga Sports Arena",
    "description": "Premier sports facility offering multiple courts and training programs",
    "image": "https://soniamalikbackend.mtscorporate.com/uploads/clubs/club-image.jpg",
    "ownerName": "Cayon Willis",
    "contactEmail": "royallux@company.com",
    "contactPhone": "+355 123 456 567",
    "fullAddress": "6391 Elgin St. Tampa, Pennsylvania 55755",
    "website": "https://rugasportsarena.com",
    "groundName": "Ruga Sports Arena",
    "groundType": "Provider/Service Club",
    "activePlayers": 90,
    "coachesCount": 3,
    "teamsCount": 15,
    "hostingSessions": 16,
    "status": "ACTIVE",
    "coachId": "coach-uuid",
    "coach": {
      "id": "coach-uuid",
      "name": "John Doe",
      "email": "coach@example.com",
      "phone": "+355 987 654 321"
    },
    "createdAt": "2024-02-15T08:30:00.000Z",
    "updatedAt": "2024-02-17T10:00:00.000Z"
  }
}
```

**Success Response - No Club** (200 OK):
```json
{
  "success": true,
  "message": "No club found for this coach",
  "data": null
}
```

---

### 2. Create Club (Coach)
Create a new club. Each coach can only create one club.

**Endpoint**: `POST /api/clubs`

**Access**: Coach only (requires authentication)

**Content-Type**: `multipart/form-data` (when uploading image) OR `application/json`

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Club name |
| description | string | Yes | Club description |
| ownerName | string | Yes | Owner/manager name |
| contactEmail | string | Yes | Contact email |
| contactPhone | string | Yes | Contact phone |
| fullAddress | string | Yes | Complete address |
| image | file | No | Club logo/image (jpeg/jpg/png/gif/webp, max 10MB) |
| website | string | No | Club website URL |
| groundName | string | No | Ground/facility name |
| groundType | string | No | Ground type (e.g., "Provider/Service Club") |
| activePlayers | integer | No | Number of active players (default: 0) |
| coachesCount | integer | No | Number of coaches (default: 0) |
| teamsCount | integer | No | Number of teams (default: 0) |
| hostingSessions | integer | No | Number of hosting sessions (default: 0) |
| status | string | No | ACTIVE, INACTIVE, or PENDING (default: ACTIVE) |

**Notes**:
- Coach automatically becomes the club owner (coachId)
- If coach already has a club, returns 400 error
- Image uploads to `uploads/clubs/` directory

**Request Example (with image)**:
```bash
curl -X POST "http://localhost:3000/api/clubs" \
  -H "Authorization: Bearer <COACH_TOKEN>" \
  -F "name=Elite Basketball Academy" \
  -F "description=Professional basketball training facility with state-of-the-art equipment" \
  -F "ownerName=John Smith" \
  -F "contactEmail=info@elitebasketball.com" \
  -F "contactPhone=+1 555 123 4567" \
  -F "fullAddress=123 Sports Avenue, Los Angeles, CA 90001" \
  -F "image=@/path/to/logo.jpg" \
  -F "website=https://elitebasketball.com" \
  -F "groundName=Elite Basketball Arena" \
  -F "groundType=Professional Training Facility" \
  -F "activePlayers=75" \
  -F "coachesCount=5" \
  -F "teamsCount=8" \
  -F "hostingSessions=12"
```

**Request Example (JSON, no image)**:
```bash
curl -X POST "http://localhost:3000/api/clubs" \
  -H "Authorization: Bearer <COACH_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elite Basketball Academy",
    "description": "Professional basketball training facility",
    "ownerName": "John Smith",
    "contactEmail": "info@elitebasketball.com",
    "contactPhone": "+1 555 123 4567",
    "fullAddress": "123 Sports Avenue, Los Angeles, CA 90001",
    "website": "https://elitebasketball.com",
    "activePlayers": 75,
    "coachesCount": 5
  }'
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Club created successfully",
  "data": {
    "id": "club-uuid-2",
    "name": "Elite Basketball Academy",
    "description": "Professional basketball training facility with state-of-the-art equipment",
    "image": "https://soniamalikbackend.mtscorporate.com/uploads/clubs/1708167890123-logo.jpg",
    "ownerName": "John Smith",
    "contactEmail": "info@elitebasketball.com",
    "contactPhone": "+1 555 123 4567",
    "fullAddress": "123 Sports Avenue, Los Angeles, CA 90001",
    "website": "https://elitebasketball.com",
    "groundName": "Elite Basketball Arena",
    "groundType": "Professional Training Facility",
    "activePlayers": 75,
    "coachesCount": 5,
    "teamsCount": 8,
    "hostingSessions": 12,
    "status": "ACTIVE",
    "coachId": "coach-uuid",
    "coach": {
      "id": "coach-uuid",
      "name": "John Doe",
      "email": "coach@example.com",
      "phone": "+1 555 987 6543"
    },
    "createdAt": "2024-02-17T11:00:00.000Z",
    "updatedAt": "2024-02-17T11:00:00.000Z"
  }
}
```

**Error Response - Already Has Club** (400 Bad Request):
```json
{
  "success": false,
  "message": "You already have a club registered. Please update your existing club instead.",
  "error": null
}
```

---

### 3. Update Club (Coach/Admin)
Update existing club information. Coach can only update their own club, Admin can update any club.

**Endpoint**: `PUT /api/clubs/:id`

**Access**: Coach (own club) or Admin (any club)

**Content-Type**: `multipart/form-data` (when uploading image) OR `application/json`

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Club ID |

**Request Body** (all fields optional):
| Field | Type | Description |
|-------|------|-------------|
| name | string | Updated club name |
| description | string | Updated description |
| image | file | New club image |
| ownerName | string | Updated owner name |
| contactEmail | string | Updated contact email |
| contactPhone | string | Updated contact phone |
| fullAddress | string | Updated address |
| website | string | Updated website |
| groundName | string | Updated ground name |
| groundType | string | Updated ground type |
| activePlayers | integer | Updated active players count |
| coachesCount | integer | Updated coaches count |
| teamsCount | integer | Updated teams count |
| hostingSessions | integer | Updated hosting sessions |
| status | string | Updated status |

**Request Example**:
```bash
curl -X PUT "http://localhost:3000/api/clubs/club-uuid-2" \
  -H "Authorization: Bearer <COACH_TOKEN>" \
  -F "activePlayers=80" \
  -F "hostingSessions=15" \
  -F "description=Updated description with new programs"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Club updated successfully",
  "data": {
    "id": "club-uuid-2",
    "name": "Elite Basketball Academy",
    "description": "Updated description with new programs",
    "activePlayers": 80,
    "hostingSessions": 15,
    ...
  }
}
```

**Error Response - Not Authorized** (403 Forbidden):
```json
{
  "success": false,
  "message": "Not authorized to update this club",
  "error": null
}
```

---

### 4. Update Club Statistics (Coach/Admin)
Convenience endpoint to update only club statistics.

**Endpoint**: `PATCH /api/clubs/:id/stats`

**Access**: Coach (own club) or Admin (any club)

**Content-Type**: `application/json`

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Club ID |

**Request Body** (all fields optional):
| Field | Type | Description |
|-------|------|-------------|
| activePlayers | integer | Number of active players |
| coachesCount | integer | Number of coaches |
| teamsCount | integer | Number of teams |
| hostingSessions | integer | Number of hosting sessions |

**Request Example**:
```bash
curl -X PATCH "http://localhost:3000/api/clubs/club-uuid-2/stats" \
  -H "Authorization: Bearer <COACH_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "activePlayers": 95,
    "coachesCount": 4,
    "teamsCount": 18,
    "hostingSessions": 20
  }'
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Club statistics updated successfully",
  "data": {
    "id": "club-uuid-2",
    "name": "Elite Basketball Academy",
    "activePlayers": 95,
    "coachesCount": 4,
    "teamsCount": 18,
    "hostingSessions": 20,
    ...
  }
}
```

---

### 5. Get All Clubs (Admin/Coach)
Retrieve paginated list of clubs with search and filtering.

**Endpoint**: `GET /api/clubs`

**Access**: Authenticated users (Coach or Admin)

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number |
| limit | integer | No | 12 | Items per page |
| status | string | No | - | Filter by status (ACTIVE/INACTIVE/PENDING) |
| search | string | No | - | Search in name, description, owner name, address |

**Notes**:
- **Admin**: Sees all clubs
- **Coach**: Only sees their own club
- Results ordered by createdAt (newest first)

**Request Example (Admin)**:
```bash
curl -X GET "http://localhost:3000/api/clubs?page=1&limit=10&status=ACTIVE" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Request Example (Coach)**:
```bash
curl -X GET "http://localhost:3000/api/clubs" \
  -H "Authorization: Bearer <COACH_TOKEN>"
# Returns only coach's own club
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Clubs retrieved successfully",
  "data": [
    {
      "id": "club-uuid-1",
      "name": "Ruga Sports Arena",
      "description": "Premier sports facility",
      "image": "https://soniamalikbackend.mtscorporate.com/uploads/clubs/club1.jpg",
      "ownerName": "Cayon Willis",
      "contactEmail": "royallux@company.com",
      "contactPhone": "+355 123 456 567",
      "fullAddress": "6391 Elgin St. Tampa, Pennsylvania 55755",
      "activePlayers": 90,
      "coachesCount": 3,
      "teamsCount": 15,
      "status": "ACTIVE",
      "coach": {
        "id": "coach-uuid-1",
        "name": "Coach Name",
        "email": "coach1@example.com",
        "phone": "+355 111 222 333"
      },
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

### 6. Get Club by ID (Admin/Coach)
Retrieve single club by ID.

**Endpoint**: `GET /api/clubs/:id`

**Access**: Authenticated users (Coach can only view own club, Admin can view any)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Club ID |

**Request Example**:
```bash
curl -X GET "http://localhost:3000/api/clubs/club-uuid-1" \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Club retrieved successfully",
  "data": {
    "id": "club-uuid-1",
    "name": "Ruga Sports Arena",
    "description": "Premier sports facility offering multiple courts and training programs",
    "image": "https://soniamalikbackend.mtscorporate.com/uploads/clubs/club-image.jpg",
    "ownerName": "Cayon Willis",
    "contactEmail": "royallux@company.com",
    "contactPhone": "+355 123 456 567",
    "fullAddress": "6391 Elgin St. Tampa, Pennsylvania 55755",
    "website": "https://rugasportsarena.com",
    "groundName": "Ruga Sports Arena",
    "groundType": "Provider/Service Club",
    "activePlayers": 90,
    "coachesCount": 3,
    "teamsCount": 15,
    "hostingSessions": 16,
    "status": "ACTIVE",
    "coachId": "coach-uuid",
    "coach": {
      "id": "coach-uuid",
      "name": "John Doe",
      "email": "coach@example.com",
      "phone": "+355 987 654 321"
    },
    "createdAt": "2024-02-15T08:30:00.000Z",
    "updatedAt": "2024-02-17T10:00:00.000Z"
  }
}
```

**Error Response - Not Authorized** (403 Forbidden):
```json
{
  "success": false,
  "message": "Not authorized to view this club",
  "error": null
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Club not found",
  "error": null
}
```

---

### 7. Delete Club (Admin Only)
Permanently delete club.

**Endpoint**: `DELETE /api/clubs/:id`

**Access**: Admin only

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Club ID |

**Notes**:
- Only admin can delete clubs
- Deletion is permanent and cannot be undone
- Club image is not automatically deleted from filesystem

**Request Example**:
```bash
curl -X DELETE "http://localhost:3000/api/clubs/club-uuid-2" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Club deleted successfully",
  "data": null
}
```

**Error Response - Not Admin** (403 Forbidden):
```json
{
  "success": false,
  "message": "Only administrators can delete clubs",
  "error": null
}
```

---

## Testing Scenarios

### Scenario 1: Coach Creates and Manages Club
**Goal**: Complete workflow from club creation to update

```bash
# 1. Login as coach
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach@example.com",
    "password": "coachpassword"
  }'
# Save token

# 2. Check if coach already has a club
curl -X GET "http://localhost:3000/api/clubs/my" \
  -H "Authorization: Bearer <COACH_TOKEN>"
# Expected: null if no club yet

# 3. Create new club with image
curl -X POST "http://localhost:3000/api/clubs" \
  -H "Authorization: Bearer <COACH_TOKEN>" \
  -F "name=My Sports Academy" \
  -F "description=Professional training facility" \
  -F "ownerName=John Smith" \
  -F "contactEmail=contact@mysportsacademy.com" \
  -F "contactPhone=+1 555 000 1111" \
  -F "fullAddress=456 Training Blvd, New York, NY 10001" \
  -F "image=@./club-logo.jpg" \
  -F "activePlayers=50" \
  -F "coachesCount=3"
# Save club ID

# 4. Verify club created
curl -X GET "http://localhost:3000/api/clubs/my" \
  -H "Authorization: Bearer <COACH_TOKEN>"
# Should return the created club

# 5. Update club statistics
curl -X PATCH "http://localhost:3000/api/clubs/<CLUB_ID>/stats" \
  -H "Authorization: Bearer <COACH_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "activePlayers": 65,
    "teamsCount": 7,
    "hostingSessions": 10
  }'

# 6. Try to create another club (should fail)
curl -X POST "http://localhost:3000/api/clubs" \
  -H "Authorization: Bearer <COACH_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Second Club",
    "description": "Another club",
    "ownerName": "John Smith",
    "contactEmail": "contact2@example.com",
    "contactPhone": "+1 555 000 2222",
    "fullAddress": "789 Street, City"
  }'
# Expected: 400 error - already has a club
```

---

### Scenario 2: Admin Views All Clubs
**Goal**: Admin can see all clubs from all coaches

```bash
# 1. Login as admin
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminpassword"
  }'
# Save token

# 2. View all clubs
curl -X GET "http://localhost:3000/api/clubs?page=1&limit=20" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
# Should return all clubs from all coaches

# 3. Search for clubs
curl -X GET "http://localhost:3000/api/clubs?search=Sports" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 4. Filter by status
curl -X GET "http://localhost:3000/api/clubs?status=ACTIVE" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 5. View specific club
curl -X GET "http://localhost:3000/api/clubs/<CLUB_ID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 6. Update any club
curl -X PUT "http://localhost:3000/api/clubs/<CLUB_ID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "INACTIVE"}'

# 7. Delete club
curl -X DELETE "http://localhost:3000/api/clubs/<CLUB_ID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### Scenario 3: Coach Access Control
**Goal**: Verify coach can only access their own club

```bash
# Setup: Have 2 coaches with 2 different clubs

# 1. Login as Coach 1
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "coach1@example.com", "password": "password"}'
# Save COACH1_TOKEN

# 2. Login as Coach 2
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "coach2@example.com", "password": "password"}'
# Save COACH2_TOKEN

# 3. Coach 1 views all clubs (should see only own club)
curl -X GET "http://localhost:3000/api/clubs" \
  -H "Authorization: Bearer <COACH1_TOKEN>"
# Should return only Coach 1's club

# 4. Coach 1 tries to view Coach 2's club (should fail)
curl -X GET "http://localhost:3000/api/clubs/<COACH2_CLUB_ID>" \
  -H "Authorization: Bearer <COACH1_TOKEN>"
# Expected: 403 Forbidden

# 5. Coach 1 tries to update Coach 2's club (should fail)
curl -X PUT "http://localhost:3000/api/clubs/<COACH2_CLUB_ID>" \
  -H "Authorization: Bearer <COACH1_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"activePlayers": 100}'
# Expected: 403 Forbidden

# 6. Coach 1 tries to delete Coach 2's club (should fail)
curl -X DELETE "http://localhost:3000/api/clubs/<COACH2_CLUB_ID>" \
  -H "Authorization: Bearer <COACH1_TOKEN>"
# Expected: 403 Forbidden (only admin can delete)
```

---

## Implementation Summary

### Files Created/Updated
1. **Schema**: `prisma/schema.prisma` - Enhanced Club model with new fields and coach relation
2. **Service**: `src/services/club.service.js` - 7 service functions with role-based access
3. **Controller**: `src/controllers/club.controller.js` - 7 controller functions
4. **Routes**: `src/routes/club.routes.js` - 7 endpoints with proper authentication
5. **Migration**: `prisma/migrations/20260217102000_update_club_model/migration.sql`

### Key Features
- ✅ One club per coach (unique coachId constraint)
- ✅ Coach can create, view, and update only their own club
- ✅ Admin can view, update, and delete all clubs
- ✅ Image upload with automatic URL generation
- ✅ Statistics tracking (active players, coaches, teams, sessions)
- ✅ Full-text search in name, description, owner name, address
- ✅ Pagination support
- ✅ Status management (ACTIVE/INACTIVE/PENDING)
- ✅ Foreign key relation: Club belongs to User (COACH)

### Database Schema
```prisma
model Club {
  id              String     @id @default(uuid())
  name            String
  description     String     @db.Text
  image           String?
  ownerName       String
  contactEmail    String
  contactPhone    String
  fullAddress     String     @db.Text
  website         String?
  groundName      String?
  groundType      String?
  activePlayers   Int        @default(0)
  coachesCount    Int        @default(0)
  teamsCount      Int        @default(0)
  hostingSessions Int        @default(0)
  status          ClubStatus @default(ACTIVE)
  coachId         String     @unique
  coach           User       @relation(fields: [coachId], references: [id], onDelete: Cascade)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@map("clubs")
}
```

---

## Access Control Matrix

| Endpoint | Coach | Admin | Notes |
|----------|-------|-------|-------|
| GET /clubs/my | ✅ Own | ❌ | Coach gets own club |
| POST /clubs | ✅ Create | ❌ | Coach creates one club |
| PUT /clubs/:id | ✅ Own | ✅ All | Coach updates own, Admin updates any |
| PATCH /clubs/:id/stats | ✅ Own | ✅ All | Update statistics |
| GET /clubs | ✅ Own | ✅ All | Coach sees own, Admin sees all |
| GET /clubs/:id | ✅ Own | ✅ All | Coach views own, Admin views any |
| DELETE /clubs/:id | ❌ | ✅ All | Admin only |

---

**Documentation Generated**: February 17, 2026
**API Version**: 1.0.0
