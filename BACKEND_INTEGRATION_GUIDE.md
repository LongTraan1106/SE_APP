# Backend Integration Documentation

## 📋 Tóm tắt

Đã tích hợp hoàn toàn 2 screens Sign In/Sign Up với backend tại `192.168.20.156:6010` với đầy đủ validation, error handling, token management, và persistent session storage.

## 🔧 Files Được Tạo/Cập Nhật

### New Files:
1. **[services/authService.ts](../services/authService.ts)** - API calls & type definitions
2. **[utils/storageService.ts](../utils/storageService.ts)** - AsyncStorage token management
3. **[contexts/AuthContext.tsx](../contexts/AuthContext.tsx)** - Global authentication state management

### Updated Files:
1. **[screens/SignInScreen.tsx](../screens/SignInScreen.tsx)** - Sign In with backend integration
2. **[screens/SignUpScreen.tsx](../screens/SignUpScreen.tsx)** - Sign Up with backend integration
3. **[navigation/RootNavigator.tsx](../navigation/RootNavigator.tsx)** - Auth-based navigation
4. **[App.tsx](../App.tsx)** - Wrapped with AuthProvider
5. **[package.json](../package.json)** - Added @react-native-async-storage/async-storage

---

## ✅ Backend Constraints Implementation

### **Sign Up Constraints (Chính xác từ backend)**

```typescript
// ✅ Username: 3-20 chars, only a-z, A-Z, 0-9, _
const validateUsername = (username: string) => {
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username) && 
         username.length >= 3 && 
         username.length <= 20;
};

// ✅ Email: must be @gmail.com
const validateEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return emailRegex.test(email);
};

// ✅ Password: min 6, uppercase + number required
const validatePassword = (password: string) => {
  return password.length >= 6 && 
         /[A-Z]/.test(password) && 
         /[0-9]/.test(password);
};
```

### **Sign In Constraints**

```typescript
// ✅ Uses EMAIL (not username) + password
interface SignInRequest {
  email: string;      // @gmail.com required
  password: string;   // min 6, uppercase + number
}
```

---

## 🏗️ Architecture Overview

### **Auth Flow Diagram**

```
User Input
    ↓
Validation (Frontend)
    ↓
API Call (authService)
    ↓
Backend (192.168.20.156:6010)
    ↓
Response {success, user, tokens}
    ↓
Save Tokens (AsyncStorage via storageService)
    ↓
Update AuthContext State
    ↓
Navigation Automatically Changes (RootNavigator)
    ↓
Main App Access
```

---

## 📱 Component Details

### **1. AuthService** ([services/authService.ts](../services/authService.ts))

```typescript
// Methods
authService.signUp(request: SignUpRequest) → SignUpResponse
authService.signIn(request: SignInRequest) → SignInResponse
authService.refreshToken(refreshToken: string) → RefreshTokenResponse
authService.healthCheck() → Promise<boolean>
```

**Features:**
- Type-safe requests/responses
- Automatic error handling
- Follows backend API exactly

### **2. StorageService** ([utils/storageService.ts](../utils/storageService.ts))

```typescript
// Methods
storageService.saveAccessToken(token)
storageService.getAccessToken()
storageService.saveRefreshToken(token)
storageService.getRefreshToken()
storageService.saveUserData(userData)
storageService.getUserData()
storageService.clearAuthData()     // for logout
storageService.getAllAuthData()    // restore session
```

**Purpose:**
- Persist tokens across app restarts
- Enable offline access with valid tokens
- Secure data storage

### **3. AuthContext** ([contexts/AuthContext.tsx](../contexts/AuthContext.tsx))

```typescript
// State
isLoggedIn: boolean
user: UserResponse | null
accessToken: string | null
refreshToken: string | null
loading: boolean
error: string | null

// Methods
signUp(data: SignUpRequest) → Promise<void>
signIn(data: SignInRequest) → Promise<void>
logout() → Promise<void>
checkAuthStatus() → Promise<void>  // restore session on app start
clearError() → void
```

**Key Features:**
- Global authentication state
- Automatic session restoration on app launch
- Centralized error management
- useAuth() hook for consuming context

