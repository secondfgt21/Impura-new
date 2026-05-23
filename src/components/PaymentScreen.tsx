import { useState, useEffect } from 'react';
import { Copy, Check, Info, Bot, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';

interface PaymentScreenProps {
  orderId: string;
  setPath: (path: string) => void;
  onPaidRedirect: (orderId: string) => void;
  whatsappUrl: string;
}

export default function PaymentScreen({ orderId, setPath, onPaidRedirect, whatsappUrl }: PaymentScreenProps) {
  const [order, setOrder] = useState<any>(null);
  const [ttl, setTtl] = useState(0);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  // Fetch Order initially and poll every 2 seconds matching the original Python style
  useEffect(() => {
    let active = true;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/order/${orderId}`, { cache: 'no-store' });
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Order tidak ditemukan');
          } else {
            throw new Error('Gagal mengambil rincian pesanan');
          }
        }
        const data = await res.json();
        if (active && data && data.ok) {
          setOrder(data.order);
          setTtl(data.ttl_sec || 0);
          setIsLoading(false);

          // If paid, route to voucher immediately
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

    // 1. Polling for UI updates (like TTL sync)
    const interval = setInterval(() => {
      if (!isLoading && order?.status === 'cancelled') {
        clearInterval(interval);
        return;
      }
      fetchOrder();
    }, 5000); // reduced polling frequency now that we have realtime

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
      // Ignore errors, will rely on polling fallback
      eventSource.close();
    };

    return () => {
      active = false;
      clearInterval(interval);
      eventSource.close();
    };
  }, [orderId, onPaidRedirect, isLoading, order?.status]);

  // Countdown timer decrease
  useEffect(() => {
    if (ttl <= 0) return;
    const interval = setInterval(() => {
      setTtl(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [ttl]);

  const copyToClipboard = async (text: string, type: 'amount' | 'orderId') => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }

      if (type === 'amount') {
        setCopiedAmount(true);
        setTimeout(() => setCopiedAmount(false), 1500);
      } else {
        setCopiedOrderId(true);
        setTimeout(() => setCopiedOrderId(false), 1500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatWib = (dateStr: string) => {
    try {
      const dt = new Date(dateStr);
      return dt.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";
    } catch {
      return "-";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-6 pt-16 text-center">
        <div className="inline-block w-8 h-8 rounded-full border-2 border-white/10 border-t-[#ff1b2d] animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-sans text-center tracking-wide">Memuat tagihan QRIS Anda...</p>
      </div>
    );
  }

  if (errorText || !order) {
    return (
      <div className="max-w-xl mx-auto px-6 pt-16">
        <div className="bg-[#111111]/45 border border-[#ff1b2d]/15 p-6 rounded-2xl text-center panel-glow">
          <AlertTriangle className="w-8 h-8 text-[#ff3b3b] mx-auto mb-3" />
          <h3 className="font-display font-bold text-white text-base">Terjadi Kendala</h3>
          <p className="text-xs text-slate-400 mt-1">{errorText || 'Rincian pesanan tidak dapat dimuat.'}</p>
          <button 
            onClick={() => setPath('/')} 
            className="mt-5 inline-flex items-center gap-1 text-xs text-[#ff3b3b] font-semibold hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Beranda Store
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const displayProductName = order.product_name + (order.warranty_label ? ` - ${order.warranty_label}` : '');

  if (isCancelled) {
    return (
      <div className="max-w-xl mx-auto px-6 pt-16">
        <div className="bg-[#111111]/45 border border-[#ff1b2d]/15 p-6 md:p-8 rounded-2xl text-center panel-glow">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h3 className="font-display font-extrabold text-white text-xl glow-red">Pemesanan Telah Expired</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Order ID: <code className="text-[11px] font-mono text-slate-350 bg-slate-950 px-1.5 py-0.5 rounded">{orderId}</code> ini telah hangus karena melewati batas waktu pembayaran 5 menit. Silakan lakukan order ulang.
          </p>
          <button
            onClick={() => setPath('/')}
            className="mt-6 px-6 py-3 rounded-xl text-xs font-bold uppercase bg-gradient-to-r from-[#ff1b2d] to-[#b30018] text-white hover:opacity-90 shadow-[0_0_15px_rgba(255,27,45,0.3)] transition-all"
          >
            Buat Order Baru
          </button>
        </div>
      </div>
    );
  }

  // Split digits to highlight the exact unique fee cents
  const totalStr = String(order.amount_idr);
  const basePart = totalStr.slice(0, -2);
  const centsPart = totalStr.slice(-2);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6">
      <div className="bg-[#111111]/45 border border-[#ff1b2d]/15 rounded-2xl p-5 sm:p-6 panel-glow">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff1b2d] animate-pulse shadow-[0_0_8px_rgba(255,27,45,0.7)]" />
            <span className="font-display text-[10px] font-bold tracking-wider text-[#ff3b3b] uppercase">
              PEMBAYARAN DIVERIFIKASI OTOMATIS
            </span>
          </div>
          {ttl > 0 && (
            <span className="bg-[#ff1b2d]/10 border border-[#ff1b2d]/20 text-[#ff3b3b] text-[10px] font-sans tracking-wide font-bold px-2 py-1 rounded-lg">
              SISA WAKTU: {formatCountdown(ttl)}
            </span>
          )}
        </div>

        {/* Product label */}
        <h2 className="font-display font-extrabold text-lg md:text-xl text-white">
          {displayProductName}
        </h2>
        <div className="flex wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
          <span>Jumlah Pemesanan: <b className="text-white font-semibold">{order.qty}x</b></span>
          <span>&middot;</span>
          <span>Dibuat: <b className="text-white">{formatWib(order.created_at)}</b></span>
        </div>

        {/* Price Box */}
        <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-[#0a0a0a]/80 border border-neutral-850 text-center relative overflow-hidden">
          <p className="text-xs text-slate-400">Total Nominal Transfer Unik</p>
          <div className="text-3xl sm:text-4xl md:text-5xl font-black font-sans tracking-tight text-white mt-1.5 leading-none select-all relative z-10 font-display">
            Rp {Number(basePart).toLocaleString('id-ID')}
            <span className="text-[#ff1b2d] bg-[#ff1b2d]/10 border border-[#ff1b2d]/20 px-1 rounded-md ml-1 inline-block animate-pulse">
              {centsPart}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5">
            <button
              onClick={() => copyToClipboard(String(order.amount_idr), 'amount')}
              className="px-4 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-[11px] text-slate-300 hover:text-white hover:border-[#ff1b2d]/50 font-semibold transition-all flex items-center gap-1 cursor-pointer"
            >
              {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAmount ? 'Berhasil Tersalin' : 'Salin Nominal Persis'}
            </button>
          </div>
        </div>

        {/* Warning card */}
        <div className="mt-5 p-4 rounded-xl bg-[#ff1b2d]/5 border border-[#ff1b2d]/20 text-xs text-slate-350 leading-relaxed flex items-start gap-2.5">
          <Info className="w-5 h-5 text-[#ff3b3b] shrink-0 mt-0.5" />
          <span>
            <strong>PENTING:</strong> Wajib mentransfer nominal unik di atas secara <strong>persis</strong> (Rp {Number(order.amount_idr).toLocaleString('id-ID')}). Jangan dibulatkan, melebihkan, atau menguranginya. Sistem QRIS otomatis kami mendeteksi transaksi melalui pencocokan tagihan nominal kode ekor tersebut!
          </span>
        </div>

        {/* QRIS Visual display */}
        <div className="mt-6 flex flex-col items-center">
          <p className="text-[11px] text-slate-400 uppercase tracking-widest font-display font-medium text-center mb-3">
            SCAN BARCODE QRIS DI BAWAH INI
          </p>
          <div className="bg-white p-3 rounded-xl max-w-[280px] w-full shadow-[0_0_20px_rgba(255,27,45,0.08)] border border-neutral-800">
            <img 
              src="https://i.ibb.co.com/hJ99X7Bb/IMG-20260317-064144.png" 
              alt="QRIS Merchant Store" 
              className="w-full h-auto rounded-lg object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-[10px] text-slate-500 text-center mt-2.5">Dukung GoPay, DANA, OVO, ShopeePay, LinkAja & m-Banking</span>
        </div>

        {/* Order ID Copier */}
        <div className="mt-6 p-4 rounded-2xl bg-[#0a0a0a]/90 border border-neutral-850 flex items-center justify-between gap-4 font-sans tracking-wide">
          <div className="min-w-0">
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Order ID (Simpan Untuk Cek Status)</span>
            <span className="block text-xs font-bold text-slate-200 overflow-hidden text-ellipsis select-all">{orderId}</span>
          </div>
          <button
            onClick={() => copyToClipboard(orderId, 'orderId')}
            className="p-2.5 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-slate-400 hover:text-white hover:border-[#ff1b2d]/50 shrink-0 transition-colors cursor-pointer"
          >
            {copiedOrderId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Polling / Redirect actions */}
        <div className="mt-6 pt-5 border-t border-neutral-850 flex flex-col gap-2">
          
          <div className="p-3 bg-[#0a0a0a] border border-neutral-850 rounded-xl flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-neutral-800 border-t-[#ff3b3b] animate-spin shrink-0" />
            Sistem otomatis memindai mutasi masuk...
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-2">
            <button
              onClick={() => setPath('/cek-order')}
              className="py-3 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-neutral-800 text-slate-300 hover:bg-neutral-850 hover:text-white transition-all"
            >
              Cek Status Manual
            </button>
            <a
              href={`${whatsappUrl}?text=Halo%20Admin%2C%20saya%20sudah%20transfer%20untuk%20Order%20ID%20${orderId}.%20Tolong%20cek.`}
              target="_blank"
              rel="noreferrer"
              className="py-3 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-gradient-to-r from-neutral-800 to-neutral-900 border border-neutral-800 text-white text-center hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
            >
              💬 Chat Admin CS
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
