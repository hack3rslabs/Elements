"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { MessageCircle, X, Send, Bot, User, Phone, Loader2 } from "lucide-react";
import Link from "next/link";

interface Message {
    role: "user" | "assistant";
    content: string;
    products?: { name: string; slug: string; price: number; image: string }[];
}

const QUICK_REPLIES = [
    "Show me kitchen sinks",
    "What tiles do you have?",
    "Tell me about Mitti Magic",
    "I need flooring for my garage",
    "What's the warranty on sinks?",
    "Bulk order pricing",
];

// Simple AI matching based on keywords
function getAIResponse(query: string, allProducts: { name: string; slug: string; price: number; image: string; categoryName: string; description: string; tags: string[] }[]): Message {
    const q = query.toLowerCase();

    // Greetings
    if (q.match(/^(hi|hello|hey|namaste|good\s?(morning|afternoon|evening))/)) {
        return { role: "assistant", content: "Namaste! 🙏 Welcome to Hindustan Elements. I'm here to help you find the perfect products for your project.\n\nAre you looking for:\n• Kitchen Sinks\n• Flooring Solutions\n• Elevation Panels\n• Tiles\n\nJust ask me anything!" };
    }

    // Contact/call
    if (q.match(/(call|contact|phone|whatsapp|reach|talk|speak|number)/)) {
        return { role: "assistant", content: "📞 You can reach us anytime!\n\n**Phone:** +91 98765 43210\n**WhatsApp:** +91 98765 43210\n**Email:** support@hindustan-elements.com\n\n🕐 **Working Hours:** Mon-Sat, 9AM - 7PM\n\nOur product experts will guide you on:\n✅ Product selection\n✅ Installation guidance\n✅ Bulk order pricing\n✅ Site visit scheduling" };
    }

    // Pricing/bulk
    if (q.match(/(price|pricing|bulk|wholesale|discount|cost|rate|quotation|quote)/)) {
        return { role: "assistant", content: "💰 **Bulk Order Benefits:**\n\n• 10+ units → **5% off**\n• 50+ units → **10% off**\n• 100+ units → **15% off** + Free Site Visit\n• Custom quantities → Call for special rates\n\n📞 For bulk pricing, call **+91 98765 43210** or WhatsApp us. We provide custom quotes within 2 hours!\n\n💡 **Builders & Contractors** get exclusive partner pricing." };
    }

    // Warranty
    if (q.match(/(warranty|guarantee|durability|last|lifespan)/)) {
        return { role: "assistant", content: "🛡️ **Our Warranty Coverage:**\n\n• Kitchen Sinks: **10-20 Years**\n• Mitti Magic Panels: **25 Years**\n• Floor Guard Sheets: **3-5 Years**\n• Tiles: **10-15 Years**\n• Stone Cladding: **30 Years**\n\nAll warranties cover manufacturing defects. We also offer **free replacement** for products damaged during delivery." };
    }

    // Installation
    if (q.match(/(install|installation|fitting|fix|setup|how to|guide|plumber)/)) {
        return { role: "assistant", content: "🔧 **Installation Support:**\n\n1. **Free Installation Guide** — Included with every product\n2. **Video Tutorials** — QR code on packaging\n3. **Phone Support** — Call during installation\n4. **Professional Referral** — We can connect you with trusted installers in your area\n\n📞 Need help? Call **+91 98765 43210**\n\n💡 Pro tip: Most of our products are designed for **easy DIY installation** with standard tools." };
    }

    // Delivery
    if (q.match(/(delivery|shipping|ship|deliver|courier|transport|time)/)) {
        return { role: "assistant", content: "🚚 **Delivery Information:**\n\n• **Free Delivery** on orders above ₹5,000\n• **Standard:** 3-5 business days\n• **Express:** 1-2 business days (metro cities)\n• **Made-to-Order:** 7-10 business days\n\n📦 All products are **double-boxed** with foam protection\n🔄 Easy returns within **7 days** of delivery\n\nWe deliver across **50+ cities** in India!" };
    }

    // Product search
    const matchedProducts = allProducts.filter(p => {
        const searchText = `${p.name} ${p.categoryName} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
        return q.split(/\s+/).some(word => word.length > 2 && searchText.includes(word));
    });

    if (matchedProducts.length > 0) {
        const topProducts = matchedProducts.slice(0, 4);
        return {
            role: "assistant",
            content: `I found **${matchedProducts.length} product${matchedProducts.length > 1 ? 's' : ''}** matching your query! Here are the top picks:\n\n📞 Need help choosing? Call **+91 98765 43210** — our experts will guide you based on your project requirements.`,
            products: topProducts.map(p => ({ name: p.name, slug: p.slug, price: p.price, image: p.image })),
        };
    }

    // Default
    return { role: "assistant", content: "I'd be happy to help! Unfortunately, I couldn't find an exact match. Here's what I can help with:\n\n• 🍳 **Kitchen Sinks** — Stainless steel, granite, ceramic\n• 🏠 **Flooring** — PVC guard sheets, rubber mats\n• 🏗️ **Elevation** — Mitti Magic terracotta panels\n• 🎨 **Tiles** — Printed, vitrified, mosaic\n\nYou can also:\n📞 **Call us:** +91 98765 43210\n💬 **WhatsApp:** +91 98765 43210\n\nOur experts are available Mon-Sat, 9 AM - 7 PM!" };
}

export function AIAssistant() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Namaste! 🙏 I'm your Elements Product Assistant.\n\nI can help you with:\n• Finding the right products\n• Pricing & bulk orders\n• Installation guidance\n• Warranty information\n\nHow can I help you today?"
        }
    ]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const [products, setProducts] = useState<{ name: string; slug: string; price: number; image: string; categoryName: string; description: string; tags: string[] }[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Load products for AI matching
    useEffect(() => {
        fetch('/api/products?limit=50')
            .then(r => r.json())
            .then(d => { if (d.success) setProducts(d.data); })
            .catch(() => { });
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = useCallback((text?: string) => {
        const query = text || input.trim();
        if (!query) return;

        const userMsg: Message = { role: "user", content: query };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setTyping(true);

        // Simulate AI thinking delay
        setTimeout(() => {
            const response = getAIResponse(query, products);
            setMessages(prev => [...prev, response]);
            setTyping(false);
        }, 800 + Math.random() * 700);
    }, [input, products]);

    return (
        <>
            {/* Chat Window */}
            {open && (
                <div className="fixed bottom-20 right-4 md:right-6 z-[150] w-[calc(100vw-2rem)] max-w-[380px] bg-white rounded-3xl shadow-2xl border overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#1877F2] to-[#0d47a1] p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Elements Assistant</p>
                                <p className="text-xs text-white/70 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block"></span>
                                    Online — Ask me anything
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href="tel:+919876543210" aria-label="Call us" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                <Phone className="h-4 w-4" />
                            </a>
                            <button onClick={() => setOpen(false)} aria-label="Close chat" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="h-[350px] overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'user'
                                    ? 'bg-[#1877F2] text-white'
                                    : 'bg-gradient-to-br from-[#0d47a1] to-[#1877F2] text-white'
                                    }`}>
                                    {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                                </div>
                                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                                    <div className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user'
                                        ? 'bg-[#1877F2] text-white rounded-br-md'
                                        : 'bg-white text-foreground shadow-sm border rounded-bl-md'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    {/* Product cards */}
                                    {msg.products && msg.products.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            {msg.products.map(p => (
                                                <Link
                                                    key={p.slug}
                                                    href={`/product/${p.slug}`}
                                                    onClick={() => setOpen(false)}
                                                    className="flex items-center gap-3 bg-white rounded-xl p-2.5 border shadow-sm hover:shadow-md transition-all"
                                                >
                                                    <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                                                        <Image src={p.image} alt={p.name} fill className="object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className="text-xs font-medium truncate">{p.name}</p>
                                                        <p className="text-xs font-bold text-[#1877F2]">₹{p.price.toLocaleString("en-IN")}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {typing && (
                            <div className="flex gap-2">
                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#0d47a1] to-[#1877F2] flex items-center justify-center">
                                    <Bot className="h-3.5 w-3.5 text-white" />
                                </div>
                                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border">
                                    <Loader2 className="h-4 w-4 animate-spin text-[#1877F2]" />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick Replies */}
                    {messages.length <= 2 && (
                        <div className="px-4 py-2 border-t bg-white flex gap-2 overflow-x-auto scrollbar-hide">
                            {QUICK_REPLIES.slice(0, 3).map(text => (
                                <button
                                    key={text}
                                    onClick={() => handleSend(text)}
                                    className="shrink-0 text-xs bg-blue-50 text-[#1877F2] rounded-full px-3 py-1.5 hover:bg-blue-100 transition-colors border border-blue-100"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 border-t bg-white flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Ask about products, prices..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSend()}
                            className="flex-1 h-10 rounded-full border border-input bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            aria-label="Send message"
                            className="h-10 w-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:bg-[#0d47a1] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* FAB Button */}
            <button
                onClick={() => setOpen(!open)}
                aria-label={open ? "Close assistant" : "Open AI assistant"}
                className={`fixed bottom-4 right-4 md:right-6 z-[150] h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${open
                    ? 'bg-gray-800 hover:bg-gray-700 rotate-0'
                    : 'bg-gradient-to-br from-[#1877F2] to-[#0d47a1] hover:scale-110 animate-bounce'
                    }`}
            >
                {open ? (
                    <X className="h-6 w-6 text-white" />
                ) : (
                    <MessageCircle className="h-6 w-6 text-white" />
                )}
            </button>

            {/* Notification bubble */}
            {!open && (
                <div className="fixed bottom-[4.5rem] right-4 md:right-6 z-[149] bg-white rounded-2xl shadow-lg border px-4 py-2.5 max-w-[220px] animate-in slide-in-from-right-3 duration-500">
                    <p className="text-xs font-medium">👋 Need help? Ask our AI assistant!</p>
                    <button onClick={() => setOpen(true)} className="text-xs text-[#1877F2] font-medium mt-0.5 hover:underline">Chat now →</button>
                </div>
            )}
        </>
    );
}

