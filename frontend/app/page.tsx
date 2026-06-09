'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/players/count');
        if (!res.ok) throw new Error('Failed to fetch count');
        const data = await res.json();
        setTotalPlayers(data.count);
      } catch (err) {
        console.error('Error fetching player count:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="page-content">
      {/* Hero Header */}
      <section className="hero" style={{ padding: '48px 0 32px 0' }}>
        <div className="hero-tag">📊 Overview</div>
        <h1 className="hero-title">
          Tennis <span>Dashboard</span>
        </h1>
        <p className="hero-subtitle">
          Comprehensive statistics and data analytics of professional tennis players, matches and rankings.
        </p>
      </section>

      {/* Stats Cards Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginTop: '32px'
        }}
      >
        {/* Total Players Card */}
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '160px' }}>
          <div className="stat-label" style={{ marginBottom: '8px' }}>Total Registered Players</div>
          {loading ? (
            <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2px' }} />
          ) : error ? (
            <div className="stat-value" style={{ color: '#ef4444' }}>Error</div>
          ) : (
            <div className="stat-value">
              {totalPlayers?.toLocaleString() || '0'}
            </div>
          )}
          <Link 
            href="/players" 
            style={{ 
              marginTop: '16px', 
              fontSize: '13px', 
              color: 'var(--green-600)', 
              textDecoration: 'none', 
              fontWeight: '600'
            }}
          >
            Search database →
          </Link>
        </div>

        {/* Matches Card Placeholder */}
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '160px', opacity: 0.8 }}>
          <div className="stat-label" style={{ marginBottom: '8px' }}>Matches Logged</div>
          <div className="stat-value" style={{ color: 'var(--text-muted)' }}>
            —
          </div>
          <span style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🎾 Coming Soon
          </span>
        </div>

        {/* Tournaments Card Placeholder */}
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '160px', opacity: 0.8 }}>
          <div className="stat-label" style={{ marginBottom: '8px' }}>Tournaments tracked</div>
          <div className="stat-value" style={{ color: 'var(--text-muted)' }}>
            —
          </div>
          <span style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🏆 Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}