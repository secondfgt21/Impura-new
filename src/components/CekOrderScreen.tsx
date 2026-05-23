import { useState, FormEvent } from 'react';
import { Search, AlertCircle, HelpCircle } from 'lucide-react';

interface CekOrderScreenProps {
  onSearch: (orderId: string) => void;
}

export default function CekOrderScreen({ onSearch }: CekOrderScreenProps) {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [errorText, setErrorText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanId = orderIdInput.trim();

    if (!cleanId) {
      setErrorText('Masukkan Order ID pembelian Anda terlebih dahulu.');
      return;
    }

    // Format check (at least 6 characters to support both generic UUID and IMPURA format)
    if (cleanId.length < 6) {
      setErrorText('Masukkan Order ID yang valid (Format IMPURA atau UUID).');
      return;
    }

    setErrorText('');
    onSearch(cleanId);
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12">
      <div className="bg-[#111111]/45 border border-[#ff1b2d]/15 rounded-2xl p-5 sm:p-6 md:p-8 panel-glow">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#ff1b2d]/20 bg-[#ff1b2d]/10 text-[10px] font-bold tracking-wider text-[#ff3b3b] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff1b2d] shadow-[0_0_8px_rgba(255,27,45,0.7)] animate-pulse" />
          Lookup Order
        </div>

        <h2 className="font-display font-extrabold text-2xl text-white mt-4 glow-red">
          Cek Status Pesanan Anda
        </h2>
        
        <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
          Masukkan Order ID unik yang Anda dapatkan saat melakukan checkout produk di Impura. Sistem kami akan mencari riwayat pembayaran dan status pengiriman akun secara real-time.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="orderId" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Masukkan Order ID (IMPURA atau UUID)
            </label>
            <div className="relative">
              <input
                id="orderId"
                type="text"
                value={orderIdInput}
                onChange={(e) => {
                  setOrderIdInput(e.target.value);
                  if (e.target.value.trim()) setErrorText('');
                }}
                placeholder="Contoh: IMPURA483920174552"
                className="w-full bg-[#0a0a0a]/90 border border-neutral-850 focus:border-[#ff1b2d]/40 focus:bg-neutral-900 text-white rounded-xl py-3 px-4 text-xs font-sans tracking-wide select-all outline-none transition-all placeholder:text-slate-600 uppercase"
              />
            </div>
            {errorText && (
              <p className="text-[#ff3b3b] text-xs mt-2 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorText}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 text-xs font-extrabold tracking-wide rounded-xl bg-gradient-to-r from-[#ff1b2d] to-[#b30018] text-white hover:opacity-90 shadow-lg shadow-[#ff1b2d]/20 transition-all uppercase font-sans flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Cek Status Order
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-neutral-850 text-[11px] text-slate-405 flex items-start gap-2.5 leading-relaxed">
          <HelpCircle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <span>
            <strong>Tip:</strong> Anda bisa menyalin Order ID langsung dari halaman checkout sebelumnya, atau menyalin dari rincian rincian transfer nominal unik. Jika lupa Order ID pesanan Anda, silakan chat admin langsung.
          </span>
        </div>

      </div>
    </div>
  );
}
