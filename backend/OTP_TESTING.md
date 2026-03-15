# OTP Authentication Testing Guide

## Issue Fixed

The OTP verification was failing because the mobile app was calling the wrong endpoint:
- **Wrong**: `authClient.emailOtp.verifyEmail()` - requires user to exist first
- **Correct**: `authClient.signIn.emailOtp()` - creates user if they don't exist (when `disableSignUp: false`)

## Testing the OTP Flow

### 1. Send OTP

```bash
curl -X POST "$BACKEND_URL/api/auth/email-otp/send-verification-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"sign-in"}'
```

Response:
```json
{"success":true}
```

### 2. Get OTP from Development Endpoint (easier)

The backend now includes a development-only endpoint to get the OTP:

```bash
curl "$BACKEND_URL/api/dev/otp/test@example.com"
```

Response:
```json
{
  "data": {
    "email": "test@example.com",
    "otp": "123456",
    "identifier": "sign-in-otp-test@example.com",
    "attempts": 0,
    "expiresAt": "2026-02-17T09:00:00.000Z",
    "isExpired": false,
    "createdAt": "2026-02-17T08:50:00.000Z"
  }
}
```

### 2b. Get OTP from Database (alternative)

```bash
cd backend
sqlite3 prisma/dev.db "SELECT value FROM verification WHERE identifier='sign-in-otp-test@example.com' ORDER BY createdAt DESC LIMIT 1;" | cut -d':' -f1
```

### 3. Sign In with OTP

```bash
curl -X POST "$BACKEND_URL/api/auth/sign-in/email-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

Response (success):
```json
{
  "token": "...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "emailVerified": true,
    ...
  }
}
```

### 4. Complete Flow Test (with Dev Endpoint)

```bash
# Send OTP
curl -X POST "$BACKEND_URL/api/auth/email-otp/send-verification-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","type":"sign-in"}'

# Get OTP using dev endpoint (much easier!)
curl "$BACKEND_URL/api/dev/otp/newuser@example.com"

# Extract OTP and sign in
OTP_DATA=$(curl -s "$BACKEND_URL/api/dev/otp/newuser@example.com")
OTP=$(echo "$OTP_DATA" | grep -o '"otp":"[0-9]*"' | cut -d'"' -f4)

echo "OTP: $OTP"

# Sign in with OTP
curl -X POST "$BACKEND_URL/api/auth/sign-in/email-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"newuser@example.com\",\"otp\":\"$OTP\"}"
```

### 4b. Complete Flow Test (with Database)

```bash
cd backend

# Send OTP
curl -X POST "$BACKEND_URL/api/auth/email-otp/send-verification-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","type":"sign-in"}'

# Get OTP from database
OTP=$(sqlite3 prisma/dev.db "SELECT value FROM verification WHERE identifier='sign-in-otp-newuser@example.com' ORDER BY createdAt DESC LIMIT 1;" | cut -d':' -f1)

echo "OTP: $OTP"

# Sign in with OTP
curl -X POST "$BACKEND_URL/api/auth/sign-in/email-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"newuser@example.com\",\"otp\":\"$OTP\"}"
```

## Mobile App Flow

The mobile app flow is:

1. **Sign-in Screen** (`mobile/src/app/(auth)/sign-in.tsx`):
   - User enters email
   - App calls `authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })`
   - Navigates to verify-otp screen

2. **Verify OTP Screen** (`mobile/src/app/(auth)/verify-otp.tsx`):
   - User enters 6-digit code
   - App calls `authClient.signIn.emailOtp({ email, otp })` ✅ (Fixed)
   - On success: user is created (if doesn't exist) and signed in
   - Navigates to home screen

## Configuration

In `backend/src/auth.ts`:

```typescript
emailOTP({
  expiresIn: 60 * 10, // 10 minutes
  disableSignUp: false, // Allow creating accounts via OTP
  async sendVerificationOTP({ email, otp, type }) {
    // Sends via Vibecode SMTP service
    await fetch("https://smtp.vibecodeapp.com/v1/send/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        code: String(otp),
        fromName: "VibeForge Studio",
        lang: "en",
      }),
    });
  },
})
```

## Debugging

### Development Helper Endpoints

Get OTP for an email:
```bash
curl "$BACKEND_URL/api/dev/otp/test@example.com"
```

Clear all verification entries:
```bash
curl -X DELETE "$BACKEND_URL/api/dev/verifications"
```

**Note**: These endpoints only work in development mode and return 403 in production.

### Check Backend Logs

```bash
tail -f backend/server.log | grep "OTP DEBUG"
```

### Check Database Tables

Check verification table:
```bash
cd backend
sqlite3 prisma/dev.db "SELECT * FROM verification ORDER BY createdAt DESC LIMIT 5;"
```

Check users table:
```bash
cd backend
sqlite3 prisma/dev.db "SELECT id, email, emailVerified, createdAt FROM User;"
```

## Common Issues

1. **"Invalid OTP"**:
   - Check if OTP expired (10 minutes by default)
   - Check attempt count (3 attempts max by default)
   - Ensure using correct endpoint (`/sign-in/email-otp`, not `/email-otp/verify-email`)

2. **"User not found"**:
   - Wrong endpoint being used
   - Set `disableSignUp: false` in emailOTP config

3. **OTP not received**:
   - Check backend logs for SMTP errors
   - Verify email address is valid
   - Check spam folder (in production with real emails)
