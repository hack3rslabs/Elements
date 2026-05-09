"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
    User, Mail, Phone, Package, Heart, 
    Settings, LogOut, ChevronRight, Camera, 
    ShieldCheck, Loader2, Save, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            void fetchProfile();
        }
    }, [status, router]);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/user/profile");
            const data = await res.json();
            if (data.success) {
                setFormData({
                    name: data.data.name || "",
                    email: data.data.email || "",
                    phone: data.data.phone || "",
                });
            }
        } catch {
            console.error("Failed to fetch profile");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: "Profile updated successfully!" });
                // Update next-auth session
                await update({
                    ...session,
                    user: {
                        ...session?.user,
                        name: formData.name,
                        email: formData.email,
                    }
                });
            } else {
                setMessage({ type: 'error', text: data.message || "Failed to update profile" });
            }
        } catch {
            setMessage({ type: 'error', text: "Something went wrong. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full md:w-1/3 space-y-4">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                            <div className="relative group mb-4">
                                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0d47a1] flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-white">
                                    {formData.name.charAt(0) || "U"}
                                </div>
                                <button className="absolute bottom-0 right-0 h-8 w-8 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-500 hover:text-[#1877F2] transition-colors">
                                    <Camera className="h-4 w-4" />
                                </button>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{formData.name || "User"}</h2>
                            <p className="text-sm text-gray-500 mb-6">{formData.email}</p>
                            
                            <div className="w-full pt-6 border-t border-gray-50 space-y-1">
                                <button className="w-full flex items-center justify-between p-3 rounded-2xl bg-blue-50 text-[#1877F2] font-bold text-sm transition-all">
                                    <span className="flex items-center gap-3"><User className="h-4 w-4" /> My Profile</span>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <button onClick={() => router.push('/track-order')} className="w-full flex items-center justify-between p-3 rounded-2xl text-gray-500 hover:bg-gray-50 font-bold text-sm transition-all">
                                    <span className="flex items-center gap-3"><Package className="h-4 w-4" /> My Orders</span>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <button onClick={() => router.push('/wishlist')} className="w-full flex items-center justify-between p-3 rounded-2xl text-gray-500 hover:bg-gray-50 font-bold text-sm transition-all">
                                    <span className="flex items-center gap-3"><Heart className="h-4 w-4" /> Wishlist</span>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100">
                             <Button 
                                variant="ghost" 
                                className="w-full justify-start gap-3 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl py-6"
                                onClick={() => router.push('/api/auth/signout')}
                            >
                                <LogOut className="h-5 w-5" />
                                <span className="font-bold">Logout</span>
                            </Button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h1 className="text-2xl font-black text-gray-900">Profile Settings</h1>
                                    <p className="text-sm text-gray-500">Update your personal information</p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1877F2]">
                                    <Settings className="h-6 w-6" />
                                </div>
                            </div>

                            <AnimatePresence>
                                {message && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`mb-8 p-4 rounded-2xl flex items-center gap-3 ${
                                            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                        }`}
                                    >
                                        {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                        <p className="text-sm font-bold">{message.text}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-base font-medium outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                                placeholder="Your full name"
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
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-base font-medium outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                            <input
                                                required
                                                type="tel"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-base font-medium outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                                placeholder="+91 XXXXX XXXXX"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full md:w-auto px-10 h-14 bg-[#1877F2] hover:bg-[#0d47a1] rounded-2xl text-base font-bold shadow-xl shadow-blue-200 transition-all flex items-center gap-3"
                                    >
                                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                        {saving ? "Saving Changes..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>

                            <div className="mt-12 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                                <h3 className="text-sm font-bold text-blue-900 mb-2">Account Security</h3>
                                <p className="text-xs text-blue-700 mb-4 leading-relaxed">
                                    Your personal information is securely stored. You can update your details at any time.
                                </p>
                                <Button variant="link" className="p-0 h-auto text-xs font-bold text-[#1877F2]" onClick={() => router.push('/login?forgot=true')}>
                                    Change Password <ChevronRight className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
