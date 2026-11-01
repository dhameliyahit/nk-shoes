import React from "react";

export function StoreJsonLd() {
  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "ShoeStore",
    "@id": "https://nkshoes.in/#store",
    name: "NK-SHOES",
    alternateName: ["NK Shoes Jamnagar", "NK Shoes Store Jamnagar", "NK-SHOES India"],
    url: "https://nkshoes.in",
    logo: "https://nkshoes.in/icon.svg",
    image: [
      "https://nkshoes.in/hero-section/hero-slide-01.webp",
      "https://nkshoes.in/hero-section/hero-slide-02.webp",
    ],
    description:
      "NK-SHOES is Jamnagar's premier footwear retail showroom, now delivering authentic athletic running shoes, lifestyle sneakers, sports footwear, and formal shoes online across India with Cash on Delivery and fast dispatch from Jamnagar, Gujarat.",
    telephone: "+91-97243-13238",
    email: "nkshoes7@gmail.com",
    priceRange: "₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash on Delivery, PhonePe, UPI, Credit Card, Debit Card, Net Banking",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ground Floor, Super Market Complex, Near Teen Batti",
      addressLocality: "Jamnagar",
      addressRegion: "Gujarat",
      postalCode: "361001",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 22.4707,
      longitude: 70.0577,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "21:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday"],
        opens: "11:00",
        closes: "20:00",
      },
    ],
    areaServed: [
      {
        "@type": "City",
        name: "Jamnagar",
      },
      {
        "@type": "State",
        name: "Gujarat",
      },
      {
        "@type": "Country",
        name: "India",
      },
    ],
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "IN",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 7,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://nkshoes.in/products?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
    />
  );
}

export default StoreJsonLd;
