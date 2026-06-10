'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface RankingPoint {
  ranking_date: string;
  rank: number;
}

interface Props {
  data: RankingPoint[];
}

export default function RankingHistoryChart({ data }: Props) {
  const chartData = [...data].reverse();

  return (
    <div className="analytics-card">
      <h3 className="analytics-title">Ranking History</h3>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
             data={chartData}
             margin={{
               top: 20,
               right: 30,
               left: 30,
               bottom: 20,
             }}
            >
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

          <XAxis
            dataKey="ranking_date"
            tick={{ fontSize: 12 }}
            minTickGap={40}
            padding={{ left: 30, right: 30 }}
          />

          <YAxis
            reversed
            domain={[
                (dataMin: number) => Math.max(1, dataMin - 30),
                (dataMax: number) => dataMax + 30,
              ]}
            tick={{ fontSize: 12 }}
            padding={{ top: 30, bottom: 30 }}
          />

            <Tooltip
            contentStyle={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: '12px',
                color: '#fff'
            }}
            />

          <Line
            type="monotone"
            dataKey="rank"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            filter="url(#glow)"
          />


        <defs>
        <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        </defs>

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}