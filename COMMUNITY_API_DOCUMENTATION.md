# Community API Documentation

## Overview

The Community section consists of 3 categories where users can create posts, like posts, and add comments/replies:

1. **STORIES** - Share experiences and stories
2. **QUESTIONS** - Ask questions and get advice
3. **SUPPORT** - Request help (substitute players, referees, player cover, volunteers, etc.)

## Authentication

- **Public endpoints**: Anyone can view posts, comments, and likes
- **Private endpoints**: Require authentication with Bearer token
- Only authenticated users can create posts, like, and comment

## Base URL

```
https://soniamalikbackend.mtscorporate.com/api/community
```

---

## Posts Endpoints

### 1. Create a Post

**POST** `/api/community/posts`

**Authentication**: Required

**Request Body (STORIES/QUESTIONS)**:

```json
{
  "title": "How to balance strength training with competitive netball?",
  "description": "I'm starting to play more on asphalt courts and my current trainers are wearing down fast. Any recommendations for durable soles?",
  "category": "STORIES",
  "sport": "Football",
  "tags": ["New To Sport", "Injury"]
}
```

**Request Body (SUPPORT)**:

```json
{
  "title": "Need substitute player for this weekend",
  "description": "Looking for a substitute player for our football match this Saturday",
  "category": "SUPPORT",
  "sport": "Football",
  "location": "Central Park Stadium",
  "date": "03/30/26",
  "time": "14:30",
  "helpType": "Sub"
}
```

**Fields**:

- `title` (required): String - Post title
- `description` (required): String - Post content
- `category` (required): String - Must be one of: `STORIES`, `QUESTIONS`, `SUPPORT`
- `sport` (optional): String - Sport name (Football, Netball, Padel, Squash, Cricket, Multi-Sport, Not sport-specific)
- `tags` (optional): Array of Strings - Conversation tags (e.g., "New To Sport", "Returning to sport", "Nerves & confidence", "Injury", "Hormonal health", "Kit & gear", "General")
- `location` (required for SUPPORT): String - Location where help is needed
- `date` (required for SUPPORT): String - Date in mm/yy/dd format
- `time` (required for SUPPORT): String - Time in HH:MM format
- `helpType` (required for SUPPORT): String - Type of help needed (Sub, Referee, Player Cover, Volunteer, Other)

**Response**:

```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": "uuid",
    "title": "...",
    "description": "...",
    "category": "STORIES",
    "sport": "Football",
    "tags": ["New To Sport", "Injury"],
    "location": null,
    "date": null,
    "time": null,
    "helpType": null,
    "likesCount": 0,
    "commentsCount": 0,
    "author": {
      "id": "uuid",
      "name": "John Doe",
      "avatar": "https://...",
      "displayName": "John D.",
      "role": "USER"
    },
    "createdAt": "2026-03-26T11:35:43.000Z",
    "updatedAt": "2026-03-26T11:35:43.000Z"
  }
}
```

---

### 2. Get All Posts

**GET** `/api/community/posts`

**Authentication**: Not required

**Query Parameters**:

- `category` (optional): String - Filter by category (STORIES, QUESTIONS, SUPPORT)
- `sport` (optional): String - Filter by sport
- `tags` (optional): String or Array - Filter by tags
- `search` (optional): String - Search in title and description
- `page` (optional): Number - Page number (default: 1)
- `limit` (optional): Number - Items per page (default: 10)

**Example**:

```
GET /api/community/posts?category=STORIES&sport=Football&page=1&limit=10
```

**Response**:

```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": {
    "posts": [
      {
        "id": "uuid",
        "title": "...",
        "description": "...",
        "category": "STORIES",
        "sport": "Football",
        "tags": ["New To Sport"],
        "likesCount": 4,
        "commentsCount": 2,
        "author": { ... },
        "createdAt": "2026-03-26T11:35:43.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### 3. Get a Single Post

**GET** `/api/community/posts/:id`

**Authentication**: Optional (to check if user liked the post)

**Response**:

```json
{
  "success": true,
  "message": "Post retrieved successfully",
  "data": {
    "id": "uuid",
    "title": "...",
    "description": "...",
    "category": "DISCUSSION",
    "sport": "Football",
    "tags": ["New To Sport"],
    "likesCount": 4,
    "commentsCount": 2,
    "isLikedByUser": true,
    "author": { ... },
    "likes": [
      {
        "userId": "uuid",
        "user": {
          "id": "uuid",
          "name": "Jane Doe",
          "avatar": "https://..."
        }
      }
    ],
    "comments": [
      {
        "id": "uuid",
        "content": "Great question!",
        "author": { ... },
        "createdAt": "2026-03-26T11:40:00.000Z",
        "replies": [
          {
            "id": "uuid",
            "content": "I agree!",
            "author": { ... },
            "createdAt": "2026-03-26T11:45:00.000Z"
          }
        ]
      }
    ],
    "createdAt": "2026-03-26T11:35:43.000Z"
  }
}
```

---

### 4. Update a Post

**PUT** `/api/community/posts/:id`

**Authentication**: Required (Author only)

**Request Body**:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "sport": "Netball",
  "tags": ["Injury", "Kit & gear"]
}
```

