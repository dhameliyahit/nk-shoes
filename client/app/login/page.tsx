"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RiEyeLine,
  RiEyeOffLine,
  RiArrowRightLine,
  RiShieldCheckLine,
  RiTruckLine,
  RiSparklingLine,
  RiCheckLine,
} from "react-icons/ri";
import toast from "react-hot-toast";
import { useAuth } from "@/context/auth-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/common/loader";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const { login, user, isLoggedIn, isHydrated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect immediately based on role
  React.useEffect(() => {
    if (isHydrated && isLoggedIn && user) {
      if (user.role === "admin") {
        router.replace(redirectUrl.startsWith("/admin") ? redirectUrl : "/admin");
      } else {
        router.replace(redirectUrl.startsWith("/admin") ? "/profile" : redirectUrl);
      }
    }
  }, [isHydrated, isLoggedIn, user, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.requiresVerification) {
        toast.success(result.message || "Please verify your email to complete sign in.");
        router.push(
          `/register?verify=true&email=${encodeURIComponent(result.email || email)}&redirect=${encodeURIComponent(redirectUrl)}`
        );
        return;
      }

      const userRole = result.role || result.user?.role;
      if (userRole === "admin") {
        toast.success("Welcome Administrator! Accessing Control Console...");
        const target = redirectUrl && redirectUrl !== "/" ? redirectUrl : "/admin";
        router.push(target);
      } else {
        toast.success("Welcome back! Signed in successfully");
        const target = redirectUrl.startsWith("/admin") ? "/profile" : redirectUrl;
        router.push(target);
      }
    } catch (err: any) {
      const errMsg = err.message || "Invalid credentials. Please try again.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto font-sans">
      {/* Brand Header */}
      <div className="mb-8">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#707072] block mb-1.5">
          Member Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111]">
          Sign In
        </h1>
        <p className="text-xs text-[#707072] mt-2 leading-relaxed">
          Enter your registered email and password to access your account and orders.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-[#FFF5F5] border border-[#FED7D7] text-xs text-[#C53030] font-medium flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email Field */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full text-xs p-3.5 border border-[#E5E5E5] bg-[#FAFAFA] focus:bg-white focus:border-[#111111] outline-none transition-colors tracking-wide placeholder:text-[#999999]"
          />
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-[#707072] hover:text-[#111111] hover:underline transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full text-xs p-3.5 pr-11 border border-[#E5E5E5] bg-[#FAFAFA] focus:bg-white focus:border-[#111111] outline-none transition-colors tracking-wide placeholder:text-[#999999]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#111111] transition-colors p-1"
            >
              {showPassword ? <RiEyeOffLine className="text-base" /> : <RiEyeLine className="text-base" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="slide"
          size="default"
          fullWidth
          arrow
          isLoading={isLoading}
          className="h-12 mt-2 uppercase tracking-[0.15em] font-extrabold text-xs"
        >
          Sign In
        </Button>
      </form>

      {/* Switch to Register */}
      <div className="mt-8 pt-6 border-t border-[#EAEAEA] text-center">
        <p className="text-xs text-[#707072]">
          Not a member yet?{" "}
          <Link
            href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
            className="font-black text-[#111111] uppercase tracking-wider hover:underline ml-1"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="w-full min-h-[calc(100vh-140px)] bg-[#F8F8F8] flex items-center justify-center py-12 px-4">
      <Container>
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 bg-white border border-[#E5E5E5] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Left Hero Graphic Section */}
          <div className="md:col-span-5 bg-[#111111] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            {/* Architectural Sneaker Vector Motion Graphics SVG */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <svg
                viewBox="0 0 500 500"
                className="w-full h-full object-cover scale-125"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="250" cy="250" r="220" stroke="white" strokeWidth="1" fill="none" strokeDasharray="6 6" />
                <path
                  d="M50,300 C150,220 280,360 450,230"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M60,340 C170,250 310,380 460,260"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                  strokeOpacity="0.6"
                />
                <path
                  d="M40,240 C140,160 300,280 440,180"
                  stroke="white"
                  strokeWidth="1"
                  fill="none"
                  strokeOpacity="0.4"
                />
              </svg>
            </div>

            {/* Top Brand Logo */}
            <div className="relative z-10">
              <Link href="/" className="inline-block mb-10">
                <span
                  className="text-3xl font-black italic tracking-[-1px] uppercase text-white"
                  style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
                >
                  NK<span className="font-light ml-[2px]">SHOES</span>
                </span>
              </Link>

              <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-[#999999] block mb-2">
                Exclusive Footwear Collective
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight text-white mb-4">
                Engineered For Motion.
              </h2>
              <p className="text-xs text-[#A0A0A0] leading-relaxed max-w-xs">
                Unlock exclusive sneaker drops, personalized release calendars, and accelerated checkout.
              </p>
            </div>

            {/* Member Perks Checklist */}
            <div className="relative z-10 my-8 space-y-3.5 text-xs text-[#E0E0E0] border-t border-white/10 pt-6">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">
                  ✓
                </div>
                <span>Free Express Tracked Delivery</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">
                  ✓
                </div>
                <span>Early Access to Tier-1 Releases</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">
                  ✓
                </div>
                <span>7-Day Frictionless Exchanges</span>
              </div>
            </div>

            {/* Footer Copyright */}
            <div className="relative z-10 text-[11px] text-[#666666] tracking-wider uppercase font-semibold">
              © 2026 NK-SHOES INC. ALL RIGHTS RESERVED.
            </div>
          </div>

          {/* Right Form Section */}
          <div className="md:col-span-7 bg-white p-8 sm:p-12 flex items-center justify-center min-h-[460px]">
            <Suspense fallback={<Loader text="Loading Member Portal..." />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </Container>
    </main>
  );
}
