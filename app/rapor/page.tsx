'use client'
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Rapor() {
  const [daireler, setDaireler] = useState<any[]>([]);
  const [aidatGecmisi, setAidatGecmisi] = useState<any[]>([]);
  const [tahsilatlar, setTahsilatlar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const suAnkiYil = 2026;

  useEffect(() => { verileriYukle(); }, []);

  async function verileriYukle() {
    setYukleniyor(true);
    // Verileri çek
    const { data: dData } = await supabase.from('daireler').select('*').order('daire_no');
    const { data: aData } = await supabase.from('aidat_ayarlari').select('*').order('baslangic_tarihi');
    const { data: tData } = await supabase.from('tahsilatlar').select('*');

    if (dData) setDaireler(dData);
    if (aData) setAidatGecmisi(aData);
    if (tData) setTahsilatlar(tData);
    setYukleniyor(false);
  }

  // Borç Hesaplama Mantığı
  const hesaplaDetay = (daire: any) => {
    if (daire.muaf_mi) return { devir: 0, buYil: 0, odenen: 0, toplam: 0 };

    const devir = Number(daire.devir_borcu_2025 || 0);

    // Basit Tahakkuk: (Güncel Aidat x Bulunduğumuz Ay)
    const guncelTutar = aidatGecmisi[aidatGecmisi.length - 1]?.tutar || 0;
    const gecenAySayisi = new Date().getMonth() + 1;
    const buYilkiTahakkuk = guncelTutar * gecenAySayisi;

    const toplamOdenen = tahsilatlar
      .filter(t => t.daire_no === daire.daire_no)
      .reduce((sum, curr) => sum + Number(curr.tutar), 0);

    return {
      devir,
      buYil: buYilkiTahakkuk,
      odenen: toplamOdenen,
      toplam: (devir + buYilkiTahakkuk) - toplamOdenen
    };
  };

  if (yukleniyor) return <div className="p-20 text-center font-bold text-slate-400">Rapor Hazırlanıyor...</div>;

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 pb-32 shadow-2xl border-x border-slate-200 font-sans">

      {/* Üst Bar */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md p-5 flex justify-between items-center z-30 border-b">
        <Link href="/" className="text-slate-400 hover:text-slate-900 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </Link>
        <h1 className="text-sm font-black text-slate-800 tracking-widest uppercase italic">Borç Durum Raporu</h1>
        <div className="w-6"></div>
      </div>

      <div className="p-4 space-y-4">

        {/* Özet Kartı */}
        <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-lg mb-6">
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Toplam Beklenen Tahsilat</p>
            <h2 className="text-3xl font-black">
                {daireler.reduce((sum, d) => sum + hesaplaDetay(d).toplam, 0).toLocaleString('tr-TR')} ₺
            </h2>
        </div>

        {/* Daire Kartları */}
        <div className="space-y-3">
          {daireler.map((daire) => {
            const detay = hesaplaDetay(daire);
            const borcluMu = detay.toplam > 0;

            return (
              <div key={daire.daire_no} className={`bg-white rounded-[2rem] p-5 border shadow-sm transition-all ${borcluMu ? 'border-red-100' : 'border-emerald-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${borcluMu ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {daire.muaf_mi ? 'MUAF' : (borcluMu ? 'ÖDEME BEKLENİYOR' : 'BORCU YOK')}
                    </span>
                    <h3 className="text-lg font-black text-slate-800 mt-1">Daire {daire.daire_no}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{daire.sakin_adi || 'Bilinmiyor'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Net Borç</p>
                    <p className={`text-xl font-black ${borcluMu ? 'text-red-600' : 'text-emerald-600'}`}>
                      {detay.toplam.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                </div>

                {/* Alt Detaylar */}
                {!daire.muaf_mi && (
                  <div className="grid grid-cols-3 gap-2 border-t pt-4 border-slate-50">
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">2025 Devir</p>
                      <p className="text-xs font-black text-slate-600">{detay.devir} ₺</p>
                    </div>
                    <div className="text-center border-x border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">2026 Aidat</p>
                      <p className="text-xs font-black text-slate-600">{detay.buYil} ₺</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Ödenen</p>
                      <p className="text-xs font-black text-emerald-500">{detay.odenen} ₺</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sabit Alt Menü */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-slate-900/95 backdrop-blur-md text-white flex justify-around p-4 rounded-3xl shadow-2xl z-50">
        <Link href="/" className="opacity-60">🏠</Link>
        <Link href="/yonetim" className="opacity-60">⚙️</Link>
        <Link href="/giderler" className="opacity-60">🧾</Link>
        <Link href="/rapor" className="scale-125">📊</Link>
      </nav>
    </main>
  );
}
