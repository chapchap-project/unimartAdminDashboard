import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Eye, Send, Users, Calendar } from 'lucide-react';
import { api } from '../services/api';

interface AnalyticsData {
  period: string;
  totalSent: number;
  totalRead: number;
  readRate: number;
  notificationsByType: Array<{
    type: string;
    sent: number;
    read: number;
    readRate: number;
  }>;
  dailyStats: Array<{
    date: string;
    sent: number;
    read: number;
    read_rate: number;
  }>;
  readTimeStats: {
    avg_read_hours: number;
    min_read_hours: number;
    max_read_hours: number;
  };
  oldUnreadCount: number;
  summary: {
    period: string;
    totalNotifications: number;
    readRate: string;
    avgReadTime: string;
    oldUnreadAlerts: number;
  };
}

const NotificationAnalyticsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    loadAnalytics();
  }, [period, selectedType]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getNotificationAnalytics(period, selectedType || undefined);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      default: return 'Last 30 days';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Unable to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Notification Analytics</h1>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Send className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalSent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Read</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalRead.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Read Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.readRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Read Time</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.summary.avgReadTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {analytics.oldUnreadCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">
                {analytics.oldUnreadCount} notifications unread for more than 7 days
              </p>
              <p className="text-sm text-yellow-700">
                Consider following up with users who haven't read older notifications.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Stats Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Daily Performance ({getPeriodLabel(period)})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analytics.dailyStats.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{formatDate(day.date)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    <Send className="w-3 h-3 inline mr-1" />
                    {day.sent}
                  </span>
                  <span className="text-green-600">
                    <Eye className="w-3 h-3 inline mr-1" />
                    {day.read}
                  </span>
                  <span className="font-medium text-purple-600">
                    {day.read_rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Performance by Type</h2>
          <div className="space-y-3">
            {analytics.notificationsByType.map((type, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{type.type}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    <Send className="w-3 h-3 inline mr-1" />
                    {type.sent}
                  </span>
                  <span className="text-green-600">
                    <Eye className="w-3 h-3 inline mr-1" />
                    {type.read}
                  </span>
                  <span className="font-medium text-purple-600">
                    {type.readRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Read Time Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Read Time Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-600 mb-1">Average</p>
            <p className="text-2xl font-bold text-blue-900">
              {analytics.readTimeStats.avg_read_hours ?
                `${Math.round(analytics.readTimeStats.avg_read_hours * 10) / 10}h` :
                'N/A'
              }
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-600 mb-1">Fastest</p>
            <p className="text-2xl font-bold text-green-900">
              {analytics.readTimeStats.min_read_hours ?
                `${Math.round(analytics.readTimeStats.min_read_hours * 10) / 10}h` :
                'N/A'
              }
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-orange-600 mb-1">Slowest</p>
            <p className="text-2xl font-bold text-orange-900">
              {analytics.readTimeStats.max_read_hours ?
                `${Math.round(analytics.readTimeStats.max_read_hours * 10) / 10}h` :
                'N/A'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationAnalyticsView;