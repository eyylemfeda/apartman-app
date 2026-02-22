'use client'
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

const KATEGORILER = [
  { id: 'elektrik', ad: 'Elektrik Faturası', emoji: '⚡' },
  { id: 'temizlik', ad: 'Temizlik Gideri', emoji: '🧹' },
  { id: 'bahce', ad: 'Bahçe Bakımı', emoji: '🌳' },
  { id: 'tamirat', ad: 'Tamirat/Tadilat', emoji: '🛠️' },
  { id: 'diger', ad: 'Diğer Giderler', emoji: '📦' }
];

export default function GiderEkle() {
  const [baslik, setBaslik] = useState('');
  const [tutar, setTutar] = useState('');
  const [tip, setTip] = useState('Nakit');
  const [kategori, setKategori] = useState('diger');

  const kaydet = async () => {
    if (!tutar) return alert("Tutar giriniz!");
    const seciliKategori = KATEGORILER.find(k => k.id === kategori);

    const { error } = await supabase.from('giderler').insert([{
      baslik: baslik || seciliKategori?.ad,
      tutar: Number(tutar),
      odeme_tipi: tip,
      kategori: kategori
    }]);

    if (!error) {
        alert("Gider başarıyla işlendi! ✅");
        setBaslik(''); setTutar('');
    }
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 border-x">
      <header className="flex justify-between items-center mb-8">
        <Link href="/" className="text-sm font-black text-blue-600">← GERİ</Link>
        <h1 className="font-black text-slate-800 italic uppercase">Çağdaş Apartmanı Giderleri</h1>
        <div className="w-8"></div>
      </header>

      <div className="space-y-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="grid grid-cols-5 gap-2 mb-4">
          {KATEGORILER.map(k => (
            <button
              key={k.id}
              onClick={() => setKategori(k.id)}
              className={`p-3 rounded-2xl text-xl transition-all ${kategori === k.id ? 'bg-red-500 scale-110 shadow-lg' : 'bg-slate-100 opacity-50'}`}
              title={k.ad}
            >
              {k.emoji}
            </button>
          ))}
        </div>

        <input placeholder="Harcama Detayı (Opsiyonel)" value={baslik} onChange={(e)=>setBaslik(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" />
        <input type="number" placeholder="Tutar ₺" value={tutar} onChange={(e)=>setTutar(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-red-400" />

        <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
          <button onClick={()=>setTip('Nakit')} className={`flex-1 p-3 rounded-xl font-black text-xs transition-all ${tip==='Nakit'?'bg-white shadow text-red-600':'text-slate-400'}`}>💵 NAKİT</button>
          <button onClick={()=>setTip('Banka')} className={`flex-1 p-3 rounded-xl font-black text-xs transition-all ${tip==='Banka'?'bg-white shadow text-blue-600':'text-slate-400'}`}>🏦 BANKA</button>
        </div>

        <button onClick={kaydet} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-100 active:scale-95 transition-all">GİDERİ KAYDET</button>
      </div>
    </main>
  );
}
