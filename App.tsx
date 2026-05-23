import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeScreen from './components/HomeScreen';
import AboutScreen from './components/AboutScreen';
import FAQScreen from './components/FAQScreen';
import CekOrderScreen from './components/CekOrderScreen';
import PaymentScreen from './components/PaymentScreen';
import StatusScreen from './components/StatusScreen';
import VoucherScreen from './components/VoucherScreen';
import AdminApp from './components/admin/AdminApp';
import { SupabaseHealthProvider, useSupabaseHealth } from './lib/supabase-context';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const WHATSAPP_URL = "https://wa.me/6281317391284";

export default function App() {
  return (
    <SupabaseHealthProvider>
      <MainAppLayout />
    </SupabaseHealthProvider>
  );
}

function MainAppLayout() {
  const [path, setPathState] = useState(() => window.location.pathname);
  const { isDbAvailable, isChecking, checkHealth } = useSupabaseHealth();

  // Synchronize path and support native forward/backward browser navigation clicks
  useEffect(() => {
    const handlePopState = () => {
      setPathState(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update Document title based on route for basic SEO
  useEffect(() => {
    if (path === '/') {
      document.title = "Impura — Premium AI Access Indonesia";
    } else if (path === '/about') {
      document.title = "Tentang Impura | Premium AI Access";
    } else if (path === '/faq') {
      document.title = "FAQ & Bantuan Impura";
    } else if (path === '/cek-order') {
      document.title = "Cek Status Pesanan | Impura";
    } else if (path.startsWith('/pay/')) {
      document.title = "Pembayaran Validasi | Impura";
    } else if (path.startsWith('/status/')) {
      document.title = "Status Transaksi | Impura";
    } else if (path.startsWith('/voucher/')) {
      document.title = "Voucher Akun Premium | Impura";
    } else {
      document.title = "Impura — Store";
    }
  }, [path]);

  // Soft wrapper to set values
  const setPath = (newPath: string) => {
    window.history.pushState(null, '', newPath);
    setPathState(newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Checkout initiating trigger POST
  const handleCheckout = async (productId: string, qty: number, warranty?: string) => {
    const existingOrderId = localStorage.getItem('active_order_id');
    if (existingOrderId) {
      try {
        const checkRes = await fetch(`/api/order/${existingOrderId}`, { cache: 'no-store' });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData && checkData.ok && checkData.order && checkData.order.status === 'pending') {
            // Unpaid pending order exists, redirect user immediately to its payment page and prevent duplicates
            setPath(`/pay/${existingOrderId}`);
            return;
          } else {
            localStorage.removeItem('active_order_id');
          }
        } else {
          localStorage.removeItem('active_order_id');
        }
      } catch (err) {
        console.error('[Checkout Check] Error checking existing order:', err);
        localStorage.removeItem('active_order_id');
      }
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          qty,
          warranty,
        })
      });
      const data = await res.json();
      if (data && data.ok && data.order) {
        // Save active order ID for session persistence
        localStorage.setItem('active_order_id', data.order.id);

        // Create cookie simulator for user convenience (updated to match 5 min TTL)
        const cookieKey = warranty ? `oid_${productId}_${warranty}` : `oid_${productId}`;
        document.cookie = `${cookieKey}=${data.order.id}; max-age=${5 * 60}; path=/; SameSite=Lax`;
        
        setPath(`/pay/${data.order.id}`);
      } else {
        alert(`Gagal membuat pesanan: ${data?.error || 'Kesalahan Server'}`);
      }
    } catch (e) {
      alert('Terganggu masalah jaringan, klik coba kembali.');
    }
  };

  // Route matches mapping
  if (path.startsWith('/admin')) {
      return <AdminApp path={path} setPath={setPath} />;
  }

  const renderRoute = () => {
    const payMatch = path.match(/^\/pay\/([^/]+)/);
    if (payMatch) {
      return (
        <PaymentScreen 
          orderId={payMatch[1]} 
          setPath={setPath} 
          whatsappUrl={WHATSAPP_URL}
          onPaidRedirect={(oid) => setPath(`/voucher/${oid}`)}
        />
      );
    }

    const statusMatch = path.match(/^\/status\/([^/]+)/);
    if (statusMatch) {
      return (
        <StatusScreen 
          orderId={statusMatch[1]} 
          setPath={setPath} 
          whatsappUrl={WHATSAPP_URL}
          onPaidRedirect={(oid) => setPath(`/voucher/${oid}`)}
        />
      );
    }

    const voucherMatch = path.match(/^\/voucher\/([^/]+)/);
    if (voucherMatch) {
      return (
        <VoucherScreen 
          orderId={voucherMatch[1]} 
          setPath={setPath} 
          whatsappUrl={WHATSAPP_URL}
        />
      );
    }

    switch (path) {
      case '/':
        return <HomeScreen setPath={setPath} onCheckout={handleCheckout} />;
      case '/about':
        return <AboutScreen />;
      case '/faq':
        return <FAQScreen />;
      case '/cek-order':
        return <CekOrderScreen onSearch={(id) => setPath(`/status/${id}`)} />;
      default:
        // Handle fallback redirect gracefully 404
        return (
          <div className="max-w-md mx-auto text-center px-6 pt-24">
            <h3 className="font-display font-black text-2xl text-white">404 - Halaman Tidak Ditemukan</h3>
            <p className="text-xs text-white/50 mt-2 mb-6">Halaman yang Anda tuju kosong atau telah dipindahkan.</p>
            <button 
              onClick={() => setPath('/')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase bg-gradient-to-r from-[#ff2a2a] to-[#9e0018] text-white"
            >
              Kembali ke Toko
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-red-500/30">
      
      {/* Dynamic Header */}
      <Header currentPath={path} setPath={setPath} whatsappUrl={WHATSAPP_URL} />

      {/* Database Warning Badge with Retry Button */}
      {!isDbAvailable && (
        <div className="bg-red-500/10 border-b border-red-500/25 text-red-500 py-3.5 px-6 shrink-0 z-50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm font-sans">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
              <span className="leading-snug">
                <strong>Database Connection Failed!</strong> Pembelian dan verifikasi dinonaktifkan sementara demi keamanan. Silakan coba klik hubungkan kembali.
              </span>
            </div>
            <button 
              onClick={() => checkHealth()}
              disabled={isChecking}
              className="px-4 py-2 bg-[#ff1b2d] hover:bg-[#ff3b3b] text-white rounded-xl font-bold flex items-center gap-2 max-sm:w-full justify-center disabled:opacity-50 hover:scale-[1.02] transform active:scale-95 transition-all text-xs border border-white/5 shadow-[0_0_15px_rgba(255,27,45,0.25)]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              Coba Hubungkan Kembali
            </button>
          </div>
        </div>
      )}
      
      {/* Content Canvas Layout wrapper */}
      <main className="flex-grow pb-16 relative z-10 leading-relaxed">
        {renderRoute()}
      </main>

      {/* Floating Active Help Badge Widget matching the Python page design */}
      <a 
        href={WHATSAPP_URL} 
        target="_blank" 
        rel="noreferrer" 
        className="fixed right-3 bottom-3 sm:right-4 sm:bottom-4 z-40 bg-gradient-to-r from-[#ff1b2d] to-[#b30018] hover:scale-105 active:scale-95 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-[0_2px_10px_rgba(255,27,45,0.25)] border border-white/5 transition-all cursor-pointer"
        aria-label="Direct Chat Admin CS"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        Bantuan
      </a>

      {/* Dynamic Footer - Only visible on Home Screen */}
      {path === '/' && (
        <Footer setPath={setPath} whatsappUrl={WHATSAPP_URL} />
      )}

    </div>
  );
}
