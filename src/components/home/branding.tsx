"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck, Award, Truck } from "lucide-react";

export function Branding() {
    return (
        <section className="relative w-full overflow-hidden bg-[#0A0C10]">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_bottom_left,rgba(24,119,242,0.05),transparent_70%)] pointer-events-none" />
            
            <div className="container mx-auto px-[10px] relative z-10 pt-[5px] pb-0">
                <div className="flex flex-col lg:flex-row items-end gap-8 lg:gap-12">
                    
                    {/* LEFT CONTENT */}
                    <div className="flex-1 text-center lg:text-left space-y-4 pb-10 lg:pb-16">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            
                            <h1 className="text-[2.17rem] md:text-[3.105rem] font-serif text-white leading-tight py-5">
                                HINDUSTAN ELEMENTS
                            </h1>
                            <p className="text-gray-400 text-[1.035rem] md:text-[1.1385rem] max-w-xl mx-auto lg:mx-0 mt-[0.5175rem] leading-relaxed">
                                Elevating infrastructure with premium building materials and state-of-the-art engineering solutions.
                            </p>
                        </motion.div>

                        {/* Trust Badges */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex flex-wrap justify-center lg:justify-start gap-[1.5525rem] md:gap-[2.5875rem] pt-[0.5175rem]"
                        >
                            <div className="flex items-center gap-[0.776rem] text-gray-300">
                                <div className="p-[0.647rem] rounded-xl bg-white/5 border border-white/10">
                                    <ShieldCheck className="h-[1.294rem] w-[1.294rem] text-blue-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[1.035rem] font-bold text-white">Certified</p>
                                    <p className="text-[10.35px] text-gray-500 uppercase tracking-tighter">Quality Assured</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-[0.776rem] text-gray-300">
                                <div className="p-[0.647rem] rounded-xl bg-white/5 border border-white/10">
                                    <Award className="h-[1.294rem] w-[1.294rem] text-blue-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[1.035rem] font-bold text-white">Premium</p>
                                    <p className="text-[10.35px] text-gray-500 uppercase tracking-tighter">Builder Grade</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-[0.776rem] text-gray-300">
                                <div className="p-[0.647rem] rounded-xl bg-white/5 border border-white/10">
                                    <Truck className="h-[1.294rem] w-[1.294rem] text-blue-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[1.035rem] font-bold text-white">Pan India</p>
                                    <p className="text-[10.35px] text-gray-500 uppercase tracking-tighter">Fast Delivery</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT IMAGE SECTION */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 relative flex justify-end items-end"
                    >
                        <div className="relative z-10 w-full max-w-[420px] group hidden md:block">
                            <Image
                                src="/images/products/suman.png"
                                alt="Hindustan Elements Showcase"
                                width={420}
                                height={400}
                                className="w-full h-auto object-contain object-bottom block"
                                priority
                            />
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
