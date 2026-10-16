import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Vacation — Flights, stays and holidays",
  description: "Search flights, explore stays, discover travel deals and book thoughtful holiday escapes with Book Vacation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}