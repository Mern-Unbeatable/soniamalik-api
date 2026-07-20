# Email Verification & Forgot Password Implementation Guide

## Overview

This guide covers the email verification and forgot password functionality that has been implemented in the backend.

## Features Implemented

### 1. Email Verification (Registration)

- Users receive a 6-digit verification code upon registration
- Email must be verified before logging in
- Verification codes can be resent if needed

### 2. Forgot Password Flow

- Users request password reset via email
- Receive 5-digit OTP valid for 10 minutes
- Verify OTP before setting new password
- Receive confirmation email after successful reset

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Update Database Schema

```bash
npm run prisma:push
```

### 3. Configure Email Settings

Ensure your `.env` file has the following:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=hahm56825@gmail.com
EMAIL_PASS=your_app_password
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Important:** For Gmail, you need to:

- Use an App Password (not your regular Gmail password)
- Enable 2-factor authentication on your Gmail account
- Generate an App Password at: https://myaccount.google.com/apppasswords

### 4. Start Server

```bash
npm run dev
```

## API Endpoints

### Registration with Email Verification

**POST** `/api/auth/register`

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "USER"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "isEmailVerified": false
    },
    "token": "jwt_token_here",
    "message": "Registration successful. Please check your email to verify your account."
  }
}
```

### Verify Email

**POST** `/api/auth/verify-email`

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

### Resend Verification Email

**POST** `/api/auth/resend-verification`

```json
{
  "email": "user@example.com"
}
```

### Login (Requires Email Verification)

**POST** `/api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Note:** Will return error if email not verified

### Forgot Password (Request OTP)

**POST** `/api/auth/forgot-password`

```json
{
  "email": "user@example.com"
}
```

### Verify OTP

**POST** `/api/auth/verify-otp`

```json
{
  "email": "user@example.com",
  "otp": "1234"
}
```

### Reset Password

**POST** `/api/auth/reset-password`

```json
{
  "email": "user@example.com",
  "otp": "1234",
  "newPassword": "newpassword123"
}
```

## Email Templates

### 1. Verification Email

- Subject: "Verify Your Email - ESSAHUB"
- Contains 6-digit verification code
- Professional HTML template with ESSAHUB branding

### 2. Password Reset Email

- Subject: "Reset Your Password - ESSAHUB"
- Contains 5-digit OTP
- Valid for 10 minutes
- Professional HTML template

### 3. Password Reset Confirmation

- Subject: "Password Reset Successful - ESSAHUB"
- Sent after successful password reset
- Includes security recommendations

## Testing Flow

### Test Email Verification

1. Register a new user
2. Check email for 6-digit code
3. Call `/api/auth/verify-email` with email and code
4. Try to login (should succeed after verification)

### Test Forgot Password

1. Call `/api/auth/forgot-password` with email
2. Check email for 5-digit OTP
3. Call `/api/auth/verify-otp` with email and OTP
4. Call `/api/auth/reset-password` with email, OTP, and new password
5. Check email for confirmation
6. Login with new password

## Security Features

- **Email Verification Required:** Users cannot login without verifying email
- **OTP Expiry:** Password reset OTPs expire after 10 minutes
- **Secure Tokens:** Verification codes and OTPs are securely generated
- **Email Masking:** Forgot password doesn't reveal if email exists (security best practice)
- **Password Hashing:** All passwords are hashed using bcrypt

## Database Schema Changes

New fields added to User model:

```prisma
model User {
  // ... existing fields
  isEmailVerified       Boolean   @default(false)
  emailVerifyToken      String?
  resetPasswordToken    String?
  resetPasswordExpires  DateTime?
}
```

## Files Modified/Created

### Created:

- `src/services/email.service.js` - Email sending functionality
- `EMAIL_VERIFICATION_GUIDE.md` - This guide

### Modified:

- `src/services/auth.service.js` - Added 7 new functions
- `src/controllers/auth.controller.js` - Added 5 new controllers
- `src/routes/auth.routes.js` - Added 5 new routes
- `prisma/schema.prisma` - Added 4 new fields to User model
- `.env` - Added email configuration
- `package.json` - Added nodemailer dependency
- `src/config/index.js` - Added email config object

## Service Functions Added

1. `registerUser()` - Enhanced with email verification
2. `verifyEmail()` - Verify email with code
3. `resendVerificationEmail()` - Resend verification code
4. `loginUser()` - Enhanced to check email verification
5. `forgotPassword()` - Send password reset OTP
6. `verifyOTP()` - Verify password reset OTP
7. `resetPassword()` - Reset password with OTP

## Troubleshooting

### Email Not Sending

- Check Gmail App Password is correct
- Ensure 2FA is enabled on Gmail account
- Check EMAIL_SECURE is set to false for port 587
- Check firewall/antivirus isn't blocking port 587

### OTP Expired

- OTPs are valid for 10 minutes only
- Request a new OTP via `/api/auth/forgot-password`

### Verification Code Invalid

- Ensure code is exactly 6 digits for email verification
- Ensure OTP is exactly 5 digits for password reset
- Codes are case-sensitive

### Cannot Login After Registration

- Verify email first using the code sent
- Check email spam folder if verification email not received
- Use `/api/auth/resend-verification` if needed

## Next Steps

1. Update database schema: `npm run prisma:push`
2. Test registration flow
3. Test forgot password flow
4. Configure production email service (SendGrid, AWS SES, etc.)
5. Add rate limiting for email endpoints
6. Add email templates customization in frontend

## Production Recommendations

- Use a dedicated email service (SendGrid, AWS SES, Mailgun)
- Add rate limiting to prevent email spam
- Implement CAPTCHA for email endpoints
- Set up email monitoring and delivery tracking
- Use environment-specific email templates
- Add email retry mechanism
- Log email failures for debugging
