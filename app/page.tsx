import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-10 bg-gray-50">
      <h1 className="text-4xl font-bold text-slate-800 mb-12 text-center">
        🏢 Apartman Yönetim Paneli
      </h1>

      <div className="flex flex-col gap-6 w-full max-w-md">
        <Link href="/yonetim" className="p-6 bg-blue-600 text-white rounded-xl text-center text-xl font-semibold shadow-lg hover:bg-blue-700 transition">
          Yönetim Sayfası
        </Link>
        <Link href="/rapor" className="p-6 bg-emerald-600 text-white rounded-xl text-center text-xl font-semibold shadow-lg hover:bg-emerald-700 transition">
          Rapor Sayfası
        </Link>
      </div>
    </main>
  );
}
