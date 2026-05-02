import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface CategoryCardProps {
  name: string;
  image: string;
  href: string;
  index?: number;
  productCount?: number;
}

export function CategoryCard({ name, image, href, index = 0, productCount }: CategoryCardProps) {
  return (
    <motion.div
      transition={{ delay: index * 0.05 }}
      className="w-full h-full"
    >
      <Link
        href={href}
        className="group cursor-pointer block relative overflow-hidden rounded-2xl bg-white shadow-sm border hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 h-full"
      >
        <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        <div className="p-2 flex items-center justify-between bg-white group-hover:bg-gray-50 transition-colors">
          <div className="flex-1 pr-2">
            <h3 className="font-bold text-sm md:text-base text-gray-900 leading-tight">
              {name}
            </h3>
            {productCount !== undefined && productCount > 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5">{productCount} Products</p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-[#1877F2] group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </motion.div>
  );
}
