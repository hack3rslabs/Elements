"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/ui/mobile-nav";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, ShieldCheck, Truck, Headphones, Award, ChevronRight, ChevronLeft, Send, Phone, MapPin, Users, Play, MessageCircle, Sparkles, CheckCircle2, Eye, ShoppingCart } from "lucide-react";
import { useStore } from "@/lib/store";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

// Hero slides with product-in-context visualization
const HERO_SLIDES = [
  {
    title: "Premium Kitchen Sinks",
    subtitle: "304-Grade Stainless Steel",
    description: "Durable, rust-resistant sinks designed for modern Indian kitchens. Perfect for builders & homeowners.",
    image: "/images/products/kicjen sunk 1.webp",
    contextImage: "/images/products/k s 2.jpg",
    cta: "Explore Kitchen Sinks",
    ctaLink: "/category/kitchen",
    color: "from-[#0a192f] via-[#112240] to-[#1877F2]",
    highlight: "🏆 Premium Choice — ISO Certified",
    priceRange: "₹4,999 - ₹12,499",
  },
  {
    title: "Mitti Magic Elevation",
    subtitle: "Handcrafted Terracotta Panels",
    description: "Transform your building facade with natural clay panels. 25-year warranty. Loved by architects & builders.",
    image: "/images/products/miti mag 2.webp",
    contextImage: "/images/products/mitti magic.png",
    cta: "View Elevation Panels",
    ctaLink: "/category/elevation",
    color: "from-[#2d1109] via-[#5d2a1a] to-[#c2410c]",
    highlight: "🏗️ Architect Preferred",
    priceRange: "₹1,899 - ₹3,299",
  },
  {
    title: "Floor Guard Sheets",
    subtitle: "Industrial-Grade Protection",
    description: "Anti-slip PVC & rubber flooring solutions for kitchens, garages, and commercial spaces.",
    image: "/images/products/floor gaurd.png",
    contextImage: "/images/products/floor gaurd.png",
    cta: "Shop Floor Guard",
    ctaLink: "/category/flooring",
    color: "from-[#062016] via-[#0f3d2a] to-[#10b981]",
    highlight: "💪 Industrial Strength",
    priceRange: "₹899 - ₹1,499",
  },
  {
    title: "Designer Tiles",
    subtitle: "Digital Printed & Vitrified",
    description: "HD digital printed tiles in stunning patterns. Moroccan, marble, mosaic — transform any wall or floor.",
    image: "/images/products/mm 3.webp",
    contextImage: "/images/products/mm 3.webp",
    cta: "Browse Tile Collection",
    ctaLink: "/category/tiles",
    color: "from-[#1e1b4b] via-[#312e81] to-[#6366f1]",
    highlight: "🎨 Modern Aesthetics",
    priceRange: "₹75 - ₹350 per tile",
  },
];

// Recent purchase notifications
const RECENT_PURCHASES = [
  { name: "Rajesh K.", city: "Delhi", product: "Kitchen Sink", time: "2 min ago" },
  { name: "Amit P.", city: "Mumbai", product: "Floor Guard", time: "5 min ago" },
  { name: "Priya S.", city: "Ahmedabad", product: "Mitti Magic Panel", time: "12 min ago" },
  { name: "Suresh R.", city: "Bangalore", product: "Moroccan Tiles", time: "18 min ago" },
  { name: "Kavita N.", city: "Pune", product: "Granite Sink", time: "25 min ago" },
  { name: "Vikram J.", city: "Jaipur", product: "Wall Tiles", time: "32 min ago" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: { duration: 0.3 },
  }),
};

