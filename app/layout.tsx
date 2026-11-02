import type { Metadata } from "next";
import { EB_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Footer from "@/components/Footer";
import MotionProvider from "@/components/MotionProvider";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://program-builder-gamma.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "One sentence in. A complete grant program out.",
  description: "A work sample for Submittable by Paul Millar.",
  openGraph: {
    title: "One sentence in. A complete grant program out.",
    description: "A work sample for Submittable by Paul Millar.",
    url: siteUrl,
    siteName: "Program Builder",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "One sentence in. A complete grant program out.",
    description: "A work sample for Submittable by Paul Millar.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${ebGaramond.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-milk-white text-deep-blue">
        <MotionProvider>
          <div className="flex-1">{children}</div>
          <Footer />
        </MotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
