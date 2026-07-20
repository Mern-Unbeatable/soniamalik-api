# Homepage Management API Documentation

## Overview

Homepage Management API allows administrators to manage homepage sections and cards for the website. This includes Hero sections, Explore Essa Hub, Find Your Sport, Founder, Sport Provider, Service Provider, and Brand sections.

**Base URL**: `/api/homepage`

**Image Upload**: Images are uploaded to `https://soniamalik14.mtscorporate.com/uploads/homepage/`

---

## Section Types

The following section types are available:

- `HERO` - Hero/Banner section with main heading and image
- `EXPLORE_ESSA_HUB` - Explore Essa Hub section
- `FIND_YOUR_SPORT` - Find Your Sport section
- `FOUNDER` - Founder section with founder information
- `SPORT_PROVIDER` - Sport Provider section
- `SERVICE_PROVIDER` - Service Provider section
- `BRAND` - Brand section

---

## Page Types

**NEW FEATURE**: Sections can now be associated with specific pages. This allows you to create different Hero sections or other content for different pages:

- `LANDING` - Landing/Home page
- `ABOUT_US` - About Us page
- `COLLABORATE` - Collaborate page

**Important**: When creating a Hero section, specify the `page` field to indicate which page it belongs to. For example:

- Hero for Landing page: `{ "type": "HERO", "page": "LANDING", "title": "Welcome to Essa Hub" }`
- Hero for About Us: `{ "type": "HERO", "page": "ABOUT_US", "title": "About Our Mission" }`
- Hero for Collaborate: `{ "type": "HERO", "page": "COLLABORATE", "title": "Partner With Us" }`

If `page` is not specified, the section will be shown on all pages (legacy behavior).

---

## Public Endpoints

### 1. Get Complete Homepage Content

**Endpoint**: `GET /api/homepage/content`

**Description**: Retrieve all active homepage sections organized by type with their associated cards. Optionally filter by page to get content for a specific page.

**Authentication**: None (Public)

**Query Parameters**:

- `page` (optional): Filter sections by page type (LANDING, ABOUT_US, COLLABORATE)

**Example Requests**:

```http
GET /api/homepage/content
GET /api/homepage/content?page=LANDING
GET /api/homepage/content?page=ABOUT_US
GET /api/homepage/content?page=COLLABORATE
```

**Example Response**:

```json
{
  "success": true,
  "message": "Homepage content retrieved successfully",
  "data": {
    "homepage": {
      "hero": {
        "id": "cm5abc123",
        "type": "HERO",
        "title": "Welcome to Essa Hub",
        "subtitle": "Your sports community",
        "description": "Join thousands of athletes and sports enthusiasts",
        "image": "https://soniamalik14.mtscorporate.com/uploads/homepage/hero-1234.jpg",
        "order": 0,
        "isActive": true,
        "cards": []
      },
      "exploreEssaHub": {
        "id": "cm5abc124",
        "type": "EXPLORE_ESSA_HUB",
        "title": "Explore Essa Hub",
        "subtitle": "Discover amazing features",
        "description": null,
        "image": null,
        "order": 1,
        "isActive": true,
        "cards": [
          {
            "id": "cm5card001",
            "title": "Connect",
            "description": "Connect with athletes",
            "image": "https://soniamalik14.mtscorporate.com/uploads/homepage/card1.jpg",
            "order": 0
          }
        ]
      },
      "findYourSport": {
        "id": "cm5abc125",
        "type": "FIND_YOUR_SPORT",
        "title": "Find Your Sport",
        "cards": [
          {
            "id": "cm5card002",
            "title": "Football",
            "image": "https://soniamalik14.mtscorporate.com/uploads/homepage/football.jpg"
          }
        ]
      },
      "founder": null,
      "sportProvider": null,
      "serviceProvider": null,
      "brand": null
    }
  }
}
```

---

### 2. Get Active Sections

**Endpoint**: `GET /api/homepage/sections/active`

**Description**: Get all active sections with optional filters.

**Authentication**: None (Public)

**Query Parameters**:

