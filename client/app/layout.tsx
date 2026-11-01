import type { Metadata } from "next";
import { Suspense } from "react";
import { ToastProvider } from "@/components/providers/toast-provider";
import { StorefrontShell } from "@/components/providers/storefront-shell";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "NK-SHOES | Minimalist Footwear & Sneakers",
  description: "Classic, professional, minimalist footwear and sneakers inspired by modern athletic design.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased overflow-x-hidden max-w-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-white text-[#111111] overflow-x-hidden max-w-full font-sans" suppressHydrationWarning>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <ToastProvider />
              <Suspense fallback={<div className="min-h-screen w-full flex flex-col">{children}</div>}>
                <StorefrontShell>{children}</StorefrontShell>
              </Suspense>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
