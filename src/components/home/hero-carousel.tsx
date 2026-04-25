"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Phone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  contextImage: string;
  cta: string;
  ctaLink: string;
  color: string;
  highlight: string;
  priceRange: string;
  status: string;
  order: number;
}

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

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [heroError, setHeroError] = useState(false);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef(0);

  const fetchSlides = useCallback(() => {
    setHeroLoading(true);
    setHeroError(false);
    fetch("/api/heroslides")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setHeroSlides(d.data || []);
        } else {
          setHeroError(true);
        }
      })
      .catch(() => setHeroError(true))
      .finally(() => setHeroLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSlides();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSlides]);

  const startSlideTimer = useCallback(() => {
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    slideTimerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentSlide(prev => (prev + 1) % Math.max(1, heroSlides.length));
    }, 5000);
  }, [heroSlides.length]);

  useEffect(() => {
    startSlideTimer();
    return () => { if (slideTimerRef.current) clearInterval(slideTimerRef.current); };
  }, [startSlideTimer]);

  const goToSlide = (i: number) => {
    setDirection(i > currentSlide ? 1 : -1);
    setCurrentSlide(i);
    startSlideTimer();
  };

  const nextSlide = () => heroSlides.length > 0 && goToSlide((currentSlide + 1) % heroSlides.length);
  const prevSlide = () => heroSlides.length > 0 && goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);

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

  if (heroLoading) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1877F2] min-h-[480px] md:min-h-[600px] flex items-center justify-center">
        <div className="container relative z-10 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 order-2 lg:order-1">
              <div className="h-6 w-40 rounded-full bg-white/20 animate-pulse" />
              <div className="h-12 w-3/4 rounded-xl bg-white/20 animate-pulse" />
              <div className="h-5 w-2/4 rounded-xl bg-white/10 animate-pulse" />
              <div className="h-4 w-full rounded-xl bg-white/10 animate-pulse" />
              <div className="h-4 w-5/6 rounded-xl bg-white/10 animate-pulse" />
              <div className="flex gap-3 mt-6">
                <div className="h-11 w-40 rounded-full bg-white/30 animate-pulse" />
                <div className="h-11 w-36 rounded-full bg-white/10 animate-pulse" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-square max-w-md mx-auto rounded-3xl bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (heroError) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1877F2] min-h-[360px] flex items-center justify-center">
        <div className="text-center text-white px-6">
          <p className="text-5xl mb-4">⚠️</p>
          <h2 className="text-xl font-bold mb-2">Unable to load hero content</h2>
          <p className="text-white/70 text-sm mb-5">Please check your connection and try again.</p>
          <button
            onClick={fetchSlides}
            className="bg-white text-[#1877F2] font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors"
          >Retry</button>
        </div>
      </section>
    );
  }

  if (heroSlides.length === 0) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1877F2] min-h-[360px] flex items-center justify-center">
        <div className="text-center text-white px-6">
          <p className="text-5xl mb-4">🎠</p>
          <h2 className="text-xl font-bold mb-2">Hero slides coming soon</h2>
          <p className="text-white/70 text-sm">Configure slides from the admin panel to display here.</p>
        </div>
      </section>
    );
  }

  const slide = heroSlides[currentSlide];

  return (
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
            {heroSlides.map((_, i) => (
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
  );
}

