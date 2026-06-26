import React, { useState, useEffect } from 'react';
import { Truck, RefreshCw, Search, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { trackingAPI, ordersAPI } from '../services/api';

const Tracking = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [syncResults, setSyncResults] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersAPI.getAll({ status: 'Đã mua' });
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    
    setSearchResult({ loading: true });
    try {
      const res = await trackingAPI.track(searchCode);
      setSearchResult(res.data);
    } catch (error) {
      setSearchResult({
        success: false,
        error: error.response?.data?.detail || 'Tra cứu thất bại'
      });
    }
  };

  const handleSyncOne = async (orderId) => {
    try {
      const res = await trackingAPI.syncOrder(orderId);
      fetchOrders();
      return res.data;
    } catch (error) {
      console.error('Sync failed:', error);
      return null;
    }
  };

  const handleSyncAll = async () => {
    if (!window.confirm('Đồng bộ tất cả đơn hàng đang "Đã mua" với Giang Huy?')) return;
    
    setSyncing(true);
    setSyncResults([]);
    
    try {
      const res = await trackingAPI.syncAll();
      setSyncResults(res.data.results || []);
      fetchOrders();
    } catch (error) {
      console.error('Sync all failed:', error);
      alert('Đồng bộ thất bại: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tracking Giang Huy</h1>
          <p className="text-muted-foreground mt-1">Cập nhật trạng thái vận đơn tự động</p>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={syncing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center disabled:opacity-50"
        >
          {syncing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Đang đồng bộ...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Đồng bộ tất cả
            </>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="bg-card p-6 rounded-xl border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Tra cứu nhanh</h2>
        <form onSubmit={handleSearch} className="flex space-x-2">
          <input
            type="text"
            placeholder="Nhập mã vận đơn..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center"
          >
            <Search className="w-5 h-5 mr-2" />
            Tra cứu
          </button>
        </form>

        {searchResult && (
          <div className="mt-4 p-4 bg-background rounded-lg border border-border">
            {searchResult.loading ? (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tra cứu...
              </div>
            ) : searchResult.success ? (
              <div className="space-y-2">
                <div className="flex items-center text-green-500">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Tra cứu thành công</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Mã vận đơn:</span> <span className="text-foreground font-mono">{searchResult.tracking_code}</span></div>
                  <div><span className="text-muted-foreground">Trạng thái:</span> <span className="text-foreground">{searchResult.status}</span></div>
                  <div><span className="text-muted-foreground">Cân nặng:</span> <span className="text-foreground">{searchResult.weight} kg</span></div>
                  <div><span className="text-muted-foreground">Phí vận chuyển:</span> <span className="text-foreground">{searchResult.shipping_fee?.toLocaleString('vi-VN')} đ</span></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-red-500">
                <XCircle className="w-5 h-5 mr-2" />
                <span>{searchResult.error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sync Results */}
      {syncResults.length > 0 && (
        <div className="bg-card p-6 rounded-xl border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Kết quả đồng bộ ({syncResults.filter(r => r.success).length}/{syncResults.length})
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {syncResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  result.success ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                <div className="flex items-center">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 mr-3 text-red-500" />
                  )}
                  <div>
                    <p className="font-mono text-sm text-foreground">{result.tracking_code}</p>
                    {result.error && <p className="text-xs text-red-500">{result.error}</p>}
                  </div>
                </div>
                {result.status && (
                  <span className="text-sm text-muted-foreground">{result.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders waiting to be tracked */}
      <div className="bg-card p-6 rounded-xl border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Đơn hàng "Đã mua" ({orders.length})
        </h2>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Không có đơn hàng nào cần tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <div className="flex items-center flex-1">
                  <Truck className="w-5 h-5 text-primary mr-3" />
                  <div className="flex-1">
                    <p className="font-mono text-sm text-foreground">{order.tracking_code}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_name} - {order.product_name}</p>
                  </div>
                </div>
                <div className="text-right mr-4">
                  {order.gianghuy_status ? (
                    <p className="text-sm text-foreground">{order.gianghuy_status}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Chưa đồng bộ</p>
                  )}
                  {order.gianghuy_updated_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.gianghuy_updated_at).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleSyncOne(order.id)}
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 text-sm font-medium flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Đồng bộ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracking;
