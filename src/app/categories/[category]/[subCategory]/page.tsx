"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CategoryCard } from "@/components/ui/category-card";
import {
  findCategoryBySlug,
  findSubCategoryBySlug,
  isLeafCategory,
} from "@/lib/category-helpers";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import Link from "next/link";

const slideIn = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export default function SubCategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const subCategorySlug = params.subCategory as string;

  const parentCategory = findCategoryBySlug(categorySlug);
  const subCategory = parentCategory
    ? findSubCategoryBySlug(parentCategory, subCategorySlug)
    : undefined;

  if (!parentCategory || !subCategory) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 pb-20">
          <div className="container py-32 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Subcategory Not Found
            </h1>
            <p className="text-gray-500 mb-8">
              The subcategory you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link
              href={parentCategory ? `/categories/${categorySlug}` : "/categories"}
              className="inline-flex items-center gap-2 bg-[#1877F2] text-white px-6 py-3 rounded-full font-bold hover:bg-[#0d47a1] transition-colors"
            >
              {parentCategory ? `Back to ${parentCategory.name}` : "Browse All Categories"}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const children = subCategory.subCategories || [];

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
                { label: parentCategory.name, href: `/categories/${categorySlug}` },
                { label: subCategory.name },
              ]}
            />
            <ScrollReveal direction="up">
              <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">
                Explore {subCategory.name}
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.15}>
              <p className="text-white/80 mt-2 text-sm">
                Choose a model in {subCategory.name}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Children Grid */}
        <div className="container py-12">
          {children.length > 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={slideIn}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {children.map((child, i) => {
                // At this depth, children are always leaf nodes linking to product pages
                const href = isLeafCategory(child)
                  ? `/category/${child.slug}`
                  : `/category/${child.slug}`;

                return (
                  <CategoryCard
                    key={child.slug}
                    name={child.name}
                    image={child.image}
                    href={href}
                    index={i}
                  />
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-6">No further subcategories available.</p>
              <Link
                href={`/category/${subCategory.slug}`}
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
