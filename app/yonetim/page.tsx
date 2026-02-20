'use client'
import Link from 'next/link';
import { useState } from 'react';

export default function Yonetim() {
  // 12 dairelik boş bir şablon
  const [daireler, setDaireler] = useState(Array.from({ length: 12 }, (_, i) => ({
    no: i + 1,
    sakin: "",
    muaf: false
  })));

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <Link href="/" className="text-blue-600 hover:underline">← Ana Sayfaya Dön</Link>
        <h1 className="text-2xl font-bold text-slate-800">Daire ve Aidat Yönetimi</h1>
      </div>

      {/* Aidat Ayar Bölümü */}
      <section className="bg-white p-6 rounded-lg shadow mb-8 border-l-4 border-amber-500">
        <h2 className="font-semibold mb-4 underline">Güncel Aidat Ayarları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="number" placeholder="Aidat Tutarı (₺)" className="border p-2 rounded" />
          <input type="date" placeholder="Başlangıç Tarihi" className="border p-2 rounded" />
        </div>
        <p className="text-sm text-gray-500 mt-2">* Yeni tutar girilene kadar mevcut tutar tüm aylar için geçerli kalır.</p>
      </section>

      {/* 12 Dairelik Tablo */}
      <table className="w-full bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-3 text-left">Daire No</th>
            <th className="p-3 text-left">Sakin Adı Soyadı</th>
            <th className="p-3 text-center">Aidat Muafiyeti</th>
          </tr>
        </thead>
        <tbody>
          {daireler.map((daire) => (
            <tr key={daire.no} className="border-b">
              <td className="p-3 font-bold">{daire.no}</td>
              <td className="p-3">
                <input type="text" placeholder="İsim giriniz..." className="w-full border-b focus:border-blue-500 outline-none" />
              </td>
              <td className="p-3 text-center">
                <input type="checkbox" className="w-5 h-5" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md">
        Değişiklikleri Kaydet
      </button>
    </main>
  );
}
