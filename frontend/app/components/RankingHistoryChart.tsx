'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
  Label,
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
  const bestPoint = chartData.reduce((best, point) => {
    return point.rank < best.rank ? point : best;
  }, chartData[0]);

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

          <CartesianGrid
            stroke="#B2B2B2"
            strokeWidth={1}
            strokeOpacity={0.4}
          />

          <Line
            type="monotone"
            dataKey="rank"
            stroke="#10b981"
            strokeWidth={2  }
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
          />

        {/* 🏆 BEST RANK */}
        <ReferenceDot
          x={bestPoint.ranking_date}
          y={bestPoint.rank}
          r={5}
          fill="#10b981"
          stroke="#0f172a"
          strokeWidth={2}
        />

        <Label
          value={`Best Ranking: #${bestPoint.rank} on ${bestPoint.ranking_date}`}
          position="top"
          fill="#10b981"
          fontSize={12}
          fontWeight={600}
        />

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}