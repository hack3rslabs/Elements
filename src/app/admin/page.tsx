"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard, Package, ImageIcon, Users, ListTodo, Megaphone,
    Search as SearchIcon, Settings, Menu, X, Plus, Edit, Trash2, Eye,
    TrendingUp, ShoppingCart, Star, Phone, BarChart3, Globe, ArrowUpRight,
    Bell, LogOut, Upload, Save, CheckCircle2, AlertCircle,
    Sparkles, Shield, Loader2, Link2, FileText, Truck, CreditCard,
    ArrowDownRight, IndianRupee, SlidersHorizontal, GripVertical, ToggleLeft, ToggleRight
} from "lucide-react";
import OrdersTab from "./components/OrdersTab";
import IntegrationsTab from "./components/IntegrationsTab";
import ReportsTab from "./components/ReportsTab";
import CRMTab from "./components/CRMTab";
import PaymentsTab from "./components/PaymentsTab";
import StaffTab from "./components/StaffTab";
import CustomersTab from "./components/CustomersTab";
import ImageUploader from "@/components/ui/ImageUploader";
import { CATEGORIES } from "@/constants/categories";


const API = "";
const HEADERS = { "Content-Type": "application/json", "x-api-key": "elements-admin-key-2026" };

interface Product {
    id: string; name: string; slug: string; price: number; mrp: number;
    stockStatus: string; stock: number; categoryName: string; images: string[];
    rating: number; reviewCount: number; isBestSeller: boolean; isNewArrival: boolean;
    sku: string; metaTitle: string; metaDescription: string; tags: string[];
}
interface Task { id: string; title: string; status: 'todo' | 'progress' | 'done'; priority: 'low' | 'medium' | 'high'; assignee: string; due: string; }
interface Banner { id: string; title: string; image: string; link: string; position: string; active: boolean; }
interface Campaign { id: string; name: string; platform: string; budget: number; spent: number; clicks: number; conversions: number; status: string; }
interface PageSeo { id: string; page: string; path: string; metaTitle: string; metaDescription: string; ogImage: string; keywords: string; }
interface HeroSlide {
    id: string; title: string; subtitle: string; description: string;
    image: string; contextImage: string; cta: string; ctaLink: string;
    color: string; highlight: string; priceRange: string;
    status: string; order: number;
}
interface DashStats {
    totalProducts: number; totalOrders: number; totalRevenue: string; todayOrders: number;
    totalLeads: number; totalSubscribers: number; totalCustomers: number; weeklyLeads: number;
    conversionRate: number; onlineRevenue: number; totalPayments: number;
    ordersByStatus: Record<string, number>; leadsBySource: Record<string, number>;
    leadsByStatus: Record<string, number>; categoryDistribution: Record<string, number>;
    lowStockProducts: { id: string; name: string; stock: number; sku: string }[];
    topProducts: { name: string; count: number }[];
}

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
    { icon: Package, label: "Products", key: "products" },
    { icon: ShoppingCart, label: "Orders", key: "orders" },
    { icon: Users, label: "CRM / Leads", key: "crm" },
    { icon: CreditCard, label: "Payments", key: "payments" },
    { icon: SlidersHorizontal, label: "Hero Slides", key: "heroslides" },
    { icon: Megaphone, label: "Campaigns", key: "campaigns" },
    { icon: BarChart3, label: "Reports", key: "reports" },
    { icon: Link2, label: "Integrations", key: "integrations" },
    { icon: Users, label: "Staff & Roles", key: "staff" },
    { icon: Users, label: "Customers", key: "customers" },
    { icon: Globe, label: "SEO", key: "seo" },
    { icon: Settings, label: "Settings", key: "settings" },
];

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [dashStats, setDashStats] = useState<DashStats | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [showBannerForm, setShowBannerForm] = useState(false);
    const [bannerForm, setBannerForm] = useState({ title: '', image: '', link: '/', position: 'hero' });
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [showCampaignForm, setShowCampaignForm] = useState(false);
    const [campaignForm, setCampaignForm] = useState({ name: '', platform: 'google', budget: '' });
    const [settingsForm, setSettingsForm] = useState({ storeName: '', tagline: '', supportEmail: '', contactPhone: '', freeShippingAbove: '', deliveryTime: '', gstNumber: '', panNumber: '' });
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState({ name: '', price: '', mrp: '', category: CATEGORIES[0].name, stock: '', description: '', sku: '', metaTitle: '', metaDescription: '', tags: '', images: '' });
    const [productSearch, setProductSearch] = useState('');
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium' as Task['priority'], assignee: '', due: '' });
    const [pageSeo, setPageSeo] = useState<PageSeo[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [editingSeo, setEditingSeo] = useState<string | null>(null);
    const [toast, setToast] = useState('');
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // ── Hero Slides state ──────────────────────────────────────────────────────
    const EMPTY_SLIDE_FORM = { title: '', subtitle: '', description: '', image: '', contextImage: '', cta: '', ctaLink: '', color: 'from-[#0a192f] via-[#112240] to-[#1877F2]', highlight: '', priceRange: '', status: 'active', order: '' };
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [showSlideForm, setShowSlideForm] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [slideForm, setSlideForm] = useState(EMPTY_SLIDE_FORM);
    const [deleteSlideConfirm, setDeleteSlideConfirm] = useState<string | null>(null);
    const [slideFormError, setSlideFormError] = useState('');

    const handleSaveSlide = async () => {
        setSlideFormError('');
        if (!slideForm.title || !slideForm.image || !slideForm.cta || !slideForm.ctaLink) {
            setSlideFormError('Title, Image URL, CTA text, and CTA Link are required.');
            return;
        }
        const payload = { ...slideForm, order: slideForm.order !== '' ? Number(slideForm.order) : undefined };
        try {
            let res: Response;
            if (editingSlide) {
                res = await fetch(`${API}/api/admin/heroslides/${editingSlide.id}`, { method: 'PUT', headers: HEADERS, body: JSON.stringify(payload) });
            } else {
                res = await fetch(`${API}/api/admin/heroslides`, { method: 'POST', headers: HEADERS, body: JSON.stringify(payload) });
            }

            // Parse the JSON response
            let d: any;
            try {
                d = await res.json();
            } catch {
                setSlideFormError(`Server error (${res.status}): Response is not valid JSON. Check if the backend is running correctly.`);
                return;
            }

            if (!res.ok || !d.success) {
                setSlideFormError(d.message || d.error || `Server returned ${res.status}`);
                return;
            }

            if (editingSlide) {
                setHeroSlides(prev => prev.map(s => s.id === editingSlide.id ? d.data : s));
                showToast('Slide updated!');
            } else {
                setHeroSlides(prev => [...prev, d.data]);
                showToast('Slide created!');
            }
            setShowSlideForm(false); setEditingSlide(null); setSlideForm(EMPTY_SLIDE_FORM);
        } catch (err: any) {
            console.error('[HeroSlides] Save error:', err);
            if (err?.message?.includes('fetch') || err?.name === 'TypeError') {
                setSlideFormError(`Cannot connect to the server. Make sure the application is running.`);
            } else {
                setSlideFormError(`Error: ${err?.message || 'Unknown error. Check browser console for details.'}`);
            }
        }
    };


    const handleToggleSlide = async (id: string) => {
        try {
            const res = await fetch(`${API}/api/admin/heroslides/${id}/toggle`, { method: 'PATCH', headers: HEADERS });
            const d = await res.json();
            if (d.success) setHeroSlides(prev => prev.map(s => s.id === id ? d.data : s));
        } catch { showToast('Toggle failed'); }
    };

    const handleDeleteSlide = async (id: string) => {
        try {
            await fetch(`${API}/api/admin/heroslides/${id}`, { method: 'DELETE', headers: HEADERS });
            setHeroSlides(prev => prev.filter(s => s.id !== id)); showToast('Slide deleted!');
        } catch { showToast('Delete failed'); }
        setDeleteSlideConfirm(null);
    };

    const fetchData = useCallback(async () => {
        const fetchSafely = async (url: string, opts?: any) => {
            try {
                const res = await fetch(url, opts);
                if (!res.ok) return null;
                return await res.json();
            } catch { return null; }
        };

        const [prodData, statsData, seoData, bannerData, campData, settingsData, staffData, heroData] = await Promise.all([
            fetchSafely(`${API}/api/products?limit=50`),
            fetchSafely(`${API}/api/admin/stats`, { headers: HEADERS }),
            fetchSafely(`${API}/api/admin/seo`, { headers: HEADERS }),
            fetchSafely(`${API}/api/admin/banners`, { headers: HEADERS }),
            fetchSafely(`${API}/api/admin/campaigns`, { headers: HEADERS }),
            fetchSafely(`${API}/api/admin/settings`, { headers: HEADERS }),
            fetchSafely(`${API}/api/admin/staff`, { headers: HEADERS }),
            fetchSafely(`${API}/api/admin/heroslides`, { headers: HEADERS }),
        ]);

        if (prodData?.success) setProducts(prodData.data);
        if (statsData?.success) setDashStats(statsData.data);
        if (seoData?.success) setPageSeo(seoData.data);
        if (bannerData?.success) setBanners(bannerData.data);
        if (campData?.success) setCampaigns(campData.data);
        if (settingsData?.success) setSettingsForm(settingsData.data);
        if (staffData?.success) setStaff(staffData.data);
        if (heroData?.success) setHeroSlides(heroData.data);
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            fetchData();
        } else if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/admin");
        }
    }, [status, fetchData, router]);

    const handleAddProduct = async () => {
        try {
            const res = await fetch(`${API}/api/products`, {
                method: 'POST', headers: HEADERS,
                body: JSON.stringify({ name: productForm.name, price: Number(productForm.price), mrp: Number(productForm.mrp), categoryName: productForm.category, stock: Number(productForm.stock), description: productForm.description, sku: productForm.sku, metaTitle: productForm.metaTitle, metaDescription: productForm.metaDescription, tags: productForm.tags.split(',').map(t => t.trim()).filter(Boolean), images: productForm.images.split(',').map(i => i.trim()).filter(Boolean) }),
            });
            const data = await res.json();
            if (data.success && data.data) { setProducts(prev => [data.data, ...prev]); showToast('Product added!'); }
        } catch { showToast('Saved locally'); }
        setShowProductForm(false);
        setProductForm({ name: '', price: '', mrp: '', category: CATEGORIES[0].name, stock: '', description: '', sku: '', metaTitle: '', metaDescription: '', tags: '', images: '' });
    };

    const startEditProduct = (p: Product) => {
        setEditingProduct(p);
        setProductForm({ name: p.name, price: p.price.toString(), mrp: p.mrp.toString(), category: p.categoryName, stock: p.stock.toString(), description: '', sku: p.sku, metaTitle: p.metaTitle || '', metaDescription: p.metaDescription || '', tags: (p.tags || []).join(', '), images: (p.images || []).join(', ') });
        setShowProductForm(true);
    };

    const handleUpdateProduct = async () => {
        if (!editingProduct) return;
        try {
            await fetch(`${API}/api/products/${editingProduct.id}`, {
                method: 'PUT', headers: HEADERS,
                body: JSON.stringify({ name: productForm.name, price: Number(productForm.price), mrp: Number(productForm.mrp), categoryName: productForm.category, stock: Number(productForm.stock), sku: productForm.sku, metaTitle: productForm.metaTitle, metaDescription: productForm.metaDescription, tags: productForm.tags.split(',').map(t => t.trim()).filter(Boolean), images: productForm.images.split(',').map(i => i.trim()).filter(Boolean) }),
            });
            showToast('Product updated!');
        } catch { showToast('Updated locally'); }
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, name: productForm.name, price: Number(productForm.price), mrp: Number(productForm.mrp), categoryName: productForm.category, stock: Number(productForm.stock), sku: productForm.sku, metaTitle: productForm.metaTitle, metaDescription: productForm.metaDescription, tags: productForm.tags.split(',').map(t => t.trim()).filter(Boolean), images: productForm.images.split(',').map(i => i.trim()).filter(Boolean) } : p));
        setEditingProduct(null); setShowProductForm(false);
        setProductForm({ name: '', price: '', mrp: '', category: CATEGORIES[0].name, stock: '', description: '', sku: '', metaTitle: '', metaDescription: '', tags: '', images: '' });
    };

    const handleDeleteProduct = async (id: string) => {
        try { await fetch(`${API}/api/products/${id}`, { method: 'DELETE', headers: HEADERS }); showToast('Product deleted!'); } catch { showToast('Deleted locally'); }
        setProducts(prev => prev.filter(p => p.id !== id)); setDeleteConfirm(null);
    };

    const handleSaveSeo = async (seo: PageSeo) => {
        try { await fetch(`${API}/api/admin/seo/${seo.id}`, { method: 'PUT', headers: HEADERS, body: JSON.stringify(seo) }); showToast('SEO updated!'); } catch { showToast('Saved locally'); }
        setEditingSeo(null);
    };

    const handleAddTask = () => {
        setTasks(prev => [{ id: `task-${Date.now()}`, title: taskForm.title, status: 'todo', priority: taskForm.priority, assignee: taskForm.assignee, due: taskForm.due }, ...prev]);
        setShowTaskForm(false); setTaskForm({ title: '', priority: 'medium', assignee: '', due: '' });
    };

    const updateTaskStatus = (id: string, s: Task['status']) => { setTasks(prev => prev.map(t => t.id === id ? { ...t, status: s } : t)); };
    const filteredProducts = products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()));

    if (status === "loading") return <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#1877F2] mb-4" /><p className="text-sm text-gray-500">Loading admin panel...</p></div>;
    if (!session) return <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#1877F2] mb-4" /><p className="text-sm text-gray-500">Redirecting to login...</p></div>;
    const userRole = (session?.user as { role?: string })?.role;
    const userPerms = (session?.user as { permissions?: string[] })?.permissions || [];

    // Final boundary check
    if (status !== "authenticated" || !session) {
        return <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#1877F2] mb-4" /><p className="text-sm text-gray-500">Redirecting...</p></div>;
    }

    if (userRole !== "ADMIN" && userRole !== "STAFF") {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
                <div className="bg-white rounded-3xl shadow-2xl border p-10 text-center max-w-md">
                    <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-sm text-gray-500 mb-6">Unauthorized: You do not have the required permissions.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1877F2] text-white text-sm font-medium">Return Home</Link>
                </div>
            </div>
        );
    }

    const hasAccess = (perm: string) => userRole === 'ADMIN' || userPerms.includes('all') || (userPerms.includes('dashboard') && perm === 'dashboard') || userPerms.includes(perm);

    const filteredNav = NAV_ITEMS.filter(item => hasAccess(item.key));

    const ds = dashStats;

    return (
        <div className="h-screen flex bg-gray-50">
            {toast && <div className="fixed top-4 right-4 z-[99] bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{toast}</div>}
            {deleteConfirm && <div className="fixed inset-0 bg-black/40 z-[98] flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"><h3 className="font-bold text-lg mb-2">Delete Product?</h3><p className="text-sm text-gray-500 mb-4">This action cannot be undone.</p><div className="flex gap-3"><button onClick={() => setDeleteConfirm(null)} className="flex-1 border rounded-xl h-10 text-sm hover:bg-gray-50">Cancel</button><button onClick={() => handleDeleteProduct(deleteConfirm)} className="flex-1 bg-red-500 text-white rounded-xl h-10 text-sm font-medium hover:bg-red-600">Delete</button></div></div></div>}

            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex inset-y-0 left-0 z-50 w-60 bg-[#0a0a0a] text-white flex-col">
                <div className="p-4 border-b border-white/10">
                    <Image src="/images/brand/elements-logo.png" alt="Elements" width={120} height={36} className="h-8 w-auto object-contain brightness-0 invert" />
                    <span className="block text-[10px] text-gray-500 mt-1 tracking-widest uppercase">Admin Panel</span>
                </div>
                <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                    {filteredNav.map(item => (
                        <button key={item.key} onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all ${activeTab === item.key ? 'bg-[#1877F2] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            <div className="flex items-center gap-2.5">
                                <item.icon className="h-4 w-4" />{item.label}
                            </div>
                            {item.key === 'products' && <span className="bg-white/10 text-[10px] px-1.5 py-0.5 rounded-full">{ds?.totalProducts || products.length || 0}</span>}
                            {item.key === 'orders' && <span className="bg-white/10 text-[10px] px-1.5 py-0.5 rounded-full">{ds?.totalOrders || 0}</span>}
                            {item.key === 'crm' && <span className="bg-white/10 text-[10px] px-1.5 py-0.5 rounded-full">{ds?.totalLeads || 0}</span>}
                        </button>
                    ))}
                </nav>
                <div className="p-3 border-t border-white/10 space-y-2">
                    <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"><Eye className="h-3.5 w-3.5" /> View Storefront</Link>
                    <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors w-full"><LogOut className="h-3.5 w-3.5" /> Sign Out</button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex items-center justify-around px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-x-auto">
                {filteredNav.slice(0, 5).map(item => (
                    <button key={item.key} onClick={() => setActiveTab(item.key)} className={`flex flex-col items-center p-2 min-w-[64px] rounded-xl transition-all ${activeTab === item.key ? 'text-[#1877F2] font-bold' : 'text-gray-400 hover:text-gray-900'}`}>
                        <item.icon className={`h-5 w-5 mb-1 ${activeTab === item.key ? 'fill-[#1877F2]/10 text-[#1877F2]' : ''}`} />
                        <span className="text-[9px] whitespace-nowrap">{item.label}</span>
                    </button>
                ))}
                <button onClick={() => setSidebarOpen(true)} className="flex flex-col items-center p-2 min-w-[64px] rounded-xl text-gray-400 hover:text-gray-900">
                    <Menu className="h-5 w-5 mb-1" />
                    <span className="text-[9px] whitespace-nowrap">More</span>
                </button>
            </div>

            {/* Mobile "More" Menu Drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] md:hidden flex justify-end">
                    <div className="w-64 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <span className="font-bold text-sm">More Options</span>
                            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-full hover:bg-gray-200"><X className="h-5 w-5 text-gray-500" /></button>
                        </div>
                        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
                            {filteredNav.slice(5).map(item => (
                                <button key={item.key} onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activeTab === item.key ? 'bg-blue-50 text-[#1877F2] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    <item.icon className="h-5 w-5" />{item.label}
                                </button>
                            ))}
                        </nav>
                        <div className="p-4 border-t bg-gray-50 space-y-3">
                            <Link href="/" className="flex items-center gap-2 text-sm text-gray-600 font-medium"><Eye className="h-4 w-4" /> View Storefront</Link>
                            <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-2 text-sm text-red-500 font-bold w-full"><LogOut className="h-4 w-4" /> Sign Out</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden pb-[70px] md:pb-0">
                <header className="bg-white border-b px-4 md:px-6 h-14 flex items-center justify-between md:justify-start gap-4 shrink-0 shadow-sm z-30">
                    <div className="flex items-center gap-3 md:hidden">
                        <Image src="/images/brand/icon.png" alt="Elements" width={24} height={24} className="h-6 w-auto" />
                        <h1 className="font-bold text-sm md:text-base capitalize">{activeTab === 'crm' ? 'CRM / Leads' : activeTab}</h1>
                    </div>
                    <h1 className="hidden md:block font-semibold text-sm md:text-base capitalize">{activeTab === 'crm' ? 'CRM / Leads' : activeTab}</h1>
                    <div className="flex-1 hidden md:block" />
                    <div className="flex items-center gap-3">
                        <button aria-label="Notifications" className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center relative"><Bell className="h-4 w-4" /><span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{ds?.totalLeads || 0}</span></button>
                        <span className="text-xs text-gray-500 hidden md:inline">{session?.user?.name || 'Admin'}</span>
                        <button onClick={() => signOut({ callbackUrl: '/login' })} className="hidden md:flex h-9 w-9 rounded-full bg-red-50 items-center justify-center hover:bg-red-100 transition-colors" title="Logout"><LogOut className="h-4 w-4 text-red-500" /></button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {/* DASHBOARD */}
                    {activeTab === "dashboard" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Total Products", value: ds?.totalProducts || products.length, icon: Package, change: `${ds?.lowStockProducts?.length || 0} low stock`, color: "bg-blue-500", up: true, tab: "products" },
                                    { label: "Total Orders", value: ds?.totalOrders || 0, icon: ShoppingCart, change: `${ds?.todayOrders || 0} today`, color: "bg-green-500", up: true, tab: "orders" },
                                    { label: "Total Revenue", value: `₹${Number(ds?.totalRevenue || 0).toLocaleString()}`, icon: IndianRupee, change: `₹${(ds?.onlineRevenue || 0).toLocaleString()} online`, color: "bg-amber-500", up: true, tab: "reports" },
                                    { label: "Total Leads", value: ds?.totalLeads || 0, icon: Users, change: `${ds?.weeklyLeads || 0} this week`, color: "bg-purple-500", up: true, tab: "crm" },
                                ].map(stat => (
                                    <button key={stat.label} onClick={() => setActiveTab(stat.tab)} className="bg-white rounded-2xl p-4 md:p-5 border shadow-sm text-left hover:shadow-md hover:border-[#1877F2]/30 transition-all cursor-pointer group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`h-10 w-10 rounded-xl ${stat.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}><stat.icon className="h-5 w-5" /></div>
                                            {stat.up ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-400" />}
                                        </div>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                        <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                                        <p className="text-[10px] text-green-600 mt-1">{stat.change}</p>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Leads by Source */}
                                <div className="bg-white rounded-2xl border shadow-sm p-5">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-[#1877F2]" /> Leads by Source</h3>
                                    {ds?.leadsBySource && Object.keys(ds.leadsBySource).length > 0 ? (
                                        <div className="space-y-2">
                                            {Object.entries(ds.leadsBySource).map(([source, count]) => (
                                                <div key={source} className="flex items-center gap-3">
                                                    <span className="text-xs w-24 truncate capitalize">{source.replace(/_/g, ' ')}</span>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#1877F2] rounded-full" style={{ width: `${Math.min(100, (count / ds.totalLeads) * 100)}%` }} /></div>
                                                    <span className="text-xs font-medium w-8 text-right">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-xs text-gray-400">No leads yet. Integrate platforms to start receiving leads.</p>}
                                    <button onClick={() => setActiveTab('crm')} className="text-xs text-[#1877F2] font-medium hover:underline mt-3 block">View All Leads →</button>
                                </div>

                                {/* Low Stock Alerts */}
                                <div className="bg-white rounded-2xl border shadow-sm p-5">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" /> Low Stock Alerts</h3>
                                    {ds?.lowStockProducts && ds.lowStockProducts.length > 0 ? (
                                        <div className="space-y-2">
                                            {ds.lowStockProducts.map(p => (
                                                <div key={p.id} className="flex items-center gap-3 p-2 bg-amber-50 rounded-xl border border-amber-100">
                                                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                                                    <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{p.name}</p><p className="text-[10px] text-gray-400">SKU: {p.sku}</p></div>
                                                    <span className="text-xs font-bold text-amber-700">{p.stock} left</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-xs text-gray-400">All products have sufficient stock.</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <button onClick={() => setActiveTab('orders')} className="bg-white p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all text-left flex items-start justify-between group">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sales</p>
                                        <p className="text-2xl font-black">₹{Number(ds?.totalRevenue || 0).toLocaleString()}</p>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full w-fit"><TrendingUp className="h-3 w-3" /> +12%</div>
                                    </div>
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><IndianRupee className="h-5 w-5" /></div>
                                </button>

                                <button onClick={() => setActiveTab('orders')} className="bg-white p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all text-left flex items-start justify-between group">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                                        <p className="text-2xl font-black">{ds?.totalOrders || 0}</p>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full w-fit"><TrendingUp className="h-3 w-3" /> +5%</div>
                                    </div>
                                    <div className="h-10 w-10 rounded-2xl bg-blue-50 text-[#1877F2] flex items-center justify-center group-hover:scale-110 transition-transform"><ShoppingCart className="h-5 w-5" /></div>
                                </button>

                                <button onClick={() => setActiveTab('crm')} className="bg-white p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all text-left flex items-start justify-between group">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Leads</p>
                                        <p className="text-2xl font-black">{ds?.totalLeads || 0}</p>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full w-fit"><Users className="h-3 w-3" /> CRM</div>
                                    </div>
                                    <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Users className="h-5 w-5" /></div>
                                </button>

                                <button onClick={() => setActiveTab('customers')} className="bg-white p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all text-left flex items-start justify-between group">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Customers</p>
                                        <p className="text-2xl font-black">{ds?.totalCustomers || 0}</p>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full w-fit"><Star className="h-3 w-3" /> Loyal</div>
                                    </div>
                                    <div className="h-10 w-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Users className="h-5 w-5" /></div>
                                </button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Category Distribution */}
                                <div className="bg-white rounded-2xl border shadow-sm p-5">
                                    <h3 className="font-semibold mb-3 text-sm">Products by Category</h3>
                                    {ds?.categoryDistribution ? (
                                        <div className="space-y-2">
                                            {Object.entries(ds.categoryDistribution).map(([cat, count]) => (
                                                <div key={cat} className="flex items-center justify-between text-xs"><span className="text-gray-600 truncate">{cat}</span><span className="font-bold">{count}</span></div>
                                            ))}
                                        </div>
                                    ) : <p className="text-xs text-gray-400">Loading...</p>}
                                </div>

                                {/* Orders by Status */}
                                <div className="bg-white rounded-2xl border shadow-sm p-5">
                                    <h3 className="font-semibold mb-3 text-sm">Orders by Status</h3>
                                    {ds?.ordersByStatus && Object.keys(ds.ordersByStatus).length > 0 ? (
                                        <div className="space-y-2">
                                            {Object.entries(ds.ordersByStatus).map(([s, c]) => (
                                                <div key={s} className="flex items-center justify-between text-xs"><span className="text-gray-600 capitalize">{s.toLowerCase()}</span><span className="font-bold">{c}</span></div>
                                            ))}
                                        </div>
                                    ) : <p className="text-xs text-gray-400">No orders yet.</p>}
                                    <button onClick={() => setActiveTab('orders')} className="text-xs text-[#1877F2] font-medium hover:underline mt-3 block">View Orders →</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PRODUCTS */}
                    {activeTab === "products" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <p className="text-sm text-gray-400">{products.length} products</p>
                                    <div className="relative"><SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" /><input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search..." className="h-8 pl-8 pr-3 rounded-lg border text-xs w-40 focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" /></div>
                                </div>
                                <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: '', mrp: '', category: CATEGORIES[0].name, stock: '', description: '', sku: '', metaTitle: '', metaDescription: '', tags: '', images: '' }); setShowProductForm(true); }} className="inline-flex items-center gap-2 bg-[#1877F2] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#0d47a1] shadow-md"><Plus className="h-4 w-4" /> Add Product</button>
                            </div>
                            {showProductForm && (
                                <div className="bg-white rounded-2xl border shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-5"><h3 className="font-semibold text-lg">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3><button onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"><X className="h-4 w-4" /></button></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Product Name *</label><input value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="e.g. Premium SS Kitchen Sink" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">SKU *</label><input value={productForm.sku} onChange={e => setProductForm(p => ({ ...p, sku: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="EL-KS-XXX" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Price (₹) *</label><input type="number" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="4999" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">MRP (₹) *</label><input type="number" value={productForm.mrp} onChange={e => setProductForm(p => ({ ...p, mrp: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="7999" /></div>
                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-dashed">
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">1. Main Category</label>
                                                <select 
                                                    value={CATEGORIES.find(c => 
                                                        c.name === productForm.category || 
                                                        c.subCategories?.some(sc => sc.name === productForm.category || sc.subCategories?.some(m => m.name === productForm.category))
                                                    )?.name || ""} 
                                                    onChange={e => {
                                                        const cat = CATEGORIES.find(c => c.name === e.target.value);
                                                        setProductForm(p => ({ ...p, category: cat?.name || "" }));
                                                    }} 
                                                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none" 
                                                >
                                                    <option value="">Select Category</option>
                                                    {CATEGORIES.map(cat => (
                                                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">2. Sub Category</label>
                                                <select 
                                                    value={CATEGORIES.find(c => c.subCategories?.some(sc => sc.name === productForm.category || sc.subCategories?.some(m => m.name === productForm.category)))
                                                        ?.subCategories?.find(sc => sc.name === productForm.category || sc.subCategories?.some(m => m.name === productForm.category))?.name || ""} 
                                                    onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))} 
                                                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50 disabled:bg-gray-100" 
                                                    disabled={!CATEGORIES.find(c => 
                                                        c.name === productForm.category || 
                                                        c.subCategories?.some(sc => sc.name === productForm.category || sc.subCategories?.some(m => m.name === productForm.category))
                                                    )?.subCategories}
                                                >
                                                    <option value="">Select Sub Category</option>
                                                    {CATEGORIES.find(c => 
                                                        c.name === productForm.category || 
                                                        c.subCategories?.some(sc => sc.name === productForm.category || sc.subCategories?.some(m => m.name === productForm.category))
                                                    )?.subCategories?.map(sub => (
                                                        <option key={sub.name} value={sub.name}>{sub.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">3. Model</label>
                                                <select 
                                                    value={productForm.category} 
                                                    onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))} 
                                                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50 disabled:bg-gray-100" 
                                                    disabled={!CATEGORIES.flatMap(c => c.subCategories || []).find(sc => sc.name === productForm.category || sc.subCategories?.some(m => m.name === productForm.category))?.subCategories}
                                                >
                                                    <option value="">Select Model (Optional)</option>
                                                    {CATEGORIES.flatMap(c => c.subCategories || [])
                                                        .find(sc => sc.name === productForm.category || sc.subCategories?.some(m => m.name === productForm.category))
                                                        ?.subCategories?.map(model => (
                                                            <option key={model.name} value={model.name}>{model.name}</option>
                                                        ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Stock</label><input type="number" value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="50" /></div>
                                        <div className="md:col-span-2"><label className="text-xs font-medium text-gray-500 block mb-1">Description</label><textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="Product description..." /></div>
                                        <div className="md:col-span-2 space-y-4">
                                            <label className="text-sm font-semibold text-gray-700">Product Gallery (Max 4 Images)</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {[0, 1, 2, 3].map((index) => {
                                                    const imagesArr = productForm.images.split(',').map(s => s.trim()).filter(Boolean);
                                                    return (
                                                        <ImageUploader
                                                            key={index}
                                                            label={`Image ${index + 1}`}
                                                            value={imagesArr[index] || ''}
                                                            onChange={(url) => {
                                                                const newArr = [...imagesArr];
                                                                // If url is empty (cleared), remove it or set to empty
                                                                if (!url) {
                                                                    newArr.splice(index, 1);
                                                                } else {
                                                                    newArr[index] = url;
                                                                }
                                                                setProductForm(p => ({ ...p, images: newArr.filter(Boolean).join(', ') }));
                                                            }}
                                                            placeholder={`Image URL ${index + 1}`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">SEO Title</label><input value={productForm.metaTitle} onChange={e => setProductForm(p => ({ ...p, metaTitle: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="SEO title" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">SEO Description</label><input value={productForm.metaDescription} onChange={e => setProductForm(p => ({ ...p, metaDescription: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="Meta description" /></div>
                                        <div className="md:col-span-2"><label className="text-xs font-medium text-gray-500 block mb-1">Tags (comma separated)</label><input value={productForm.tags} onChange={e => setProductForm(p => ({ ...p, tags: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="kitchen sink, stainless steel" /></div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6"><button onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="px-4 py-2 rounded-full border text-sm font-medium hover:bg-gray-50">Cancel</button><button onClick={editingProduct ? handleUpdateProduct : handleAddProduct} className="px-6 py-2 rounded-full bg-[#1877F2] text-white text-sm font-medium hover:bg-[#0d47a1] shadow-md flex items-center gap-2"><Save className="h-4 w-4" /> {editingProduct ? 'Update' : 'Save'}</button></div>
                                </div>
                            )}

                            {deleteConfirm && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
                                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="h-6 w-6 text-red-500" /></div>
                                        <h3 className="text-xl font-bold text-center mb-2">Delete Product?</h3>
                                        <p className="text-sm text-center text-gray-500 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl border text-sm font-bold hover:bg-gray-50">Cancel</button>
                                            <button onClick={() => handleDeleteProduct(deleteConfirm)} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-600">Yes, Delete</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr><th className="text-left p-3 font-medium text-xs text-gray-500">Product</th><th className="text-left p-3 font-medium text-xs text-gray-500 hidden md:table-cell">Category</th><th className="text-right p-3 font-medium text-xs text-gray-500">Price</th><th className="text-center p-3 font-medium text-xs text-gray-500 hidden lg:table-cell">Stock</th><th className="text-center p-3 font-medium text-xs text-gray-500 hidden lg:table-cell">Rating</th><th className="text-right p-3 font-medium text-xs text-gray-500">Actions</th></tr></thead><tbody>
                                {filteredProducts.map(p => (
                                    <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-3"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden shrink-0"><img src={p.images?.[0] || '/images/products/kicjen sunk 1.webp'} alt={p.name} className="w-full h-full object-cover" /></div><div className="min-w-0"><p className="font-medium text-xs md:text-sm">{p.name}</p><p className="text-[10px] text-gray-400">SKU: {p.sku}</p></div></div></td>
                                        <td className="p-3 text-xs text-gray-400 hidden md:table-cell">{p.categoryName}</td>
                                        <td className="p-3 text-right"><span className="font-medium text-xs">₹{p.price.toLocaleString()}</span>{p.mrp > p.price && <span className="text-[10px] text-gray-400 line-through block">₹{p.mrp.toLocaleString()}</span>}</td>
                                        <td className="p-3 text-center hidden lg:table-cell"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.stockStatus === 'IN_STOCK' ? 'bg-green-100 text-green-700' : p.stockStatus === 'MADE_TO_ORDER' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{p.stock > 0 ? p.stock : p.stockStatus.replace(/_/g, ' ')}</span></td>
                                        <td className="p-3 text-center hidden lg:table-cell"><div className="flex items-center justify-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /><span className="text-xs">{p.rating}</span></div></td>
                                        <td className="p-3 text-right"><div className="flex items-center justify-end gap-1"><Link href={`/product/${p.slug}`} className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200" aria-label="View"><Eye className="h-3.5 w-3.5" /></Link><button onClick={() => startEditProduct(p)} className="h-7 w-7 rounded-lg bg-blue-50 text-[#1877F2] flex items-center justify-center hover:bg-blue-100" aria-label="Edit"><Edit className="h-3.5 w-3.5" /></button><button onClick={() => setDeleteConfirm(p.id)} className="h-7 w-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                                    </tr>
                                ))}
                            </tbody></table></div></div>
                        </div>
                    )}

                    {activeTab === "orders" && <OrdersTab />}
                    {activeTab === "crm" && <CRMTab />}
                    {activeTab === "payments" && <PaymentsTab />}
                    {activeTab === "reports" && <ReportsTab />}
                    {activeTab === "integrations" && <IntegrationsTab />}
                    {activeTab === "customers" && <CustomersTab api={API} headers={HEADERS} showToast={showToast} />}

                    {/* HERO SLIDES */}
                    {activeTab === "heroslides" && (
                        <div className="space-y-4">
                            {/* Delete confirmation modal */}
                            {deleteSlideConfirm && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
                                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="h-6 w-6 text-red-500" /></div>
                                        <h3 className="text-xl font-bold text-center mb-2">Delete Slide?</h3>
                                        <p className="text-sm text-center text-gray-500 mb-6">This action cannot be undone.</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setDeleteSlideConfirm(null)} className="flex-1 py-3 rounded-xl border text-sm font-bold hover:bg-gray-50">Cancel</button>
                                            <button onClick={() => handleDeleteSlide(deleteSlideConfirm!)} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600">Yes, Delete</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <p className="text-sm text-gray-400">{heroSlides.length} slides</p>
                                    <p className="text-xs text-gray-300 mt-0.5">Changes are reflected live on the homepage hero section</p>
                                </div>
                                <button
                                    onClick={() => { setEditingSlide(null); setSlideForm(EMPTY_SLIDE_FORM); setSlideFormError(''); setShowSlideForm(true); }}
                                    className="inline-flex items-center gap-2 bg-[#1877F2] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#0d47a1] shadow-md"
                                >
                                    <Plus className="h-4 w-4" /> Add Slide
                                </button>
                            </div>

                            {/* Add / Edit Form */}
                            {showSlideForm && (
                                <div className="bg-white rounded-2xl border shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="font-semibold text-lg">{editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}</h3>
                                        <button onClick={() => { setShowSlideForm(false); setEditingSlide(null); setSlideFormError(''); }} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="h-4 w-4" /></button>
                                    </div>
                                    {slideFormError && (
                                        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">
                                            <AlertCircle className="h-4 w-4 shrink-0" />{slideFormError}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Title *</label><input value={slideForm.title} onChange={e => setSlideForm(f => ({ ...f, title: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="e.g. Premium Kitchen Sinks" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Subtitle</label><input value={slideForm.subtitle} onChange={e => setSlideForm(f => ({ ...f, subtitle: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="e.g. 304-Grade Stainless Steel" /></div>
                                        <div className="md:col-span-2"><label className="text-xs font-medium text-gray-500 block mb-1">Description</label><textarea value={slideForm.description} onChange={e => setSlideForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="Short product pitch for the hero section..." /></div>
                                        <div>
                                            <ImageUploader
                                                label="Main Image"
                                                required
                                                value={slideForm.image}
                                                onChange={(url) => setSlideForm(f => ({ ...f, image: url }))}
                                                placeholder="/uploads/sink.webp"
                                            />
                                        </div>
                                        <div>
                                            <ImageUploader
                                                label="Context / Applied View Image"
                                                value={slideForm.contextImage}
                                                onChange={(url) => setSlideForm(f => ({ ...f, contextImage: url }))}
                                                placeholder="/uploads/sink-applied.jpg"
                                            />
                                        </div>


                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">CTA Button Text *</label><input value={slideForm.cta} onChange={e => setSlideForm(f => ({ ...f, cta: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="Explore Kitchen Sinks" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">CTA Link *</label><input value={slideForm.ctaLink} onChange={e => setSlideForm(f => ({ ...f, ctaLink: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="/category/kitchen" /></div>
                                        <div className="md:col-span-2"><label className="text-xs font-medium text-gray-500 block mb-1">Background Gradient<span className="ml-1 text-gray-400 font-normal">(Tailwind from-/via-/to- classes)</span></label><input value={slideForm.color} onChange={e => setSlideForm(f => ({ ...f, color: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm font-mono focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="from-[#0a192f] via-[#112240] to-[#1877F2]" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Highlight Badge</label><input value={slideForm.highlight} onChange={e => setSlideForm(f => ({ ...f, highlight: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="🏆 Premium Choice — ISO Certified" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Price Range</label><input value={slideForm.priceRange} onChange={e => setSlideForm(f => ({ ...f, priceRange: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="₹4,999 - ₹12,499" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Display Order</label><input type="number" value={slideForm.order} onChange={e => setSlideForm(f => ({ ...f, order: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="0" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Status</label><select value={slideForm.status} onChange={e => setSlideForm(f => ({ ...f, status: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm bg-white" aria-label="Status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                                    </div>
                                    {/* Preview chip */}
                                    {slideForm.color && (
                                        <div className={`mt-4 h-8 rounded-xl bg-gradient-to-r ${slideForm.color} flex items-center justify-center`}>
                                            <span className="text-white text-xs font-medium opacity-80">Gradient Preview</span>
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button onClick={() => { setShowSlideForm(false); setEditingSlide(null); setSlideFormError(''); }} className="px-4 py-2 rounded-full border text-sm font-medium hover:bg-gray-50">Cancel</button>
                                        <button onClick={handleSaveSlide} className="px-6 py-2 rounded-full bg-[#1877F2] text-white text-sm font-medium hover:bg-[#0d47a1] shadow-md flex items-center gap-2"><Save className="h-4 w-4" /> {editingSlide ? 'Update Slide' : 'Create Slide'}</button>
                                    </div>
                                </div>
                            )}

                            {/* Slides list */}
                            {heroSlides.length === 0 && !showSlideForm ? (
                                <div className="bg-white rounded-2xl border shadow-sm p-10 text-center">
                                    <div className="h-14 w-14 rounded-2xl bg-[#1877F2]/10 flex items-center justify-center mx-auto mb-4">
                                        <SlidersHorizontal className="h-7 w-7 text-[#1877F2]" />
                                    </div>
                                    <p className="font-semibold text-gray-700">No Hero Slides Yet</p>
                                    <p className="text-xs text-gray-400 mt-1 mb-4">Add your first slide. It will appear live on the homepage hero carousel.</p>
                                    <button onClick={() => { setEditingSlide(null); setSlideForm(EMPTY_SLIDE_FORM); setSlideFormError(''); setShowSlideForm(true); }} className="inline-flex items-center gap-2 bg-[#1877F2] text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-[#0d47a1] shadow-md"><Plus className="h-4 w-4" /> Add First Slide</button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-medium text-xs text-gray-500">Slide</th>
                                                    <th className="text-left p-3 font-medium text-xs text-gray-500 hidden md:table-cell">Gradient</th>
                                                    <th className="text-left p-3 font-medium text-xs text-gray-500 hidden lg:table-cell">CTA</th>
                                                    <th className="text-center p-3 font-medium text-xs text-gray-500">Order</th>
                                                    <th className="text-center p-3 font-medium text-xs text-gray-500">Status</th>
                                                    <th className="text-right p-3 font-medium text-xs text-gray-500">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {heroSlides.map(slide => (
                                                    <tr key={slide.id} className="border-b hover:bg-gray-50 transition-colors">
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-12 w-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                                                                    {slide.image && <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-xs md:text-sm truncate max-w-[160px]">{slide.title}</p>
                                                                    <p className="text-[10px] text-gray-400 truncate max-w-[160px]">{slide.subtitle}</p>
                                                                    <p className="text-[10px] text-gray-300 truncate max-w-[160px] hidden md:block">{slide.priceRange}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 hidden md:table-cell">
                                                            <div className={`h-6 w-24 rounded-lg bg-gradient-to-r ${slide.color}`} title={slide.color} />
                                                        </td>
                                                        <td className="p-3 hidden lg:table-cell">
                                                            <p className="text-xs text-gray-600 font-medium">{slide.cta}</p>
                                                            <p className="text-[10px] text-gray-400">{slide.ctaLink}</p>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">#{slide.order}</span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button
                                                                onClick={() => handleToggleSlide(slide.id)}
                                                                title={slide.status === 'active' ? 'Click to deactivate' : 'Click to activate'}
                                                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                                                                    slide.status === 'active'
                                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                                }`}
                                                            >
                                                                {slide.status === 'active'
                                                                    ? <><ToggleRight className="h-3.5 w-3.5" /> Active</>  
                                                                    : <><ToggleLeft className="h-3.5 w-3.5" /> Inactive</>}
                                                            </button>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => { setEditingSlide(slide); setSlideForm({ title: slide.title, subtitle: slide.subtitle, description: slide.description, image: slide.image, contextImage: slide.contextImage, cta: slide.cta, ctaLink: slide.ctaLink, color: slide.color, highlight: slide.highlight, priceRange: slide.priceRange, status: slide.status, order: String(slide.order) }); setSlideFormError(''); setShowSlideForm(true); }}
                                                                    className="h-7 w-7 rounded-lg bg-blue-50 text-[#1877F2] flex items-center justify-center hover:bg-blue-100" aria-label="Edit slide"
                                                                ><Edit className="h-3.5 w-3.5" /></button>
                                                                <button
                                                                    onClick={() => setDeleteSlideConfirm(slide.id)}
                                                                    className="h-7 w-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100" aria-label="Delete slide"
                                                                ><Trash2 className="h-3.5 w-3.5" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="px-4 py-3 bg-blue-50 border-t flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-[#1877F2] shrink-0" />
                                        <p className="text-xs text-[#1877F2]">Active slides appear on the homepage in order. Toggle status to show/hide individual slides instantly.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* BANNERS */}
                    {activeTab === "banners" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between"><p className="text-sm text-gray-400">{banners.length} banners</p><button onClick={() => setShowBannerForm(true)} className="inline-flex items-center gap-2 bg-[#1877F2] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#0d47a1] shadow-md"><Plus className="h-4 w-4" /> Add Banner</button></div>
                            {showBannerForm && (
                                <div className="bg-white rounded-2xl border shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">New Banner</h3><button onClick={() => setShowBannerForm(false)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"><X className="h-4 w-4" /></button></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Title *</label><input value={bannerForm.title} onChange={e => setBannerForm(f => ({ ...f, title: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="Summer Sale Banner" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Image URL *</label><input value={bannerForm.image} onChange={e => setBannerForm(f => ({ ...f, image: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="/images/banners/sale.webp" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Link URL</label><input value={bannerForm.link} onChange={e => setBannerForm(f => ({ ...f, link: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="/category/kitchen" /></div>
                                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Position</label><select value={bannerForm.position} onChange={e => setBannerForm(f => ({ ...f, position: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm bg-white" aria-label="Position"><option value="hero">Hero</option><option value="sidebar">Sidebar</option><option value="footer">Footer</option><option value="popup">Popup</option></select></div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-3">📸 Place banner images in <code className="bg-gray-100 px-1 rounded">public/images/banners/</code>. Recommended: 1920×600px (WebP/JPG, max 5MB)</p>
                                    <div className="flex justify-end gap-3 mt-4"><button onClick={() => setShowBannerForm(false)} className="px-4 py-2 rounded-full border text-sm font-medium hover:bg-gray-50">Cancel</button><button onClick={async () => { try { const res = await fetch(`${API}/api/admin/banners`, { method: 'POST', headers: HEADERS, body: JSON.stringify(bannerForm) }); const d = await res.json(); if (d.success) { setBanners(prev => [...prev, d.data]); showToast('Banner added!'); } else { showToast(d.message); } } catch { showToast('Error adding banner'); } setShowBannerForm(false); setBannerForm({ title: '', image: '', link: '/', position: 'hero' }); }} className="px-6 py-2 rounded-full bg-[#1877F2] text-white text-sm font-medium hover:bg-[#0d47a1] shadow-md flex items-center gap-2"><Save className="h-4 w-4" /> Save</button></div>
                                </div>
                            )}
                            {banners.length === 0 && !showBannerForm ? <div className="bg-white rounded-2xl border shadow-sm p-8 text-center text-gray-400"><Upload className="h-10 w-10 mx-auto mb-3 text-gray-300" /><p className="text-sm font-medium">No banners yet</p><p className="text-xs mt-1">Add your first banner to display on the storefront.</p></div> : (
                                <div className="space-y-3">{banners.map(b => (
                                    <div key={b.id} className="bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4">
                                        <div className="h-16 w-28 bg-gray-100 rounded-xl overflow-hidden shrink-0">{b.image && <img src={b.image} alt={b.title} className="w-full h-full object-cover" />}</div>
                                        <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{b.title}</p><p className="text-[10px] text-gray-400">{b.position} • {b.link}</p></div>
                                        <button onClick={async () => { try { const res = await fetch(`${API}/api/admin/banners/${b.id}/toggle`, { method: 'PATCH', headers: HEADERS }); const d = await res.json(); if (d.success) setBanners(prev => prev.map(x => x.id === b.id ? d.data : x)); } catch { } }} className={`text-xs px-3 py-1 rounded-full font-medium ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{b.active ? 'Active' : 'Inactive'}</button>
                                        <button onClick={async () => { try { await fetch(`${API}/api/admin/banners/${b.id}`, { method: 'DELETE', headers: HEADERS }); setBanners(prev => prev.filter(x => x.id !== b.id)); showToast('Banner deleted'); } catch { } }} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                ))}</div>
                            )}
                        </div>
                    )}

                    {/* TASKS */}
                    {activeTab === "tasks" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between"><p className="text-sm text-gray-400">{tasks.length} tasks</p><button onClick={() => setShowTaskForm(true)} className="inline-flex items-center gap-2 bg-[#1877F2] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#0d47a1] shadow-md"><Plus className="h-4 w-4" /> Add Task</button></div>
                            {showTaskForm && (
                                <div className="bg-white rounded-2xl border p-5"><h4 className="font-semibold mb-3">New Task</h4><div className="grid grid-cols-1 md:grid-cols-4 gap-3"><div className="md:col-span-2"><input value={taskForm.title} onChange={e => setTaskForm(t => ({ ...t, title: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm" placeholder="Task title" /></div><select value={taskForm.priority} onChange={e => setTaskForm(t => ({ ...t, priority: e.target.value as Task['priority'] }))} className="h-10 rounded-xl border px-3 text-sm bg-white" aria-label="Priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select><input type="date" value={taskForm.due} onChange={e => setTaskForm(t => ({ ...t, due: e.target.value }))} className="h-10 rounded-xl border px-3 text-sm" /><select value={taskForm.assignee} onChange={e => setTaskForm(t => ({ ...t, assignee: e.target.value }))} className="h-10 rounded-xl border px-3 text-sm bg-white" aria-label="Assign To"><option value="">Unassigned</option>{staff.filter(s => ['admin', 'sub_admin', 'staff', 'tele_caller', 'product_uploader'].includes(s.role)).map(s => (<option key={s.id} value={s.name}>{s.name}</option>))}</select><button onClick={handleAddTask} className="bg-[#1877F2] text-white rounded-full h-10 text-sm font-medium col-span-1">Add</button><button onClick={() => setShowTaskForm(false)} className="border rounded-full h-10 text-sm hover:bg-gray-50 col-span-3">Cancel</button></div></div>
                            )}
                            {tasks.length === 0 ? <div className="bg-white rounded-2xl border p-8 text-center text-sm text-gray-400">No tasks yet. Add your first task to get started.</div> : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(['todo', 'progress', 'done'] as const).map(s => (
                                        <div key={s} className="bg-white rounded-2xl border shadow-sm p-4">
                                            <h4 className="font-medium text-sm mb-3 flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${s === 'todo' ? 'bg-blue-500' : s === 'progress' ? 'bg-yellow-500' : 'bg-green-500'}`} />{s === 'todo' ? 'To Do' : s === 'progress' ? 'In Progress' : 'Done'} <span className="text-xs text-gray-400">({tasks.filter(t => t.status === s).length})</span></h4>
                                            <div className="space-y-2">{tasks.filter(t => t.status === s).map(task => (
                                                <div key={task.id} className="bg-gray-50 rounded-xl p-3 border"><div className="flex items-start gap-2"><div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'}`} /><div className="flex-1"><p className="text-xs font-medium">{task.title}</p><p className="text-[10px] text-gray-400 mt-1">{task.assignee} • Due: {task.due}</p></div></div><div className="flex gap-1 mt-2">{s !== 'todo' && <button onClick={() => updateTaskStatus(task.id, 'todo')} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">To Do</button>}{s !== 'progress' && <button onClick={() => updateTaskStatus(task.id, 'progress')} className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">Progress</button>}{s !== 'done' && <button onClick={() => updateTaskStatus(task.id, 'done')} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Done</button>}</div></div>
                                            ))}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* CAMPAIGNS */}
                    {activeTab === "campaigns" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between"><p className="text-sm text-gray-400">{campaigns.length} campaigns</p><button onClick={() => setShowCampaignForm(true)} className="inline-flex items-center gap-2 bg-[#1877F2] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#0d47a1] shadow-md"><Plus className="h-4 w-4" /> New Campaign</button></div>
                            {showCampaignForm && (
                                <div className="bg-white rounded-2xl border p-5"><h4 className="font-semibold mb-3">New Campaign</h4><div className="grid grid-cols-1 md:grid-cols-4 gap-3"><div className="md:col-span-2"><input value={campaignForm.name} onChange={e => setCampaignForm(t => ({ ...t, name: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm" placeholder="Campaign Name" /></div><select value={campaignForm.platform} onChange={e => setCampaignForm(t => ({ ...t, platform: e.target.value }))} className="h-10 rounded-xl border px-3 text-sm bg-white" aria-label="Platform"><option value="google">Google Ads</option><option value="meta">Meta Ads</option><option value="email">Email</option></select><input type="number" value={campaignForm.budget} onChange={e => setCampaignForm(t => ({ ...t, budget: e.target.value }))} className="h-10 rounded-xl border px-3 text-sm" placeholder="Budget (₹)" /><button onClick={async () => { try { const req = await fetch(`${API}/api/admin/campaigns`, { method: 'POST', headers: HEADERS, body: JSON.stringify(campaignForm) }); const res = await req.json(); if (res.success) { setCampaigns(p => [...p, res.data]); setShowCampaignForm(false); setCampaignForm({ name: '', platform: 'google', budget: '' }); showToast('Campaign added'); } } catch { } }} className="bg-[#1877F2] text-white rounded-full h-10 text-sm font-medium">Add</button><button onClick={() => setShowCampaignForm(false)} className="border rounded-full h-10 text-sm hover:bg-gray-50">Cancel</button></div></div>
                            )}
                            {campaigns.length === 0 && !showCampaignForm ? <div className="bg-white rounded-2xl border p-8 text-center text-gray-400"><Megaphone className="h-10 w-10 mx-auto mb-2 text-gray-300" /><p className="text-sm font-medium">No campaigns yet</p><p className="text-xs mt-1">Create marketing campaigns to track ad spend and conversions.</p></div> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {campaigns.map(c => (
                                        <div key={c.id} className="bg-white rounded-xl border p-4 flex flex-col justify-between">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-[#1877F2]" /><h4 className="font-bold text-sm truncate">{c.name}</h4></div>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mb-3 capitalize">Platform: {c.platform}</div>
                                            <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-50 rounded-lg p-2 text-center">
                                                <div><div className="text-[10px] text-gray-400 uppercase tracking-widest">Budget</div><div className="font-bold text-sm">₹{c.budget.toLocaleString()}</div></div>
                                                <div><div className="text-[10px] text-gray-400 uppercase tracking-widest">Spent</div><div className="font-bold text-sm text-red-500">₹{c.spent.toLocaleString()}</div></div>
                                                <div><div className="text-[10px] text-gray-400 uppercase tracking-widest">Conv.</div><div className="font-bold text-sm text-green-500">{c.conversions}</div></div>
                                            </div>
                                            <div className="flex gap-2">
                                                {c.status !== 'active' && <button onClick={async () => { const req = await fetch(`${API}/api/admin/campaigns/${c.id}`, { method: 'PUT', headers: HEADERS, body: JSON.stringify({ status: 'active' }) }); const res = await req.json(); if (res.success) setCampaigns(prev => prev.map(x => x.id === c.id ? res.data : x)); }} className="flex-1 text-[10px] font-bold bg-green-50 text-green-700 py-1.5 rounded-md">Activate</button>}
                                                {c.status === 'active' && <button onClick={async () => { const req = await fetch(`${API}/api/admin/campaigns/${c.id}`, { method: 'PUT', headers: HEADERS, body: JSON.stringify({ status: 'paused' }) }); const res = await req.json(); if (res.success) setCampaigns(prev => prev.map(x => x.id === c.id ? res.data : x)); }} className="flex-1 text-[10px] font-bold bg-yellow-50 text-yellow-700 py-1.5 rounded-md">Pause</button>}
                                                <button onClick={async () => { const req = await fetch(`${API}/api/admin/campaigns/${c.id}`, { method: 'DELETE', headers: HEADERS }); const res = await req.json(); if (res.success) setCampaigns(prev => prev.filter(x => x.id !== c.id)); }} className="h-7 w-7 bg-red-50 text-red-500 rounded-md flex items-center justify-center shrink-0"><Trash2 className="h-3 w-3" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SEO */}
                    {activeTab === "seo" && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border shadow-sm p-5">
                                <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe className="h-5 w-5 text-[#1877F2]" /> Product SEO Audit</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="bg-green-50 rounded-xl p-4 border border-green-100"><div className="flex items-center gap-2 mb-1"><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-sm font-medium text-green-800">Optimized</span></div><p className="text-2xl font-bold text-green-900">{products.filter(p => p.metaTitle).length}</p></div>
                                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100"><div className="flex items-center gap-2 mb-1"><AlertCircle className="h-4 w-4 text-yellow-600" /><span className="text-sm font-medium text-yellow-800">Needs Work</span></div><p className="text-2xl font-bold text-yellow-900">{products.filter(p => !p.metaDescription).length}</p></div>
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100"><div className="flex items-center gap-2 mb-1"><BarChart3 className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium text-blue-800">Tagged</span></div><p className="text-2xl font-bold text-blue-900">{products.filter(p => p.tags?.length > 0).length}</p></div>
                                </div>
                                <div className="space-y-2">{products.slice(0, 10).map(p => (<div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${p.metaTitle && p.metaDescription ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>{p.metaTitle && p.metaDescription ? '✓' : '!'}</div><div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{p.name}</p><p className="text-[10px] text-gray-400 truncate">{p.metaTitle || 'No SEO title set'}</p></div><button onClick={() => { startEditProduct(p); setActiveTab('products'); }} className="text-xs text-[#1877F2] font-medium hover:underline shrink-0">Edit SEO</button></div>))}</div>
                            </div>
                            <div className="bg-white rounded-2xl border shadow-sm p-5">
                                <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe className="h-5 w-5 text-green-500" /> Page-Level SEO</h3>
                                <div className="space-y-3">{pageSeo.map(seo => (
                                    <div key={seo.id} className="border rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2"><div><h4 className="font-medium text-sm">{seo.page}</h4><p className="text-[10px] text-gray-400">{seo.path}</p></div><button onClick={() => setEditingSeo(editingSeo === seo.id ? null : seo.id)} className="text-xs text-[#1877F2] font-medium hover:underline">{editingSeo === seo.id ? 'Close' : 'Edit'}</button></div>
                                        {editingSeo === seo.id ? (<div className="space-y-3 mt-3 pt-3 border-t"><div><label className="text-[10px] text-gray-500 block mb-1">Meta Title ({seo.metaTitle.length}/60)</label><input value={seo.metaTitle} onChange={e => setPageSeo(prev => prev.map(s => s.id === seo.id ? { ...s, metaTitle: e.target.value } : s))} className="w-full h-9 rounded-lg border px-3 text-xs focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" /></div><div><label className="text-[10px] text-gray-500 block mb-1">Meta Description ({seo.metaDescription.length}/160)</label><textarea value={seo.metaDescription} onChange={e => setPageSeo(prev => prev.map(s => s.id === seo.id ? { ...s, metaDescription: e.target.value } : s))} rows={2} className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" /></div><div><label className="text-[10px] text-gray-500 block mb-1">Keywords</label><input value={seo.keywords} onChange={e => setPageSeo(prev => prev.map(s => s.id === seo.id ? { ...s, keywords: e.target.value } : s))} className="w-full h-9 rounded-lg border px-3 text-xs focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" /></div><button onClick={() => handleSaveSeo(seo)} className="bg-[#1877F2] text-white rounded-lg h-8 px-4 text-xs font-medium hover:bg-[#0d47a1] flex items-center gap-1.5"><Save className="h-3.5 w-3.5" />Save SEO</button></div>) : (<div className="mt-1"><p className="text-xs text-gray-600 truncate">{seo.metaTitle}</p><p className="text-[10px] text-gray-400 truncate mt-0.5">{seo.metaDescription}</p></div>)}
                                    </div>
                                ))}</div>
                            </div>
                        </div>
                    )}
                    {/* STAFF & ROLES */}
                    {activeTab === "staff" && <StaffTab api={API} headers={HEADERS} showToast={showToast} />}

                    {/* SETTINGS */}
                    {activeTab === "settings" && (
                        <div className="space-y-6"><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl border shadow-sm p-6"><h3 className="font-semibold mb-4 flex items-center gap-2"><Settings className="h-5 w-5 text-[#1877F2]" /> General Store Settings</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-medium text-gray-500 block mb-1">Store Name</label><input value={settingsForm.storeName} onChange={e => setSettingsForm(s => ({ ...s, storeName: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" /></div><div><label className="text-xs font-medium text-gray-500 block mb-1">Tagline</label><input value={settingsForm.tagline} onChange={e => setSettingsForm(s => ({ ...s, tagline: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" /></div><div><label className="text-xs font-medium text-gray-500 block mb-1">Support Email</label><input value={settingsForm.supportEmail} onChange={e => setSettingsForm(s => ({ ...s, supportEmail: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" /></div><div><label className="text-xs font-medium text-gray-500 block mb-1">Contact Phone</label><input value={settingsForm.contactPhone} onChange={e => setSettingsForm(s => ({ ...s, contactPhone: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" /></div></div></div>
                            <div className="bg-white rounded-2xl border shadow-sm p-6"><h3 className="font-semibold mb-4">Logistics & Compliance</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-medium text-gray-500 block mb-1">Free Shipping Above (₹)</label><input type="number" value={settingsForm.freeShippingAbove} onChange={e => setSettingsForm(s => ({ ...s, freeShippingAbove: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" /></div><div><label className="text-xs font-medium text-gray-500 block mb-1">Standard Delivery Time</label><input value={settingsForm.deliveryTime} onChange={e => setSettingsForm(s => ({ ...s, deliveryTime: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" /></div><div><label className="text-xs font-medium text-gray-500 block mb-1">GST Number</label><input value={settingsForm.gstNumber} onChange={e => setSettingsForm(s => ({ ...s, gstNumber: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" /></div><div><label className="text-xs font-medium text-gray-500 block mb-1">PAN Number</label><input value={settingsForm.panNumber} onChange={e => setSettingsForm(s => ({ ...s, panNumber: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" /></div></div></div>
                        </div><div className="space-y-6"><div className="bg-[#1877F2] text-white rounded-2xl p-6 shadow-lg"><h4 className="font-bold flex items-center gap-2 mb-2"><Sparkles className="h-5 w-5" /> Quick Action</h4><p className="text-xs text-white/80 mb-4 leading-relaxed">These settings control how your store appears. Changes are reflected globally.</p><button onClick={async () => { try { const req = await fetch(`${API}/api/admin/settings`, { method: 'PUT', headers: HEADERS, body: JSON.stringify(settingsForm) }); const res = await req.json(); if (res.success) { setSettingsForm(res.data); showToast('Settings saved successfully'); } } catch { } }} className="w-full bg-white text-[#1877F2] rounded-xl py-2.5 text-sm font-bold shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2"><Save className="h-4 w-4" /> Save All Changes</button></div></div></div></div>
                    )}
                </main>
            </div>
        </div>
    );
}

