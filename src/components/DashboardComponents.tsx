'use client';

import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  description?: string;
}

export function StatsCard({ title, value, change, changeType = 'neutral', icon, description }: StatsCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          {icon && (
            <div className="p-3 bg-blue-50 rounded-lg">
              {icon}
            </div>
          )}
        </div>
        {change && (
          <div className="mt-4">
            <Badge className={`${getChangeColor()} text-xs font-medium px-2 py-1`}>
              {change}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick Actions Card
interface QuickActionsProps {
  title: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
    disabled?: boolean;
  }>;
}

export function QuickActionsCard({ title, actions }: QuickActionsProps) {
  return (
    <Card className="p-6">
      <CardTitle className="text-lg font-semibold mb-4">{title}</CardTitle>
      <CardContent className="p-0 space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'outline'}
            className="w-full justify-start"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

// Activity Feed Component
interface ActivityItem {
  id: string;
  message: string;
  timestamp: Date;
  type: 'success' | 'warning' | 'info' | 'error';
  user?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <Card className="p-6">
      <CardTitle className="text-lg font-semibold mb-4">Recent Activity</CardTitle>
      <CardContent className="p-0">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.slice(0, maxItems).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(activity.type)}`}>
                {getTypeIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                {activity.user && (
                  <p className="text-xs text-gray-500">by {activity.user}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {activity.timestamp.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// System Health Component
interface SystemHealthProps {
  systems: Array<{
    name: string;
    status: 'online' | 'offline' | 'warning';
    lastCheck: Date;
    uptime?: string;
  }>;
}

export function SystemHealth({ systems }: SystemHealthProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'warning': return 'Warning';
      default: return 'Unknown';
    }
  };

  return (
    <Card className="p-6">
      <CardTitle className="text-lg font-semibold mb-4">System Health</CardTitle>
      <CardContent className="p-0 space-y-4">
        {systems.map((system, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-900">{system.name}</p>
                <p className="text-xs text-gray-500">
                  Last checked: {system.lastCheck.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge
                className={`text-xs ${
                  system.status === 'online' ? 'bg-green-100 text-green-800' :
                  system.status === 'offline' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}
              >
                {getStatusText(system.status)}
              </Badge>
              {system.uptime && (
                <p className="text-xs text-gray-500 mt-1">{system.uptime}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Progress Chart Component (Simple)
interface ProgressChartProps {
  title: string;
  data: Array<{
    label: string;
    value: number;
    total: number;
    color?: string;
  }>;
}

export function ProgressChart({ title, data }: ProgressChartProps) {
  return (
    <Card className="p-6">
      <CardTitle className="text-lg font-semibold mb-4">{title}</CardTitle>
      <CardContent className="p-0 space-y-4">
        {data.map((item, index) => {
          const percentage = Math.round((item.value / item.total) * 100);
          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className="text-sm text-gray-600">{item.value}/{item.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    item.color || 'bg-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}