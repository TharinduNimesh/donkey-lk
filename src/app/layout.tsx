import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BrandSync - Connect Influencers with Brands",
  description: "BrandSync is a social media monetization platform connecting influencers with brands for authentic content promotion and growth.",
  openGraph: {
    title: "BrandSync - Connect Influencers with Brands",
    description: "Connect with top influencers and brands to grow your social media presence and monetize your content.",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: "BrandSync Platform Preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BrandSync - Connect Influencers with Brands",
    description: "Connect with top influencers and brands to grow your social media presence and monetize your content.",
    images: ["/og-image.webp"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
