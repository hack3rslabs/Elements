"use client";
import { useState, useEffect } from "react";
import { Globe, Link2, CheckCircle2, Settings, Save, Copy, ExternalLink, AlertCircle, Info } from "lucide-react";

const API = "";
const HEADERS = { "Content-Type": "application/json", "x-api-key": "elements-admin-key-2026" };

interface Integration {
    enabled: boolean; sellerId?: string; apiKey?: string; lastSync: string | null;
    status: string; webhookUrl?: string; provider?: string; leadsReceived?: number;
    pageId?: string; accessToken?: string;
}

const PLATFORMS = [
    { key: "amazon", name: "Amazon Seller", icon: "🛒", color: "bg-amber-500", desc: "Sync products & receive order lead notifications from Amazon Seller Central", setupSteps: ["Register on Amazon Seller Central", "Go to Settings → API Integration", "Generate MWS API credentials", "Paste your Seller ID and API Key below", `Set webhook URL to: YOUR_DOMAIN/api/webhooks/amazon`] },
    { key: "flipkart", name: "Flipkart Seller", icon: "📦", color: "bg-blue-600", desc: "Connect your Flipkart seller account for order & lead capture", setupSteps: ["Login to Flipkart Seller Hub", "Navigate to Account → API Access", "Create a new API application", "Copy the App ID and Secret Key", `Configure webhook: YOUR_DOMAIN/api/webhooks/flipkart`] },
    { key: "meesho", name: "Meesho Supplier", icon: "🛍️", color: "bg-pink-500", desc: "Receive leads and order data from your Meesho supplier panel", setupSteps: ["Login to Meesho Supplier Panel", "Go to Settings → Integrations", "Enable webhook notifications", "Enter your webhook URL below", `Webhook: YOUR_DOMAIN/api/webhooks/meesho`] },
    { key: "indiamart", name: "IndiaMART", icon: "🏭", color: "bg-green-600", desc: "Receive B2B leads from IndiaMART directly into your CRM pipeline", setupSteps: ["Login to IndiaMART seller dashboard", "Go to My Account → Lead Manager → API/Webhook Settings", "Set webhook POST URL to the endpoint shown below", "Leads will auto-land in your CRM"] },
    { key: "meta", name: "Meta (Facebook / Instagram)", icon: "📱", color: "bg-indigo-600", desc: "Capture leads from Facebook Lead Ads and Instagram directly into CRM", setupSteps: ["Go to Facebook Business Suite → Settings", "Navigate to Integrations → Lead Access", "Create a Webhook for your Page", "Set callback URL to: YOUR_DOMAIN/api/webhooks/meta", "Subscribe to leadgen events", "Facebook Lead Ads will auto-push leads to your CRM"] },
    { key: "crm", name: "External CRM Webhook", icon: "📊", color: "bg-purple-600", desc: "Dispatch leads to Zoho, Salesforce, HubSpot, or Cronberry via outbound webhook", setupSteps: ["Choose your CRM provider below", "Enter the incoming webhook URL from your CRM", "Add your CRM API key for authentication", "New leads will be forwarded to your CRM automatically"] },
];

const WEBHOOK_ENDPOINTS = [
    { label: "Generic", url: "/api/webhooks/generic", desc: "Accept leads from any source using standard fields (name, email, phone)" },
    { label: "Amazon", url: "/api/webhooks/amazon", desc: "Amazon order/customer notifications" },
    { label: "Flipkart", url: "/api/webhooks/flipkart", desc: "Flipkart order/customer notifications" },
    { label: "Meesho", url: "/api/webhooks/meesho", desc: "Meesho supplier panel order notifications" },
    { label: "IndiaMART", url: "/api/webhooks/indiamart", desc: "IndiaMART lead gen format (SENDER_NAME, SENDER_EMAIL, etc.)" },
    { label: "Meta (FB/IG)", url: "/api/webhooks/meta", desc: "Facebook/Instagram Lead Ads lead gen format" },
    { label: "Google Business", url: "/api/webhooks/google-business", desc: "Google Business Profile messages" },
];

