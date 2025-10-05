# ViroNex Backend API Documentation

---

## 🔗 Base Configuration

```
Base URL: http://localhost:8000/api/v1
Environment: Development
Content-Type: application/json (default)
Content-Type: multipart/form-data (file uploads)
```

---

## 🔐 Authentication

**Type**: JWT (JSON Web Tokens)
**Header**: `Authorization: Bearer <access_token>`
**Storage**: Store both access token and refresh token
**Refresh**: Use `/refresh-token` when access token expires

---

## 📡 API Endpoints

### Authentication Routes
```
POST   /users/register          # User registration with avatar upload
POST   /users/login             # User login
POST   /users/logout            # User logout (requires auth)
POST   /users/refresh-token     # Refresh access token
```

### User Management Routes  
```
GET    /users/current-user      # Get current user info (requires auth)
PATCH  /users/update-details    # Update user details (requires auth)
POST   /users/change-password   # Change password (requires auth)
PATCH  /users/change-avatar     # Update avatar (requires auth + file)
PATCH  /users/change-cover-image # Update cover image (requires auth + file)
GET    /users/channel/:username # Get user channel profile (requires auth)
GET    /users/watch-history     # Get user watch history (requires auth)
```

---

## 📝 Request/Response Examples

### 1. User Registration
**Endpoint**: `POST /users/register`
**Content-Type**: `multipart/form-data`

**Request Body**:
```javascript
{
  fullName: "John Doe",           // required
  email: "john@example.com",      // required  
  username: "johndoe",            // required
  password: "securePassword123",  // required
  avatar: File,                   // required (image file)
  coverImage: File                // optional (image file)
}
```

**Success Response** (201):
```javascript
{
  statusCode: 200,
  data: {
    _id: "60f7b3b3b3b3b3b3b3b3b3b3",
    fullName: "John Doe",
    username: "johndoe", 
    email: "john@example.com",
    avatar: "https://cloudinary.com/image/upload/v1234567890/avatar.jpg",
    coverImage: "https://cloudinary.com/image/upload/v1234567890/cover.jpg"
  },
  message: "User registered Successfully",
  success: true
}
```

### 2. User Login
**Endpoint**: `POST /users/login`
**Content-Type**: `application/json`

**Request Body**:
```javascript
{
  username: "johndoe",            // or email
  password: "securePassword123"
}
```

**Success Response** (200):
```javascript
{
  statusCode: 200,
  data: {
    user: {
      _id: "60f7b3b3b3b3b3b3b3b3b3b3",
      fullName: "John Doe",
      username: "johndoe",
      email: "john@example.com", 
      avatar: "https://cloudinary.com/...",
      coverImage: "https://cloudinary.com/..."
    },
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  message: "User logged in successfully",
  success: true
}
```

### 3. Get Current User
**Endpoint**: `GET /users/current-user`
**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```javascript
{
  statusCode: 200,
  data: {
    _id: "60f7b3b3b3b3b3b3b3b3b3b3",
    fullName: "John Doe",
    username: "johndoe",
    email: "john@example.com",
    avatar: "https://cloudinary.com/...",
    coverImage: "https://cloudinary.com/..."
  },
  message: "Current user retrieved successfully",
  success: true
}
```

### 4. Update User Details
**Endpoint**: `PATCH /users/update-details`
**Headers**: `Authorization: Bearer <access_token>`
**Content-Type**: `application/json`

**Request Body**:
```javascript
{
  fullName: "John Smith",        // optional
  email: "johnsmith@example.com" // optional
}
```

### 5. Change Avatar
**Endpoint**: `PATCH /users/change-avatar`
**Headers**: `Authorization: Bearer <access_token>`
**Content-Type**: `multipart/form-data`

**Request Body**:
```javascript
{
  avatar: File  // required (image file)
}
```

### 6. Refresh Token
**Endpoint**: `POST /users/refresh-token`
**Content-Type**: `application/json`

**Request Body**:
```javascript
{
  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## ⚠️ Error Responses

**Standard Error Format**:
```javascript
{
  statusCode: 400,
  message: "Validation error message",
  success: false,
  errors: ["Specific error 1", "Specific error 2"]
}
```

**Common Status Codes**:
- `400` - Bad Request (validation errors, missing fields)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found (user/resource doesn't exist)
- `409` - Conflict (user already exists)
- `500` - Internal Server Error

**Example Error Responses**:

*Validation Error (400)*:
```javascript
{
  statusCode: 400,
  message: "All fields are required",
  success: false,
  errors: []
}
```

*Authentication Error (401)*:
```javascript
{
  statusCode: 401,
  message: "Unauthorized request",
  success: false,
  errors: []
}
```

*User Already Exists (409)*:
```javascript
{
  statusCode: 409,
  message: "User with email or username already exists",
  success: false,
  errors: []
}
```

---

## 📁 File Upload Specifications

### Avatar Upload
- **Field name**: `avatar`
- **Type**: Single file
- **Formats**: Image files (jpg, png, etc.)
- **Storage**: Cloudinary
- **Required**: Yes (for registration)

### Cover Image Upload  
- **Field name**: `coverImage`
- **Type**: Single file
- **Formats**: Image files (jpg, png, etc.)
- **Storage**: Cloudinary
- **Required**: No

---

## 🔧 Frontend Implementation Checklist

### Authentication Flow
- [ ] Registration form with file upload
- [ ] Login form
- [ ] Logout functionality
- [ ] Token storage (localStorage/sessionStorage)
- [ ] Automatic token refresh
- [ ] Protected route component
- [ ] Authentication context/state management

### API Integration
- [ ] HTTP client setup (axios/fetch)
- [ ] Request interceptors (add auth headers)
- [ ] Response interceptors (handle errors)
- [ ] Error handling component
- [ ] Loading states for API calls

### File Upload Components
- [ ] Avatar upload with preview
- [ ] Cover image upload with preview
- [ ] File validation (type, size)
- [ ] Upload progress indicators

### User Interface Components
- [ ] Registration form
- [ ] Login form
- [ ] User profile display
- [ ] Edit profile form
- [ ] Change password form
- [ ] Error message display
- [ ] Success message display

---

## 🌐 CORS Configuration

**Allowed Origins**: Configurable via `CORS_ORIGIN` environment variable
**Credentials**: Enabled (cookies and auth headers allowed)
**Methods**: GET, POST, PATCH, DELETE, OPTIONS
**Headers**: Content-Type, Authorization

---

## 🚀 Development Tips

1. **Token Management**: Store tokens securely and implement automatic refresh
2. **Error Handling**: Create a centralized error handler for consistent UX
3. **Loading States**: Show spinners/loaders during API calls
4. **Form Validation**: Validate on frontend before sending to backend
5. **File Upload**: Implement file preview and validation
6. **Responsive Design**: Ensure forms work on all device sizes
7. **Security**: Never store sensitive data in localStorage in production

---

## 📞 Contact Information

**Backend Developer**: Shaswat Pathak
**Repository**: https://github.com/ethyashpathak/ViroNex
**Issues**: Report bugs via GitHub issues

---

*Last Updated: October 2025*
