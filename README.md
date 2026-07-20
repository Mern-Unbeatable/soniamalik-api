# ESSAHUB Backend API

Backend API for ESSAHUB Ladies Club Platform built with Express.js, Prisma, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Generate Prisma Client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. (Optional) Seed database with demo data:
```bash
npm run prisma:seed
```

6. Start development server:
```bash
npm run dev
```

Server will run at `http://localhost:5000`

## 📂 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middlewares/     # Custom middlewares
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Helper functions
├── validators/      # Request validation
└── server.js        # Entry point

prisma/
├── schema.prisma    # Database schema
└── seed.js          # Database seeding
```

## 📋 Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:push` - Push schema to database
- `npm run prisma:seed` - Seed database with demo data

## 🔐 Authentication

The API uses JWT-based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## 📝 API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status

### Threads (Community)
- `GET /api/threads` - Get all threads
- `GET /api/threads/:id` - Get thread by ID
- `POST /api/threads` - Create thread
- `PUT /api/threads/:id` - Update thread
- `DELETE /api/threads/:id` - Delete thread

### Recruitment
- `GET /api/recruitments` - Get all recruitments
- `GET /api/recruitments/:id` - Get recruitment by ID
- `POST /api/recruitments` - Create recruitment
- `PUT /api/recruitments/:id` - Update recruitment
- `DELETE /api/recruitments/:id` - Delete recruitment

## 🛠️ Tech Stack

- **Express.js** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Request validation
- **multer** - File uploads
- **morgan** - HTTP logging

## 📄 License

ISC
