'use client';

const navItems = [
  { icon: '🔍', label: 'Player Search', href: '/',            active: true },
  { icon: '📊', label: 'Tournaments',   href: '/tournaments'              },
  { icon: '📈', label: 'Rankings',      href: '/rankings'                 },
  { icon: '⚡', label: 'Matches',       href: '/matches'                  },
];

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <a href="/" className="header-logo">
          <div className="header-logo-icon" aria-hidden>🎾</div>
          <span className="header-logo-text">
            Tennis<span>Analytics</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="header-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`nav-link${item.active ? ' active' : ''}`}
            >
              <span className="nav-link-icon" aria-hidden>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="header-actions">
          <span className="header-badge">Live</span>
        </div>
      </div>
    </header>
  );
}
