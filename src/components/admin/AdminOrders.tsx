import { useEffect, useState } from 'react';
import { ShoppingCart, Check, RefreshCw, XSquare, PlusCircle } from 'lucide-react';

export default function AdminOrders({ setPath }: { setPath: (path: string) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductForVouchers, setSelectedProductForVouchers] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const adminToken = localStorage.getItem('impura_admin_token') || '';
      const res = await fetch(`/api/admin/orders`, { 
        headers: { 'x-admin-token': adminToken },
        cache: 'no-store' 
      });
      const data = await res.json();
      if (data.ok && data.orders) {
          setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleVerifyPayment = async (orderId: string) => {
      if (!window.confirm(`Konfirmasi pembayaran order ${orderId}?`)) return;
      try {
          const adminToken = localStorage.getItem('impura_admin_token') || '';
          const res = await fetch(`/api/admin/verify/${orderId}`, {
              method: 'POST',
              headers: { 'x-admin-token': adminToken }
          });
          const data = await res.json();
          if (data.ok) {
              fetchOrders();
              alert(data.message || 'Pembayaran berhasil diverifikasi.');
          } else {
              alert(data.error || 'Server error');
          }
      } catch (err) {
          alert('Network Error');
      }
  };

  const handleCancelOrder = async (orderId: string) => {
      if (!window.confirm(`Batalkan order ${orderId}?`)) return;
      try {
          const adminToken = localStorage.getItem('impura_admin_token') || '';
          const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
              method: 'POST',
              headers: { 'x-admin-token': adminToken }
          });
          const data = await res.json();
          if (data.ok) {
              fetchOrders();
          } else {
              alert(data.error || 'Gagal cancel order');
          }
      } catch (err) {
          alert('Network Error');
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
    <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0a0a] border border-neutral-850 p-6 rounded-2xl">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
                <div className="p-2 bg-[#ff1b2d]/10 rounded-lg"><ShoppingCart className="w-6 h-6 text-[#ff1b2d]" /></div>
                Pesanan & Vouchers
            </h2>
            <div className="flex gap-2">
                <button 
                  onClick={() => setPath('/admin/orders/vouchers')}
                  className="px-4 py-2 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                >
                    <PlusCircle className="w-4 h-4" /> Masukkan Stok
                </button>
                <button 
                  onClick={fetchOrders}
                  className="p-2 border border-neutral-800 text-white rounded-xl hover:bg-neutral-800 transition-colors"
                  aria-label="Refresh orders"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="bg-[#111] border border-neutral-850 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-[#0a0a0a] border-b border-neutral-800 text-xs uppercase font-mono tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Order ID & Waktu</th>
                            <th className="px-6 py-4">Produk</th>
                            <th className="px-6 py-4">Total App (Rp)</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-500 font-mono">Tidak ada data order.</td>
                            </tr>
                        ) : (
                            orders.map(o => (
                                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-mono font-bold text-white mb-1">{o.id}</div>
                                        <div className="text-[10px] text-slate-500">{new Date(o.created_at).toLocaleString('id-ID')}</div>
                                    </td>
                                    <td className="px-6 py-4 flex flex-col items-start gap-1">
                                        <div className="font-bold text-white capitalize">{o.product_id} (x{o.qty})</div>
                                        <div className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded text-emerald-400 font-mono">
                                            Rp {Number(o.unit_price || 0).toLocaleString('id-ID')}
                                        </div>
                                        {o.warranty_title && (
                                            <div className="text-[10px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-400 font-mono mt-1">
                                                Garansi: +Rp {Number(o.warranty_price || 0).toLocaleString('id-ID')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-[#ff1b2d]">
                                        Rp {Number(o.amount_idr).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4">
                                        {o.status === 'pending' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-yellow-500/20 text-yellow-500 uppercase">
                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" /> Pending
                                            </span>
                                        ) : o.status === 'completed' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-500 uppercase">
                                                <Check className="w-3 h-3" /> Sukses
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500/20 text-red-500 uppercase">
                                                <XSquare className="w-3 h-3" /> Terdaluarsa
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {o.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleVerifyPayment(o.id)}
                                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-[10px] uppercase transition-colors"
                                                >
                                                    Tandai Lunas
                                                </button>
                                                <button 
                                                    onClick={() => handleCancelOrder(o.id)}
                                                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold text-[10px] uppercase transition-colors"
                                                >
                                                    Batalkan
                                                </button>
                                            </div>
                                        )}
                                        {o.status === 'completed' && o.voucher_code && (
                                            <div className="text-[10px] font-mono bg-neutral-900 border border-neutral-800 rounded p-2 text-slate-400 break-all w-48 ml-auto">
                                                {o.voucher_code}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}
