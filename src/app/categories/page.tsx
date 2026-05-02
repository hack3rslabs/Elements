"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CategoryCard } from "@/components/ui/category-card";
import { CATEGORIES } from "@/constants/categories";
import { isLeafCategory } from "@/lib/category-helpers";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const slideIn = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export default function CategoriesPage() {
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
                { label: "Categories" },
              ]}
            />
            <ScrollReveal direction="up">
              <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">
                Explore by Category
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.15}>
              <p className="text-white/80 mt-4 text-sm max-w-sm leading-relaxed">
                Find exactly what you need for your project
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Category Grid */}
        <div className="container py-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={slideIn}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {CATEGORIES.map((category, i) => {
              // If leaf category, link directly to the product listing page
              const href = isLeafCategory(category)
                ? `/category/${category.slug}`
                : `/categories/${category.slug}`;

              return (
                <CategoryCard
                  key={category.slug}
                  name={category.name}
                  image={category.image}
                  href={href}
                  index={i}
                />
              );
            })}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
