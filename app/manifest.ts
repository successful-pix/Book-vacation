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
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
    shortcuts: [
      { name: "Search flights", short_name: "Flights", url: "/flights", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] },
      { name: "Find a stay", short_name: "Stays", url: "/stays", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] }
    ],
  };
}
