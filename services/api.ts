import { DashboardMetrics, Product, ProductStatus, User, Report, Transaction, Announcement, AuditLog, SystemHealth, AnalyticsData, Timeframe, PriorityAlert, FraudQueueItem, WalletBalance, SupportTicket, TicketStatus, TicketPriority } from '../types';

// Default URL for local Unimarket backend
const DEFAULT_API_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiService {
  private baseUrl: string = DEFAULT_API_URL;
  private localAlerts: PriorityAlert[] = [];

  constructor() {
    const storedUrl = localStorage.getItem('api_base_url');
    if (storedUrl) this.baseUrl = storedUrl;

    // One-time migration: remove any token previously stored in localStorage
    localStorage.removeItem('auth_token');
  }

  // Token is now stored in an HttpOnly cookie managed by the browser.
  // These stubs exist so call sites don't need changes but do nothing.
  setToken(_token: string) {}
  getToken() { return null; }

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const cleanBase = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${cleanBase}${cleanEndpoint}`, {
        ...options,
        headers,
        credentials: 'include', // send the HttpOnly admin_token cookie automatically
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as any).message || `API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`API Request to ${endpoint} failed.`, error);
      throw error;
    }
  }

  // --- Auth ---
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    return await this.request('auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async logout(): Promise<void> {
    // Instructs the backend to clear the HttpOnly cookie.
    await this.request('auth/logout', { method: 'POST' });
  }

  async getProfile(): Promise<User> {
    const response = await this.request<any>('profile');
    return response.data || response;
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
  async createUser(data: Partial<User>): Promise<{ message: string, user: User }> {
    return await this.request<{ message: string, user: User }>('admin/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateUserData(userId: string, data: { name: string, email: string }): Promise<{ message: string, user: User }> {
    return await this.request<{ message: string, user: User }>(`admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async updateUserStatus(userId: string, status: string): Promise<{ message: string, user: User }> {
    return await this.request<{ message: string, user: User }>(`admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async notifyUser(userId: string, payload: { message: string, title?: string, type?: string }): Promise<{ message: string }> {
    return await this.request<{ message: string }>(`admin/users/${userId}/notify`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getUsers(page = 1, limit = 50): Promise<{ users: User[], totalItems: number, totalPages: number }> {
    const response = await this.request<any>(`admin/users?page=${page}&limit=${limit}`);
    return {
      users: response.users || [],
      totalItems: response.totalItems || 0,
      totalPages: response.totalPages || 1
    };
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
  async getProducts(page = 1, limit = 50): Promise<{ listings: Product[], totalItems: number, totalPages: number, pendingCount: number }> {
    const response = await this.request<any>(`admin/listings?page=${page}&limit=${limit}`);
    return {
      listings: response.listings || [],
      totalItems: response.totalItems || 0,
      totalPages: response.totalPages || 1,
      pendingCount: response.pendingCount ?? 0,
    };
  }

  async updateProductStatus(productId: string, status: ProductStatus, rejectionReason?: string, note?: string): Promise<void> {
    await this.request(`admin/listings/${productId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason, note })
    });
  }

  async createProduct(data: any): Promise<{ message: string, listing: Product }> {
    return await this.request<{ message: string, listing: Product }>('admin/listings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // --- Reports ---
  async getReports(page = 1, limit = 50): Promise<{ reports: Report[], totalItems: number, totalPages: number }> {
    const response = await this.request<any>(`admin/reports?page=${page}&limit=${limit}`);
    return {
      reports: response.reports || [],
      totalItems: response.totalItems || 0,
      totalPages: response.totalPages || 1
    };
  }

  async updateReportStatus(reportId: string, status: string): Promise<void> {
    await this.request(`admin/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // --- Transactions ---
  async getTransactions(page = 1, limit = 50): Promise<{ payments: Transaction[], totalItems: number, totalPages: number }> {
    const response = await this.request<any>(`admin/payments?page=${page}&limit=${limit}`);
    return {
      payments: response.payments || [],
      totalItems: response.totalItems || 0,
      totalPages: response.totalPages || 1
    };
  }

  // --- Notifications/Announcements ---
  async getAnnouncements(): Promise<Announcement[]> {
    const logs = await this.getAuditLogs();
    
    return logs
      .filter(log => log.action === 'BROADCAST_NOTIFICATION')
      .map(log => {
        const details = log as any;
        const messageText = details.message || details.note || 'No content';
        const expiresAtRaw = details.expiresAt || '2099-12-31';
        
        // Determine status based on expiration date
        const isExpired = new Date(expiresAtRaw) < new Date();
        const computedStatus = isExpired ? 'EXPIRED' : 'ACTIVE';

        return {
          id: log.id,
          title: 'System Broadcast',
          message: messageText,
          targetAudience: 'ALL',
          priority: 'INFO',
          status: computedStatus,
          postedAt: log.createdAt.split('T')[0],
          expiresAt: expiresAtRaw.split('T')[0],
          views: 0,
          author: log.adminName
        } as Announcement;
      });
  }

  async createAnnouncement(announcement: any): Promise<Announcement> {
    const broadcastMessage = `[${announcement.priority}] ${announcement.title}: ${announcement.message}`;
    await this.request('admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ message: broadcastMessage, expiresAt: announcement.expiresAt })
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

  // --- User Notifications ---
  async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<{ users: User[], currentPage: number, totalPages: number, totalItems: number }> {
    return await this.request(`admin/users/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  }

  async sendNotificationToUser(userId: string, data: { message: string, title?: string, type?: string, sendEmail?: boolean, emailSubject?: string }): Promise<{ message: string, notification: any, emailSent: boolean }> {
    return await this.request(`admin/users/${userId}/notify`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getNotificationTemplates(): Promise<{ templates: any[], categories: string[], count: number }> {
    return await this.request('admin/notifications/templates', {
      method: 'GET'
    });
  }

  async getNotificationAnalytics(period?: string, type?: string): Promise<any> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (type) params.append('type', type);

    return await this.request(`admin/notifications/analytics?${params.toString()}`, {
      method: 'GET'
    });
  }

  // --- Scheduled Notifications ---
  async createScheduledNotification(data: {
    title?: string;
    message: string;
    type?: string;
    targetType: 'all' | 'university' | 'specific';
    targetValue?: string;
    userIds?: string[];
    scheduledAt: string;
    sendEmail?: boolean;
    emailSubject?: string;
  }): Promise<{ message: string; notification: any }> {
    return await this.request('admin/notifications/scheduled', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScheduledNotifications(status?: string, page = 1, limit = 20): Promise<{
    notifications: any[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    return await this.request(`admin/notifications/scheduled?${params.toString()}`, { method: 'GET' });
  }

  async cancelScheduledNotification(id: string): Promise<{ message: string; notification: any }> {
    return await this.request(`admin/notifications/scheduled/${id}`, { method: 'DELETE' });
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

  // --- System Health & Logs ---
  async getSystemHealth(): Promise<SystemHealth> {
    return await this.request<SystemHealth>('admin/health');
  }

  async getLogFiles(): Promise<{filename: string, size: number, modifiedAt: string}[]> {
    return await this.request<{filename: string, size: number, modifiedAt: string}[]>('admin/logs/files');
  }

  async getLogContent(filename: string): Promise<string> {
    const endpoint = `admin/logs/${filename}`;
    // Using custom logic since this endpoint returns text, not JSON
    const headers = {
      'Authorization': `Bearer ${this.getToken()}`,
    };
    
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const cleanBase = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    
    const response = await fetch(`${cleanBase}${cleanEndpoint}`, { headers });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }

  // --- Analytics ---
  async getAnalytics(timeframe: Timeframe): Promise<AnalyticsData> {
    return await this.request<AnalyticsData>(`admin/analytics?timeframe=${timeframe}`);
  }

  // --- Wallet Management ---
  async getWalletBalance(): Promise<WalletBalance> {
    return await this.request<WalletBalance>('admin/wallet/balance');
  }

  async topupServiceWallet(amount: number, phoneNumber: string): Promise<{ success: boolean; message: string; checkoutRequestId?: string }> {
    return await this.request<any>('admin/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, phoneNumber })
    });
  }

  // --- Support Tickets ---
  async getSupportTickets(params?: {
    page?: number; limit?: number;
    status?: TicketStatus; priority?: TicketPriority;
    category?: string; search?: string;
  }): Promise<{ tickets: SupportTicket[]; total: number; page: number; totalPages: number; statusCounts: Record<string, number> }> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    if (params?.priority) q.set('priority', params.priority);
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    return await this.request<any>(`admin/support?${q.toString()}`);
  }

  async getSupportTicket(id: string): Promise<SupportTicket> {
    return await this.request<SupportTicket>(`admin/support/${id}`);
  }

  async updateSupportTicket(id: string, data: { status?: TicketStatus; priority?: TicketPriority; adminNote?: string }): Promise<{ message: string; ticket: SupportTicket }> {
    return await this.request<any>(`admin/support/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
