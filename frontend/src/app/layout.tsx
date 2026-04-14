import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { GlobalWidgets } from "@/components/layout/global-widgets";
import { AnalyticsHead } from "@/components/analytics/analytics-head";
import { AuthProvider } from "@/components/providers/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Elements - Premium Home Décor & Construction | Hindustan Elements",
  description: "Elements (Hindustan Elements) - Your trusted partner for premium kitchen sinks, flooring, elevation panels, and designer tiles. Quality products for modern homes.",
  keywords: "kitchen sinks, floor guard, tiles, elevation panels, mitti magic, home decor, construction materials, builder supplies",
  openGraph: {
    title: "Elements - Premium Home Décor & Construction",
    description: "Shop premium kitchen sinks, flooring, elevation, and tiles at Elements by Hindustan.",
    type: "website",
    siteName: "Elements by Hindustan",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <AnalyticsHead />
          <StoreProvider>
            {children}
            <GlobalWidgets />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
