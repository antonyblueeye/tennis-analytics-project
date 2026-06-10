'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LineChartDemo from './components/LineChartDemo';

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
      <section className="hero">
        <div className="hero-tag">Overview</div>
        <h1 className="hero-title">
          Tennis <span>Dashboard</span>
        </h1>
        <p className="hero-subtitle">
          Comprehensive statistics and data analytics of professional tennis players, matches and rankings.
        </p>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-inner">
            <div className="stat-label">Total Registered Players</div>
            {loading ? (
              <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2px' }} />
            ) : error ? (
              <div className="stat-value" style={{ color: '#dc4c4c', fontSize: '24px' }}>Error</div>
            ) : (
              <div className="stat-value accent">
                {totalPlayers?.toLocaleString() || '0'}
              </div>
            )}
            <Link href="/players" className="stat-link">
              Search database →
            </Link>
          </div>
        </div>

        <div className="stat-card dimmed">
          <div className="stat-card-inner">
            <div className="stat-label">Matches Logged</div>
            <div className="stat-value muted">—</div>
            <span className="stat-badge">Coming Soon</span>
          </div>
        </div>

        <div className="stat-card dimmed">
          <div className="stat-card-inner">
            <div className="stat-label">Tournaments Tracked</div>
            <div className="stat-value muted">—</div>
            <span className="stat-badge">Coming Soon</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <LineChartDemo />
      </div>      
      
    </div>
  );
}
