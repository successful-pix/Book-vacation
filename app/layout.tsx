import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Vacation — Give them a getaway",
  description: "Thoughtfully curated holidays and memorable escapes for the people you love.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}