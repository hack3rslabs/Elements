import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/ui/mobile-nav";
import { Branding } from "@/components/home/branding";
import { CategorySection } from "@/components/home/category-section";
import { RemainingContent } from "@/components/home/remaining-content";
import { ProductShowcase } from "@/components/home/product-showcase";
import { prisma } from "@/lib/prisma";
import { toProductDTO } from "@/lib/api/helpers";

// Always fetch fresh data - no caching
export const dynamic = 'force-dynamic';

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

async function getInitialProducts(): Promise<Product[]> {
  if (!prisma) return [];
  try {
    const products = await prisma.product.findMany({
      take: 200,
      include: { category: { include: { parent: true } }, reviews: true },
      orderBy: { createdAt: 'desc' }
    });
    return products.map(toProductDTO);
  } catch (e) {
    console.error("Error fetching products:", e);
    return [];
  }
}

export default async function Home() {
  const allProducts = await getInitialProducts();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* 1. Slides */}
        {/* <HeroCarousel /> */}
        <Branding />

        {/* 3. Shop by Category */}
        <CategorySection products={allProducts} />

        {/* 2. Products */}
        <ProductShowcase products={allProducts} />   

        {/* 4. Remaining Content */}
        <RemainingContent />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

