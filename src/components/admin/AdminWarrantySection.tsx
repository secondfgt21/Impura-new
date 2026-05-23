import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Trash2, Edit2, XSquare, Save } from 'lucide-react';

export default function AdminWarrantySection({ productId }: { productId: string }) {
    const [warranties, setWarranties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingWarranty, setEditingWarranty] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchWarranties = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/products/${productId}/warranties`);
            const data = await res.json();
            if (data.ok) {
                setWarranties(data.warranties || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarranties();
    }, [productId]);

    const handleSaveWarranty = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData(e.target as HTMLFormElement);
            const warrantyData = {
                id: editingWarranty?.id,
                product_id: productId,
                title: formData.get('title'),
                description: formData.get('description'),
                extra_price: parseInt(formData.get('extra_price') as string) || 0,
                duration_days: parseInt(formData.get('duration_days') as string) || 30,
                sort_order: parseInt(formData.get('sort_order') as string) || 0,
                is_popular: formData.get('is_popular') === 'on',
                default_selected: formData.get('default_selected') === 'on'
            };
            const adminToken = localStorage.getItem('impura_admin_token') || '';
            const res = await fetch(`/api/admin/warranties`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-token': adminToken
                },
                body: JSON.stringify(warrantyData)
            });
            const data = await res.json();
            if (data.ok) {
                setEditingWarranty(null);
                fetchWarranties();
            } else {
                alert('Gagal simpan garansi: ' + data.error);
            }
        } catch (e) {
            alert('Kesalahan jaringan saat menyimpan garansi');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteWarranty = async (id: string, title: string) => {
        if (!window.confirm(`Hapus opsi garansi "${title}"?`)) return;
        try {
            const adminToken = localStorage.getItem('impura_admin_token') || '';
            const res = await fetch(`/api/admin/warranties/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-token': adminToken }
            });
            if (res.ok) {
                fetchWarranties();
            } else {
                alert('Gagal hapus garansi');
            }
        } catch (e) {
            alert('Error network');
        }
    };

    return (
        <div className="bg-[#111] border border-neutral-850 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#ff1b2d]" />
                    Opsi Garansi Produk
                </h3>
                {!editingWarranty && (
                    <button 
                        type="button"
                        onClick={() => setEditingWarranty({ product_id: productId })}
                        className="px-3 py-1.5 bg-[#ff1b2d]/10 hover:bg-[#ff1b2d]/20 text-[#ff3b3b] rounded-lg text-xs font-bold uppercase transition flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> Tambah Opsi
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-4">
                     <span className="w-5 h-5 block border-2 border-[#ff1b2d]/30 border-t-[#ff1b2d] rounded-full animate-spin"></span>
                </div>
            ) : editingWarranty ? (
                <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-5 relative mt-4">
                    <button 
                        type="button" 
                        onClick={() => setEditingWarranty(null)} 
                        className="absolute top-4 right-4 text-slate-500 hover:text-white"
                    >
                        <XSquare className="w-5 h-5" />
                    </button>
                    <h4 className="text-white font-bold text-sm mb-4">
                        {editingWarranty.id ? 'Edit Garansi' : 'Buat Garansi Baru'}
                    </h4>
                    <form onSubmit={handleSaveWarranty} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Judul Garansi</label>
                                <input name="title" defaultValue={editingWarranty?.title || ''} required className="w-full bg-[#111] border border-neutral-800 text-white rounded-lg text-xs p-2.5 outline-none focus:border-[#ff1b2d]/50" placeholder="Garansi 1 Bulan" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tambahan Harga (Rp)</label>
                                <input name="extra_price" type="number" defaultValue={editingWarranty?.extra_price || 0} required className="w-full bg-[#111] border border-neutral-800 text-white rounded-lg text-xs font-mono p-2.5 outline-none focus:border-[#ff1b2d]/50" min="0" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Deskripsi Singkat</label>
                            <input name="description" defaultValue={editingWarranty?.description || ''} className="w-full bg-[#111] border border-neutral-800 text-white rounded-lg text-xs p-2.5 outline-none focus:border-[#ff1b2d]/50" placeholder="Penggantian akun maksimal 1x..." />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Durasi (Hari)</label>
                                <input name="duration_days" type="number" defaultValue={editingWarranty?.duration_days || 30} className="w-full bg-[#111] border border-neutral-800 text-white rounded-lg text-xs font-mono p-2.5 outline-none focus:border-[#ff1b2d]/50" min="1" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sort Order</label>
                                <input name="sort_order" type="number" defaultValue={editingWarranty?.sort_order || 0} className="w-full bg-[#111] border border-neutral-800 text-white rounded-lg text-xs font-mono p-2.5 outline-none focus:border-[#ff1b2d]/50" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="is_popular" name="is_popular" defaultChecked={editingWarranty?.is_popular || false} className="w-4 h-4 accent-[#ff1b2d]" />
                                <label htmlFor="is_popular" className="text-xs text-white select-none">Tandai badge "POPULAR"</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="default_selected" name="default_selected" defaultChecked={editingWarranty?.default_selected || false} className="w-4 h-4 accent-[#ff1b2d]" />
                                <label htmlFor="default_selected" className="text-xs text-white select-none">Pilih ini secara default (Auto-select)</label>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#ff1b2d] hover:bg-[#ff3b3b] text-white text-xs font-bold rounded-lg flex items-center gap-2">
                                <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            <button type="button" onClick={() => setEditingWarranty(null)} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg">Batal</button>
                        </div>
                    </form>
                </div>
            ) : warranties.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-neutral-800 rounded-xl text-slate-500 text-xs font-mono">
                    Belum ada opsi garansi untuk produk ini.
                </div>
            ) : (
                <div className="space-y-3 mt-4">
                    {warranties.map(w => (
                        <div key={w.id} className="p-4 rounded-xl border border-neutral-800 bg-[#0a0a0a] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h4 className="text-white font-bold text-sm flex gap-2 items-center">
                                    {w.title}
                                    {w.is_popular && <span className="bg-[#ff1b2d]/10 text-[#ff3b3b] text-[9px] px-2 py-0.5 rounded border border-[#ff1b2d]/20">POPULAR</span>}
                                    {w.default_selected && <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.5 rounded border border-emerald-500/20">DEFAULT</span>}
                                </h4>
                                <p className="text-xs text-slate-400 mt-1">{w.description}</p>
                                <div className="text-[10px] text-slate-500 font-mono mt-1 space-x-2">
                                    <span>Extra: +Rp {Number(w.extra_price).toLocaleString('id-ID')}</span>
                                    <span>|</span>
                                    <span>Durasi: {w.duration_days} Hari</span>
                                    <span>|</span>
                                    <span>Urutan: {w.sort_order}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                <button type="button" onClick={() => setEditingWarranty(w)} className="flex-1 md:flex-none p-2 bg-neutral-800 hover:bg-blue-500/20 hover:text-blue-400 text-white rounded-lg transition-colors flex justify-center items-center">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => handleDeleteWarranty(w.id, w.title)} className="flex-1 md:flex-none p-2 bg-neutral-800 hover:bg-red-500/20 hover:text-red-500 text-white rounded-lg transition-colors flex justify-center items-center">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
