# Two-Button Event System Guide

## Overview

Your event system now supports **TWO separate buttons** with different purposes:

1. **"Book Your Place"** - Full registration/booking for confirmed participation
2. **"Register Interest"** - Lightweight expression of interest (no commitment)

Both use the same database table (`event_registrations`) but are differentiated by the `status` field.

---

## 🎯 Feature Comparison

| Feature            | Book Your Place                     | Register Interest                |
| ------------------ | ----------------------------------- | -------------------------------- |
| **Purpose**        | Confirmed booking                   | Just interested                  |
| **Commitment**     | Full participation                  | No commitment                    |
| **Authentication** | Optional                            | **Required (must be logged in)** |
| **User Input**     | Fill form (name, email, phone)      | **One-click (automatic)**        |
| **Status**         | `pending`, `confirmed`, `cancelled` | `interested`                     |
| **Capacity Check** | Yes (blocked if full)               | No (always allowed)              |
| **Date Check**     | Yes (blocked if ended)              | No (allowed anytime)             |
| **Payment Status** | `pending`, `paid`, `failed`         | `not_applicable`                 |
| **API Endpoint**   | `POST /api/events/:id/register`     | `POST /api/events/:id/interest`  |
| **View Endpoint**  | `GET /api/events/:id/registrations` | `GET /api/events/:id/interests`  |

---

## 📡 API Documentation

### 1. Book Your Place (Full Registration)

**Endpoint:** `POST /api/events/:id/register`

**Authentication:** Optional (works for both authenticated and anonymous users)

**Request Body:**

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phoneNumber": "+1234567890",
  "notes": "Looking forward to participating"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Successfully registered for event",
  "data": {
    "id": "uuid",
    "eventId": "event-uuid",
    "userId": "user-uuid or null",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phoneNumber": "+1234567890",
    "notes": "Looking forward to participating",
    "status": "pending",
    "paymentStatus": "pending",
    "registeredAt": "2026-04-13T12:00:00.000Z"
  }
}
```

**Validation:**

- ✅ Event must not have ended
- ✅ Event must have available capacity
- ✅ Event must not be BANNED or CANCELLED
- ✅ User cannot register twice

---

### 2. Register Interest (One-Click - Automatic)

**Endpoint:** `POST /api/events/:id/interest`

**Authentication:** **Required** (user must be logged in)

**Request Body:** **None required** - automatically uses authenticated user's information

**Example Request:**

```bash
curl -X POST https://soniamalikbackend.mtscorporate.com/api/events/YOUR_EVENT_ID/interest \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Interest registered successfully. The event organizer will contact you.",
  "data": {
    "id": "uuid",
    "eventId": "event-uuid",
    "userId": "user-uuid",
    "fullName": "John Smith",
    "email": "john@example.com",
    "phoneNumber": "+9876543210",
    "notes": "Automatic interest registration",
    "status": "interested",
    "paymentStatus": "not_applicable",
    "registeredAt": "2026-04-13T12:00:00.000Z",
    "user": {
      "id": "user-uuid",
      "name": "John Smith",
      "email": "john@example.com",
      "avatar": "avatar.jpg",
      "phone": "+9876543210"
    }
  }
}
```

**How It Works:**

1. User must be **logged in** (authentication required)
2. **No form needed** - button click automatically registers interest
3. System automatically fetches user's:
   - ✅ Full name from account
   - ✅ Email from account
   - ✅ Phone number from account
4. Event owner sees all this information

**Validation:**

- ✅ User must be authenticated (logged in)
- ✅ User cannot register interest twice
- ❌ No event end date check (can express interest anytime)
- ❌ No capacity check (always allowed)
- ❌ No event status check (works even if banned/cancelled)

**Error Response (Not Authenticated):**

```json
{
  "success": false,
  "message": "Authentication required"
}
```

**Error Response (Duplicate):**

```json
{
  "success": false,
  "message": "You have already registered interest for this event"
}
```

"data": {
"id": "uuid",
"eventId": "event-uuid",
"userId": "user-uuid or null",
"fullName": "John Smith",
"email": "john@example.com",
"phoneNumber": "+9876543210",
"notes": "Interested in learning more about this event",
"status": "interested",
"paymentStatus": "not_applicable",
"registeredAt": "2026-04-13T12:00:00.000Z"
}
}

````

**Validation:**

- ✅ User cannot register interest twice (same email)
- ❌ No event end date check (can express interest anytime)
- ❌ No capacity check (always allowed)
- ❌ No event status check (works even if banned/cancelled)

**Error Response (Duplicate):**

```json
{
  "success": false,
  "message": "You have already registered interest for this event"
}
````

---

### 3. View Bookings (Event Owner)

**Endpoint:** `GET /api/events/:id/registrations`

