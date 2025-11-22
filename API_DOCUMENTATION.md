# Matcha API Documentation

**Base URL:** `http://localhost:5000`

**API Prefix:** `/api/auth`

---

## Authentication Endpoints

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user account. Sends verification email.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepass123"
}
```

**Field Validation:**
- `email`: Valid email format (required)
- `username`: String, unique (required)
- `first_name`: String (required)
- `last_name`: String (required)
- `password`: Minimum 8 characters (required)

**Success Response (201 Created):**
```json
{
  "message": "Registration successful. Please verify your email.",
  "verification_token": "dBoe8_AeLlmmzLPK0tgWC87uJ..."
}
```

**Error Responses:**

**400 Bad Request - Missing Fields:**
```json
{
  "error": "Missing required fields"
}
```

**400 Bad Request - Invalid Email:**
```json
{
  "error": "Invalid email format"
}
```

**400 Bad Request - Password Too Short:**
```json
{
  "error": "Password must be at least 8 characters"
}
```

**409 Conflict - User Exists:**
```json
{
  "error": "Username or email already exists"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Registration failed: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const registerUser = async (userData) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        username: userData.username,
        first_name: userData.firstName,
        last_name: userData.lastName,
        password: userData.password
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Show success message
      console.log('Registration successful:', data.message);
      // Redirect to verification page or show verification instructions
      return { success: true, data };
    } else {
      // Show error message
      console.error('Registration failed:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: 'Network error occurred' };
  }
};
```

**Frontend Usage (Axios):**
```javascript
import axios from 'axios';

const registerUser = async (userData) => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      email: userData.email,
      username: userData.username,
      first_name: userData.firstName,
      last_name: userData.lastName,
      password: userData.password
    });

    // Success
    console.log('Registration successful:', response.data.message);
    return { success: true, data: response.data };
  } catch (error) {
    // Handle error
    if (error.response) {
      // Server responded with error status
      console.error('Registration failed:', error.response.data.error);
      return { success: false, error: error.response.data.error };
    } else {
      // Network error
      console.error('Network error:', error.message);
      return { success: false, error: 'Network error occurred' };
    }
  }
};
```

---

### 2. Verify Email

**Endpoint:** `GET /api/auth/verify/<token>`

**Description:** Verify user email using the token sent via email.

**URL Parameters:**
- `token` (string, required): Verification token from email

**Headers:**
```
None required
```

**Success Response (200 OK):**
```json
{
  "message": "Email verified successfully"
}
```

**Success Response - Already Verified (200 OK):**
```json
{
  "message": "Account already verified"
}
```

**Error Responses:**

**400 Bad Request - Invalid Token:**
```json
{
  "error": "Invalid verification token"
}
```

**400 Bad Request - Expired Token:**
```json
{
  "error": "Verification token expired"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Verification failed: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const verifyEmail = async (token) => {
  try {
    const response = await fetch(`http://localhost:5000/api/auth/verify/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (response.ok) {
      // Show success message
      console.log('Email verified:', data.message);
      // Redirect to login page
      return { success: true, message: data.message };
    } else {
      // Show error message
      console.error('Verification failed:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: 'Network error occurred' };
  }
};

// Usage in React component
const VerificationPage = ({ match }) => {
  const token = match.params.token; // or useRouter hook for React Router v6
  
  useEffect(() => {
    verifyEmail(token).then(result => {
      if (result.success) {
        // Show success message, redirect to login
      } else {
        // Show error message
      }
    });
  }, [token]);
};
```

**Frontend Usage (Axios):**
```javascript
import axios from 'axios';

const verifyEmail = async (token) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/auth/verify/${token}`);
    
    // Success
    console.log('Email verified:', response.data.message);
    return { success: true, message: response.data.message };
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      console.error('Verification failed:', error.response.data.error);
      return { success: false, error: error.response.data.error };
    } else {
      // Network error
      console.error('Network error:', error.message);
      return { success: false, error: 'Network error occurred' };
    }
  }
};
```

**React Router Example:**
```javascript
// App.js or Router setup
<Route path="/verify/:token" component={VerificationPage} />

// VerificationPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const VerificationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const verify = async () => {
      const result = await verifyEmail(token);
      if (result.success) {
        setStatus('success');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
      }
    };
    verify();
  }, [token, navigate]);

  if (status === 'verifying') return <div>Verifying...</div>;
  if (status === 'success') return <div>Email verified! Redirecting to login...</div>;
  return <div>Verification failed. Token may be invalid or expired.</div>;
};
```

---

### 3. Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user with username and password. Returns JWT token for authenticated requests.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepass123"
}
```

