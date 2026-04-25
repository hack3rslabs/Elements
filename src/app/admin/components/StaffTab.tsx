"use client";
import React, { useState, useEffect } from "react";
import { Plus, X, Trash2, Shield, Save, Mail, Phone, Eye, EyeOff, Key, Check, Edit } from "lucide-react";

interface Staff { id: string; name: string; email: string; phone: string; role: string; status: string; createdAt: string; lastLogin: string | null; permissions: string[]; }
interface Roles { [key: string]: { label: string; permissions: string[] } }

const ROLE_COLORS: Record<string, string> = { admin: 'bg-red-100 text-red-700', sub_admin: 'bg-blue-100 text-blue-700', staff: 'bg-green-100 text-green-700', tele_caller: 'bg-yellow-100 text-yellow-700', product_uploader: 'bg-purple-100 text-purple-700', viewer: 'bg-gray-100 text-gray-600' };
const ALL_PERMS = ['dashboard', 'products', 'orders', 'crm', 'payments', 'banners', 'tasks', 'campaigns', 'reports', 'integrations', 'staff', 'seo', 'settings'];

export default function StaffTab({ api, headers, showToast }: { api: string; headers: Record<string, string>; showToast: (m: string) => void }) {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [roles, setRoles] = useState<Roles>({});
    const [showForm, setShowForm] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'staff', password: '' });
    const [editPerms, setEditPerms] = useState<string | null>(null);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [permsList, setPermsList] = useState<string[]>([]);

    useEffect(() => {
        fetch(`${api}/api/admin/staff`, { headers }).then(r => r.json()).then(d => {
            if (d.success) { setStaff(d.data); setRoles(d.roles || {}); }
        }).catch(() => { });
    }, [api, headers]);

    const addStaff = async () => {
        if (!form.name || !form.email || !form.password) { showToast('Name, email, and password required'); return; }
        if (form.password.length < 6) { showToast('Password must be at least 6 characters'); return; }
        try {
            const res = await fetch(`${api}/api/admin/staff`, { method: 'POST', headers, body: JSON.stringify(form) });
            const d = await res.json();
            if (d.success) { setStaff(prev => [...prev, d.data]); showToast('Staff added! They can now login.'); setShowForm(false); setForm({ name: '', email: '', phone: '', role: 'staff', password: '' }); }
            else showToast(d.message);
        } catch { showToast('Error adding staff'); }
    };

    const updateStaff = async (id: string, data: { name?: string; phone?: string; password?: string; status?: string }) => {
        try {
            const res = await fetch(`${api}/api/admin/staff/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
            const d = await res.json();
            if (d.success) { setStaff(prev => prev.map(s => s.id === id ? d.data : s)); showToast(data.password ? 'Password reset successful!' : 'Staff updated!'); setEditingStaffId(null); }
            else showToast(d.message);
        } catch { showToast('Error'); }
    };

    const toggleStatus = async (id: string, status: string) => {
        const newStatus = status === 'active' ? 'inactive' : 'active';
        await updateStaff(id, { status: newStatus });
    };

    const deleteStaff = async (id: string) => {
        try {
            const res = await fetch(`${api}/api/admin/staff/${id}`, { method: 'DELETE', headers });
            const d = await res.json();
            if (d.success) { setStaff(prev => prev.filter(s => s.id !== id)); showToast('Staff removed'); }
            else showToast(d.message);
        } catch { showToast('Error'); }
    };

    const savePermissions = async (id: string) => {
        try {
            const res = await fetch(`${api}/api/admin/staff/${id}/permissions`, { method: 'PUT', headers, body: JSON.stringify({ permissions: permsList }) });
            const d = await res.json();
            if (d.success) { setStaff(prev => prev.map(s => s.id === id ? d.data : s)); showToast('Permissions updated!'); setEditPerms(null); }
        } catch { showToast('Error'); }
    };

    const togglePerm = (p: string) => setPermsList(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-400">{staff.length} staff members</p></div>
                <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-[#1877F2] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#0d47a1] shadow-md"><Plus className="h-4 w-4" /> Add Staff</button>
            </div>

            {/* RBAC Info */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-[#1877F2]" /> Role-Based Access Control (RBAC)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(roles).map(([key, r]) => (
                        <div key={key} className="bg-gray-50 rounded-xl p-3 border">
                            <div className="flex items-center gap-2 mb-1"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ROLE_COLORS[key] || 'bg-gray-100'}`}>{key}</span></div>
                            <p className="text-xs font-medium">{r.label}</p>
                            <div className="flex flex-wrap gap-1 mt-2">{r.permissions.map(p => <span key={p} className="text-[9px] bg-white border px-1.5 py-0.5 rounded capitalize">{p}</span>)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Add New Staff Member</h3><button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"><X className="h-4 w-4" /></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="John Doe" /></div>
                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="staff@elements.com" /></div>
                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="+91 XXXXX XXXXX" /></div>
                        <div><label className="text-xs font-medium text-gray-500 block mb-1">Role</label><select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm bg-white" aria-label="Role"><option value="sub_admin">Sub Admin</option><option value="staff">Staff</option><option value="tele_caller">Tele Caller</option><option value="product_uploader">Product Uploader</option></select></div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-gray-500 block mb-1">Password * (min 6 chars)</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input type={showPw ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full h-10 rounded-xl border pl-10 pr-10 text-sm focus:ring-2 focus:ring-[#1877F2]/30 focus:outline-none" placeholder="Min 6 characters" />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Staff will use this email + password to login at /login</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-full border text-sm font-medium hover:bg-gray-50">Cancel</button>
                        <button onClick={addStaff} className="px-6 py-2 rounded-full bg-[#1877F2] text-white text-sm font-medium hover:bg-[#0d47a1] shadow-md flex items-center gap-2"><Save className="h-4 w-4" /> Add Staff</button>
                    </div>
                </div>
            )}

            {/* Staff List */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b"><tr>
                        <th className="text-left p-3 font-medium text-xs text-gray-500">Member</th>
                        <th className="text-left p-3 font-medium text-xs text-gray-500 hidden md:table-cell">Contact</th>
                        <th className="text-center p-3 font-medium text-xs text-gray-500">Role</th>
                        <th className="text-center p-3 font-medium text-xs text-gray-500">Status</th>
                        <th className="text-right p-3 font-medium text-xs text-gray-500">Actions</th>
                    </tr></thead>
                    <tbody>
                        {staff.map(s => (
                            <React.Fragment key={s.id}>
                                <tr className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="p-3"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0d47a1] flex items-center justify-center text-white text-xs font-bold">{s.name.charAt(0).toUpperCase()}</div><div><p className="font-medium text-sm">{s.name}</p><p className="text-[10px] text-gray-400">{new Date(s.createdAt).toLocaleDateString()}{s.lastLogin ? ` • Last: ${new Date(s.lastLogin).toLocaleDateString()}` : ''}</p></div></div></td>
                                    <td className="p-3 hidden md:table-cell"><div className="text-xs"><div className="flex items-center gap-1 text-gray-500"><Mail className="h-3 w-3" />{s.email}</div>{s.phone && <div className="flex items-center gap-1 text-gray-400 mt-0.5"><Phone className="h-3 w-3" />{s.phone}</div>}</div></td>
                                    <td className="p-3 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ROLE_COLORS[s.role] || 'bg-gray-100'}`}>{s.role}</span></td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => toggleStatus(s.id, s.status)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${s.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                            {s.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                                        </button>
                                    </td>
                                    <td className="p-3 text-right">
                                        {s.role !== 'admin' && (
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => { setEditingStaffId(s.id); setForm({ name: s.name, email: s.email, phone: s.phone, role: s.role, password: '' }); }} className="h-7 w-7 rounded-lg bg-blue-50 text-[#1877F2] flex items-center justify-center hover:bg-blue-100" title="Edit Staff"><Edit className="h-3.5 w-3.5" /></button>
                                                <button onClick={() => { if (editPerms === s.id) { setEditPerms(null); } else { setEditPerms(s.id); setPermsList(s.permissions || []); } }} className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100" title="Permissions"><Shield className="h-3.5 w-3.5" /></button>
                                                <button onClick={() => deleteStaff(s.id)} className="h-7 w-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                {editingStaffId === s.id && (
                                    <tr key={`edit-${s.id}`}><td colSpan={5} className="p-4 bg-blue-50/30 border-b">
                                        <div className="flex items-center justify-between mb-3"><h4 className="text-xs font-bold text-gray-600">Edit Details for {s.name}</h4><button onClick={() => setEditingStaffId(null)} className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center"><X className="h-3 w-3" /></button></div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                            <div><label className="text-[10px] font-bold text-gray-400 block mb-1">Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full h-8 rounded-lg border px-2 text-xs" /></div>
                                            <div><label className="text-[10px] font-bold text-gray-400 block mb-1">Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full h-8 rounded-lg border px-2 text-xs" /></div>
                                            <div><label className="text-[10px] font-bold text-gray-400 block mb-1">Reset Password</label><input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Enter new pass..." className="w-full h-8 rounded-lg border px-2 text-xs bg-amber-50" /></div>
                                            <div className="flex items-end"><button onClick={() => updateStaff(s.id, { name: form.name, phone: form.phone, password: form.password || undefined })} className="w-full h-8 bg-[#1877F2] text-white rounded-lg text-xs font-bold hover:bg-[#0d47a1] flex items-center justify-center gap-2"><Save className="h-3.5 w-3.5" /> Save Changes</button></div>
                                        </div>
                                    </td></tr>
                                )}
                                {editPerms === s.id && (
                                    <tr key={`perms-${s.id}`}><td colSpan={5} className="p-4 bg-blue-50/50 border-b">
                                        <div className="flex items-center justify-between mb-2"><h4 className="text-xs font-bold text-gray-600">Manage Permissions for {s.name}</h4><button onClick={() => savePermissions(s.id)} className="inline-flex items-center gap-1 text-xs bg-[#1877F2] text-white px-3 py-1 rounded-full font-medium hover:bg-[#0d47a1]"><Check className="h-3 w-3" /> Save</button></div>
                                        <div className="flex flex-wrap gap-2">{ALL_PERMS.map(p => (
                                            <button key={p} onClick={() => togglePerm(p)} className={`text-[10px] px-2.5 py-1 rounded-full font-medium border transition-all ${permsList.includes(p) ? 'bg-[#1877F2] text-white border-[#1877F2]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#1877F2]'}`}>{p}</button>
                                        ))}</div>
                                    </td></tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

