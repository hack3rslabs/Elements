"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
    Plus, Trash2, Shield, Mail, Key, UserPlus, 
    Loader2, CheckCircle2, ShieldAlert,
    X, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Admin {
    id: string;
    email: string;
    role: "ADMIN" | "SUB_ADMIN";
    createdAt: string;
    name?: string;
}

export default function AdminsTab({ headers, showToast }: { headers: Record<string, string>; showToast: (m: string) => void }) {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        role: "SUB_ADMIN" as "ADMIN" | "SUB_ADMIN"
    });

    const fetchAdmins = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/admins", { headers });
            const data = await res.json();
            if (data.success) {
                setAdmins(data.data);
            }
        } catch {
            console.error("Failed to fetch admins");
        } finally {
            setLoading(false);
        }
    }, [headers]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!form.email || !form.password || !form.confirmPassword) {
            showToast("Please fill in all fields");
            return;
        }

        if (form.password !== form.confirmPassword) {
            showToast("Passwords do not match");
            return;
        }

        if (form.password.length < 6) {
            showToast("Password must be at least 6 characters");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/admin/admins", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    role: form.role
                })
            });
            const data = await res.json();

            if (data.success) {
                showToast("Admin account created successfully");
                setAdmins(prev => [data.data, ...prev]);
                setShowForm(false);
                setForm({ email: "", password: "", confirmPassword: "", role: "SUB_ADMIN" });
            } else {
                showToast(data.message || "Failed to create admin");
            }
        } catch {
            showToast("Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAdmin = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/admins/${id}`, {
                method: "DELETE",
                headers
            });
            const data = await res.json();

            if (data.success) {
                showToast("Admin deleted successfully");
                setAdmins(prev => prev.filter(a => a.id !== id));
            } else {
                showToast(data.message || "Failed to delete admin");
            }
        } catch {
            showToast("Something went wrong");
        } finally {
            setDeleteConfirm(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-[#1877F2] mb-4" />
                <p className="text-sm text-gray-500 font-medium">Loading admins list...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900">Admin Management</h2>
                    <p className="text-sm text-gray-500">Create and manage administrative accounts</p>
                </div>
                <Button 
                    onClick={() => setShowForm(!showForm)}
                    className={`rounded-full px-6 flex items-center gap-2 transition-all ${showForm ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-[#1877F2] text-white hover:bg-[#0d47a1]'}`}
                >
                    {showForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {showForm ? "Cancel" : "Create New Admin"}
                </Button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100"
                    >
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-[#1877F2]" /> Invite New Administrator
                        </h3>
                        <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Admin Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                    <input
                                        required
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                        placeholder="admin@elements.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                    <input
                                        required
                                        type="password"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" />
                                    <input
                                        required
                                        type="password"
                                        value={form.confirmPassword}
                                        onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Role Permissions</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, role: "ADMIN" })}
                                        className={`p-4 rounded-2xl border transition-all text-left group ${form.role === "ADMIN" ? 'bg-blue-50 border-[#1877F2] ring-2 ring-[#1877F2]/10' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <ShieldAlert className={`h-5 w-5 ${form.role === "ADMIN" ? 'text-[#1877F2]' : 'text-gray-400'}`} />
                                            {form.role === "ADMIN" && <CheckCircle2 className="h-4 w-4 text-[#1877F2]" />}
                                        </div>
                                        <p className={`text-sm font-bold ${form.role === "ADMIN" ? 'text-blue-900' : 'text-gray-900'}`}>Super Admin</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Full system access & admin management</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, role: "SUB_ADMIN" })}
                                        className={`p-4 rounded-2xl border transition-all text-left group ${form.role === "SUB_ADMIN" ? 'bg-blue-50 border-[#1877F2] ring-2 ring-[#1877F2]/10' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <UserCheck className={`h-5 w-5 ${form.role === "SUB_ADMIN" ? 'text-[#1877F2]' : 'text-gray-400'}`} />
                                            {form.role === "SUB_ADMIN" && <CheckCircle2 className="h-4 w-4 text-[#1877F2]" />}
                                        </div>
                                        <p className={`text-sm font-bold ${form.role === "SUB_ADMIN" ? 'text-blue-900' : 'text-gray-900'}`}>Admin</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Manage store, orders & products</p>
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-2">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full h-14 bg-[#1877F2] hover:bg-[#0d47a1] rounded-2xl text-base font-bold shadow-xl shadow-blue-200 flex items-center gap-3 transition-all"
                                >
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                                    {submitting ? "Creating Account..." : "Create Admin Account"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[#1877F2]" /> System Administrators
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left bg-white border-b border-gray-50">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrator</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {admins.map(admin => (
                                <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm ${admin.role === 'ADMIN' ? 'bg-gradient-to-br from-[#1877F2] to-[#0d47a1]' : 'bg-gradient-to-br from-indigo-500 to-indigo-700'}`}>
                                                {admin.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 group-hover:text-[#1877F2] transition-colors">{admin.email}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">ID: {admin.id.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                                            admin.role === 'ADMIN' ? 'bg-blue-50 text-[#1877F2] border border-blue-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                        }`}>
                                            {admin.role === 'ADMIN' ? <ShieldAlert className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                            {admin.role === 'ADMIN' ? 'Super Admin' : 'Admin'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-gray-600">{new Date(admin.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{new Date(admin.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setDeleteConfirm(admin.id)}
                                            className="h-9 w-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm shadow-rose-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-gray-100 text-center"
                        >
                            <div className="h-16 w-16 rounded-3xl bg-rose-50 flex items-center justify-center mx-auto mb-6 text-rose-500">
                                <ShieldAlert className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Revoke Access?</h3>
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed">This will permanently remove administrative privileges for this user. This action cannot be undone.</p>
                            <div className="flex gap-4">
                                <Button 
                                    variant="ghost"
                                    onClick={() => setDeleteConfirm(null)} 
                                    className="flex-1 h-12 rounded-2xl text-sm font-bold border border-gray-100 hover:bg-gray-50"
                                >
                                    Go Back
                                </Button>
                                <Button 
                                    onClick={() => handleDeleteAdmin(deleteConfirm)} 
                                    className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-rose-200"
                                >
                                    Confirm
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
