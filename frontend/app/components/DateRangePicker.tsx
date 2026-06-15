'use client';

import { useEffect, useRef, useState } from 'react';

export interface DateRange {
  from: Date;
  to: Date;
}

type PresetId = 'this-month' | 'this-year' | 'last-year';

const PRESETS: { id: PresetId; label: string }[] = [
  { id: 'this-month', label: 'This month' },
  { id: 'this-year', label: 'This year' },
  { id: 'last-year', label: 'Last year' },
];

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(day: Date, from: Date, to: Date) {
  const t = day.getTime();
  return t >= startOfDay(from).getTime() && t <= startOfDay(to).getTime();
}

function getPresetRange(id: PresetId): DateRange {
  const now = new Date();
  const y = now.getFullYear();

  if (id === 'this-month') {
    return {
      from: startOfDay(new Date(y, now.getMonth(), 1)),
      to: startOfDay(new Date(y, now.getMonth() + 1, 0)),
    };
  }
  if (id === 'last-year') {
    return { from: new Date(y - 1, 0, 1), to: new Date(y - 1, 11, 31) };
  }
  return { from: new Date(y, 0, 1), to: new Date(y, 11, 31) };
}

function getDefaultRange(): DateRange {
  return getPresetRange('this-year');
}

function formatShort(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange, preset: PresetId | null) => void;
}

export function getInitialDateRange(): { range: DateRange; preset: PresetId } {
  return { range: getDefaultRange(), preset: 'this-year' };
}

export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetId | null>('this-year');
  const [viewMonth, setViewMonth] = useState(() => value.from.getMonth());
  const [viewYear, setViewYear] = useState(() => value.from.getFullYear());
  const [pickStart, setPickStart] = useState<Date | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPickStart(null);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const applyPreset = (id: PresetId) => {
    const range = getPresetRange(id);
    setActivePreset(id);
    setViewMonth(range.from.getMonth());
    setViewYear(range.from.getFullYear());
    onChange(range, id);
    setPickStart(null);
  };

  const handleDayClick = (day: Date) => {
    setActivePreset(null);
    if (!pickStart) {
      setPickStart(day);
      onChange({ from: day, to: day }, null);
      return;
    }
    const from = pickStart <= day ? pickStart : day;
    const to = pickStart <= day ? day : pickStart;
    onChange({ from, to }, null);
    setPickStart(null);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const nextMonthIndex = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  const renderMonth = (year: number, month: number) => {
    const cells = buildMonthGrid(year, month);
    return (
      <div className="drp-month">
        <p className="drp-month-title">{MONTHS[month]} {year}</p>
        <div className="drp-weekdays">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="drp-days">
          {cells.map((day, i) => {
            if (!day) return <span key={`e-${i}`} className="drp-day drp-day-empty" />;
            const inRange = isInRange(day, value.from, value.to);
            const isStart = isSameDay(day, value.from);
            const isEnd = isSameDay(day, value.to);
            const isEdge = isStart || isEnd;
            return (
              <button
                key={day.toISOString()}
                type="button"
                className={[
                  'drp-day',
                  inRange && 'drp-day-in-range',
                  isEdge && 'drp-day-edge',
                  isStart && 'drp-day-start',
                  isEnd && 'drp-day-end',
                  pickStart && isSameDay(day, pickStart) && 'drp-day-pending',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleDayClick(day)}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="drp" ref={wrapRef}>
      <div className="drp-presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`drp-preset ${activePreset === p.id ? 'drp-preset-active' : ''}`}
            onClick={() => applyPreset(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="drp-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="drp-trigger-icon" aria-hidden>📅</span>
        <span className="drp-trigger-text">
          {formatShort(value.from)} – {formatShort(value.to)}
        </span>
        <span className="drp-trigger-chevron" aria-hidden>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="drp-popover">
          <div className="drp-popover-head">
            <button type="button" className="drp-nav" onClick={prevMonth} aria-label="Previous month">
              ‹
            </button>
            <span className="drp-popover-hint">Select start, then end date</span>
            <button type="button" className="drp-nav" onClick={nextMonth} aria-label="Next month">
              ›
            </button>
          </div>
          <div className="drp-calendars">
            {renderMonth(viewYear, viewMonth)}
            {renderMonth(nextMonthYear, nextMonthIndex)}
          </div>
        </div>
      )}
    </div>
  );
}
