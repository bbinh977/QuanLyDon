import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Edit2, Trash2, X, Loader2, DollarSign } from 'lucide-react';
import { financeAPI } from '../services/api';

const Finance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    amount: 0,
    type: 'Chi phí',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await financeAPI.getAll();
      setRecords(res.data);
    } catch (error) {
      console.error('Failed to fetch finance:', error);
    } finally {
      setLoading(false);
    }
  };

  const isIncome = (type) => {
    const lower = type.toLowerCase();
    return lower.includes('[thu]') || lower.includes('thu nhập') || lower === 'thu';
  };

  const stats = {
    totalIncome: records.filter(r => isIncome(r.type)).reduce((sum, r) => sum + r.amount, 0),
    totalExpense: records.filter(r => !isIncome(r.type)).reduce((sum, r) => sum + r.amount, 0),
  };
  stats.balance = stats.totalIncome - stats.totalExpense;

  const filteredRecords = records.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'Thu') return isIncome(r.type);
    if (filter === 'Chi') return !isIncome(r.type);
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        date: new Date(formData.date).toISOString()
      };
      if (editingRecord) {
        await financeAPI.update(editingRecord.id, data);
      } else {
        await financeAPI.create(data);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Lưu thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa giao dịch này?')) return;
    try {
      await financeAPI.delete(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setFormData({
      amount: record.amount,
      type: record.type,
      date: new Date(record.date).toISOString().split('T')[0],
      notes: record.notes || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingRecord(null);
    setFormData({
      amount: 0,
      type: 'Chi phí',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Tài chính</h1>
          <p className="text-muted-foreground mt-1">Tổng số giao dịch: {filteredRecords.length}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm giao dịch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Tổng thu</p>
              <h3 className="text-2xl font-bold text-green-500">{stats.totalIncome.toLocaleString('vi-VN')}đ</h3>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Tổng chi</p>
              <h3 className="text-2xl font-bold text-red-500">{stats.totalExpense.toLocaleString('vi-VN')}đ</h3>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Số dư</p>
              <h3 className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-primary' : 'text-red-500'}`}>
                {stats.balance.toLocaleString('vi-VN')}đ
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        {[
          { value: 'ALL', label: 'Tất cả' },
          { value: 'Thu', label: 'Thu' },
          { value: 'Chi', label: 'Chi' },
        ].map(item => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === item.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground hover:bg-muted'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Ngày</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Loại</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Ghi chú</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Số tiền</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm text-foreground">
                    {new Date(record.date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      isIncome(record.type) ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{record.notes || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    <span className={isIncome(record.type) ? 'text-green-500' : 'text-red-500'}>
                      {isIncome(record.type) ? '+' : '-'}{record.amount.toLocaleString('vi-VN')}đ
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => openEditModal(record)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(record.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chưa có giao dịch nào</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-xl border border-border max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {editingRecord ? 'Sửa giao dịch' : 'Thêm giao dịch'}
                </h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 rounded-lg hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Số tiền *</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Loại *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  >
                    <option value="[Thu] Lương">[Thu] Lương</option>
                    <option value="[Thu] Thưởng">[Thu] Thưởng</option>
                    <option value="[Thu] Khác">[Thu] Khác</option>
                    <option value="Chi phí">Chi phí</option>
                    <option value="Ăn uống">Ăn uống</option>
                    <option value="Đi lại">Đi lại</option>
                    <option value="Mua sắm">Mua sắm</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Ngày *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                    {editingRecord ? 'Cập nhật' : 'Thêm'}
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

export default Finance;
