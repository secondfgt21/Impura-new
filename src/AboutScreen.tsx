import { Bot, ShieldCheck, Zap, Heart, Database, Users } from 'lucide-react';

export default function AboutScreen() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-8">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 panel-glow">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#ff1b2d]/20 bg-[#ff1b2d]/10 text-[10px] font-bold tracking-wider text-[#ff3b3b] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff1b2d] shadow-[0_0_8px_rgba(255,27,45,0.7)]" />
          Siapa Kami
        </div>

        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white mt-4 glow-red">
          Tentang Impura: Pelopor Akun Premium AI Terpercaya
        </h2>
        
        <p className="text-sm text-slate-350 leading-relaxed mt-4">
          Impura.id didirikan dengan satu misi sederhana: memberikan akses termudah, tercepat, dan termurah kepada masyarakat Indonesia untuk menjangkau teknologi kecerdasan buatan (AI) terkemuka global. Di era serba digital, kecerdasan buatan telah terbukti melipatgandakan efisiensi produktivitas, baik bagi pekerja profesional, mahasiswa, programmer, hingga kalangan pebisnis kreatif.
        </p>

        <p className="text-sm text-slate-350 leading-relaxed mt-3">
          Namun, proses pembelian akun premium luar negeri sering kali terhambat karena kendala mata uang asing, ketiadaan kartu kredit internasional, atau harga berlangganan retail yang sangat tinggi di kantong lokal. Impura hadir sebagai jembatan otomatis yang aman, bergaransi penuh, dan menggunakan transfer lokal QRIS instan sehingga siapapun dapat memiliki akun <strong className="text-white">Gemini AI Pro</strong> dan <strong className="text-white">ChatGPT Plus</strong> berkualitas premium dalam hitungan detik.
        </p>

        {/* Vision & Mission grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 pt-6 border-t border-slate-800/80">
          <div className="bg-[#0f0f0f]/55 border border-neutral-850 hover:border-[#ff1b2d]/30 transition-all p-5 rounded-2xl">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-[#ff3b3b]" />
              Visi Kami
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Menjadi gerbang platform digital tepercaya nomor satu di Indonesia untuk penyediaan akun AI premium, mendorong kemajuan keahlian digital lokal, dan memberikan layanan purna jual yang diakui dengan standar kepuasan tertinggi.
            </p>
          </div>

          <div className="bg-[#0f0f0f]/55 border border-neutral-850 hover:border-[#ff1b2d]/30 transition-all p-5 rounded-2xl">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-emerald-450 animate-pulse" />
              Misi Kami
            </h3>
            <ul className="text-xs text-slate-400 leading-relaxed space-y-2 list-decimal list-inside">
              <li>Menyediakan akun premium AI dalam metode checkout QRIS instan otomatis.</li>
              <li>Menjamin proteksi garansi nyata yang andal guna melindungi kekhawatiran pembeli.</li>
              <li>Memberikan respon bantuan ramah berkualitas, menjaga kepuasan setiap pelanggan.</li>
              <li>Terus berekspansi memonitor rilis-rilis teknologi paling cerdas yang dicari pasar global.</li>
            </ul>
          </div>
        </div>

        {/* Highlight points */}
        <h3 className="font-display font-bold text-lg text-white mb-4">Mengapa Memilih Kami?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3 bg-[#0f0f0f]/55 border border-neutral-850 p-4 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-display font-semibold text-white text-xs">Akun Private Legal</h4>
              <p className="text-[11px] text-slate-400 mt-1">Kami menggunakan email legal bergaransi aktif, bukan akun curian atau dipecah ke grup rujukan yang mengganggu data historis Anda.</p>
            </div>
          </div>

          <div className="flex gap-3 bg-[#0f0f0f]/55 border border-neutral-850 p-4 rounded-xl">
            <Bot className="w-5 h-5 text-[#ff3b3b] shrink-0" />
            <div>
              <h4 className="font-display font-semibold text-white text-xs">Teknologi Terdepan</h4>
              <p className="text-[11px] text-slate-400 mt-1">Kami terus memonitor platform-platform AI termodern, memastikan Anda selalu mendapatkan akses model terbaru (GPT-4o, Gemini 1.5 Pro).</p>
            </div>
          </div>

          <div className="flex gap-3 bg-[#0f0f0f]/55 border border-neutral-850 p-4 rounded-xl">
            <Database className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-display font-semibold text-white text-xs">Automated Delivery</h4>
              <p className="text-[11px] text-slate-400 mt-1">Selesai bayar QRIS, server akan mencocokkan nominal unik secara otomatis dan memberikan kredensial Anda instan di layar status order.</p>
            </div>
          </div>

          <div className="flex gap-3 bg-[#0f0f0f]/55 border border-neutral-850 p-4 rounded-xl">
            <Users className="w-5 h-5 text-[#ff3b3b] shrink-0" />
            <div>
              <h4 className="font-display font-semibold text-white text-xs">Customer Focus</h4>
              <p className="text-[11px] text-slate-400 mt-1">Layanan purna jual kami sangat diprioritaskan. Ada kesulitan? Chat admin langsung di WhatsApp untuk penukaran instan.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
