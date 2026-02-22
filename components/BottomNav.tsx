'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  icon: string;
  label: string;
};

const ITEMS: NavItem[] = [
  { href: '/', icon: '🏠', label: 'Ana Sayfa' },
  { href: '/yonetim', icon: '⚙️', label: 'Yönetim' },
  { href: '/giderler', icon: '🧾', label: 'Giderler' },
  { href: '/rapor', icon: '📊', label: 'Raporlar' },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // "/" sadece ana sayfada aktif olsun
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] z-50">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-3xl shadow-2xl border border-white/10 px-2 py-2">
        <div className="flex justify-around">
          {ITEMS.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex flex-col items-center justify-center gap-1',
                  'px-3 py-2 rounded-2xl transition',
                  'min-w-[72px]', // mobilde etiketler taşmasın
                  active ? 'bg-white/10' : 'opacity-70 hover:opacity-100 hover:bg-white/5',
                ].join(' ')}
              >
                <span className={active ? 'text-xl' : 'text-lg'}>{item.icon}</span>
                <span className="text-[10px] leading-none font-black tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
