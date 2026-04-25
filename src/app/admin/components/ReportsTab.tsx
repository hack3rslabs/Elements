"use client";
import { useState, useEffect } from "react";
import { Download, TrendingUp, Users, IndianRupee, ArrowUpRight, Calendar, CreditCard, Banknote, ShoppingCart, ChevronLeft, ChevronRight, Package, Zap, Target, BarChart3 } from "lucide-react";

const API = "";
const HDRS = { "Content-Type": "application/json", "x-api-key": "elements-admin-key-2026" };

interface DashStats {
    totalProducts: number; totalOrders: number; totalRevenue: string; todayOrders: number;
    totalLeads: number; totalSubscribers: number; totalCustomers: number; weeklyLeads: number;
    conversionRate: number; onlineRevenue: number; totalPayments: number;
    ordersByStatus: Record<string, number>; leadsBySource: Record<string, number>;
    leadsByStatus: Record<string, number>; categoryDistribution: Record<string, number>;
    lowStockProducts: { id: string; name: string; stock: number; sku: string }[];
    topProducts: { name: string; count: number }[];
}

const METRICS_CONFIG = [
    { key: "totalRevenue", label: "Total Revenue", icon: IndianRupee, color: "from-green-500 to-emerald-600", fmt: (v: string | number) => `₹${Number(v || 0).toLocaleString()}` },
    { key: "totalLeads", label: "Total Leads", icon: Users, color: "from-blue-500 to-indigo-600", fmt: (v: string | number) => String(v || 0) },
    { key: "totalCustomers", label: "Customers", icon: ShoppingCart, color: "from-purple-500 to-violet-600", fmt: (v: string | number) => String(v || 0) },
    { key: "totalOrders", label: "Orders", icon: Package, color: "from-amber-500 to-orange-600", fmt: (v: string | number) => String(v || 0) },
    { key: "onlineRevenue", label: "Online Revenue", icon: CreditCard, color: "from-cyan-500 to-blue-600", fmt: (v: string | number) => `₹${Number(v || 0).toLocaleString()}` },
    { key: "totalPayments", label: "Transactions", icon: Banknote, color: "from-teal-500 to-green-600", fmt: (v: string | number) => String(v || 0) },
    { key: "weeklyLeads", label: "Weekly Leads", icon: Zap, color: "from-pink-500 to-rose-600", fmt: (v: string | number) => String(v || 0) },
    { key: "conversionRate", label: "Conversion Rate", icon: Target, color: "from-indigo-500 to-purple-600", fmt: (v: string | number) => `${v || 0}%` },
];

