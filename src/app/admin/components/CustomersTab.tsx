"use client";
import { useState, useEffect } from "react";
import {
    Search, Mail, MessageSquare, Bell, MoreVertical,
    Filter, ShoppingBag, IndianRupee, ArrowRight, Download,
    CheckCircle2, XCircle, Clock
} from "lucide-react";

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    totalOrders: number;
    totalSpend: number;
    lastOrder: string | null;
    status: 'active' | 'inactive';
    joined: string;
}

export default function CustomersTab({ api, headers, showToast }: { api: string; headers: Record<string, string>; showToast: (m: string) => void }) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [communicationType, setCommunicationType] = useState<'email' | 'message' | 'notification' | null>(null);
    const [messageText, setMessageText] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(true);
            fetch(`${api}/api/admin/customers`, { headers })
                .then(r => r.json())
                .then(d => {
                    if (d.success) setCustomers(d.data);
                    setLoading(false);
                })
                .catch(() => {
                    // Fallback dummy data for development
                    setCustomers([
                        { id: '1', name: 'Raj Kumar', email: 'raj@example.com', phone: '+91 9995552252', totalOrders: 5, totalSpend: 15400, lastOrder: '2026-02-20', status: 'active', joined: '2025-10-15' },
                        { id: '2', name: 'Anita Sharma', email: 'anita@example.com', phone: '+91 9884441141', totalOrders: 2, totalSpend: 8200, lastOrder: '2026-02-15', status: 'active', joined: '2025-12-05' },
                        { id: '3', name: 'Vikram Singh', email: 'vikram@example.com', phone: '+91 9773330030', totalOrders: 0, totalSpend: 0, lastOrder: null, status: 'inactive', joined: '2026-01-10' },
                    ]);
                    setLoading(false);
                });
        }, 0);
        return () => clearTimeout(timer);
    }, [api, headers]);

    const handleSendMessage = () => {
        if (!messageText) {
            showToast("Please enter a message");
            return;
        }
        showToast(`Sending ${communicationType} to ${selectedCustomer?.name}...`);
        // Mock communication logic
        setTimeout(() => {
            showToast(`${communicationType?.charAt(0).toUpperCase() + communicationType!.slice(1)} sent!`);
            setCommunicationType(null);
            setMessageText("");
            setSelectedCustomer(null);
        }, 1000);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search customers by name, email or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                        <Filter className="h-4 w-4" /> Filter
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-xl text-sm font-medium hover:bg-[#0d47a1] shadow-md transition-all">
                        <Download className="h-4 w-4" /> Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Orders</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Spend</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-10 w-40 bg-gray-100 rounded-lg"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-100 rounded-full"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-10 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-100 rounded-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0d47a1] flex items-center justify-center text-white font-bold text-sm">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 group-hover:text-[#1877F2] transition-colors">{customer.name}</p>
                                                <p className="text-xs text-gray-500">{customer.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${customer.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                            }`}>
                                            {customer.status === 'active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
                                            <span className="text-sm font-medium">{customer.totalOrders}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <IndianRupee className="h-3.5 w-3.5 text-gray-400" />
                                            <span className="text-sm font-bold">{(customer.totalSpend || 0).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="h-3.5 w-3.5" />
                                            {customer.joined ? new Date(customer.joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setCommunicationType('email');
                                                }}
                                                className="h-8 w-8 rounded-full bg-blue-50 text-[#1877F2] flex items-center justify-center hover:bg-blue-100 transition-colors"
                                                title="Send Email"
                                            >
                                                <Mail className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setCommunicationType('notification');
                                                }}
                                                className="h-8 w-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100 transition-colors"
                                                title="Push Notification"
                                            >
                                                <Bell className="h-4 w-4" />
                                            </button>
                                            <button className="h-8 w-8 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Communication Modal */}
            {communicationType && selectedCustomer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${communicationType === 'email' ? 'bg-blue-50 text-blue-600' :
                                    communicationType === 'message' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                                    }`}>
                                    {communicationType === 'email' ? <Mail className="h-5 w-5" /> :
                                        communicationType === 'message' ? <MessageSquare className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Send {communicationType.charAt(0).toUpperCase() + communicationType.slice(1)}</h3>
                                    <p className="text-xs text-gray-500">To {selectedCustomer.name}</p>
                                </div>
                            </div>
                            <button onClick={() => { setCommunicationType(null); setSelectedCustomer(null); }} className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100">
                                <XCircle className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Message Content</label>
                                <textarea
                                    rows={5}
                                    placeholder={`Type your ${communicationType} content here...`}
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm outline-none focus:ring-4 focus:ring-[#1877F2]/10 focus:border-[#1877F2] transition-all resize-none"
                                />
                            </div>
                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                                <Bell className="h-4 w-4 text-blue-600" />
                                <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                                    Your message will be sent instantly. Please ensure content complies with communication policies.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex gap-3">
                            <button onClick={() => { setCommunicationType(null); setSelectedCustomer(null); setMessageText(""); }} className="flex-1 px-4 py-3 rounded-2xl border bg-white font-bold text-xs text-gray-600 hover:bg-gray-100 transition-all">Cancel</button>
                            <button onClick={handleSendMessage} className="flex-[2] px-4 py-3 rounded-2xl bg-[#1877F2] text-white font-bold text-xs shadow-lg hover:bg-[#0d47a1] transition-all flex items-center justify-center gap-2">
                                Send {communicationType.charAt(0).toUpperCase() + communicationType.slice(1)} <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

