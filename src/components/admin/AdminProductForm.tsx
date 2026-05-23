import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import AdminWarrantySection from './AdminWarrantySection';
import { useSupabaseHealth } from '../../lib/supabase-context';

export default function AdminProductForm({ setPath, productId }: { setPath: (path: string) => void, productId: string | null }) {
  const { isDbAvailable } = useSupabaseHealth();
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [product, setProduct] = useState<any>({
      id: '',
      name: '',
      price_idr: 0,
      note: '',
      features: [],
      image_url: ''
  });

  useEffect(() => {
    if (productId) {
      const fetchProd = async () => {
        try {
          const adminToken = localStorage.getItem('impura_admin_token') || '';
          const res = await fetch(`/api/admin/products`, { headers: { 'x-admin-token': adminToken }});
          const data = await res.json();
          if (data.ok && data.products) {
              const p = data.products.find((x: any) => x.id === productId);
              if (p) {
                  setProduct({
                      ...p,
                      features: p.features || [],
                      price_idr: p.price_idr || p.price || 0
                  });
              }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchProd();
    }
  }, [productId]);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        const adminToken = localStorage.getItem('impura_admin_token') || '';
        const res = await fetch(`/api/admin/products`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-admin-token': adminToken
            },
            body: JSON.stringify(product)
        });
        const data = await res.json();
        if (data.ok) {
            setPath('/admin/products');
        } else {
            alert('Gagal menyimpan produk: ' + data.error);
        }
      } catch (err) {
          alert('Terjadi kesalahan jaringan');
      } finally {
          setSaving(false);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
          alert('Size image max 5MB');
          return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              
              // Max width 800px
              const MAX_WIDTH = 800;
              if (width > MAX_WIDTH) {
                  height = Math.round((height * MAX_WIDTH) / width);
                  width = MAX_WIDTH;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              
              // Compress to webp 0.7
              const dataUrl = canvas.toDataURL('image/webp', 0.7);
              setProduct({...product, image_url: dataUrl});
          };
          img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <span className="inline-block w-8 h-8 rounded-full border-[3px] border-neutral-800 border-t-[#ff1b2d] animate-spin" />
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
          <button onClick={() => setPath('/admin/products')} className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              {productId ? 'Edit Product' : 'Create New Product'}
          </h2>
      </div>

      <form id="productForm" onSubmit={handleSave} className="space-y-6">
          <div className="bg-[#111] border border-neutral-850 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-neutral-800 pb-3 mb-4">Informasi Dasar</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ID Produk (Unik)</label>
                      <input 
                          type="text" 
                          value={product.id || ''} 
                          onChange={e => setProduct({...product, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')})}
                          readOnly={!!productId}
                          className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-xl py-3 px-4 text-sm font-mono outline-none focus:border-[#ff1b2d]/50 read-only:opacity-50" 
                          placeholder="Misal: netflix, spotify"
                          required
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Produk</label>
                      <input 
                          type="text" 
                          value={product.name || ''} 
                          onChange={e => setProduct({...product, name: e.target.value})}
                          className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-xl py-3 px-4 text-sm outline-none focus:border-[#ff1b2d]/50" 
                          required
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Harga Dasar (Rp)</label>
                  <input 
                      type="number" 
                      min="0"
                      value={product.price_idr || product.price || 0} 
                      onChange={e => setProduct({...product, price_idr: parseInt(e.target.value) || 0, price: parseInt(e.target.value) || 0})}
                      className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-xl py-3 px-4 text-sm font-mono outline-none focus:border-[#ff1b2d]/50" 
                      required
                  />
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Catatan Produk / Peringatan</label>
                  <textarea 
                      value={product.note || ''} 
                      onChange={e => setProduct({...product, note: e.target.value})}
                      rows={2}
                      className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-xl py-3 px-4 text-xs outline-none focus:border-[#ff1b2d]/50" 
                      placeholder="Masukkan note penting untuk user..."
                  />
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Features (Satu per baris)</label>
                  <textarea 
                      value={product.features?.join('\n') || ''} 
                      onChange={e => setProduct({...product, features: e.target.value.split('\n').filter(x => x.trim())})}
                      rows={5}
                      className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-xl py-3 px-4 text-xs font-mono outline-none focus:border-[#ff1b2d]/50" 
                      placeholder="Akses premium\nGaransi 30 hari\nFitur lengkap..."
                  />
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Image (Upload & Base64)</label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {product.image_url ? (
                        <img src={product.image_url} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-neutral-800 bg-[#0a0a0a] flex-shrink-0" />
                    ) : (
                        <div className="w-16 h-16 rounded-xl border border-neutral-800 bg-[#0a0a0a] flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="text-neutral-700" />
                        </div>
                    )}
                    <div className="flex-1 w-full flex gap-2">
                        <input 
                            type="text" 
                            name="image_url"
                            defaultValue={product.image_url || ''} 
                            onBlur={e => setProduct({...product, image_url: e.target.value})}
                            className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-xl py-3 px-4 text-sm font-mono outline-none focus:border-[#ff1b2d]/50" 
                            placeholder="URL atau Paste Base64 (onBlur set)"
                        />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold flex-shrink-0 border border-neutral-700">Browse</button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                  </div>
              </div>
          </div>
      </form>

      {/* Warranties Section */}
      {productId && (
        <AdminWarrantySection productId={productId} />
      )}

      {/* Floating Sticky Save Button for better mobile UX */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[rgba(5,5,5,0.95)] to-transparent pointer-events-none z-50">
         <div className="max-w-4xl mx-auto flex justify-end">
            <button 
                type="submit" 
                form="productForm"
                disabled={saving || !isDbAvailable}
                className="pointer-events-auto px-8 py-3.5 bg-[#ff1b2d] hover:bg-[#ff3b3b] text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(255,27,45,0.4)] disabled:opacity-50 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
            >
                {saving ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin block"></span>
                ) : !isDbAvailable ? (
                    <>Database Offline</>
                ) : (
                    <><Save className="w-5 h-5" /> Save Product</>
                )}
            </button>
         </div>
      </div>
    </div>
  );
}
