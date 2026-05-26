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
  title: {
    default: "Elements - Premium Home Décor & Construction | Hindustan Elements",
    template: "%s | Elements by Hindustan",
  },

  description:
    "Shop premium kitchen sinks, tiles, flooring, elevation panels, and construction materials at Elements by Hindustan.",

  keywords: [
    "kitchen sinks",
    "elevation panels",
    "home decor",
    "construction materials",
    "builder supplies",
    "Elements Hindustan",
    "Terracota products",
    "clay jali",
    "Artificial grass",
    "Aluimium tankcovers",
    "Manhole covers",
    "Tile Adhesive",
    "Clips & Spacers"
  ],

  openGraph: {
    title: "Elements - Premium Home Décor & Construction",
    description:
      "Premium quality home décor and construction materials for modern homes.",
    type: "website",
    siteName: "Hindustan Elements",
    url: "https://hindustanelements.com/",
  },

  twitter: {
    card: "summary_large_image",
    title: "Elements by Hindustan",
    description: "Premium home décor & construction materials",
  },

  alternates: {
    canonical: "https://hindustanelements.com/"
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


