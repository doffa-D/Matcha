# Matcha API Documentation

**Base URL:** `http://localhost:5000`

**API Prefixes:** 
- `/api/auth` - Authentication endpoints
- `/api/profile` - Profile management endpoints

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
  "message": "Registration successful. Please verify your email."
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

### 4. Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Description:** Request a password reset link via email. Generates a password reset token and sends it to the user's email.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Field Validation:**
- `email`: Valid email format (required)

**Success Response (200 OK) - Email Exists:**
```json
{
  "message": "Please check your email for password reset instructions."
}
```

**Error Responses:**

**400 Bad Request - Missing Email:**
```json
{
  "error": "Email required"
}
```

**400 Bad Request - Invalid Email Format:**
```json
{
  "error": "Invalid email format"
}
```

**404 Not Found - Email Not Registered:**
```json
{
  "error": "Please use an email address that is registered with us."
}
```

**500 Internal Server Error:**
```json
{
  "error": "Request failed: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const forgotPassword = async (email) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Show success message
      console.log('Reset link sent:', data.message);
      return { success: true, message: data.message };
    } else {
      // Show error message
      console.error('Request failed:', data.error);
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

const forgotPassword = async (email) => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      email: email
    });
    
    console.log('Reset link sent:', response.data.message);
    return { success: true, message: response.data.message };
  } catch (error) {
    if (error.response) {
      console.error('Request failed:', error.response.data.error);
      return { success: false, error: error.response.data.error };
    } else {
      console.error('Network error:', error.message);
      return { success: false, error: 'Network error occurred' };
    }
  }
};
```

**React Component Example:**
```javascript
import { useState } from 'react';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const result = await forgotPassword(email);
    
    if (result.success) {
      setMessage(result.message);
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
      <button type="submit">Send Reset Link</button>
    </form>
  );
};
```

---

### 5. Reset Password

**Endpoint:** `POST /api/auth/reset-password/<token>`

**Description:** Reset user password using the token received via email from forgot-password request.

**URL Parameters:**
- `token` (string, required): Password reset token from email

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

**Field Validation:**
- `password`: Minimum 8 characters (required)

**Success Response (200 OK):**
```json
{
  "message": "Password reset successfully. You can now login with your new password."
}
```

**Error Responses:**

**400 Bad Request - Missing Password:**
```json
{
  "error": "Password required"
}
```

**400 Bad Request - Password Too Short:**
```json
{
  "error": "Password must be at least 8 characters"
}
```

**400 Bad Request - Invalid Token:**
```json
{
  "error": "Invalid or expired reset token"
}
```

**400 Bad Request - Expired Token:**
```json
{
  "error": "Reset token has expired"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Password reset failed: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const resetPassword = async (token, newPassword) => {
  try {
    const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: newPassword
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Show success message
      console.log('Password reset:', data.message);
      // Redirect to login page
      return { success: true, message: data.message };
    } else {
      // Show error message
      console.error('Reset failed:', data.error);
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

const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
      password: newPassword
    });
    
    console.log('Password reset:', response.data.message);
    return { success: true, message: response.data.message };
  } catch (error) {
    if (error.response) {
      console.error('Reset failed:', error.response.data.error);
      return { success: false, error: error.response.data.error };
    } else {
      console.error('Network error:', error.message);
      return { success: false, error: 'Network error occurred' };
    }
  }
};
```

**React Component Example:**
```javascript
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await resetPassword(token, password);
    
    if (result.success) {
      setMessage(result.message);
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New Password"
        required
        minLength={8}
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm Password"
        required
        minLength={8}
      />
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
      <button type="submit">Reset Password</button>
    </form>
  );
};
```

**React Router Example:**
```javascript
// App.js or Router setup
<Route path="/reset-password/:token" component={ResetPasswordPage} />
```

---

### 6. Logout User

**Endpoint:** `POST /api/auth/logout`

