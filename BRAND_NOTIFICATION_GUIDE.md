# Brand Notification (Notify Me) Feature

## Overview

When users click **"Notify Me"** button in the Marketplace, their information is automatically captured and admin can view it in the Brand section of the admin panel.

**Admin can see:**

- ✅ Username
- ✅ Phone Number
- ✅ Sport
- ✅ Postcode

---

## 🎯 How It Works

1. **User clicks "Notify Me"** in Marketplace
2. **System automatically** captures user's information from their account:
   - Username (from user.name)
   - Phone Number (from user.phone)
   - Sport interests (from user.sportsInterests)
   - Postcode (from user.postcode)
3. **Admin views** all notifications in Brand section

---

## ⚙️ Technical Implementation

**Reuses existing table:** `event_registrations`

- No new table created
- Uses `status = "brand_notification"` to differentiate from event registrations
- `eventId` is set to `null` for brand notifications

**Schema Change Applied:**

```prisma
// Made eventId optional to support brand notifications
eventId  String?  // Previously: String (required)
event    Event?   // Previously: Event (required)
```

**Migration:** `20260414143000_make_eventid_optional_for_brand_notifications`

---

## 📡 API Endpoints

### 1. Notify Me (User Action) - ONE-CLICK

**Endpoint:** `POST /api/brands/notify`

**Authentication:** Required (user must be logged in)

**Request Body:** **None required** - completely automatic!

**Example Request:**

```bash
curl -X POST https://soniamalikbackend.mtscorporate.com/api/brands/notify \
  -H "Authorization: Bearer USER_TOKEN"
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Thank you! We'll notify you when new brands become available in the marketplace.",
  "data": {
    "id": "uuid",
    "userName": "Jane Doe",
    "phoneNumber": "+1234567890",
    "sport": "Football",
    "postcode": "SW1A 1AA",
    "email": "jane@example.com",
    "createdAt": "2026-04-14T10:00:00.000Z"
  }
}
```

**Error Response (Duplicate):**

```json
{
  "success": false,
  "message": "You have already registered for brand notifications"
}
```

---

### 2. Get Brand Notifications (Admin Only)

**Endpoint:** `GET /api/brands/notifications`

**Authentication:** Required (Admin only)

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `brandName` - Filter by brand name
- `sport` - Filter by sport interest

**Example Request:**

```bash
curl -X GET "https://soniamalikbackend.mtscorporate.com/api/brands/notifications?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Brand notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "uuid-1",
        "userName": "Guy Hawkins",
        "phoneNumber": "(505) 555-0125",
        "sport": "Tennis",
        "postcode": "SW1A 1AA",
        "brandName": "Nike",
        "email": "guy@example.com",
        "createdAt": "2026-04-14T10:00:00.000Z",
        "user": {
          "id": "user-uuid",
          "name": "Guy Hawkins",
          "email": "guy@example.com",
          "phone": "(505) 555-0125",
          "postcode": "SW1A 1AA",
          "sportsInterests": ["Tennis", "Football"],
          "avatar": "avatar.jpg"
        }
      },
      {
        "id": "uuid-2",
        "userName": "Leslie Alexander",
        "phoneNumber": "(704) 555-0127",
        "sport": "Football",
        "postcode": "EC1A 1BB",
        "brandName": "Adidas",
        "email": "leslie@example.com",
        "createdAt": "2026-04-14T09:30:00.000Z",
        "user": {
          "id": "user-uuid-2",
          "name": "Leslie Alexander",
          "email": "leslie@example.com",
          "phone": "(704) 555-0127",
          "postcode": "EC1A 1BB",
          "sportsInterests": ["Football"],
          "avatar": null
        }
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

**Filter Examples:**

```bash
# Filter by brand name
GET /api/brands/notifications?brandName=Nike

# Filter by sport
GET /api/brands/notifications?sport=Football

# Combined filters with pagination
GET /api/brands/notifications?brandName=Nike&sport=Tennis&page=1&limit=10
```

---

## 💻 Frontend Implementation

### Example 1: React - Notify Me Button (One-Click)

```jsx
import React, { useState } from "react";
import axios from "axios";

const NotifyMeButton = () => {
  const [loading, setLoading] = useState(false);
  const [notified, setNotified] = useState(false);

  const handleNotifyClick = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login to get notified");
      // Redirect to login
      window.location.href = "/login";
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "https://soniamalikbackend.mtscorporate.com/api/brands/notify",
        {}, // Empty body - automatic!
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        setNotified(true);
        alert("Thank you! We'll notify you when new brands become available.");
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to register notification";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleNotifyClick}
      disabled={loading || notified}
      style={{
        backgroundColor: notified ? "#6B7280" : "#2563EB",
        color: "white",
        padding: "10px 20px",
        borderRadius: "8px",
        border: "none",
        cursor: notified ? "default" : "pointer",
        fontSize: "14px",
        fontWeight: "600",
      }}
    >
      {loading ? "⏳ Processing..." : notified ? "✓ Notified" : "🔔 Notify Me"}
    </button>
  );
};