- `type` (optional): Filter by section type (HERO, EXPLORE_ESSA_HUB, etc.)
- `page` (optional): Filter by page type (LANDING, ABOUT_US, COLLABORATE)

**Example Requests**:

```http
GET /api/homepage/sections/active
GET /api/homepage/sections/active?type=HERO
GET /api/homepage/sections/active?page=LANDING
GET /api/homepage/sections/active?type=HERO&page=ABOUT_US
```

**Example Request**:

```http
GET /api/homepage/sections/active?type=HERO
```

**Example Response**:

```json
{
  "success": true,
  "message": "Active sections retrieved successfully",
  "data": {
    "sections": [
      {
        "id": "cm5abc123",
        "type": "HERO",
        "title": "Welcome to Essa Hub",
        "subtitle": "Your sports community",
        "description": "Join thousands of athletes",
        "image": "https://soniamalik14.mtscorporate.com/uploads/homepage/hero.jpg",
        "order": 0,
        "isActive": true,
        "createdAt": "2026-03-26T10:00:00.000Z",
        "updatedAt": "2026-03-26T10:00:00.000Z",
        "cards": []
      }
    ]
  }
}
```

---

## Admin Endpoints - Sections

### 3. Create Section

**Endpoint**: `POST /api/homepage/sections`

**Description**: Create a new homepage section (Admin only).

**Authentication**: Required (ADMIN role)

**Request Body**:

```json
{
  "type": "HERO",
  "page": "LANDING",
  "title": "Welcome to Essa Hub",
  "subtitle": "Your sports community",
  "description": "Join thousands of athletes and sports enthusiasts in our vibrant community",
  "order": 0,
  "isActive": true
}
```

**With Image Upload** (multipart/form-data):

```
type: HERO
page: LANDING
title: Welcome to Essa Hub
subtitle: Your sports community
description: Join thousands of athletes
image: [file]
order: 0
isActive: true
```

**Validation Rules**:

- `type`: Required, must be one of the valid section types
- `page`: Optional, must be LANDING, ABOUT_US, or COLLABORATE (used to specify which page this section belongs to)
- `title`: Optional string
- `subtitle`: Optional string
- `description`: Optional string
- `image`: Optional file (uploaded via multipart/form-data)
- `order`: Optional integer (default: 0)
- `isActive`: Optional boolean (default: true)

**Example Success Response**:

```json
{
  "success": true,
  "message": "Section created successfully",
  "data": {
    "section": {
      "id": "cm5abc123",
      "type": "HERO",
      "page": "LANDING",
      "title": "Welcome to Essa Hub",
      "subtitle": "Your sports community",
      "description": "Join thousands of athletes and sports enthusiasts",
      "image": "https://soniamalik14.mtscorporate.com/uploads/homepage/1711456789-hero.jpg",
      "order": 0,
      "isActive": true,
      "createdAt": "2026-03-26T16:09:52.000Z",
      "updatedAt": "2026-03-26T16:09:52.000Z",
      "cards": []
    }
  }
}
```

---

### 4. Get All Sections (Admin)

**Endpoint**: `GET /api/homepage/sections`

**Description**: Get all sections with pagination and filters (Admin only).

**Authentication**: Required (ADMIN role)

**Query Parameters**:

- `type` (optional): Filter by section type
- `pageType` (optional): Filter by page (LANDING, ABOUT_US, COLLABORATE)
- `isActive` (optional): Filter by active status (true/false)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 100)

**Example Request**:

```http
GET /api/homepage/sections?type=HERO&pageType=LANDING&isActive=true&page=1&limit=10
Authorization: Bearer <admin_token>
```

**Example Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "cm5abc123",
      "type": "HERO",
      "title": "Welcome to Essa Hub",
      "cards": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 5. Get Section by ID

**Endpoint**: `GET /api/homepage/sections/:id`

**Description**: Get a specific section by ID with all its cards (Admin only).

**Authentication**: Required (ADMIN role)

**Example Request**:

```http
GET /api/homepage/sections/cm5abc123
Authorization: Bearer <admin_token>
```

---

### 6. Update Section

**Endpoint**: `PUT /api/homepage/sections/:id`

**Description**: Update a section (Admin only).