**Description:** Logout user by blacklisting their JWT token. After logout, the token cannot be used for authenticated requests.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{}
```
(Empty body is acceptable, or can be omitted if not strictly required by Flask)

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Success Response - Already Logged Out (200 OK):**
```json
{
  "message": "Already logged out"
}
```

**Error Responses:**

**401 Unauthorized - Missing Token:**
```json
{
  "error": "Token is missing"
}
```

**401 Unauthorized - Invalid Token Format:**
```json
{
  "error": "Invalid token format"
}
```

**401 Unauthorized - Invalid/Expired Token:**
```json
{
  "error": "Token is invalid, expired, or blacklisted"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Logout failed: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const logoutUser = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({}) // Empty body or omit
    });

    const data = await response.json();

    if (response.ok) {
      // Remove token and user data from storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear Authorization header if using axios
      // delete axios.defaults.headers.common['Authorization'];
      
      console.log('Logged out:', data.message);
      return { success: true, message: data.message };
    } else {
      console.error('Logout failed:', data.error);
      // Still clear local storage even on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Network error:', error);
    // Still clear local storage on network error
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: false, error: 'Network error occurred' };
  }
};
```

**Frontend Usage (Axios):**
```javascript
import axios from 'axios';

const logoutUser = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/logout', {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Remove token and user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear Authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    console.log('Logged out:', response.data.message);
    return { success: true, message: response.data.message };
  } catch (error) {
    if (error.response) {
      console.error('Logout failed:', error.response.data.error);
      // Still clear local storage even on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      return { success: false, error: error.response.data.error };
    } else {
      console.error('Network error:', error.message);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      return { success: false, error: 'Network error occurred' };
    }
  }
};
```

**React Hook Example:**
```javascript
import { useNavigate } from 'react-router-dom';

const useLogout = () => {
  const navigate = useNavigate();

  const logout = async () => {
    const result = await logoutUser();
    
    if (result.success) {
      // Redirect to login page
      navigate('/login');
    } else {
      // Still redirect even if API call failed
      // Token is cleared from storage anyway
      navigate('/login');
    }
  };

  return { logout };
};

// Usage in component
const Header = () => {
  const { logout } = useLogout();

  return (
    <header>
      <button onClick={logout}>Logout</button>
    </header>
  );
};
```

**Axios Interceptor for Auto-Logout:**
```javascript
// Add response interceptor to handle 401 (unauthorized) errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired, logout user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Profile Endpoints

### 1. Get Current User Profile

**Endpoint:** `GET /api/profile/me`

**Description:** Get the current authenticated user's complete profile including images, tags, and location.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```
None required
```

**Success Response (200 OK):**
```json
{
  "id": 16,
  "username": "johndoe",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Love traveling and coding",
  "gender": "Male",
  "sexual_preference": "Straight",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "age": 30,
  "date_of_birth": "1995-05-15",
  "fame_rating": 0.0,
  "is_verified": true,
  "last_online": "2025-11-24T14:18:48.233026",
  "created_at": "2025-11-24T10:56:22.272273",
  "images": [
    {
      "id": 1,
      "file_path": "/static/uploads/user_16/image1.jpg",
      "created_at": "2025-11-24T11:00:00"
    }
  ],
  "tags": [
    {
      "id": 1,
      "tag_name": "#vegan"
    },
    {
      "id": 2,
      "tag_name": "#geek"
    }
  ]
}
```

**Error Responses:**

**401 Unauthorized - Missing/Invalid Token:**
```json
{
  "error": "Token is missing"
}
```
or
```json
{
  "error": "Token is invalid, expired, or blacklisted"
}
```

**404 Not Found:**
```json
{
  "error": "User not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to get profile: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const getProfile = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('http://localhost:5000/api/profile/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Profile:', data);
      return { success: true, profile: data };
    } else {
      console.error('Failed to get profile:', data.error);
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

const getProfile = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/profile/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return { success: true, profile: response.data };
  } catch (error) {
    if (error.response) {
      return { success: false, error: error.response.data.error };
    } else {
      return { success: false, error: 'Network error occurred' };
    }
  }
};
```

**React Hook Example:**
```javascript
import { useState, useEffect } from 'react';

const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const result = await getProfile();
      if (result.success) {
        setProfile(result.profile);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  return { profile, loading, error };
};
```

---

### 2. Update Profile

**Endpoint:** `PUT /api/profile/update`

**Description:** Update user profile fields. Only provided fields will be updated.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "newemail@example.com",
  "bio": "Updated bio",
  "gender": "Male",
  "sexual_preference": "Straight",
  "date_of_birth": "1995-05-15"
}
```

**Field Validation:**
- `first_name`: String (optional)
- `last_name`: String (optional)
- `email`: Valid email format, unique (optional)
- `bio`: Text (optional)
- `gender`: Must be one of: `Male`, `Female` (optional)
- `sexual_preference`: Must be one of: `Straight`, `Gay`, `Bisexual` (optional)
- `date_of_birth`: Format `YYYY-MM-DD`, user must be 18+ years old (optional)

