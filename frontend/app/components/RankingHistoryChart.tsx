'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';

interface RankingPoint {
  ranking_date: string;
  rank: number;
  points?: number;
}

interface Props {
  data: RankingPoint[];
}

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: RankingPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rank-chart-tooltip">
      <p className="rank-chart-tooltip-date">{formatFullDate(point.ranking_date)}</p>
      <p className="rank-chart-tooltip-rank">#{point.rank}</p>
      {point.points != null && (
        <p className="rank-chart-tooltip-points">{point.points.toLocaleString()} pts</p>
      )}
    </div>
  );
}

export default function RankingHistoryChart({ data }: Props) {
  const chartData = useMemo(
    () =>
      [...data]
        .reverse()
        .map((p) => ({
          ...p,
          label: formatChartDate(p.ranking_date),
        })),
    [data]
  );

  const current = data[0];
  const bestPoint = useMemo(
    () => chartData.reduce((best, p) => (p.rank < best.rank ? p : best), chartData[0]),
    [chartData]
  );

  const yMin = useMemo(
    () => Math.max(1, Math.min(...chartData.map((p) => p.rank)) - 20),
    [chartData]
  );
  const yMax = useMemo(
    () => Math.max(...chartData.map((p) => p.rank)) + 30,
    [chartData]
  );

  const yAxisWidth = useMemo(() => {
    const longest = Math.max(`#${yMin}`.length, `#${yMax}`.length);
    return Math.max(52, longest * 9 + 8);
  }, [yMin, yMax]);

  if (!chartData.length) return null;

  return (
    <div className="rank-chart-card">
      <div className="rank-chart-header">
        <div>
          <h3 className="rank-chart-title">Ranking history</h3>
          <p className="rank-chart-sub">ATP singles · career trajectory</p>
        </div>
        <div className="rank-chart-stats">
          {current && (
            <div className="rank-chart-stat rank-chart-stat-current">
              <span className="rank-chart-stat-val">#{current.rank}</span>
              <span className="rank-chart-stat-lbl">Current</span>
              {current.points != null && (
                <span className="rank-chart-stat-pts">{current.points.toLocaleString()} pts</span>
              )}
            </div>
          )}
          {bestPoint && (
            <div className="rank-chart-stat rank-chart-stat-best">
              <span className="rank-chart-stat-val">#{bestPoint.rank}</span>
              <span className="rank-chart-stat-lbl">Career best</span>
              <span className="rank-chart-stat-pts">{formatFullDate(bestPoint.ranking_date)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rank-chart-body">
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 4, bottom: 12 }}
          >
            <defs>
              <linearGradient id="rankAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2a9663" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#2a9663" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="var(--border-soft)"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              minTickGap={48}
              dy={8}
            />

            <YAxis
              reversed
              domain={[yMin, yMax]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              width={yAxisWidth}
              padding={{ top: 20, bottom: 20 }}
              allowDecimals={false}
              tickFormatter={(v) => `#${v}`}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2a9663', strokeWidth: 1, strokeDasharray: '4 4' }} />

            <Area
              type="monotone"
              dataKey="rank"
              stroke="#227a51"
              strokeWidth={2.5}
              fill="url(#rankAreaGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#227a51',
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />

            <ReferenceDot
              x={bestPoint.label}
              y={bestPoint.rank}
              r={6}
              fill="#fbbf24"
              stroke="#fff"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
