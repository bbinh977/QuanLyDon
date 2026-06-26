import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Users,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { RevenueChart, OrderStatusChart } from '../components/Charts';
import { dashboardAPI, ordersAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [statusChartData, setStatusChartData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await dashboardAPI.getStats();
      setStats(statsRes.data);

      // Fetch recent orders
      const ordersRes = await dashboardAPI.getRecentOrders({ limit: 6 });
      setRecentOrders(ordersRes.data);

      // Fetch top customers
      const customersRes = await dashboardAPI.getTopCustomers({ limit: 5 });
      setTopCustomers(customersRes.data);

      // Generate chart data (last 7 days)
      const allOrders = await ordersAPI.getAll();
      generateChartData(allOrders.data);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (orders) => {
    // Generate last 7 days data
    const last7Days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.toDateString() === date.toDateString();
      });

      last7Days.push({
        name: dayName,
        revenue: dayOrders.reduce((sum, o) => sum + o.amount_received, 0),
        profit: dayOrders.reduce((sum, o) => sum + o.profit, 0),
      });
    }
    
    setChartData(last7Days);

    // Status breakdown
    const statusCounts = {
      'Chưa mua': 0,
      'Đã mua': 0,
      'Đã giao': 0,
      'Hoàn tất': 0,
    };

    orders.forEach(o => {
      if (statusCounts.hasOwnProperty(o.status)) {
        statusCounts[o.status]++;
      }
    });

    setStatusChartData([
      { name: 'Chưa mua', count: statusCounts['Chưa mua'] },
      { name: 'Đã mua', count: statusCounts['Đã mua'] },
      { name: 'Đã giao', count: statusCounts['Đã giao'] },
      { name: 'Hoàn tất', count: statusCounts['Hoàn tất'] },
    ]);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Chưa mua': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'Đã mua': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'Đã giao': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'Hoàn tất': 'bg-green-500/10 text-green-500 border-green-500/20',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Tổng quan</h1>
        <p className="text-muted-foreground">
          Chào mừng trở lại! Đây là tổng quan hoạt động kinh doanh của bạn.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng đơn hàng"
          value={stats?.total_orders || 0}
          icon={Package}
          trend="neutral"
          trendValue={`${stats?.today_orders || 0} đơn hôm nay`}
        />
        <StatCard
          title="Doanh thu tháng"
          value={`${((stats?.total_revenue || 0) / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          trend="up"
          trendValue={`${stats?.monthly_orders || 0} đơn`}
        />
        <StatCard
          title="Lợi nhuận"
          value={`${((stats?.total_profit || 0) / 1000000).toFixed(1)}M`}
          icon={TrendingUp}
          trend="up"
          trendValue="Tháng này"
        />
        <StatCard
          title="Công nợ"
          value={`${((stats?.total_debt || 0) / 1000000).toFixed(1)}M`}
          icon={AlertCircle}
          trend={stats?.total_debt > 0 ? "down" : "neutral"}
          trendValue={`${stats?.unpaid_weight_count || 0} đơn chưa trả cân`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Doanh thu & Lợi nhuận (7 ngày qua)
          </h2>
          <RevenueChart data={chartData} />
        </div>

        {/* Status Chart */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Trạng thái đơn hàng
          </h2>
          <OrderStatusChart data={statusChartData} />
        </div>
      </div>

      {/* Recent Orders & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Đơn hàng gần đây</h2>
            <Link
              to="/orders"
              className="text-sm text-primary hover:underline flex items-center"
            >
              Xem tất cả
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{order.tracking_code}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-medium text-foreground">
                    {order.amount_received.toLocaleString('vi-VN')} đ
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Lãi: {order.profit.toLocaleString('vi-VN')} đ
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Khách hàng hàng đầu</h2>
            <Link
              to="/customers"
              className="text-sm text-primary hover:underline flex items-center"
            >
              Xem tất cả
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.customer_code || index}
                className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
              >
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{customer.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{customer.customer_code || 'Khách lẻ'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{customer.order_count} đơn</p>
                  <p className="text-sm text-green-500">
                    +{customer.total_profit.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/orders?action=new"
          className="bg-card p-6 rounded-xl border border-border hover:border-primary transition-colors group"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-foreground">Tạo đơn hàng mới</h3>
              <p className="text-sm text-muted-foreground">Thêm đơn hàng Taobao</p>
            </div>
          </div>
        </Link>

        <Link
          to="/tracking"
          className="bg-card p-6 rounded-xl border border-border hover:border-primary transition-colors group"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-foreground">Cập nhật tracking</h3>
              <p className="text-sm text-muted-foreground">Đồng bộ Giang Huy</p>
            </div>
          </div>
        </Link>

        <Link
          to="/ai-insight"
          className="bg-card p-6 rounded-xl border border-border hover:border-primary transition-colors group"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-foreground">Phân tích AI</h3>
              <p className="text-sm text-muted-foreground">Insight kinh doanh</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
