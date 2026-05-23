import { ShieldCheck, Flame, RefreshCw, Layers } from 'lucide-react';

interface FooterProps {
  setPath: (path: string) => void;
  whatsappUrl: string;
}

export default function Footer({ setPath, whatsappUrl }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-24 border-t border-white/5 bg-[#040406]/80 backdrop-blur-md pt-12 pb-24 px-6 md:pb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-white/5">
        
        {/* Brand visual column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-800 animate-pulse shadow-[0_0_8px_#ff2a2a]" />
            <h3 className="font-display font-bold text-lg text-white">Impura.id</h3>
          </div>
          <p className="text-xs text-white/50 leading-relaxed max-w-sm">
            Platform checkout otomatis untuk akun AI premium (Gemini AI Pro, ChatGPT Plus) termurah di Indonesia. Bayar QRIS instan, akun teriklan otomatis tanpa perlu tunggu lama.
          </p>
        </div>

        {/* Links Column */}
        <div className="flex flex-col gap-3">
          <h4 className="font-display text-white text-xs font-semibold tracking-widest uppercase">
            Menu Store
          </h4>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <button onClick={() => setPath('/')} className="text-white/60 hover:text-white transition-colors">
              Beranda
            </button>
            <button onClick={() => setPath('/about')} className="text-white/60 hover:text-white transition-colors">
              Tentang Kami
            </button>
            <button onClick={() => setPath('/faq')} className="text-white/60 hover:text-white transition-colors">
              FAQ
            </button>
            <button onClick={() => setPath('/cek-order')} className="text-white/60 hover:text-white transition-colors">
              Cek Order
            </button>
            <button onClick={() => setPath('/admin')} className="text-white/60 hover:text-white transition-colors">
              Admin Panel
            </button>
          </nav>
        </div>

        {/* Support Column */}
        <div className="flex flex-col gap-3">
          <h4 className="font-display text-white text-xs font-semibold tracking-widest uppercase">
            Bantuan & Garansi
          </h4>
          <p className="text-xs text-white/50 max-w-xs leading-relaxed">
            Butuh klaim garansi atau mengalami kesulitan transaksi? Segera hubungi customer service kami lewat WhatsApp resmi:
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-red-500 hover:text-red-400 font-semibold flex items-center gap-1 mt-1 transition-colors"
          >
            Hubungi CS WhatsApp &rarr;
          </a>
        </div>

      </div>

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
        <div>
          &copy; {currentYear} Impura. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            100% Private Account
          </span>
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            Instant QRIS Checkout
          </span>
        </div>
      </div>
    </footer>
  );
}
