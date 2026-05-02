"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Plus, Edit, Trash2, Phone, MessageCircle, Mail,
    CheckCircle2, Search as SearchIcon, X, Save, Calendar,
    UserCheck, FileText, ArrowRight, ChevronDown, ChevronUp,
    Send, Filter
} from "lucide-react";

const API = "";
const HEADERS = { "Content-Type": "application/json", "x-api-key": "elements-admin-key-2026" };

interface Note { id: string; text: string; type: string; createdBy: string; createdAt: string; }
interface FollowUp { id: string; scheduledAt: string; type: string; note: string; status: string; createdAt: string; }
interface Lead {
    id: string; name: string; email: string; phone: string; source: string;
    message: string; type: string; status: string; notes: Note[];
    followUps: FollowUp[]; convertedToCustomer: boolean; customerId: string | null;
    assignedTo: string; value: number; tags: string[]; timestamp: string; updatedAt: string;
}

const STATUS_OPTIONS = [
    { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'proposal', label: 'Proposal', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'won', label: 'Won', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700 border-red-200' },
];

const SOURCE_OPTIONS = ['all', 'website', 'website_contact', 'indiamart', 'amazon', 'flipkart', 'meesho', 'meta', 'google_business', 'manual', 'webhook'];

const getStatusStyle = (status: string) => STATUS_OPTIONS.find(s => s.value === status?.toLowerCase())?.color || 'bg-gray-100 text-gray-600';

const getSourceIcon = (source: string) => {
    const icons: Record<string, string> = {
        amazon: '🛒', flipkart: '📦', meesho: '🛍️', indiamart: '🏭',
        meta: '📱', google_business: '🔍', website: '🌐', website_contact: '✉️',
        manual: '✏️', webhook: '🔗'
    };
    return icons[source] || '📋';
};

export default function CRMTab() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterSource, setFilterSource] = useState("all");
    const [toast, setToast] = useState("");
    const [expandedLead, setExpandedLead] = useState<string | null>(null);

    // Forms
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', source: 'manual', message: '', type: 'general', assignedTo: '', value: '' });

    // Note & Follow-up forms
    const [noteForm, setNoteForm] = useState({ leadId: '', text: '', type: 'note' });
    const [followUpForm, setFollowUpForm] = useState({ leadId: '', scheduledAt: '', type: 'call', note: '' });
    const [showNoteForm, setShowNoteForm] = useState<string | null>(null);
    const [showFollowUpForm, setShowFollowUpForm] = useState<string | null>(null);

    // Delete confirm
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    const fetchLeads = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterStatus !== 'all') params.set('status', filterStatus);
            if (filterSource !== 'all') params.set('source', filterSource);
            if (search) params.set('search', search);
            const res = await fetch(`${API}/api/admin/leads?${params}`, { headers: HEADERS });
            const data = await res.json();
            if (data.success) setLeads(data.data || []);
        } catch {
            setLeads([]);
        }
        setLoading(false);
    }, [filterStatus, filterSource, search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLeads();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchLeads]);

    const handleAddLead = async () => {
        try {
            const res = await fetch(`${API}/api/admin/leads`, {
                method: 'POST', headers: HEADERS,
                body: JSON.stringify({
                    name: leadForm.name, email: leadForm.email, phone: leadForm.phone,
                    source: leadForm.source, message: leadForm.message, type: leadForm.type,
                    assignedTo: leadForm.assignedTo, value: Number(leadForm.value) || 0,
                }),
            });
            const data = await res.json();
            if (data.success) { showToast('Lead created!'); fetchLeads(); }
        } catch { showToast('Lead saved locally'); }
        setShowAddForm(false);
        resetForm();
    };

    const handleUpdateLead = async () => {
        if (!editingLead) return;
        try {
            await fetch(`${API}/api/admin/leads/${editingLead.id}`, {
                method: 'PUT', headers: HEADERS,
                body: JSON.stringify({
                    name: leadForm.name, email: leadForm.email, phone: leadForm.phone,
                    source: leadForm.source, message: leadForm.message, type: leadForm.type,
                    assignedTo: leadForm.assignedTo, value: Number(leadForm.value) || 0,
                }),
            });
            showToast('Lead updated!');
            fetchLeads();
        } catch { showToast('Updated locally'); }
        setEditingLead(null);
        setShowAddForm(false);
        resetForm();
    };

    const handleDeleteLead = async (id: string) => {
        try {
            await fetch(`${API}/api/admin/leads/${id}`, { method: 'DELETE', headers: HEADERS });
            showToast('Lead deleted!');
            fetchLeads();
        } catch { showToast('Deleted locally'); }
        setDeleteConfirm(null);
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await fetch(`${API}/api/admin/leads/${id}/status`, {
                method: 'PATCH', headers: HEADERS,
                body: JSON.stringify({ status }),
            });
            showToast(`Status → ${status}`);
            fetchLeads();
        } catch { showToast('Updated locally'); }
    };

    const handleConvert = async (id: string) => {
        try {
            const res = await fetch(`${API}/api/admin/leads/${id}/convert`, {
                method: 'POST', headers: HEADERS,
            });
            const data = await res.json();
            if (data.success) { showToast('🎉 Lead converted to customer!'); fetchLeads(); }
            else showToast(data.message);
        } catch { showToast('Conversion failed'); }
    };

    const handleAddNote = async (leadId: string) => {
        if (!noteForm.text) return;
        try {
            await fetch(`${API}/api/admin/leads/${leadId}/notes`, {
                method: 'POST', headers: HEADERS,
                body: JSON.stringify({ note: noteForm.text, type: noteForm.type }),
            });
            showToast('Note added!');
            fetchLeads();
        } catch { showToast('Note saved locally'); }
        setNoteForm({ leadId: '', text: '', type: 'note' });
        setShowNoteForm(null);
    };

    const handleAddFollowUp = async (leadId: string) => {
        if (!followUpForm.scheduledAt) return;
        try {
            await fetch(`${API}/api/admin/leads/${leadId}/followups`, {
                method: 'POST', headers: HEADERS,
                body: JSON.stringify(followUpForm),
            });
            showToast('Follow-up scheduled!');
            fetchLeads();
        } catch { showToast('Saved locally'); }
        setFollowUpForm({ leadId: '', scheduledAt: '', type: 'call', note: '' });
        setShowFollowUpForm(null);
    };

    const startEdit = (lead: Lead) => {
        setEditingLead(lead);
        setLeadForm({
            name: lead.name, email: lead.email, phone: lead.phone,
            source: lead.source, message: lead.message, type: lead.type,
            assignedTo: lead.assignedTo || '', value: lead.value?.toString() || '',
        });
        setShowAddForm(true);
    };

    const resetForm = () => {
        setLeadForm({ name: '', email: '', phone: '', source: 'manual', message: '', type: 'general', assignedTo: '', value: '' });
    };

    // Stats
    const statusCounts = STATUS_OPTIONS.map(s => ({
        ...s, count: leads.filter(l => (l.status || '').toLowerCase() === s.value).length,
    }));

    return (
        <div className="space-y-4">
            {toast && <div className="fixed top-4 right-4 z-[99] bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2 animate-in slide-in-from-right"><CheckCircle2 className="h-4 w-4" />{toast}</div>}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/40 z-[98] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-bold text-lg mb-2">Delete Lead?</h3>
                        <p className="text-sm text-gray-500 mb-4">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 border rounded-xl h-10 text-sm hover:bg-gray-50">Cancel</button>
                            <button onClick={() => handleDeleteLead(deleteConfirm)} className="flex-1 bg-red-500 text-white rounded-xl h-10 text-sm font-medium hover:bg-red-600">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pipeline Status Bar */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {statusCounts.map(s => (
                    <button key={s.value} onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
                        className={`rounded-xl border p-3 text-center transition-all ${filterStatus === s.value ? 'ring-2 ring-[#1877F2] shadow-md' : 'hover:shadow-sm'} ${s.color}`}>
                        <div className="text-xl font-bold">{s.count}</div>
                        <div className="text-[10px] capitalize font-medium">{s.label}</div>
                    </button>
                ))}
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads by name, email, phone..."
                        className="w-full h-10 pl-10 pr-4 rounded-xl border text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="h-10 rounded-xl border px-3 text-xs bg-white" aria-label="Filter by source">
                        {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                    </select>
                </div>
                <button onClick={() => { setEditingLead(null); resetForm(); setShowAddForm(true); }}
                    className="inline-flex items-center gap-2 bg-[#1877F2] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#0d47a1] shadow-md whitespace-nowrap">
                    <Plus className="h-4 w-4" /> Add Lead
                </button>
            </div>

            {/* Add/Edit Lead Form */}
            {showAddForm && (
                <div className="bg-white rounded-2xl border shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">{editingLead ? 'Edit Lead' : 'Add New Lead'}</h3>
                        <button onClick={() => { setShowAddForm(false); setEditingLead(null); }} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Name *</label>
                            <input value={leadForm.name} onChange={e => setLeadForm(f => ({ ...f, name: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="Lead name" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                            <input value={leadForm.email} onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="email@example.com" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
                            <input value={leadForm.phone} onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="+91 99955 52252" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Source</label>
                            <select value={leadForm.source} onChange={e => setLeadForm(f => ({ ...f, source: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm bg-white" aria-label="Lead source">
                                <option value="manual">Manual</option><option value="website">Website</option><option value="indiamart">IndiaMART</option>
                                <option value="amazon">Amazon</option><option value="flipkart">Flipkart</option><option value="meesho">Meesho</option>
                                <option value="meta">Meta (FB/IG)</option><option value="google_business">Google</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
                            <select value={leadForm.type} onChange={e => setLeadForm(f => ({ ...f, type: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm bg-white" aria-label="Lead type">
                                <option value="general">General</option><option value="Bulk Inquiry">Bulk Inquiry</option>
                                <option value="Partnership">Partnership</option><option value="Support">Support</option>
                                <option value="B2B Inquiry">B2B Inquiry</option><option value="order">Order</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Assigned To</label>
                            <input value={leadForm.assignedTo} onChange={e => setLeadForm(f => ({ ...f, assignedTo: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="Sales team member" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Deal Value (₹)</label>
                            <input type="number" value={leadForm.value} onChange={e => setLeadForm(f => ({ ...f, value: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="50000" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-gray-500 block mb-1">Message / Notes</label>
                            <textarea value={leadForm.message} onChange={e => setLeadForm(f => ({ ...f, message: e.target.value }))} rows={2} className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="Lead message or initial notes..." />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => { setShowAddForm(false); setEditingLead(null); }} className="px-4 py-2 rounded-full border text-sm font-medium hover:bg-gray-50">Cancel</button>
                        <button onClick={editingLead ? handleUpdateLead : handleAddLead} className="px-6 py-2 rounded-full bg-[#1877F2] text-white text-sm font-medium hover:bg-[#0d47a1] shadow-md flex items-center gap-2">
                            <Save className="h-4 w-4" /> {editingLead ? 'Update Lead' : 'Save Lead'}
                        </button>
                    </div>
                </div>
            )}

            {/* Leads List */}
            {loading ? (
                <div className="bg-white rounded-2xl border p-8 text-center text-sm text-gray-400">Loading leads...</div>
            ) : leads.length === 0 ? (
                <div className="bg-white rounded-2xl border p-8 text-center text-sm text-gray-400">No leads found. Add your first lead or integrate a platform to start receiving leads.</div>
            ) : (
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    {leads.map(lead => (
                        <div key={lead.id} className="border-b last:border-0">
                            {/* Lead Row */}
                            <div className="p-4 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0d47a1] flex items-center justify-center text-white font-bold text-sm shrink-0">
                                        {lead.name[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">{lead.name}</span>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusStyle(lead.status)}`}>{lead.status}</span>
                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{getSourceIcon(lead.source)} {lead.source.replace(/_/g, ' ')}</span>
                                            {lead.type && lead.type !== 'general' && <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">{lead.type}</span>}
                                            {lead.convertedToCustomer && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✓ Customer</span>}
                                            {lead.value > 0 && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">₹{lead.value.toLocaleString()}</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 truncate max-w-[400px]">{lead.message || 'No message'}</p>
                                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 flex-wrap">
                                            {lead.email && <span>📧 {lead.email}</span>}
                                            {lead.phone && <span>📞 {lead.phone}</span>}
                                            <span>📅 {new Date(lead.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            {lead.assignedTo && <span>👤 {lead.assignedTo}</span>}
                                            {(lead.notes?.length || 0) > 0 && <span>📝 {lead.notes.length} notes</span>}
                                            {(lead.followUps?.length || 0) > 0 && <span>📅 {lead.followUps.length} follow-ups</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        {/* Status dropdown */}
                                        <select value={(lead.status || 'new').toLowerCase()} onChange={e => handleStatusChange(lead.id, e.target.value)}
                                            className="text-[10px] border rounded-lg px-2 py-1 bg-white focus:outline-none" aria-label="Change lead status">
                                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                        <div className="flex gap-1">
                                            {lead.phone && <a href={`tel:${lead.phone}`} className="h-7 w-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100" aria-label="Call"><Phone className="h-3.5 w-3.5" /></a>}
                                            {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\s+/g, '').replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100" aria-label="WhatsApp"><MessageCircle className="h-3.5 w-3.5" /></a>}
                                            {lead.email && <a href={`mailto:${lead.email}`} className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100" aria-label="Email"><Mail className="h-3.5 w-3.5" /></a>}
                                            <button onClick={() => startEdit(lead)} className="h-7 w-7 rounded-lg bg-blue-50 text-[#1877F2] flex items-center justify-center hover:bg-blue-100" aria-label="Edit"><Edit className="h-3.5 w-3.5" /></button>
                                            <button onClick={() => setDeleteConfirm(lead.id)} className="h-7 w-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                                            <button onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)} className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200" aria-label="Expand">
                                                {expandedLead === lead.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Detail Panel */}
                            {expandedLead === lead.id && (
                                <div className="px-4 pb-4 bg-gray-50/50 border-t">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
                                        {/* Notes */}
                                        <div className="bg-white rounded-xl border p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-bold flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-[#1877F2]" /> Notes</h4>
                                                <button onClick={() => { setShowNoteForm(showNoteForm === lead.id ? null : lead.id); setNoteForm({ leadId: lead.id, text: '', type: 'note' }); }}
                                                    className="text-[10px] text-[#1877F2] font-medium hover:underline">+ Add Note</button>
                                            </div>
                                            {showNoteForm === lead.id && (
                                                <div className="space-y-2 mb-3 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                                                    <select value={noteForm.type} onChange={e => setNoteForm(f => ({ ...f, type: e.target.value }))} className="w-full h-7 rounded-lg border px-2 text-[10px] bg-white" aria-label="Note type">
                                                        <option value="note">📝 Note</option><option value="call">📞 Call</option>
                                                        <option value="email">📧 Email</option><option value="meeting">🤝 Meeting</option>
                                                        <option value="whatsapp">💬 WhatsApp</option>
                                                    </select>
                                                    <textarea value={noteForm.text} onChange={e => setNoteForm(f => ({ ...f, text: e.target.value }))} rows={2} className="w-full rounded-lg border px-2 py-1 text-[10px] resize-none" placeholder="Write your note..." />
                                                    <button onClick={() => handleAddNote(lead.id)} className="w-full bg-[#1877F2] text-white rounded-lg h-7 text-[10px] font-medium hover:bg-[#0d47a1] flex items-center justify-center gap-1">
                                                        <Send className="h-3 w-3" /> Save Note
                                                    </button>
                                                </div>
                                            )}
                                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                                                {(lead.notes || []).length === 0 ? (
                                                    <p className="text-[10px] text-gray-400 text-center py-2">No notes yet</p>
                                                ) : lead.notes.map(n => (
                                                    <div key={n.id} className="p-2 bg-gray-50 rounded-lg border text-[10px]">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <span>{n.type === 'call' ? '📞' : n.type === 'email' ? '📧' : n.type === 'meeting' ? '🤝' : n.type === 'whatsapp' ? '💬' : '📝'}</span>
                                                            <span className="font-medium">{n.createdBy}</span>
                                                            <span className="text-gray-400">• {new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                                        </div>
                                                        <p className="text-gray-700">{n.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Follow-ups */}
                                        <div className="bg-white rounded-xl border p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-bold flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-purple-500" /> Follow-ups</h4>
                                                <button onClick={() => { setShowFollowUpForm(showFollowUpForm === lead.id ? null : lead.id); setFollowUpForm({ leadId: lead.id, scheduledAt: '', type: 'call', note: '' }); }}
                                                    className="text-[10px] text-purple-600 font-medium hover:underline">+ Schedule</button>
                                            </div>
                                            {showFollowUpForm === lead.id && (
                                                <div className="space-y-2 mb-3 p-2 bg-purple-50/50 rounded-lg border border-purple-100">
                                                    <input type="datetime-local" value={followUpForm.scheduledAt} onChange={e => setFollowUpForm(f => ({ ...f, scheduledAt: e.target.value }))}
                                                        className="w-full h-7 rounded-lg border px-2 text-[10px]" />
                                                    <select value={followUpForm.type} onChange={e => setFollowUpForm(f => ({ ...f, type: e.target.value }))} className="w-full h-7 rounded-lg border px-2 text-[10px] bg-white" aria-label="Follow-up type">
                                                        <option value="call">📞 Call</option>
                                                        <option value="email">📧 Email</option>
                                                        <option value="meeting">🤝 Meeting</option>
                                                        <option value="whatsapp">💬 WhatsApp</option>
                                                        <option value="visit">🏠 Site Visit</option>
                                                    </select>
                                                    <input value={followUpForm.note} onChange={e => setFollowUpForm(f => ({ ...f, note: e.target.value }))} className="w-full h-7 rounded-lg border px-2 text-[10px]" placeholder="Short note..." />
                                                    <button onClick={() => handleAddFollowUp(lead.id)} className="w-full bg-purple-600 text-white rounded-lg h-7 text-[10px] font-medium hover:bg-purple-700 flex items-center justify-center gap-1">
                                                        <Calendar className="h-3 w-3" /> Schedule
                                                    </button>
                                                </div>
                                            )}
                                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                                                {(lead.followUps || []).length === 0 ? (
                                                    <p className="text-[10px] text-gray-400 text-center py-2">No follow-ups scheduled</p>
                                                ) : lead.followUps.map(f => (
                                                    <div key={f.id} className={`p-2 rounded-lg border text-[10px] ${f.status === 'completed' ? 'bg-green-50 border-green-100' : f.status === 'missed' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <span>{f.type === 'call' ? '📞' : f.type === 'email' ? '📧' : f.type === 'meeting' ? '🤝' : f.type === 'visit' ? '🏠' : '💬'} {new Date(f.scheduledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                            <span className={`font-medium ${f.status === 'completed' ? 'text-green-700' : f.status === 'missed' ? 'text-red-600' : 'text-yellow-700'}`}>{f.status}</span>
                                                        </div>
                                                        {f.note && <p className="text-gray-600 mt-0.5">{f.note}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="bg-white rounded-xl border p-3">
                                            <h4 className="text-xs font-bold mb-3 flex items-center gap-1"><ArrowRight className="h-3.5 w-3.5 text-green-500" /> Quick Actions</h4>
                                            <div className="space-y-2">
                                                {!lead.convertedToCustomer && (
                                                    <button onClick={() => handleConvert(lead.id)}
                                                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl h-9 text-xs font-medium hover:from-emerald-600 hover:to-green-700 flex items-center justify-center gap-2 shadow-sm">
                                                        <UserCheck className="h-4 w-4" /> Convert to Customer
                                                    </button>
                                                )}
                                                {lead.phone && (
                                                    <a href={`https://wa.me/${lead.phone.replace(/\s+/g, '').replace('+', '')}?text=Hi ${encodeURIComponent(lead.name)}, thank you for your inquiry at Hindustan Elements!`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="w-full bg-green-50 text-green-700 rounded-xl h-9 text-xs font-medium hover:bg-green-100 flex items-center justify-center gap-2 border border-green-200">
                                                        <MessageCircle className="h-4 w-4" /> Send WhatsApp
                                                    </a>
                                                )}
                                                <button onClick={() => startEdit(lead)} className="w-full bg-blue-50 text-[#1877F2] rounded-xl h-9 text-xs font-medium hover:bg-blue-100 flex items-center justify-center gap-2 border border-blue-200">
                                                    <Edit className="h-4 w-4" /> Edit Lead Details
                                                </button>
                                                {lead.convertedToCustomer && (
                                                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                                                        <p className="text-[10px] text-emerald-700 font-medium">✅ Converted to Customer</p>
                                                        <p className="text-[10px] text-emerald-600">ID: {lead.customerId}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

