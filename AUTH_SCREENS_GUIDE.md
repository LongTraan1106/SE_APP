# Hướng dẫn Auth Screens - Sign In & Sign Up

## 📋 Tóm tắt cấu trúc đã tạo

### Các Screens được tạo:
1. **SignInScreen.tsx** - Màn hình đăng nhập
2. **SignUpScreen.tsx** - Màn hình đăng ký
3. **CloudIcon.tsx** - Component icon mây tái sử dụng

### Cấu trúc chính của mỗi screen:

#### **Sign In Screen**
```
┌─────────────────────────────┐
│ WELCOME !                   │ (Header - Light Green #D4E8D9)
│                             │
│   ☁️  (Cloud Icon)          │
│                             │
├─────────────────────────────┤
│ SIGN IN                     │ (Form Section - Teal #8DB39F)
│                             │
│ ┌─────────────────────────┐ │
│ │ Username                │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Password                │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │    Continue Button      │ │ (Dark Green #6B9071)
│ └─────────────────────────┘ │
│                             │
│ Dont have account ?, SIGN UP│
│                             │
└─────────────────────────────┘
```

#### **Sign Up Screen**
```
┌─────────────────────────────┐
│ WELCOME !                   │ (Header - Light Green #D4E8D9)
│                             │
│   ☁️  (Cloud Icon)          │
│                             │
├─────────────────────────────┤
│ SIGN UP                     │ (Form Section - Teal #8DB39F)
│                             │
│ ┌─────────────────────────┐ │
│ │ Username                │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Email address           │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Password                │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Confirm password        │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │    Continue Button      │ │ (Dark Green #6B9071)
│ └─────────────────────────┘ │
│                             │
│ Already have an account ?,  │
│    SIGN IN here             │
│                             │
└─────────────────────────────┘
```

## 🎨 Phân tích từng thành phần

### 1. **Color Scheme (Bảng màu)**
- **Light Green (#D4E8D9)**: Top section background
- **Teal (#8DB39F)**: Form section background  
- **Dark Green (#6B9071)**: Button & status bar
- **White (#FFFFFF)**: Input fields
- **Dark Gray (#333333)**: Text & borders

### 2. **Typography (Kiểu chữ)**
- **Welcome Text**: 32px, Bold (700), Letter spacing +1
- **Form Title**: 28px, Bold (700), Letter spacing +1
- **Button Text**: 18px, Semi-bold (600), Letter spacing +0.5
- **Link Text**: 14px, Regular/Bold (400/700)

### 3. **Thành phần Input Fields**
- Border: 2px, Rounded (16px), Dark gray (#333333)
- Padding: Vertical 14-16px, Horizontal 18-20px
- Placeholder: Gray (#999)
- **Validation**: 
  - Error border color: Red (#E74C3C)
  - Error text: Light red (#FFE6E6)

### 4. **Continue Button**
- Background: Dark Green (#6B9071)
- Padding: 14px vertical
- Border radius: 24px
- Shadow: elevation 5, soft shadow
- Hover: activeOpacity 0.8

### 5. **Navigation Links**
- Text + Bold link + Text
- Color: White (#FFFFFF)
- Underlined bold text
- Centered layout với flexWrap

### 6. **Cloud Icon**
- Custom component được tạo
- Size: 200px (Sign In), 180px (Sign Up)
- Color: Light (#E8F0EB)
- Features: Eyes + simple smile effect

## 📱 Validation Logic (Đã triển khai)

### **Sign In Validation**
- ✅ Username: Bắt buộc
- ✅ Password: Bắt buộc
- ✅ Error messages hiển thị real-time

### **Sign Up Validation**
- ✅ Username: Bắt buộc, ≥ 3 ký tự
- ✅ Email: Bắt buộc, định dạng hợp lệ
- ✅ Password: Bắt buộc, ≥ 6 ký tự
- ✅ Confirm Password: Khớp với password
- ✅ Error messages chi tiết

## 🔗 Navigation Flow

```
App.tsx
  ↓
RootNavigator.tsx
  ↓
  ├─ Auth Stack (khi chưa login - isLoggedIn = false)
  │  ├─ SignInScreen (initial)
  │  └─ SignUpScreen (navigate('SignUp'))
  │
  └─ App Stack (khi đã login - isLoggedIn = true)
     └─ TabNavigator
        ├─ Home (Dashboard)
        ├─ Documents
        ├─ Flashcard
        └─ Profile
```

## 🚀 Hướng dẫn Tích hợp Backend

### **Bước 1: Thêm API Service**
Tạo file `src/services/authService.ts`:

```typescript
const API_URL = 'http://192.168.20.156:6010';

export const authService = {
  signIn: async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  signUp: async (username: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
```

### **Bước 2: Tạo Auth Context**
Tạo file `src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await authService.signIn(username, password);
      if (response.success) {
        setUser(response.user);
        setIsLoggedIn(true);
        // Lưu token
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const response = await authService.signUp(username, email, password);
      if (response.success) {
        // Tự động login sau khi đăng ký
        await login(username, password);
      }
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### **Bước 3: Cập nhật RootNavigator.tsx**
```typescript
import { AuthContext } from '../contexts/AuthContext';

export function RootNavigator() {
  const { isLoggedIn } = useContext(AuthContext);
  
  // Sử dụng isLoggedIn từ context thay vì local state
  // ...rest of code
}
```

### **Bước 4: Cập nhật SignInScreen.tsx**
Thêm API call trong `handleSignIn()`:

```typescript
const { login, loading } = useContext(AuthContext);

const handleSignIn = async () => {
  if (validateInputs()) {
    await login(username, password);
    // Navigation sẽ tự động thay đổi dựa vào isLoggedIn state
  }
};
```

## 💡 Thêm Features (Tuỳ chọn)

### 1. **Loading Indicator**
```typescript
{loading && <ActivityIndicator size="large" color="#6B9071" />}
```

### 2. **Forgotten Password Link**
Thêm link dưới password input trong Sign In

### 3. **Social Login** (Google, Facebook)
Tạo buttons riêng biệt

### 4. **Remember Me Checkbox**
Thêm checkbox trong Sign In

### 5. **Password Strength Indicator**
Hiển thị trong Sign Up

## 📝 File Locations
```
Study_helper/
├── screens/
│   ├── SignInScreen.tsx ✅
│   ├── SignUpScreen.tsx ✅
│   └── (existing screens)
├── components/
│   ├── CloudIcon.tsx ✅
│   └── (existing components)
├── navigation/
│   ├── RootNavigator.tsx ✅ (cập nhật)
│   └── (existing navigation)
└── (future)
    ├── services/
    │   └── authService.ts (cần tạo)
    ├── contexts/
    │   └── AuthContext.tsx (cần tạo)
    └── utils/
        └── storage.ts (lưu token)
```

## ✨ Completed Tasks
- ✅ Created Sign In Screen with full layout
- ✅ Created Sign Up Screen with full layout
- ✅ Created reusable CloudIcon component
- ✅ Integrated into RootNavigator
- ✅ Added form validation
- ✅ Added navigation between Sign In/Sign Up
- ✅ Prepared for backend integration

## 🎯 Next Steps
1. Implement authService API calls
2. Create AuthContext for global state management
3. Add token storage (AsyncStorage)
4. Implement error handling & loading states
5. Add password reset functionality
6. Test with actual backend at 192.168.20.156:6010

---

**Note**: Hiện tại `isLoggedIn` state trong RootNavigator được set hardcode là `false`. Sau khi tích hợp backend, bạn sẽ cần sử dụng AuthContext để quản lý authentication state globally.
