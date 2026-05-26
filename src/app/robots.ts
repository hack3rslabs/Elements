import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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

    sitemap: "https://elements.com/sitemap.xml",
  };
}