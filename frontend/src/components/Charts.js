import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label, formatValue }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 rounded-lg border border-border shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatValue ? formatValue(entry.value) : entry.value.toLocaleString('vi-VN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatMoney = (value) => {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString('vi-VN');
};

export const RevenueChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis 
          dataKey="label" 
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '11px' }}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '11px' }}
          tickFormatter={formatMoney}
        />
        <Tooltip content={<CustomTooltip formatValue={(v) => v.toLocaleString('vi-VN') + 'đ'} />} />
        <Legend 
          wrapperStyle={{ paddingTop: '10px' }}
          iconType="circle"
        />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Doanh thu"
          stroke="#06B6D4"
          strokeWidth={2.5}
          dot={{ fill: '#06B6D4', r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="profit"
          name="Lợi nhuận"
          stroke="#10B981"
          strokeWidth={2.5}
          dot={{ fill: '#10B981', r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="expense"
          name="Chi phí"
          stroke="#F59E0B"
          strokeWidth={2.5}
          dot={{ fill: '#F59E0B', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const OrderStatusChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity={1} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis 
          dataKey="name" 
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="count" 
          name="Số đơn"
          fill="url(#barGradient)" 
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

const STATUS_COLORS = {
  'Chưa mua': '#F59E0B',
  'Đã mua': '#3B82F6',
  'Đã giao': '#8B5CF6',
  'Hoàn tất': '#10B981',
};

export const OrderStatusDonut = ({ data }) => {
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={4}
          stroke="hsl(var(--card))"
          strokeWidth={3}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#6B7280'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip formatValue={(v) => `${v} đơn`} />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(value, entry) => {
            const item = data.find(d => d.name === value);
            const pct = totalCount > 0 ? ((item?.count || 0) / totalCount * 100).toFixed(0) : 0;
            return <span className="text-xs text-foreground">{value} ({item?.count || 0} - {pct}%)</span>;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
