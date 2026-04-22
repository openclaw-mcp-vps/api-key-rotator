import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://api-key-rotator.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "API Key Rotator | Rotate AWS, OpenAI, Stripe keys across projects",
    template: "%s | API Key Rotator"
  },
  description:
    "API Key Rotator helps startup teams rotate API credentials across AWS, OpenAI, and Stripe while syncing Vercel/Netlify env vars and maintaining SOC2-ready audit logs.",
  keywords: [
    "API key rotation",
    "SOC2 compliance",
    "security operations",
    "AWS key rotation",
    "OpenAI key rotation",
    "Stripe key rotation"
  ],
  openGraph: {
    title: "API Key Rotator",
    description:
      "One dashboard to rotate AWS/OpenAI/Stripe keys across all projects, track stale credentials, and keep an audit trail for SOC2.",
    type: "website",
    url: siteUrl,
    siteName: "API Key Rotator"
  },
  twitter: {
    card: "summary_large_image",
    title: "API Key Rotator",
    description: "One-click API key rotations across projects with audit logging and stale key alerts."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} bg-[#0d1117] text-[var(--text)] antialiased`}>
        <div className="min-h-screen">
          <style>{`
            h1,h2,h3,h4,.font-display { font-family: var(--font-display), sans-serif; }
            body { font-family: var(--font-body), sans-serif; }
          `}</style>
          {children}
        </div>
      </body>
    </html>
  );
}
