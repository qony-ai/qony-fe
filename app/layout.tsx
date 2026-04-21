import type { Metadata } from "next";
import type { Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";

import "./globals.css";

const plusJakartaSans = Instrument_Sans({
  variable: "--font-plus-jakarta-sans",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Qony AI",
    template: "%s | Qony AI",
  },
  description:
    "Qony AI is a structured reasoning workspace for ingesting source material, mapping logic, and exporting decision-ready narratives.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#071019",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
