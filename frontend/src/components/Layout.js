import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  DollarSign, 
  Truck, 
  Brain, 
  Settings,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const location = useLocation();
  const { user, requireAuth, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Tổng quan', path: '/', icon: LayoutDashboard },
    { name: 'Đơn hàng', path: '/orders', icon: Package },
    { name: 'Khách hàng', path: '/customers', icon: Users },
    { name: 'Tài chính', path: '/finance', icon: DollarSign },
    { name: 'Tracking', path: '/tracking', icon: Truck },
    { name: 'AI Insight', path: '/ai-insight', icon: Brain },
    { name: 'Cấu hình', path: '/settings', icon: Settings },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-card border-r border-border`}
        style={{ width: '280px' }}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8 px-3">
            <h1 className="text-2xl font-bold gradient-text">AIGA OS Pro</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          {requireAuth && user && (
            <div className="absolute bottom-4 left-0 right-0 px-6">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.full_name || user.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
                <button
                  onClick={logout}
                  className="mt-2 w-full flex items-center justify-center px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={`${sidebarOpen ? 'lg:ml-[280px]' : ''} transition-all`}>
        {/* Top bar */}
        <header className="bg-card border-b border-border sticky top-0 z-30">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;