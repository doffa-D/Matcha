/**
 * Authentication API
 * 
 * Endpoints:
 * - POST /auth/register     - Create new account
 * - GET  /auth/verify/:token - Verify email
 * - POST /auth/login        - Login
 * - POST /auth/logout       - Logout (requires token)
 * - POST /auth/forgot-password - Request password reset
 * - POST /auth/reset-password/:token - Reset password
 */

import api from '@/lib/api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MessageResponse,
} from './types';

// =============================================================================
// REGISTER - Create new account
// =============================================================================
/**
 * Register a new user account
 * 
 * @example
 * const response = await register({
 *   email: 'user@example.com',
 *   username: 'johndoe',
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   password: 'securePassword123'
 * });
 */
export const register = (data: RegisterRequest) =>
  api.post<MessageResponse>('/auth/register', data);

// =============================================================================
// VERIFY EMAIL - Verify account via email token
// =============================================================================
/**
 * Verify user email with token from email link
 * 
 * @param token - Verification token from email
 * @example
 * const response = await verifyEmail('abc123token');
 */
export const verifyEmail = (token: string) =>
  api.get<MessageResponse>(`/auth/verify/${token}`);

// =============================================================================
// LOGIN - Authenticate user
// =============================================================================
/**
 * Login with username and password
 * Returns JWT token to store in localStorage
 * 
 * @example
 * const { data } = await login({ username: 'johndoe', password: 'secret' });
 * localStorage.setItem('token', data.token);
 */
export const login = (data: LoginRequest) =>
  api.post<LoginResponse>('/auth/login', data);

// =============================================================================
// LOGOUT - Invalidate token
// =============================================================================
/**
 * Logout current user (blacklists JWT token)
 * Call this then remove token from localStorage
 * 
 * @example
 * await logout();
 * localStorage.removeItem('token');
 */
export const logout = () =>
  api.post<MessageResponse>('/auth/logout');

// =============================================================================
// FORGOT PASSWORD - Request reset email
// =============================================================================
/**
 * Request password reset email
 * 
 * @example
 * await forgotPassword({ email: 'user@example.com' });
 */
export const forgotPassword = (data: ForgotPasswordRequest) =>
  api.post<MessageResponse>('/auth/forgot-password', data);

// =============================================================================
// RESET PASSWORD - Set new password
// =============================================================================
/**
 * Reset password using token from email
 * 
 * @param token - Reset token from email
 * @param data - New password
 * @example
 * await resetPassword('resetToken123', { password: 'newSecurePassword' });
 */
export const resetPassword = (token: string, data: ResetPasswordRequest) =>
  api.post<MessageResponse>(`/auth/reset-password/${token}`, data);

