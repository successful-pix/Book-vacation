import type { Metadata } from "next";
import "./globals.css";
import { CurrencyProvider } from "./components/CurrencyProvider";

export const metadata: Metadata = {
  title: "Book Vacation — Flights, stays and holidays",
  description: "Plan flights, stays and curated holiday escapes with Book Vacation. USD base pricing with local-currency estimates.",
  applicationName: "Book Vacation",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Book Vacation" },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><CurrencyProvider>{children}</CurrencyProvider></body></html>;
}
