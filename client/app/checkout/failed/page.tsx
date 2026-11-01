"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  RiCloseCircleFill,
  RiArrowLeftLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiPhoneLine,
} from "react-icons/ri";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

function FailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const orderId = searchParams.get("orderId");

  const getErrorMessage = () => {
    switch (reason) {
      case "payment_cancelled":
        return "You cancelled the payment transaction on PhonePe. No money was deducted from your account.";
      case "payment_failed":
        return "The bank or payment provider declined the transaction. Please check your bank balance or try another UPI app / card.";
      case "missing_merchant_order_id":
        return "Invalid payment transaction reference received from payment gateway.";
      default:
        return "We were unable to complete the payment authorization. Your cart items are still saved.";
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#FBFBFB] py-12 sm:py-16 font-sans">
      <Container>
        <div className="max-w-xl mx-auto bg-white p-6 sm:p-10 border border-[#E5E5E5] shadow-sm">
          {/* Header */}
          <div className="text-center pb-6 border-b border-[#ECECEC]">
            <div className="w-16 h-16 rounded-full bg-[#FFEBEE] text-[#C62828] flex items-center justify-center mx-auto mb-4 text-3xl">
              <RiCloseCircleFill />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C62828] bg-[#FFEBEE] px-2.5 py-0.5 rounded-full inline-block mb-2">
              Payment Not Completed
            </span>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111]">
              Transaction Failed
            </h1>
            <p className="text-xs sm:text-sm text-[#707072] mt-2 max-w-sm mx-auto leading-relaxed">
              {getErrorMessage()}
            </p>
          </div>

          {/* Details */}
          <div className="py-6 space-y-3 text-xs">
            <div className="p-4 bg-[#F8F8F8] border border-[#ECECEC] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#707072]">Status:</span>
                <span className="font-bold text-[#C62828]">Unpaid / Cancelled</span>
              </div>
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-[#707072]">Order ID:</span>
                  <span className="font-mono font-bold text-[#111111]">{orderId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#707072]">Need Help?</span>
                <span className="font-bold text-[#111111]">support@nkshoes.in</span>
              </div>
            </div>

            <p className="text-[11px] text-[#707072] text-center">
              Don’t worry! If any funds were deducted, they will be automatically credited back by PhonePe to your source account within 2–4 business days.
            </p>
          </div>

          {/* CTAs */}
          <div className="pt-6 border-t border-[#ECECEC] flex flex-col sm:flex-row items-center gap-3">
            <Link href="/cart" className="w-full sm:w-auto flex-1">
              <button
                type="button"
                className="w-full h-11 px-5 border border-[#D0D0D0] hover:border-black font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RiArrowLeftLine className="text-sm" />
                <span>Return to Bag</span>
              </button>
            </Link>
            <Link href="/checkout" className="w-full sm:flex-1">
              <Button
                variant="bag"
                size="default"
                fullWidth
                arrow
                className="h-11 uppercase tracking-wider text-xs font-bold"
              >
                Retry Checkout
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}

export default function CheckoutFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-sans">
          <p className="text-xs uppercase font-bold tracking-widest text-[#707072]">
            Loading...
          </p>
        </div>
      }
    >
      <FailedContent />
    </Suspense>
  );
}
