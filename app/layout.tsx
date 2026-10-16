import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookRide — Private Driver Service",
  description: "Arrange private rides directly with your driver. Request a trip, confirm the fare personally and pay directly.",
  applicationName: "BookRide",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "BookRide" },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
