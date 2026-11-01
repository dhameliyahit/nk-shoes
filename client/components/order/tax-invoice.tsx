"use client";

import React, { useRef } from "react";
import { RiPrinterLine, RiCloseLine, RiCheckDoubleLine, RiShoppingBag3Line } from "react-icons/ri";
import { formatPrice } from "@/lib/utils";

export interface TaxInvoiceProps {
  order: any;
  onClose?: () => void;
  isOpen?: boolean;
}

export function TaxInvoiceModal({ order, onClose, isOpen = true }: TaxInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Close on Escape key and prevent background scroll
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const invoiceNumber = `INV-${(order._id || order.id || "ORDER").toString().slice(-8).toUpperCase()}`;
  const orderNumber = `ORD-${(order._id || order.id || "ORDER").toString().slice(-8).toUpperCase()}`;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const customerName = order.shippingAddress?.fullName || order.user?.name || "Customer";
  const customerEmail = order.guestEmail || order.user?.email || "—";
  const customerPhone = order.shippingAddress?.phone || "—";
  const customerAltPhone = order.shippingAddress?.alternatePhone;

  const subtotal = order.itemsPrice ?? (order.orderItems?.reduce(
    (acc: number, item: any) => acc + Number(item.price || 0) * Number(item.quantity || 1),
    0
  ) || order.totalPrice);

  const discount = Number(order.discountAmount || 0);
  const shipping = Number(order.shippingPrice || 0);
  const giftWrap = Number(order.giftWrapFee || 0);
  const total = Number(order.totalPrice || 0);

  // Approximate 18% GST calculation (Included in retail price)
  const taxableBase = Math.round((total / 1.18) * 100) / 100;
  const totalTax = Math.round((total - taxableBase) * 100) / 100;
  const halfTax = Math.round((totalTax / 2) * 100) / 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:z-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {/* Container */}
      <div className="bg-white border-2 border-black max-w-4xl w-full shadow-2xl overflow-hidden rounded-none my-6 print:border-none print:shadow-none print:m-0 print:w-full">
        {/* Top Control Bar (Hidden during actual print) */}
        <div className="bg-[#111111] text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5 print:hidden border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <RiPrinterLine className="text-lg text-white shrink-0" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-white leading-tight">
                TAX INVOICE PREVIEW
              </h3>
              <p className="text-[10px] text-[#A3A3A3] font-mono">{invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-white text-[#111111] hover:bg-[#F3F4F6] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer rounded-none"
            >
              <RiPrinterLine className="text-sm" />
              <span>Print Invoice</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-[#262626] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer rounded-none border border-[#404040]"
                aria-label="Close invoice preview"
              >
                <RiCloseLine className="text-base" />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>

        {/* PRINTABLE INVOICE SHEET */}
        <div
          ref={invoiceRef}
          id="tax-invoice-printable"
          className="p-6 sm:p-10 font-sans text-xs text-[#111111] bg-white space-y-6"
        >
          {/* Header & Seller Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-black">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-black tracking-tighter uppercase text-[#111111]">
                  NK-SHOES
                </span>
                <span className="bg-[#111111] text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                  OFFICIAL
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563] mt-1 font-medium">
                NK-SHOES ATHLETIC FOOTWEAR PRIVATE LIMITED
              </p>
              <p className="text-[10px] text-[#6B7280]">
                GSTIN: 27AABCN8901M1Z5 · CIN: U74999MH2024PTC123456
              </p>
              <p className="text-[10px] text-[#6B7280]">
                Central Fulfillment Hub, Kurla West, Mumbai, MH 400070
              </p>
              <p className="text-[10px] text-[#6B7280]">
                Support: support@nk-shoes.com · Web: nk-shoes.com
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block bg-[#111111] text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest mb-1.5">
                TAX INVOICE / RETAIL RECEIPT
              </span>
              <div className="font-mono text-xs">
                <p>
                  <strong className="text-[#6B7280] font-sans">Invoice No:</strong>{" "}
                  <span className="font-black text-[#111111]">{invoiceNumber}</span>
                </p>
                <p>
                  <strong className="text-[#6B7280] font-sans">Order Ref:</strong>{" "}
                  <span className="font-bold">{orderNumber}</span>
                </p>
                <p>
                  <strong className="text-[#6B7280] font-sans">Date:</strong> {orderDate}
                </p>
                <p>
                  <strong className="text-[#6B7280] font-sans">Place of Supply:</strong>{" "}
                  {order.shippingAddress?.state || "Maharashtra"} (27)
                </p>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Dossier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-[#FAFAFA] border border-[#E5E7EB]">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6B7280] block mb-1">
                Billed To & Customer Information
              </span>
              <p className="text-sm font-black text-[#111111]">{customerName}</p>
              <p className="text-xs text-[#374151] mt-0.5 font-medium">
                Mobile: {customerPhone}
                {customerAltPhone ? ` / ${customerAltPhone}` : ""}
              </p>
              <p className="text-xs text-[#4B5563]">{customerEmail}</p>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6B7280] block mb-1">
                Shipping & Delivery Address
              </span>
              <p className="text-xs font-semibold text-[#111111]">
                {order.shippingAddress?.addressLine1}
              </p>
              {order.shippingAddress?.addressLine2 && (
                <p className="text-xs text-[#4B5563]">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-xs font-bold text-[#111111] mt-0.5">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} —{" "}
                <span className="font-mono text-[#111111]">{order.shippingAddress?.pincode}</span>
              </p>
              <p className="text-[10px] text-[#6B7280]">Country: India</p>
            </div>
          </div>

          {/* Payment & Courier Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 border border-[#E5E7EB] text-[11px]">
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase font-bold block">
                Payment Method
              </span>
              <span className="font-bold text-[#111111] uppercase">
                {order.paymentMethod === "phonepe" ? "PhonePe Gateway" : "Cash on Delivery"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase font-bold block">
                Payment Status
              </span>
              <span
                className={`font-black uppercase text-[10px] ${
                  order.isPaid ? "text-[#059669]" : "text-[#D97706]"
                }`}
              >
                {order.isPaid ? "✓ Paid & Settled" : "Pending Doorstep Cash"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase font-bold block">
                Transaction ID
              </span>
              <span className="font-mono text-[#374151] truncate block">
                {order.phonepeTransactionId || order.merchantOrderId || "N/A (Cash on Delivery)"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase font-bold block">
                Logistics Courier
              </span>
              <span className="font-bold text-[#111111]">
                {order.courierName ? `${order.courierName}` : "Standard Express Delivery"}
              </span>
            </div>
          </div>

          {/* Itemized Products Table */}
          <div className="border border-[#111111] overflow-x-auto">
            <table className="w-full min-w-[500px] sm:min-w-full text-left text-xs border-collapse">
              <thead className="bg-[#111111] text-white font-mono uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5">Item Description</th>
                  <th className="p-2.5 text-center">Size (UK/IN)</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Unit Price</th>
                  <th className="p-2.5 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {order.orderItems?.map((item: any, idx: number) => {
                  const itemPrice = Number(item.price || 0);
                  const qty = Number(item.quantity || 1);
                  const lineTotal = itemPrice * qty;

                  return (
                    <tr key={idx} className="hover:bg-[#FAFAFA]">
                      <td className="p-2.5 text-center font-mono text-[#6B7280]">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-[#111111]">
                        <div className="flex items-center gap-2">
                          <RiShoppingBag3Line className="text-xs text-[#9CA3AF] shrink-0" />
                          <span>{item.name}</span>
                        </div>
                        {item.color && (
                          <span className="text-[10px] text-[#6B7280] block font-normal mt-0.5">
                            Colorway: {item.color}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-[#111111]">
                        {item.size || "Standard"}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">{qty}</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">
                        {formatPrice(itemPrice)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold tabular-nums">
                        {formatPrice(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Tax Split */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            {/* Tax & GST Legal Notice */}
            <div className="space-y-2 max-w-sm text-[11px] text-[#4B5563]">
              <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] space-y-1">
                <span className="font-bold text-[#111111] uppercase block text-[10px] tracking-wider">
                  Goods & Services Tax (GST Breakdown @ 18%)
                </span>
                <div className="flex justify-between text-[10px] font-mono">
                  <span>Taxable Value:</span>
                  <span>{formatPrice(taxableBase)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span>Central GST (CGST 9%):</span>
                  <span>{formatPrice(halfTax)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span>State GST (SGST 9%):</span>
                  <span>{formatPrice(halfTax)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono font-bold text-[#111111] pt-1 border-t border-[#E5E7EB]">
                  <span>Total Tax Included:</span>
                  <span>{formatPrice(totalTax)}</span>
                </div>
              </div>

              <p className="text-[10px] text-[#6B7280] leading-relaxed">
                * All product prices are inclusive of applicable GST taxes. This computer-generated
                document confirms the genuine retail sale of footwear by NK-SHOES.
              </p>
            </div>

            {/* Financial Totals */}
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-[#4B5563]">
                <span>Items Subtotal:</span>
                <span className="font-mono tabular-nums">{formatPrice(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-[#059669] font-semibold">
                  <span>Promo Discount:</span>
                  <span className="font-mono tabular-nums">-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#4B5563]">
                <span>Express Shipping:</span>
                <span className="font-mono tabular-nums">
                  {shipping === 0 ? "FREE" : formatPrice(shipping)}
                </span>
              </div>

              {giftWrap > 0 && (
                <div className="flex justify-between text-[#4B5563]">
                  <span>Gift Box Packaging:</span>
                  <span className="font-mono tabular-nums">{formatPrice(giftWrap)}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t-2 border-black text-sm font-black text-[#111111]">
                <span>TOTAL AMOUNT:</span>
                <span className="font-mono tabular-nums text-base">{formatPrice(total)}</span>
              </div>

              <div className="text-[10px] text-right text-[#6B7280] font-mono">
                {order.isPaid ? "Total Paid (PhonePe Verified)" : "Total Payable upon Delivery (COD)"}
              </div>
            </div>
          </div>

          {/* Policy & Authorized Signatory Footer */}
          <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-end gap-4 text-[10px] text-[#6B7280]">
            <div className="space-y-1">
              <p className="font-bold text-[#111111] uppercase tracking-wide">
                Hassle-Free Exchange Policy:
              </p>
              <p>
                Eligible for 7 days size exchange in unworn condition with original shoebox and tags intact.
              </p>
              <p>For support or returns, visit nk-shoes.com/contact or write to support@nk-shoes.com.</p>
            </div>

            <div className="text-right shrink-0 pt-4 sm:pt-0">
              <div className="flex items-center justify-end gap-1 text-[#059669] font-bold text-xs">
                <RiCheckDoubleLine className="text-base" />
                <span>AUTHORIZED SIGNATORY</span>
              </div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#4B5563] mt-0.5">
                NK-SHOES FULFILLMENT SYSTEMS
              </p>
              <p className="text-[9px] text-[#9CA3AF]">Computer generated · No physical sign required</p>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer (Hidden during actual print) */}
        <div className="bg-[#FAFAFA] border-t-2 border-black px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="text-[11px] text-[#6B7280]">
            Need a physical copy? Click <strong>Print Invoice</strong> to download PDF or print.
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 border border-[#D1D5DB] text-[#111111] hover:bg-[#F3F4F6] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center rounded-none"
              >
                Close Invoice
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-2 bg-[#111111] text-white hover:bg-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center rounded-none"
            >
              <RiPrinterLine className="text-sm" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Media Print Global Style Guard */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #tax-invoice-printable,
          #tax-invoice-printable * {
            visibility: visible;
          }
          #tax-invoice-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}

export default TaxInvoiceModal;
