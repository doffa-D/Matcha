import React from "react";
import { MapPin } from "lucide-react";
import Button from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full"
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
        ></div>
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 w-full p-4 sm:p-6 flex justify-between items-center z-10">
        <Link
          to="/"
          className="flex items-center gap-1 sm:gap-2 cursor-pointer"
        >
          <img src="/logo.svg" alt="Logo" className="h-6 sm:h-8" />
          <span className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            Matcha
          </span>
        </Link>
        <div className="flex gap-2 sm:gap-4">
          <Link to="/login">
            <Button variant="ghost" size="md">
              Login
            </Button>
          </Link>
          <Link to="/register">
            <Button size="md">Register</Button>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center relative w-full">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12 text-center flex flex-col items-center z-0">
          {/* Hero Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 mb-4 sm:mb-6 tracking-tight leading-[1.1]">
            Find your perfect <br className="hidden sm:block" />
            <span className="text-matcha inline-block relative">
              blend.
              <svg
                className="absolute w-full h-2 sm:h-3 -bottom-1 left-0 text-matcha/30"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 5 Q 50 10 100 5"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 mb-8 sm:mb-10 max-w-xl md:max-w-2xl mx-auto leading-relaxed px-2">
            Matcha is the dating app for people who value authenticity. Connect
            with like-minded singles who share your passions.
          </p>

          {/* Action Buttons */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16">
            <Link to="/discover">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-10 py-5 h-auto font-semibold"
              >
                Start Matching
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto text-xl sm:text-xl px-10 py-5 h-auto border-matcha border-2 font-semibold"
            >
              <Link to="/discover">Browse Nearby</Link>
            </Button>
          </div>

          {/* Social Proof Images */}
          <div className="flex justify-center gap-4 sm:gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 scale-90 sm:scale-100">
            <img
              src="https://picsum.photos/id/10/50/50"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-md"
              alt="User"
            />
            <img
              src="https://picsum.photos/id/20/50/50"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-md mt-3 sm:mt-4"
              alt="User"
            />
            <img
              src="https://picsum.photos/id/30/50/50"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-md"
              alt="User"
            />
            <img
              src="https://picsum.photos/id/40/50/50"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-md mt-3 sm:mt-4"
              alt="User"
            />
          </div>

          <p className="mt-4 text-xs sm:text-sm text-neutral-500 font-medium">
            Join 50,000+ others today
          </p>
        </div>
      </div>
    </div>
  );
}
