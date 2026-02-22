'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function Demirbas() {
  const [giderler, setGiderler] = useState<any[]>([]);
  const [yeniGider, setYeniGider] = useState({ aciklama: '', toplam: '' });
  const [kasa, setKasa] = useState(0);

  useEffect(() => { verileriGetir(); }, []);

  async function verileriGetir() {
    const { data: gData } = await supabase.from('demirbas_giderleri').select('*, demirbas_odemeleri(*)').order('created_at', { ascending: false });
    if (gData) {
      setGiderler(gData);
      // Demirbaş Kasası Hesaplama: (Alınan Ödemeler - Yapılan Toplam Gider Ödemeleri)
      let toplamAlinan = 0;
      let toplamOdenenGider = 0;
      gData.forEach(g => {
        if (g.odendi_mi) toplamOdenenGider += Number(g.toplam_tutar);
        g.demirbas_odemeleri.forEach((o: any) => {
          if (o.odeme_yapildi) toplamAlinan += Number(g.daire_basi_tutar);
        });
      });
      setKasa(toplamAlinan - toplamOdenenGider);
    }
  }

  const giderEkle = async () => {
    const dBasina = Number(yeniGider.toplam) / 12;
    const { data, error } = await supabase.from('demirbas_giderleri').insert([{
      aciklama: yeniGider.aciklama,
      toplam_tutar: Number(yeniGider.toplam),
      daire_basi_tutar: dBasina
    }]).select();

    if (data) {
      const odemeSatirlari = Array.from({ length: 12 }, (_, i) => ({
        demirbas_id: data[0].id,
        daire_no: i + 1,
        odeme_yapildi: false
      }));
      await supabase.from('demirbas_odemeleri').insert(odemeSatirlari);
      setYeniGider({ aciklama: '', toplam: '' });
      verileriGetir();
    }
  };

  const odemeGuncelle = async (odemeId: string, durum: boolean) => {
    await supabase.from('demirbas_odemeleri').update({
      odeme_yapildi: durum,
      odeme_tarihi: durum ? new Date().toISOString() : null
    }).eq('id', odemeId);
    verileriGetir();
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 pb-20 border-x">
      <div className="bg-indigo-900 text-white p-6 rounded-b-[2.5rem] shadow-xl text-center">
        <h1 className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]">🏢 Demirbaş Kasası</h1>
        <div className="text-3xl font-black mt-2">{kasa.toLocaleString('tr-TR')} ₺</div>
      </div>

      <div className="p-4 space-y-6">
        {/* Yeni Gider Girişi */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-50">
          <input placeholder="Gider Açıklaması (Örn: Çatı Onarımı)" value={yeniGider.aciklama} onChange={e=>setYeniGider({...yeniGider, aciklama: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl mb-3 outline-none font-bold" />
          <div className="flex gap-2 items-center mb-3">
            <input type="number" placeholder="Toplam Tutar" value={yeniGider.toplam} onChange={e=>setYeniGider({...yeniGider, toplam: e.target.value})} className="flex-1 p-3 bg-slate-50 rounded-xl outline-none font-bold" />
            <div className="bg-indigo-50 px-4 py-3 rounded-xl text-[10px] font-black text-indigo-600 uppercase">
              Daire: {(Number(yeniGider.toplam)/12 || 0).toFixed(0)} ₺
            </div>
          </div>
          <button onClick={giderEkle} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black uppercase text-xs">Yeni Demirbaş Gideri Tanımla</button>
        </section>

        {/* Liste */}
        {giderler.map(gider => (
          <div key={gider.id} className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-800 uppercase text-xs">{gider.aciklama}</h3>
                <p className="text-[10px] text-slate-400 font-bold">Toplam: {gider.toplam_tutar} ₺ | Daire: {gider.daire_basi_tutar} ₺</p>
              </div>
              <input type="checkbox" checked={gider.odendi_mi} className="w-5 h-5 accent-indigo-600" />
            </div>

            <div className="grid grid-cols-2 gap-2 p-3">
              {gider.demirbas_odemeleri.sort((a:any,b:any)=>a.daire_no - b.daire_no).map((o:any) => (
                <div key={o.id} className={`p-2 rounded-xl border flex flex-col items-center ${o.odeme_yapildi ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex justify-between w-full items-center mb-1 px-1">
                    <span className="font-black text-[10px]">D {o.daire_no}</span>
                    <input type="checkbox" checked={o.odeme_yapildi} onChange={e => odemeGuncelle(o.id, e.target.checked)} />
                  </div>
                  {o.odeme_yapildi && <p className="text-[8px] font-bold text-emerald-600 italic">{new Date(o.odeme_tarihi).toLocaleDateString('tr-TR')} Ödendi</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
