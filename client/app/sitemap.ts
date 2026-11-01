import { MetadataRoute } from "next";

const BASE_URL = "https://nkshoes.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/products?category=running`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/products?category=sneakers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/products?category=sports`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/products?filter=new-arrivals`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/products?filter=best-sellers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/products?filter=sale`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/pages/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/pages/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/pages/shipping`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/pages/returns`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/pages/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamically load product slugs
  try {
    const res = await fetch("http://127.0.0.1:5000/api/products?limit=100", {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const products = Array.isArray(data) ? data : data.products || [];
      const productRoutes: MetadataRoute.Sitemap = products.map((p: any) => ({
        url: `${BASE_URL}/products/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
      return [...staticRoutes, ...productRoutes];
    }
  } catch {
    // If backend isn't reachable at build time, fall back to core known slugs
  }

  const fallbackProductSlugs = [
    "nk-velocity-nitro-runner",
    "nk-court-retro-low",
    "nk-air-stride-pro",
    "nk-street-tempo-glide",
    "nk-apex-track-runner",
    "nk-core-heritage-80",
    "nk-trail-master-gtx",
    "nk-pulse-boost-v2",
  ];

  const fallbackProductRoutes: MetadataRoute.Sitemap = fallbackProductSlugs.map((slug) => ({
    url: `${BASE_URL}/products/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...fallbackProductRoutes];
}
