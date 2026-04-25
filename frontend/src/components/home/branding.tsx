"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck, Award, Truck } from "lucide-react";

export function Branding() {
    return (
        <section className="relative w-full overflow-hidden bg-[#0A0C10] ">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_bottom_left,rgba(24,119,242,0.05),transparent_70%)] pointer-events-none" />
            
            <div className="container mx-auto px-1 md:px-2 relative z-10 py-4 lg:py-6">
                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
                    
                    {/* LEFT CONTENT */}
                    <div className="flex-1 text-center lg:text-left space-y-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="inline-block px-1  rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
                                Premium Quality Since 2009
                            </span>
                            <h1 className="text-lg md:text-5xl font-extrabold text-white leading-tight">
                                HINDUSTAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">ELEMENTS</span>
                            </h1>
                            <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto lg:mx-0 mt-4 leading-relaxed">
                                Elevating infrastructure with premium building materials and state-of-the-art engineering solutions.
                            </p>
                        </motion.div>

                        {/* Trust Badges */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex flex-wrap justify-center lg:justify-start gap-6 md:gap-10 pt-2"
                        >
                            <div className="flex items-center gap-3 text-gray-300">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Certified</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Quality Assured</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                    <Award className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Premium</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Builder Grade</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                    <Truck className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Pan India</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Fast Delivery</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT IMAGE SECTION */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="flex-1 relative"
                    >
                        {/* Decorative Glow */}
                        <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full" />
                        
                        <div className="relative z-10 w-full max-w-[320px] mx-auto aspect-[10/10] group">
                            <div className="absolute inset-0 border-2 border-white/5 rounded-3xl group-hover:border-blue-500/30 transition-colors duration-500" />
                            <Image
                                src="/images/products/suman.png"
                                alt="Hindustan Elements Showcase"
                                fill
                                className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                        </div>

                        
                    </motion.div>

                </div>
            </div>
        </section>
    );
}