export default function IntegrationsTab() {
    const [integrations, setIntegrations] = useState<Record<string, Integration>>({});
    const [editing, setEditing] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");
    const [showSetup, setShowSetup] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetch(`${API}/api/admin/integrations`, { headers: HEADERS })
                .then(r => r.json())
                .then(d => { if (d.success) setIntegrations(d.data); })
                .catch(() => {
                    // Default state if backend unavailable
                    const defaultIntegrations: Record<string, Integration> = {};
                    PLATFORMS.forEach(p => {
                        defaultIntegrations[p.key] = { enabled: false, sellerId: '', apiKey: '', lastSync: null, status: 'disconnected', leadsReceived: 0 };
                    });
                    setIntegrations(defaultIntegrations);
                });
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const copyWebhook = (url: string) => {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        navigator.clipboard.writeText(`${baseUrl}${url}`);
        showToast("Webhook URL copied! Use this in your platform's settings.");
    };

    const handleSave = async (key: string) => {
        setSaving(true);
        try {
            await fetch(`${API}/api/admin/integrations`, {
                method: "POST", headers: HEADERS,
                body: JSON.stringify({ platform: key, config: integrations[key] }),
            });
            showToast(`${key} integration saved!`);
        } catch { showToast("Saved locally"); }
        setSaving(false);
        setEditing(null);
    };

    const updateField = (key: string, field: string, value: string | boolean) => {
        setIntegrations(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    };

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <div className="space-y-4">
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />{toast}
                </div>
            )}

            {/* How it works info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-2"><Info className="h-4 w-4 text-[#1877F2]" /> How Lead Integrations Work</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                    Each platform has a <strong>webhook endpoint</strong> on your backend. When a lead comes from Amazon, Flipkart, Meesho, IndiaMART, or Meta (Facebook/Instagram ads),
                    it automatically lands in your <strong>CRM / Leads</strong> tab with the source tagged. Configure each platform below and use the webhook URLs in your seller/marketing dashboards.
                </p>
            </div>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLATFORMS.map(p => {
                    const int = integrations[p.key] || { enabled: false, status: 'disconnected', leadsReceived: 0 };
                    const isEditing = editing === p.key;
                    const isSetupShown = showSetup === p.key;
                    return (
                        <div key={p.key} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                            <div className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`h-11 w-11 rounded-xl ${p.color} flex items-center justify-center text-xl shadow-sm`}>{p.icon}</div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm">{p.name}</h3>
                                        <p className="text-[10px] text-gray-400 leading-snug">{p.desc}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${int.status === "active" || int.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                            {int.status === "active" || int.enabled ? "Connected" : "Disconnected"}
                                        </div>
                                        {(int.leadsReceived || 0) > 0 && (
                                            <span className="text-[10px] text-gray-400">{int.leadsReceived} leads received</span>
                                        )}
                                    </div>
                                </div>

                                {/* Setup Guide Toggle */}
                                <button onClick={() => setShowSetup(isSetupShown ? null : p.key)}
                                    className="text-[10px] text-[#1877F2] font-medium hover:underline mb-2 flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" /> {isSetupShown ? 'Hide' : 'View'} Setup Guide
                                </button>

                                {isSetupShown && (
                                    <div className="bg-gray-50 rounded-xl p-3 mb-3 border">
                                        <p className="text-[10px] font-bold text-gray-600 mb-1.5">Setup Steps:</p>
                                        <ol className="space-y-1">
                                            {p.setupSteps.map((step, i) => (
                                                <li key={i} className="text-[10px] text-gray-600 flex items-start gap-1.5">
                                                    <span className="font-bold text-[#1877F2] shrink-0">{i + 1}.</span>
                                                    <span>{step.replace('YOUR_DOMAIN', baseUrl)}</span>
                                                </li>
                                            ))}
                                        </ol>
                                        {/* Webhook URL + copy */}
                                        {WEBHOOK_ENDPOINTS.find(w => w.label.toLowerCase().includes(p.key)) && (
                                            <div className="mt-2 flex items-center gap-2 bg-white p-2 rounded-lg border">
                                                <code className="text-[10px] text-gray-700 flex-1 truncate">
                                                    {baseUrl}{WEBHOOK_ENDPOINTS.find(w => w.label.toLowerCase().includes(p.key))?.url}
                                                </code>
                                                <button onClick={() => copyWebhook(WEBHOOK_ENDPOINTS.find(w => w.label.toLowerCase().includes(p.key))?.url || '')}
                                                    className="h-6 w-6 rounded bg-blue-50 text-[#1877F2] flex items-center justify-center hover:bg-blue-100" aria-label="Copy">
                                                    <Copy className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isEditing ? (
                                    <div className="space-y-3 mt-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={int.enabled} onChange={e => updateField(p.key, "enabled", e.target.checked)} className="rounded" />
                                            <span className="text-xs">Enabled</span>
                                        </label>
                                        {p.key !== "crm" && p.key !== "meta" && (
                                            <div>
                                                <label className="text-[10px] text-gray-500 block mb-1">Seller / Account ID</label>
                                                <input value={int.sellerId || ''} onChange={e => updateField(p.key, "sellerId", e.target.value)} className="w-full h-9 rounded-lg border px-3 text-xs" placeholder="Enter seller ID" />
                                            </div>
                                        )}
                                        {p.key === "meta" && (
                                            <>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 block mb-1">Facebook Page ID</label>
                                                    <input value={int.pageId || ''} onChange={e => updateField(p.key, "pageId", e.target.value)} className="w-full h-9 rounded-lg border px-3 text-xs" placeholder="Enter Facebook Page ID" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 block mb-1">Page Access Token</label>
                                                    <input type="password" value={int.accessToken || ''} onChange={e => updateField(p.key, "accessToken", e.target.value)} className="w-full h-9 rounded-lg border px-3 text-xs" placeholder="Enter Facebook access token" />
                                                </div>
                                            </>
                                        )}
                                        {p.key === "crm" && (
                                            <>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 block mb-1">CRM Provider</label>
                                                    <select value={int.provider || ""} onChange={e => updateField(p.key, "provider", e.target.value)} className="w-full h-9 rounded-lg border px-3 text-xs bg-white" aria-label="CRM Provider">
                                                        <option value="">Select Provider</option>
                                                        <option>Zoho CRM</option><option>Salesforce</option><option>HubSpot</option><option>Cronberry</option><option>Custom</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 block mb-1">Outbound Webhook URL</label>
                                                    <input value={int.webhookUrl || ""} onChange={e => updateField(p.key, "webhookUrl", e.target.value)} className="w-full h-9 rounded-lg border px-3 text-xs" placeholder="https://hooks.zapier.com/..." />
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <label className="text-[10px] text-gray-500 block mb-1">API Key / Secret</label>
                                            <input type="password" value={int.apiKey || ''} onChange={e => updateField(p.key, "apiKey", e.target.value)} className="w-full h-9 rounded-lg border px-3 text-xs" placeholder="Enter API key" />
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={() => handleSave(p.key)} disabled={saving} className="flex-1 bg-[#1877F2] text-white rounded-lg h-9 text-xs font-medium hover:bg-[#0d47a1] flex items-center justify-center gap-1.5">
                                                <Save className="h-3.5 w-3.5" />{saving ? "Saving..." : "Save"}
                                            </button>
                                            <button onClick={() => setEditing(null)} className="px-4 border rounded-lg h-9 text-xs hover:bg-gray-50">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => setEditing(p.key)} className="flex-1 bg-gray-100 rounded-lg h-9 text-xs font-medium hover:bg-gray-200 flex items-center justify-center gap-1.5">
                                            <Settings className="h-3.5 w-3.5" />Configure
                                        </button>
                                        {int.lastSync && <span className="text-[10px] text-gray-400 self-center">Last sync: {new Date(int.lastSync).toLocaleDateString()}</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* All Webhook Reference */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Link2 className="h-4 w-4 text-[#1877F2]" />All Webhook Endpoints (for developers)</h3>
                <p className="text-[10px] text-gray-400 mb-3">Use these URLs in your marketplace seller dashboards, ad platforms, or Zapier/Make automations. Leads posted here will appear in your CRM tab automatically.</p>
                <div className="space-y-2">
                    {WEBHOOK_ENDPOINTS.map(wh => (
                        <div key={wh.label} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border">
                            <span className="text-xs font-medium w-24 shrink-0">{wh.label}</span>
                            <div className="flex-1 min-w-0">
                                <code className="text-[10px] bg-white px-2 py-1 rounded border block truncate">{baseUrl}{wh.url}</code>
                                <p className="text-[9px] text-gray-400 mt-0.5">{wh.desc}</p>
                            </div>
                            <button onClick={() => copyWebhook(wh.url)} className="text-[10px] text-[#1877F2] font-medium hover:underline shrink-0 flex items-center gap-1">
                                <Copy className="h-3 w-3" /> Copy
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

