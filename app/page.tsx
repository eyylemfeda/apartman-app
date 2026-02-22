'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type IslemTipi = 'gelir' | 'gider';

type SonIslem = {
  tip: IslemTipi;

  // DB primary key (uuid)
  id: string;

  // UI
  etiket: string;
  tutar: number;
  odeme_tipi?: string | null;
  islem_tarihi: string;

  // delete için hangi tablo
  sourceTable: 'tahsilatlar' | 'giderler';
};

export default function Home() {
  const [daireler, setDaireler] = useState<any[]>([]);
  const [daireNo, setDaireNo] = useState('');
  const [tutar, setTutar] = useState('');
  const [odemeTipi, setOdemeTipi] = useState<'Nakit' | 'Banka'>('Nakit');
  const [sonIslemler, setSonIslemler] = useState<SonIslem[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    verileriGetir();
  }, []);

  const normalizeTarih = (x: any): string | null => {
    return x?.created_at || x?.tarih || null;
  };

  async function verileriGetir() {
    // 1) Daireler
    const { data: dData, error: dErr } = await supabase
      .from('daireler')
      .select('daire_no, sakin_adi')
      .order('daire_no');

    if (dErr) {
      console.error('daireler hata:', dErr?.message, dErr?.details, dErr?.hint, dErr?.code);
    }

    const daireList = dData || [];
    setDaireler(daireList);

    // daire_no -> sakin_adi map
    const daireMap = new Map<number, string>(
      daireList.map((d: any) => [Number(d.daire_no), String(d.sakin_adi || '')])
    );

    // 2) Tahsilatlar (id uuid, created_at var)
    const { data: tData, error: tErr } = await supabase
      .from('tahsilatlar')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (tErr) {
      console.error('tahsilatlar hata:', tErr?.message, tErr?.details, tErr?.hint, tErr?.code);
    }

    // 3) Giderler (created_at yoksa tarih'e düş)
    let giderData: any[] = [];

    const { data: g1, error: gErr1 } = await supabase
      .from('giderler')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!gErr1) {
      giderData = g1 || [];
    } else {
      console.warn('giderler created_at yok, tarih denenecek:',
        gErr1?.message, gErr1?.details, gErr1?.hint, gErr1?.code
      );

      const { data: g2, error: gErr2 } = await supabase
        .from('giderler')
        .select('*')
        .order('tarih', { ascending: false })
        .limit(10);

      if (gErr2) {
        console.error('giderler tarih ile de hata:',
          gErr2?.message, gErr2?.details, gErr2?.hint, gErr2?.code
        );
      }

      giderData = g2 || [];
    }

    // 4) Son işlemleri birleştir
    const gelirIslemleri: SonIslem[] = (tData || [])
      .map((x: any) => {
        const tarih = normalizeTarih(x);
        if (!tarih) return null;

        const dn = Number(x.daire_no);
        const sakin = daireMap.get(dn);
        const etiket = sakin ? `Daire ${dn} (${sakin})` : `Daire ${dn}`;

        return {
          tip: 'gelir',
          id: String(x.id), // uuid
          etiket,
          tutar: Number(x.tutar) || 0,
          odeme_tipi: x.odeme_tipi ?? null,
          islem_tarihi: tarih,
          sourceTable: 'tahsilatlar',
        } satisfies SonIslem;
      })
      .filter(Boolean) as SonIslem[];

    const giderIslemleri: SonIslem[] = (giderData || [])
      .map((x: any) => {
        const tarih = normalizeTarih(x);
        if (!tarih) return null;

        // giderler tablosunda PK id uuid değilse burada ayrıca düzeltiriz.
        // çoğu projede yine `id` vardır; yoksa console'da anlaşılır.
        if (!x.id) return null;

        return {
          tip: 'gider',
          id: String(x.id),
          etiket: x.baslik || 'Gider',
          tutar: Number(x.tutar) || 0,
          odeme_tipi: x.odeme_tipi ?? null,
          islem_tarihi: tarih,
          sourceTable: 'giderler',
        } satisfies SonIslem;
      })
      .filter(Boolean) as SonIslem[];

    const birlesik = [...gelirIslemleri, ...giderIslemleri]
      .sort((a, b) => new Date(b.islem_tarihi).getTime() - new Date(a.islem_tarihi).getTime())
      .slice(0, 5);

    setSonIslemler(birlesik);
  }

  const odemeKaydet = async () => {
    if (!daireNo || !tutar) return alert('Lütfen daire seçin ve tutar giriniz!');

    setYukleniyor(true);

    const simdi = new Date();
    const payload = {
      daire_no: Number(daireNo),
      tutar: Number(tutar),
      odeme_tipi: odemeTipi,
      yil: simdi.getFullYear(),
      ay: simdi.getMonth() + 1,
      created_at: simdi.toISOString(),
    };

    const { error } = await supabase.from('tahsilatlar').insert([payload]);

    if (!error) {
      setDaireNo('');
      setTutar('');
      await verileriGetir();
      alert('Ödeme başarıyla kaydedildi! ✅');
    } else {
      alert('Hata oluştu: ' + error.message);
    }

    setYukleniyor(false);
  };

  const islemSil = async (islem: SonIslem) => {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;

    // UI'dan anında düş (optimistic)
    setSonIslemler((prev) => prev.filter((x) => !(x.tip === islem.tip && x.id === islem.id)));

    // DB'den sil ve gerçekten silindi mi kontrol et
    const { data: deletedRows, error } = await supabase
      .from(islem.sourceTable)
      .delete()
      .eq('id', islem.id) // tahsilatlar.id = uuid
      .select('id');

    if (error) {
      alert('Silme hatası: ' + error.message);
      // geri yükle (güvenli yol)
      await verileriGetir();
      return;
    }

    if (!deletedRows || deletedRows.length === 0) {
      alert('Kayıt silinemedi (id eşleşmedi).');
      await verileriGetir();
      return;
    }

    // DB'den tekrar çekip kesinleştir
    await verileriGetir();
    alert('İşlem başarıyla silindi. ✅');
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 pb-32 shadow-2xl relative border-x border-slate-200">
      <header className="bg-white p-6 pt-10 text-center border-b rounded-b-[3rem] shadow-sm">
        <h1 className="text-2xl font-black text-slate-800 uppercase italic">Çağdaş Apartmanı</h1>
        <div className="flex justify-center gap-2 mt-2">
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase italic tracking-tighter">
            Yönetici Paneli
          </span>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* HIZLI TAHSILAT */}
        <section className="bg-white p-5 rounded-[2.5rem] shadow-md border border-slate-100">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">
            Hızlı Tahsilat Girişi
          </h2>

          <div className="space-y-3">
            <select
              value={daireNo}
              onChange={(e) => setDaireNo(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 appearance-none"
            >
              <option value="">Daire Seçiniz</option>
              {daireler.map((d) => (
                <option key={d.daire_no} value={d.daire_no}>
                  Daire {d.daire_no} ({d.sakin_adi})
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Tutar (₺)"
              value={tutar}
              onChange={(e) => setTutar(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500"
            />

            <div className="flex bg-slate-50 p-1.5 rounded-2xl border">
              <button
                onClick={() => setOdemeTipi('Nakit')}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                  odemeTipi === 'Nakit' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'
                }`}
              >
                💵 NAKİT
              </button>

              <button
                onClick={() => setOdemeTipi('Banka')}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                  odemeTipi === 'Banka' ? 'bg-white shadow text-blue-600' : 'text-slate-400'
                }`}
              >
                🏦 BANKA
              </button>
            </div>

            <button
              onClick={odemeKaydet}
              disabled={yukleniyor}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg disabled:opacity-60"
            >
              {yukleniyor ? 'KAYDEDİLİYOR...' : 'KAYDI TAMAMLA'}
            </button>
          </div>
        </section>

        {/* MENU */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/yonetim" className="bg-white p-4 rounded-2xl flex flex-col items-center border shadow-sm">
            <span className="text-xl mb-1">⚙️</span>
            <span className="text-[8px] font-black uppercase italic">Yönetim</span>
          </Link>

          <Link
            href="/aidat-tablosu"
            className="bg-white p-4 rounded-2xl flex flex-col items-center border shadow-sm border-b-2 border-b-amber-400"
          >
            <span className="text-xl mb-1">📅</span>
            <span className="text-[8px] font-black uppercase italic">Çizelge</span>
          </Link>

          <Link
            href="/giderler"
            className="bg-white p-4 rounded-2xl flex flex-col items-center border shadow-sm border-b-2 border-b-red-400"
          >
            <span className="text-xl mb-1">🧾</span>
            <span className="text-[8px] font-black uppercase italic">Giderler</span>
          </Link>

          <Link href="/kasa" className="bg-white p-4 rounded-2xl flex flex-col items-center border shadow-sm">
            <span className="text-xl mb-1">💰</span>
            <span className="text-[8px] font-black uppercase italic">Kasa</span>
          </Link>

          <Link
            href="/demirbas"
            className="bg-white p-4 rounded-2xl flex flex-col items-center border shadow-sm border-b-2 border-b-indigo-400"
          >
            <span className="text-xl mb-1">🏢</span>
            <span className="text-[8px] font-black uppercase italic">Demirbaş</span>
          </Link>

          <Link
            href="/rapor"
            className="bg-white p-4 rounded-2xl flex flex-col items-center border shadow-sm border-b-2 border-b-emerald-400"
          >
            <span className="text-xl mb-1">📊</span>
            <span className="text-[8px] font-black uppercase italic">Raporlar</span>
          </Link>
        </div>

        {/* SON HAREKETLER */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2 italic">
            Son Hareketler
          </h3>

          <div className="space-y-2">
            {sonIslemler.length === 0 ? (
              <div className="text-center p-10 text-slate-300 text-xs font-bold bg-white rounded-3xl border border-dashed">
                Henüz hareket yok.
              </div>
            ) : (
              sonIslemler.map((islem) => (
                <div
                  key={`${islem.tip}-${islem.id}`} // çakışmayı önler
                  className="group p-4 rounded-2xl flex justify-between items-center bg-white border border-slate-100 shadow-sm transition-all hover:border-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        islem.tip === 'gelir'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {islem.tip === 'gelir' ? '↓' : '↑'}
                    </div>

                    <div>
                      <p className="text-xs font-black text-slate-700 uppercase tracking-tighter">
                        {islem.etiket}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 italic">
                        {islem.odeme_tipi || '-'} •{' '}
                        {new Date(islem.islem_tarihi).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p
                      className={`text-sm font-black ${
                        islem.tip === 'gelir' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {islem.tip === 'gelir' ? '+' : '-'}
                      {islem.tutar} ₺
                    </p>

                    <button
                      onClick={() => islemSil(islem)}
                      className="text-[10px] bg-slate-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50"
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
