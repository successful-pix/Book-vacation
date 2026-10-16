import type { Metadata } from "next";
import "./globals.css";
import { CurrencyProvider } from "./components/CurrencyProvider";

export const metadata: Metadata = {
  title: "BookRide — Private Driver Service",
  description: "Arrange private rides directly with your driver. Request a trip, confirm the fare personally and pay directly.",
  applicationName: "BookRide",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "BookRide" },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><CurrencyProvider>{children}</CurrencyProvider></body></html>;
}
