'use client'
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Yonetim() {
  const [daireler, setDaireler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yeniAidat, setYeniAidat] = useState('');
  const [baslangicTarihi, setBaslangicTarihi] = useState('');
  const [guncelAidat, setGuncelAidat] = useState<any>(null);
  const [kasaBaslangic, setKasaBaslangic] = useState({ nakit: '0', banka: '0' });

  useEffect(() => { verileriYukle(); }, []);

  async function verileriYukle() {
    setYukleniyor(true);
    const { data: dData } = await supabase.from('daireler').select('*').order('daire_no');
    if (dData) setDaireler(dData);

    const { data: aData } = await supabase.from('aidat_ayarlari').select('*').order('baslangic_tarihi', { ascending: false }).limit(1);
    if (aData && aData[0]) setGuncelAidat(aData[0]);

    // Kasa başlangıç verisini çek
    const { data: kData } = await supabase.from('kasa_baslangic').select('*').eq('id', 1).single();
    if (kData) setKasaBaslangic({ nakit: kData.nakit_baslangic.toString(), banka: kData.banka_baslangic.toString() });

    setYukleniyor(false);
  }

  const kaydet = async () => {
    const { error: dError } = await supabase.from('daireler').upsert(daireler, { onConflict: 'daire_no' });
    const { error: kError } = await supabase.from('kasa_baslangic').upsert({ id: 1, nakit_baslangic: Number(kasaBaslangic.nakit), banka_baslangic: Number(kasaBaslangic.banka) });

    if (yeniAidat && baslangicTarihi) {
      await supabase.from('aidat_ayarlari').insert([{ tutar: Number(yeniAidat), baslangic_tarihi: baslangicTarihi }]);
    }

    if (dError || kError) alert("Hata oluştu!");
    else { alert("Çağdaş Apartmanı Ayarları Güncellendi! ✅"); verileriYukle(); }
  };

  if (yukleniyor) return <div className="p-20 text-center font-bold text-slate-400">Ayarlar Yükleniyor...</div>;

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 pb-32 shadow-2xl border-x border-slate-200 font-sans">
      {/* Şık Üst Bar */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md p-5 flex justify-between items-center z-30 border-b">
        <Link href="/" className="text-slate-400 hover:text-slate-900 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-sm font-black text-slate-800 tracking-widest uppercase italic">Yönetim Merkezi</h1>
        <div className="w-6"></div>
      </div>

      <div className="p-4 space-y-6">

        {/* Kasa Başlangıç Ayarı */}
        <section className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             🏦 Kasa Başlangıç Bakiyesi
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 ml-2">NAKİT (ELDE)</label>
              <input type="number" value={kasaBaslangic.nakit} onChange={(e)=>setKasaBaslangic({...kasaBaslangic, nakit: e.target.value})} className="w-full p-3 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none border border-transparent focus:border-blue-200" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 ml-2">BANKA HESABI</label>
              <input type="number" value={kasaBaslangic.banka} onChange={(e)=>setKasaBaslangic({...kasaBaslangic, banka: e.target.value})} className="w-full p-3 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none border border-transparent focus:border-blue-200" />
            </div>
          </div>
        </section>

        {/* Aidat Ayarı */}
        <section className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">💰</div>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 opacity-60">Aidat Yapılandırma</h2>
          <p className="text-3xl font-black mb-6">{guncelAidat?.tutar || 0} <span className="text-xs opacity-50">₺ / AY</span></p>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Yeni ₺" value={yeniAidat} onChange={(e)=>setYeniAidat(e.target.value)} className="bg-white/10 p-3 rounded-xl text-sm font-bold placeholder:text-white/30 outline-none border border-white/10" />
            <input type="date" value={baslangicTarihi} onChange={(e)=>setBaslangicTarihi(e.target.value)} className="bg-white/10 p-3 rounded-xl text-sm font-bold outline-none border border-white/10" />
          </div>
        </section>

        {/* Daire Listesi */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Daire Sakinleri</h3>
          {daireler.map((daire, idx) => (
            <div key={daire.daire_no} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-blue-200 transition-all">
              <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                {daire.daire_no}
              </div>
              <div className="flex-grow">
                <input
                  type="text"
                  value={daire.sakin_adi || ''}
                  onChange={(e) => {
                    const copy = [...daireler];
                    copy[idx].sakin_adi = e.target.value;
                    setDaireler(copy);
                  }}
                  className="w-full font-bold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-300"
                  placeholder="İsim Soyisim"
                />
                <div className="flex gap-4 mt-1">
                    <div className="flex items-center gap-1">
                        <span className="text-[8px] font-bold text-slate-400">2025 BORÇ:</span>
                        <input
                          type="number"
                          value={daire.devir_borcu_2025 || 0}
                          onChange={(e)=>{
                            const copy = [...daireler];
                            copy[idx].devir_borcu_2025 = Number(e.target.value);
                            setDaireler(copy);
                          }}
                          className="w-12 bg-transparent text-[10px] font-bold text-orange-500 outline-none border-b border-orange-100"
                        />
                    </div>
                </div>
              </div>
              <label className="flex flex-col items-center">
                <input
                  type="checkbox"
                  checked={daire.muaf_mi}
                  onChange={(e) => {
                    const copy = [...daireler];
                    copy[idx].muaf_mi = e.target.checked;
                    setDaireler(copy);
                  }}
                  className="w-6 h-6 rounded-lg accent-blue-600 border-slate-200"
                />
                <span className="text-[7px] font-black text-slate-300 mt-1 uppercase tracking-tighter">MUAF</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Kaydet Butonu */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 to-transparent z-40">
        <button onClick={kaydet} className="w-full max-w-[350px] mx-auto block bg-blue-600 text-white py-4 rounded-2xl font-black shadow-2xl shadow-blue-200 active:scale-95 transition-all uppercase tracking-widest text-xs">
          DEĞİŞİKLİKLERİ UYGULA
        </button>
      </div>
    </main>
  );
}
