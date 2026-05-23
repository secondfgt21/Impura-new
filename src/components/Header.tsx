import { useState, useEffect } from 'react';
import { Menu, X, MessageSquare, Search } from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  setPath: (path: string) => void;
  whatsappUrl: string;
}

export default function Header({ currentPath, setPath, whatsappUrl }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');

  // Typewriter effect matching the original Python style
  useEffect(() => {
    const slogan = "Premium AI Access";
    let index = 0;
    let isDeleting = false;
    let timeoutId: any;

    const tick = () => {
      if (isDeleting) {
        setTypewriterText(slogan.substring(0, index));
        index--;
        if (index < 0) {
          isDeleting = false;
          timeoutId = setTimeout(tick, 420);
        } else {
          timeoutId = setTimeout(tick, 28);
        }
      } else {
        setTypewriterText(slogan.substring(0, index));
        index++;
        if (index > slogan.length) {
          isDeleting = true;
          timeoutId = setTimeout(tick, 1200);
        } else {
          timeoutId = setTimeout(tick, 58);
        }
      }
    };

    tick();
    return () => clearTimeout(timeoutId);
  }, []);

  const navigationItems = [
    { label: 'Beranda', path: '/' },
    { label: 'Tentang Kami', path: '/about' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Cek Order', path: '/cek-order' },
    { label: 'Admin', path: '/admin' }
  ];

  return (
    <>
      <header className="site-header sticky top-0 z-50 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-900/80 py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 text-neutral-200 hover:text-white rounded-lg border border-neutral-800 bg-neutral-900/50 transition-colors"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
 
            <div className="flex items-center gap-4 cursor-pointer shrink-0" onClick={() => setPath('/')}>
              <div 
                className="logo-shell w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-[#ff1b2d] to-[#b30018] shadow-[0_0_15px_rgba(255,27,45,0.4)] overflow-hidden transition-transform duration-200 hover:scale-105 shrink-0"
              >
                <img 
                  className="w-full h-full object-cover rounded-full" 
                  src="https://i.ibb.co.com/3m2fyH71/Picsart-24-11-05-00-57-51-857.jpg" 
                  alt="Logo Impura"
                  referrerPolicy="no-referrer"
                />
              </div>
  
              <div className="select-none text-left">
                <h1 className="font-display font-semibold tracking-wide text-white text-xl md:text-2xl glow-red leading-tight">
                  Impura
                </h1>
                <p className="text-[10px] sm:text-xs text-neutral-400 max-w-[180px] sm:max-w-xs md:max-w-md w-full whitespace-normal leading-snug font-sans font-medium">
                  <span className="border-r border-neutral-700 pr-[2px] mr-1">
                    {typewriterText}
                  </span>
                </p>
              </div>
            </div>
          </div>
 
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {navigationItems.map(item => (
              <button
                key={item.path}
                onClick={() => setPath(item.path)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  currentPath === item.path
                    ? 'bg-[#ff1b2d] text-white shadow-[0_0_15px_rgba(255,27,45,0.3)]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/80'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
 
          {/* CTA Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setPath('/cek-order')} 
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-[#ff1b2d]/50 hover:bg-neutral-800 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              Cari Order
            </button>
          </div>
        </div>
      </header>
 
      {/* Side drawer backdrop */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
 
      {/* Side Drawer menu for mobile navigation */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 w-[280px] z-[60] bg-[#0a0a0a] border-r border-neutral-800/60 p-6 flex flex-col gap-6 lg:hidden transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff1b2d] shadow-[0_0_8px_rgba(255,27,45,0.8)]" />
            <span className="font-display font-bold text-neutral-400 text-sm tracking-widest uppercase">
              Menu Utama
            </span>
          </div>
          <button 
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
 
        <nav className="flex flex-col gap-1.5 mt-2">
          {navigationItems.map(item => (
            <button
              key={item.path}
              onClick={() => {
                setPath(item.path);
                setDrawerOpen(false);
              }}
              className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                currentPath === item.path
                  ? 'bg-gradient-to-r from-[#ff1b2d] to-[#b30018] text-white shadow-[0_0_15px_rgba(255,27,45,0.2)]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/5 pt-4">
          <p className="text-[11px] text-white/40 leading-relaxed text-center">
            Penyedia Akun AI Premium Terpercaya & Bergaransi.<br />
            © {new Date().getFullYear()} Impura.id
          </p>
        </div>
      </aside>
    </>
  );
}
