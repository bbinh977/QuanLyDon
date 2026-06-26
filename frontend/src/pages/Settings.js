import React, { useState, useEffect } from 'react';
import { Save, Key, DollarSign, Briefcase, Shield, Loader2 } from 'lucide-react';
import { configAPI } from '../services/api';

const Settings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    exchange_rate: 3870,
    weight_rate: 24000,
    salary_base: 2340000,
    salary_coefficient: 2.1,
    insurance_percent: 10.5,
    gemini_api_key: '',
    gianghuy_token: '',
    require_auth: false,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await configAPI.get();
      setConfig(res.data);
      setFormData({
        exchange_rate: res.data.exchange_rate,
        weight_rate: res.data.weight_rate,
        salary_base: res.data.salary_base,
        salary_coefficient: res.data.salary_coefficient,
        insurance_percent: res.data.insurance_percent,
        gemini_api_key: res.data.gemini_api_key || '',
        gianghuy_token: res.data.gianghuy_token || '',
        require_auth: res.data.require_auth,
      });
    } catch (error) {
      console.error('Failed to fetch config:', error);
      showMessage('error', 'Không thể tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await configAPI.update(formData);
      showMessage('success', 'Đã lưu cấu hình thành công!');
      
      // If auth setting changed, show notification
      if (formData.require_auth !== config.require_auth) {
        setTimeout(() => {
          showMessage('info', 'Cài đặt xác thực đã thay đổi. Vui lòng tải lại trang.');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to update config:', error);
      showMessage('error', 'Lưu cấu hình thất bại');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Cấu hình hệ thống</h1>
        <p className="text-muted-foreground">
          Quản lý cài đặt, API keys và tham số tính toán
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
          message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
          'bg-blue-500/10 border-blue-500/20 text-blue-500'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Authentication Settings */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-primary mr-2" />
            <h2 className="text-xl font-bold text-foreground">Xác thực</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Yêu cầu đăng nhập</p>
              <p className="text-sm text-muted-foreground">
                Bật để yêu cầu người dùng đăng nhập trước khi sử dụng
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="require_auth"
                checked={formData.require_auth}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center mb-4">
            <Key className="w-5 h-5 text-primary mr-2" />
            <h2 className="text-xl font-bold text-foreground">API Keys</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Gemini API Key
              </label>
              <input
                type="password"
                name="gemini_api_key"
                value={formData.gemini_api_key}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="AIza..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Dùng cho tính năng AI Insight. Lấy key tại{' '}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Giang Huy Token
              </label>
              <input
                type="password"
                name="gianghuy_token"
                value={formData.gianghuy_token}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="Bearer token..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Token API của Giang Huy để tracking tự động
              </p>
            </div>
          </div>
        </div>

        {/* Exchange & Weight */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center mb-4">
            <DollarSign className="w-5 h-5 text-primary mr-2" />
            <h2 className="text-xl font-bold text-foreground">Tỉ giá & Phí cân</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tỉ giá tệ (VND/CNY)
              </label>
              <input
                type="number"
                name="exchange_rate"
                value={formData.exchange_rate}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Đơn giá cân (VND/kg)
              </label>
              <input
                type="number"
                name="weight_rate"
                value={formData.weight_rate}
                onChange={handleChange}
                step="1"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Salary Config */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center mb-4">
            <Briefcase className="w-5 h-5 text-primary mr-2" />
            <h2 className="text-xl font-bold text-foreground">Cấu hình lương</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Lương cơ sở (VND)
              </label>
              <input
                type="number"
                name="salary_base"
                value={formData.salary_base}
                onChange={handleChange}
                step="1000"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Hệ số lương
              </label>
              <input
                type="number"
                name="salary_coefficient"
                value={formData.salary_coefficient}
                onChange={handleChange}
                step="0.1"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Khấu trừ BHXH (%)
              </label>
              <input
                type="number"
                name="insurance_percent"
                value={formData.insurance_percent}
                onChange={handleChange}
                step="0.1"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-background rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Lương gross:</span>{' '}
              {(formData.salary_base * formData.salary_coefficient).toLocaleString('vi-VN')} đ
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">Bảo hiểm:</span>{' '}
              {((formData.salary_base * formData.salary_coefficient) * (formData.insurance_percent / 100)).toLocaleString('vi-VN')} đ
            </p>
            <p className="text-sm text-foreground font-medium mt-2">
              Lương net: {(
                (formData.salary_base * formData.salary_coefficient) - 
                ((formData.salary_base * formData.salary_coefficient) * (formData.insurance_percent / 100))
              ).toLocaleString('vi-VN')} đ
            </p>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Lưu cấu hình
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Settings;
