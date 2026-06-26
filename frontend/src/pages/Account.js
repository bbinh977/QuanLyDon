import React, { useState, useEffect } from 'react';
import { User as UserIcon, Plus, Trash2, X, Loader2, Lock, Mail, UserCircle, Shield, Key } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Account = () => {
  const { user: currentUser, requireAuth } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    full_name: ''
  });

  const [pwdForm, setPwdForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await authAPI.listUsers();
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newUser.password.length < 6) {
      showMsg('error', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    try {
      await authAPI.createUser(newUser);
      setShowAddModal(false);
      setNewUser({ username: '', email: '', password: '', full_name: '' });
      showMsg('success', 'Tạo tài khoản thành công!');
      fetchUsers();
    } catch (error) {
      showMsg('error', error.response?.data?.detail || 'Tạo tài khoản thất bại');
    }
  };

  const handleDelete = async (userId, username) => {
    if (userId === currentUser?.id) {
      showMsg('error', 'Không thể xóa tài khoản đang đăng nhập');
      return;
    }
    if (!window.confirm(`Xóa tài khoản "${username}"?`)) return;
    try {
      await authAPI.deleteUser(userId);
      showMsg('success', 'Đã xóa tài khoản');
      fetchUsers();
    } catch (error) {
      showMsg('error', error.response?.data?.detail || 'Xóa thất bại');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      showMsg('error', 'Mật khẩu mới không khớp');
      return;
    }
    if (pwdForm.new_password.length < 6) {
      showMsg('error', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    try {
      await authAPI.changePassword({
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password
      });
      setShowPwdModal(false);
      setPwdForm({ old_password: '', new_password: '', confirm_password: '' });
      showMsg('success', 'Đổi mật khẩu thành công!');
    } catch (error) {
      showMsg('error', error.response?.data?.detail || 'Đổi mật khẩu thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Tài khoản</h1>
          <p className="text-muted-foreground mt-1">
            Tổng số: {users.length} tài khoản
            {!requireAuth && (
              <span className="ml-2 text-orange-500">
                • Xác thực đang TẮT (vào Cấu hình để bật)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm tài khoản
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
          'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* Current User Info */}
      {currentUser && (
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 p-6 rounded-xl border border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center mr-4">
                <UserCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{currentUser.full_name || currentUser.username}</h3>
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                  <Mail className="w-3 h-3 mr-1" />
                  {currentUser.email}
                </p>
                <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-medium">
                  <Shield className="w-3 h-3 mr-1" />
                  Đang đăng nhập
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowPwdModal(true)}
              className="px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted flex items-center"
            >
              <Lock className="w-4 h-4 mr-2" />
              Đổi mật khẩu
            </button>
          </div>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-card p-12 rounded-xl border border-border text-center">
          <UserIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Chưa có tài khoản nào</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Tạo tài khoản đầu tiên
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Họ tên</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Username</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Ngày tạo</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                        <UserIcon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground font-medium">{u.full_name || u.username}</span>
                      {u.id === currentUser?.id && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/10 text-green-500 rounded">Bạn</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.username}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        disabled={u.id === currentUser?.id || users.length <= 1}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={u.id === currentUser?.id ? 'Không thể xóa tài khoản đang dùng' : 'Xóa'}
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
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-xl border border-border max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Thêm tài khoản</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Họ tên</label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Mật khẩu * (tối thiểu 6 ký tự)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80">
                    Hủy
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    Tạo tài khoản
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-xl border border-border max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center">
                  <Key className="w-5 h-5 mr-2 text-primary" />
                  Đổi mật khẩu
                </h2>
                <button onClick={() => setShowPwdModal(false)} className="p-2 rounded-lg hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Mật khẩu hiện tại *</label>
                  <input
                    type="password"
                    required
                    value={pwdForm.old_password}
                    onChange={(e) => setPwdForm({ ...pwdForm, old_password: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={pwdForm.new_password}
                    onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Xác nhận mật khẩu *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={pwdForm.confirm_password}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowPwdModal(false)} className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80">
                    Hủy
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    Đổi mật khẩu
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

export default Account;
