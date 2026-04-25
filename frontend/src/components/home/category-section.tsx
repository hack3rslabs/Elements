"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  categoryName: string;
  parentCategory: string;
}

import { CATEGORIES, Category } from "@/constants/categories";

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
  const [path, setPath] = useState<Category[]>([]);
  const router = useRouter();

  const categories = CATEGORIES;

  const handleCategoryClick = (category: Category) => {
    if (category.subCategories && category.subCategories.length > 0) {
      setPath(prev => [...prev, category]);
    } else {
      router.push(`/category/${category.slug}`);
    }
  };

  const handleBack = () => {
    setPath(prev => prev.slice(0, -1));
  };

  const currentLevel = path.length > 0 ? path[path.length - 1] : null;
  const displayedCategories = currentLevel ? currentLevel.subCategories! : categories;

  return (
    <section className="py-3 md:py-7 bg- min-h-[600px]">
      <div className="container">
        <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} className="text-center mb-10 md:mb-14">
          <div className="flex items-center justify-center gap-4 mb-4 h-8">
            <AnimatePresence>
              {path.length > 0 && (
                <motion.button 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm font-bold text-[#1877F2] hover:text-[#0d47a1] transition-colors bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back {path.length > 1 ? "to " + path[path.length - 2].name : "to Categories"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1E]">
            {currentLevel ? `Explore ${currentLevel.name}` : "Explore by Category"}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-lg">
            {currentLevel ? `Choose a ${path.length === 1 ? 'sub-category' : 'model'} in ${currentLevel.name}` : "Find exactly what you need for your project"}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={currentLevel ? currentLevel.slug : "root"}
            initial="hidden" 
            animate="visible" 
            exit="exit"
            variants={slideIn}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {displayedCategories.map((category, i) => {
              const productCount = products.filter(p => 
                p.parentCategory?.toLowerCase() === category.name.toLowerCase() || 
                p.categoryName?.toLowerCase() === category.name.toLowerCase() ||
                p.slug?.includes(category.slug)
              ).length;

              return (
                <motion.div 
                  key={category.slug} 
                  transition={{ delay: i * 0.05 }}
                  className="w-full h-full"
                >
                  <div 
                    onClick={() => handleCategoryClick(category)}
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
                    <div className="p-4 flex items-center justify-between bg-white group-hover:bg-gray-50 transition-colors">
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
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

