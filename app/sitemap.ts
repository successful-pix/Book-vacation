import type { MetadataRoute } from "next";

const siteUrl = "https://bookvacation.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/flights",
    "/tickets",
    "/stays",
    "/flight-hotel",
    "/signup",
    "/login",
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/flights" || route === "/tickets" ? 0.8 : 0.6,
  }));
}