**Response**: Same as Create Post

---

### 5. Delete a Post

**DELETE** `/api/community/posts/:id`

**Authentication**: Required (Author or Admin)

**Response**:

```json
{
  "success": true,
  "message": "Post deleted successfully",
  "data": null
}
```

---

### 6. Get User's Posts

**GET** `/api/community/users/:userId/posts`

**Authentication**: Not required

**Query Parameters**:

- `page` (optional): Number - Page number (default: 1)
- `limit` (optional): Number - Items per page (default: 10)

**Response**: Same as Get All Posts

---

### 7. Get My Posts Activity

**GET** `/api/community/my-posts/activity`

**Authentication**: Required

**Description**: Get activity (likes and comments from other users) on the current user's posts. This endpoint helps users see who has interacted with their posts.

**Query Parameters**:

- `page` (optional): Number - Page number (default: 1)
- `limit` (optional): Number - Items per page (default: 10)

**Response**:

```json
{
  "success": true,
  "message": "Post activity retrieved successfully",
  "data": {
    "posts": [
      {
        "id": "uuid",
        "title": "...",
        "description": "...",
        "category": "STORIES",
        "sport": "Football",
        "tags": ["New To Sport"],
        "likesCount": 4,
        "commentsCount": 2,
        "hasNewActivity": true,
        "activityCount": 6,
        "author": {
          "id": "uuid",
          "name": "John Doe",
          "avatar": "https://...",
          "displayName": "John D."
        },
        "likes": [
          {
            "id": "uuid",
            "userId": "uuid",
            "user": {
              "id": "uuid",
              "name": "Jane Doe",
              "avatar": "https://...",
              "displayName": "Jane D."
            },
            "createdAt": "2026-03-26T12:00:00.000Z"
          }
        ],
        "comments": [
          {
            "id": "uuid",
            "content": "Great post!",
            "author": {
              "id": "uuid",
              "name": "Alice Smith",
              "avatar": "https://...",
              "displayName": "Alice S."
            },
            "createdAt": "2026-03-26T11:55:00.000Z"
          }
        ],
        "createdAt": "2026-03-26T11:35:43.000Z",
        "updatedAt": "2026-03-26T12:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

**Notes**:

- Shows last 5 likes and last 5 comments on each post
- Comments by the post owner are excluded
- Posts are ordered by most recent activity (updatedAt)
- `hasNewActivity`: Boolean indicating if the post has likes or comments from others
- `activityCount`: Total number of likes + comments on the post

---

## Likes Endpoints

### 8. Toggle Like on a Post

**POST** `/api/community/posts/:id/like`

**Authentication**: Required

**Request Body**: None

**Response**:

```json
{
  "success": true,
  "message": "Post liked" // or "Post unliked",
  "data": {
    "liked": true // or false
  }
}
```

---

### 9. Get Post Likes

**GET** `/api/community/posts/:id/likes`

**Authentication**: Not required

**Response**:

```json
{
  "success": true,
  "message": "Post likes retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "user": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatar": "https://...",
        "displayName": "Jane D."
      },
      "createdAt": "2026-03-26T11:40:00.000Z"
    }
  ]
}
```

---

## Comments Endpoints

### 10. Create a Comment

**POST** `/api/community/posts/:id/comments`

**Authentication**: Required

**Request Body**:

```json
{
  "content": "This is a comment",
  "parentId": null
}
```

**Fields**:

- `content` (required): String - Comment text
- `parentId` (optional): String - Parent comment ID (for replies)

**Response**:

```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "id": "uuid",
    "content": "This is a comment",
    "postId": "uuid",
    "parentId": null,
    "author": {
      "id": "uuid",
      "name": "John Doe",
      "avatar": "https://...",
      "displayName": "John D.",
      "role": "USER"
    },
    "createdAt": "2026-03-26T11:40:00.000Z",
    "updatedAt": "2026-03-26T11:40:00.000Z"
  }
}
```

---

### 11. Get Post Comments

**GET** `/api/community/posts/:id/comments`

**Authentication**: Not required

**Response**:

```json
{
  "success": true,
  "message": "Comments retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "content": "This is a comment",
      "author": { ... },
      "createdAt": "2026-03-26T11:40:00.000Z",
      "replies": [
        {
          "id": "uuid",
          "content": "This is a reply",
          "author": { ... },
          "createdAt": "2026-03-26T11:45:00.000Z"
        }
      ]
    }
  ]
}
```

---

### 12. Update a Comment

**PUT** `/api/community/comments/:id`

**Authentication**: Required (Author only)

**Request Body**:

```json
{
  "content": "Updated comment text"
}
```

**Response**: Same as Create Comment

---

### 13. Delete a Comment

**DELETE** `/api/community/comments/:id`

**Authentication**: Required (Author or Admin)

**Response**:

```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": null
}
```

---

## Usage Examples

### Creating a Stories Post

```bash
curl -X POST https://soniamalikbackend.mtscorporate.com/api/community/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How to balance strength training with competitive netball?",
    "description": "Any recommendations for durable soles?",
    "category": "STORIES",
    "sport": "Football",
    "tags": ["New To Sport", "Injury"]
  }'
