"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import {
    Mail, Lock, Eye, EyeOff,
    Phone, Smartphone, CheckCircle2,
    ArrowRight, Loader2
} from "lucide-react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Mobile Auth State
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState("");

    const handleRequestOtp = async () => {
        if (!phone || phone.length < 10) {
            setError("Please enter a valid phone number");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("http://localhost:5000/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: `+91${phone}` }),
            });
            const data = await res.json();
            if (data.success) {
                setOtpSent(true);
            } else {
                setError(data.message);
            }
        } catch (e) {
            setError("Failed to send OTP. Please try again.");
        }
        setLoading(false);
    };

    const handleMobileLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await signIn("credentials", {
            phone: `+91${phone}`,
            otp,
            type: "mobile",
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid OTP. Use 123456 for testing.");
        } else if (res?.ok) {
            const session = await getSession();
            const params = new URLSearchParams(window.location.search);
            const callbackUrl = params.get("callbackUrl");

            if (callbackUrl && callbackUrl !== window.location.pathname) {
                router.push(callbackUrl);
            } else if (session?.user?.role === "ADMIN" || session?.user?.role === "STAFF") {
                router.push("/admin");
            } else {
                router.push("/");
            }
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            <Header />
            <main className="flex-1 flex items-center justify-center py-16 px-4">
                <div className="w-full max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 border overflow-hidden"
                    >
                        <div className="flex flex-col md:flex-row h-full">

                            {/* Left Side: Branding/Promo */}
                            <div className="md:w-2/5 bg-gradient-to-br from-[#1877F2] to-[#0d47a1] p-10 text-white flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                    <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:24px_24px]" />
                                </div>
                                <div className="relative z-10">
                                    <Image
                                        src="/images/brand/elements-logo.png"
                                        alt="Elements"
                                        width={120}
                                        height={36}
                                        className="h-10 w-auto object-contain brightness-0 invert mb-6"
                                    />
                                    <h2 className="text-2xl font-bold leading-tight">Join the Choice</h2>
                                    <p className="text-white/70 text-sm mt-4">
                                        Access premium home décor, construction materials, and exclusive builder rates.
                                    </p>
                                </div>
                                <div className="relative z-10 space-y-4 mt-12">
                                    <div className="flex items-center gap-3 text-xs font-medium text-white/80">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                        <span>15+ Years of Trust</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-medium text-white/80">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                        <span>Bulk Pricing Access</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-medium text-white/80">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                        <span>Order Tracking</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Login Form */}
                            <div className="md:w-3/5 p-8 md:p-10">
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
                                    <p className="text-gray-500 text-sm mt-1">Enter your phone number to continue</p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {!otpSent ? (
                                        <>
                                            <div className="space-y-1">
                                                <div className="relative group">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                                    <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">+91</div>
                                                    <input
                                                        required
                                                        type="tel"
                                                        maxLength={10}
                                                        placeholder="Phone Number"
                                                        value={phone}
                                                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-20 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleRequestOtp}
                                                disabled={loading || phone.length < 10}
                                                className="w-full bg-[#1877F2] hover:bg-[#0d47a1] rounded-2xl h-14 text-sm font-bold shadow-xl shadow-blue-200 mt-4"
                                            >
                                                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Send OTP"}
                                            </Button>
                                        </>
                                    ) : (
                                        <form onSubmit={handleMobileLogin} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                                                <Smartphone className="h-5 w-5 text-[#1877F2]" />
                                                <div className="flex-1">
                                                    <p className="text-[10px] uppercase font-bold text-gray-400">OTP Sent to</p>
                                                    <p className="text-xs font-bold text-gray-700">+91 {phone}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setOtpSent(false)}
                                                    className="text-[10px] font-bold text-[#1877F2] hover:underline"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="relative group">
                                                    <input
                                                        required
                                                        autoFocus
                                                        type="text"
                                                        maxLength={6}
                                                        placeholder="Enter 6-digit OTP"
                                                        value={otp}
                                                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-center text-xl font-bold tracking-[0.5em] outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={loading || otp.length < 6}
                                                className="w-full bg-[#1877F2] hover:bg-[#0d47a1] rounded-2xl h-14 text-sm font-bold shadow-xl shadow-blue-200 mt-4"
                                            >
                                                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Verify & Sign In"}
                                            </Button>
                                            <p className="text-center text-[10px] text-gray-400">
                                                Didn&apos;t receive? <button type="button" onClick={handleRequestOtp} className="text-[#1877F2] font-bold hover:underline">Resend OTP</button>
                                            </p>
                                        </form>
                                    )}
                                </div>

                                <div className="mt-8 text-center text-xs text-gray-500">
                                    Don&apos;t have an account?{" "}
                                    <Link href="/register" className="text-[#1877F2] font-bold hover:underline">Create Account</Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <p className="text-center text-[10px] text-gray-400 mt-8 leading-relaxed max-w-xs mx-auto">
                        Test Credentials: <span className="font-bold">admin@elements.com</span> / <span className="font-bold">password123</span>
                    <br />
                    Secure OTP will be sent to your mobile number.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
