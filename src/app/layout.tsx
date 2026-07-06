import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "BTL Radar | Multi-Chain AI Token Security Intelligence",
  description: "Watch and screen EVM & Solana tokens in real-time. Powered by BTL Runtime's cascading AI gateway. Protect your capital with screeners, forensics, and judge verification.",
  keywords: ["BTL Radar", "Token Security", "Crypto Security", "BTL Runtime", "Solana Rug Pull", "EVM Token Security", "AI Smart Scanner"],
  authors: [{ name: "Divine", url: "https://github.com/TheWeirdDee" }],
  openGraph: {
    title: "BTL Radar | Multi-Chain AI Token Security Intelligence",
    description: "Watch and screen EVM & Solana tokens in real-time. Powered by BTL Runtime's cascading AI gateway.",
    url: "https://btl-radar.vercel.app",
    siteName: "BTL Radar",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BTL Radar | Multi-Chain AI Token Security Intelligence",
    description: "Watch and screen EVM & Solana tokens in real-time. Powered by BTL Runtime's cascading AI gateway.",
    creator: "@TheWeirdDee",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${ibmPlexMono.variable} ${ibmPlexSans.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-bg text-text">{children}</body>
    </html>
  );
}