```

### Creating a Support Post

```bash
curl -X POST https://soniamalikbackend.mtscorporate.com/api/community/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Need substitute player for this weekend",
    "description": "Looking for a substitute player for our football match this Saturday",
    "category": "SUPPORT",
    "sport": "Football",
    "location": "Central Park Stadium",
    "date": "03/30/26",
    "time": "14:30",
    "helpType": "Sub"
  }'
```

### Getting Activity on My Posts

```bash
curl -X GET "https://soniamalikbackend.mtscorporate.com/api/community/my-posts/activity?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Liking a Post

```bash
curl -X POST https://soniamalikbackend.mtscorporate.com/api/community/posts/{postId}/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Adding a Comment

```bash
curl -X POST https://soniamalikbackend.mtscorporate.com/api/community/posts/{postId}/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great question! I recommend..."
  }'
```

### Replying to a Comment

```bash
curl -X POST https://soniamalikbackend.mtscorporate.com/api/community/posts/{postId}/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "I agree with this!",
    "parentId": "{commentId}"
  }'
```

---

## Database Schema

### CommunityPost Model

```
- id: UUID (Primary Key)
- title: String
- description: Text
- category: Enum (STORIES, QUESTIONS, SUPPORT)
- location: String (optional, required for SUPPORT)
- date: String (optional, required for SUPPORT)
- time: String (optional, required for SUPPORT)
- helpType: String (optional, required for SUPPORT)
- sport: String (optional)
- tags: Array of Strings
- authorId: UUID (Foreign Key to User)
- likesCount: Integer (default: 0)
- commentsCount: Integer (default: 0)
- createdAt: DateTime
- updatedAt: DateTime
```

### PostLike Model

```
- id: UUID (Primary Key)
- postId: UUID (Foreign Key to CommunityPost)
- userId: UUID (Foreign Key to User)
- createdAt: DateTime
- Unique constraint: (postId, userId)
```

### PostComment Model

```
- id: UUID (Primary Key)
- content: Text
- postId: UUID (Foreign Key to CommunityPost)
- authorId: UUID (Foreign Key to User)
- parentId: UUID (Foreign Key to PostComment, nullable)
- createdAt: DateTime
- updatedAt: DateTime
```

---

## Notes

1. **Categories**: There are 3 main categories:
   - `STORIES`: For sharing experiences and stories
   - `QUESTIONS`: For asking questions and seeking advice
   - `SUPPORT`: For requesting help (substitute players, referees, player cover, volunteers, etc.)

2. **Sports Tags**: Available sports include:
   - Football, Netball, Padel, Squash, Cricket, Multi-Sport, Not sport-specific

3. **Conversation Tags**: Available topics include:
   - New To Sport
   - Returning to sport
   - Nerves & confidence
   - Injury
   - Hormonal health
   - Kit & gear
   - General

4. **Permissions**:
   - Any authenticated user can create posts, like, and comment
   - Users can only edit/delete their own posts and comments
   - Admins can delete any post or comment

5. **SUPPORT Category**:
   - Required fields: location, date, time, helpType
   - Help types available: Sub, Referee, Player Cover, Volunteer, Other
   - Date format: mm/yy/dd (e.g., "03/30/26")
   - Time format: HH:MM (e.g., "14:30")

6. **Comments & Replies**:
   - Top-level comments have `parentId: null`
   - Replies have `parentId` set to the parent comment's ID
   - Nested structure is returned in the API response