**Success Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "updated_fields": ["first_name", "last_name", "bio", "gender", "sexual_preference", "date_of_birth"]
}
```

**Error Responses:**

**400 Bad Request - No Data:**
```json
{
  "error": "No data provided"
}
```

**400 Bad Request - Invalid Email Format:**
```json
{
  "error": "Invalid email format"
}
```

**400 Bad Request - Invalid Gender:**
```json
{
  "error": "Invalid gender. Must be one of: Male, Female"
}
```

**400 Bad Request - Invalid Sexual Preference:**
```json
{
  "error": "Invalid sexual preference. Must be one of: Straight, Gay, Bisexual"
}
```

**400 Bad Request - Invalid Date Format:**
```json
{
  "error": "Invalid date format. Use YYYY-MM-DD"
}
```

**400 Bad Request - Age Restriction:**
```json
{
  "error": "You must be at least 18 years old"
}
```

**409 Conflict - Email Already in Use:**
```json
{
  "error": "Email already in use"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to update profile: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const updateProfile = async (profileData) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('http://localhost:5000/api/profile/update', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Profile updated:', data.message);
      return { success: true, message: data.message };
    } else {
      console.error('Update failed:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: 'Network error occurred' };
  }
};
```

**React Component Example:**
```javascript
import { useState } from 'react';

const ProfileEditForm = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    gender: '',
    sexual_preference: '',
    date_of_birth: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const result = await updateProfile(formData);
    
    if (result.success) {
      setMessage(result.message);
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.first_name}
        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
        placeholder="First Name"
      />
      <input
        type="text"
        value={formData.last_name}
        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
        placeholder="Last Name"
      />
      <textarea
        value={formData.bio}
        onChange={(e) => setFormData({...formData, bio: e.target.value})}
        placeholder="Bio"
      />
      <select
        value={formData.gender}
        onChange={(e) => setFormData({...formData, gender: e.target.value})}
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
      <select
        value={formData.sexual_preference}
        onChange={(e) => setFormData({...formData, sexual_preference: e.target.value})}
      >
        <option value="">Select Preference</option>
        <option value="Straight">Straight</option>
        <option value="Gay">Gay</option>
        <option value="Bisexual">Bisexual</option>
      </select>
      <input
        type="date"
        value={formData.date_of_birth}
        onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
      />
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
      <button type="submit">Update Profile</button>
    </form>
  );
};
```

---

### 3. Update Location

**Endpoint:** `PUT /api/profile/location`

**Description:** Update user GPS location. If GPS coordinates are not provided, automatically detects location from IP address.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body - With GPS:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Request Body - Without GPS (IP Geolocation):**
```json
{}
```
or omit body entirely

**Field Validation:**
- `latitude`: Number between -90 and 90 (optional)
- `longitude`: Number between -180 and 180 (optional)
- If both are omitted, IP geolocation will be used

**Success Response (200 OK) - GPS:**
```json
{
  "message": "Location updated successfully",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "source": "gps"
  }
}
```

**Success Response (200 OK) - IP Geolocation:**
```json
{
  "message": "Location updated successfully",
  "location": {
    "latitude": 40.1234,
    "longitude": -74.5678,
    "source": "ip"
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid Latitude:**
```json
{
  "error": "Invalid latitude. Must be between -90 and 90"
}
```

**400 Bad Request - Invalid Longitude:**
```json
{
  "error": "Invalid longitude. Must be between -180 and 180"
}
```

**400 Bad Request - Invalid Format:**
```json
{
  "error": "Invalid latitude/longitude format"
}
```

**400 Bad Request - IP Geolocation Failed:**
```json
{
  "error": "Could not determine location from IP. Please provide GPS coordinates.",
  "ip": "172.18.0.1"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to update location: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const updateLocation = async (latitude, longitude) => {
  const token = localStorage.getItem('token');
  
  try {
    const body = {};
    if (latitude !== null && longitude !== null) {
      body.latitude = latitude;
      body.longitude = longitude;
    }
    
    const response = await fetch('http://localhost:5000/api/profile/location', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Location updated:', data.message);
      return { success: true, location: data.location };
    } else {
      console.error('Update failed:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: 'Network error occurred' };
  }
};
```

**React Component Example - GPS:**
```javascript
import { useState } from 'react';

const LocationUpdate = () => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleGPSUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const result = await updateLocation(parseFloat(latitude), parseFloat(longitude));
    
    if (result.success) {
      setMessage(`Location updated: ${result.location.latitude}, ${result.location.longitude}`);
    } else {
      setError(result.error);
    }
  };

  const handleAutoDetect = async () => {
    setError('');
    setMessage('');

    const result = await updateLocation(null, null);
    
    if (result.success) {
      setMessage(`Location detected: ${result.location.latitude}, ${result.location.longitude}`);
    } else {
      setError(result.error);
    }
  };

  return (
    <div>
      <form onSubmit={handleGPSUpdate}>
        <input
          type="number"
          step="any"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="Latitude (-90 to 90)"
          min="-90"
          max="90"
        />
        <input
          type="number"
          step="any"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="Longitude (-180 to 180)"
          min="-180"
          max="180"
        />
        <button type="submit">Update with GPS</button>
      </form>
      <button onClick={handleAutoDetect}>Auto-detect from IP</button>
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

**Browser Geolocation API Example:**
```javascript
const updateLocationFromBrowser = async () => {
  if (!navigator.geolocation) {
    return { success: false, error: 'Geolocation not supported by browser' };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const result = await updateLocation(latitude, longitude);
        resolve(result);
      },
      async (error) => {
        // GPS denied, try IP geolocation
        console.log('GPS denied, using IP geolocation');
        const result = await updateLocation(null, null);
        resolve(result);
      }
    );
  });
};
```

---

### 4. Upload Profile Images

**Endpoint:** `POST /api/profile/upload`

**Description:** Upload one or multiple profile images. Maximum 5 images per user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Request Body:**
- Form data with key `file` (can be single or multiple files)

**Field Validation:**
- **Extensions:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **MIME Types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- **Max Size:** 5MB per file
- **Max Total:** 5 images per user

**Success Response (201 Created):**
```json
{
  "message": "Successfully uploaded 2 image(s)",
  "uploaded_images": [
    {
      "id": 123,
      "file_path": "/static/uploads/user_16/uuid-filename.jpg",
      "filename": "original-name.jpg"
    },
    {
      "id": 124,
      "file_path": "/static/uploads/user_16/uuid-filename2.jpg",
      "filename": "original-name2.jpg"
    }
  ]
}
```

**Partial Success Response (201 Created):**
```json
{
  "message": "Successfully uploaded 1 image(s), 1 failed",
  "uploaded_images": [
    {
      "id": 123,
      "file_path": "/static/uploads/user_16/uuid-filename.jpg",
      "filename": "valid-image.jpg"
    }
  ],
  "errors": [
    "File 2 (invalid-file.txt): Invalid file type"
  ]
}
```

**Error Responses:**

**400 Bad Request - No File:**
```json
{
  "error": "No file provided"
}
```

**400 Bad Request - Invalid File Type:**
```json
{
  "error": "Invalid file type. Allowed types: jpg, jpeg, png, gif, webp"
}
```

**400 Bad Request - File Too Large:**
```json
{
  "error": "File too large. Maximum size: 5MB"
}
```

**400 Bad Request - Maximum Images Reached:**
```json
{
  "error": "Maximum 5 images allowed. Current: 5, Trying to add: 1"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to upload image: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const uploadImages = async (files) => {
  const token = localStorage.getItem('token');
  
  try {
    const formData = new FormData();
    
    // Add multiple files
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }
    
    const response = await fetch('http://localhost:5000/api/profile/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Don't set Content-Type for FormData, browser sets it automatically
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Images uploaded:', data.message);
      return { success: true, images: data.uploaded_images };
    } else {
      console.error('Upload failed:', data.error);
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

const uploadImages = async (files) => {
  try {
    const formData = new FormData();
    
    // Add multiple files
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }
    
    const response = await axios.post('http://localhost:5000/api/profile/upload', formData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return { success: true, images: response.data.uploaded_images };
  } catch (error) {
    if (error.response) {
      return { success: false, error: error.response.data.error };
    } else {
      return { success: false, error: 'Network error occurred' };
    }
  }
};
```

**React Component Example:**
```javascript
import { useState } from 'react';

const ImageUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    
    // Validate file sizes
    const invalidFiles = files.filter(f => f.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError('Some files are too large. Maximum size: 5MB');
      return;
    }
    
    setSelectedFiles(files);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    const result = await uploadImages(selectedFiles);
    
    if (result.success) {
      setMessage(`Successfully uploaded ${result.images.length} image(s)`);
      setSelectedFiles([]);
      // Refresh profile images
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.webp"
        multiple
        onChange={handleFileSelect}
      />
      <p>Selected: {selectedFiles.length} file(s)</p>
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={selectedFiles.length === 0}>
        Upload Images
      </button>
    </form>
  );
};
```

---

### 5. Delete Profile Image

**Endpoint:** `DELETE /api/profile/images/<image_id>`

**Description:** Delete a profile image by ID. Verifies ownership before deletion.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `image_id` (integer, required): Image ID to delete (obtain from GET /api/profile/me)

**Success Response (200 OK):**
```json
{
  "message": "Image deleted successfully",
  "deleted_image_id": 123
}
```

**Error Responses:**

**401 Unauthorized - Missing/Invalid Token:**
```json
{
  "error": "Token is missing"
}
```

**404 Not Found - Image Not Found:**
```json
{
  "error": "Image not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to delete image: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const deleteImage = async (imageId) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`http://localhost:5000/api/profile/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Image deleted:', data.message);
      return { success: true, deletedId: data.deleted_image_id };
    } else {
      console.error('Delete failed:', data.error);
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

const deleteImage = async (imageId) => {
  try {
    const response = await axios.delete(`http://localhost:5000/api/profile/images/${imageId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return { success: true, deletedId: response.data.deleted_image_id };
  } catch (error) {
    if (error.response) {
      return { success: false, error: error.response.data.error };
    } else {
      return { success: false, error: 'Network error occurred' };
    }
  }
};
```

**React Component Example:**
```javascript
import { useState } from 'react';

const ImageGallery = ({ images, onImageDeleted }) => {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    setDeleting(imageId);
    const result = await deleteImage(imageId);
    setDeleting(null);
    
    if (result.success) {
      // Remove image from state or refresh profile
      onImageDeleted(imageId);
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="image-gallery">
      {images.map(image => (
        <div key={image.id} className="image-item">
          <img src={image.file_path} alt="Profile" />
          <button 
            onClick={() => handleDelete(image.id)}
            disabled={deleting === image.id}
          >
            {deleting === image.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

### 6. Add Tags to Profile

**Endpoint:** `POST /api/tags`

**Description:** Add tags/interests to user profile. Tags are reusable across users.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "tags": ["#vegan", "#geek", "#travel", "photography"]
}
```

**Field Validation:**
- `tags`: Array of strings (required)
- Tags are automatically normalized:
  - `#` prefix added if missing
  - Converted to lowercase
  - Maximum length: 50 characters
  - Duplicates are removed

**Success Response (201 Created):**
```json
{
  "message": "Successfully added 3 tag(s)",
  "added_tags": [
    {
      "id": 1,
      "tag_name": "#vegan"
    },
    {
      "id": 2,
      "tag_name": "#geek"
    },
    {
      "id": 3,
      "tag_name": "#travel"
    }
  ]
}
```

**Success Response - With Skipped Tags (201 Created):**
```json
{
  "message": "Successfully added 2 tag(s), 1 already exist",
  "added_tags": [
    {
      "id": 2,
      "tag_name": "#geek"
    },
    {
      "id": 3,
      "tag_name": "#travel"
    }
  ],
  "skipped_tags": ["#vegan"]
}
```

**Error Responses:**

**400 Bad Request - Missing Tags:**
```json
{
  "error": "Tags array is required"
}
```

**400 Bad Request - Invalid Format:**
```json
{
  "error": "Tags must be an array"
}
```

**400 Bad Request - Empty Array:**
```json
{
  "error": "Tags array cannot be empty"
}
```

**400 Bad Request - Tag Too Long:**
```json
{
  "error": "Tag \"#verylongtagname...\" exceeds maximum length of 50 characters"
}
```

**401 Unauthorized:**
```json
{
  "error": "Token is missing"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to add tags: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const addTags = async (tags) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('http://localhost:5000/api/tags', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tags })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Tags added:', data.message);
      return { success: true, addedTags: data.added_tags, skippedTags: data.skipped_tags };
    } else {
      console.error('Add tags failed:', data.error);
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

const addTags = async (tags) => {
  try {
    const response = await axios.post('http://localhost:5000/api/tags', 
      { tags },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    return { 
      success: true, 
      addedTags: response.data.added_tags,
      skippedTags: response.data.skipped_tags 
    };
  } catch (error) {
    if (error.response) {
      return { success: false, error: error.response.data.error };
    } else {
      return { success: false, error: 'Network error occurred' };
    }
  }
};
```

**React Component Example:**
```javascript
import { useState } from 'react';

const TagsManager = () => {
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t);
    setTags([...tags, ...newTags]);
    setTagInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (tags.length === 0) {
      setError('Please add at least one tag');
      return;
    }

    const result = await addTags(tags);
    
    if (result.success) {
      setMessage(`Added ${result.addedTags.length} tag(s)`);
      if (result.skippedTags && result.skippedTags.length > 0) {
        setMessage(prev => prev + ` (${result.skippedTags.length} already existed)`);
      }
      setTags([]);
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        placeholder="Enter tags (comma-separated)"
      />
      <button type="button" onClick={handleAddTag}>Add to List</button>
      
      <div className="tags-preview">
        {tags.map((tag, index) => (
          <span key={index} className="tag">
            {tag}
            <button onClick={() => setTags(tags.filter((_, i) => i !== index))}>×</button>
          </span>
        ))}
      </div>
      
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={tags.length === 0}>
        Save Tags
      </button>
    </form>
  );
};
```

---

### 7. Remove Tag from Profile

**Endpoint:** `DELETE /api/tags/<tag_id>`

**Description:** Remove a tag from user profile. Does not delete the tag from the tags table (tags are reusable).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `tag_id` (integer, required): Tag ID to remove (obtain from GET /api/profile/me)

**Success Response (200 OK):**
```json
{
  "message": "Tag removed successfully",
  "removed_tag": {
    "id": 5,
    "tag_name": "#vegan"
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "error": "Token is missing"
}
```

**404 Not Found:**
```json
{
  "error": "Tag not found in your profile"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to remove tag: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const removeTag = async (tagId) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`http://localhost:5000/api/tags/${tagId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Tag removed:', data.message);
      return { success: true, removedTag: data.removed_tag };
    } else {
      console.error('Remove tag failed:', data.error);
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

const removeTag = async (tagId) => {
  try {
    const response = await axios.delete(`http://localhost:5000/api/tags/${tagId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return { success: true, removedTag: response.data.removed_tag };
  } catch (error) {
    if (error.response) {
      return { success: false, error: error.response.data.error };
    } else {
      return { success: false, error: 'Network error occurred' };
    }
  }
};
```

**React Component Example:**
```javascript
const TagsList = ({ tags, onTagRemoved }) => {
  const [removing, setRemoving] = useState(null);

  const handleRemove = async (tagId) => {
    setRemoving(tagId);
    const result = await removeTag(tagId);
    setRemoving(null);
    
    if (result.success) {
      onTagRemoved(tagId);
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="tags-list">
      {tags.map(tag => (
        <span key={tag.id} className="tag">
          {tag.tag_name}
          <button 
            onClick={() => handleRemove(tag.id)}
            disabled={removing === tag.id}
          >
            {removing === tag.id ? '...' : '×'}
          </button>
        </span>
      ))}
    </div>
  );
};
```

---

## Tags Endpoints

### 1. Get All Tags

**Endpoint:** `GET /api/tags`

**Description:** Get all available tags in the system. Supports optional search/filtering by tag name.

**Headers:**
```
None required (public endpoint)
```

**Query Parameters:**
- `q` (string, optional): Search query to filter tags by name (case-insensitive, partial match)

**Success Response (200 OK) - All Tags:**
```json
{
  "tags": [
    {
      "id": 1,
      "tag_name": "#geek",
      "created_at": "2025-11-24T10:00:00"
    },
    {
      "id": 2,
      "tag_name": "#travel",
      "created_at": "2025-11-24T11:00:00"
    },
    {
      "id": 3,
      "tag_name": "#vegan",
      "created_at": "2025-11-24T12:00:00"
    }
  ],
  "count": 3
}
```

**Success Response (200 OK) - With Search:**
```json
{
  "tags": [
    {
      "id": 1,
      "tag_name": "#geek",
      "created_at": "2025-11-24T10:00:00"
    }
  ],
  "count": 1
}
```

**Success Response (200 OK) - No Tags:**
```json
{
  "tags": [],
  "count": 0
}
```

**Error Responses:**

**500 Internal Server Error:**
```json
{
  "error": "Failed to get tags: [error details]"
}
```

**Frontend Usage (JavaScript/React):**
```javascript
const getTags = async (searchQuery = '') => {
  try {
    const url = searchQuery 
      ? `http://localhost:5000/api/tags?q=${encodeURIComponent(searchQuery)}`
      : 'http://localhost:5000/api/tags';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, tags: data.tags, count: data.count };
    } else {
      console.error('Failed to get tags:', data.error);
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

const getTags = async (searchQuery = '') => {
  try {
    const params = searchQuery ? { q: searchQuery } : {};
    const response = await axios.get('http://localhost:5000/api/tags', { params });
    
    return { success: true, tags: response.data.tags, count: response.data.count };
  } catch (error) {
    if (error.response) {
      return { success: false, error: error.response.data.error };
    } else {
      return { success: false, error: 'Network error occurred' };
    }
  }
};
```

**React Component Example - Tag Search/Filter:**
```javascript
import { useState, useEffect } from 'react';

const TagSelector = ({ onTagSelect }) => {
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      const result = await getTags(searchQuery);
      setLoading(false);
      
      if (result.success) {
        setTags(result.tags);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchTags();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="tag-selector">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search tags..."
      />
      
      {loading && <div>Loading...</div>}
      
      <div className="tags-list">
        {tags.map(tag => (
          <button
            key={tag.id}
            onClick={() => onTagSelect(tag)}
            className="tag-button"
          >
            {tag.tag_name}
          </button>
        ))}
      </div>
      
      {tags.length === 0 && !loading && (
        <div>No tags found</div>
      )}
    </div>
  );
};
```

**React Hook Example:**
```javascript
import { useState, useEffect } from 'react';

const useTags = (searchQuery = '') => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      setError(null);
      
      const result = await getTags(searchQuery);
      
      if (result.success) {
        setTags(result.tags);
      } else {
        setError(result.error);
      }
      
      setLoading(false);
    };

    fetchTags();
  }, [searchQuery]);

  return { tags, loading, error };
};
```

---

## Error Handling Guide

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid input/validation error
- **401 Unauthorized**: Authentication required or invalid credentials
- **403 Forbidden**: Account not verified or access denied
- **404 Not Found**: Resource not found (e.g., email not registered)
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

**Forgot Password:**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Reset Password:**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password/YOUR_TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "password": "newpassword123"
  }'
```

**Logout:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Get Profile:**
```bash
curl -X GET http://localhost:5000/api/profile/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Update Profile:**
```bash
curl -X PUT http://localhost:5000/api/profile/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "bio": "Updated bio",
    "gender": "Male",
    "sexual_preference": "Straight",
    "date_of_birth": "1995-05-15"
  }'
```

**Update Location (GPS):**
```bash
curl -X PUT http://localhost:5000/api/profile/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

**Update Location (IP Geolocation):**
```bash
curl -X PUT http://localhost:5000/api/profile/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{}'
```

**Upload Profile Images:**
```bash
curl -X POST http://localhost:5000/api/profile/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "file=@/path/to/image1.jpg" \
  -F "file=@/path/to/image2.png"
```

**Delete Profile Image:**
```bash
curl -X DELETE http://localhost:5000/api/profile/images/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Add Tags:**
```bash
curl -X POST http://localhost:5000/api/tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "tags": ["#vegan", "#geek", "#travel"]
  }'
```

**Remove Tag:**
```bash
curl -X DELETE http://localhost:5000/api/tags/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Get Tags:**
```bash
curl -X GET http://localhost:5000/api/tags
```

**Search Tags:**
```bash
curl -X GET "http://localhost:5000/api/tags?q=vegan"
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

**Forgot Password Request:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/forgot-password`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "user@example.com"
}
```

**Reset Password Request:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/reset-password/{token}`
- Headers: `Content-Type: application/json`
- Replace `{token}` with actual token from password reset email
- Body (raw JSON):
```json
{
  "password": "newpassword123"
}
```

**Logout Request:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/logout`
- Headers: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
- Replace `{token}` with JWT token from login response
- Body: None required (empty JSON `{}` or omit)

**Get Profile Request:**
- Method: `GET`
- URL: `http://localhost:5000/api/profile/me`
- Headers: `Authorization: Bearer {token}`
- Body: None required

**Update Profile Request:**
- Method: `PUT`
- URL: `http://localhost:5000/api/profile/update`
- Headers: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
- Body (raw JSON):
```json
{
  "bio": "Updated bio",
  "gender": "Male",
  "sexual_preference": "Straight",
  "date_of_birth": "1995-05-15"
}
```

**Update Location Request (GPS):**
- Method: `PUT`
- URL: `http://localhost:5000/api/profile/location`
- Headers: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
- Body (raw JSON):
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Update Location Request (IP Geolocation):**
- Method: `PUT`
- URL: `http://localhost:5000/api/profile/location`
- Headers: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
- Body: Empty JSON `{}` or omit

**Upload Profile Images Request:**
- Method: `POST`
- URL: `http://localhost:5000/api/profile/upload`
- Headers: `Authorization: Bearer {token}`
- Body (form-data):
  - Key: `file` (File type)
  - Value: Select image file(s) - can select multiple files
- Note: In Postman, you can add multiple `file` keys to upload multiple images at once

**Delete Profile Image Request:**
- Method: `DELETE`
- URL: `http://localhost:5000/api/profile/images/{image_id}`
- Headers: `Authorization: Bearer {token}`
- Replace `{image_id}` with actual image ID (integer)
- Body: None required

**Add Tags Request:**
- Method: `POST`
- URL: `http://localhost:5000/api/tags`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
- Body (raw JSON):
```json
{
  "tags": ["#vegan", "#geek", "#travel"]
}
```

**Remove Tag Request:**
- Method: `DELETE`
- URL: `http://localhost:5000/api/tags/{tag_id}`
- Headers: `Authorization: Bearer {token}`
- Replace `{tag_id}` with actual tag ID (integer)
- Body: None required

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
   - Password reset tokens expire after 1 hour
   - JWT tokens expire after 24 hours (configurable via `JWT_EXPIRATION_HOURS`)

4. **Password Requirements:** Minimum 8 characters. Cannot contain common dictionary words.

5. **Authentication:** After login, include JWT token in `Authorization: Bearer <token>` header for protected routes.

6. **Last Online:** User's `last_online` timestamp is updated on successful login.

7. **Password Reset:** 
   - Only one active password reset token per user (old tokens are deleted when new one is created)
   - Reset link expires after 1 hour
   - Email must be registered to receive reset link
   - Token is deleted after successful password reset
   - Use reset-password endpoint with token from email to complete password change

8. **Logout & Token Blacklisting:**
   - Logout endpoint blacklists the JWT token in the database
   - Blacklisted tokens cannot be used for authenticated requests
   - Tokens are automatically cleaned up after expiration
   - Frontend should remove token from localStorage on logout
   - Use `Authorization: Bearer <token>` header for logout request

9. **Profile Management:**
   - Age is automatically calculated from `date_of_birth` and stored in database
   - If age is missing but `date_of_birth` exists, it will be calculated on profile fetch
   - Profile update allows partial updates (only provided fields are updated)
   - Email update does not require re-verification (per matcha.md requirements)
   - Gender must be one of: `Male`, `Female`
   - Sexual preference must be one of: `Straight`, `Gay`, `Bisexual`

10. **Location Management:**
    - Location can be updated via GPS coordinates or IP geolocation
    - If GPS coordinates provided, they are stored directly
    - If GPS not provided (empty body), IP geolocation is attempted
    - IP geolocation uses `ip-api.com` service (free, no API key required)
    - For testing through Docker, client can send public IP in `X-Client-Public-IP` header
    - Location is stored as `latitude` and `longitude` in users table

11. **Image Management:**
    - Users can upload up to 5 images maximum
    - Supported formats: JPG, JPEG, PNG, GIF, WEBP
    - Maximum file size: 5MB per image
    - Images are stored with UUID filenames in `static/uploads/user_{user_id}/` directory
    - Delete images before uploading new ones if limit is reached
    - Images are permanently deleted from both database and disk when removed

12. **Tags Management:**
    - Tags are reusable across users (stored in shared `tags` table)
    - Tags are automatically normalized (lowercase, `#` prefix added)
    - Maximum tag length: 50 characters
    - Removing a tag from profile does not delete it from the system (other users may still have it)
    - Tags are linked to users via `user_tags` table (many-to-many relationship)
    - Duplicate tags are automatically skipped

13. **Password Requirements:**
    - Minimum 8 characters
    - Cannot contain common dictionary words (50 most common passwords/English words)
    - Dictionary validation applies to both registration and password reset

14. **Base URL:** Change `localhost:5000` to your production domain when deploying.

