import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Check, X, Loader2, Package } from 'lucide-react';
import { ordersAPI, customersAPI } from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    tracking_code: '',
    customer_name: '',
    customer_code: '',
    weight_kg: 0,
    weight_fee_customer: '',
    product_name: '',
    price_yuan: 0,
    amount_received: 0,
    weight_paid: false,
    status: 'Chưa mua',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, customersRes] = await Promise.all([
        ordersAPI.getAll({ status: statusFilter }),
        customersAPI.getAll()
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data - convert weight_fee_customer empty string to null (auto-calc) or number
      const payload = {
        ...formData,
        weight_fee_customer: formData.weight_fee_customer === '' || formData.weight_fee_customer === null
          ? null
          : parseFloat(formData.weight_fee_customer)
      };
      
      if (editingOrder) {
        await ordersAPI.update(editingOrder.id, payload);
      } else {
        await ordersAPI.create(payload);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save order:', error);
      alert('Lưu đơn hàng thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đơn hàng này?')) return;
    try {
      await ordersAPI.delete(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };

  const handleComplete = async (id) => {
    try {
      await ordersAPI.complete(id);
      fetchData();
    } catch (error) {
      console.error('Failed to complete order:', error);
    }
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setFormData({
      tracking_code: order.tracking_code,
      customer_name: order.customer_name,
      customer_code: order.customer_code || '',
      weight_kg: order.weight_kg,
      weight_fee_customer: order.weight_fee_customer || '',
      product_name: order.product_name,
      price_yuan: order.price_yuan,
      amount_received: order.amount_received,
      weight_paid: order.weight_paid,
      status: order.status,
      notes: order.notes || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingOrder(null);
    setFormData({
      tracking_code: '',
      customer_name: '',
      customer_code: '',
      weight_kg: 0,
      weight_fee_customer: '',
      product_name: '',
      price_yuan: 0,
      amount_received: 0,
      weight_paid: false,
      status: 'Chưa mua',
      notes: ''
    });
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

  const filteredOrders = orders.filter(order =>
    order.tracking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Đơn hàng</h1>
          <p className="text-muted-foreground mt-1">Tổng số: {filteredOrders.length} đơn</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tạo đơn mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm mã vận đơn, khách hàng, sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Chưa mua">Chưa mua</option>
              <option value="Đã mua">Đã mua</option>
              <option value="Đã giao">Đã giao</option>
              <option value="Hoàn tất">Hoàn tất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-card p-12 rounded-xl border border-border text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Mã vận đơn</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Sản phẩm</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Giá tệ</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Tiền cân</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Đã nhận</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Lãi</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Trạng thái</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground font-mono">{order.tracking_code}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        {order.customer_code && (
                          <p className="text-xs text-muted-foreground">{order.customer_code}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{order.product_name}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">
                      ¥{order.price_yuan.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-foreground">{order.weight_fee_customer.toLocaleString('vi-VN')}đ</span>
                        {order.weight_paid ? (
                          <span className="text-xs text-green-500">✓ Đã trả</span>
                        ) : (
                          <span className="text-xs text-orange-500">Chưa trả</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">
                      {order.amount_received.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={order.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {order.profit.toLocaleString('vi-VN')}đ
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(order)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {order.status !== 'Hoàn tất' && (
                          <button
                            onClick={() => handleComplete(order.id)}
                            className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-500 transition-colors"
                            title="Hoàn tất"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {editingOrder ? 'Sửa đơn hàng' : 'Tạo đơn hàng mới'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 rounded-lg hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Mã vận đơn</label>
                    <input
                      type="text"
                      required
                      value={formData.tracking_code}
                      onChange={(e) => setFormData({ ...formData, tracking_code: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tên khách hàng</label>
                    <input
                      type="text"
                      required
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Mã KH</label>
                    <select
                      value={formData.customer_code}
                      onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    >
                      <option value="">-- Chọn khách --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.customer_code}>{c.customer_code} - {c.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Cân nặng (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tiền cân nhận (đ) <span className="text-xs text-muted-foreground">(để trống = tự tính theo kg × đơn giá)</span>
                  </label>
                  <input
                    type="number"
                    step="1000"
                    placeholder={`Tự động: ${(formData.weight_kg * 24000).toLocaleString('vi-VN')}đ (có thể làm tròn)`}
                    value={formData.weight_fee_customer}
                    onChange={(e) => setFormData({ ...formData, weight_fee_customer: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tên sản phẩm</label>
                  <input
                    type="text"
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Giá tệ (¥)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price_yuan}
                      onChange={(e) => setFormData({ ...formData, price_yuan: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Đã nhận (đ)</label>
                    <input
                      type="number"
                      value={formData.amount_received}
                      onChange={(e) => setFormData({ ...formData, amount_received: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Trạng thái</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    >
                      <option value="Chưa mua">Chưa mua</option>
                      <option value="Đã mua">Đã mua</option>
                      <option value="Đã giao">Đã giao</option>
                      <option value="Hoàn tất">Hoàn tất</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.weight_paid}
                      onChange={(e) => setFormData({ ...formData, weight_paid: e.target.checked })}
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Đã trả tiền cân</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {editingOrder ? 'Cập nhật' : 'Tạo đơn'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;