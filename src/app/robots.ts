import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hindustanelements.com";
  
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/cart",
          "/checkout",
          "/login",
          "/wishlist",
          "/profile",
        ],
      },
    ],

    sitemap: `${baseUrl}/sitemap.xml`,
  };
}