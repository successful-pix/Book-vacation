import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/booking-operations", "/admin-support", "/api/", "/account", "/profile"],
    },
    sitemap: "https://bookvacation.online/sitemap.xml",
    host: "https://bookvacation.online",
  };
}
