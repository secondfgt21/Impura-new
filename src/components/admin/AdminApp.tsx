import { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminProductForm from './AdminProductForm';
import AdminOrders from './AdminOrders';
import AdminVouchers from './AdminVouchers';
import AdminSystem from './AdminSystem';

export default function AdminApp({ path, setPath }: { path: string, setPath: (p: string) => void }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('impura_admin_token'));

  // Auth Protection
  useEffect(() => {
    if (!token && path !== '/admin/login') {
      setPath('/admin/login');
    } else if (token && (path === '/admin' || path === '/admin/login')) {
      setPath('/admin/dashboard');
    }
  }, [token, path, setPath]);

  const handleLogout = () => {
    localStorage.removeItem('impura_admin_token');
    setToken(null);
    setPath('/admin/login');
  };

  const renderRoute = () => {
    if (path === '/admin/login') {
      return <AdminLogin setToken={(t) => {
        localStorage.setItem('impura_admin_token', t);
        setToken(t);
        setPath('/admin/dashboard');
      }} />;
    }
    
    if (path === '/admin/dashboard') return <AdminDashboard setPath={setPath} />;
    
    if (path === '/admin/products') return <AdminProducts setPath={setPath} />;
    if (path === '/admin/products/new') return <AdminProductForm setPath={setPath} productId={null} />;
    if (path.startsWith('/admin/products/edit/')) {
      const id = path.replace('/admin/products/edit/', '');
      return <AdminProductForm setPath={setPath} productId={id} />;
    }
    
    if (path === '/admin/orders/vouchers') return <AdminVouchers setPath={setPath} />;
    if (path === '/admin/orders') return <AdminOrders setPath={setPath} />;
    if (path === '/admin/system') return <AdminSystem setPath={setPath} />;

    return (
        <div className="flex flex-col items-center justify-center p-10 h-[60vh]">
            <h1 className="text-white text-xl">Loading or Not Found</h1>
        </div>
    );
  };

  if (!token && path !== '/admin/login') return null; // Avoid flashing protected routes

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-[#ff1b2d]/30">
      {token && (
        <nav className="border-b border-neutral-850 bg-[#0a0a0a] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <span className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ff1b2d] shadow-[0_0_10px_#ff1b2d]"></span>
                  IMPURA ADMIN
                </span>
                <div className="hidden md:flex gap-4">
                  <button onClick={() => setPath('/admin/dashboard')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${path === '/admin/dashboard' ? 'bg-[#ff1b2d]/10 text-[#ff1b2d]' : 'text-slate-400 hover:text-white hover:bg-neutral-800'}`}>Dashboard</button>
                  <button onClick={() => setPath('/admin/products')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${path.startsWith('/admin/products') ? 'bg-[#ff1b2d]/10 text-[#ff1b2d]' : 'text-slate-400 hover:text-white hover:bg-neutral-800'}`}>Products</button>
                  <button onClick={() => setPath('/admin/orders')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${path.startsWith('/admin/orders') ? 'bg-[#ff1b2d]/10 text-[#ff1b2d]' : 'text-slate-400 hover:text-white hover:bg-neutral-800'}`}>Orders</button>
                  <button onClick={() => setPath('/admin/system')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${path === '/admin/system' ? 'bg-[#ff1b2d]/10 text-[#ff1b2d]' : 'text-slate-400 hover:text-white hover:bg-neutral-800'}`}>System</button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-white px-3 py-1.5 border border-neutral-800 rounded hover:bg-neutral-800 transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </div>
          {/* Mobile Menu */}
          <div className="md:hidden border-t border-neutral-850 px-4 py-2 flex gap-4 overflow-x-auto">
            <button onClick={() => setPath('/admin/dashboard')} className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${path === '/admin/dashboard' ? 'bg-[#ff1b2d]/10 text-[#ff1b2d]' : 'text-slate-400 hover:text-white'}`}>Dashboard</button>
            <button onClick={() => setPath('/admin/products')} className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${path.startsWith('/admin/products') ? 'bg-[#ff1b2d]/10 text-[#ff1b2d]' : 'text-slate-400 hover:text-white'}`}>Products</button>
            <button onClick={() => setPath('/admin/orders')} className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${path.startsWith('/admin/orders') ? 'bg-[#ff1b2d]/10 text-[#ff1b2d]' : 'text-slate-400 hover:text-white'}`}>Orders</button>
            <button onClick={() => setPath('/admin/system')} className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${path === '/admin/system' ? 'bg-[#ff1b2d]/10 text-[#ff1b2d]' : 'text-slate-400 hover:text-white'}`}>System</button>
          </div>
        </nav>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
        {renderRoute()}
      </main>
    </div>
  );
}
