"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Phone, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", type: "general" });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetch("/api/contact", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            setSubmitted(true);
        } catch { /* silent */ }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                {/* Banner */}
                <section className="relative bg-gradient-to-r from-[#0d47a1] to-[#1877F2] py-20 overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full animate-float" />
                        <div className="absolute bottom-5 left-20 w-40 h-40 bg-white rounded-full animate-float-slow" style={{ animationDelay: '1.5s' }} />
                    </div>
                    <div className="container relative z-10 text-center text-white">
                        <ScrollReveal direction="down">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
                        </ScrollReveal>
                        <ScrollReveal direction="up" delay={0.2}>
                            <p className="text-white/80 text-lg max-w-xl mx-auto">Have a question or need assistance? We&apos;re here to help you find the perfect products for your home.</p>
                        </ScrollReveal>
                    </div>
                </section>

                <div className="container py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Contact Info */}
                        <StaggerContainer className="space-y-6" staggerDelay={0.12}>
                            {[
                                { icon: MapPin, title: "Visakhapatnam Branch", info: "54-11-13/5, Bhanu Nagar Rd, GO Colony, Visakhapatnam", sub: "Andhra Pradesh 530017", href: "https://www.google.com/maps/place/Sree+Kameswari+Ceramics/@17.7417647,83.3245967,17z/data=!3m1!4b1!4m6!3m5!1s0x3a39432f1a682a31:0x23f216d34951248a!8m2!3d17.7417647!4d83.3245967!16s%2Fg%2F11fwhctm7z" },
                                { icon: MapPin, title: "Bangalore Branch", info: "Industrial Suburb, Yeswanthapur, Bengaluru Urban", sub: "Karnataka 560022", href: "https://www.google.com/maps/search/Hindustan+Elements+Yeswanthapur" },
                                { icon: MapPin, title: "Srikakulam Branch", info: "Registered Office, Srikakulam Heart of Town", sub: "Andhra Pradesh", href: "#" },
                                { icon: Phone, title: "Contact Numbers", info: "+91 98667 53070", sub: "Mon-Sat 9AM - 7PM", href: "tel:+919866753070" },
                                { icon: MessageCircle, title: "WhatsApp / Support", info: "+91 98667 53070", sub: "Primary: V Gupta", href: "https://wa.me/919866753070" },
                                { icon: Mail, title: "Write to Us", info: "support@hindusthanelements.com", sub: "We response within 24 hours", href: "mailto:support@hindusthanelements.com" },
                            ].map((item, index) => (
                                <StaggerItem key={`${item.title}-${index}`}>
                                    <a href={item.href} target={item.href.startsWith('http') ? "_blank" : undefined} rel={item.href.startsWith('http') ? "noopener noreferrer" : undefined} className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border card-hover group">
                                        <div className="h-12 w-12 rounded-xl bg-[#e7f3ff] flex items-center justify-center shrink-0 group-hover:bg-[#1877F2] transition-colors">
                                            <item.icon className="h-5 w-5 text-[#1877F2] group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-[#1C1C1E]">{item.title}</h3>
                                            <p className="text-sm text-[#1877F2] font-medium break-words">{item.info}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                                        </div>
                                    </a>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>

                        {/* Contact Form */}
                        <ScrollReveal direction="right" delay={0.2} className="lg:col-span-2">
                            <AnimatePresence mode="wait">
                                {submitted ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className="bg-white rounded-3xl shadow-sm border p-12 text-center"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                            className="h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                        >
                                            <Send className="h-8 w-8 text-green-600" />
                                        </motion.div>
                                        <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
                                        <p className="text-muted-foreground mb-6">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                                        <Link href="/"><Button className="rounded-full">Back to Home</Button></Link>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border p-8 md:p-10">
                                        <h2 className="text-xl font-bold mb-6">Send us a Message</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label htmlFor="contact-name" className="text-sm font-medium mb-1.5 block">Name *</label>
                                                <input id="contact-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-12 rounded-xl border border-input bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2]" required />
                                            </div>
                                            <div>
                                                <label htmlFor="contact-email" className="text-sm font-medium mb-1.5 block">Email *</label>
                                                <input id="contact-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-12 rounded-xl border border-input bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2]" required />
                                            </div>
                                            <div>
                                                <label htmlFor="contact-phone" className="text-sm font-medium mb-1.5 block">Phone</label>
                                                <input id="contact-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full h-12 rounded-xl border border-input bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2]" />
                                            </div>
                                            <div>
                                                <label htmlFor="inquiry-type" className="text-sm font-medium mb-1.5 block">Inquiry Type</label>
                                                <select id="inquiry-type" aria-label="Inquiry Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full h-12 rounded-xl border border-input bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2]">
                                                    <option value="general">General Inquiry</option>
                                                    <option value="product">Product Question</option>
                                                    <option value="bulk">Bulk Order</option>
                                                    <option value="support">Support</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-5">
                                            <label htmlFor="contact-message" className="text-sm font-medium mb-1.5 block">Message *</label>
                                            <textarea id="contact-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="w-full rounded-xl border border-input bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2] resize-none" required />
                                        </div>
                                        <Button type="submit" disabled={loading} className="mt-6 bg-[#1877F2] hover:bg-[#0d47a1] rounded-full h-12 px-8 text-base font-semibold shadow-lg">
                                            {loading ? "Sending..." : "Send Message"}
                                        </Button>
                                    </form>
                                )}
                            </AnimatePresence>
                        </ScrollReveal>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

