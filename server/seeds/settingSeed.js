/**
 * Initial Seed Data for MongoDB 'settings' collection.
 * This is used solely for the initial database setup/migration
 * when the MongoDB collection is empty.
 * All subsequent reads and mutations happen directly against MongoDB.
 */

export const INITIAL_STORE_SETTINGS = {
  key: "store_settings",
  group: "general",
  description: "Store promotion announcement, dynamic coupons, shipping & payment configuration",
  value: {
    announcement: {
      enabled: true,
      badgeText: "PROMOTION",
      desktopText: "Special drop launch. Use Coupon for 50% OFF",
      mobileText: "Use Coupon Code for 50% OFF",
      couponCode: "CODEPEN50",
      discountPercent: 50,
      targetDate: "2030-12-30T00:00:00",
      primaryColor: "#FA003F",
      secondaryColor: "#ffffff",
    },
    coupons: [
      {
        code: "CODEPEN50",
        discountPercent: 50,
        description: "50% OFF - Official Special Drop Launch Coupon",
        minOrderAmount: 0,
        tag: "FEATURED",
      },
      {
        code: "NIKE10",
        discountPercent: 10,
        description: "10% OFF on all athletic footwear",
        minOrderAmount: 999,
        tag: "POPULAR",
      },
      {
        code: "WELCOME10",
        discountPercent: 10,
        description: "10% OFF on your first NK-SHOES order",
        minOrderAmount: 0,
        tag: "FIRST ORDER",
      },
      {
        code: "PREPAID5",
        discountPercent: 5,
        description: "Extra 5% instant discount for online PhonePe / UPI",
        minOrderAmount: 0,
        tag: "PREPAID",
      },
    ],
    shipping: {
      freeShippingThreshold: 2999,
      standardShippingFee: 199,
      giftWrapFee: 99,
    },
    payment: {
      prepaidFreeShipping: true,
      prepaidDiscountPercent: 0,
      codEnabled: true,
      codFee: 0,
      codMinAmount: 0,
      codMaxAmount: 25000,
      codFreeAbove: 1999,
    },
  },
};

export const INITIAL_EMAIL_SETTING = {
  key: "email",
  group: "system",
  description: "Email SMTP Configuration",
  value: {
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "",
      pass: "",
    },
    fromName: "NK-SHOES",
    fromEmail: "",
  },
};

export const INITIAL_SIZE_GUIDE = {
  key: "size_guide",
  group: "product",
  description: "Official Athletic Footwear Sizing Chart",
  value: {
    unit: "cm",
    title: "Official Adidas & Athletic Footwear Size Guide",
    description: "Standardized UK, US Men, US Women, EUR and Centimeter measurement guide.",
    sizes: [
      { uk: "UK 4", usMen: "4.5", usWomen: "5.5", eu: "36.7", cm: 22.5 },
      { uk: "UK 4.5", usMen: "5.0", usWomen: "6.0", eu: "37.3", cm: 22.9 },
      { uk: "UK 5", usMen: "5.5", usWomen: "6.5", eu: "38.0", cm: 23.3 },
      { uk: "UK 5.5", usMen: "6.0", usWomen: "7.0", eu: "38.7", cm: 23.8 },
      { uk: "UK 6", usMen: "6.5", usWomen: "7.5", eu: "39.3", cm: 24.2 },
      { uk: "UK 6.5", usMen: "7.0", usWomen: "8.0", eu: "40.0", cm: 24.6 },
      { uk: "UK 7", usMen: "7.5", usWomen: "8.5", eu: "40.7", cm: 25.0 },
      { uk: "UK 7.5", usMen: "8.0", usWomen: "9.0", eu: "41.3", cm: 25.5 },
      { uk: "UK 8", usMen: "8.5", usWomen: "9.5", eu: "42.0", cm: 26.0 },
      { uk: "UK 8.5", usMen: "9.0", usWomen: "10.0", eu: "42.7", cm: 26.3 },
      { uk: "UK 9", usMen: "9.5", usWomen: "10.5", eu: "43.3", cm: 26.7 },
      { uk: "UK 9.5", usMen: "10.0", usWomen: "11.0", eu: "44.0", cm: 27.1 },
      { uk: "UK 10", usMen: "10.5", usWomen: "11.5", eu: "44.7", cm: 27.6 },
      { uk: "UK 10.5", usMen: "11.0", usWomen: "12.0", eu: "45.3", cm: 28.0 },
      { uk: "UK 11", usMen: "11.5", usWomen: "12.5", eu: "46.0", cm: 28.4 },
      { uk: "UK 11.5", usMen: "12.0", usWomen: "13.0", eu: "46.7", cm: 28.8 },
      { uk: "UK 12", usMen: "12.5", usWomen: "13.5", eu: "47.3", cm: 29.3 },
    ],
    instructions: [
      "Place a piece of blank paper on a hard floor with one edge touching a wall.",
      "Stand barefoot on the paper with your heel firmly against the wall.",
      "Mark the tip of your longest toe on the paper with a pencil held straight up.",
      "Measure the length from the edge to the mark in centimeters.",
      "Find your measurement in the chart to get your optimal UK shoe size.",
    ],
  },
};
