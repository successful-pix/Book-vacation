import type { Metadata } from "next";
import "./globals.css";
import { CurrencyProvider } from "./components/CurrencyProvider";
import DisplayScale from "./components/DisplayScale";

export const metadata: Metadata = {
  title: "Book Vacation — Flights, Stays & Holidays",
  description: "Discover flights, stays and holiday travel options around the world with Book Vacation.",
  applicationName: "Book Vacation",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Book Vacation" },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><DisplayScale/><CurrencyProvider>{children}</CurrencyProvider></body></html>;
}
