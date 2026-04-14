"use client";
import { useState, useEffect, useCallback } from "react";
import { Package, Truck, CheckCircle2, Clock, Search as SearchIcon, XCircle, RefreshCw, IndianRupee, ArrowUpRight, Eye, X } from "lucide-react";

const API = "http://localhost:5000";
const HDRS = { "Content-Type": "application/json", "x-api-key": "elements-admin-key-2026" };

interface OrderItem { name?: string; productId?: string; quantity: number; price: number; }
interface OrderCustomer { name: string; email: string; phone: string; address: string; pincode: string; city?: string; state?: string; }
interface Order {
    id: string; items: OrderItem[]; total: number; subtotal?: number; shipping?: number;
    status: string; paymentMethod?: string; paymentStatus?: string;
    customer?: OrderCustomer; customerName?: string; email?: string; phone?: string; address?: string;
    timeline?: { status: string; time: string; description: string }[];
    createdAt: string;
}

const STATUS_LIST = ["all", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200", PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
    SHIPPED: "bg-purple-100 text-purple-700 border-purple-200", DELIVERED: "bg-green-100 text-green-700 border-green-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
};
const statusIcons: Record<string, typeof Clock> = { PENDING: Clock, PROCESSING: RefreshCw, SHIPPED: Truck, DELIVERED: CheckCircle2, CANCELLED: XCircle };

export default function OrdersTab() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState("");
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    const fetchOrders = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filter !== "all") params.set("status", filter);
            const res = await fetch(`${API}/api/admin/orders?${params}`, { headers: HDRS });
            const d = await res.json();
            if (d.success) setOrders(d.data || []);
        } catch { setOrders([]); }
        setLoading(false);
    }, [filter]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`${API}/api/admin/orders/${id}/status`, { method: "PUT", headers: HDRS, body: JSON.stringify({ status: newStatus }) });
            const d = await res.json();
            if (d.success) { showToast(`Order ${id} → ${newStatus}`); fetchOrders(); }
        } catch { showToast("Status updated locally"); setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o)); }
    };

    const getCustomerName = (o: Order) => o.customer?.name || o.customerName || "Customer";
    const getCustomerEmail = (o: Order) => o.customer?.email || o.email || "";
    const getAddress = (o: Order) => o.customer?.address || o.address || "";

    const filtered = orders.filter(o => !search || getCustomerName(o).toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()));
    const counts: Record<string, number> = { all: orders.length };
    STATUS_LIST.slice(1).forEach(s => { counts[s] = orders.filter(o => o.status === s).length; });
    const totalRevenue = orders.filter(o => o.status !== "CANCELLED").reduce((sum, o) => sum + (o.total || 0), 0);

    return (
        <div className="space-y-4">
            {toast && <div className="fixed top-4 right-4 z-[99] bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{toast}</div>}

            {/* Order Detail Modal */}
            {viewOrder && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Order {viewOrder.id}</h3>
                            <button onClick={() => setViewOrder(null)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div><span className="text-gray-400">Customer</span><p className="font-medium">{getCustomerName(viewOrder)}</p></div>
                                <div><span className="text-gray-400">Email</span><p className="font-medium">{getCustomerEmail(viewOrder)}</p></div>
                                <div><span className="text-gray-400">Address</span><p className="font-medium">{getAddress(viewOrder)}</p></div>
                                <div><span className="text-gray-400">Payment</span><p className="font-medium capitalize">{viewOrder.paymentMethod || 'N/A'} ({viewOrder.paymentStatus || 'N/A'})</p></div>
                            </div>
                            <div className="border-t pt-3">
                                <h4 className="text-xs font-bold mb-2">Items</h4>
                                {(viewOrder.items || []).map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                                        <span>{item.name || item.productId} × {item.quantity}</span>
                                        <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between font-bold text-sm mt-2 pt-2 border-t"><span>Total</span><span>₹{viewOrder.total?.toLocaleString()}</span></div>
                            </div>
                            {viewOrder.timeline && viewOrder.timeline.length > 0 && (
                                <div className="border-t pt-3">
                                    <h4 className="text-xs font-bold mb-2">Timeline</h4>
                                    {viewOrder.timeline.map((t, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs py-1.5">
                                            <div className="h-2 w-2 rounded-full bg-[#1877F2] mt-1 shrink-0" />
                                            <div><p className="font-medium">{t.status}</p><p className="text-gray-400">{new Date(t.time).toLocaleString('en-IN')}</p></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Revenue Banner */}
            <div className="bg-gradient-to-r from-[#1877F2] to-[#0d47a1] rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-white/70">Total Revenue (non-cancelled)</p>
                        <p className="text-3xl font-bold mt-1">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-white/70">Total Orders</p>
                        <p className="text-3xl font-bold mt-1">{orders.length}</p>
                    </div>
                </div>
            </div>

            {/* Status Filters */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {STATUS_LIST.map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`rounded-xl border p-3 text-center transition-all ${filter === s ? "bg-[#1877F2] text-white border-[#1877F2] shadow-md" : "bg-white hover:border-[#1877F2]/30"}`}>
                        <div className="text-lg font-bold">{counts[s] || 0}</div>
                        <div className="text-[10px] capitalize opacity-70">{s === "all" ? "All" : s.toLowerCase()}</div>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID or customer name..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl border text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" />
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-400">Loading orders...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">
                        <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        <p>No orders found.</p>
                        <p className="text-[10px] text-gray-300 mt-1">Orders will appear here when customers make purchases on the storefront.</p>
                    </div>
                ) : filtered.map(order => {
                    const Icon = statusIcons[order.status] || Clock;
                    return (
                        <div key={order.id} className="p-4 border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${statusColors[order.status] || "bg-gray-100"}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm">{order.id}</span>
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[order.status] || 'bg-gray-100'}`}>{order.status}</span>
                                        {order.paymentMethod && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{order.paymentMethod}</span>}
                                    </div>
                                    <p className="text-sm mt-0.5">{getCustomerName(order)}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{(order.items || []).map(i => `${i.name || i.productId} ×${i.quantity}`).join(", ")}</p>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 flex-wrap">
                                        {getAddress(order) && <span>📍 {getAddress(order)}</span>}
                                        <span>📅 {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 flex flex-col items-end gap-2">
                                    <div className="font-bold text-sm">₹{(order.total || 0).toLocaleString()}</div>
                                    <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                                        className="text-[10px] border rounded-lg px-2 py-1 bg-white focus:outline-none" aria-label="Update status">
                                        <option value="PENDING">Pending</option><option value="PROCESSING">Processing</option>
                                        <option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                    <button onClick={() => setViewOrder(order)} className="text-[10px] text-[#1877F2] font-medium hover:underline flex items-center gap-1">
                                        <Eye className="h-3 w-3" /> Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
