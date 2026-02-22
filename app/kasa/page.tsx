'use client'
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Kasa() {
  const [ozet, setOzet] = useState({ aylikGelir: 0, aylikGider: 0, yillikGelir: 0, yillikGider: 0, bakiye: 0 });
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => { verileriGetir(); }, []);

  async function verileriGetir() {
    setYukleniyor(true);
    const simdi = new Date();
    const buAyBaslangic = new Date(simdi.getFullYear(), simdi.getMonth(), 1).toISOString();
    const buYilBaslangic = new Date(simdi.getFullYear(), 0, 1).toISOString();

    // Verileri çekiyoruz
    const { data: gelirler } = await supabase.from('tahsilatlar').select('*');
    const { data: giderler } = await supabase.from('giderler').select('*');
    const { data: baslangic } = await supabase.from('kasa_baslangic').select('*').eq('id', 1).single();

    // Hatalı olan hesapla fonksiyonunun düzeltilmiş hali
    const hesapla = (liste: any[] | null, tarihFiltre?: string) => {
      if (!liste) return 0;
      return liste
        .filter(item => {
          const ogeTarihi = item.created_at || item.tarih;
          return !tarihFiltre || (ogeTarihi && new Date(ogeTarihi) >= new Date(tarihFiltre));
        })
        .reduce((sum, item) => sum + Number(item.tutar || 0), 0);
    };

    const aGelir = hesapla(gelirler, buAyBaslangic);
    const aGider = hesapla(giderler, buAyBaslangic);
    const yGelir = hesapla(gelirler, buYilBaslangic);
    const yGider = hesapla(giderler, buYilBaslangic);

    // Başlangıç bakiyesi hesaplama
    const nakitBas = Number(baslangic?.nakit_baslangic || 0);
    const bankaBas = Number(baslangic?.banka_baslangic || 0);
    const toplamBaslangic = nakitBas + bankaBas;

    const toplamGelir = hesapla(gelirler);
    const toplamGider = hesapla(giderler);

    setOzet({
      aylikGelir: aGelir,
      aylikGider: aGider,
      yillikGelir: yGelir,
      yillikGider: yGider,
      bakiye: (toplamBaslangic + toplamGelir) - toplamGider
    });
    setYukleniyor(false);
  }

  if (yukleniyor) return <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest">Kasa Hesaplanıyor...</div>;

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 pb-24 shadow-2xl border-x border-slate-200 font-sans">
      <header className="p-8 bg-white border-b text-center rounded-b-[3rem] shadow-sm">
        <h1 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Çağdaş Apartmanı Mevcut Kasa</h1>
        <div className="text-4xl font-black text-slate-900">{ozet.bakiye.toLocaleString('tr-TR')} ₺</div>
        <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full mt-3 uppercase">Net Bakiye</div>
      </header>

      <div className="p-4 space-y-4">
        {/* Aylık Özet Kartları */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Bu Ay Gelir</p>
            <p className="text-xl font-black text-emerald-600">+{ozet.aylikGelir.toLocaleString('tr-TR')} ₺</p>
          </div>
          <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Bu Ay Gider</p>
            <p className="text-xl font-black text-red-600">-{ozet.aylikGider.toLocaleString('tr-TR')} ₺</p>
          </div>
        </div>

        {/* Yıllık Genel Durum */}
        <section className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
            2026 Yıllık Muhasebe
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-sm font-medium opacity-80 uppercase tracking-tighter">Toplam Tahsilat</span>
              <span className="text-lg font-black text-emerald-400">+{ozet.yillikGelir.toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium opacity-80 uppercase tracking-tighter">Toplam Harcama</span>
              <span className="text-lg font-black text-red-400">-{ozet.yillikGider.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
        </section>
      </div>

      {/* Alt Navigasyon */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-slate-900/95 backdrop-blur-md text-white flex justify-around p-4 rounded-3xl shadow-2xl z-50">
        <Link href="/" className="opacity-60 hover:opacity-100 transition">🏠</Link>
        <Link href="/kasa" className="scale-125 border-b-2 border-blue-400 pb-1">💰</Link>
        <Link href="/demirbas" className="opacity-60 hover:opacity-100 transition">🏢</Link>
        <Link href="/rapor" className="opacity-60 hover:opacity-100 transition">📊</Link>
      </nav>
    </main>
  );
}