**Authentication**: Required (ADMIN role)

**Request Body** (all fields optional):

```json
{
  "title": "Updated Title",
  "subtitle": "Updated Subtitle",
  "description": "Updated description",
  "order": 1,
  "isActive": false
}
```

**With Image Upload** (multipart/form-data):

```
title: Updated Title
image: [new file]
isActive: true
```

**Example Success Response**:

```json
{
  "success": true,
  "message": "Section updated successfully",
  "data": {
    "section": {
      "id": "cm5abc123",
      "type": "HERO",
      "title": "Updated Title",
      "subtitle": "Updated Subtitle",
      "description": "Updated description",
      "image": "https://soniamalik14.mtscorporate.com/uploads/homepage/updated.jpg",
      "order": 1,
      "isActive": false,
      "updatedAt": "2026-03-26T16:15:00.000Z"
    }
  }
}
```

---

### 7. Delete Section

**Endpoint**: `DELETE /api/homepage/sections/:id`

**Description**: Delete a section and all its associated cards (Admin only).

**Authentication**: Required (ADMIN role)

**Example Request**:

```http
DELETE /api/homepage/sections/cm5abc123
Authorization: Bearer <admin_token>
```

**Example Response**:

```json
{
  "success": true,
  "message": "Section deleted successfully"
}
```

---

## Admin Endpoints - Cards

### 8. Create Card

**Endpoint**: `POST /api/homepage/cards`

**Description**: Create a new card (Admin only). Cards can be standalone or associated with a section.

**Authentication**: Required (ADMIN role)

**Request Body**:

```json
{
  "sectionId": "cm5abc123",
  "title": "Connect with Athletes",
  "subtitle": "Build your network",
  "description": "Connect with thousands of athletes in your area",
  "order": 0,
  "isActive": true
}
```

**With Image Upload** (multipart/form-data):

```
sectionId: cm5abc123
title: Football
image: [file]
order: 0
```

**Validation Rules**:

- `sectionId`: Optional string (if provided, section must exist)
- `title`: Required string
- `subtitle`: Optional string
- `description`: Optional string
- `image`: Optional file
- `order`: Optional integer (default: 0)
- `isActive`: Optional boolean (default: true)

**Example Success Response**:

```json
{
  "success": true,
  "message": "Card created successfully",
  "data": {
    "card": {
      "id": "cm5card001",
      "sectionId": "cm5abc123",
      "title": "Connect with Athletes",
      "subtitle": "Build your network",
      "description": "Connect with thousands of athletes",
      "image": "https://soniamalik14.mtscorporate.com/uploads/homepage/card-connect.jpg",
      "order": 0,
      "isActive": true,
      "createdAt": "2026-03-26T16:20:00.000Z",
      "updatedAt": "2026-03-26T16:20:00.000Z"
    }
  }
}
```

---

### 9. Get All Cards (Admin)

**Endpoint**: `GET /api/homepage/cards`

**Description**: Get all cards with filters (Admin only).

**Authentication**: Required (ADMIN role)

**Query Parameters**:

- `sectionId` (optional): Filter by section ID
- `isActive` (optional): Filter by active status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 100)

**Example Request**:

```http
GET /api/homepage/cards?sectionId=cm5abc123&isActive=true
Authorization: Bearer <admin_token>
```

---

### 10. Get Card by ID

**Endpoint**: `GET /api/homepage/cards/:id`

**Description**: Get a specific card by ID (Admin only).

**Authentication**: Required (ADMIN role)

---

### 11. Update Card

**Endpoint**: `PUT /api/homepage/cards/:id`

**Description**: Update a card (Admin only).

**Authentication**: Required (ADMIN role)

**Request Body** (all fields optional):

```json
{
  "title": "Updated Card Title",
  "description": "Updated description",
  "order": 2,
  "isActive": false
}
```

---

### 12. Delete Card

**Endpoint**: `DELETE /api/homepage/cards/:id`

**Description**: Delete a card (Admin only).

**Authentication**: Required (ADMIN role)

**Example Response**:

```json
{
  "success": true,
  "message": "Card deleted successfully"
}
```

---