const CALENDAR_EVENTS = [
    { date: "2026-03-01", title: "🎉 Holi Sale Launch", type: "sale", color: "bg-purple-100 text-purple-700 border-purple-200" },
    { date: "2026-03-08", title: "🌸 Women's Day Offer", type: "promo", color: "bg-pink-100 text-pink-700 border-pink-200" },
    { date: "2026-03-15", title: "📦 Q1 Inventory Review", type: "task", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { date: "2026-03-26", title: "🛕 Ugadi/Gudi Padwa Sale", type: "sale", color: "bg-orange-100 text-orange-700 border-orange-200" },
    { date: "2026-04-01", title: "📊 GST Quarter Filing", type: "task", color: "bg-gray-100 text-gray-700 border-gray-200" },
    { date: "2026-04-14", title: "🌾 Baisakhi Campaign", type: "promo", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
];

const EXPORT_TYPES = [
    { key: "sales", label: "Sales Report", icon: IndianRupee, desc: "Revenue, orders, AOV, payment methods" },
    { key: "leads", label: "Leads Report", icon: Users, desc: "All leads with source, status, follow-ups" },
    { key: "customers", label: "Customer Report", icon: ShoppingCart, desc: "Customer database with order history" },
    { key: "payments", label: "Payment Report", icon: CreditCard, desc: "Transaction details, gateway, status" },
    { key: "inventory", label: "Inventory Report", icon: Package, desc: "Stock levels, low stock alerts, categories" },
    { key: "seo", label: "SEO Audit Report", icon: BarChart3, desc: "Meta titles, descriptions, keyword coverage" },
];

export default function ReportsTab() {
    const [stats, setStats] = useState<DashStats | null>(null);
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [toast, setToast] = useState("");
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    useEffect(() => {
        fetch(`${API}/api/admin/stats`, { headers: HDRS })
            .then(r => r.json())
            .then(d => { if (d.success) setStats(d.data); })
            .catch(() => { });
    }, []);

    const exportReport = (type: string, format: 'csv' | 'pdf') => {
        if (!stats) { showToast("Loading data..."); return; }
        let csv = "";
        let tableHTML = "";
        const rTitle = EXPORT_TYPES.find(x => x.key === type)?.label || 'Report';

        switch (type) {
            case "sales":
                csv = "Metric,Value\nTotal Revenue,₹" + stats.totalRevenue + "\nTotal Orders," + stats.totalOrders + "\nOnline Revenue,₹" + stats.onlineRevenue + "\nTransactions," + stats.totalPayments;
                tableHTML = `<table><tr><th>Metric</th><th>Value</th></tr><tr><td>Total Revenue</td><td>₹${stats.totalRevenue}</td></tr><tr><td>Total Orders</td><td>${stats.totalOrders}</td></tr><tr><td>Online Revenue</td><td>₹${stats.onlineRevenue}</td></tr><tr><td>Transactions</td><td>${stats.totalPayments}</td></tr></table>`;
                break;
            case "leads":
                csv = "Source,Count\n" + Object.entries(stats.leadsBySource || {}).map(([k, v]) => `${k.replace(/_/g, ' ')},${v}`).join("\n");
                tableHTML = `<table><tr><th>Lead Source</th><th>Count</th></tr>` + Object.entries(stats.leadsBySource || {}).map(([k, v]) => `<tr><td style="text-transform:capitalize">${k.replace(/_/g, ' ')}</td><td>${v}</td></tr>`).join("") + `</table>`;
                break;
            case "customers":
                csv = "Metric,Value\nTotal Customers," + stats.totalCustomers + "\nConversion Rate," + stats.conversionRate + "%\nTotal Leads," + stats.totalLeads;
                tableHTML = `<table><tr><th>Metric</th><th>Value</th></tr><tr><td>Total Customers</td><td>${stats.totalCustomers}</td></tr><tr><td>Conversion Rate</td><td>${stats.conversionRate}%</td></tr><tr><td>Total Leads</td><td>${stats.totalLeads}</td></tr></table>`;
                break;
            case "payments":
                csv = "Metric,Value\nOnline Revenue,₹" + stats.onlineRevenue + "\nTotal Transactions," + stats.totalPayments;
                tableHTML = `<table><tr><th>Metric</th><th>Value</th></tr><tr><td>Online Revenue</td><td>₹${stats.onlineRevenue}</td></tr><tr><td>Total Transactions</td><td>${stats.totalPayments}</td></tr></table>`;
                break;
            case "inventory":
                csv = "Category,Products\n" + Object.entries(stats.categoryDistribution || {}).map(([k, v]) => `${k},${v}`).join("\n") + "\n\nLow Stock Items\nName,Stock,SKU\n" + (stats.lowStockProducts || []).map(p => `${p.name},${p.stock},${p.sku}`).join("\n");
                tableHTML = `<h3>Categories</h3><table><tr><th>Category</th><th>Products limit</th></tr>` + Object.entries(stats.categoryDistribution || {}).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("") + `</table><h3>Low Stock Items</h3><table><tr><th>Name</th><th>Stock</th><th>SKU</th></tr>` + (stats.lowStockProducts || []).map(p => `<tr><td>${p.name}</td><td>${p.stock}</td><td>${p.sku}</td></tr>`).join("") + `</table>`;
                break;
            case "seo":
                csv = "Total Products," + stats.totalProducts + "\nTotal Categories," + Object.keys(stats.categoryDistribution || {}).length;
                tableHTML = `<table><tr><th>Metric</th><th>Value</th></tr><tr><td>Total Products</td><td>${stats.totalProducts}</td></tr><tr><td>Total Categories</td><td>${Object.keys(stats.categoryDistribution || {}).length}</td></tr></table>`;
                break;
        }

        if (format === 'csv') {
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `${type}_report_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(`${rTitle} exported as Excel (CSV)!`);
        } else if (format === 'pdf') {
            const printWindow = window.open('', '', 'width=800,height=600');
            if (printWindow) {
                printWindow.document.write(`
                    <html><head><title>${rTitle}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color:#333; }
                        h2 { color: #1877F2; margin-bottom: 2px; }
                        p { margin-top: 0; color: #666; font-size: 14px; margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                        th, td { border: 1px solid #e5e7eb; padding: 12px 16px; text-align: left; }
                        th { background: #f9fafb; font-weight: 600; font-size: 13px; text-transform: uppercase; color: #4b5563; }
                        td { font-size: 14px; color: #111827; }
                        tr:nth-child(even) { background-color: #fcfcfc; }
                    </style>
                    </head><body>
                    <h2>Elements Hindustan — ${rTitle}</h2>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                    ${tableHTML}
                    <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #999;">
                        &copy; ${new Date().getFullYear()} Elements Hindustan. All Rights Reserved.
                    </div>
                    </body></html>
                `);
                printWindow.document.close();
                printWindow.focus();
                // small delay to ensure styles are applied
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
            showToast(`${rTitle} exported as PDF!`);
        }
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const empties: (number | null)[] = new Array(firstDay).fill(null) as (number | null)[];
    const days: (number | null)[] = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const calDays = empties.concat(days);
    const calEventsThisMonth = CALENDAR_EVENTS.filter(e => { const d = new Date(e.date); return d.getMonth() === calMonth && d.getFullYear() === calYear; });

    return (
        <div className="space-y-6">
            {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg">{toast}</div>}

            {/* KPI Cards — Live from Backend */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {METRICS_CONFIG.map(m => {
                    const val = stats ? (stats as unknown as Record<string, unknown>)[m.key] : null;
                    return (
                        <div key={m.key} className="bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}><m.icon className="h-4 w-4" /></div>
                                <ArrowUpRight className="h-3.5 w-3.5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-xl font-bold">{val !== null && val !== undefined ? m.fmt(val as string | number) : '—'}</div>
                            <p className="text-[10px] text-gray-400 mt-0.5">{m.label}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lead Source Breakdown */}
                <div className="bg-white rounded-2xl border shadow-sm p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-[#1877F2]" /> Leads by Source</h3>
                    {stats?.leadsBySource && Object.keys(stats.leadsBySource).length > 0 ? (
                        <div className="space-y-2.5">
                            {Object.entries(stats.leadsBySource).sort(([, a], [, b]) => b - a).map(([source, count]) => {
                                const pct = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0;
                                return (
                                    <div key={source}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="capitalize font-medium">{source.replace(/_/g, ' ')}</span>
                                            <span className="text-gray-400">{count} ({pct.toFixed(0)}%)</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#1877F2] to-[#0d47a1] rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-xs text-gray-400">No lead data yet. Integrate platforms to start tracking.</p>}
                </div>

                {/* Lead Status Pipeline */}
                <div className="bg-white rounded-2xl border shadow-sm p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-purple-500" /> Lead Pipeline</h3>
                    {stats?.leadsByStatus && Object.keys(stats.leadsByStatus).length > 0 ? (
                        <div className="space-y-2.5">
                            {Object.entries(stats.leadsByStatus).map(([status, count]) => {
                                const colors: Record<string, string> = { new: 'bg-blue-500', contacted: 'bg-yellow-500', qualified: 'bg-green-500', proposal: 'bg-purple-500', negotiation: 'bg-orange-500', won: 'bg-emerald-500', lost: 'bg-red-400' };
                                return (
                                    <div key={status} className="flex items-center gap-3">
                                        <div className={`h-3 w-3 rounded-full ${colors[status] || 'bg-gray-400'}`} />
                                        <span className="text-xs capitalize flex-1">{status}</span>
                                        <span className="text-xs font-bold">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-xs text-gray-400">No leads in pipeline yet.</p>}
                </div>
            </div>

            {/* Top Products & Category */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border shadow-sm p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-amber-500" /> Top Selling Products</h3>
                    {stats?.topProducts && stats.topProducts.length > 0 ? (
                        <div className="space-y-2">{stats.topProducts.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs p-2 bg-gray-50 rounded-xl">
                                <span className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-[10px] font-bold">#{i + 1}</span>
                                <span className="flex-1 truncate">{p.name}</span>
                                <span className="font-bold">{p.count} sold</span>
                            </div>
                        ))}</div>
                    ) : <p className="text-xs text-gray-400">Sales data will appear after orders are placed.</p>}
                </div>

                <div className="bg-white rounded-2xl border shadow-sm p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><Package className="h-4 w-4 text-green-500" /> Inventory by Category</h3>
                    {stats?.categoryDistribution && Object.keys(stats.categoryDistribution).length > 0 ? (
                        <div className="space-y-2">{Object.entries(stats.categoryDistribution).map(([cat, count]) => (
                            <div key={cat} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-xl">
                                <span>{cat}</span><span className="font-bold">{count} products</span>
                            </div>
                        ))}</div>
                    ) : <p className="text-xs text-gray-400">Loading...</p>}
                </div>
            </div>

            {/* Export Reports */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Download className="h-5 w-5 text-[#1877F2]" /> Export Advanced Reports</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {EXPORT_TYPES.map(r => (
                        <div key={r.key} className="border rounded-2xl p-4 flex flex-col hover:border-blue-200 hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <r.icon className="h-4 w-4 text-[#1877F2]" />
                                <span className="text-sm font-bold">{r.label}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mb-4 flex-1">{r.desc}</p>
                            <div className="flex items-center gap-2 mt-auto">
                                <button onClick={() => exportReport(r.key, 'pdf')} className="flex-1 text-[10px] bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors">
                                    <Download className="h-3 w-3" /> PDF
                                </button>
                                <button onClick={() => exportReport(r.key, 'csv')} className="flex-1 text-[10px] bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors">
                                    <Download className="h-3 w-3" /> Excel
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Business Calendar */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-500" /> Business Calendar</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-gray-100" aria-label="Previous month"><ChevronLeft className="h-3.5 w-3.5" /></button>
                        <span className="text-xs font-medium w-32 text-center">{monthNames[calMonth]} {calYear}</span>
                        <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-gray-100" aria-label="Next month"><ChevronRight className="h-3.5 w-3.5" /></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>)}</div>
                <div className="grid grid-cols-7 gap-1">
                    {calDays.map((day, i) => {
                        if (!day) return <div key={`empty-${i}`} />;
                        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const ev = calEventsThisMonth.find(e => e.date === dateStr);
                        const isToday = dateStr === new Date().toISOString().slice(0, 10);
                        return (
                            <div key={day} className={`h-10 rounded-lg flex items-center justify-center text-xs cursor-default transition-colors ${isToday ? 'bg-[#1877F2] text-white font-bold' : ev ? ev.color + ' border font-medium' : 'hover:bg-gray-50'}`} title={ev?.title}>
                                {day}
                            </div>
                        );
                    })}
                </div>
                {calEventsThisMonth.length > 0 && (
                    <div className="mt-3 space-y-1.5">{calEventsThisMonth.map(ev => (
                        <div key={ev.date} className={`text-xs px-3 py-2 rounded-lg border ${ev.color}`}>{ev.date.slice(-2)} — {ev.title}</div>
                    ))}</div>
                )}
            </div>
        </div>
    );
}

