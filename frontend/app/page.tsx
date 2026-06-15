'use client';

import { useState } from 'react';
import DateRangePicker, { getInitialDateRange, type DateRange } from './components/DateRangePicker';
import DashboardStubs from './components/DashboardStubs';

export default function DashboardPage() {
  const initial = getInitialDateRange();
  const [range, setRange] = useState<DateRange>(initial.range);

  return (
    <div className="page-content">
      <section className="hero dash-hero">
        <div className="dash-hero-text">
          <div className="hero-tag">Overview</div>
          <h1 className="hero-title">
            Tennis <span>Dashboard</span>
          </h1>
          <p className="hero-subtitle">
            Season snapshot — matches, tournaments, and standout moments for your selected period.
          </p>
        </div>
        <DateRangePicker
          value={range}
          onChange={(next) => setRange(next)}
        />
      </section>

      <DashboardStubs range={range} />
    </div>
  );
}