---

## 🔄 Sign In/Sign Up Flow

### **Sign Up Flow**

```
1. User enters: username, email, password, confirm password
2. Frontend validates:
   - Username: 3-20 chars, a-z, A-Z, 0-9, _
   - Email: @gmail.com format
   - Password: 6+ chars, uppercase + number
3. API Call: POST /api/auth/signup
4. Backend Response:
   {
     "success": true,
     "message": "Đăng ký thành công",
     "data": {
       "id": 1,
       "username": "user",
       "email": "user@gmail.com",
       "created_at": "2024-05-02T10:30:00Z"
     }
   }
5. Store user data in AsyncStorage
6. Auto-login using the same credentials
7. Receive access_token + refresh_token
8. Update AuthContext → isLoggedIn = true
9. RootNavigator automatically navigates to main app
```

### **Sign In Flow**

```
1. User enters: email, password
2. Frontend validates:
   - Email: not empty, has @
   - Password: not empty
3. API Call: POST /api/auth/signin
4. Backend Response:
   {
     "success": true,
     "message": "Đăng nhập thành công",
     "data": {
       "user": {...},
       "tokens": {
         "access_token": "eyJ...",
         "refresh_token": "eyJ...",
         "token_type": "bearer"
       }
     }
   }
5. Save tokens to AsyncStorage
6. Save user data to AsyncStorage
7. Update AuthContext
8. RootNavigator automatically navigates to main app
```

### **Session Restoration (On App Start)**

```
1. App Launches
2. AuthProvider calls checkAuthStatus()
3. Restore from AsyncStorage:
   - accessToken
   - refreshToken
   - userData
4. If found:
   - Update AuthContext state
   - RootNavigator shows main app (skip login)
5. If not found:
   - RootNavigator shows Sign In screen
```

---

## 🛡️ Error Handling

### **Backend Errors Handled**

```typescript
// Sign Up Errors:
- "Username đã tồn tại" (400)
- "Email đã được đăng ký" (400)
- Validation errors from backend validators

// Sign In Errors:
- "Email hoặc password không chính xác" (401)
- Network errors
- Invalid response format

// All errors are:
- Displayed in UI with visual error container
- Cleared when user starts typing
- Logged to console for debugging
```

### **Error Container Styling**

```
┌─────────────────────────────────┐
│ ⚠️ Error message in red          │
└─────────────────────────────────┘
- Red left border (4px)
- Light red background (#FFEBEE)
- Appears below title
- Auto-dismisses when user types
```

---

## 🎨 UI Features Added

### **Password Visibility Toggle**

```
Icon: 👁️ (visible) / 👁️‍🗨️ (hidden)
Position: Right side of password input
Function: Toggle secureTextEntry={!showPassword}
Available: Both Sign In & Sign Up
```

### **Loading State**

```
- Continue button shows spinner during request
- All inputs disabled during loading
- Button opacity reduced to 0.7
- User cannot submit multiple requests
```

### **Real-time Validation**

```
- Frontend validation matches backend exactly
- Error messages display immediately on blur
- Clear, specific error guidance
- Password validation shown: "6+ chars with uppercase and number"
```

---

## 🚀 Next Steps (Optional Features)

### **1. Add Refresh Token Logic**
```typescript
// In AuthContext
const refreshAccessToken = async (oldRefreshToken: string) => {
  const response = await authService.refreshToken(oldRefreshToken);
  // Save new tokens & update state
};
```

### **2. Add Forgot Password**
```typescript
// New endpoint: POST /api/auth/forgot-password
// Screen: ForgotPasswordScreen
// Flow: Email → Verification → Reset Password
```

### **3. Add Token Expiration Check**
```typescript
// Check token expiration before each API call
// Auto-refresh if expired
// Logout if refresh also expires
```

### **4. Add Social Login** (Google, Facebook)
```typescript
// Integration with react-native-google-signin
// Integration with react-native-facebook-sdk
```

### **5. Add Biometric Login**
```typescript
// react-native-biometrics
// Face ID / Fingerprint
```

---

## 🧪 Testing the Integration

### **Local Testing Steps**

