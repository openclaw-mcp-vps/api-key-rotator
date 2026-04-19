import type { Metadata } from "next";
import Script from "next/script";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import "./globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap"
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: `${APP_NAME} | Rotate AWS/OpenAI/Stripe Keys Faster`,
    template: `%s | ${APP_NAME}`
  },
  description: APP_DESCRIPTION,
  openGraph: {
    title: `${APP_NAME} | SOC2 Rotation Dashboard`,
    description: APP_DESCRIPTION,
    type: "website",
    url: "/",
    siteName: APP_NAME
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} | SOC2 Rotation Dashboard`,
    description: APP_DESCRIPTION
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${monoFont.variable}`}>
      <body>{children}</body>
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
    </html>
  );
}
