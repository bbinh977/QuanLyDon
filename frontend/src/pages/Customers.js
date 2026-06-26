import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2, Users as UsersIcon, Phone, MapPin, ExternalLink } from 'lucide-react';
import { customersAPI, ordersAPI } from '../services/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    facebook_link: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersRes, ordersRes] = await Promise.all([
        customersAPI.getAll(),
        ordersAPI.getAll()
      ]);
      setCustomers(customersRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerStats = (customer) => {
    const customerOrders = orders.filter(
      o => o.customer_code === customer.customer_code || o.customer_name === customer.full_name
    );
    const totalOrders = customerOrders.length;
    const totalProfit = customerOrders.reduce((sum, o) => sum + o.profit, 0);
    const totalDebt = customerOrders.reduce((sum, o) => {
      return sum + Math.max(0, o.price_quoted + (o.weight_paid ? 0 : o.weight_fee_customer) - o.amount_received);
    }, 0);
    return { totalOrders, totalProfit, totalDebt };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData);
      } else {
        await customersAPI.create(formData);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save customer:', error);
      alert('Lưu khách hàng thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa khách hàng này?')) return;
    try {
      await customersAPI.delete(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      phone: customer.phone || '',
      address: customer.address || '',
      facebook_link: customer.facebook_link || '',
      notes: customer.notes || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      full_name: '',
      phone: '',
      address: '',
      facebook_link: '',
      notes: ''
    });
  };

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Khách hàng</h1>
          <p className="text-muted-foreground mt-1">Tổng số: {filteredCustomers.length} khách hàng</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm khách hàng
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Tìm kiếm khách hàng theo tên, mã KH, số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-card p-12 rounded-xl border border-border text-center">
          <UsersIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Chưa có khách hàng nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const stats = getCustomerStats(customer);
            return (
              <div key={customer.id} className="bg-card p-6 rounded-xl border border-border card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <UsersIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{customer.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{customer.customer_code}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button onClick={() => openEditModal(customer)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(customer.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {customer.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 mr-2" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                  )}
                  {customer.facebook_link && (
                    <a href={customer.facebook_link} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-primary hover:underline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Facebook
                    </a>
                  )}
                </div>

                <div className="pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">Đơn hàng</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-500">{(stats.totalProfit / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">Lợi nhuận</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-500">{(stats.totalDebt / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">Công nợ</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng mới'}
                </h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 rounded-lg hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Số điện thoại</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Link Facebook</label>
                    <input
                      type="url"
                      value={formData.facebook_link}
                      onChange={(e) => setFormData({ ...formData, facebook_link: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Địa chỉ</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80">
                    Hủy
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
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

export default Customers;
