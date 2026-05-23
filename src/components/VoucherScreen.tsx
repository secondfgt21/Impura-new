import { useState, useEffect } from 'react';
import { Copy, Check, MessageSquare, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface VoucherScreenProps {
  orderId: string;
  setPath: (path: string) => void;
  whatsappUrl: string;
}

export default function VoucherScreen({ orderId, setPath, whatsappUrl }: VoucherScreenProps) {
  const [order, setOrder] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  // Fetch full verified details
  useEffect(() => {
    let active = true;
    const fetchVoucher = async () => {
      try {
        const res = await fetch(`/api/order/${orderId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Order tidak ditemukan');
        const data = await res.json();
        
        if (active && data && data.ok) {
          if (data.status !== 'paid') {
            throw new Error('Pesanan Anda belum terverifikasi pembayaran.');
          }
          if (localStorage.getItem('active_order_id') === orderId) {
            localStorage.removeItem('active_order_id');
          }
          setOrder(data.order);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setErrorText(err.message);
          setIsLoading(false);
        }
      }
    };

    fetchVoucher();
    return () => {
      active = false;
    };
  }, [orderId]);

  const copyCode = async () => {
    if (!order?.voucher_code) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(order.voucher_code);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-6 pt-16 text-center">
        <div className="inline-block w-8 h-8 rounded-full border-2 border-white/10 border-t-[#ff1b2d] animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-sans tracking-wide">Merilis detail akun premium Anda...</p>
      </div>
    );
  }

  if (errorText || !order) {
    return (
      <div className="max-w-xl mx-auto px-6 pt-16">
        <div className="bg-[#111111]/45 border border-[#ff1b2d]/15 p-6 rounded-2xl text-center panel-glow">
          <ShieldCheck className="w-8 h-8 text-[#ff3b3b] mx-auto mb-3" />
          <h3 className="font-display font-bold text-white text-base">Pembayaran Belum Diverifikasi</h3>
          <p className="text-xs text-slate-400 mt-1">{errorText || 'Pesanan Anda masih tertunda.'}</p>
          <div className="mt-5 flex gap-2">
            <button 
              onClick={() => setPath(`/status/${orderId}`)} 
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-neutral-900 border border-neutral-800 text-slate-350 hover:bg-neutral-850 hover:text-white transition-colors"
            >
              Kembali ke Menu Status
            </button>
            <button 
              onClick={() => setPath('/')} 
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#ff1b2d] to-[#b30018] text-white hover:opacity-90 shadow-[0_0_15px_rgba(255,27,45,0.3)] transition-all"
            >
              Beranda Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayProductName = order.product_name + (order.warranty_label ? ` - ${order.warranty_label}` : '');

  const defaultNote = order.product_note || "Ikuti panduan umum penggunaan akun dari admin.";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6">
      <div className="bg-[#111111]/45 border border-[#ff1b2d]/15 rounded-2xl p-5 sm:p-6 panel-glow">
        
        {/* Verification Success Header */}
        <div className="mb-5 text-center">
          <span className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-bounce">
            ✓
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold font-sans tracking-wider uppercase">
            PEMBAYARAN TERVALIDASI &bull; PAID OK
          </span>
          <h2 className="font-display font-extrabold text-xl text-white mt-3 leading-tight">
            Akses Akun Premium Berhasil Dikirim
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Produk: <span className="text-white font-medium">{displayProductName}</span>
          </p>
        </div>

        {/* Voucher Credentials Block */}
        <div className="relative mt-6">
          <div className="absolute right-3 top-3 z-10">
            <button
              onClick={copyCode}
              className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-[#0a0a0a]/90 hover:bg-[#161616] text-xs font-semibold text-white/85 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Akun Tersalin' : 'Salin Akun'}
            </button>
          </div>

          <div className="w-full bg-[#0a0a0a] border border-neutral-850 p-5 pt-14 rounded-2xl font-mono text-xs text-[#ffb3b3]/90 leading-relaxed overflow-x-auto whitespace-pre-wrap select-all select-none">
            {order.voucher_code || 'Detail voucher tidak dapat dimuat.'}
          </div>
        </div>

        {/* Action guidelines */}
        <div className="mt-6 p-4 sm:p-5 rounded-xl bg-[#0a0a0a]/80 border border-neutral-850 text-xs">
          <h4 className="font-display font-bold text-white mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-[#ff3b3b]">
            <ShieldCheck className="w-4 h-4 text-[#ff1b2d]" />
            Panduan Penggunaan Akun
          </h4>
          <p className="text-slate-350 leading-relaxed text-[11px]">
            {defaultNote} <br />
            Silakan login menggunakan kredensial di atas. Untuk keamanan ekstra, segera tautkan telepon atau email pemulihan pribadi Anda yang aktif demi kelancaran garansi.
          </p>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-[#ff1b2d]/5 border border-[#ff1b2d]/15 text-xs italic text-slate-350 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-[#ff3b3b] shrink-0 mt-0.5" />
          <span className="text-[11px] leading-relaxed">
            Jika ada kesulitan login, password salah, atau butuh bantuan garansi, harap segera hubungi admin melalui ikon chat WhatsApp di bawah dengan menyertakan tangkapan layar (screenshot) kendala.
          </span>
        </div>

        {/* Footer Navigation Elements */}
        <div className="mt-6 pt-5 border-t border-neutral-850 flex flex-col gap-2">
          <button
            onClick={() => setPath('/')}
            className="w-full py-3.5 text-xs font-extrabold tracking-wide uppercase rounded-xl bg-gradient-to-r from-[#ff1b2d] to-[#b30018] text-white hover:opacity-90 hover:scale-[1.01] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,27,45,0.25)] transition-all cursor-pointer"
          >
            Lanjut Berbelanja
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-neutral-900 border border-neutral-800 text-slate-200 text-center hover:bg-neutral-850 hover:text-white transition-all cursor-pointer"
          >
            💬 Hubungi CS Admin (WhatsApp)
          </a>
        </div>

      </div>
    </div>
  );
}
