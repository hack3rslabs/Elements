"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) return;
        setLoading(true);
        setTimeout(() => setLoading(false), 1000);
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#f0f7ff] to-[#e7f3ff] py-20">
                <div className="w-full max-w-md mx-4">
                    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border">
                        <div className="text-center mb-8">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#1877F2] to-[#0d47a1] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
                                E
                            </div>
                            <h1 className="text-2xl font-bold text-[#1C1C1E]">Create Account</h1>
                            <p className="text-muted-foreground mt-1">Join Elements for the best experience</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-[#1C1C1E] mb-1.5 block">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full h-12 rounded-xl border border-input bg-gray-50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2] transition-all" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-[#1C1C1E] mb-1.5 block">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full h-12 rounded-xl border border-input bg-gray-50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2] transition-all" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-[#1C1C1E] mb-1.5 block">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className="w-full h-12 rounded-xl border border-input bg-gray-50 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2] transition-all" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-[#1C1C1E] mb-1.5 block">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="w-full h-12 rounded-xl border border-input bg-gray-50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2] transition-all" required />
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                )}
                            </div>

                            <div className="flex items-start gap-2 pt-1">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    className="rounded border-input mt-0.5"
                                    required
                                />
                                <label htmlFor="terms" className="text-xs text-muted-foreground">
                                    I agree to the <a href="/terms" className="text-[#1877F2] hover:underline">Terms & Conditions</a> and <a href="/privacy" className="text-[#1877F2] hover:underline">Privacy Policy</a>
                                </label>
                            </div>

                            <Button type="submit" disabled={loading || password !== confirmPassword} className="w-full bg-[#1877F2] hover:bg-[#0d47a1] rounded-full h-12 text-base font-semibold shadow-lg mt-2">
                                {loading ? "Creating Account..." : "Create Account"}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-[#1877F2] font-medium hover:underline">Sign In</Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
