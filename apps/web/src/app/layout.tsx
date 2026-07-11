import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "GrowEasy Lead Importer — AI-Powered CRM CSV Import",
  description:
    "Upload any CSV export and automatically map it to the GrowEasy CRM schema using AI-powered field extraction. Supports Facebook Lead Ads, Google Ads, Excel exports, and more.",
  keywords: [
    "CRM",
    "CSV import",
    "lead management",
    "AI data extraction",
    "GrowEasy",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