**Field Validation:**
- `username`: String (required)
- `password`: String (required)

**Success Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com"
  }
}
```

**Error Responses:**

**400 Bad Request - Missing Fields:**
```json
{
  "error": "Username and password required"
}
```

**401 Unauthorized - Invalid Credentials:**
```json
{
  "error": "Invalid username or password"
}
```

**403 Forbidden - Account Not Verified:**
```json
{
  "error": "Account not verified. Please check your email."
}
```

**500 Internal Server Error:**
```json
{
  "error": "Login failed: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const loginUser = async (username, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Store token in localStorage or state management
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Set Authorization header for future requests
      // axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      console.log('Login successful:', data.message);
      return { success: true, data };
    } else {
      console.error('Login failed:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: 'Network error occurred' };
  }
};
```

**Frontend Usage (Axios):**
```javascript
import axios from 'axios';

const loginUser = async (username, password) => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username: username,
      password: password
    });

    // Store token
    const token = response.data.token;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    // Set default Authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log('Login successful:', response.data.message);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response) {
      console.error('Login failed:', error.response.data.error);
      return { success: false, error: error.response.data.error };
    } else {
      console.error('Network error:', error.message);
      return { success: false, error: 'Network error occurred' };
    }
  }
};
```

**React Hook Example:**
```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await loginUser(username, password);
    
    if (result.success) {
      // Redirect to dashboard or home
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
};
```

**Using Token in Authenticated Requests:**
```javascript
// After login, include token in Authorization header
const fetchProtectedData = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/protected-endpoint', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};

// With Axios interceptor
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## Error Handling Guide

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid input/validation error
- **401 Unauthorized**: Authentication required or invalid credentials
- **403 Forbidden**: Account not verified or access denied
- **409 Conflict**: Resource already exists
- **500 Internal Server Error**: Server error

### Error Response Format

All error responses follow this format:
```json
{
  "error": "Error message description"
}
```

### Frontend Error Handling Pattern

```javascript
const handleApiCall = async (apiFunction) => {
  try {
    const result = await apiFunction();
    if (result.success) {
      // Handle success
      return result;
    } else {
      // Handle API error
      showError(result.error);
      return result;
    }
  } catch (error) {
    // Handle network/unexpected errors
    showError('An unexpected error occurred');
    return { success: false, error: 'Network error' };
  }
};
```

---

## Testing Examples

### cURL Commands

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "password": "password123"
  }'
```

**Verify:**
```bash
curl -X GET http://localhost:5000/api/auth/verify/YOUR_TOKEN_HERE
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**Login with Token Storage:**
```bash
# Login and save token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }' | jq -r '.token')

# Use token in authenticated request
curl -X GET http://localhost:5000/api/protected-endpoint \
  -H "Authorization: Bearer $TOKEN"
```

### Postman Collection

**Register Request:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/register`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "test@example.com",
  "username": "testuser",
  "first_name": "Test",
  "last_name": "User",
  "password": "password123"
}
```

**Verify Request:**
- Method: `GET`
- URL: `http://localhost:5000/api/auth/verify/{token}`
- Replace `{token}` with actual token from registration response

**Login Request:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/login`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Postman Environment Variables:**
Create a Postman environment with:
- `base_url`: `http://localhost:5000`
- `token`: (set automatically after login)

**Postman Pre-request Script (for Login):**
```javascript
// After successful login, save token to environment
pm.environment.set("token", pm.response.json().token);
```

**Postman Authorization Header (for Protected Routes):**
- Type: `Bearer Token`
- Token: `{{token}}` (uses environment variable)

---

## Notes

1. **Verification Token:** The `verification_token` in registration response is for testing only. Remove it in production.

2. **Email Verification:** Users must verify their email before they can login.

3. **Token Expiration:** 
   - Verification tokens expire after 24 hours
   - JWT tokens expire after 24 hours (configurable via `JWT_EXPIRATION_HOURS`)

4. **Password Requirements:** Minimum 8 characters (dictionary word check not implemented yet).

5. **Authentication:** After login, include JWT token in `Authorization: Bearer <token>` header for protected routes.

6. **Last Online:** User's `last_online` timestamp is updated on successful login.

7. **Base URL:** Change `localhost:5000` to your production domain when deploying.