## Usage Examples

### Creating Hero Sections for Different Pages

**Create Hero for Landing Page:**

```bash
curl -X POST https://soniamalik14.mtscorporate.com/api/homepage/sections \
  -H "Authorization: Bearer <admin_token>" \
  -F "type=HERO" \
  -F "page=LANDING" \
  -F "title=Welcome to Essa Hub" \
  -F "subtitle=Your Sports Community" \
  -F "description=Join thousands of athletes" \
  -F "image=@hero-landing.jpg" \
  -F "order=0"
```

**Create Hero for About Us Page:**

```bash
curl -X POST https://soniamalik14.mtscorporate.com/api/homepage/sections \
  -H "Authorization: Bearer <admin_token>" \
  -F "type=HERO" \
  -F "page=ABOUT_US" \
  -F "title=About Our Mission" \
  -F "subtitle=Building Communities Through Sports" \
  -F "description=Learn about our journey" \
  -F "image=@hero-about.jpg" \
  -F "order=0"
```

**Create Hero for Collaborate Page:**

```bash
curl -X POST https://soniamalik14.mtscorporate.com/api/homepage/sections \
  -H "Authorization: Bearer <admin_token>" \
  -F "type=HERO" \
  -F "page=COLLABORATE" \
  -F "title=Partner With Us" \
  -F "subtitle=Let's Work Together" \
  -F "description=Join our network of partners" \
  -F "image=@hero-collaborate.jpg" \
  -F "order=0"
```

### Creating Sections with Cards

**Create Find Your Sport Section with Cards:**

```bash
# First create the section
curl -X POST https://soniamalik14.mtscorporate.com/api/homepage/sections \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "FIND_YOUR_SPORT",
    "title": "Find Your Sport",
    "subtitle": "Explore different sports",
    "order": 2
  }'

# Then create cards for it
curl -X POST https://soniamalik14.mtscorporate.com/api/homepage/cards \
  -H "Authorization: Bearer <admin_token>" \
  -F "sectionId=<section_id_from_above>" \
  -F "title=Football" \
  -F "image=@football.jpg" \
  -F "order=0"
```

---

## Database Schema

### HomeSection Model

```prisma
model HomeSection {
  id          String      @id @default(uuid())
  type        SectionType
  page        PageType?
  title       String?
  subtitle    String?
  description String?     @db.Text
  image       String?
  order       Int         @default(0)
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  cards       Card[]
}

enum SectionType {
  HERO
  EXPLORE_ESSA_HUB
  FIND_YOUR_SPORT
  FOUNDER
  SPORT_PROVIDER
  SERVICE_PROVIDER
  BRAND
}

enum PageType {
  LANDING
  ABOUT_US
  COLLABORATE
}
```

### Card Model

```prisma
model Card {
  id          String       @id @default(uuid())
  sectionId   String?
  section     HomeSection? @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  title       String
  subtitle    String?
  description String?      @db.Text
  image       String?
  order       Int          @default(0)
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

---

## Error Responses

**401 Unauthorized**:

```json
{
  "success": false,
  "message": "No token provided"
}
```

**403 Forbidden**:

```json
{
  "success": false,
  "message": "Access denied. Required role: ADMIN"
}
```

**404 Not Found**:

```json
{
  "success": false,
  "message": "Section not found"
}
```

**400 Bad Request**:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "type",
      "message": "Section type is required"
    }
  ]
}
```

---

## Notes

- All admin endpoints require authentication and ADMIN role
- Images are uploaded via multipart/form-data with field name "image"
- Sections and cards can be ordered using the `order` field
- Inactive sections/cards are hidden from public endpoints
- Deleting a section will cascade delete all its cards
- Cards can exist independently without being linked to a section
- **Page-Specific Content**: Use the `page` field to create different Hero sections for different pages (LANDING, ABOUT_US, COLLABORATE)
  - Example: Create 3 different HERO sections, each with a different `page` value
  - When fetching content, use `?page=LANDING` to get only Landing page content
  - If `page` is not specified, all sections (regardless of page) are returned
- For multiple Hero sections, assign each one to a specific page to avoid conflicts
