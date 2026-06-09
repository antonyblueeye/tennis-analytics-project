'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { icon: '📊', label: 'Dashboard',    href: '/' },
  { icon: '👥', label: 'Players',      href: '/players' },
  { icon: '🎾', label: 'Matches',      href: '/matches' },
  { icon: '⚔️', label: 'Head-to-Head', href: '/head-to-head' },
  { icon: '📈', label: 'Rankings',     href: '/rankings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/" className="sidebar-logo">
        <div className="sidebar-logo-icon" aria-hidden>🎾</div>
        <span className="sidebar-logo-text">
          Tennis<span>Analytics</span>
        </span>
      </Link>

      {/* Nav Items */}
      <nav className="sidebar-nav" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-link-icon" aria-hidden>{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer / Action */}
      <div className="sidebar-footer">
        <span className="sidebar-badge">Live Updates</span>
      </div>
    </aside>
  );
}