**Authentication:** Required (must be event owner or admin)

**Returns:** Only actual bookings (excludes interest registrations)

**Response:**

```json
{
  "success": true,
  "message": "Event registrations retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "phoneNumber": "+1234567890",
      "status": "confirmed",
      "paymentStatus": "paid",
      "notes": "Looking forward to participating",
      "registeredAt": "2026-04-13T12:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "avatar": "avatar.jpg"
      }
    }
  ]
}
```

---

### 4. View Interest Registrations (Event Owner)

**Endpoint:** `GET /api/events/:id/interests`

**Authentication:** Required (must be event owner or admin)

**Returns:** Only interest expressions (excludes actual bookings)

**Response:**

```json
{
  "success": true,
  "message": "Event interests retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "fullName": "John Smith",
      "email": "john@example.com",
      "phoneNumber": "+9876543210",
      "status": "interested",
      "paymentStatus": "not_applicable",
      "notes": "Interested in learning more",
      "registeredAt": "2026-04-13T13:00:00.000Z",
      "user": null
    }
  ]
}
```

---

## 💻 Frontend Implementation

### Example: React Component with Both Buttons

```jsx
import React, { useState } from "react";
import axios from "axios";

const EventActions = ({ eventId }) => {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Booking Form Data
  const [bookingData, setBookingData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    notes: "",
  });

  // Handle Full Booking
  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `https://soniamalikbackend.mtscorporate.com/api/events/${eventId}/register`,
        bookingData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token")
              ? `Bearer ${localStorage.getItem("token")}`
              : undefined,
          },
        },
      );

      if (response.data.success) {
        alert("Booking confirmed! You will receive confirmation details soon.");
        setShowBookingForm(false);
        setBookingData({ fullName: "", email: "", phoneNumber: "", notes: "" });
      }
    } catch (error) {
      const message = error.response?.data?.message || "Booking failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Interest Registration (ONE-CLICK - No Form!)
  const handleInterestClick = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login to register your interest");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `https://soniamalikbackend.mtscorporate.com/api/events/${eventId}/interest`,
        {}, // Empty body - automatic registration
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        alert("Interest registered! The event organizer will contact you.");
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to register interest";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-actions">
      {/* Two Buttons Side by Side */}
      {!showBookingForm && (
        <div className="button-group">
          <button
            onClick={() => setShowBookingForm(true)}
            className="btn-book-place"
            style={{
              backgroundColor: "#2563EB",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            📅 Book Your Place
          </button>

          {/* ONE-CLICK Interest Button - No Form! */}
          <button
            onClick={handleInterestClick}
            disabled={loading}
            className="btn-register-interest"
            style={{
              backgroundColor: "#10B981",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "⏳ Registering..." : "✉️ Register Interest"}
          </button>
        </div>
      )}

      {/* Booking Form */}
      {showBookingForm && (
        <div className="booking-form">
          <h3>Book Your Place</h3>
          <form onSubmit={handleBooking}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={bookingData.fullName}
                onChange={(e) =>
                  setBookingData({ ...bookingData, fullName: e.target.value })
                }
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={bookingData.email}
                onChange={(e) =>
                  setBookingData({ ...bookingData, email: e.target.value })
                }
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={bookingData.phoneNumber}
                onChange={(e) =>
                  setBookingData({
                    ...bookingData,
                    phoneNumber: e.target.value,
                  })
                }
                required
                placeholder="+1234567890"
              />
            </div>

            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                value={bookingData.notes}
                onChange={(e) =>
                  setBookingData({ ...bookingData, notes: e.target.value })
                }
                placeholder="Any special requirements..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Processing..." : "Confirm Booking"}
              </button>
              <button type="button" onClick={() => setShowBookingForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EventActions;
```

---

### Example: Event Owner Dashboard - View Both Lists

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const EventManagement = ({ eventId }) => {
  const [activeTab, setActiveTab] = useState("bookings"); // 'bookings' or 'interests'
  const [bookings, setBookings] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [eventId, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (activeTab === "bookings") {
        const response = await axios.get(
          `https://soniamalikbackend.mtscorporate.com/api/events/${eventId}/registrations`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setBookings(response.data.data);
      } else {
        const response = await axios.get(
          `https://soniamalikbackend.mtscorporate.com/api/events/${eventId}/interests`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setInterests(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-management">
      <h2>Event Management</h2>

      {/* Tab Buttons */}
      <div className="tabs">
        <button
          onClick={() => setActiveTab("bookings")}
          className={activeTab === "bookings" ? "active" : ""}
        >
          📅 Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab("interests")}
          className={activeTab === "interests" ? "active" : ""}
        >
          ✉️ Interests ({interests.length})
        </button>
      </div>

      {/* Bookings List */}
      {activeTab === "bookings" && (
        <div className="bookings-list">
          <h3>Confirmed Bookings</h3>
          {loading ? (
            <p>Loading...</p>
          ) : bookings.length === 0 ? (
            <p>No bookings yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Booked At</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.fullName}</td>
                    <td>{booking.email}</td>
                    <td>{booking.phoneNumber}</td>
                    <td>
                      <span className={`badge status-${booking.status}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge payment-${booking.paymentStatus}`}
                      >
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td>
                      {new Date(booking.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Interests List */}
      {activeTab === "interests" && (
        <div className="interests-list">
          <h3>Interest Registrations</h3>
          {loading ? (
            <p>Loading...</p>
          ) : interests.length === 0 ? (
            <p>No interest registrations yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Message</th>
                  <th>Registered At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interests.map((interest) => (
                  <tr key={interest.id}>
                    <td>{interest.fullName}</td>
                    <td>{interest.email}</td>
                    <td>{interest.phoneNumber}</td>
                    <td>{interest.notes || "-"}</td>
                    <td>
                      {new Date(interest.registeredAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          (window.location.href = `mailto:${interest.email}`)
                        }
                      >
                        Send Email
                      </button>
                      <button
                        onClick={() =>
                          (window.location.href = `tel:${interest.phoneNumber}`)
                        }
                      >
                        Call
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default EventManagement;
```

---

## 🎨 UI/UX Design Guidelines

### Button Design (Following Your Image)

```css
/* Book Your Place Button - Blue */
.btn-book-place {
  background-color: #2563eb; /* Blue */
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-book-place:hover {
  background-color: #1d4ed8;
}

/* Register Interest Button - Green */
.btn-register-interest {
  background-color: #10b981; /* Green */
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-register-interest:hover {
  background-color: #059669;
}

/* Button Group - Side by Side */
.button-group {
  display: flex;
  gap: 12px;
  margin: 20px 0;
}
```

---

## 📊 Database Structure

Both buttons use the **same table** (`event_registrations`):

| Field            | Book Your Place                           | Register Interest |
| ---------------- | ----------------------------------------- | ----------------- |
| status           | `pending`, `confirmed`, `cancelled`       | `interested`      |
| paymentStatus    | `pending`, `paid`, `failed`               | `not_applicable`  |
| notes            | User's notes                              | User's message    |
| All other fields | Same (fullName, email, phoneNumber, etc.) |

---

## ✅ Testing Guide

### Test Booking Flow:

```bash
# 1. Book Your Place
curl -X POST https://soniamalikbackend.mtscorporate.com/api/events/YOUR_EVENT_ID/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phoneNumber": "+1234567890",
    "notes": "Excited to participate"
  }'

# 2. View Bookings (as event owner)
curl -X GET https://soniamalikbackend.mtscorporate.com/api/events/YOUR_EVENT_ID/registrations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Interest Flow:

```bash
# 1. Register Interest (ONE-CLICK - No Body Required!)
curl -X POST https://soniamalikbackend.mtscorporate.com/api/events/YOUR_EVENT_ID/interest \
  -H "Authorization: Bearer YOUR_TOKEN"

# Note: No request body needed!
# System automatically uses logged-in user's name, email, and phone from their account

# 2. View Interests (as event owner)
curl -X GET https://soniamalikbackend.mtscorporate.com/api/events/YOUR_EVENT_ID/interests \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚀 Key Benefits

✅ **No Schema Changes** - Uses existing database structure  
✅ **Clear Separation** - Two distinct endpoints and views  
✅ **One-Click Interest** - No form needed, automatic user info  
✅ **Flexible** - Interest registration works even for full/ended events  
✅ **Owner Control** - Event owners see both lists separately  
✅ **User Friendly** - Clear distinction between booking and interest  
✅ **Must Login** - Interest requires authentication (uses account info)

---

## 📝 Summary

**What Changed:**

- ✅ New endpoint: `POST /api/events/:id/interest` (requires authentication)
- ✅ New endpoint: `GET /api/events/:id/interests`
- ✅ Updated: `GET /api/events/:id/registrations` now excludes interests
- ✅ Status differentiation: `interested` vs `pending/confirmed/cancelled`
- ✅ **One-Click Interest**: No form needed - automatically uses user's account info
- ✅ **Authentication Required**: User must be logged in to register interest

**How It Works:**

1. **Book Your Place**: User fills form → Manual entry of name, email, phone
2. **Register Interest**: User clicks button → **Automatic** registration using their account info

**No Database Changes Needed** - Everything uses the existing `event_registrations` table!

**Event Owner Can See**: Full name, email, phone number from user's account

**Ready to Use** - Copy the frontend components and start testing! 🎉
