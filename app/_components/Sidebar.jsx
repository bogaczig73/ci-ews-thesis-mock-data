'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icons.jsx';

const nav = [
  { href: '/', label: 'Dashboard', icon: 'home' },
  { href: '/listings', label: 'Listings', icon: 'building', tag: 'Sreality' },
  { href: '/agencies', label: 'Agencies', icon: 'users', tag: 'Sreality' },
  { href: '/sellers', label: 'Sellers', icon: 'user', tag: 'Sreality' },
  { href: '/rss', label: 'RSS feeds', icon: 'rss', tag: 'PSP·MMR·ČSÚ·ČNB' },
  { href: '/ares', label: 'ARES', icon: 'briefcase', tag: 'Registry' },
  { href: '/api-docs', label: 'API reference', icon: 'code' },
];

export default function Sidebar() {
  const path = usePathname();
  const isActive = (href) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-1 px-4 py-6 border-r border-slate-200/70 bg-white/60 backdrop-blur min-h-screen sticky top-0">
      <Link href="/" className="flex items-center gap-2.5 px-2 mb-6">
        <span className="grid place-items-center w-9 h-9 rounded-xl text-white shadow-sm"
          style={{ backgroundImage: 'linear-gradient(135deg, rgb(99,102,241), rgb(79,70,229))' }}>
          <Icon.db className="w-5 h-5" />
        </span>
        <span className="leading-tight">
          <span className="block font-semibold text-slate-800">Mock Data Hub</span>
          <span className="block text-[11px] text-slate-400">EWS synthetic sources</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {nav.map((n) => {
          const active = isActive(n.href);
          const I = Icon[n.icon];
          return (
            <Link key={n.href} href={n.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition
                ${active ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm ring-1 ring-indigo-100'
                         : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'}`}>
              <I className={`w-[18px] h-[18px] ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className="flex-1">{n.label}</span>
              {n.tag && <span className="text-[9px] uppercase tracking-wider text-slate-300 group-hover:text-slate-400">{n.tag}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pt-6">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Neon Postgres · live
        </div>
        <p className="text-[10px] text-slate-300 mt-1">VŠE diplomka</p>
      </div>
    </aside>
  );
}
