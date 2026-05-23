import { useState, useEffect } from 'react';
import { Bot, Zap, Clock, RefreshCw, Copy, Check, ShieldCheck, AlertTriangle, ArrowLeft } from 'lucide-react';

interface StatusScreenProps {
  orderId: string;
  setPath: (path: string) => void;
  onPaidRedirect: (orderId: string) => void;
  whatsappUrl: string;
}

export default function StatusScreen({ orderId, setPath, onPaidRedirect, whatsappUrl }: StatusScreenProps) {
  const [order, setOrder] = useState<any>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [tickTime, setTickTime] = useState(2); // Refreshes countdown ticker

  useEffect(() => {
    let active = true;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/order/${orderId}`, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Order tidak ditemukan');
        }
        const data = await res.json();
        if (active && data && data.ok) {
          setOrder(data.order);
          setIsLoading(false);

          if (data.status === 'paid') {
            if (localStorage.getItem('active_order_id') === orderId) {
              localStorage.removeItem('active_order_id');
            }
            onPaidRedirect(orderId);
          } else if (data.status === 'cancelled') {
            if (localStorage.getItem('active_order_id') === orderId) {
              localStorage.removeItem('active_order_id');
            }
          }
        }
      } catch (err: any) {
        if (active) {
          setErrorText(err.message);
          setIsLoading(false);
        }
      }
    };

    fetchOrder();

    // 1. Setup polling (reduced frequency for UI)
    const interval = setInterval(() => {
      setTickTime(prev => {
        if (prev <= 1) {
          fetchOrder();
          return 50; // Every ~5 seconds
        }
        return prev - 1;
      });
    }, 100);

    // 2. Realtime SSE connection for instant redirect
    const eventSource = new EventSource(`/api/order/${orderId}/stream`);
    eventSource.onmessage = (event) => {
      if (!active) return;
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'paid') {
          if (localStorage.getItem('active_order_id') === orderId) {
            localStorage.removeItem('active_order_id');
          }
          onPaidRedirect(orderId);
          eventSource.close();
        } else if (data.status === 'cancelled') {
          if (localStorage.getItem('active_order_id') === orderId) {
            localStorage.removeItem('active_order_id');
          }
          setOrder((prev: any) => prev ? { ...prev, status: 'cancelled' } : prev);
          eventSource.close();
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };
    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      active = false;
      clearInterval(interval);
      eventSource.close();
    };
  }, [orderId, onPaidRedirect]);

  const copyOrderId = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(orderId);
      }
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-6 pt-16 text-center">
        <div className="inline-block w-8 h-8 rounded-full border-2 border-white/10 border-t-red-500 animate-spin mb-4" />
        <p className="text-xs text-white/50 font-mono">Memuat status pesanan...</p>
      </div>
    );
  }

  if (errorText || !order) {
    return (
      <div className="max-w-xl mx-auto px-6 pt-16">
        <div className="bg-[#0a0a0d]/82 border border-red-500/25 p-6 rounded-3xl text-center panel-glow">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h3 className="font-display font-bold text-white text-base">Order ID Tidak Ditemukan</h3>
          <p className="text-xs text-white/60 mt-1">Pastikan Order ID yang Anda masukkan tepat.</p>
          <button 
            onClick={() => setPath('/cek-order')} 
            className="mt-5 inline-flex items-center gap-1 text-xs text-red-400 font-semibold hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Lookup form
          </button>
        </div>
      </div>
    );
  }

  const isPending = order.status === 'pending';
  const isPaid = order.status === 'paid';
  const isCancelled = order.status === 'cancelled';

  const productLabel = order.product_name + (order.warranty_label ? ` - ${order.warranty_label}` : '');

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6">
      <div className="bg-[#111111]/45 border border-[#ff1b2d]/15 rounded-2xl p-5 sm:p-6 panel-glow">
        
        <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff1b2d] animate-pulse shadow-[0_0_8px_rgba(255,27,45,0.7)]" />
            <span className="font-display text-[10px] font-bold tracking-wider text-[#ff3b3b] uppercase">
              MONITOR STATUS PESANAN
            </span>
          </div>
          <span className="text-[10px] text-slate-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded font-mono font-semibold">
            Auto Refresh Ticker
          </span>
        </div>

        <h3 className="font-display font-extrabold text-white text-lg">{productLabel}</h3>
        
        <div className="mt-5 space-y-3">
          <div className="flex justify-between items-center bg-[#0a0a0a] border border-neutral-850 p-4 rounded-xl text-xs text-slate-350">
            <span>Order ID</span>
            <div className="flex items-center gap-2 font-mono text-slate-200">
              <span className="select-all overflow-hidden text-ellipsis max-w-[200px] block font-bold">{orderId}</span>
              <button onClick={copyOrderId} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center bg-[#0a0a0a] border border-neutral-850 p-4 rounded-xl text-xs text-slate-350">
            <span>Kuantitas</span>
            <strong className="text-white font-bold font-sans tracking-wide">{order.qty} Akun</strong>
          </div>

          <div className="flex justify-between items-center bg-[#0a0a0a] border border-neutral-850 p-4 rounded-xl text-xs text-slate-350">
            <span>Jumlah Tagihan</span>
            <strong className="text-white font-black text-sm font-sans tracking-wide text-[#ff3b3b]">Rp {Number(order.amount_idr).toLocaleString('id-ID')}</strong>
          </div>

          <div className="flex justify-between items-center bg-[#0a0a0a] border border-neutral-850 p-4 rounded-xl text-xs text-slate-350">
            <span>Status Pembayaran</span>
            <span className={`px-2.5 py-1 text-[10px] rounded-lg tracking-widest font-bold font-sans uppercase ${
              isPaid ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
              isCancelled ? 'bg-[#ff1b2d]/10 border border-[#ff1b2d]/20 text-[#ff3b3b]' :
              'bg-orange-500/10 border border-orange-500/20 text-orange-400'
            }`}>
              {order.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Dynamic status helper layout */}
        <div className="mt-6 border-t border-neutral-850 pt-5 text-center">
          {isPending && (
            <div className="flex flex-col items-center gap-2">
              <span className="inline-block w-6 h-6 rounded-full border-2 border-neutral-800 border-t-[#ff3b3b] animate-spin" />
              <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                Menunggu transfer dana masuk via QRIS... <br />
                Jika Anda sudah transfer, silakan tetap berada di halaman ini. Halaman akan langsung dialihkan ke detail akun setelah terverifikasi.
              </p>
              <button
                onClick={() => setPath(`/pay/${orderId}`)}
                className="mt-4 px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-[#ff1b2d] to-[#b30018] text-white hover:opacity-90 shadow-[0_0_15px_rgba(255,27,45,0.25)] transition-all cursor-pointer"
              >
                Buka Barcode QRIS
              </button>
            </div>
          )}

          {isCancelled && (
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-[#ff3b3b]" />
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                Pemesanan ini telah hancur karena kadaluwarsa batas 5 menit. Anda harus membuat order persediaan baru.
              </p>
              <button
                onClick={() => setPath('/')}
                className="mt-4 px-6 py-2.5 text-xs font-bold tracking-wider uppercase rounded-xl bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-850 transition-all cursor-pointer"
              >
                Buat Order Baru
              </button>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setPath('/')}
              className="flex-1 py-3 text-[11px] font-bold tracking-wider uppercase rounded-xl border border-neutral-800 text-slate-300 hover:bg-[#0a0a0a] hover:text-white transition-all cursor-pointer"
            >
              Beranda
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 text-[11px] font-bold tracking-wider uppercase rounded-xl bg-neutral-900 border border-neutral-800 text-slate-200 text-center hover:bg-neutral-850 hover:text-white transition-all cursor-pointer flex justify-center items-center gap-1.5"
            >
              💬 Chat Admin CS
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
