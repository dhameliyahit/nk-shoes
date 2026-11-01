import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = "https://nkshoes.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/checkout/*",
          "/account/*",
          "/profile/*",
        ],
      },
      {
        userAgent: "Googlebot-Image",
        allow: [
          "/",
          "/products/*",
          "/hero-section/*",
          "/icon.svg",
          "/favicon.ico",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
