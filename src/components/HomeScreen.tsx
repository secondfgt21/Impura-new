import { useState, useEffect } from 'react';
import { Bot, Zap, ShieldCheck, Flame, Layers, Clock, MessageSquare, AlertTriangle, HelpCircle, CreditCard, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSupabaseHealth } from '../lib/supabase-context';

interface Product {
  id: string;
  name: string;
  price: number;
  features: string[];
  note: string;
}

interface HomeScreenProps {
  setPath: (path: string) => void;
  onCheckout: (productId: string, qty: number, warranty?: string) => void;
}

export default function HomeScreen({ setPath, onCheckout }: HomeScreenProps) {
  const { isDbAvailable } = useSupabaseHealth();
  const [stock, setStock] = useState<Record<string, number>>({ gemini: 0, chatgpt: 0 });
  const [sold, setSold] = useState<Record<string, number>>({ gemini: 0, chatgpt: 0 });
  const [totalSold, setTotalSold] = useState(142); // Default starting sold count
  const [visitorCount, setVisitorCount] = useState(128); // Dynamic active visitors

  // Buy State quantities
  const [quantities, setQuantities] = useState<Record<string, number>>({ gemini: 1, chatgpt: 1 });

  // Warranty Modal state
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [selectedWarrantyQty, setSelectedWarrantyQty] = useState(1);
  const [activeWarranties, setActiveWarranties] = useState<any[]>([]);
  const [activeProductId, setActiveProductId] = useState<string>('');
  const [selectedWarranty, setSelectedWarranty] = useState<string | null>(null);

  const [productsData, setProductsData] = useState<any[]>([]);

  // Load stats and active visitors
  useEffect(() => {
    let active = true;

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/store-data', { cache: 'no-store' });
        const data = await res.json();
        if (active && data && data.ok) {
          setStock(data.stock);
          setSold(data.sold);
          setTotalSold(data.total_sold);
        }
      } catch (e) {
        console.error('Failed to load stats:', e);
      }
    };

    const fetchVisitors = async () => {
      try {
        const res = await fetch('/api/active-sessions', { cache: 'no-store' });
        const data = await res.json();
        if (active && data && data.ok) {
          setVisitorCount(data.count);
        }
      } catch (e) {
        console.error('Failed to load visitors:', e);
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        const data = await res.json();
        if (active && data && data.ok) {
          setProductsData(data.products || []);
        }
      } catch (e) {
        console.error('Failed to load products:', e);
      }
    };

    fetchStats();
    fetchVisitors();
    fetchProducts();

    const channel = supabase.channel('public:vouchers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, () => {
        if (active) fetchStats();
      })
      .subscribe();

    // Visitors update every 12 seconds
    const visitorInterval = setInterval(fetchVisitors, 12000);

    return () => {
      active = false;
      supabase.removeChannel(channel);
      clearInterval(visitorInterval);
    };
  }, []);

  const handleQtyChange = (productId: string, delta: number) => {
    const freshStock = stock[productId] || 0;
    if (freshStock <= 0) return;

    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(current + delta, freshStock));
      return { ...prev, [productId]: next };
    });
  };

  const initBuyFlow = async (productId: string) => {
    const qty = quantities[productId] || 1;
    
    // Fetch warranties dynamically
    try {
      const res = await fetch(`/api/products/${productId}/warranties`);
      const data = await res.json();
      if (data && data.ok && data.warranties.length > 0) {
        setActiveProductId(productId);
        setSelectedWarrantyQty(qty);
        setActiveWarranties(data.warranties);
        
        const defaultW = data.warranties.find((w: any) => w.default_selected) || data.warranties[0];
        setSelectedWarranty(defaultW.id);
        
        setWarrantyModalOpen(true);
      } else {
        // No warranties, just checkout
        onCheckout(productId, qty);
      }
    } catch (err) {
      console.error(err);
      onCheckout(productId, qty);
    }
  };

  const confirmWarrantyBuy = (warrantyId: string) => {
    setWarrantyModalOpen(false);
    onCheckout(activeProductId, selectedWarrantyQty, warrantyId);
  };

  const STATIC_PRODUCTS_DATA = [
    {
      id: 'gemini',
      name: "Gemini AI Pro 4 Bulan",
      price: 20000,
      badge: "🔥 TERLARIS",
      note: "Gunakan email atau nomor asli untuk pemulihan. Jangan gunakan temp mail atau temp number untuk recovery.",
      features: [
        "Akses AntiGravity",
        "Google Drive 2TB",
        "Flow + 1.000 credit",
        "Pilihan garansi saat checkout",
      ],
      icon: <Bot className="w-6 h-6 text-[#ff3b3b]" />
    },
    {
      id: 'chatgpt',
      name: "ChatGPT Plus 1 Bulan",
      price: 20000,
      badge: "● LIVE STOCK",
      note: "Login ke gmail dulu baru login chatgpt lewat direct google, dan nanti bikin password sendiri aja di chatgpt nya",
      features: [
        "Akses model ChatGPT terbaru",
        "Akses Codex",
        "Cocok untuk riset & coding",
        "Garansi 5 hari",
      ],
      icon: <Zap className="w-6 h-6" style={{ color: '#ff1b2d' }} />
    }
  ];

  // Merge static UI config with dynamic database product values
  const FINAL_PRODUCTS = productsData.length > 0 
    ? productsData.map(dbProd => {
        const staticProd = STATIC_PRODUCTS_DATA.find(s => s.id === dbProd.id);
        return {
          id: dbProd.id,
          name: dbProd.name,
          price: Number(dbProd.price_idr || dbProd.price) || staticProd?.price || 0,
          note: dbProd.note || staticProd?.note || '',
          badge: staticProd?.badge || "● TERSEDIA",
          features: dbProd.features || staticProd?.features || [],
          icon: staticProd?.icon || <Zap className="w-6 h-6 text-[#ff3b3b]" />
        };
      })
    : STATIC_PRODUCTS_DATA;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-6">
      
      {/* Hero Header Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch mb-8 sm:mb-12">
        
        {/* Left Column: Greeting Banner */}
        <div className="lg:col-span-7 bg-[#111111]/45 border border-[#ff1b2d]/15 rounded-2xl p-5 sm:p-6 md:p-8 flex flex-col justify-between gap-6 sm:gap-8 panel-glow">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#ff1b2d]/30 bg-[#ff1b2d]/10 text-[10px] font-bold tracking-wider text-[#ff3b3b] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff1b2d] animate-pulse shadow-[0_0_8px_rgba(255,27,45,0.7)]" />
              Harga Akun Termurah Se-Indonesia
            </div>

            <h2 className="font-display text-2xl sm:text-3.5xl md:text-5xl lg:text-[48px] font-extrabold tracking-tight leading-[1.1] text-white mt-4 sm:mt-6">
              Beli Akses AI <br />
              <span className="bg-gradient-to-r from-white via-white to-[#ff1b2d] bg-clip-text text-transparent filter drop-shadow-[0_0_15px_rgba(255,27,45,0.15)] glow-red">
                Premium Instan
              </span>
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-neutral-400/80 leading-relaxed mt-3 sm:mt-4 max-w-xl">
              Pilih produk &rarr; bayar QRIS &rarr; tunggu verifikasi &rarr; otomatis dikirimkan ke halaman akun email. Kami menyediakan akun AI premium premium berkualitas tinggi seperti <span className="text-white font-medium">Gemini AI Pro</span> dan <span className="text-white font-medium">ChatGPT Plus</span>.
            </p>

            <div className="flex flex-wrap gap-2.5 mt-5 sm:mt-6">
              <a 
                href="#produk-tersedia" 
                className="px-5 py-3 rounded-xl text-xs font-extrabold tracking-wider bg-gradient-to-r from-[#ff1b2d] to-[#b30018] text-white hover:opacity-90 hover:scale-[1.02] shadow-[0_0_15px_rgba(255,27,45,0.3)] transition-all uppercase glitch-hover"
                data-glitch="Lihat Produk"
              >
                Lihat Produk
              </a>
              <button 
                onClick={() => setPath('/faq')}
                className="px-5 py-3 rounded-xl text-xs font-extrabold tracking-wider bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all uppercase"
              >
                Lihat FAQ
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-neutral-800/80">
            <div className="bg-[#0f0f0f]/55 border border-neutral-850 hover:border-[#ff1b2d]/30 hover:shadow-[0_0_12px_rgba(255,27,45,0.08)] transition-all duration-300 p-3 rounded-xl flex flex-col justify-between h-20 sm:h-24 group">
              <div className="flex items-center justify-between">
                <b className="text-white font-display text-xs sm:text-sm font-semibold tracking-tight">QRIS Auto</b>
                <CreditCard className="w-3.5 h-3.5 text-[#ff3b3b] opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              <span className="block text-[10px] text-neutral-400 leading-snug">Pembayaran e-wallet & bank instan</span>
            </div>
            
            <div className="bg-[#0f0f0f]/55 border border-neutral-850 hover:border-[#ff1b2d]/30 hover:shadow-[0_0_12px_rgba(255,27,45,0.08)] transition-all duration-300 p-3 rounded-xl flex flex-col justify-between h-20 sm:h-24 group">
              <div className="flex items-center justify-between">
                <b className="text-white font-display text-xs sm:text-sm font-semibold tracking-tight">Live Stock</b>
                <Layers className="w-3.5 h-3.5 text-[#ff3b3b] opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              <span className="block text-[10px] text-neutral-400 leading-snug">Sisa stok sinkron langsung</span>
            </div>

            <div className="bg-[#0f0f0f]/55 border border-neutral-850 hover:border-[#ff1b2d]/30 hover:shadow-[0_0_12px_rgba(255,27,45,0.08)] transition-all duration-300 p-3 rounded-xl flex flex-col justify-between h-20 sm:h-24 group">
              <div className="flex items-center justify-between">
                <b className="text-white font-display text-xs sm:text-sm font-semibold tracking-tight">Private ID</b>
                <ShieldCheck className="w-3.5 h-3.5 text-[#ff3b3b] opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              <span className="block text-[10px] text-neutral-400 leading-snug">Personal login, no sharing profile</span>
            </div>

            <div className="bg-[#0f0f0f]/55 border border-neutral-850/80 hover:border-[#ff1b2d]/35 hover:shadow-[0_0_12px_rgba(255,27,45,0.1)] transition-all duration-300 p-3 rounded-xl flex flex-col justify-between h-20 sm:h-24 border-dashed group">
              <div className="flex items-center justify-between">
                <b className="text-[#ff3b3b] font-display text-xs sm:text-sm font-bold flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff1b2d] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ff1b2d]"></span>
                  </span>
                  {visitorCount}
                </b>
                <Users className="w-3.5 h-3.5 text-[#ff3b3b] opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              <span className="block text-[10px] text-neutral-400 leading-snug">Pengguna sedang online</span>
            </div>
          </div>
        </div>

        {/* Right Column: "How to Buy" steps */}
        <div className="lg:col-span-5 bg-[#111111]/45 border border-[#ff1b2d]/15 rounded-2xl p-5 sm:p-6 panel-glow flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-neutral-400" />
              <h3 className="font-display text-xs font-semibold text-neutral-400 tracking-wider uppercase">
                Metode Pembelian
              </h3>
            </div>
            <h4 className="font-display font-semibold text-white text-base sm:text-lg mb-5 sm:mb-6">
              3 Langkah Mudah Mendapatkan Voucher
            </h4>

            <div className="space-y-3.5 sm:space-y-4">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0a0a0a]/80 border border-[#ff1b2d]/15 hover:border-[#ff1b2d]/30 transition-colors duration-300">
                <div className="w-9 h-9 rounded-lg bg-[#ff1b2d]/10 border border-[#ff1b2d]/20 text-[#ff1b2d] font-display font-extrabold flex items-center justify-center shrink-0 text-sm">
                  1
                </div>
                <div>
                  <h5 className="font-display font-semibold text-white text-xs">Pilih Produk &amp; Atur Jumlah</h5>
                  <p className="text-[11px] text-neutral-400/90 mt-1 leading-relaxed">
                    Tentukan jumlah akun yang diinginkan pada kartu produk. Klik <span className="text-[#ff3b3b] font-semibold">Beli Sekarang</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0a0a0a]/80 border border-[#ff1b2d]/15 hover:border-[#ff1b2d]/30 transition-colors duration-300">
                <div className="w-9 h-9 rounded-lg bg-[#ff1b2d]/10 border border-[#ff1b2d]/20 text-[#ff1b2d] font-display font-extrabold flex items-center justify-center shrink-0 text-sm">
                  2
                </div>
                <div>
                  <h5 className="font-display font-semibold text-white text-xs">Transfer Sesuai Tiga Kode Unik</h5>
                  <p className="text-[11px] text-neutral-400/90 mt-1 leading-relaxed">
                    Sistem QRIS akan otomatis generate total nominal transfer dengan kode verifikasi unik. Jangan membulatkan angka transfer.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0a0a0a]/80 border border-[#ff1b2d]/15 hover:border-[#ff1b2d]/30 transition-colors duration-300">
                <div className="w-9 h-9 rounded-lg bg-[#ff1b2d]/10 border border-[#ff1b2d]/20 text-[#ff1b2d] font-display font-extrabold flex items-center justify-center shrink-0 text-sm">
                  3
                </div>
                <div>
                  <h5 className="font-display font-semibold text-white text-xs">Ambil Detail Akun</h5>
                  <p className="text-[11px] text-neutral-400/90 mt-1 leading-relaxed">
                    Setelah melakukan pembayaran, halaman akan otomatis dialihkan ke status detail akun tanpa konfirmasi admin manual!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-800/80 pt-4 mt-6 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Sistem Otomasi Order &bull; 100% Secure</span>
            <span className="text-[#ff3b3b] hover:underline cursor-pointer" onClick={() => setPath('/faq')}>FAQ lengkap &rarr;</span>
          </div>
        </div>

      </section>

      {/* Catalog Grid Header */}
      <section id="produk-tersedia" className="scroll-mt-24 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-neutral-800/80 pb-4">
          <div>
            <h3 className="font-display font-extrabold text-white text-xl md:text-2xl glow-red flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#ff1b2d]" />
              Katalog Produk AI Aktif
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Setiap pembelian diproses real-time dan dijamin mendapatkan akun private.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111111] border border-[#ff1b2d]/30 text-xs text-neutral-300 shrink-0 font-medium shadow-[0_0_10px_rgba(255,27,45,0.15)]">
            <Flame className="w-3.5 h-3.5 text-[#ff3b3b] fill-[#ff3b3b]/30 animate-pulse" />
            Total Terjual Real-time: <strong className="text-white ml-0.5">{totalSold}</strong> Akun
          </div>
        </div>
      </section>

      {/* Catalog Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {FINAL_PRODUCTS.map(p => {
          const freshStock = stock[p.id] || 0;
          const soldCount = sold[p.id] || 0;
          const isOutOfStock = freshStock <= 0;
          const qty = quantities[p.id] || 1;

          return (
            <div 
              key={p.id}
              className="bg-[#111111]/50 border border-[#ff1b2d]/20 rounded-2xl p-6 md:p-8 flex flex-col justify-between gap-6 panel-glow group hover:border-[#ff1b2d]/50 transition-all duration-300"
            >
              
              {/* Header Card info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#0a0a0a] border border-neutral-800 group-hover:border-[#ff1b2d]/30 group-hover:shadow-[0_0_10px_rgba(255,27,45,0.2)] transition-all">
                    {p.icon}
                  </div>
                  <div>
                    <h4 className="font-display font-black text-white text-lg tracking-wide group-hover:text-[#ff3b3b] transition-colors">
                      {p.name}
                    </h4>
                    <span className="text-xs font-mono text-neutral-400 block mt-0.5">
                      {freshStock > 0 ? (
                        <span className="text-[#ff3b3b] font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ff1b2d] animate-pulse" />
                          Stok: {freshStock} Tersedia
                        </span>
                      ) : (
                        <span className="text-neutral-500 font-bold">Stok Sedang Habis</span>
                      )}
                    </span>
                    <span className="text-[11px] text-neutral-500 block mt-1">
                      Terjual: {soldCount} Akun
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${
                  p.id === 'gemini' 
                    ? 'bg-[#ff1b2d]/10 border-[#ff1b2d]/30 text-[#ff1b2d]'
                    : 'bg-[#ff1b2d]/10 border-[#ff1b2d]/30 text-[#ff3b3b]'
                }`}>
                  {p.badge}
                </span>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-2 py-2 border-y border-neutral-800/80 my-2">
                <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
                  Rp {Number(p.price).toLocaleString('id-ID')}
                </span>
                <span className="text-xs font-semibold text-neutral-400 uppercase">/ Pcs</span>
              </div>

              {/* Feature Points list */}
              <div className="space-y-2.5 flex-grow">
                {p.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300 bg-[#0a0a0a]/80 border border-neutral-800/60 p-3 rounded-xl hover:bg-[#111111] transition-colors">
                    <span className="w-5 h-5 rounded-full bg-[#ff1b2d]/20 border border-[#ff1b2d]/30 text-[#ff1b2d] font-bold text-[10px] flex items-center justify-center shrink-0">
                      ✓
                    </span>
                    <span className="leading-snug">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Purchase controls & quantities */}
              <div className="flex items-center gap-3 mt-4">
                
                {/* Quantity adjuster */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-800 bg-[#0a0a0a] max-w-[140px] shrink-0">
                  <button
                    onClick={() => handleQtyChange(p.id, -1)}
                    disabled={isOutOfStock || qty <= 1}
                    className="w-8 h-8 rounded-lg text-neutral-300 hover:bg-[#111111] text-lg font-bold disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    -
                  </button>
                  <span className="font-display font-medium text-white text-sm text-center min-w-[28px]">
                    {isOutOfStock ? 0 : qty}
                  </span>
                  <button
                    onClick={() => handleQtyChange(p.id, 1)}
                    disabled={isOutOfStock || qty >= freshStock}
                    className="w-8 h-8 rounded-lg text-neutral-300 hover:bg-[#111111] text-lg font-bold disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    +
                  </button>
                </div>

                {/* Submit element */}
                <button
                  onClick={() => initBuyFlow(p.id)}
                  disabled={isOutOfStock || !isDbAvailable}
                  className="flex-1 py-3 text-xs font-bold uppercase rounded-xl tracking-wide bg-gradient-to-r from-[#ff1b2d] to-[#b30018] text-white hover:opacity-95 disabled:opacity-40 disabled:hover:opacity-40 transition-all shadow-[0_0_15px_rgba(255,27,45,0.25)]"
                >
                  {!isDbAvailable ? 'Database Offline' : (isOutOfStock ? 'Stok Habis' : 'Beli Sekarang')}
                </button>
              </div>

              {/* Guidelines / notes footer */}
              <p className="border-t border-neutral-800/80 pt-3 text-[10px] text-neutral-500 leading-relaxed italic">
                {isOutOfStock ? "Stok sedang kosong. Admin akan segera restock akun." : p.note}
              </p>

            </div>
          );
        })}
      </section>

      {/* Core values bento details */}
      <section className="mb-12">
        <div className="border-b border-neutral-800/80 pb-4 mb-6">
          <h3 className="font-display font-extrabold text-white text-xl">
            Kenapa Memilih Layanan Impura?
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#111111]/50 border border-[#ff1b2d]/20 rounded-2xl p-6 panel-glow text-center">
            <span className="w-10 h-10 rounded-full mx-auto bg-[#ff1b2d]/10 border border-[#ff1b2d]/20 flex items-center justify-center text-[#ff3b3b] mb-4 shadow-[0_0_10px_rgba(255,27,45,0.15)] font-bold">
              ✓
            </span>
            <h4 className="font-display font-semibold text-white text-sm">Full Garansi Perlindungan</h4>
            <p className="text-xs text-neutral-400 leading-relaxed mt-2">
              Setiap pembelian dilindungi oleh garansi penuh. Jika ada masalah teknis, admin support siap memberikan ganti rugi akun baru secara cepat.
            </p>
          </div>

          <div className="bg-[#111111]/50 border border-[#ff1b2d]/20 rounded-2xl p-6 panel-glow text-center">
            <span className="w-10 h-10 rounded-full mx-auto bg-[#ff1b2d]/10 border border-[#ff1b2d]/20 flex items-center justify-center text-[#ff3b3b] mb-4 shadow-[0_0_10px_rgba(255,27,45,0.15)] font-bold">
              ★
            </span>
            <h4 className="font-display font-semibold text-white text-sm">100% Akun Private Eksklusif</h4>
            <p className="text-xs text-neutral-400 leading-relaxed mt-2">
              Kami menjamin akun personal, bukan sharing profil atau mengundang akun ke paket keluarga / Google One bersama orang lain. Keamanan data terjamin.
            </p>
          </div>

          <div className="bg-[#111111]/50 border border-[#ff1b2d]/20 rounded-2xl p-6 panel-glow text-center">
            <span className="w-10 h-10 rounded-full mx-auto bg-[#ff1b2d]/10 border border-[#ff1b2d]/20 flex items-center justify-center text-[#ff3b3b] mb-4 shadow-[0_0_10px_rgba(255,27,45,0.15)] font-bold">
              ⚡
            </span>
            <h4 className="font-display font-semibold text-white text-sm">Proses & Otomasi Kilat</h4>
            <p className="text-xs text-neutral-400 leading-relaxed mt-2">
              Selesai transfer QRIS, sistem otomatis melakukan verifikasi pembayaran dan mengirimkan rincian akun dalam hitungan detik. Tanpa tunggu antrean.
            </p>
          </div>
        </div>
      </section>

      {/* DYNAMIC WARRANTY OPTIONS SELECTION MODAL */}
      {warrantyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-md"
            onClick={() => setWarrantyModalOpen(false)}
          />

          {/* Modal box */}
          <div className="relative w-full max-w-md bg-[#111111] border border-[#ff1b2d]/30 p-6 rounded-2xl shadow-[0_24px_70px_rgba(255,27,45,0.15)] z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff1b2d]/10 border border-[#ff1b2d]/25 text-[10px] text-[#ff3b3b] font-semibold mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff1b2d]" />
              PILIH PROTEKSI GARANSI
            </span>

            <h3 className="font-display font-bold text-xl text-white glow-red">
              Butuh Perlindungan Berapa Lama?
            </h3>
            <p className="text-xs text-neutral-400 mt-2 mb-6 leading-relaxed">
              Tipe produk ini mendukung opsi jangka waktu proteksi garansi yang berbeda. Pilih salah satu untuk melanjutkan ke checkout QRIS.
            </p>

            <div className="space-y-3">
              {activeWarranties.map((warranty: any) => {
                const basePrice = FINAL_PRODUCTS.find(p => p.id === activeProductId)?.price || 0;
                const finalPrice = basePrice + Number(warranty.extra_price);

                if (warranty.is_popular) {
                  return (
                    <button
                      key={warranty.id}
                      type="button"
                      onClick={() => setSelectedWarranty(warranty.id)}
                      className={`w-full relative text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-4 group ${
                        selectedWarranty === warranty.id 
                          ? 'border-[#ff1b2d] bg-[#ff1b2d]/10 ring-1 ring-[#ff1b2d] shadow-[0_0_15px_rgba(255,27,45,0.15)]' 
                          : 'border-[#ff1b2d]/30 bg-[#ff1b2d]/5 hover:border-[#ff1b2d]/60 hover:bg-[#ff1b2d]/10'
                      }`}
                    >
                      <div>
                        <b className="block text-white text-sm group-hover:text-[#ff3b3b] transition-colors flex items-center gap-1.5">
                          {warranty.title}
                          <span className="text-[9px] bg-[#ff1b2d] border border-[#ff1b2d] text-white px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(255,27,45,0.5)]">TERBAIK</span>
                        </b>
                        <span className="block text-[11px] text-neutral-400 mt-0.5">{warranty.description || `Perlindungan akun ${warranty.duration_days} hari`}</span>
                      </div>
                      <strong className="text-white text-base font-mono">
                        Rp {Number(finalPrice).toLocaleString('id-ID')} <span className="text-[10px] text-neutral-500">/ pcs</span>
                      </strong>
                    </button>
                  );
                }

                return (
                  <button
                    key={warranty.id}
                    type="button"
                    onClick={() => setSelectedWarranty(warranty.id)}
                    className={`w-full relative text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-4 group ${
                      selectedWarranty === warranty.id 
                        ? 'border-[#ff1b2d] bg-[#111111] ring-1 ring-[#ff1b2d]' 
                        : 'border-neutral-800 bg-[#0a0a0a] hover:border-[#ff1b2d]/40 hover:bg-[#111111]'
                    }`}
                  >
                    <div>
                      <b className="block text-white text-sm group-hover:text-[#ff3b3b] transition-colors">{warranty.title}</b>
                      <span className="block text-[11px] text-neutral-400 mt-0.5">{warranty.description || `Perlindungan akun ${warranty.duration_days} hari`}</span>
                    </div>
                    <strong className="text-white text-base font-mono">
                        Rp {Number(finalPrice).toLocaleString('id-ID')} <span className="text-[10px] text-neutral-500">/ pcs</span>
                    </strong>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                   if (selectedWarranty) confirmWarrantyBuy(selectedWarranty);
                }}
                disabled={!selectedWarranty}
                className="w-full py-3.5 rounded-xl bg-[#ff1b2d] font-bold text-white shadow-[0_0_20px_rgba(255,27,45,0.4)] hover:bg-[#ff3b3b] transition-colors disabled:opacity-50"
              >
                Lanjutkan Pembayaran
              </button>
              
              <button
                onClick={() => setWarrantyModalOpen(false)}
                className="w-full py-2.5 rounded-xl border border-neutral-800 bg-neutral-100/5 text-xs text-neutral-300 font-medium hover:bg-neutral-800 transition-colors"
              >
                Batalkan
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
