"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  RiCheckboxCircleFill,
  RiShoppingBag3Line,
  RiArrowRightLine,
  RiShieldCheckLine,
  RiTruckLine,
  RiPrinterLine,
  RiFlashlightLine,
} from "react-icons/ri";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { getOrderById } from "@/services/orderService";
import { TaxInvoiceModal } from "@/components/order/tax-invoice";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const merchantOrderId = searchParams.get("merchantOrderId");
  const { clearCart } = useCart();

  const [orderData, setOrderData] = useState<any>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    // Clear cart on successful payment confirmation
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (orderId) {
      getOrderById(orderId)
        .then((data) => setOrderData(data))
        .catch(() => {});
    }
  }, [orderId]);

  const displayOrderCode = orderId
    ? `NK-ORD-${orderId.slice(-8).toUpperCase()}`
    : merchantOrderId
    ? `NK-PH-${merchantOrderId.slice(-8).toUpperCase()}`
    : `NK-${Date.now().toString().slice(-6)}`;

  const orderDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="w-full min-h-screen bg-[#FBFBFB] py-12 sm:py-16 font-sans">
      <Container>
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 border border-[#E5E5E5] shadow-sm">
          {/* Success Icon & Header */}
          <div className="text-center pb-6 border-b border-[#ECECEC]">
            <div className="w-16 h-16 rounded-full bg-[#EBF5EC] text-[#2E7D32] flex items-center justify-center mx-auto mb-4 text-3xl">
              <RiCheckboxCircleFill />
            </div>

            <div className="inline-flex items-center gap-1.5 bg-[#FAF5FF] text-[#5F259F] border border-[#E9D8FD] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
              <RiFlashlightLine />
              <span>PhonePe Payment Verified</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111]">
              Order Confirmed & Payment Received!
            </h1>
            <p className="text-xs sm:text-sm text-[#707072] mt-1.5 max-w-md mx-auto">
              Your footwear drop has been locked in and your transaction was verified by PhonePe.
            </p>
          </div>

          {/* Order Snapshot Card */}
          <div className="py-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#F8F8F8] border border-[#ECECEC]">
              <div>
                <span className="text-[11px] text-[#707072] uppercase font-bold block mb-0.5">
                  Order Reference
                </span>
                <span className="font-mono font-black text-sm text-[#111111]">
                  {displayOrderCode}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#707072] uppercase font-bold block mb-0.5">
                  Order Placed
                </span>
                <span className="font-medium text-[#111111]">{orderDate}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#707072] uppercase font-bold block mb-0.5">
                  Payment Method
                </span>
                <span className="font-bold text-[#5F259F]">PhonePe Gateway (Completed)</span>
              </div>
              <div>
                <span className="text-[11px] text-[#707072] uppercase font-bold block mb-0.5">
                  Estimated Dispatch
                </span>
                <span className="font-bold text-[#2E7D32]">Within 24 Hours</span>
              </div>
            </div>

            {/* Delivery Guarantee notice */}
            <div className="p-3.5 bg-[#F4F8F4] border border-[#D5E8D4] flex items-start gap-2.5 text-[#2E7D32]">
              <RiTruckLine className="text-base shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs uppercase tracking-wide">
                  Express Tracked Doorstep Delivery
                </strong>
                <span className="text-[11px] text-[#388E3C] leading-relaxed">
                  Your tracking link will be sent via SMS / WhatsApp once collected by our express logistics courier partner.
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 border-t border-[#ECECEC] flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className="w-full sm:w-auto h-11 px-5 bg-[#111111] text-white hover:bg-black font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <RiPrinterLine className="text-sm" />
              <span>Print Tax Invoice</span>
            </button>
            <Link href="/products" className="w-full sm:flex-1">
              <Button
                variant="bag"
                size="default"
                fullWidth
                arrow
                className="h-11 uppercase tracking-wider text-xs font-bold"
              >
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </Container>

      {/* Itemized Official Tax Invoice Preview Modal */}
      {(orderData || orderId || merchantOrderId) && (
        <TaxInvoiceModal
          order={
            orderData || {
              _id: orderId || merchantOrderId || "NK-ORDER",
              createdAt: new Date().toISOString(),
              paymentMethod: "phonepe",
              isPaid: true,
              totalPrice: 0,
              shippingAddress: {
                fullName: "Customer",
                addressLine1: "Doorstep Express Delivery",
                city: "India",
                state: "India",
                pincode: "",
                phone: "",
              },
              orderItems: [],
            }
          }
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-sans">
          <p className="text-xs uppercase font-bold tracking-widest text-[#707072]">
            Loading payment receipt...
          </p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
