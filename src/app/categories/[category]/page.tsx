"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CategoryCard } from "@/components/ui/category-card";
import { findCategoryBySlug, isLeafCategory } from "@/lib/category-helpers";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import Link from "next/link";

const slideIn = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const category = findCategoryBySlug(categorySlug);

  if (!category) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 pb-20">
          <div className="container py-32 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
            <p className="text-gray-500 mb-8">The category you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 bg-[#1877F2] text-white px-6 py-3 rounded-full font-bold hover:bg-[#0d47a1] transition-colors"
            >
              Browse All Categories
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const subCategories = category.subCategories || [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 pb-20">
        {/* Banner */}
        <section className="relative bg-gradient-to-r from-[#0d47a1] to-[#1877F2] py-5 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/products/k%20s%202.jpg')] bg-cover bg-center opacity-10"></div>
          <div className="container relative z-10 text-white">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Categories", href: "/categories" },
                { label: category.name },
              ]}
            />
            <ScrollReveal direction="up">
              <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">
                Explore {category.name}
              </h1>
            </ScrollReveal>
            {category.desc && (
              <ScrollReveal direction="up" delay={0.15}>
                <p className="text-white/80 mt-4 text-sm max-w-sm leading-relaxed">
                  {category.desc}
                </p>
              </ScrollReveal>
            )}
            <ScrollReveal direction="up" delay={0.25}>
              <p className="text-white/80 mt-2 text-sm">
                Choose a sub-category in {category.name}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Subcategory Grid */}
        <div className="container py-12">
          {subCategories.length > 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={slideIn}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {subCategories.map((sub, i) => {
                // If leaf subcategory, link to product listing; otherwise go deeper
                const href = isLeafCategory(sub)
                  ? `/category/${sub.slug}`
                  : `/categories/${categorySlug}/${sub.slug}`;

                return (
                  <CategoryCard
                    key={sub.slug}
                    name={sub.name}
                    image={sub.image}
                    href={href}
                    index={i}
                  />
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-6">No subcategories available.</p>
              <Link
                href={`/category/${category.slug}`}
                className="inline-flex items-center gap-2 bg-[#1877F2] text-white px-6 py-3 rounded-full font-bold hover:bg-[#0d47a1] transition-colors"
              >
                View Products
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
