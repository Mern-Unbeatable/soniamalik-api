# Enhanced Role-Based Registration Guide

## Overview

This guide documents the enhanced registration system with role-specific fields for Users, Sport Providers (Coaches), and Service Providers.

## Database Schema Changes

### New Fields Added to User Model

#### Common Fields (All Roles)

- `firstName` (String?) - User's first name
- `lastName` (String?) - User's last name
- `displayName` (String?) - Optional display name
- `postcode` (String?) - Postal code

#### Sport Provider (COACH) Specific Fields

- `organizationName` (String?) - Organization or coach name
- `sessionType` (String?) - Type of session (Women Only, Mixed, Men Only)
- `sportsOffered` (String[]) - Array of sports offered
- `aboutOrganization` (Text?) - Description about organization

#### Service Provider (PROVIDER) Specific Fields

- `organizationName` (String?) - Organization or practitioner name
- `serviceTypes` (String[]) - Array of service types (Physiotherapy, Nutrition, etc.)
- `aboutOrganization` (Text?) - Description about organization/services

#### Regular User (USER) Specific Fields

- `sportsInterests` (String[]) - Array of sports the user is interested in

## Migration

### Manual Migration File

Location: `prisma/migrations/20260325_add_role_specific_fields/migration.sql`

To apply the migration when database is available:

```bash
# Option 1: Using Prisma Migrate
npx prisma migrate dev --name add_role_specific_fields

# Option 2: Using DB Push (Production)
npx prisma db push

# Option 3: Manual SQL execution
# Run the SQL file directly in your PostgreSQL database
```

## API Endpoints

### POST /api/auth/register

#### Regular User Registration (Role: USER)

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Jane Doe",
  "role": "USER",
  "firstName": "Jane",
  "lastName": "Doe",
  "displayName": "JaneDoe",
  "phone": "+1234567890",
  "postcode": "SW1",
  "address": "123 Main St",
  "sportsInterests": ["Football", "Squash", "Rugby", "Netball"]
}
```

**Required Fields:**

- email ✓
- password ✓
- name ✓

**Optional Fields:**

- firstName, lastName, displayName
- phone, postcode, address
- sportsInterests (array)

---

#### Sport Provider Registration (Role: COACH)

```json
{
  "email": "coach@example.com",
  "password": "password123",
  "name": "Breaking Barriers FC",
  "role": "COACH",
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "postcode": "SW1",
  "organizationName": "Breaking Barriers FC",
  "sessionType": "Women Only",
  "sportsOffered": ["Football", "Training", "Workshop"],
  "aboutOrganization": "A short overview of what we offer and why our sessions are suitable for..."
}
```

**Required Fields:**

- email ✓
- password ✓
- name ✓
- organizationName ✓ (for COACH role)

**Optional Fields:**

- firstName, lastName
- phone, postcode
- sessionType (Women Only, Mixed, Men Only)
- sportsOffered (array)
- aboutOrganization

---

#### Service Provider Registration (Role: PROVIDER)

```json
{
  "email": "provider@example.com",
  "password": "password123",
  "name": "Wellness Center",
  "role": "PROVIDER",
  "firstName": "Sarah",
  "lastName": "Johnson",
  "phone": "+1234567890",
  "postcode": "SW1",
  "organizationName": "Galway Women FC",
  "serviceTypes": [
    "Physiotherapy",
    "Nutrition",
    "Personal Training",
    "Sports Massage"
  ],
  "aboutOrganization": "A short overview of services and why we support..."
}
```

**Required Fields:**

- email ✓
- password ✓
- name ✓
- organizationName ✓ (for PROVIDER role)

**Optional Fields:**

- firstName, lastName
- phone, postcode
- serviceTypes (array: Physiotherapy, Nutrition, Personal Training, Mental Health & Wellbeing, Coaching, Other)
- aboutOrganization

## Service Types Reference

### For Sport Providers (COACH)

**Session Types:**

- Women Only
- Mixed
- Men Only
- Other

**Sports Offered Examples:**

- Football
- Squash
- Rugby
- Netball
- Cricket
- Futsal
- Tennis
- Badminton
- Golf
- Running
- Other

### For Service Providers (PROVIDER)

**Service Types:**

- Physiotherapy
- Nutrition
- Personal Training
- Sports Massage
- Mental Health & Wellbeing
- Coaching
- Other

### For Regular Users (USER)

**Sports Interests:**

- Football
- Squash
- Rugby
- Netball
- Cricket
- Futsal
- Tennis
- Badminton
- Golf
- Running
- Other

## Response Format

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "firstName": "First",
      "lastName": "Last",
      "role": "USER",
      "status": "ACTIVE",
      "organizationName": null,
      "sessionType": null,
      "sportsOffered": [],
      "serviceTypes": [],
      "sportsInterests": ["Football", "Rugby"],
      "isEmailVerified": false,
      "createdAt": "2026-03-25T00:00:00.000Z"
    },
    "token": "jwt-token",
    "message": "Registration successful. Please check your email to verify your account."
  }
}
```

### Error Response (409 Conflict)

```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

## Validation Rules

### Email

- Must be a valid email format
- Automatically normalized

### Password

- Minimum 6 characters
- No maximum length (will be hashed)

### Role

- Must be one of: USER, COACH, PROVIDER, ADMIN
- Defaults to USER if not provided

### Arrays (sportsOffered, serviceTypes, sportsInterests)

- Must be valid JSON arrays
- Can be empty arrays
- Example: `["Football", "Rugby"]`

### Session Type (for COACH only)

- Must be one of: "Women Only", "Mixed", "Men Only", "Other"

## Testing

### Test Regular User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123",
    "name": "Test User",
    "role": "USER",
    "firstName": "Test",
    "lastName": "User",
    "sportsInterests": ["Football", "Rugby"]
  }'
```

### Test Sport Provider Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach@test.com",
    "password": "password123",
    "name": "Test Coach",
    "role": "COACH",
    "organizationName": "Test Sports Club",
    "sessionType": "Women Only",
    "sportsOffered": ["Football", "Training"]
  }'
```

### Test Service Provider Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "provider@test.com",
    "password": "password123",
    "name": "Test Provider",
    "role": "PROVIDER",
    "organizationName": "Test Wellness Center",
    "serviceTypes": ["Physiotherapy", "Nutrition"]
  }'
```

## Notes

1. **Backward Compatibility**: The system maintains backward compatibility. Old registration requests without the new fields will still work.

2. **Optional Fields**: All new fields are optional at the database level, but may be required by frontend based on the selected role.

3. **Email Verification**: Email verification is still required after registration. Users will receive a verification code via email.

4. **Role-Based Data**: Fields are stored based on role:
   - COACH: organizationName, sessionType, sportsOffered, aboutOrganization
   - PROVIDER: organizationName, serviceTypes, aboutOrganization
   - USER: displayName, sportsInterests

5. **Frontend Integration**: The frontend should show/hide fields based on the selected role dropdown.

## Files Modified

1. `prisma/schema.prisma` - Added new fields to User model
2. `src/services/auth.service.js` - Enhanced registerUser function
3. `src/routes/auth.routes.js` - Updated validation rules
4. `src/validators/auth.validator.js` - Created role-specific validators
5. `prisma/migrations/20260325_add_role_specific_fields/migration.sql` - Migration file

## Next Steps

1. Apply the database migration when database is available
2. Test registration for all three roles
3. Update frontend forms to match the new field requirements
4. Consider adding profile update endpoints for users to edit these fields later
