import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

export default function FAQScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Keep first open by default

  const faqItems: FAQItem[] = [
    {
      q: "Bagaimana cara membeli produk di Impura?",
      a: "Sangat mudah! Pilih produk yang Anda inginkan di halaman utama, atur jumlahnya, lalu klik tombol 'Beli Sekarang'. Untuk produk Gemini, Anda akan diminta memilih proteksi garansi (1 Bulan atau Full). Anda akan dialihkan ke halaman Pembayaran QRIS. Cukup scan barcode dengan GoPay, OVO, Dana, LinkAja, ShopeePay, atau m-Banking Anda, dan transfer sesuai nominal persis."
    },
    {
      q: "Kenapa nominal transfer tidak boleh dibulatkan?",
      a: "Karena sistem otomasi kami membaca jumlah transfer secara persis hingga 3 digit terakhir (kode verifikasi acak) untuk membedakan transaksi antar pembeli. Jika Anda mentransfer nominal yang dibulatkan, sistem tidak dapat memverifikasi pembayaran Anda secara otomatis, sehingga Anda harus menghubungi admin secara manual."
    },
    {
      q: "Bagaimana cara cek status pesanan?",
      a: "Setelah checkout, simpan Order ID Anda. Anda bisa memasukkan Order ID tersebut di menu 'Cek Order'. Halaman status akan otomatis terupdate setiap beberapa detik sekali dan menampilkan tombol salin akun jika pembayaran Anda sudah terverifikasi."
    },
    {
      q: "Kalau sudah bayar tapi status belum berubah bagaimana?",
      a: "Umumnya mutasi QRIS diverifikasi kurang dari 1 menit. Jika dalam waktu 5-10 menit status Anda masih tertulis 'PENDING', Anda bisa klik tombol '💬 Chat Admin' di kanan bawah untuk mengirimkan bukti transfer fisik beserta Order ID Anda. Admin kami akan memverifikasi dan merilis secara manual dalam hitungan menit."
    },
    {
      q: "Apakah stok produk tampil real-time?",
      a: "Ya! Stok akun premium yang tersedia disinkronkan langsung dari basis data kami. Jika stok habis, tombol pembelian akan dinonaktifkan secara otomatis untuk mencegah Anda melakukan pembayaran sia-sia."
    },
    {
      q: "Berapa lama order aktif sebelum expired?",
      a: "Setiap order pending memiliki waktu kedaluwarsa selama 5 menit. Jika dalam waktu 5 menit transfer belum dilakukan, order akan dibatalkan otomatis oleh sistem dan voucher dimasukkan kembali ke persediaan stock aktif."
    },
    {
      q: "Apakah akun premium ini private atau sharing?",
      a: "Seluruh akun AI premium yang kami jual dijamin bernilai PRIVATE 100%. Data pencarian, riwayat obrolan, GPTs kustom, hingga data coding Anda aman sepenuhnya tanpa terbagi dengan konsumen lain."
    },
    {
      q: "Bagaimana cara melakukan klaim garansi?",
      a: "S&K Garansi berlaku jika akun mengalami kendala sebelum batas waktu garansi habis. Buka WhatsApp admin dari tombol chat, kirimkan Order ID pembelian Anda serta tangkapan layar/bukti kendala akun Anda. Admin akan merilis akun pengganti baru tanpa biaya tambahan."
    }
  ];

  const handleToggle = (idx: number) => {
    setOpenIndex(prev => (prev === idx ? null : idx));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
      <div className="bg-[#111111]/45 border border-[#ff1b2d]/15 rounded-2xl p-5 sm:p-6 md:p-8 panel-glow">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#ff1b2d]/20 bg-[#ff1b2d]/10 text-[10px] font-bold tracking-wider text-[#ff3b3b] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff1b2d] shadow-[0_0_8px_rgba(255,27,45,0.7)] animate-pulse" />
          Bantuan
        </div>

        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white mt-4 mb-2 glow-red flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-[#ff3b3b]" />
          Pertanyaan Umum (FAQ)
        </h2>
        
        <p className="text-xs text-slate-400 mb-8 max-w-xl leading-relaxed">
          Temukan penjelasan ringkas seputar mekanisme pemesanan, sistem pembayaran QRIS otomatis, garansi proteksi, dan klaim akun premium Anda.
        </p>

        <div className="space-y-4">
          {faqItems.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div 
                key={idx} 
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'border-[#ff1b2d]/30 bg-neutral-950/90 shadow-[0_4px_20px_rgba(255,27,45,0.05)]' 
                    : 'border-neutral-850 bg-neutral-900/40 hover:border-[#ff1b2d]/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggle(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-white hover:text-[#ff3b3b] transition-colors"
                >
                  <span className="font-display font-semibold text-sm leading-snug">
                    {item.q}
                  </span>
                  <span className="shrink-0 p-1.5 rounded-lg border border-neutral-800 bg-[#161616] text-slate-400">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#ff1b2d]" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-neutral-850 bg-[#0a0a0a]/50">
                    <p className="text-xs text-slate-350 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
