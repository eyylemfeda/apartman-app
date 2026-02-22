'use client'
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AidatTablosu() {
  const [daireler, setDaireler] = useState<any[]>([]);
  const [tahsilatlar, setTahsilatlar] = useState<any[]>([]);
  const [guncelAidat, setGuncelAidat] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(true);

  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const suAnkiYil = 2026;
  const suAnkiAyIdx = new Date().getMonth();

  useEffect(() => { verileriGetir(); }, []);

  async function verileriGetir() {
    setYukleniyor(true);
    const { data: dData } = await supabase.from('daireler').select('*').order('daire_no');
    const { data: aData } = await supabase.from('aidat_ayarlari').select('*').order('baslangic_tarihi', { ascending: false }).limit(1);
    const { data: tData } = await supabase.from('tahsilatlar').select('*').eq('yil', suAnkiYil);

    if (dData) setDaireler(dData);
    if (aData && aData[0]) setGuncelAidat(Number(aData[0].tutar));
    if (tData) setTahsilatlar(tData);
    setYukleniyor(false);
  }

  const getHucreDurumu = (daire: any, ayIdx: number) => {
    if (daire.muaf_mi) return "bg-slate-100 text-slate-400";
    const ay = ayIdx + 1;
    const toplamOdenen = tahsilatlar.filter(t => t.daire_no === daire.daire_no).reduce((sum, curr) => sum + Number(curr.tutar), 0);
    const buAyaKadarGereken = ay * guncelAidat;
    const birOncekiAyaKadarGereken = (ay - 1) * guncelAidat;
    const isGelecekAy = ayIdx > suAnkiAyIdx;

    if (toplamOdenen >= buAyaKadarGereken) return "bg-emerald-500 text-white font-bold";
    if (toplamOdenen > birOncekiAyaKadarGereken) return "bg-blue-400 text-white font-bold";
    return isGelecekAy ? "bg-amber-100 text-amber-700" : "bg-red-500 text-white font-bold";
  };

  if (yukleniyor) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">VERİLER YÜKLENİYOR...</div>;

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 pb-32 shadow-2xl relative border-x border-slate-200 font-sans">
      {/* Şık Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md p-5 flex justify-between items-center z-40 border-b">
        <Link href="/" className="text-slate-400 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
        </Link>
        <h1 className="text-[11px] font-black text-slate-800 tracking-[0.2em] uppercase italic">Aidat Çizelgesi</h1>
        <div className="w-10"></div>
      </header>

      {/* Kaydırılabilir Tablo Alanı */}
      <div className="relative overflow-x-auto shadow-inner">
        <table className="w-full text-[10px] border-collapse min-w-[900px]">
          <thead className="sticky top-0 z-30">
            <tr className="bg-slate-900 text-white uppercase tracking-tighter italic">
              <th className="p-3 border-r border-slate-700 sticky left-0 z-40 bg-slate-900">No</th>
              <th className="p-3 border-r border-slate-700 sticky left-[45px] z-40 bg-slate-900 text-left">Sakin</th>
              <th className="p-3 border-r border-slate-700 bg-orange-600">Devir</th>
              {aylar.map(ay => <th key={ay} className="p-3 border-r border-slate-700">{ay.substring(0,3)}</th>)}
            </tr>
          </thead>
          <tbody>
            {daireler.map((daire) => (
              <tr key={daire.id} className="border-b bg-white">
                <td className="p-3 border-r font-black sticky left-0 z-20 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-center w-[45px]">
                  {daire.daire_no}
                </td>
                <td className="p-3 border-r font-bold sticky left-[45px] z-20 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-left truncate max-w-[80px]">
                  {daire.sakin_adi || '-'}
                </td>
                <td className="p-3 border-r bg-orange-50 text-orange-700 font-black text-center whitespace-nowrap">
                  {daire.devir_borcu_2025 || 0} ₺
                </td>
                {aylar.map((_, idx) => (
                  <td key={idx} className={`p-3 border-r text-center whitespace-nowrap transition-colors ${getHucreDurumu(daire, idx)}`}>
                    {daire.muaf_mi ? '—' : guncelAidat + ' ₺'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Renk Açıklamaları */}
      <div className="p-5 space-y-3">
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Gösterge Paneli</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-[8px] font-black text-slate-600">TAM ÖDENDİ</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-[8px] font-black text-slate-600">KISMEN ÖDENDİ</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-[8px] font-black text-slate-600">GECİKMİŞ BORÇ</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="w-3 h-3 bg-amber-100 rounded-full border border-amber-300"></div>
            <span className="text-[8px] font-black text-slate-600">GELECEK AY</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm col-span-2">
            <div className="w-3 h-3 bg-slate-100 rounded-full"></div>
            <span className="text-[8px] font-black text-slate-600">YÖNETİCİ / MUAF DURUM</span>
          </div>
        </div>
      </div>

      {/* Alt Menü */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] bg-slate-900/95 backdrop-blur-md text-white flex justify-around p-4 rounded-[2rem] shadow-2xl z-50">
        <Link href="/" className="flex flex-col items-center gap-1 opacity-60">🏠</Link>
        <Link href="/kasa" className="flex flex-col items-center gap-1 opacity-60">💰</Link>
        <Link href="/demirbas" className="flex flex-col items-center gap-1 opacity-60">🏢</Link>
        <Link href="/aidat-tablosu" className="flex flex-col items-center gap-1">📅</Link>
      </nav>
    </main>
  );
}
