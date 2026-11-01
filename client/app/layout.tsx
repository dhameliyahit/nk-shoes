import type { Metadata } from "next";
import { Suspense } from "react";
import { ToastProvider } from "@/components/providers/toast-provider";
import { StorefrontShell } from "@/components/providers/storefront-shell";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { StoreJsonLd } from "@/components/seo/store-jsonld";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nkshoes.in"),
  title: {
    default: "NK-SHOES | Best Shoe Store in Jamnagar & Online Sneakers India",
    template: "%s | NK-SHOES Jamnagar",
  },
  description:
    "NK-SHOES is Jamnagar's premier footwear retail showroom, now delivering authentic athletic running shoes, lifestyle retro sneakers, and sports trainers online across India with Cash on Delivery (COD) and fast shipping.",
  applicationName: "NK-SHOES",
  authors: [{ name: "NK-SHOES Jamnagar", url: "https://nkshoes.in" }],
  creator: "NK-SHOES Jamnagar",
  publisher: "NK-SHOES",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  keywords: [
    "NK-SHOES",
    "NK Shoes Jamnagar",
    "shoes shop in Jamnagar",
    "best shoe store in Jamnagar",
    "footwear Jamnagar Gujarat",
    "Teen Batti Jamnagar shoes",
    "buy sneakers online India",
    "running shoes Jamnagar",
    "athletic footwear India",
    "sneakers online India",
    "men shoes Jamnagar",
    "sports shoes Jamnagar",
    "cash on delivery shoes India",
    "nkshoes.in",
  ],
  alternates: {
    canonical: "https://nkshoes.in",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://nkshoes.in",
    siteName: "NK-SHOES Jamnagar",
    title: "NK-SHOES | Best Footwear Store in Jamnagar & Online Across India",
    description:
      "Shop 100% genuine running shoes, retro sneakers, and gym footwear from NK-SHOES Jamnagar showroom. Fast all-India dispatch with Cash on Delivery.",
    images: [
      {
        url: "https://nkshoes.in/hero-section/hero-slide-01.webp",
        width: 1200,
        height: 630,
        alt: "NK-SHOES Jamnagar Retail Store & Online Sneakers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NK-SHOES Jamnagar | Athletic Footwear & Sneakers Online",
    description:
      "Jamnagar's trusted physical shoe showroom, delivering authentic athletic sneakers across India at nkshoes.in.",
    images: ["https://nkshoes.in/hero-section/hero-slide-01.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
  },
  other: {
    "geo.region": "IN-GJ",
    "geo.placename": "Jamnagar, Gujarat, India",
    "geo.position": "22.4707;70.0577",
    ICBM: "22.4707, 70.0577",
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
        <StoreJsonLd />
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
