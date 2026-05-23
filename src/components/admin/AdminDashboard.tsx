import { useEffect, useState } from 'react';
import { Activity, Database, ShoppingCart, DollarSign, Package, Users } from 'lucide-react';

export default function AdminDashboard({ setPath }: { setPath: (path: string) => void }) {
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [stockInfo, setStockInfo] = useState<any>({ stock: {}, sold: {}, total_sold: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('impura_admin_token') || '';
        
        // Parallel fetch
        const [ordersRes, storeRes] = await Promise.all([
          fetch('/api/admin/orders', { headers: { 'x-admin-token': token } }),
          fetch('/api/store-data')
        ]);
        
        if (active) {
            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                if (ordersData.ok && ordersData.orders) {
                    const orders = ordersData.orders;
                    let totalRev = 0;
                    let pending = 0;
                    let completed = 0;
                    
                    orders.forEach((o: any) => {
                        if (o.status === 'completed') {
                            completed++;
                            totalRev += Number(o.amount_idr || 0);
                        } else if (o.status === 'pending') {
                            pending++;
                        }
                    });

                    setStats({
                        totalOrders: orders.length,
                        totalRevenue: totalRev,
                        pendingOrders: pending,
                        completedOrders: completed
                    });
                }
            }
            if (storeRes.ok) {
                const storeData = await storeRes.json();
                if (storeData.ok) {
                    setStockInfo({
                        stock: storeData.stock || {},
                        sold: storeData.sold || {},
                        total_sold: storeData.total_sold || 0
                    });
                }
            }
            setLoading(false);
        }
      } catch (err) {
        console.error("Dashboard fetch error", err);
        if (active) setLoading(false);
      }
    };
    
    fetchData();
    return () => { active = false; };
  }, []);

  if (loading) {
      return (
          <div className="flex justify-center items-center h-64">
              <span className="inline-block w-8 h-8 rounded-full border-[3px] border-neutral-800 border-t-[#ff1b2d] animate-spin" />
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Cards */}
        <div className="bg-[#111] border border-neutral-850 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="w-16 h-16 text-[#ff1b2d]" /></div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 relative z-10">Total Revenue</p>
            <h3 className="text-white text-3xl font-black relative z-10">Rp {stats.totalRevenue.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-[#111] border border-neutral-850 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ShoppingCart className="w-16 h-16 text-[#ff1b2d]" /></div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 relative z-10">Total Orders</p>
            <h3 className="text-white text-3xl font-black relative z-10">{stats.totalOrders}</h3>
        </div>
        <div className="bg-[#111] border border-neutral-850 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-16 h-16 text-yellow-500" /></div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 relative z-10">Pending Payment</p>
            <h3 className="text-white text-3xl font-black relative z-10">{stats.pendingOrders}</h3>
        </div>
        <div className="bg-[#111] border border-neutral-850 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Package className="w-16 h-16 text-emerald-500" /></div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 relative z-10">Completed Sales</p>
            <h3 className="text-white text-3xl font-black relative z-10">{stats.completedOrders}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div className="bg-[#0a0a0a] border border-neutral-850 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#ff3b3b]" />
                    Stok Tersedia
                </h3>
                <button onClick={() => setPath('/admin/orders')} className="text-xs text-[#ff1b2d] font-bold hover:underline">Kelola Stok &rarr;</button>
            </div>
            {Object.keys(stockInfo.stock).length === 0 ? (
                <p className="text-slate-500 text-sm">Belum ada data stok.</p>
            ) : (
                <div className="space-y-4">
                    {Object.entries(stockInfo.stock).map(([prodId, qty]) => (
                        <div key={prodId} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <span className="text-white font-mono text-sm capitalize">{prodId}</span>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${Number(qty) <= 5 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                {String(qty)} Vouchers
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="bg-[#0a0a0a] border border-neutral-850 rounded-2xl p-6">
            <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-blue-400" />
                Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setPath('/admin/products/new')} className="p-4 border border-white/10 rounded-xl bg-[#111] hover:bg-[#ff1b2d]/10 hover:border-[#ff1b2d]/30 transition-all text-left">
                    <h4 className="text-white font-bold mb-1">Tambah Produk</h4>
                    <p className="text-xs text-slate-500">Buat produk baru dengan form.</p>
                </button>
                <button onClick={() => setPath('/admin/orders')} className="p-4 border border-white/10 rounded-xl bg-[#111] hover:bg-[#ff1b2d]/10 hover:border-[#ff1b2d]/30 transition-all text-left">
                    <h4 className="text-white font-bold mb-1">Cek Pesanan Baru</h4>
                    <p className="text-xs text-slate-500">Lihat status transaksi pending.</p>
                </button>
                <button onClick={() => setPath('/admin/products')} className="p-4 border border-white/10 rounded-xl bg-[#111] hover:bg-[#ff1b2d]/10 hover:border-[#ff1b2d]/30 transition-all text-left">
                    <h4 className="text-white font-bold mb-1">Kelola Garansi</h4>
                    <p className="text-xs text-slate-500">Edit opsi garansi tiap produk.</p>
                </button>
                <button onClick={() => setPath('/admin/system')} className="p-4 border border-white/10 rounded-xl bg-[#111] hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all text-left">
                    <h4 className="text-white font-bold mb-1">System Health</h4>
                    <p className="text-xs text-slate-500">Diagnostik status Supabase &amp; API.</p>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
