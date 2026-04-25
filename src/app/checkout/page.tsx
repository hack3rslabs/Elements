"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import {
    Truck, ShieldCheck, CreditCard, Banknote,
    ArrowLeft, CheckCircle2, MapPin, Building,
    Users, AlertCircle, FileText, ChevronRight
} from "lucide-react";

export default function CheckoutPage() {
    const { cart, refreshCart } = useStore();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [pinLoading, setPinLoading] = useState(false);
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/checkout");
        }
    }, [status, router]);

    const [form, setForm] = useState({
        customerName: "",
        email: "",
        phone: "",
        address: "",
        pincode: "",
        area: "",
        city: "",
        state: "",
        billingAddress: "",
        gstin: "",
        paymentMethod: "ONLINE", // ONLINE, COD
        transportChoice: "WITH_TRANSPORT", // WITH_TRANSPORT, WITHOUT_TRANSPORT
    });

    useEffect(() => {
        if (session?.user) {
            setForm(f => ({
                ...f,
                customerName: session.user?.name || f.customerName,
                email: session.user?.email || f.email,
            }));
        }
    }, [session]);

    const [sameAsShipping, setSameAsShipping] = useState(true);

    useEffect(() => {
        if (cart.items.length === 0 && !loading && status === "authenticated") {
            router.push("/cart");
        }
    }, [cart.items.length, router, loading, status]);

    const handlePinChange = async (pin: string) => {
        setForm(prev => ({ ...prev, pincode: pin }));
        if (pin.length === 6) {
            setPinLoading(true);
            try {
                const res = await fetch(`/api/pincode/${pin}`);
                const data = await res.json();
                if (data.success) {
                    setForm(prev => ({
                        ...prev,
                        area: data.data.area,
                        city: data.data.city,
                        state: data.data.state
                    }));
                }
            } catch (e) {
                console.error("PIN Lookup failed");
            }
            setPinLoading(false);
        }
    };

    const handleSubmitOrder = async () => {
        setLoading(true);
        const orderData = {
            sessionId: localStorage.getItem('elements_session_id'),
            items: cart.items,
            subtotal: cart.subtotal,
            shipping: cart.subtotal >= 5000 ? 0 : 99,
            total: cart.subtotal + (cart.subtotal >= 5000 ? 0 : 99),
            ...form,
            billingAddress: sameAsShipping ? form.address : form.billingAddress
        };

        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            });
            const data = await res.json();
            if (data.success) {
                await refreshCart();
                router.push(`/order-success?id=${data.orderId}`);
            } else {
                alert(data.message || "Order failed");
            }
        } catch (e) {
            alert("Network error. Please try again.");
        }
        setLoading(false);
    };

    if (status === "loading") return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#1877F2]" /></div>;
    if (status === "unauthenticated") return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Redirecting to login...</div>;
    if (cart.items.length === 0) return null;

    return (
        <div className="flex min-h-screen flex-col bg-gray-50/50">
            <Header />
            <main className="flex-1">
                <div className="container py-10">
                    <div className="max-w-6xl mx-auto">
                        {/* Progress Stepper */}
                        <div className="flex items-center justify-center mb-10">
                            {[
                                { n: 1, l: "Shipping" },
                                { n: 2, l: "Transport & Payment" },
                                { n: 3, l: "Review" }
                            ].map((s, i) => (
                                <div key={s.n} className="flex items-center">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= s.n ? 'bg-[#1877F2] text-white' : 'bg-gray-200 text-gray-500'} font-semibold text-sm`}>
                                        {step > s.n ? <CheckCircle2 className="h-5 w-5" /> : s.n}
                                    </div>
                                    <span className={`ml-2 text-sm font-medium ${step >= s.n ? 'text-gray-900' : 'text-gray-400'}`}>{s.l}</span>
                                    {i < 2 && <div className={`w-12 h-0.5 mx-4 ${step > s.n ? 'bg-[#1877F2]' : 'bg-gray-200'}`} />}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Step 1: Address */}
                                {step === 1 && (
                                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                            <MapPin className="h-5 w-5 text-[#1877F2]" /> Shipping Address
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] transition-all"
                                                    placeholder="Enter your full name"
                                                    value={form.customerName}
                                                    onChange={e => setForm({ ...form, customerName: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address</label>
                                                <input
                                                    type="email"
                                                    className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] transition-all"
                                                    placeholder="john@example.com"
                                                    value={form.email}
                                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] transition-all"
                                                    placeholder="10-digit mobile number"
                                                    value={form.phone}
                                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Street Address</label>
                                                <textarea
                                                    rows={3}
                                                    className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] transition-all resize-none"
                                                    placeholder="House No, Building, Street, Area"
                                                    value={form.address}
                                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center justify-between">
                                                    PIN Code {pinLoading && <span className="text-[10px] text-[#1877F2] animate-pulse">Checking...</span>}
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] transition-all"
                                                    placeholder="6-digit PIN"
                                                    value={form.pincode}
                                                    onChange={e => handlePinChange(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">City</label>
                                                <input
                                                    type="text"
                                                    readOnly={!!form.city}
                                                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none ${form.city ? 'text-gray-500' : ''}`}
                                                    placeholder="City"
                                                    value={form.city}
                                                    onChange={e => setForm({ ...form, city: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 space-y-4">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={sameAsShipping}
                                                        onChange={() => setSameAsShipping(!sameAsShipping)}
                                                    />
                                                    <div className="w-5 h-5 border-2 rounded-md transition-all peer-checked:bg-[#1877F2] peer-checked:border-[#1877F2]"></div>
                                                    <CheckCircle2 className="absolute inset-0 h-5 w-5 text-white scale-0 transition-transform peer-checked:scale-100" />
                                                </div>
                                                <span className="text-sm font-medium">Billing address same as shipping</span>
                                            </label>

                                            {!sameAsShipping && (
                                                <div className="pt-4 animate-in fade-in duration-300">
                                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Billing Address</label>
                                                    <textarea
                                                        rows={3}
                                                        className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] transition-all resize-none"
                                                        placeholder="Full billing address"
                                                        value={form.billingAddress}
                                                        onChange={e => setForm({ ...form, billingAddress: e.target.value })}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-8 pt-8 border-t">
                                            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                                                <Building className="h-4 w-4 text-gray-400" /> Business Details (Optional)
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">GSTIN Number</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] transition-all"
                                                        placeholder="Enter GSTIN to claim tax credit"
                                                        value={form.gstin}
                                                        onChange={e => setForm({ ...form, gstin: e.target.value })}
                                                    />
                                                    <p className="text-[10px] text-muted-foreground mt-1">Claim Input Tax Credit (ITC) for your business purchases.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-10 flex justify-end">
                                            <Button
                                                onClick={() => setStep(2)}
                                                disabled={!form.customerName || !form.address || !form.pincode}
                                                className="bg-[#1877F2] hover:bg-[#0d47a1] rounded-full px-10 h-12 shadow-lg"
                                            >
                                                Next: Transport & Payment <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Logistics & Payment */}
                                {step === 2 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border">
                                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                                <Truck className="h-5 w-5 text-[#1877F2]" /> Transport Choice
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div
                                                    onClick={() => setForm({ ...form, transportChoice: 'WITH_TRANSPORT' })}
                                                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${form.transportChoice === 'WITH_TRANSPORT' ? 'border-[#1877F2] bg-blue-50/50' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className={`p-2 rounded-xl ${form.transportChoice === 'WITH_TRANSPORT' ? 'bg-[#1877F2] text-white' : 'bg-white text-gray-400 border'}`}>
                                                            <Truck className="h-5 w-5" />
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.transportChoice === 'WITH_TRANSPORT' ? 'border-[#1877F2]' : 'border-gray-300'}`}>
                                                            {form.transportChoice === 'WITH_TRANSPORT' && <div className="w-2.5 h-2.5 rounded-full bg-[#1877F2]" />}
                                                        </div>
                                                    </div>
                                                    <h3 className="font-bold text-sm">With Transport</h3>
                                                    <p className="text-xs text-muted-foreground mt-1">We will arrange reliable delivery to your site.</p>
                                                </div>
                                                <div
                                                    onClick={() => setForm({ ...form, transportChoice: 'WITHOUT_TRANSPORT' })}
                                                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${form.transportChoice === 'WITHOUT_TRANSPORT' ? 'border-[#1877F2] bg-blue-50/50' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className={`p-2 rounded-xl ${form.transportChoice === 'WITHOUT_TRANSPORT' ? 'bg-[#1877F2] text-white' : 'bg-white text-gray-400 border'}`}>
                                                            <MapPin className="h-5 w-5" />
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.transportChoice === 'WITHOUT_TRANSPORT' ? 'border-[#1877F2]' : 'border-gray-300'}`}>
                                                            {form.transportChoice === 'WITHOUT_TRANSPORT' && <div className="w-2.5 h-2.5 rounded-full bg-[#1877F2]" />}
                                                        </div>
                                                    </div>
                                                    <h3 className="font-bold text-sm">Self Pickup / Without Transport</h3>
                                                    <p className="text-xs text-muted-foreground mt-1">Arrange your own transport to pick from our warehouse.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border">
                                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                                <CreditCard className="h-5 w-5 text-[#1877F2]" /> Payment Method
                                            </h2>
                                            <div className="space-y-4">
                                                <div
                                                    onClick={() => setForm({ ...form, paymentMethod: 'ONLINE' })}
                                                    className={`flex items-center gap-4 cursor-pointer rounded-2xl p-5 border-2 transition-all ${form.paymentMethod === 'ONLINE' ? 'border-[#1877F2] bg-blue-50/50' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'}`}
                                                >
                                                    <div className={`p-3 rounded-2xl ${form.paymentMethod === 'ONLINE' ? 'bg-[#1877F2] text-white shadow-lg' : 'bg-white text-gray-400 border'}`}>
                                                        <CreditCard className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-sm">Online Payment</h3>
                                                        <p className="text-xs text-muted-foreground">UPI, Credit/Debit Cards, Net Banking</p>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${form.paymentMethod === 'ONLINE' ? 'border-[#1877F2]' : 'border-gray-300'}`}>
                                                        {form.paymentMethod === 'ONLINE' && <div className="w-3 h-3 rounded-full bg-[#1877F2]" />}
                                                    </div>
                                                </div>
                                                <div
                                                    onClick={() => setForm({ ...form, paymentMethod: 'COD' })}
                                                    className={`flex items-center gap-4 cursor-pointer rounded-2xl p-5 border-2 transition-all ${form.paymentMethod === 'COD' ? 'border-[#1877F2] bg-blue-50/50' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'}`}
                                                >
                                                    <div className={`p-3 rounded-2xl ${form.paymentMethod === 'COD' ? 'bg-[#1877F2] text-white shadow-lg' : 'bg-white text-gray-400 border'}`}>
                                                        <Banknote className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-sm">Offline / Cash Payment</h3>
                                                        <p className="text-xs text-muted-foreground">Pay with cash at site during delivery</p>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${form.paymentMethod === 'COD' ? 'border-[#1877F2]' : 'border-gray-300'}`}>
                                                        {form.paymentMethod === 'COD' && <div className="w-3 h-3 rounded-full bg-[#1877F2]" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <Button variant="outline" onClick={() => setStep(1)} className="rounded-full px-8 h-12">
                                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shipping
                                            </Button>
                                            <Button onClick={() => setStep(3)} className="bg-[#1877F2] hover:bg-[#0d47a1] rounded-full px-10 h-12 shadow-lg">
                                                Review Order <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Review */}
                                {step === 3 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border">
                                            <h2 className="text-xl font-bold mb-6">Review & Finalize</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shipping To</h3>
                                                    <p className="text-sm font-semibold">{form.customerName}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{form.address}</p>
                                                    <p className="text-sm text-muted-foreground">{form.area}, {form.city}, {form.state} - {form.pincode}</p>
                                                    <p className="text-sm text-muted-foreground mt-2">{form.phone} | {form.email}</p>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Logistics</h3>
                                                        <p className="text-sm font-semibold flex items-center gap-2">
                                                            {form.transportChoice === 'WITH_TRANSPORT' ? <Truck className="h-4 w-4 text-[#1877F2]" /> : <MapPin className="h-4 w-4 text-[#1877F2]" />}
                                                            {form.transportChoice === 'WITH_TRANSPORT' ? "With Transport" : "Self Pickup"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Method</h3>
                                                        <p className="text-sm font-semibold flex items-center gap-2">
                                                            {form.paymentMethod === 'ONLINE' ? <CreditCard className="h-4 w-4 text-emerald-500" /> : <Banknote className="h-4 w-4 text-emerald-500" />}
                                                            {form.paymentMethod === 'ONLINE' ? "Online Payment" : "Cash on Delivery"}
                                                        </p>
                                                    </div>
                                                    {form.gstin && (
                                                        <div>
                                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">GSTIN</h3>
                                                            <p className="text-sm font-semibold text-[#1877F2]">{form.gstin}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <Button variant="outline" onClick={() => setStep(2)} className="rounded-full px-8 h-12">
                                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Payment
                                            </Button>
                                            <Button
                                                onClick={handleSubmitOrder}
                                                disabled={loading}
                                                className="bg-[#1877F2] hover:bg-[#0d47a1] rounded-full px-12 h-12 shadow-lg font-bold"
                                            >
                                                {loading ? "Placing Order..." : "Confirm & Place Order"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar: Subtotal */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border sticky top-24">
                                    <h3 className="text-lg font-bold border-b pb-4 mb-4">Order Summary</h3>
                                    <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                        {cart.items.map(item => (
                                            <div key={item.productId} className="flex gap-3">
                                                <div className="w-12 h-12 relative rounded-lg overflow-hidden shrink-0 border bg-gray-50">
                                                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium line-clamp-1">{item.product.name}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="text-xs font-bold">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2 border-t pt-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Items ({cart.itemCount})</span>
                                            <span>₹{cart.subtotal.toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Shipping</span>
                                            <span className="text-green-600 font-medium">{cart.subtotal >= 5000 ? 'FREE' : '₹99'}</span>
                                        </div>
                                        <div className="pt-3 flex justify-between text-base font-bold">
                                            <span>Total</span>
                                            <span className="text-[#1877F2]">₹{(cart.subtotal + (cart.subtotal >= 5000 ? 0 : 99)).toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-3">
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium p-3 bg-gray-50 rounded-xl">
                                            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                                            <span>Secure Payments • Builder Guarantee • ISO Certified Quality</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium p-3 bg-gray-50 rounded-xl">
                                            <FileText className="h-4 w-4 text-[#1877F2] shrink-0" />
                                            <span>Digital Invoice with GST will be sent to {form.email || 'your email'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

