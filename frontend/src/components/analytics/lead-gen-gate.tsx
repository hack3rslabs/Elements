"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, Lock, Sparkles, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LeadGenGate() {
    const [isVisible, setIsVisible] = useState(false);
    const [showClose, setShowClose] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "" });

    useEffect(() => {
        // Check if user has already submitted lead
        const hasSubmitted = localStorage.getItem("elements_lead_captured");
        if (hasSubmitted) {
            setIsSubmitted(true);
            return;
        }

        // Trigger gate after 90 seconds
        const timer = setTimeout(() => {
            setIsVisible(true);
            // Lock body scroll
            document.body.style.overflow = "hidden";

            // Show close button after additional 5 seconds
            setTimeout(() => setShowClose(true), 5000);
        }, 90000);

        return () => {
            clearTimeout(timer);
            document.body.style.overflow = "auto";
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        document.body.style.overflow = "auto";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("http://localhost:5000/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    sessionId: localStorage.getItem("elements_session_id")
                })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem("elements_lead_captured", "true");
                setIsVisible(false);
                setIsSubmitted(true);
                document.body.style.overflow = "auto";
            } else {
                alert(data.message || "Please check your details");
            }
        } catch (err) {
            alert("Connection error. Please try again.");
        }
        setLoading(false);
    };

    if (isSubmitted || !isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with heavy blur */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white/60 backdrop-blur-2xl"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border overflow-hidden"
            >
                <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                    {/* Visual Side */}
                    <div className="md:col-span-2 bg-gradient-to-br from-[#1877F2] to-[#0d47a1] p-8 text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:24px_24px]" />
                        </div>

                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold leading-tight">Unlock Premium Experience</h2>
                            <p className="text-white/80 text-sm mt-4 leading-relaxed">
                                Join 5,000+ builders and homeowners getting exclusive access to project rates and early arrival notices.
                            </p>
                        </div>

                        <div className="relative z-10 mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-3">
                                <Lock className="h-4 w-4 text-white/60" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Secure Access</span>
                            </div>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="md:col-span-3 p-8 md:p-10 relative">
                        {showClose && (
                            <button
                                onClick={handleClose}
                                aria-label="Close"
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-900">Get Started</h3>
                            <p className="text-gray-500 text-sm mt-1">Please provide your details to continue browsing.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Full Name"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                    <input
                                        required
                                        type="email"
                                        placeholder="Email Address"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                    <input
                                        required
                                        type="tel"
                                        placeholder="Phone Number"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#1877F2] hover:bg-[#0d47a1] rounded-2xl h-14 text-base font-bold shadow-xl shadow-blue-200 mt-4 group"
                            >
                                {loading ? "Authenticating..." : (
                                    <span className="flex items-center justify-center gap-2">
                                        Continue Browsing <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>
                        </form>

                        <p className="text-[10px] text-center text-gray-400 mt-8 leading-relaxed">
                            By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>. We never spam.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
