# OTP Verification Fix Summary

## Problem
OTP verification was failing with "Invalid OTP" error when users tried to sign in.

## Root Cause
The mobile app was calling the wrong Better Auth endpoint:
- Used: `authClient.emailOtp.verifyEmail()` → `/api/auth/email-otp/verify-email`
- This endpoint **requires the user to already exist** in the database
- For new users, verification would always fail with "User not found"

## Solution
Changed the mobile app to use the correct endpoint:
- Now uses: `authClient.signIn.emailOtp()` → `/api/auth/sign-in/email-otp`
- This endpoint **creates the user account** if they don't exist (when `disableSignUp: false`)
- Automatically signs in the user and returns a session token

## Files Changed

### 1. Mobile App (`mobile/src/app/(auth)/verify-otp.tsx`)
Changed line 68 from:
```typescript
const result = await authClient.emailOtp.verifyEmail({
  email,
  otp: code,
});
```

To:
```typescript
const result = await authClient.signIn.emailOtp({
  email,
  otp: code,
});
```

### 2. Backend Auth Config (`backend/src/auth.ts`)
- Added `disableSignUp: false` to allow account creation via OTP
- Added `expiresIn: 60 * 10` (10 minutes) for easier testing
- Added debug logging to track OTP sending
- Removed the type filter that was preventing email sending for non-sign-in types

### 3. Development Helper (`backend/src/routes/dev.ts`)
Created new development-only endpoints:
- `GET /api/dev/otp/:email` - Get the OTP for an email without checking database
- `DELETE /api/dev/verifications` - Clear all verification entries

### 4. Documentation
- Created `backend/OTP_TESTING.md` with complete testing guide
- Created this summary document

## Testing

### Quick Test (using dev endpoint):
```bash
# 1. Send OTP
curl -X POST "$BACKEND_URL/api/auth/email-otp/send-verification-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"sign-in"}'

# 2. Get OTP
curl "$BACKEND_URL/api/dev/otp/test@example.com"

# 3. Sign in with OTP (use the OTP from step 2)
curl -X POST "$BACKEND_URL/api/auth/sign-in/email-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

### Mobile App Flow:
1. User enters email on sign-in screen
2. App sends OTP via `authClient.emailOtp.sendVerificationOtp()`
3. User receives OTP email (via Vibecode SMTP service)
4. User enters OTP on verify screen
5. App verifies OTP via `authClient.signIn.emailOtp()` ✅
6. User account is created (if new) and signed in automatically
7. User is redirected to home screen

## Configuration

Key settings in `backend/src/auth.ts`:

```typescript
emailOTP({
  expiresIn: 60 * 10, // 10 minutes
  disableSignUp: false, // Allow account creation via OTP
  async sendVerificationOTP({ email, otp, type }) {
    // Sends via Vibecode SMTP service at https://smtp.vibecodeapp.com/v1/send/otp
  },
})
```

## Result
✅ OTP authentication now works end-to-end
✅ New users can sign up using just their email (passwordless)
✅ Existing users can sign in using OTP
✅ Development endpoints make testing easier
✅ Better error logging for debugging
