"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
    Phone, CheckCircle2,
    Loader2, Lock, Mail, ShieldCheck, User as UserIcon,
    ArrowLeft
} from "lucide-react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [authMode, setAuthMode] = useState<"customer" | "admin">("customer");

    // Customer Auth State
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerPassword, setCustomerPassword] = useState("");

    // Forgot Password State
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const [fpStep, setFpStep] = useState(1); // 1: OTP & New Pass
    const [fpOtp, setFpOtp] = useState("");
    const [fpNewPassword, setFpNewPassword] = useState("");
    const [fpConfirmPassword, setFpConfirmPassword] = useState("");

    // Admin Auth State
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const handleCustomerLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerEmail || !customerPhone || customerPhone.length < 10 || !customerPassword) {
            setError("Please fill in all fields (Email, Phone, and Password)");
            return;
        }
        setLoading(true);
        setError("");
        
        const normalizedEmail = customerEmail.trim().toLowerCase();
        
        const res = await signIn("credentials", {
            name: customerName.trim(),
            email: normalizedEmail,
            phone: customerPhone,
            password: customerPassword,
            type: "user",
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid credentials or registration failed");
            setLoading(false);
        } else if (res?.ok) {
            await handlePostLogin();
        }
    };

    const handleForgotPasswordRequest = async () => {
        if (!customerEmail || !customerEmail.includes("@")) {
            setError("Please enter your email address in the form first");
            return;
        }
        setLoading(true);
        setError("");
        const normalizedEmail = customerEmail.trim().toLowerCase();
        try {
            const res = await fetch("/api/auth/forgot-password/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: normalizedEmail, phone: customerPhone }),
            });
            const data = await res.json();
            if (data.success) {
                setForgotPasswordMode(true);
                setFpStep(1);
            } else {
                setError(data.message);
            }
        } catch {
            setError("Failed to send verification code");
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fpOtp.length < 6) {
            setError("Please enter the 6-digit code");
            return;
        }
        setLoading(true);
        setError("");
        const normalizedEmail = customerEmail.trim().toLowerCase();
        try {
            const res = await fetch("/api/auth/forgot-password/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: normalizedEmail, otp: fpOtp }),
            });
            const data = await res.json();
            if (data.success) {
                setFpStep(2);
                setError("");
            } else {
                setError(data.message);
            }
        } catch {
            setError("Verification failed");
        }
        setLoading(false);
    };

    const handleForgotPasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fpNewPassword || fpNewPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (fpNewPassword !== fpConfirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        setError("");
        const normalizedEmail = customerEmail.trim().toLowerCase();
        try {
            const res = await fetch("/api/auth/forgot-password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: normalizedEmail, otp: fpOtp, newPassword: fpNewPassword }),
            });
            const data = await res.json();
            if (data.success) {
                setForgotPasswordMode(false);
                setFpStep(1);
                setFpOtp("");
                setFpNewPassword("");
                setFpConfirmPassword("");
                setError("");
                alert("Password reset successful! You can now log in.");
            } else {
                setError(data.message);
            }
        } catch {
            setError("Failed to reset password");
        }
        setLoading(false);
    };

    const handleAdminRequestOtp = async () => {
        if (!email || !email.includes("@")) {
            setError("Please enter a valid admin email");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/admin/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) {
                setOtpSent(true);
            } else {
                setError(data.message);
            }
        } catch {
            setError("Failed to send OTP. Please try again.");
        }
        setLoading(false);
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await signIn("credentials", {
            email,
            otp,
            type: "admin",
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid or expired OTP");
            setLoading(false);
        } else if (res?.ok) {
            await handlePostLogin();
        }
    };

    const handlePostLogin = async () => {
        const session = await getSession();
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = params.get("callbackUrl");

        if (callbackUrl && callbackUrl !== window.location.pathname) {
            router.push(callbackUrl);
        } else if (session?.user?.role === "ADMIN" || session?.user?.role === "STAFF" || session?.user?.role === "SUB_ADMIN") {
            router.push("/admin");
        } else {
            router.push("/");
        }
        router.refresh();
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#f8fafc]">
            <Header />
            <main className="flex-1 flex items-center justify-center py-16 px-4">
                <div className="w-full max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 border overflow-hidden flex flex-col md:flex-row min-h-[600px]"
                    >
                        {/* Left Side: Dynamic Branding */}
                        <div className={`md:w-5/12 p-10 text-white flex flex-col justify-between relative overflow-hidden transition-colors duration-500 ${authMode === 'admin' ? 'bg-[#1e293b]' : 'bg-gradient-to-br from-[#1877F2] to-[#0d47a1]'}`}>
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:24px_24px]" />
                            </div>
                            
                            <div className="relative z-10">
                                <Image
                                    src="/images/brand/elements-logo.png"
                                    alt="Elements"
                                    width={120}
                                    height={36}
                                    className="h-10 w-auto object-contain brightness-0 invert mb-8"
                                />
                                <AnimatePresence mode="wait">
                                    {authMode === 'customer' ? (
                                        <motion.div
                                            key="customer-text"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                        >
                                            <h2 className="text-3xl font-bold leading-tight">Welcome Back to Elements</h2>
                                            <p className="text-white/70 text-sm mt-4">
                                                Shop premium materials with builder-direct pricing.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="admin-text"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                        >
                                            <h2 className="text-3xl font-bold leading-tight">Control Center Access</h2>
                                            <p className="text-white/70 text-sm mt-4">
                                                Secure authentication required for administrative functions.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="relative z-10 space-y-4 mt-12">
                                <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                    <span>{authMode === 'customer' ? 'Bulk Pricing Access' : 'Encrypted Access'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                    <span>{authMode === 'customer' ? 'Order Tracking' : 'Activity Monitoring'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Form Content */}
                        <div className="md:w-7/12 p-8 md:p-12">
                            {/* Auth Mode Toggle */}
                            <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-10 w-fit mx-auto md:mx-0">
                                <button
                                    onClick={() => { setAuthMode("customer"); setError(""); setOtpSent(false); setForgotPasswordMode(false); }}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${authMode === "customer" ? "bg-white text-[#1877F2] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <UserIcon className="h-4 w-4" />
                                    Customer
                                </button>
                                <button
                                    onClick={() => { setAuthMode("admin"); setError(""); }}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${authMode === "admin" ? "bg-white text-[#1e293b] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    Staff
                                </button>
                            </div>

                            <div className="mb-8">
                                <h1 className="text-3xl font-extrabold text-gray-900">
                                    {authMode === "customer" ? (forgotPasswordMode ? "Reset Password" : "Sign In") : "Staff Access"}
                                </h1>
                                <p className="text-gray-500 text-sm mt-2">
                                    {authMode === "customer" 
                                        ? (forgotPasswordMode ? "Recover your account access" : "Enter details to continue") 
                                        : "Enter your registered work email to receive an OTP"}
                                </p>
                            </div>

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Customer Login Form */}
                            {authMode === "customer" && !forgotPasswordMode && (
                                <form onSubmit={handleCustomerLogin} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                            <input
                                                required
                                                type="text"
                                                placeholder="John Doe"
                                                value={customerName}
                                                onChange={e => setCustomerName(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 text-base font-medium outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                            <input
                                                required
                                                type="email"
                                                placeholder="john@example.com"
                                                value={customerEmail}
                                                onChange={e => setCustomerEmail(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 text-base font-medium outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                            <div className="absolute left-11 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-bold tracking-tight border-r pr-3 mr-3 h-5 flex items-center">+91</div>
                                            <input
                                                required
                                                type="tel"
                                                maxLength={10}
                                                placeholder="98765 43210"
                                                value={customerPhone}
                                                onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-24 pr-4 py-3.5 text-base font-medium outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center pr-1">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                                            <button 
                                                type="button"
                                                onClick={handleForgotPasswordRequest}
                                                className="text-[10px] font-bold text-[#1877F2] hover:underline"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                            <input
                                                required
                                                type="password"
                                                placeholder="••••••••"
                                                value={customerPassword}
                                                onChange={e => setCustomerPassword(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 text-base font-medium outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#1877F2] hover:bg-[#0d47a1] rounded-2xl h-14 text-base font-bold shadow-xl shadow-blue-200 mt-6 transition-all active:scale-[0.98]"
                                    >
                                        {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "Sign In or Register"}
                                    </Button>
                                </form>
                            )}

                            {/* Forgot Password Flow (Streamlined) */}
                            {authMode === "customer" && forgotPasswordMode && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="mb-2">
                                        <button 
                                            onClick={() => { setForgotPasswordMode(false); setFpStep(1); setError(""); }}
                                            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <ArrowLeft className="h-3 w-3" /> Back to Login
                                        </button>
                                    </div>

                                    {/* Step 1: Verify OTP */}
                                    {fpStep === 1 && (
                                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                                                <Mail className="h-5 w-5 text-[#1877F2]" />
                                                <div className="flex-1">
                                                    <p className="text-[10px] uppercase font-bold text-gray-400">OTP Sent to Email</p>
                                                    <p className="text-xs font-bold text-gray-700">{customerEmail}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Verification Code</label>
                                                <input
                                                    required
                                                    autoFocus
                                                    type="text"
                                                    maxLength={6}
                                                    placeholder="000000"
                                                    value={fpOtp}
                                                    onChange={e => setFpOtp(e.target.value.replace(/\D/g, ''))}
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-[0.5em] outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={loading || fpOtp.length < 6}
                                                className="w-full bg-[#1877F2] hover:bg-[#0d47a1] rounded-2xl h-14 text-base font-bold shadow-xl shadow-blue-200 mt-4"
                                            >
                                                {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "Verify OTP"}
                                            </Button>
                                        </form>
                                    )}

                                    {/* Step 2: Set New Password (only shown after OTP verified) */}
                                    {fpStep === 2 && (
                                        <form onSubmit={handleForgotPasswordReset} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                <p className="text-xs font-bold text-emerald-700">OTP verified! Set your new password below.</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">New Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                                    <input
                                                        required
                                                        autoFocus
                                                        type="password"
                                                        placeholder="Min 6 characters"
                                                        value={fpNewPassword}
                                                        onChange={e => setFpNewPassword(e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-base font-medium outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Confirm New Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                                    <input
                                                        required
                                                        type="password"
                                                        placeholder="Repeat password"
                                                        value={fpConfirmPassword}
                                                        onChange={e => setFpConfirmPassword(e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-base font-medium outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={loading || !fpNewPassword || !fpConfirmPassword}
                                                className="w-full bg-[#1877F2] hover:bg-[#0d47a1] rounded-2xl h-14 text-base font-bold shadow-xl shadow-blue-200 mt-4"
                                            >
                                                {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "Update Password"}
                                            </Button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Admin Login Form */}
                            {authMode === "admin" && (
                                <div className="space-y-5">
                                    {!otpSent ? (
                                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Work Email</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1e293b] transition-colors" />
                                                    <input
                                                        required
                                                        type="email"
                                                        placeholder="admin@hindustan-elements.com"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-base font-medium outline-none focus:ring-4 focus:ring-[#1e293b]/10 focus:border-[#1e293b] transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleAdminRequestOtp}
                                                disabled={loading || !email}
                                                className="w-full bg-[#1e293b] hover:bg-[#0f172a] rounded-2xl h-14 text-base font-bold shadow-xl shadow-slate-200 mt-4"
                                            >
                                                {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "Send OTP to Email"}
                                            </Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleAdminLogin} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                                    <Mail className="h-5 w-5 text-[#1e293b]" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] uppercase font-bold text-gray-400">OTP Sent to Email</p>
                                                    <p className="text-xs font-bold text-gray-700">{email}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setOtpSent(false)}
                                                    className="text-[10px] font-bold text-[#1e293b] hover:underline"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 text-center block w-full">Verification Code</label>
                                                <input
                                                    required
                                                    autoFocus
                                                    type="text"
                                                    maxLength={6}
                                                    placeholder="000000"
                                                    value={otp}
                                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-5 text-center text-3xl font-black tracking-[0.6em] outline-none focus:ring-4 focus:ring-[#1e293b]/10 focus:border-[#1e293b] transition-all placeholder:text-gray-200"
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={loading || otp.length < 6}
                                                className="w-full bg-[#1e293b] hover:bg-[#0f172a] rounded-2xl h-14 text-base font-bold shadow-xl shadow-slate-200 mt-4"
                                            >
                                                {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "Verify & Access Dashboard"}
                                            </Button>
                                            <p className="text-center text-xs text-gray-400">
                                                Didn&apos;t receive it? <button type="button" onClick={handleAdminRequestOtp} className="text-[#1e293b] font-bold hover:underline ml-1">Resend OTP</button>
                                            </p>
                                        </form>
                                    )}
                                </div>
                            )}

                            <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                                <p className="text-[11px] text-gray-400 uppercase tracking-[0.2em] font-bold">
                                    Secure Authentication System
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
