"use client";
import { useState, useEffect, useCallback } from "react";
import { CreditCard, IndianRupee, Clock, AlertCircle, ArrowUpRight, Search as SearchIcon, Filter, RefreshCw } from "lucide-react";

const API = "";
const HEADERS = { "Content-Type": "application/json", "x-api-key": "elements-admin-key-2026" };

interface Payment {
    id: string; orderId: string; amount: number; method: string;
    status: string; gateway: string; transactionId: string; timestamp: string;
}

interface Summary {
    totalCollected: number; totalPending: number; totalRefunded: number;
    byMethod: Record<string, number>;
}

const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700', refunded: 'bg-purple-100 text-purple-700',
};

const methodIcons: Record<string, string> = {
    upi: '📱', card: '💳', netbanking: '🏦', cod: '💵', wallet: '👛',
};

export default function PaymentsTab() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalCollected: 0, totalPending: 0, totalRefunded: 0, byMethod: {} });
    const [filter, setFilter] = useState("all");
    const [methodFilter, setMethodFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchPayments = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.set('status', filter);
            if (methodFilter !== 'all') params.set('method', methodFilter);
            const res = await fetch(`${API}/api/admin/payments?${params}`, { headers: HEADERS });
            const data = await res.json();
            if (data.success) {
                setPayments(data.data || []);
                setSummary(data.summary || { totalCollected: 0, totalPending: 0, totalRefunded: 0, byMethod: {} });
            }
        } catch {
            setPayments([]);
        }
        setLoading(false);
    }, [filter, methodFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPayments();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchPayments]);

    const filtered = payments.filter(p =>
        !search || p.id.toLowerCase().includes(search.toLowerCase()) || p.orderId.toLowerCase().includes(search.toLowerCase()) || p.transactionId.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white"><IndianRupee className="h-4 w-4" /></div>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-xl font-bold">₹{summary.totalCollected.toLocaleString()}</div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Total Collected</p>
                </div>
                <div className="bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white"><Clock className="h-4 w-4" /></div>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="text-xl font-bold">₹{summary.totalPending.toLocaleString()}</div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Pending</p>
                </div>
                <div className="bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white"><RefreshCw className="h-4 w-4" /></div>
                    </div>
                    <div className="text-xl font-bold">₹{summary.totalRefunded.toLocaleString()}</div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Refunded</p>
                </div>
                <div className="bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white"><CreditCard className="h-4 w-4" /></div>
                    </div>
                    <div className="text-xl font-bold">{payments.length}</div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Total Transactions</p>
                </div>
            </div>

            {/* Method Breakdown */}
            {Object.keys(summary.byMethod).length > 0 && (
                <div className="bg-white rounded-2xl border shadow-sm p-4">
                    <h3 className="font-semibold text-sm mb-3">Revenue by Payment Method</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(summary.byMethod).map(([method, amount]) => (
                            <div key={method} className="bg-gray-50 rounded-xl p-3 border">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{methodIcons[method] || '💰'}</span>
                                    <span className="text-xs font-medium capitalize">{method}</span>
                                </div>
                                <div className="text-sm font-bold">₹{(amount as number).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by payment ID, order ID, or txn ID..."
                        className="w-full h-10 pl-10 pr-4 rounded-xl border text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="h-10 rounded-xl border px-3 text-xs bg-white" aria-label="Filter by status">
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>
                    <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="h-10 rounded-xl border px-3 text-xs bg-white" aria-label="Filter by method">
                        <option value="all">All Methods</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="netbanking">NetBanking</option>
                        <option value="cod">COD</option>
                    </select>
                </div>
            </div>

            {/* Payments List */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-400">Loading payments...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">
                        <CreditCard className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        <p>No payment records yet.</p>
                        <p className="text-[10px] text-gray-300 mt-1">Payment records will appear when orders are placed via the storefront.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left p-3 font-medium text-xs text-gray-500">Payment ID</th>
                                    <th className="text-left p-3 font-medium text-xs text-gray-500">Order</th>
                                    <th className="text-right p-3 font-medium text-xs text-gray-500">Amount</th>
                                    <th className="text-center p-3 font-medium text-xs text-gray-500">Method</th>
                                    <th className="text-center p-3 font-medium text-xs text-gray-500">Gateway</th>
                                    <th className="text-center p-3 font-medium text-xs text-gray-500">Status</th>
                                    <th className="text-right p-3 font-medium text-xs text-gray-500">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => (
                                    <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-xs font-mono">{p.id}</td>
                                        <td className="p-3 text-xs text-[#1877F2] font-medium">{p.orderId}</td>
                                        <td className="p-3 text-right font-semibold text-xs">₹{p.amount.toLocaleString()}</td>
                                        <td className="p-3 text-center">
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{methodIcons[p.method] || '💰'} {p.method}</span>
                                        </td>
                                        <td className="p-3 text-center text-xs text-gray-500">{p.gateway}</td>
                                        <td className="p-3 text-center">
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                                        </td>
                                        <td className="p-3 text-right text-xs text-gray-500">{new Date(p.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payment Gateway Setup Info */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-amber-600" /> Setting Up Online Payments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
                    <div>
                        <p className="font-medium mb-1">Recommended Gateways for India:</p>
                        <ul className="space-y-1 text-[11px]">
                            <li>• <strong>Razorpay</strong> — Best for UPI, cards, netbanking. Easy integration.</li>
                            <li>• <strong>Cashfree</strong> — Great for B2B payments & settlements.</li>
                            <li>• <strong>PayU</strong> — Supports EMI, wallets, UPI.</li>
                            <li>• <strong>PhonePe PG</strong> — Optimized for UPI transactions.</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-medium mb-1">Integration Steps:</p>
                        <ol className="space-y-1 text-[11px]">
                            <li>1. Sign up on Razorpay/Cashfree with PAN + GST</li>
                            <li>2. Get API Key ID and Key Secret from dashboard</li>
                            <li>3. Add keys to your <code className="bg-white px-1 rounded">.env</code> file</li>
                            <li>4. Install SDK: <code className="bg-white px-1 rounded">npm i razorpay</code></li>
                            <li>5. Create payment order on backend, verify on success</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}

