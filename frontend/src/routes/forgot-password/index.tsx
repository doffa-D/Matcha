import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { Mail, ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";

import Button from "@/components/ui/button";
import { forgotPassword } from "@/api/auth";

export const Route = createFileRoute("/forgot-password/")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (): boolean => {
    if (!email) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) return;

    setIsSubmitting(true);
    setError("");

    try {
      await forgotPassword({ email });
      setIsSuccess(true);
    } catch (error: any) {
      const errorMessage =
        error?.data?.error ||
        error?.message ||
        "Something went wrong. Please try again.";
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
            Check your email
          </h1>
          <p className="text-neutral-600 mb-6">
            We've sent a password reset link to{" "}
            <span className="font-semibold text-neutral-900">{email}</span>.
            Click the link in the email to reset your password.
          </p>
          <p className="text-sm text-neutral-500 mb-8">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setIsSuccess(false)}
              className="text-matcha font-semibold hover:underline"
            >
              try again
            </button>
          </p>
          <Link to="/login">
            <Button className="w-full h-12 gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back to Login
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
            <Mail className="w-8 h-8 text-matcha" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Forgot your password?
          </h1>
          <p className="text-neutral-600">
            No worries! Enter your email address and we'll send you a link to
            reset your password.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha transition-colors ${
                  error ? "border-red-300 bg-red-50/50" : "border-neutral-200"
                }`}
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-base font-semibold gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send Reset Link
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
