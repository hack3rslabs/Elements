"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShieldCheck, Truck, Award, Users, Factory, Leaf, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { ScrollReveal, StaggerContainer, StaggerItem, AnimatedCounter } from "@/components/ui/scroll-reveal";
import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                {/* Banner with animated text */}
                <section className="relative bg-gradient-to-r from-[#0d47a1] to-[#1877F2] py-20 overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full animate-float-slow" />
                        <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full animate-float" style={{ animationDelay: '1s' }} />
                    </div>
                    <div className="container relative z-10 text-center text-white">
                        <ScrollReveal direction="down">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Hindustan Elements</h1>
                        </ScrollReveal>
                        <ScrollReveal direction="up" delay={0.2}>
                            <p className="text-white/80 text-lg max-w-2xl mx-auto">
                                Building India&apos;s homes with premium quality construction and d&eacute;cor products since founding.
                            </p>
                        </ScrollReveal>
                    </div>
                </section>

                {/* Story Section */}
                <section className="py-20 bg-white">
                    <div className="container">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <ScrollReveal direction="left">
                                <div>
                                    <span className="text-sm text-[#1877F2] font-semibold uppercase tracking-wider">Our Story</span>
                                    <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6 text-[#1C1C1E]">
                                        Crafting Quality for Modern Homes
                                    </h2>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        Hindustan Elements was born from a vision to make premium home construction products accessible to every Indian household. We believe that quality should never be a luxury.
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        From our flagship range of stainless steel kitchen sinks to our innovative Mitti Magic terracotta elevation panels, every product is designed with attention to detail, durability, and aesthetics.
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Today, we proudly serve 10,000+ homeowners, architects, and builders across India, delivering products that elevate every living space they touch.
                                    </p>
                                </div>
                            </ScrollReveal>
                            <ScrollReveal direction="right" delay={0.2}>
                                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl img-hover-zoom">
                                    <Image
                                        src="/images/products/kicjen sunk 1.webp"
                                        alt="About Hindustan Elements"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </section>

                {/* Values — staggered animated cards */}
                <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
                    <div className="container">
                        <ScrollReveal className="text-center mb-14">
                            <h2 className="text-3xl md:text-4xl font-bold">Our Values</h2>
                            <p className="text-muted-foreground mt-3 text-lg">What drives us every day</p>
                        </ScrollReveal>
                        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" staggerDelay={0.12}>
                            {[
                                { icon: ShieldCheck, title: "Uncompromising Quality", desc: "Every product undergoes rigorous quality testing. We only sell products we would use in our own homes.", color: "from-blue-500 to-blue-600" },
                                { icon: Factory, title: "Indian Manufacturing", desc: "Proudly made in India. We partner with the best manufacturers to bring world-class products at Indian prices.", color: "from-orange-500 to-amber-600" },
                                { icon: Leaf, title: "Sustainability", desc: "Eco-friendly materials and processes. Our Mitti Magic range uses 100% natural clay, promoting sustainable construction.", color: "from-green-500 to-emerald-600" },
                                { icon: Users, title: "Customer First", desc: "Your satisfaction is our priority. From pre-purchase guidance to post-installation support, we're with you.", color: "from-violet-500 to-purple-600" },
                                { icon: Award, title: "Certified Products", desc: "ISO certified manufacturing. Our products meet international quality standards and carry manufacturer warranties.", color: "from-yellow-500 to-amber-600" },
                                { icon: Truck, title: "Pan-India Delivery", desc: "We deliver across India with secure packaging. Free shipping on orders above ₹5,000.", color: "from-cyan-500 to-teal-600" },
                            ].map((item) => (
                                <StaggerItem key={item.title}>
                                    <div className="bg-white rounded-2xl p-8 shadow-sm border card-hover group h-full">
                                        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                                    </div>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    </div>
                </section>

                {/* Stats — animated counters */}
                <section className="py-20 bg-[#0a0a0a] text-white overflow-hidden">
                    <div className="container">
                        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8" staggerDelay={0.15}>
                            {[
                                { value: "500+", label: "Products" },
                                { value: "10,000+", label: "Happy Customers" },
                                { value: "50+", label: "Cities Served" },
                                { value: "25 Yrs", label: "Max Warranty" },
                            ].map((stat) => (
                                <StaggerItem key={stat.label}>
                                    <div className="text-center">
                                        <AnimatedCounter
                                            value={stat.value}
                                            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1877F2] to-blue-300 bg-clip-text text-transparent"
                                        />
                                        <p className="text-gray-400 mt-2">{stat.label}</p>
                                    </div>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    </div>
                </section>

                {/* Product Categories — alternating scroll reveals */}
                <section className="py-24 bg-white overflow-hidden">
                    <div className="container">
                        <ScrollReveal className="text-center mb-16">
                            <span className="text-[#1877F2] font-bold text-sm uppercase tracking-widest">Our Expertise</span>
                            <h2 className="text-3xl md:text-5xl font-bold mt-2">About Our Products</h2>
                            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">We specialize in four key areas of home construction and d&eacute;cor, ensuring every corner of your home reflects excellence.</p>
                        </ScrollReveal>

                        <div className="space-y-32">
                            {/* Kitchen */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                                <ScrollReveal direction="left">
                                    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl img-hover-zoom">
                                        <Image src="/images/products/kicjen sunk 1.webp" alt="Kitchen Sinks" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                            <div className="text-white">
                                                <p className="text-sm font-medium opacity-80">01 / Infrastructure</p>
                                                <h3 className="text-2xl font-bold">Kitchen Solutions</h3>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                                <ScrollReveal direction="right" delay={0.15}>
                                    <div>
                                        <h3 className="text-3xl font-bold mb-6">World-Class Kitchen Systems</h3>
                                        <p className="text-muted-foreground leading-relaxed mb-6">
                                            The kitchen is the heart of the home. Our kitchen range focuses on high-performance stainless steel sinks and heavy-duty granite composite basins.
                                        </p>
                                        <ul className="space-y-4">
                                            {["304 Grade Stainless Steel for lifelong rust protection", "Sound-dampening technology for quiet operation", "Nanofinish surfaces that resist stains and bacteria", "Heavy-duty brass fittings and designer faucets",
                                            ].map((item) => (
                                                <motion.li key={item} className="flex items-start gap-3 text-sm" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                                                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="h-3 w-3 text-blue-600" /></div>
                                                    <span>{item}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                </ScrollReveal>
                            </div>

                            {/* Flooring */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                                <ScrollReveal direction="right" className="lg:order-2">
                                    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl img-hover-zoom">
                                        <Image src="/images/products/floor gaurd.png" alt="Floor Protection" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                            <div className="text-white">
                                                <p className="text-sm font-medium opacity-80">02 / Protection</p>
                                                <h3 className="text-2xl font-bold">Innovative Flooring</h3>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                                <ScrollReveal direction="left" delay={0.15} className="lg:order-1">
                                    <div>
                                        <h3 className="text-3xl font-bold mb-6">Advanced Floor Protection</h3>
                                        <p className="text-muted-foreground leading-relaxed mb-6">
                                            Our revolutionary Floor Guard sheets have saved thousands of premium floors during construction. We provide both temporary protection and permanent flooring solutions.
                                        </p>
                                        <ul className="space-y-4">
                                            {["Heavy-duty PVC & Rubber protection sheets", "Bubble-guard technology for impact resistance", "Anti-slip surfaces for safety in work zones", "Reusable and eco-friendly materials",
                                            ].map((item) => (
                                                <motion.li key={item} className="flex items-start gap-3 text-sm" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                                                    <div className="h-5 w-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="h-3 w-3 text-orange-600" /></div>
                                                    <span>{item}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                </ScrollReveal>
                            </div>

                            {/* Mitti Magic */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                                <ScrollReveal direction="left">
                                    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl img-hover-zoom">
                                        <Image src="/images/products/miti mag 2.webp" alt="Mitti Magic" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                            <div className="text-white">
                                                <p className="text-sm font-medium opacity-80">03 / Artistry</p>
                                                <h3 className="text-2xl font-bold">Mitti Magic Elevation</h3>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                                <ScrollReveal direction="right" delay={0.15}>
                                    <div>
                                        <h3 className="text-3xl font-bold mb-6">The Soul of Clay: Mitti Magic</h3>
                                        <p className="text-muted-foreground leading-relaxed mb-6">
                                            Our signature Mitti Magic range brings the ancient wisdom of terracotta to modern facades. Handcrafted by artisans, these elevation panels offer natural thermal insulation.
                                        </p>
                                        <ul className="space-y-4">
                                            {["100% Natural Terracotta fired at 1100°C", "Naturally cools building exteriors", "UV resistant colors that never fade", "Handcrafted organic textures for unique facades",
                                            ].map((item) => (
                                                <motion.li key={item} className="flex items-start gap-3 text-sm" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                                                    <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="h-3 w-3 text-amber-600" /></div>
                                                    <span>{item}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                </ScrollReveal>
                            </div>

                            {/* Tiles */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                                <ScrollReveal direction="right" className="lg:order-2">
                                    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl img-hover-zoom">
                                        <Image src="/images/products/mm 3.webp" alt="Designer Tiles" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                            <div className="text-white">
                                                <p className="text-sm font-medium opacity-80">04 / Aesthetics</p>
                                                <h3 className="text-2xl font-bold">Designer Tiles</h3>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                                <ScrollReveal direction="left" delay={0.15} className="lg:order-1">
                                    <div>
                                        <h3 className="text-3xl font-bold mb-6">Precision Crafted Tiles</h3>
                                        <p className="text-muted-foreground leading-relaxed mb-6">
                                            From high-definition digital prints to heavy-duty vitrified porcelain, our tile collection is selected for both performance and visual storytelling.
                                        </p>
                                        <ul className="space-y-4">
                                            {["HD Digital Printing for realistic textures", "Low water absorption (<0.5%) for durability", "Large format tiles for seamless installations", "Exquisite Moroccan and Traditional patterns",
                                            ].map((item) => (
                                                <motion.li key={item} className="flex items-start gap-3 text-sm" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                                                    <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="h-3 w-3 text-purple-600" /></div>
                                                    <span>{item}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                </ScrollReveal>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

