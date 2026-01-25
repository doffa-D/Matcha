import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

import Button from "@/components/ui/button";
import { useAuth } from "@/context";

export const Route = createFileRoute("/login/")({
  component: LoginPage,
});

interface FormData {
  username: string;
  password: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username) {
      newErrors.username = "Username is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
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
      // Call login via AuthProvider
      await login(formData);

      // Navigate to discover page on success
      navigate({ to: "/discover" });
    } catch (error: any) {
      // Handle API errors
      const errorMessage =
        error?.data?.error ||
        error?.message ||
        "Invalid username or password. Please try again.";
      setErrors({
        general: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Left side - Decorative */}
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
            <img src="/logo.svg" alt="Matcha" className="w-20 h-20" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Welcome back!
          </h2>
          <p className="text-neutral-600">
            Your matches are waiting. Sign in to continue your journey to
            finding meaningful connections.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
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
            Sign in to your account
          </h1>
          <p className="text-neutral-600 mb-8">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-matcha font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha transition-colors ${
                    errors.username
                      ? "border-red-300 bg-red-50/50"
                      : "border-neutral-200"
                  }`}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-neutral-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-matcha font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-matcha focus:ring-matcha"
              />
              <span className="text-sm text-neutral-700">Remember me</span>
            </label>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-semibold gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-neutral-50 text-neutral-500">
                or continue with
              </span>
            </div>
          </div>

          {/* Social login buttons (placeholder) */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
