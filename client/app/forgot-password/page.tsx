"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSent(true);
      toast.success("Password reset link sent to your email");
    }, 600);
  };

  return (
    <main className="w-full min-h-screen bg-[#FBFBFB] flex items-center justify-center py-10">
      <Container>
        <div className="w-full max-w-md mx-auto py-12 sm:py-16 font-sans">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-3">
              <span
                className="text-4xl font-black italic tracking-[-1.5px] uppercase"
                style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
              >
                NK<span className="font-bold ml-[2px]">SHOES</span>
              </span>
            </Link>
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#111111]">
              Reset Password
            </h1>
            <p className="text-xs text-[#707072] mt-1.5 leading-relaxed">
              Enter your email to receive a reset link
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 border border-[#E5E5E5] shadow-xs">
            {!sent ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="athlete@example.com"
                    className="w-full text-xs p-3 border border-[#D0D0D0] focus:border-[#002B5C] outline-none bg-white"
                  />
                </div>
                <Button
                  type="submit"
                  variant="bag"
                  size="default"
                  fullWidth
                  isLoading={isLoading}
                  className="h-12 mt-2 uppercase tracking-[0.15em] font-bold text-xs bg-[#002B5C] hover:bg-[#001f3f]"
                >
                  Send Reset Link
                </Button>
              </form>
            ) : (
              <div className="text-center">
                <p className="text-sm text-[#002B5C] font-semibold mb-4">
                  If an account exists with {email}, you will receive an email with instructions.
                </p>
                <Link href="/login" className="text-xs font-bold text-[#002B5C] hover:underline uppercase tracking-wide">
                  Back to Login
                </Link>
              </div>
            )}
            <div className="mt-6 pt-5 border-t border-[#F0F0F0] text-center text-xs">
              <Link href="/login" className="font-bold text-[#002B5C] hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
