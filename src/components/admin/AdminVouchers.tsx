import { useState, useEffect } from 'react';
import { Database, PlusCircle, ArrowLeft } from 'lucide-react';

export default function AdminVouchers({ setPath }: { setPath: (path: string) => void }) {
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [bulkCodes, setBulkCodes] = useState('');
    const [submittingVouchers, setSubmittingVouchers] = useState(false);
    const [bulkSuccess, setBulkSuccess] = useState('');
    const [bulkError, setBulkError] = useState('');

    useEffect(() => {
        const fetchProd = async () => {
            try {
                const adminToken = localStorage.getItem('impura_admin_token') || '';
                const res = await fetch(`/api/admin/products`, { headers: { 'x-admin-token': adminToken }});
                const data = await res.json();
                if (data.ok && data.products) {
                    setProducts(data.products);
                    if (data.products.length > 0) {
                        setSelectedProduct(data.products[0].id);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchProd();
    }, []);

    const handleAddVouchers = async () => {
        setBulkError('');
        setBulkSuccess('');
        
        const lines = bulkCodes.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length === 0) {
            setBulkError('Masukkan minimal 1 produk krendesial.');
            return;
        }

        setSubmittingVouchers(true);
        try {
            const adminToken = localStorage.getItem('impura_admin_token') || '';
            const res = await fetch(`/api/admin/add-vouchers`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-token': adminToken
                },
                body: JSON.stringify({
                    product_id: selectedProduct,
                    codes: lines
                })
            });
            const data = await res.json();
            if (data.ok) {
                setBulkSuccess(`Berhasil menambah ${lines.length} stok untuk produk ${selectedProduct}`);
                setBulkCodes(''); // Clear form on success
            } else {
                setBulkError('Gagal: ' + data.error);
            }
        } catch (err) {
            setBulkError('Upload gagal - masalah jaringan');
        } finally {
            setSubmittingVouchers(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => setPath('/admin/orders')} className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <Database className="w-6 h-6 text-[#ff1b2d]" />
                    Manajemen Stok Vouchers
                </h2>
            </div>
            
            <div className="bg-[#111] border border-neutral-850 rounded-2xl p-6">
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Masukkan kredensial / voucher codes. Setiap baris baru (enter) akan dihitung sebagai 1 stok item.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2 border-b border-neutral-800 pb-2">Pilih Produk</label>
                        <select 
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-xl py-3 px-4 text-sm font-bold uppercase outline-none focus:border-[#ff1b2d]/50"
                        >
                            {products.length === 0 && <option value="" disabled>Belum ada produk</option>}
                            {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2 border-b border-neutral-800 pb-2 flex justify-between">
                        List Kredensial Stok Baru
                        {bulkCodes && (
                            <span className="text-blue-400 font-mono text-[10px]">
                            {bulkCodes.split('\n').filter(l => l.trim()).length} Baris terdeteksi
                            </span>
                        )}
                    </label>
                    <textarea 
                        value={bulkCodes}
                        onChange={(e) => setBulkCodes(e.target.value)}
                        className="w-full h-48 bg-[#0a0a0a] border border-neutral-800 text-white font-mono text-xs p-4 rounded-xl outline-none focus:border-[#ff1b2d]/50 resize-y"
                        placeholder={`Satu rincian krendesial per baris.\nContoh format:\nEMAIL: gemini.pro@gmail.com | PASS: password123\nEMAIL: chatgpt.user@gmail.com | PASS: pass321`}
                    />
                    </div>

                    {bulkError && <div className="p-3 bg-[#ff1b2d]/10 border border-[#ff1b2d]/30 text-[#ff3b3b] text-xs font-bold rounded-lg">{bulkError}</div>}
                    {bulkSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg">{bulkSuccess}</div>}

                    <div className="pt-2">
                        <button 
                            onClick={handleAddVouchers}
                            disabled={submittingVouchers || !bulkCodes.trim() || !selectedProduct}
                            className="w-full py-3 bg-[#ff1b2d] hover:bg-[#ff3b3b] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(255,27,45,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submittingVouchers ? (
                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                            ) : (
                            <><PlusCircle className="w-4 h-4" /> Masukkan ke Database</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