export default function Home() {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [recentPurchaseIdx, setRecentPurchaseIdx] = useState(0);
  const [showPurchaseNotif, setShowPurchaseNotif] = useState(false);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef(0);

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

  // Auto-advance hero slides
  const startSlideTimer = useCallback(() => {
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    slideTimerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
  }, []);

  useEffect(() => {
    startSlideTimer();
    return () => { if (slideTimerRef.current) clearInterval(slideTimerRef.current); };
  }, [startSlideTimer]);

  // Recent purchase notification cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setShowPurchaseNotif(true);
      setTimeout(() => {
        setShowPurchaseNotif(false);
        setRecentPurchaseIdx(prev => (prev + 1) % RECENT_PURCHASES.length);
      }, 4000);
    }, 8000);
    // Show first one after 3 seconds
    const firstTimer = setTimeout(() => {
      setShowPurchaseNotif(true);
      setTimeout(() => setShowPurchaseNotif(false), 4000);
    }, 3000);
    return () => { clearInterval(timer); clearTimeout(firstTimer); };
  }, []);

  const goToSlide = (idx: number) => {
    setDirection(idx > currentSlide ? 1 : -1);
    setCurrentSlide(idx);
    startSlideTimer();
  };

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    startSlideTimer();
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    startSlideTimer();
  };

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  const handleSubscribe = async () => {
    if (!email) return;
    try {
      await fetch("http://localhost:5000/api/newsletter", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubscribed(true);
      setEmail("");
    } catch { /* silent */ }
  };

  const bestSellers = allProducts.filter(p => p.isBestSeller);
  const newArrivals = allProducts.filter(p => p.isNewArrival);

  const categories = [
    { name: "Kitchen Sinks", image: "/images/products/kicjen sunk 1.webp", link: "/category/kitchen", desc: "Premium steel & granite sinks", count: `${allProducts.filter(p => p.parentCategory === 'Kitchen').length} Products`, icon: "🍳" },
    { name: "Flooring", image: "/images/products/floor gaurd.png", link: "/category/flooring", desc: "Floor guard sheets & mats", count: `${allProducts.filter(p => p.parentCategory === 'Flooring').length} Products`, icon: "🏠" },
    { name: "Elevation", image: "/images/products/miti mag 2.webp", link: "/category/elevation", desc: "Mitti magic terracotta panels", count: `${allProducts.filter(p => p.parentCategory?.includes('Elevation')).length} Products`, icon: "🏗️" },
    { name: "Tiles", image: "/images/products/mm 3.webp", link: "/category/tiles", desc: "Designer printed & vitrified tiles", count: `${allProducts.filter(p => p.parentCategory === 'Tiles').length} Products`, icon: "🎨" },
  ];

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* ============ HERO PRODUCT CAROUSEL ============ */}
        <section
          className={`relative overflow-hidden transition-all duration-700`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Animated Background */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 bg-gradient-to-br ${slide.color}`}
            />
          </AnimatePresence>

          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-white/5 blur-3xl"></div>
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:30px_30px]"></div>
          </div>

          <div className="container relative z-10 py-12 md:py-20 lg:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Content */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`content-${currentSlide}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="text-white order-2 lg:order-1"
                >
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium mb-4">
                    <Sparkles className="h-3.5 w-3.5" /> {slide.highlight}
                  </span>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                    {slide.title}
                    <span className="block text-lg sm:text-xl md:text-2xl font-medium text-white/70 mt-2">{slide.subtitle}</span>
                  </h1>
                  <p className="mt-4 text-sm md:text-base text-white/80 leading-relaxed max-w-lg">
                    {slide.description}
                  </p>
                  <div className="mt-3 text-lg md:text-xl font-bold text-white/90">
                    {slide.priceRange}
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6 h-11 md:h-12 rounded-full shadow-xl text-sm md:text-base" asChild>
                      <Link href={slide.ctaLink}>
                        {slide.cta} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <a
                      href="tel:+919876543210"
                      className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-full h-11 md:h-12 px-6 text-sm font-medium hover:bg-white/20 transition-colors"
                    >
                      <Phone className="h-4 w-4" /> Call for Details
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Right - Product Images */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`image-${currentSlide}`}
                  custom={direction}
                  initial={{ opacity: 0, scale: 0.85, x: 100 }}
                  animate={{ opacity: 1, scale: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }}
                  exit={{ opacity: 0, scale: 0.85, x: -100, transition: { duration: 0.3 } }}
                  className="relative order-1 lg:order-2"
                >
                  <Link href={slide.ctaLink} className="block relative group/image cursor-pointer">
                    {/* Main product image */}
                    <div className="relative aspect-[4/3] md:aspect-square max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover/image:scale-105"
                        priority
                      />
                      {/* "See it in your home" overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-white/80" />
                          <span className="text-xs text-white/80 font-medium">See how it looks applied →</span>
                        </div>
                      </div>
                    </div>
                    {/* Context/applied preview (floating) */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="absolute -bottom-4 -right-2 md:-right-6 w-32 md:w-40 aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-2xl z-20 group-hover/image:scale-110 transition-transform"
                    >
                      <Image
                        src={slide.contextImage}
                        alt={`${slide.title} applied view`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                        <span className="text-white text-[9px] md:text-[10px] font-medium">Applied View</span>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slide Controls */}
            <div className="flex items-center justify-between mt-8 md:mt-12">
              {/* Dots */}
              <div className="flex items-center gap-2">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`transition-all duration-300 rounded-full ${i === currentSlide
                      ? 'w-8 h-3 bg-white'
                      : 'w-3 h-3 bg-white/30 hover:bg-white/50'
                      }`}
                  />
                ))}
              </div>
              {/* Arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  aria-label="Previous slide"
                  className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Next slide"
                  className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="mt-6 grid grid-cols-4 gap-4 md:gap-8 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              {[
                { value: "15+", label: "Years in Market", highlight: true },
                { value: "500+", label: "Products", highlight: false },
                { value: "10K+", label: "Happy Customers", highlight: false },
                { value: "50+", label: "Cities Served", highlight: false },
              ].map((stat) => (
                <div key={stat.label} className={`text-center ${stat.highlight ? 'text-amber-300' : 'text-white'}`}>
                  <div className={`text-lg md:text-2xl font-bold ${stat.highlight ? 'text-amber-300' : ''}`}>{stat.value}</div>
                  <div className={`text-[10px] md:text-xs ${stat.highlight ? 'text-amber-300/70 font-semibold' : 'text-white/60'}`}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TRUST BAR ============ */}
        <section className="bg-white py-4 border-b">
          <div className="container">
            <div className="flex items-center justify-center gap-6 md:gap-12 overflow-x-auto whitespace-nowrap text-xs md:text-sm text-muted-foreground">
              {[
                { icon: Award, text: "15+ Years in the Market", highlight: true },
                { icon: ShieldCheck, text: "ISO Certified", highlight: false },
                { icon: Truck, text: "Free Delivery ₹5K+", highlight: false },
                { icon: Headphones, text: "Expert Support", highlight: false },
                { icon: Phone, text: "Call: +91 98765 43210", highlight: false },
              ].map(item => (
                <div key={item.text} className={`flex items-center gap-1.5 shrink-0 ${item.highlight ? 'text-amber-600 font-bold' : ''}`}>
                  <item.icon className={`h-4 w-4 ${item.highlight ? 'text-amber-500' : 'text-[#1877F2]'}`} />
                  <span className={item.highlight ? '' : 'font-medium'}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ ALL PRODUCTS SHOWCASE ============ */}
        <section className="py-12 md:py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} className="text-center mb-10 md:mb-14">
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1E]">Our Products</h2>
              <p className="text-muted-foreground mt-2 md:mt-3 text-sm md:text-lg">Explore our complete range — tap any product for full details</p>
            </motion.div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {allProducts.map((product, i) => (
                <motion.div key={product.id} initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.05, 0.3) }}>
                  <ProductCard product={product} onAddToCart={() => addToCart(product.id)} onToggleWishlist={() => toggleWishlist(product.id)} isWishlisted={isInWishlist(product.id)} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CATEGORIES ============ */}
        <section className="py-12 md:py-20 bg-white">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} className="text-center mb-10 md:mb-14">
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1E]">Shop by Category</h2>
              <p className="text-muted-foreground mt-2 text-sm md:text-lg">Find exactly what you need for your project</p>
            </motion.div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {categories.map((category, i) => (
                <motion.div key={category.name} initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Link href={category.link} className="group block relative overflow-hidden rounded-2xl bg-white shadow-sm border hover:shadow-xl transition-all duration-500">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      <div className="absolute top-3 left-3 text-2xl">{category.icon}</div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-base md:text-xl mb-0.5">{category.name}</h3>
                        <p className="text-xs text-white/80 hidden md:block">{category.desc}</p>
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">{category.count}</span>
                      <ChevronRight className="h-4 w-4 text-[#1877F2] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ WHY CHOOSE US ============ */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-[#f0f7ff] to-[#e7f3ff]">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} className="text-center mb-10 md:mb-14">
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Why Builders & Homeowners Choose Us</h2>
              <p className="text-muted-foreground mt-2 text-sm md:text-lg">Quality you can trust, support you can rely on</p>
            </motion.div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {[
                { icon: ShieldCheck, title: "Quality Assured", desc: "Every product undergoes rigorous quality testing. ISO certified.", color: "from-blue-500 to-blue-600" },
                { icon: Truck, title: "Free Delivery", desc: "Free shipping on orders above ₹5,000. Pan-India delivery.", color: "from-emerald-500 to-green-600" },
                { icon: Headphones, title: "Expert Support", desc: "Call anytime for product guidance, installation help, and sizing.", color: "from-purple-500 to-violet-600" },
                { icon: Award, title: "25 Yr Warranty", desc: "Up to 25 years warranty on products. Free replacement for defects.", color: "from-amber-500 to-orange-600" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-5 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 group text-center"
                >
                  <div className={`inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <h3 className="font-semibold text-sm md:text-lg mb-1.5">{item.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CONTACT CTA FOR BUILDERS ============ */}
        <section className="py-12 md:py-16 bg-[#0a0a0a] text-white">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#1877F2] font-semibold">For Builders & Contractors</span>
                <h2 className="text-2xl md:text-4xl font-bold mt-2">Need Bulk Pricing?</h2>
                <p className="text-gray-400 mt-3 text-sm md:text-base leading-relaxed">
                  We offer exclusive pricing for builders, contractors, architects, and construction companies. Get up to <span className="text-white font-semibold">15% off</span> on bulk orders with free site visit consultation.
                </p>
                <ul className="mt-4 space-y-2">
                  {["Special project pricing", "Free site visit & measurement", "Dedicated account manager", "Priority delivery & installation support"].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="font-semibold text-lg mb-4">Get In Touch</h3>
                <div className="space-y-3">
                  <a href="tel:+919876543210" className="flex items-center gap-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Call Us</p>
                      <p className="text-xs text-gray-400">+91 98765 43210</p>
                    </div>
                  </a>
                  <a href={`https://wa.me/919876543210?text=${encodeURIComponent("Hi! I need bulk pricing for my project.")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">WhatsApp</p>
                      <p className="text-xs text-gray-400">Quick response guaranteed</p>
                    </div>
                  </a>
                  <Link href="/contact" className="flex items-center gap-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                      <Send className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Send Inquiry</p>
                      <p className="text-xs text-gray-400">We respond within 2 hours</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ TESTIMONIALS ============ */}
        <section className="py-12 md:py-20 bg-white">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} className="text-center mb-10 md:mb-14">
              <h2 className="text-2xl md:text-4xl font-bold">What Customers Say</h2>
              <p className="text-muted-foreground mt-2 text-sm md:text-lg">Real reviews from builders, contractors & homeowners</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {[
                { name: "Rajesh Kumar", role: "Builder", location: "Delhi", rating: 5, text: "The stainless steel sink quality is absolutely premium. Have ordered 50+ units for my project. Great bulk pricing and delivery!", avatar: "RK" },
                { name: "Priya Sharma", role: "Homeowner", location: "Mumbai", rating: 5, text: "Mitti Magic elevation panels transformed my home exterior. Everyone compliments the traditional terracotta look. 25 year warranty gives peace of mind.", avatar: "PS" },
                { name: "Amit Patel", role: "Contractor", location: "Ahmedabad", rating: 5, text: "We use Elements tiles for all our projects. Consistent quality, excellent bulk rates, and the support team helps with measurements. Highly recommended for contractors!", avatar: "AP" },
              ].map((review, i) => (
                <motion.div
                  key={review.name}
                  initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-gray-50 rounded-2xl p-6 md:p-8 border"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {Array(review.rating).fill(0).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;{review.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0d47a1] flex items-center justify-center text-white font-semibold text-sm">
                      {review.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{review.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {review.location} • {review.role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ NEWSLETTER ============ */}
        <section className="py-12 md:py-20 bg-gradient-to-r from-[#1877F2] to-[#0d47a1]">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }} className="max-w-2xl mx-auto text-center text-white">
              <h2 className="text-2xl md:text-4xl font-bold mb-3">Stay Updated</h2>
              <p className="text-white/80 mb-6 text-sm md:text-lg">Get exclusive deals, new products, and builder tips.</p>
              {subscribed ? (
                <div className="bg-white/20 rounded-2xl p-6 backdrop-blur-sm">
                  <p className="text-xl font-semibold">🎉 Thank you for subscribing!</p>
                  <p className="text-white/80 mt-2">You&apos;ll receive our latest updates and offers.</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-12 rounded-full px-5 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white shadow-xl"
                  />
                  <Button onClick={handleSubscribe} size="lg" className="bg-white text-[#1877F2] hover:bg-gray-100 rounded-full h-12 px-6 font-semibold shadow-xl">
                    <Send className="h-4 w-4 mr-2" /> Subscribe
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileBottomNav />

      {/* ============ RECENT PURCHASE NOTIFICATION ============ */}
      <AnimatePresence>
        {showPurchaseNotif && (
          <motion.div
            initial={{ opacity: 0, x: -50, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="fixed bottom-20 md:bottom-6 left-4 md:left-24 z-[130] bg-white rounded-xl shadow-2xl border p-3 max-w-[280px]"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">
                  {RECENT_PURCHASES[recentPurchaseIdx].name} from {RECENT_PURCHASES[recentPurchaseIdx].city}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Purchased <span className="font-medium text-[#1877F2]">{RECENT_PURCHASES[recentPurchaseIdx].product}</span> • {RECENT_PURCHASES[recentPurchaseIdx].time}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ ENHANCED PRODUCT CARD ============
function ProductCard({ product, onAddToCart, onToggleWishlist, isWishlisted }: {
  product: Product;
  onAddToCart: () => void;
  onToggleWishlist: () => void;
  isWishlisted: boolean;
}) {
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const imageUrl = product.images?.[0] || product.image || '/images/products/kicjen sunk 1.webp';

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-xl transition-all duration-500">
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <Image src={imageUrl} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-md">
            {discount}% OFF
          </span>
        )}
        {product.isBestSeller && (
          <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] md:text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
            ⭐ BEST
          </span>
        )}
        {product.isNewArrival && !product.isBestSeller && (
          <span className="absolute top-2 right-2 bg-gradient-to-r from-[#1877F2] to-blue-600 text-white text-[9px] md:text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
            NEW
          </span>
        )}
        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Link href={`/product/${product.slug}`} className="bg-white rounded-full px-4 py-2 text-xs font-semibold shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-1">
            <Eye className="h-3 w-3" /> View Details
          </Link>
        </div>
        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleWishlist(); }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} stroke="currentColor" strokeWidth="2" fill={isWishlisted ? "currentColor" : "none"}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <div className="p-3 md:p-4">
        <p className="text-[10px] md:text-xs text-[#1877F2] font-medium uppercase tracking-wider mb-0.5">{product.categoryName}</p>
        <h3 className="font-medium text-xs md:text-sm leading-tight line-clamp-2 mb-1.5 min-h-[2rem] md:min-h-[2.5rem]">
          <Link href={`/product/${product.slug}`} className="hover:text-[#1877F2] transition-colors">{product.name}</Link>
        </h3>
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] md:text-xs font-medium">{product.rating}</span>
            <span className="text-[10px] text-muted-foreground">({product.reviewCount})</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-sm md:text-lg font-bold text-[#1C1C1E]">₹{product.price.toLocaleString("en-IN")}</span>
            {product.mrp > product.price && (
              <span className="text-[10px] md:text-xs text-muted-foreground line-through ml-1">₹{product.mrp.toLocaleString("en-IN")}</span>
            )}
          </div>
          <Button size="sm" onClick={(e) => { e.preventDefault(); onAddToCart(); }} className="bg-[#1877F2] hover:bg-[#0d47a1] rounded-full h-7 md:h-9 px-2.5 md:px-4 text-[10px] md:text-xs font-semibold shadow-md">
            <ShoppingCart className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {/* Contact shortcut on mobile */}
        <a
          href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi! I need details about: ${product.name}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 text-[10px] md:text-xs text-green-700 bg-green-50 rounded-full py-1.5 font-medium hover:bg-green-100 transition-colors"
        >
          <MessageCircle className="h-3 w-3" /> WhatsApp for Details
        </a>
      </div>
    </div>
  );
}
