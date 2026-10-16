import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";
import { CurrencyProvider } from "./components/CurrencyProvider";
import DisplayScale from "./components/DisplayScale";
import SiteTranslation from "./components/SiteTranslation";
import NoCopy from "./components/NoCopy";

export const metadata: Metadata = {
  metadataBase: new URL("https://book-vacation.vercel.app"),
  title: "Book Vacation — Flights, Stays & Holidays",
  description: "Discover flights, stays and holiday travel options around the world with Book Vacation.",
  openGraph: { type: "website", siteName: "Book Vacation", title: "Book Vacation — Flights, Stays & Holidays", description: "Discover flights, stays and holiday travel options around the world with Book Vacation." },
  twitter: { card: "summary_large_image", title: "Book Vacation — Flights, Stays & Holidays", description: "Discover flights, stays and holiday travel options around the world with Book Vacation." },
  applicationName: "Book Vacation",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Book Vacation" },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><NoCopy/><DisplayScale/><SiteTranslation/><CurrencyProvider>{children}</CurrencyProvider></body></html>;
}
