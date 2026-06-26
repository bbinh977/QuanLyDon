import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, className = '' }) => {
  return (
    <div className={`bg-card p-6 rounded-xl border border-border card-hover ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-foreground mb-2">
            {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
          </h3>
          {trend && (
            <p className={`text-sm ${
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;