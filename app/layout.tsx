import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted fonts (spec: "Self-host in production") — no runtime network dependency.
const barlow = localFont({
  variable: "--font-barlow",
  src: [
    { path: "./fonts/barlow-condensed-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/barlow-condensed-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/barlow-condensed-900.woff2", weight: "900", style: "normal" },
  ],
});

const openSans = localFont({
  variable: "--font-open-sans",
  src: [
    { path: "./fonts/open-sans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/open-sans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/open-sans-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/open-sans-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/open-sans-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/open-sans-600-italic.woff2", weight: "600", style: "italic" },
  ],
});

const jetbrainsMono = localFont({
  variable: "--font-jbmono",
  src: [
    { path: "./fonts/jetbrains-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jetbrains-mono-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/jetbrains-mono-600.woff2", weight: "600", style: "normal" },
  ],
});

// Theme fonts — Avante (Poppins, Galano Grotesque substitute) and Summit (Anton)
const poppins = localFont({
  variable: "--font-poppins",
  src: [
    { path: "./fonts/poppins-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/poppins-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/poppins-500-italic.woff2", weight: "500", style: "italic" },
  ],
});

const anton = localFont({
  variable: "--font-anton",
  src: [{ path: "./fonts/anton-400.woff2", weight: "400", style: "normal" }],
});

export const metadata: Metadata = {
  title: "FoundersForge · Carousel Studio",
  description:
    "Turn a story into a scroll-stopping Instagram carousel — drafted by AI, edited by you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${openSans.variable} ${jetbrainsMono.variable} ${poppins.variable} ${anton.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
