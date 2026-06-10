"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// 🔥 фейковые данные
const data = [
  { name: "Mon", value: 12 },
  { name: "Tue", value: 19 },
  { name: "Wed", value: 3 },
  { name: "Thu", value: 5 },
  { name: "Fri", value: 2 },
  { name: "Sat", value: 30 },
  { name: "Sun", value: 22 },
];

export default function LineChartDemo() {
  return (
    <div
      style={{
        width: "100%",
        height: 400,
        background: "white",
        borderRadius: 30,
        padding: 30,
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}