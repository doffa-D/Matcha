import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { verifyEmail } from "@/api/auth";
import Button from "@/components/ui/button";

export const Route = createFileRoute("/verify/$token/")({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    verifyEmail(token)
      .then((res) => {
        setMessage(
          res.data.message || "Your email has been verified successfully!",
        );
        setStatus("success");
        setTimeout(() => navigate({ to: "/login" }), 3000);
      })
      .catch((err) => {
        setMessage(
          err?.data?.error ||
            err.message ||
            "Verification failed. The link may be invalid or expired.",
        );
        setStatus("error");
      });
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <img src="/logo.svg" alt="Logo" className="h-8" />
          <span className="text-2xl font-bold text-neutral-900 tracking-tight">
            Matcha
          </span>
        </Link>

        {/* Loading State */}
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-matcha-light rounded-full flex items-center justify-center mb-6 mx-auto">
              <Loader2 className="w-8 h-8 text-matcha animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Verifying your email
            </h1>
            <p className="text-neutral-600">
              Please wait while we verify your account...
            </p>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-matcha-light rounded-full flex items-center justify-center mb-6 mx-auto">
              <Check className="w-8 h-8 text-matcha" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Email verified!
            </h1>
            <p className="text-neutral-600 mb-6">{message}</p>
            <p className="text-sm text-neutral-500 mb-8">
              Redirecting you to login in a few seconds...
            </p>
            <Link to="/login">
              <Button className="w-full h-12 text-base font-semibold gap-2">
                Continue to Login
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </>
        )}

        {/* Error State */}
        {status === "error" && (
          <>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Verification failed
            </h1>
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              {message}
            </div>
            <div className="space-y-3">
              <Link to="/register">
                <Button className="w-full h-12 text-base font-semibold gap-2 mb-3">
                  Create New Account
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="secondary"
                  className="w-full h-12 text-base font-semibold"
                >
                  Go to Login
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
