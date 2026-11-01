"use client";

import React from "react";
import { RiWhatsappFill } from "react-icons/ri";
import { Product } from "@/types/product";
import { CartItem } from "@/types/cart";
import { cn } from "@/lib/utils";

interface WhatsAppProductData {
  product: Product;
  selectedSize?: string;
  selectedColor?: string;
  quantity?: number;
}

interface WhatsAppCheckoutData {
  items: CartItem[];
  total: number;
  subtotal: number;
  discountAmount?: number;
  shippingFee?: number;
  codFee?: number;
  appliedPromo?: string;
  customer?: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

interface WhatsAppOrderButtonProps {
  mode: "product" | "checkout";
  productData?: WhatsAppProductData;
  checkoutData?: WhatsAppCheckoutData;
  phoneNumber?: string; // E.g. "919724313238" (Country code + 10 digits without +)
  className?: string;
  buttonText?: string;
}

export function WhatsAppOrderButton({
  mode,
  productData,
  checkoutData,
  phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919724313238",
  className,
  buttonText,
}: WhatsAppOrderButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    let message = "";

    if (mode === "product" && productData) {
      const { product, selectedSize, selectedColor, quantity = 1 } = productData;
      const unitPrice = product.price || 0;
      const total = unitPrice * quantity;
      const productUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/products/${product.slug}`
          : `https://nkshoes.in/products/${product.slug}`;

      message = [
        `*Hello NK-SHOES Jamnagar!* 👋`,
        `I would like to place an order via WhatsApp:`,
        ``,
        `👟 *Product:* ${product.name}`,
        selectedSize ? `📏 *Size:* ${selectedSize}` : `📏 *Size:* (Please advise on sizing)`,
        selectedColor ? `🎨 *Colour:* ${selectedColor}` : ``,
        `🔢 *Quantity:* ${quantity}`,
        `💰 *Price:* ₹${total.toLocaleString("en-IN")} (₹${unitPrice.toLocaleString("en-IN")} each)`,
        `🔗 *Product Link:* ${productUrl}`,
        ``,
        `📍 *Store:* NK-SHOES, Super Market, Near Teen Batti, Jamnagar`,
        `Please confirm availability & delivery details. Thank you!`,
      ]
        .filter(Boolean)
        .join("\n");
    } else if (mode === "checkout" && checkoutData) {
      const { items, total, subtotal, discountAmount = 0, shippingFee = 0, appliedPromo, customer } = checkoutData;

      const itemsList = items
        .map(
          (item, idx) =>
            `${idx + 1}. *${item.product?.name || "Footwear"}*\n   Size: ${item.size}${item.color ? ` | Col: ${item.color}` : ""}\n   Qty: ${item.quantity} × ₹${item.price.toLocaleString("en-IN")}`
        )
        .join("\n");

      const customerDetails =
        customer?.fullName || customer?.phone || customer?.city
          ? [
              `👤 *Customer:* ${customer.fullName || "Valued Customer"}`,
              customer.phone ? `📞 *Phone:* ${customer.phone}` : "",
              customer.address ? `🏠 *Address:* ${customer.address}` : "",
              customer.city && customer.pincode
                ? `📍 *City / PIN:* ${customer.city}, ${customer.state || ""} - ${customer.pincode}`
                : "",
            ]
              .filter(Boolean)
              .join("\n")
          : `(Address will be provided in chat)`;

      message = [
        `*Hello NK-SHOES Jamnagar!* 👋`,
        `I want to place my order directly via WhatsApp:`,
        ``,
        `🛒 *ORDER SUMMARY (${items.length} item${items.length > 1 ? "s" : ""}):*`,
        itemsList,
        ``,
        `💵 *Subtotal:* ₹${subtotal.toLocaleString("en-IN")}`,
        discountAmount > 0 ? `🏷️ *Discount (${appliedPromo || "Coupon"}):* -₹${discountAmount.toLocaleString("en-IN")}` : "",
        `🚚 *Shipping:* ${shippingFee === 0 ? "FREE" : `₹${shippingFee}`}`,
        `💳 *Total Payable:* ₹${total.toLocaleString("en-IN")}`,
        ``,
        `📦 *DELIVERY DETAILS:*`,
        customerDetails,
        ``,
        `Please confirm my order and send payment / COD dispatch confirmation.`,
      ]
        .filter(Boolean)
        .join("\n");
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  const defaultText =
    mode === "product" ? "Order via WhatsApp" : "Order on WhatsApp";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 font-bold uppercase tracking-wider text-xs text-white transition-all cursor-pointer select-none rounded-none active:scale-[0.99]",
        "bg-[#25D366] hover:bg-[#20BA5C] shadow-xs hover:shadow-md",
        "border border-[#25D366]",
        className
      )}
      title="Direct Order with NK-SHOES Jamnagar on WhatsApp"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="currentColor"
        className="shrink-0"
        aria-hidden="true"
      >
        <path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.947.56 3.763 1.528 5.302L2 22l4.823-1.493a10.02 10.02 0 0 0 5.208 1.455c5.536 0 10.031-4.495 10.031-10.031C22.062 6.495 17.567 2 12.031 2zm0 18.25c-1.636 0-3.17-.468-4.48-1.282l-.322-.199-2.859.885.894-2.784-.219-.344a8.214 8.214 0 0 1-1.267-4.495c0-4.55 3.7-8.25 8.253-8.25 4.553 0 8.25 3.7 8.25 8.25 0 4.553-3.697 8.25-8.25 8.25zm4.524-6.175c-.248-.124-1.467-.724-1.695-.806-.228-.083-.393-.124-.559.124-.166.248-.642.806-.787.972-.145.166-.29.186-.538.062-.248-.124-1.047-.386-1.995-1.23-.738-.658-1.237-1.472-1.382-1.72-.145-.248-.015-.382.109-.505.112-.111.248-.29.372-.435.124-.145.166-.248.249-.414.083-.166.041-.311-.021-.435-.062-.124-.559-1.347-.766-1.845-.201-.484-.406-.418-.559-.426l-.477-.008c-.166 0-.435.062-.663.311-.228.249-.87 0.85-.87 2.073 0 1.223.891 2.405 1.015 2.571.124.166 1.753 2.677 4.248 3.754.593.257 1.057.41 1.418.525.597.19 1.14.163 1.57.099.479-.071 1.467-.6 1.674-1.18.207-.58.207-1.077.145-1.18-.062-.104-.228-.166-.476-.29z" />
      </svg>
      <span className="font-extrabold tracking-wide">
        {buttonText || defaultText}
      </span>
    </button>
  );
}

export default WhatsAppOrderButton;
