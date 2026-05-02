"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { isLeafCategory } from "@/lib/category-helpers";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  categoryName: string;
  parentCategory: string;
}

import { CATEGORIES } from "@/constants/categories";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const slideIn = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
};

export function CategorySection({ products }: { products: Product[] }) {
  const categories = CATEGORIES;

  return (
    <section className="py-1 md:py-1 bg- min-h-[600px]">
      <div className="container">
        <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} className="text-center mb-10 md:mb-14">
          <div className="flex items-center justify-center gap-4 mb-4 h-8">
            {/* No back button needed — navigation is URL-based now */}
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1E]">
            Explore by Category
          </h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-lg">
            Find exactly what you need for your project
          </p>
        </motion.div>

        <motion.div 
          key="root"
          initial="hidden" 
          animate="visible" 
          variants={slideIn}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {categories.map((category, i) => {
            const productCount = products.filter(p => 
              p.parentCategory?.toLowerCase() === category.name.toLowerCase() || 
              p.categoryName?.toLowerCase() === category.name.toLowerCase() ||
              p.slug?.includes(category.slug)
            ).length;

            // If leaf category, link to product listing; otherwise to subcategory browser
            const href = isLeafCategory(category)
              ? `/category/${category.slug}`
              : `/categories/${category.slug}`;

            return (
              <motion.div 
                key={category.slug} 
                transition={{ delay: i * 0.05 }}
                className="w-full h-full"
              >
                <Link 
                  href={href}
                  className="group cursor-pointer block relative overflow-hidden rounded-2xl bg-white shadow-sm border hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 h-full"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-2 flex items-center justify-between bg-white group-hover:bg-gray-50 transition-colors">
                    <div className="flex-1 pr-2">
                      <h3 className="font-bold text-sm md:text-base text-gray-900 leading-tight">
                        {category.name}
                      </h3>
                      {productCount > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{productCount} Products</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#1877F2] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