export default NotifyMeButton;
```

**Usage:**

```jsx
<NotifyMeButton />
```

---

### Example 2: React - Admin Brand Notifications Table

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const BrandNotificationsAdmin = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    brandName: "",
    sport: "",
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [filters]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(
        `https://soniamalikbackend.mtscorporate.com/api/brands/notifications?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brand-notifications-container">
      <h2>Brands - Notify Me Requests</h2>

      {/* Filters */}
      <div className="filters" style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Filter by brand name..."
          value={filters.brandName}
          onChange={(e) =>
            setFilters({ ...filters, brandName: e.target.value, page: 1 })
          }
          style={{ marginRight: "10px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Filter by sport..."
          value={filters.sport}
          onChange={(e) =>
            setFilters({ ...filters, sport: e.target.value, page: 1 })
          }
          style={{ padding: "8px" }}
        />
      </div>

      {/* Results Count */}
      <p>
        Showing {notifications.length} of {total} results
      </p>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                backgroundColor: "#f3f4f6",
                borderBottom: "2px solid #e5e7eb",
              }}
            >
              <th style={{ padding: "12px", textAlign: "left" }}>User Name</th>
              <th style={{ padding: "12px", textAlign: "left" }}>
                Phone number
              </th>
              <th style={{ padding: "12px", textAlign: "left" }}>Sport</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Postcode</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Brand</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification) => (
              <tr
                key={notification.id}
                style={{ borderBottom: "1px solid #e5e7eb" }}
              >
                <td style={{ padding: "12px" }}>{notification.userName}</td>
                <td style={{ padding: "12px" }}>{notification.phoneNumber}</td>
                <td style={{ padding: "12px" }}>{notification.sport}</td>
                <td style={{ padding: "12px" }}>{notification.postcode}</td>
                <td style={{ padding: "12px" }}>{notification.brandName}</td>
                <td style={{ padding: "12px" }}>
                  {new Date(notification.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="pagination" style={{ marginTop: "20px" }}>
        <button
          onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
          disabled={filters.page === 1}
          style={{ marginRight: "10px", padding: "8px 16px" }}
        >
          Previous
        </button>
        <span>
          Page {filters.page} of {Math.ceil(total / filters.limit)}
        </span>
        <button
          onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          disabled={filters.page >= Math.ceil(total / filters.limit)}
          style={{ marginLeft: "10px", padding: "8px 16px" }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BrandNotificationsAdmin;
```

---

### Example 3: Vanilla JavaScript (One-Click)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Notify Me - Brand</title>
    <style>
      .notify-btn {
        background-color: #2563eb;
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
      }
      .notify-btn:disabled {
        background-color: #6b7280;
        cursor: not-allowed;
      }
    </style>
  </head>
  <body>
    <button id="notifyBtn" class="notify-btn">🔔 Notify Me</button>

    <script>
      document
        .getElementById("notifyBtn")
        .addEventListener("click", async () => {
          const token = localStorage.getItem("token");

          if (!token) {
            alert("Please login to get notified");
            window.location.href = "/login";
            return;
          }

          const btn = document.getElementById("notifyBtn");
          btn.disabled = true;
          btn.textContent = "⏳ Processing...";

          try {
            const response = await fetch(
              "https://soniamalikbackend.mtscorporate.com/api/brands/notify",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}), // Empty body - automatic!
              },
            );

            const data = await response.json();

            if (data.success) {
              btn.textContent = "✓ Notified";
              btn.style.backgroundColor = "#10B981";
              alert(
                "Thank you! We'll notify you when new brands become available.",
              );
            } else {
              throw new Error(data.message);
            }
          } catch (error) {
            alert(error.message || "Failed to register notification");
            btn.disabled = false;
            btn.textContent = "🔔 Notify Me";
          }
        });
    </script>
  </body>
</html>
```

---

## 🗄️ Database Structure (No New Schema!)

**Reuses:** `event_registrations` table

| Field         | Value                                       |
| ------------- | ------------------------------------------- |
| eventId       | `null`                                      |
| userId        | User's ID                                   |
| fullName      | User's name (from user account)             |
| email         | User's email (from user account)            |
| phoneNumber   | User's phone (from user account)            |
| notes         | `"Marketplace brand notification request"`  |
| status        | `"brand_notification"` (special identifier) |
| paymentStatus | `"not_applicable"`                          |

**Additional data from User table:**

- postcode
- sportsInterests (array)
- avatar

---

## ✅ Testing

### Test User Flow:

```bash
# 1. Login as user
POST /api/auth/login
{
  "email": "user@essahub.com",
  "password": "demo123"
}

# 2. Click Notify Me (automatic - no body required!)
POST /api/brands/notify
Authorization: Bearer USER_TOKEN

# Response: "Thank you! We'll notify you when new brands become available in the marketplace"
```

### Test Admin Flow:

```bash
# 1. Login as admin
POST /api/auth/login
{
  "email": "admin@essahub.com",
  "password": "demo123"
}

# 2. View all notifications
GET /api/brands/notifications
Authorization: Bearer ADMIN_TOKEN

# Response: List with userName, phoneNumber, sport, postcode
```

---

## 🎨 Admin Panel Integration

The admin can see the data in a table matching your design:

| User Name        | Phone number   | Sport     | Postcode |
| ---------------- | -------------- | --------- | -------- |
| Guy Hawkins      | (505) 555-0125 | Tennis    | SW1A 1AA |
| Leslie Alexander | (704) 555-0127 | Football  | EC1A 1BB |
| Courtney Henry   | (828) 555-0129 | Badminton | M1 1AE   |
| Ralph Edwards    | (239) 555-0108 | Cricket   | B1 1AA   |

---

## 📊 Features

✅ **No New Schema** - Uses existing `event_registrations` table  
✅ **Automatic User Info** - Fetches from user's account  
✅ **Admin Filtering** - By brand name or sport  
✅ **Duplicate Prevention** - Can't notify twice for same brand  
✅ **Pagination Support** - Handle large datasets  
✅ **Authentication Required** - User must be logged in

---

## 🚀 Summary

**What's Available:**

1. ✅ User clicks "Notify Me" → Auto-captured
2. ✅ Admin sees: Username, Phone, Sport, Postcode
3. ✅ Filter by brand or sport
4. ✅ No database schema changes needed

**Ready to integrate!** 🎉
