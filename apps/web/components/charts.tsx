"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6"];

export function DailyTrendChart({
  data,
}: {
  data: { date: string; settlement: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => `¥${v.toFixed(2)}`} />
        <Line
          type="monotone"
          dataKey="settlement"
          name="结算金额"
          stroke="#16a34a"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PaymentPieChart({
  data,
}: {
  data: { status: string; amount: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ status, percent }) =>
            `${status} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => `¥${v.toFixed(2)}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BarRankChart({
  data,
  dataKey,
  nameKey,
  label,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  nameKey: string;
  label: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data.slice(0, 12)} layout="vertical" margin={{ left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey={nameKey} width={80} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => `¥${v.toFixed(2)}`} />
        <Legend />
        <Bar dataKey={dataKey} name={label} fill="#16a34a" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VenueBarChart({
  data,
}: {
  data: { venueCode: string; settlementAmount: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="venueCode" />
        <YAxis />
        <Tooltip formatter={(v: number) => `¥${v.toFixed(2)}`} />
        <Bar dataKey="settlementAmount" name="结算金额" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PriceLineChart({
  data,
}: {
  data: { date: string; shuangfu: number | null; alliance: number | null; member: number | null }[];
}) {
  const byDate = new Map<string, typeof data>();
  for (const row of data) {
    const key = row.date;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(row);
  }
  const chartData = [...byDate.entries()]
    .slice(0, 30)
    .map(([date, rows]) => {
      const r = rows[0];
      return {
        date,
        双福价: r.shuangfu,
        集采价: r.alliance,
        会员价: r.member,
      };
    });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="双福价" stroke="#0ea5e9" dot={false} />
        <Line type="monotone" dataKey="集采价" stroke="#16a34a" dot={false} />
        <Line type="monotone" dataKey="会员价" stroke="#f59e0b" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
