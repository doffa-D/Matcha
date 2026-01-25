import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  KeyRound,
} from "lucide-react";

import Button from "@/components/ui/button";
import {
  validatePassword,
  getStrengthColor,
  getStrengthWidth,
} from "@/lib/password-validator";
import { resetPassword } from "@/api/auth";

export const Route = createFileRoute("/reset-password/$token/")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordValidation = validatePassword(password);

  const validateForm = (): boolean => {
    if (!password) {
      setError("Password is required");
      return false;
    }

    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return false;
    }

    if (!confirmPassword) {
      setError("Please confirm your password");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError("");

    try {
      await resetPassword(token, { password });
      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate({ to: "/login" }), 3000);
    } catch (error: any) {
      const errorMessage =
        error?.data?.error ||
        error?.message ||
        "Failed to reset password. The link may be invalid or expired.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
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
        <div className="relative z-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-white/80 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-matcha" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">
            Password reset successful!
          </h1>
          <p className="text-neutral-600 mb-6">
            Your password has been reset successfully. You can now log in with
            your new password.
          </p>
          <p className="text-sm text-neutral-500 mb-8">
            Redirecting you to login in a few seconds...
          </p>
          <Link to="/login">
            <Button className="w-full h-12 gap-2">
              Continue to Login
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
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
      <div className="relative z-10 max-w-md w-full">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <img src="/logo.svg" alt="Logo" className="h-8" />
          <span className="text-2xl font-bold text-neutral-900 tracking-tight">
            Matcha
          </span>
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/80 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-matcha" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Reset your password
          </h1>
          <p className="text-neutral-600">
            Enter your new password below. Make sure it's strong and memorable.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha transition-colors ${
                  error && !password
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
            {password && (
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
            {password && (
              <div className="mt-3 space-y-1">
                {[
                  {
                    check: password.length >= 8,
                    text: "At least 8 characters",
                  },
                  {
                    check: /[A-Z]/.test(password),
                    text: "One uppercase letter",
                  },
                  {
                    check: /[a-z]/.test(password),
                    text: "One lowercase letter",
                  },
                  {
                    check: /[0-9]/.test(password),
                    text: "One number",
                  },
                  {
                    check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                      password,
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
                      className={req.check ? "text-matcha" : "text-neutral-500"}
                    >
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
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
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha transition-colors ${
                  error && !confirmPassword
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
            {confirmPassword && password === confirmPassword && (
              <p className="mt-1 text-xs text-matcha flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Passwords match
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-base font-semibold gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                Reset Password
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
