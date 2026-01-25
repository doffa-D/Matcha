import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";

import Button from "@/components/ui/button";
import {
  validatePassword,
  getStrengthColor,
  getStrengthWidth,
} from "@/lib/password-validator";
import { register } from "@/api/auth";

export const Route = createFileRoute("/register/")({
  component: RegisterPage,
});

interface FormData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordValidation = validatePassword(formData.password);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    // First name validation
    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    // Last name validation
    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Call registration API with properly formatted data
      await register({
        email: formData.email,
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        password: formData.password,
      });

      setIsSuccess(true);
    } catch (error: any) {
      // Handle API errors
      const errorMessage =
        error?.data?.error ||
        error?.message ||
        "Registration failed. Please try again.";
      setErrors({
        general: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-matcha-light rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-matcha" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">
            Check your email
          </h1>
          <p className="text-neutral-600 mb-6">
            We've sent a verification link to{" "}
            <span className="font-semibold text-neutral-900">
              {formData.email}
            </span>
            . Click the link to verify your account and start matching!
          </p>
          <p className="text-sm text-neutral-500 mb-8">
            Didn't receive the email? Check your spam folder or{" "}
            <button className="text-matcha font-semibold hover:underline">
              resend verification email
            </button>
          </p>
          <Link to="/login">
            <Button variant="secondary" className="w-full h-12">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src="/logo.svg" alt="Logo" className="h-8" />
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              Matcha
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Create your account
          </h1>
          <p className="text-neutral-600 mb-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-matcha font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha transition-colors ${
                      errors.firstName
                        ? "border-red-300 bg-red-50/50"
                        : "border-neutral-200"
                    }`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha transition-colors ${
                    errors.lastName
                      ? "border-red-300 bg-red-50/50"
                      : "border-neutral-200"
                  }`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    handleChange("username", e.target.value.toLowerCase())
                  }
                  className={`w-full pl-8 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha transition-colors ${
                    errors.username
                      ? "border-red-300 bg-red-50/50"
                      : "border-neutral-200"
                  }`}
                  placeholder="johndoe"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha transition-colors ${
                    errors.email
                      ? "border-red-300 bg-red-50/50"
                      : "border-neutral-200"
                  }`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha transition-colors ${
                    errors.password
                      ? "border-red-300 bg-red-50/50"
                      : "border-neutral-200"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-neutral-500">
                      Password strength
                    </span>
                    <span
                      className={`text-xs font-medium capitalize ${
                        passwordValidation.strength === "strong"
                          ? "text-matcha"
                          : passwordValidation.strength === "good"
                            ? "text-yellow-600"
                            : passwordValidation.strength === "fair"
                              ? "text-orange-600"
                              : "text-red-600"
                      }`}
                    >
                      {passwordValidation.strength}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor(passwordValidation.strength)} ${getStrengthWidth(passwordValidation.strength)}`}
                    />
                  </div>
                </div>
              )}

              {/* Password requirements */}
              {formData.password && (
                <div className="mt-3 space-y-1">
                  {[
                    {
                      check: formData.password.length >= 8,
                      text: "At least 8 characters",
                    },
                    {
                      check: /[A-Z]/.test(formData.password),
                      text: "One uppercase letter",
                    },
                    {
                      check: /[a-z]/.test(formData.password),
                      text: "One lowercase letter",
                    },
                    {
                      check: /[0-9]/.test(formData.password),
                      text: "One number",
                    },
                    {
                      check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                        formData.password,
                      ),
                      text: "One special character",
                    },
                  ].map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {req.check ? (
                        <Check className="w-3.5 h-3.5 text-matcha" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                      <span
                        className={
                          req.check ? "text-matcha" : "text-neutral-500"
                        }
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha transition-colors ${
                    errors.confirmPassword
                      ? "border-red-300 bg-red-50/50"
                      : "border-neutral-200"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <p className="mt-1 text-xs text-matcha flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Passwords match
                  </p>
                )}
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-semibold gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>

            <p className="text-xs text-neutral-500 text-center">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-matcha hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-matcha hover:underline">
                Privacy Policy
              </a>
            </p>
          </form>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex lg:flex-1 relative items-center justify-center p-12 overflow-hidden">
        {/* Geometric background pattern */}
        <div
          className="absolute inset-0"
          style={
            {
              "--s": "37px",
              background:
                `conic-gradient(from 60deg at 56.25% calc(425% / 6), #0000, #7CB34210 0.5deg 119.5deg, #0000 120deg), ` +
                `conic-gradient(from 60deg at 56.25% calc(425% / 6), #0000, #7CB34210 0.5deg 119.5deg, #0000 120deg) var(--s) calc(1.73 * var(--s)), ` +
                `conic-gradient(from 180deg at 43.75% calc(425% / 6), #0000, #7CB34210 0.5deg 119.5deg, #0000 120deg), ` +
                `conic-gradient(from 180deg at 43.75% calc(425% / 6), #0000, #7CB34210 0.5deg 119.5deg, #0000 120deg) var(--s) calc(1.73 * var(--s)), ` +
                `conic-gradient(from -60deg at 50% calc(175% / 12), #0000, #7CB34210 0.5deg 119.5deg, #0000 120deg) var(--s) 0, ` +
                `conic-gradient(from -60deg at 50% calc(175% / 12), #0000, #7CB34210 0.5deg 119.5deg, #0000 120deg) 0 calc(1.73 * var(--s)) #E8F5E9`,
              backgroundSize: "calc(2 * var(--s)) calc(3.46 * var(--s))",
            } as React.CSSProperties
          }
        />
        <div className="relative max-w-md text-center z-10">
          <div className="w-32 h-32 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <img src="/logo.svg" alt="Matcha" className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Find your perfect blend
          </h2>
          <p className="text-neutral-600">
            Join thousands of singles who have found meaningful connections on
            Matcha. Your journey to authentic dating starts here.
          </p>
        </div>
      </div>
    </div>
  );
}
