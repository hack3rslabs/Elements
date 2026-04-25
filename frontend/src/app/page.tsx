"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/ui/mobile-nav";
import { useState, useEffect } from "react";
import { Branding } from "@/components/home/branding";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { ProductShowcase } from "@/components/home/product-showcase";
import { CategorySection } from "@/components/home/category-section";
import { RemainingContent } from "@/components/home/remaining-content";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  image?: string;
  images?: string[];
  categoryName: string;
  parentCategory: string;
  rating: number;
  reviewCount: number;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  shortDescription?: string;
  tags?: string[];
}

export default function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/products?limit=50")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          // Deduplicate products by ID to ensure a clean display
          const uniqueProducts = Array.from(
            new Map(d.data.map((p: Product) => [p.id, p])).values()
          ) as Product[];
          setAllProducts(uniqueProducts);
        }
      })
      .catch(() => { });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* 1. Slides */}
        {/* <HeroCarousel /> */}
        <Branding />

        {/* 3. Shop by Category */}
        <CategorySection products={allProducts} />

        {/* 2. Products
        <ProductShowcase products={allProducts} />    */}

        {/* 4. Remaining Content */}
        <RemainingContent />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
