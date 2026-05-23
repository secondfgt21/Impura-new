import { useEffect, useState } from 'react';
import { Package, Plus, Edit2, Trash2 } from 'lucide-react';

export default function AdminProducts({ setPath }: { setPath: (path: string) => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const adminToken = localStorage.getItem('impura_admin_token') || '';
      const res = await fetch(`/api/admin/products`, { 
        headers: { 'x-admin-token': adminToken },
        cache: 'no-store' 
      });
      const data = await res.json();
      if (data.ok) setProducts(data.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
      if (!window.confirm(`Yakin ingin HAPUS produk ${name}? Ini juga akan menghapus opsi garansi.`)) return;
      try {
        const adminToken = localStorage.getItem('impura_admin_token') || '';
        const res = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: { 'x-admin-token': adminToken }
        });
        if (res.ok) {
            fetchProducts();
        } else {
            alert('Gagal menghapus produk');
        }
      } catch (err) {
          alert('Error menghapus');
      }
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <span className="inline-block w-8 h-8 rounded-full border-[3px] border-neutral-800 border-t-[#ff1b2d] animate-spin" />
        </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-[#0a0a0a] border border-neutral-850 p-6 rounded-2xl">
        <h2 className="text-xl font-black text-white flex items-center gap-3">
            <div className="p-2 bg-[#ff1b2d]/10 rounded-lg"><Package className="w-6 h-6 text-[#ff1b2d]" /></div>
            Manajemen Produk
        </h2>
        <button 
          onClick={() => setPath('/admin/products/new')}
          className="px-4 py-2.5 bg-[#ff1b2d] hover:bg-[#ff3b3b] text-white text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,27,45,0.4)]"
        >
          <Plus className="w-4 h-4" /> 
          <span className="hidden sm:inline">Tambah Produk</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl">
                <p className="text-slate-500 font-mono text-sm">Belum ada produk di database.</p>
            </div>
        ) : (
            products.map(p => (
                <div key={p.id} className="bg-[#111] border border-neutral-850 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-4">
                        {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-xl object-cover bg-neutral-900 border border-neutral-800" />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                                <Package className="w-6 h-6 text-neutral-700" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-white font-bold text-lg leading-tight flex items-center gap-2">
                                {p.name}
                                <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-neutral-800 text-slate-400 border border-neutral-700 uppercase">{p.id}</span>
                            </h3>
                            <div className="text-xs font-mono text-emerald-400 mt-1">Rp {Number(p.price_idr || p.price || 0).toLocaleString('id-ID')}</div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => setPath(`/admin/products/edit/${p.id}`)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-neutral-800 hover:bg-[#ff1b2d]/20 hover:text-[#ff3b3b] text-white text-xs font-bold rounded-xl transition-all flex justify-center items-center gap-2"
                        >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                            onClick={() => handleDelete(p.id, p.name)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-neutral-800 hover:bg-red-500/20 hover:text-red-500 text-white text-xs font-bold rounded-xl transition-all flex justify-center items-center gap-2"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
