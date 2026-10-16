import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Book Vacation",
    short_name: "Book Vacation",
    description: "Plan flights, stays and memorable getaways.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6faf7",
    theme_color: "#126b5b",
    categories: ["travel", "lifestyle"],
  };
}
