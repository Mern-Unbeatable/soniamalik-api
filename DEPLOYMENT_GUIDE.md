# Deployment Guide

## Environment Configuration

### Production Setup

Update your `.env` file with production values:

```env
# Server
PORT=3000
NODE_ENV=production
BACKEND_URL=https://soniamalikbackend.mtscorporate.com

# Database
DATABASE_URL="postgres://postgres:vRymFiHE6oz1fNdWTtFdKE29bvRwj8YhfFjAhr5aJxL3vBunFNOVjMlNvTrLYHGc@147.93.107.217:5545/postgres"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=https://soniamalik14.mtscorporate.com

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_PASS="bivf agof aaqs aczd"
EMAIL_USER="hahm56825@gmail.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
```

### Development Setup

For local development:

```env
# Server
PORT=3000
NODE_ENV=development
BACKEND_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Image Upload Configuration

The system now stores **full image URLs** including the backend domain:

### Production:
- Uploaded images: `https://soniamalikbackend.mtscorporate.com/uploads/services/filename.jpg`
- Frontend can directly access images using the full URL

### Development:
- Uploaded images: `http://localhost:3000/uploads/services/filename.jpg`
- Works seamlessly on localhost

## Deployment Steps

### 1. Update Environment Variables
```bash
# Set your production backend URL
BACKEND_URL=https://soniamalikbackend.mtscorporate.com

# Set your frontend URL for CORS
CORS_ORIGIN=https://soniamalik14.mtscorporate.com

# Change to production mode
NODE_ENV=production
```

### 2. Ensure Uploads Directory Exists
```bash
mkdir -p uploads/services
chmod 755 uploads
chmod 755 uploads/services
```

### 3. Install Dependencies
```bash
npm install --production
```

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Run Database Migrations
```bash
npx prisma migrate deploy
```

### 6. Start Server
```bash
npm start
```

Or with PM2:
```bash
pm2 start src/server.js --name soniamalik-backend
pm2 save
pm2 startup
```

## Static File Serving

The backend serves uploaded files from the `/uploads` directory:

```javascript
app.use('/uploads', express.static('uploads'));
```

This allows images to be accessed at:
- `https://soniamalikbackend.mtscorporate.com/uploads/services/filename.jpg`

## CORS Configuration

The server is configured to accept requests from the frontend domain specified in `CORS_ORIGIN`.

For production:
- Frontend: `https://soniamalik14.mtscorporate.com`
- Backend: `https://soniamalikbackend.mtscorporate.com`

## Nginx Configuration (if applicable)

If using Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name soniamalikbackend.mtscorporate.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Important for file uploads
        client_max_body_size 10M;
    }

    location /uploads {
        alias /path/to/your/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## Troubleshooting

### Images Not Loading
1. **Check BACKEND_URL**: Make sure it matches your actual backend domain
2. **Check uploads directory permissions**: `chmod 755 uploads/services`
3. **Check static file serving**: Ensure `app.use('/uploads', express.static('uploads'))` is in server.js
4. **Check CORS**: Frontend domain must be in `CORS_ORIGIN`

### CORS Errors
1. Update `CORS_ORIGIN` in `.env` to match your frontend domain
2. Restart the server after changing `.env`

### File Upload Fails
1. Check file size (max 5MB)
2. Check file type (only jpeg, jpg, png, gif, webp allowed)
3. Check uploads directory exists and is writable
4. Check Nginx/Apache client_max_body_size if using reverse proxy

## Security Recommendations

1. **Change JWT_SECRET**: Use a strong random secret in production
2. **Use HTTPS**: Always use HTTPS in production
3. **Limit file uploads**: Current limit is 5MB, adjust if needed
4. **Sanitize filenames**: Already implemented with unique timestamps
5. **Validate file types**: Already implemented for images only

## Monitoring

Check logs for errors:
```bash
# If using PM2
pm2 logs soniamalik-backend

# If running directly
tail -f logs/error.log
```

## Backup

Regular backups of:
1. **Database**: PostgreSQL database
2. **Uploads folder**: All uploaded images
3. **Environment variables**: `.env` file (store securely)
