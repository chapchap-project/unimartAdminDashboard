import { DashboardMetrics, Product, ProductStatus, User, Report, Transaction, Announcement, AuditLog, SystemHealth, AnalyticsData, Timeframe, PriorityAlert, FraudQueueItem } from '../types';

// Default URL for local Unimarket backend
const DEFAULT_API_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiService {
  private token: string | null = null;
  private baseUrl: string = DEFAULT_API_URL;
  private localAlerts: PriorityAlert[] = [];

  constructor() {
    // Load config from localStorage if available
    const storedUrl = localStorage.getItem('api_base_url');
    if (storedUrl) this.baseUrl = storedUrl;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
    localStorage.setItem('api_base_url', url);
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('/admin/dashboard', { method: 'GET' });
      return true;
    } catch (e) {
      return false;
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
      ...(options?.headers || {}),
    };

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const cleanBase = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for safety

    try {
      const response = await fetch(`${cleanBase}${cleanEndpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`API Request to ${endpoint} failed.`, error);
      throw error;
    }
  }

  // --- Auth ---
  async login(universityEmail: string, password: string): Promise<{ user: User; token: string }> {
    return await this.request('auth/login', {
      method: 'POST',
      body: JSON.stringify({ universityEmail, password })
    });
  }

  async getProfile(): Promise<User> {
    return await this.request<User>('profile');
  }

  // --- Dashboard ---
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [stats, analytics] = await Promise.all([
      this.request<any>('admin/dashboard'),
      this.request<any>('admin/analytics')
    ]);

    return {
      ...stats,
      ...analytics,
      // Default deltas if backend hasn't fully calculated them or they are missing
      deltas: stats.deltas || {
        users: 0,
        activeListings: 0,
        revenue: 0,
        openReports: 0,
        flaggedListings: 0
      }
    };
  }

  async getPriorityAlerts(): Promise<PriorityAlert[]> {
    try {
      const dbAlerts = await this.request<PriorityAlert[]>('admin/alerts');
      return [...this.localAlerts, ...dbAlerts];
    } catch (error) {
      console.warn('Failed to fetch alerts from backend, returning local alerts only.');
      return this.localAlerts;
    }
  }

  public pushNewAlert(alert: PriorityAlert) {
    this.localAlerts.unshift(alert);
  }

  async updateAlertStatus(id: string, status: PriorityAlert['status'], snoozedUntil?: string): Promise<void> {
    await this.request(`admin/alerts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, snoozedUntil })
    });
  }

  async getFraudQueue(): Promise<FraudQueueItem[]> {
    return await this.request<FraudQueueItem[]>('admin/fraud-queue');
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    return await this.request<User[]>('admin/users');
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    await this.request(`admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request(`admin/users/${userId}`, { method: 'DELETE' });
  }

  // --- Listings ---
  async getProducts(): Promise<Product[]> {
    return await this.request<Product[]>('admin/listings');
  }

  async updateProductStatus(productId: string, status: ProductStatus, reason?: string, note?: string): Promise<void> {
    await this.request(`admin/listings/${productId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason, note })
    });
  }

  // --- Reports ---
  async getReports(): Promise<Report[]> {
    return await this.request<Report[]>('admin/reports');
  }

  async updateReportStatus(reportId: string, status: string): Promise<void> {
    await this.request(`admin/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // --- Transactions ---
  async getTransactions(): Promise<Transaction[]> {
    return await this.request<Transaction[]>('admin/payments');
  }

  // --- Notifications/Announcements ---
  async getAnnouncements(): Promise<Announcement[]> {
    const logs = await this.getAuditLogs();
    return logs
      .filter(log => log.action === 'BROADCAST_NOTIFICATION')
      .map(log => ({
        id: log.id,
        title: 'System Broadcast',
        message: (log as any).message || (log as any).note || 'No content',
        targetAudience: 'ALL',
        priority: 'INFO',
        status: 'ACTIVE',
        postedAt: log.createdAt.split('T')[0],
        expiresAt: '2099-12-31',
        views: 0,
        author: log.adminName
      } as Announcement));
  }

  async createAnnouncement(announcement: any): Promise<Announcement> {
    const broadcastMessage = `[${announcement.priority}] ${announcement.title}: ${announcement.message}`;
    await this.request('admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ message: broadcastMessage })
    });

    return {
      ...announcement,
      id: `a${Date.now()}`,
      status: 'ACTIVE',
      postedAt: new Date().toISOString().split('T')[0],
      views: 0,
      author: 'Admin'
    } as Announcement;
  }

  async broadcastNotification(message: string): Promise<void> {
    await this.request('admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // --- Audit Logs ---
  async getAuditLogs(): Promise<AuditLog[]> {
    return await this.request<AuditLog[]>('admin/audit-logs');
  }

  async createAuditLog(
    action: string,
    targetId: string,
    note: string,
    previousState?: string,
    newState?: string,
    reason?: string
  ): Promise<void> {
    await this.request('admin/audit-logs', {
      method: 'POST',
      body: JSON.stringify({ action, targetId, note, previousState, newState, reason })
    });
  }

  // --- System Health ---
  async getSystemHealth(): Promise<SystemHealth> {
    return await this.request<SystemHealth>('admin/health');
  }

  // --- Analytics ---
  async getAnalytics(timeframe: Timeframe): Promise<AnalyticsData> {
    return await this.request<AnalyticsData>(`admin/analytics?timeframe=${timeframe}`);
  }
}

export const api = new ApiService();
