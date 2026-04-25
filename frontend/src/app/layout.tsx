import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { GlobalWidgets } from "@/components/layout/global-widgets";
import { AnalyticsHead } from "@/components/analytics/analytics-head";
import { AuthProvider } from "@/components/providers/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <AnalyticsHead />
          <StoreProvider>

          
            <div className="min-h-screen flex flex-col">
              
              {/* FULL WIDTH HEADER (keep outside container if needed) */}
              {/* If header inside pages, ignore this */}

              {/* CENTERED CONTENT */}
              <main className="flex-1">
              {children}
              </main>

              {/* Optional Footer */}
              {/* <Footer /> */}

            </div>

            <GlobalWidgets />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

