import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, DollarSign, TrendingUp, AlertCircle,
  Coins, Scale, ShoppingCart, Wallet, CreditCard,
  Calendar, ChevronDown, AlertTriangle, ArrowRight,
  ShoppingBag, Loader2
} from 'lucide-react';
import { RevenueChart, OrderStatusDonut } from '../components/Charts';
import { dashboardAPI } from '../services/api';

const Dashboard = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = { month, year };
      const [statsRes, chartRes, alertsRes] = await Promise.all([
        dashboardAPI.getStats(params),
        dashboardAPI.getChartData(params),
        dashboardAPI.getAlerts(params),
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data.data || []);
      setAlerts(alertsRes.data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusChartData = stats ? [
    { name: 'Chưa mua', count: stats.count_chua_mua },
    { name: 'Đã mua', count: stats.count_da_mua },
    { name: 'Đã giao', count: stats.count_da_giao },
    { name: 'Hoàn tất', count: stats.count_hoan_tat },
  ] : [];

  const formatMoney = (value) => {
    if (!value && value !== 0) return '0đ';
    return value.toLocaleString('vi-VN') + 'đ';
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with month/year selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tổng quan</h1>
          <p className="text-muted-foreground">
            Báo cáo tháng {month}/{year}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border">
          <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="bg-transparent border-0 text-foreground focus:outline-none px-2 py-1 cursor-pointer"
          >
            {months.map(m => (
              <option key={m} value={m} className="bg-card">Tháng {m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-transparent border-0 text-foreground focus:outline-none px-2 py-1 cursor-pointer"
          >
            {years.map(y => (
              <option key={y} value={y} className="bg-card">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main layout: 4 columns of stats + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats cards - 3 cols on lg */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Row 1: Core metrics */}
          <StatBox
            label="TỔNG ĐƠN"
            value={stats.total_orders}
            sub={`Hôm nay: ${stats.today_orders} đơn`}
            icon={Package}
            color="text-primary"
          />
          <StatBox
            label="DOANH THU NHẬN"
            value={formatMoney(stats.total_revenue)}
            sub="Tổng tiền khách đã chuyển"
            icon={DollarSign}
            color="text-cyan-400"
          />
          <StatBox
            label="LỢI NHUẬN"
            value={formatMoney(stats.total_profit)}
            sub="Lãi gộp từ đơn hàng"
            icon={TrendingUp}
            color={stats.total_profit >= 0 ? "text-green-500" : "text-red-500"}
          />
          <StatBox
            label="CHI PHÍ"
            value={formatMoney(stats.total_expense)}
            sub="Chi phí vận hành + khác"
            icon={CreditCard}
            color="text-red-500"
          />
          <StatBox
            label="CÔNG NỢ ƯỚC TÍNH"
            value={formatMoney(stats.total_debt)}
            sub="Hàng + cân chưa thu đủ"
            icon={AlertCircle}
            color={stats.total_debt > 0 ? "text-orange-500" : "text-muted-foreground"}
          />

          {/* Row 2: Detailed metrics */}
          <StatBox
            label="TỔNG TỆ ĐÃ DÙNG"
            value={`¥${stats.total_yuan.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}`}
            sub="Giá trị nhập hàng theo ¥"
            icon={Coins}
            color="text-yellow-500"
          />
          <StatBox
            label="TIỀN CÂN KHÁCH"
            value={formatMoney(stats.total_weight_customer_paid)}
            sub={`Tổng ${stats.monthly_orders} đơn • Làm tròn ${formatMoney(stats.weight_round_profit)}`}
            icon={Scale}
            color="text-cyan-400"
          />
          <StatBox
            label="CHƯA MUA"
            value={stats.count_chua_mua}
            sub="Đơn cần xử lý đặt mua"
            icon={ShoppingCart}
            color={stats.count_chua_mua > 0 ? "text-orange-500" : "text-muted-foreground"}
          />
          <StatBox
            label="CHƯA TRẢ CÂN"
            value={stats.unpaid_weight_count}
            sub={`Cần thu ${formatMoney(stats.total_unpaid_weight_fee)}`}
            icon={Scale}
            color={stats.unpaid_weight_count > 0 ? "text-red-500" : "text-muted-foreground"}
          />
          <StatBox
            label="SỐ DƯ KHẢ DỤNG"
            value={formatMoney(stats.total_balance)}
            sub="Lương + lãi + thu khác - chi"
            icon={Wallet}
            color="text-purple-400"
          />
        </div>

        {/* Sidebar - Việc cần xử lý hôm nay */}
        <div className="bg-card p-5 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">
              Việc cần xử lý
            </h2>
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md">
              {month}/{year}
            </span>
          </div>

          <div className="space-y-3">
            <TaskRow color="bg-orange-500" label="Đơn cần đặt mua" value={stats.count_chua_mua} />
            <TaskRow color="bg-red-500" label="Đơn chưa trả cân" value={stats.unpaid_weight_count} />
            <TaskRow color="bg-red-500" label="Đơn lãi âm" value={stats.negative_profit_count} />
            <TaskRow color="bg-blue-500" label="Công nợ cần theo dõi" value={formatMoney(stats.total_debt)} small />
            <TaskRow color="bg-green-500" label="Đơn hôm nay" value={stats.today_orders} />
          </div>

          <Link 
            to="/orders"
            className="mt-5 w-full px-4 py-2.5 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
          >
            <Package className="w-4 h-4 mr-2" />
            Mở danh sách đơn
          </Link>
        </div>
      </div>

      {/* Charts & Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operational Alerts */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Cảnh báo vận hành
          </h2>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-green-500/10 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-sm text-muted-foreground">Không có cảnh báo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <AlertItem key={i} alert={alert} />
              ))}
            </div>
          )}
        </div>

        {/* Financial Chart */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Biểu đồ tài chính</h2>
            <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md">
              Tháng {month}/{year}
            </span>
          </div>
          {chartData.length > 0 ? (
            <RevenueChart data={chartData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Order Status Donut */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Trạng thái đơn hàng</h2>
            <Link to="/orders" className="text-sm text-primary hover:underline flex items-center">
              Xem tất cả
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {statusChartData.some(d => d.count > 0) ? (
            <OrderStatusDonut data={statusChartData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Chưa có đơn hàng
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components
const StatBox = ({ label, value, sub, icon: Icon, color = 'text-primary' }) => (
  <div className="bg-card p-4 rounded-xl border border-border card-hover">
    <div className="flex items-start justify-between mb-3">
      <div className="p-2 rounded-lg bg-muted/50">
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
      </div>
    </div>
    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">{label}</p>
    <p className={`text-xl font-bold mb-2 ${color}`}>
      {value}
    </p>
    {sub && <p className="text-xs text-muted-foreground line-clamp-2">{sub}</p>}
  </div>
);

const TaskRow = ({ color, label, value, small }) => (
  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full ${color} mr-3`}></div>
      <span className="text-sm text-foreground">{label}</span>
    </div>
    <span className={`font-semibold ${small ? 'text-sm' : 'text-base'} text-foreground`}>
      {value}
    </span>
  </div>
);

const AlertItem = ({ alert }) => {
  const levelColors = {
    high: 'bg-red-500/10 border-red-500/30 text-red-500',
    medium: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
    low: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  };

  return (
    <div className={`p-3 rounded-lg border ${levelColors[alert.level] || levelColors.low}`}>
      <div className="flex items-start">
        <AlertTriangle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{alert.title}</p>
            <span className="text-xs bg-current/20 px-2 py-0.5 rounded">{alert.count}</span>
          </div>
          <p className="text-xs opacity-80 mt-1">{alert.detail}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
