"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RiEyeLine,
  RiEyeOffLine,
  RiMailSendLine,
  RiShieldCheckLine,
  RiArrowRightLine,
  RiCheckDoubleLine,
  RiRefreshLine,
} from "react-icons/ri";
import toast from "react-hot-toast";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/common/loader";
import { useAuth } from "@/context/auth-context";

const isValidIndianMobile = (mobile: string) => {
  if (!mobile) return true;
  const cleaned = mobile.replace(/\D/g, "");
  if (cleaned.length === 0) return true;
  if (cleaned.length !== 10) return false;
  return /^[6-9]\d{9}$/.test(cleaned);
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const urlVerify = searchParams.get("verify") === "true";
  const urlEmail = searchParams.get("email") || "";
  const urlToken = searchParams.get("token") || "";

  const { register, verifyEmail, resendOtp } = useAuth();

  // Verification step state
  const [isVerifying, setIsVerifying] = useState(urlVerify || Boolean(urlEmail && urlToken));
  const [verifyEmailAddress, setVerifyEmailAddress] = useState(urlEmail);

  // 6-digit OTP array
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for resend
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Form input state
  const [formData, setFormData] = useState({
    name: "",
    email: urlEmail || "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingLoading, setIsVerifyingLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-verify if link token exists
  useEffect(() => {
    if (urlEmail && urlToken) {
      setIsVerifying(true);
      setVerifyEmailAddress(urlEmail);
      setIsVerifyingLoading(true);
      verifyEmail(urlEmail, undefined, urlToken)
        .then(() => {
          toast.success("Email verified successfully! Welcome to NK-SHOES.");
          setTimeout(() => {
            router.push(redirectUrl);
          }, 1000);
        })
        .catch((err) => {
          setError(err.message || "Failed to verify via link. Please enter the OTP.");
          toast.error(err.message || "Link verification failed");
        })
        .finally(() => {
          setIsVerifyingLoading(false);
        });
    }
  }, [urlEmail, urlToken, verifyEmail, redirectUrl, router]);

  // Resend countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVerifying && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [isVerifying, countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError("Please complete all required fields");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
      setError("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(
        formData.name.trim(),
        formData.email.trim().toLowerCase(),
        formData.password,
        formData.phone ? formData.phone : undefined
      );

      setVerifyEmailAddress(formData.email.trim().toLowerCase());
      setIsVerifying(true);
      setCountdown(60);
      setCanResend(false);
      toast.success("Verification code sent! Please check your email.");
    } catch (err: any) {
      const msg = err.message || "Registration failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP Inputs
  const handleOtpChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = sanitized;
    setOtp(newOtp);

    // Auto-advance cursor
    if (sanitized && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    const lastFilledIndex = Math.min(pasted.length, 5);
    otpRefs.current[lastFilledIndex]?.focus();
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const enteredOtp = otp.join("").trim();

    if (enteredOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setIsVerifyingLoading(true);
    try {
      await verifyEmail(verifyEmailAddress, enteredOtp);
      toast.success("Account successfully verified! Enjoy shopping.");
      router.push(redirectUrl);
    } catch (err: any) {
      const msg = err.message || "Invalid or expired OTP. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsVerifyingLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setError("");
    try {
      await resendOtp(verifyEmailAddress);
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      toast.success("A fresh 6-digit code has been sent to your email.");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code");
    }
  };

  // =========================================================================
  // VIEW: STEP 2 - EMAIL VERIFICATION SCREEN
  // =========================================================================
  if (isVerifying) {
    return (
      <div className="w-full max-w-sm mx-auto font-sans">
        {/* Animated Graphic SVG: Mail Verification Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
            {/* Concentric subtle radar pulse SVG */}
            <svg
              className="absolute inset-0 w-full h-full text-[#111111]/10 animate-ping"
              viewBox="0 0 100 100"
            >
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <div className="w-16 h-16 rounded-full bg-[#111111] text-white flex items-center justify-center shadow-lg relative z-10">
              <RiMailSendLine className="text-2xl" />
            </div>
          </div>

          <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-[#707072] block mb-1">
            Verification Required
          </span>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111111]">
            Verify Your Email
          </h2>
          <p className="text-xs text-[#707072] mt-1.5 leading-relaxed max-w-xs">
            We sent a 6-digit confirmation code to{" "}
            <strong className="text-[#111111] break-all">{verifyEmailAddress}</strong>
          </p>
        </div>


        {error && (
          <div className="mb-4 p-3 bg-[#FFF5F5] border border-[#FED7D7] text-xs text-[#C53030] font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOtpSubmit} className="flex flex-col gap-5">
          {/* 6 Digit Input Fields */}
          <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  otpRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-11 h-13 text-center text-lg font-mono font-black border border-[#D5D5D5] bg-[#FAFAFA] focus:bg-white focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none transition-all rounded-none"
              />
            ))}
          </div>

          <Button
            type="submit"
            variant="slide"
            size="default"
            fullWidth
            arrow
            isLoading={isVerifyingLoading}
            className="h-12 uppercase tracking-[0.15em] font-extrabold text-xs"
          >
            Verify & Continue
          </Button>
        </form>

        {/* Resend Actions */}
        <div className="mt-6 pt-5 border-t border-[#EAEAEA] text-center flex flex-col items-center gap-2">
          {canResend ? (
            <button
              type="button"
              onClick={handleResendCode}
              className="text-xs font-bold uppercase tracking-wider text-[#111111] hover:underline flex items-center gap-1.5"
            >
              <RiRefreshLine className="text-sm" /> Resend Code
            </button>
          ) : (
            <span className="text-xs text-[#707072]">
              Resend code in <strong className="text-[#111111] font-mono">{countdown}s</strong>
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setIsVerifying(false);
              setError("");
            }}
            className="text-[11px] text-[#888888] hover:text-[#111111] underline transition-colors mt-2"
          >
            Change Email or Details
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: STEP 1 - CREATE ACCOUNT FORM
  // =========================================================================
  return (
    <div className="w-full max-w-sm mx-auto font-sans">
      <div className="mb-6">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#707072] block mb-1.5">
          Become a Member
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111]">
          Create Account
        </h1>
        <p className="text-xs text-[#707072] mt-1.5 leading-relaxed">
          Sign up to unlock exclusive footwear drops and seamless express checkout.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#FFF5F5] border border-[#FED7D7] text-xs text-[#C53030] font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5">
        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            className="w-full text-xs p-3 border border-[#E5E5E5] bg-[#FAFAFA] focus:bg-white focus:border-[#111111] outline-none transition-colors tracking-wide placeholder:text-[#999999]"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            className="w-full text-xs p-3 border border-[#E5E5E5] bg-[#FAFAFA] focus:bg-white focus:border-[#111111] outline-none transition-colors tracking-wide placeholder:text-[#999999]"
          />
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1">
            Mobile Number (Optional)
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 text-xs font-bold text-[#555] bg-[#EFEFEF] border border-r-0 border-[#E5E5E5]">
              +91
            </span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              maxLength={10}
              value={formData.phone}
              onChange={handleChange}
              placeholder="9876543210"
              className="w-full text-xs p-3 border border-[#E5E5E5] bg-[#FAFAFA] focus:bg-white focus:border-[#111111] outline-none transition-colors tracking-wide placeholder:text-[#999999]"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className="w-full text-xs p-3 pr-10 border border-[#E5E5E5] bg-[#FAFAFA] focus:bg-white focus:border-[#111111] outline-none transition-colors tracking-wide placeholder:text-[#999999]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#111111] transition-colors p-1"
            >
              {showPassword ? <RiEyeOffLine className="text-base" /> : <RiEyeLine className="text-base" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1">
            Confirm Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              required
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              className="w-full text-xs p-3 pr-10 border border-[#E5E5E5] bg-[#FAFAFA] focus:bg-white focus:border-[#111111] outline-none transition-colors tracking-wide placeholder:text-[#999999]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#111111] transition-colors p-1"
            >
              {showConfirmPassword ? <RiEyeOffLine className="text-base" /> : <RiEyeLine className="text-base" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="slide"
          size="default"
          fullWidth
          arrow
          isLoading={isLoading}
          className="h-12 mt-3 uppercase tracking-[0.15em] font-extrabold text-xs"
        >
          Create Account & Verify
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#EAEAEA] text-center">
        <p className="text-xs text-[#707072]">
          Already have an account?{" "}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
            className="font-black text-[#111111] uppercase tracking-wider hover:underline ml-1"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="w-full min-h-[calc(100vh-140px)] bg-[#F8F8F8] flex items-center justify-center py-12 px-4">
      <Container>
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 bg-white border border-[#E5E5E5] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Left Hero Graphic Section */}
          <div className="md:col-span-5 bg-[#111111] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            {/* Athletic Geometric Contour Art SVG */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <svg
                viewBox="0 0 500 500"
                className="w-full h-full object-cover scale-125"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="250" cy="250" r="220" stroke="white" strokeWidth="1" fill="none" strokeDasharray="6 6" />
                <path
                  d="M50,220 C180,350 320,120 450,280"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M40,260 C170,390 310,160 460,320"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                  strokeOpacity="0.5"
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
                Join The Circle
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight text-white mb-4">
                Your Ticket To The Best In Sneaker Culture.
              </h2>
              <p className="text-xs text-[#A0A0A0] leading-relaxed max-w-xs">
                Create your verified profile to receive email drop alerts, faster checkouts, and priority member access.
              </p>
            </div>

            {/* Verification & Quality Guarantee */}
            <div className="relative z-10 my-8 space-y-3.5 text-xs text-[#E0E0E0] border-t border-white/10 pt-6">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">
                  ✓
                </div>
                <span>Official Email Verification System</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">
                  ✓
                </div>
                <span>Direct Access to Limited Drops</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">
                  ✓
                </div>
                <span>Encrypted Security & Protection</span>
              </div>
            </div>

            {/* Footer Copyright */}
            <div className="relative z-10 text-[11px] text-[#666666] tracking-wider uppercase font-semibold">
              © 2026 NK-SHOES INC. ALL RIGHTS RESERVED.
            </div>
          </div>

          {/* Right Form Section */}
          <div className="md:col-span-7 bg-white p-8 sm:p-12 flex items-center justify-center min-h-[520px]">
            <Suspense fallback={<Loader text="Loading Member Registration..." />}>
              <RegisterForm />
            </Suspense>
          </div>
        </div>
      </Container>
    </main>
  );
}
