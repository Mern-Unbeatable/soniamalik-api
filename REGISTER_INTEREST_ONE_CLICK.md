# ✅ Register Interest - ONE-CLICK Implementation

## 🎯 What You Requested

"When user clicks **Register Interest** button, automatically register their interest using their account information (no form needed). Event owner can see their fullName, email, phoneNumber."

## ✨ Implementation Complete!

### **How It Works Now:**

1. **User must be logged in** (authentication required)
2. **One click** - no form to fill
3. **Automatic** - system uses their account information:
   - ✅ Full Name (from user.name)
   - ✅ Email (from user.email)
   - ✅ Phone (from user.phone)
4. **Event owner sees** all this information in their dashboard

---

## 📡 API Endpoint

### Register Interest (One-Click)

**Endpoint:** `POST /api/events/:id/interest`

**Authentication:** **Required** (user must be logged in)

**Request Body:** **None** (empty)

**Example:**

```bash
curl -X POST https://soniamalikbackend.mtscorporate.com/api/events/YOUR_EVENT_ID/interest \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

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
    "phoneNumber": "+1234567890",
    "status": "interested",
    "registeredAt": "2026-04-13T12:00:00.000Z"
  }
}
```

---

## 💻 Frontend Example (React)

### Simple One-Click Button

```jsx
import axios from "axios";

const RegisterInterestButton = ({ eventId }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login to register your interest");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `https://soniamalikbackend.mtscorporate.com/api/events/${eventId}/interest`,
        {}, // Empty body - automatic!
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        alert("Interest registered! The organizer will contact you.");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to register interest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
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
  );
};
```

---

## 👀 Event Owner View

**Endpoint:** `GET /api/events/:id/interests`

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
      "phoneNumber": "+1234567890",
      "status": "interested",
      "registeredAt": "2026-04-13T12:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "name": "John Smith",
        "email": "john@example.com",
        "phone": "+1234567890"
      }
    }
  ]
}
```

**Event owner can see:**

- ✅ Full Name
- ✅ Email
- ✅ Phone Number
- ✅ Registration date

---

## 🔄 Comparison: Two Buttons

| Feature            | Book Your Place      | Register Interest        |
| ------------------ | -------------------- | ------------------------ |
| **Click Action**   | Opens form           | **Instant registration** |
| **User Input**     | Fill form manually   | **None - automatic**     |
| **Authentication** | Optional             | **Required**             |
| **Data Source**    | User types it        | **User's account**       |
| **Validation**     | Checks capacity/date | **No restrictions**      |

---

## ✅ Files Changed

1. ✅ **src/routes/event.routes.js** - Changed to `authenticate` middleware
2. ✅ **src/controllers/event.controller.js** - Auto-fetch user info
3. ✅ **src/services/event.service.js** - Query user from database
4. ✅ **TWO_BUTTON_GUIDE.md** - Updated documentation

---

## 🚀 Ready to Test!

### Test it now:

```bash
# 1. Login first
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "demo123"
}

# 2. Copy the token

# 3. Register Interest (no body needed!)
POST /api/events/YOUR_EVENT_ID/interest
Authorization: Bearer YOUR_TOKEN

# Done! ✅
```

---

## 🎉 Summary

✅ **No request body needed**  
✅ **Automatic user information**  
✅ **Event owner sees**: fullName, email, phoneNumber  
✅ **One-click simplicity**  
✅ **Authentication required**  
✅ **No database schema changes**

**Perfect for your use case!** 🎯
