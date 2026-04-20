import type { Metadata } from "next";
import type { Viewport } from "next";
import localFont from "next/font/local";

import { QueryProvider } from "@/src/lib/query/provider";

import "./globals.css";

const plusJakartaSans = localFont({
  variable: "--font-plus-jakarta-sans",
  display: "swap",
  src: [
    {
      path: "../.agents/skills/canvas-design/canvas-fonts/InstrumentSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../.agents/skills/canvas-design/canvas-fonts/InstrumentSans-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../.agents/skills/canvas-design/canvas-fonts/InstrumentSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../.agents/skills/canvas-design/canvas-fonts/InstrumentSans-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
});

const plexMono = localFont({
  variable: "--font-plex-mono",
  display: "swap",
  src: [
    {
      path: "../.agents/skills/canvas-design/canvas-fonts/IBMPlexMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../.agents/skills/canvas-design/canvas-fonts/IBMPlexMono-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: {
    default: "Qony AI",
    template: "%s | Qony AI",
  },
  description:
    "Qony AI is a structured six-rank reasoning workspace for ingesting source material, mapping logic, and exporting decision-ready narratives.",
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
      <body className="min-h-full">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