```bash
# 1. Install dependencies
npm install
# OR
yarn install

# 2. Start metro bundler
npm start
# OR
yarn start

# 3. Run on Android
npm run android
# OR  
yarn android

# 4. Run on iOS
npm run ios
# OR
yarn ios
```

### **Test Sign Up**
```
Username: testuser123
Email: testuser@gmail.com
Password: Password123
Expected: Auto-login, navigate to main app
```

### **Test Sign In**
```
Email: testuser@gmail.com
Password: Password123
Expected: Navigate to main app
```

### **Test Session Restoration**
```
1. Sign In successfully
2. Force close app
3. Reopen app
4. Should skip login, show main app directly
```

### **Test Error Handling**
```
1. Try existing email on Sign Up → "Email đã được đăng ký"
2. Try wrong password on Sign In → "Email hoặc password không chính xác"
3. Try invalid email format → Frontend validation
4. Try weak password → "Password must be 6+ chars..."
```

---

## 📊 Token Management

### **Token Storage Location**
```
Android: /data/data/com.study_helper/shared_prefs/
iOS: ~/Library/Preferences/com.study_helper.plist
```

### **Token Lifecycle**
```
1. Create (Sign Up/Sign In)
   - access_token: 30 minutes (from backend)
   - refresh_token: 7 days (from backend)

2. Store (storageService)
   - Saved to AsyncStorage for persistence

3. Use (Future API calls)
   - Add to Authorization header: Bearer {accessToken}

4. Refresh (When expired)
   - POST /api/auth/refresh with refresh_token
   - Get new access_token

5. Clear (On Logout)
   - Remove from AsyncStorage
   - Clear AuthContext
```

---

## 📝 Code Examples

### **Using Auth in a Component**

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { isLoggedIn, user, logout, error } = useAuth();

  return (
    <View>
      {isLoggedIn && <Text>Welcome, {user?.username}!</Text>}
      <TouchableOpacity onPress={logout}>
        <Text>Logout</Text>
      </TouchableOpacity>
      {error && <Text style={{color: 'red'}}>{error}</Text>}
    </View>
  );
}
```

### **Making Authenticated API Calls (Future)**

```typescript
const { accessToken } = useAuth();

const fetchUserData = async () => {
  const response = await fetch('http://192.168.20.156:6010/api/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  return response.json();
};
```

---

## 🐛 Debugging

### **Enable Console Logs**
```typescript
// In authService.ts
console.log('API Request:', { url, method, body });
console.log('API Response:', response);

// In AuthContext
console.log('Auth State Updated:', { isLoggedIn, user });
```

### **Check AsyncStorage**
```typescript
// Temporary - for debugging only
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugStorage = async () => {
  const all = await AsyncStorage.getAllKeys();
  console.log('Stored Keys:', all);
};
```

### **Check Network Requests**
- Use React Native Debugger
- Or: `adb logcat | grep okhttp` (Android)
- Or: Debug → Network tab in DevTools

---

## ✨ Features Summary

✅ Full Sign Up validation (username, email, password)
✅ Full Sign In validation (email, password)
✅ Backend API integration (192.168.20.156:6010)
✅ Error handling & display
✅ Token storage (AsyncStorage)
✅ Session restoration on app restart
✅ Global auth state (AuthContext)
✅ Auto navigation based on auth status
✅ Password visibility toggle
✅ Loading states
✅ Real-time validation
✅ Type-safe API calls

---

## 🔐 Security Notes

⚠️ **Production Checklist:**
- [ ] Change SECRET_KEY in backend
- [ ] Enable HTTPS only
- [ ] Implement token rotation
- [ ] Add request signing
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Encrypt tokens in storage
- [ ] Validate all user inputs

---

## 📞 Support

If you encounter issues:
1. Check backend is running: `http://192.168.20.156:6010/health`
2. Check console logs for detailed errors
3. Verify network connectivity
4. Ensure backend validators match frontend validation

---

**Backend Location:** `E:\App_c\auth-backend`
**Frontend Location:** `E:\App_c\Study_helper`
**Backend IP:** 192.168.20.156:6010
**Last Updated:** May 2, 2026
