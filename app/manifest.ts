import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "BookRide Private Driver",
    short_name: "BookRide",
    description: "Book private rides directly with your driver.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f4f8ff",
    theme_color: "#0066cc",
    categories: ["travel", "transportation"],
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    shortcuts: [
      { name: "Search flights", short_name: "Flights", url: "/flights", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] },
      { name: "Find a stay", short_name: "Stays", url: "/stays", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] }
    ],
  };
}
