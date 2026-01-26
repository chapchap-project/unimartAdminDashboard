import { DashboardMetrics, Product, ProductStatus, User, Report, Transaction, Announcement, AuditLog, SystemHealth, AnalyticsData, Timeframe, PriorityAlert, FraudQueueItem } from '../types';
import * as data from '../mockData';

// Default URL for local Unimarket backend
const DEFAULT_API_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
const DEFAULT_USE_MOCK = (import.meta as any).env?.VITE_USE_MOCK === 'true';

class ApiService {
  private token: string | null = null;
  private baseUrl: string = DEFAULT_API_URL;
  private useMock: boolean = DEFAULT_USE_MOCK;
  private logs: AuditLog[] = [...data.mockAuditLogs];
  private alerts: PriorityAlert[] = [...data.mockPriorityAlerts];

  constructor() {
    // Load config from localStorage if available
    const storedUrl = localStorage.getItem('api_base_url');
    const storedMock = localStorage.getItem('api_use_mock');

    if (storedUrl) this.baseUrl = storedUrl;
    if (storedMock) this.useMock = storedMock === 'true';
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

  setUseMock(use: boolean) {
    this.useMock = use;
    localStorage.setItem('api_use_mock', String(use));
  }

  isMockMode() {
    return this.useMock;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('/admin/dashboard', { method: 'GET' });
      return true;
    } catch (e) {
      return false;
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> { // Changed options signature
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`, // Correctly prefix with Bearer
      ...(options?.headers || {}),
    };

    // Remove leading slash if present to avoid double slashes with base url
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const cleanBase = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

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
    if (this.useMock) {
      return this.mockLogin(universityEmail, password);
    }

    try {
      return await this.request('auth/login', {
        method: 'POST',
        body: JSON.stringify({ universityEmail, password })
      });
    } catch (error) {
      console.warn('Backend login failed, falling back to mock data.', error);
      return this.mockLogin(universityEmail, password);
    }
  }

  private mockLogin(email: string, _pass: string): { user: User; token: string } {
    const { mockUsers } = data; // We'll need to import this or just use a default
    const user = mockUsers.find(u => u.universityEmail === email) || mockUsers[3]; // Default to Jessica Pearson (Admin)
    return {
      user,
      token: 'mock-jwt-token-for-testing'
    };
  }

  // --- Dashboard ---
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    if (this.useMock) return data.mockMetrics;
    try {
      const [stats, analytics] = await Promise.all([
        this.request<any>('admin/dashboard'),
        this.request<any>('admin/analytics')
      ]);

      return {
        ...stats,
        ...analytics,
        deltas: stats.deltas || data.mockMetrics.deltas // Provide fallback for deltas
      };
    } catch (error) {
      console.warn('Failed to fetch dashboard metrics, falling back to mock.', error);
      return data.mockMetrics;
    }
  }

  async getPriorityAlerts(): Promise<PriorityAlert[]> {
    if (this.useMock) {
      return this.alerts
        .filter(a => a.status === 'ACTIVE' || a.status === 'ESCALATED')
        .sort((a, b) => {
          if (a.status === 'ESCALATED' && b.status !== 'ESCALATED') return -1;
          if (b.status === 'ESCALATED' && a.status !== 'ESCALATED') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
    try {
      return await this.request<PriorityAlert[]>('admin/alerts');
    } catch (error) {
      return this.alerts.filter(a => a.status === 'ACTIVE');
    }
  }

  async updateAlertStatus(id: string, status: PriorityAlert['status'], snoozedUntil?: string): Promise<void> {
    if (this.useMock) {
      const alert = this.alerts.find(a => a.id === id);
      if (alert) {
        alert.status = status;
        if (snoozedUntil) alert.snoozedUntil = snoozedUntil;
      }
      return;
    }

    await this.request(`admin/alerts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, snoozedUntil })
    });
  }

  // Hook for socket simulation
  public pushNewAlert(alert: PriorityAlert) {
    this.alerts.unshift(alert);
  }

  async getFraudQueue(): Promise<FraudQueueItem[]> {
    if (this.useMock) return data.mockFraudQueue;
    try {
      return await this.request<FraudQueueItem[]>('admin/fraud-queue');
    } catch (error) {
      return data.mockFraudQueue;
    }
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    if (this.useMock) return data.mockUsers;
    try {
      return await this.request<User[]>('admin/users');
    } catch (error) {
      return data.mockUsers;
    }
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
    if (this.useMock) return data.mockProducts;
    try {
      return await this.request<Product[]>('admin/listings');
    } catch (error) {
      return data.mockProducts;
    }
  }

  async updateProductStatus(productId: string, status: ProductStatus, reason?: string, note?: string): Promise<void> {
    const product = data.mockProducts.find(p => p.id === productId);
    const previousState = product?.status;

    if (this.useMock) {
      if (product) {
        product.status = status;

        // --- Seller Risk Escalation (Automated Consequences) ---
        const seller = data.mockUsers.find(u => u.id === product.seller.id);
        if (seller) {
          if (status === ProductStatus.REMOVED) {
            seller.riskScore = Math.min(100, (seller.riskScore || 0) + 3);
            seller.pastRemovals = (seller.pastRemovals || 0) + 1;
          } else if (status === ProductStatus.FLAGGED) {
            seller.riskScore = Math.min(100, (seller.riskScore || 0) + 2);
          } else if (status === ProductStatus.HIDDEN) {
            seller.riskScore = Math.min(100, (seller.riskScore || 0) + 1);
          }

          // Auto-Suspension Rule
          if (seller.pastRemovals >= 3 && seller.accountAgeDays < 14) {
            seller.status = 'SUSPENDED';
            this.createAuditLog('AUTO_SUSPEND_USER', seller.id, 'Account auto-suspended: 3+ removals on new account (<14d).', 'ACTIVE', 'SUSPENDED', 'FRAUD_PREVENTION');
          }
        }

        this.createAuditLog(
          'UPDATE_LISTING_STATUS',
          productId,
          note || `Status updated from ${previousState} to ${status}`,
          previousState,
          status,
          reason
        );
      }
      return;
    }

    await this.request(`admin/listings/${productId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason, note, previousState })
    });
  }

  // --- Reports ---
  async getReports(): Promise<Report[]> {
    if (this.useMock) return data.mockReports;
    try {
      return await this.request<Report[]>('admin/reports');
    } catch (error) {
      return data.mockReports;
    }
  }

  async updateReportStatus(reportId: string, status: string): Promise<void> {
    await this.request(`admin/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // --- Transactions ---
  async getTransactions(): Promise<Transaction[]> {
    if (this.useMock) return data.mockTransactions;
    try {
      return await this.request<Transaction[]>('admin/payments');
    } catch (error) {
      return data.mockTransactions;
    }
  }

  // --- Notifications/Announcements ---
  async getAnnouncements(): Promise<Announcement[]> {
    if (this.useMock) return data.mockAnnouncements;
    try {
      return await this.request<Announcement[]>('admin/announcements');
    } catch (error) {
      return data.mockAnnouncements;
    }
  }

  async createAnnouncement(announcement: any): Promise<Announcement> {
    if (this.useMock) {
      const newAnn = {
        ...announcement,
        id: `a${Date.now()}`,
        status: 'ACTIVE',
        postedAt: new Date().toISOString().split('T')[0],
        views: 0,
        author: 'Jessica Pearson'
      };
      // In a real mock we might push to the list, but for now just return it
      return newAnn as Announcement;
    }

    try {
      return await this.request<Announcement>('admin/announcements', {
        method: 'POST',
        body: JSON.stringify(announcement)
      });
    } catch (error) {
      // Fallback for creation is tricky, but let's return a mock object
      return {
        ...announcement,
        id: `a${Date.now()}`,
        status: 'ACTIVE',
        postedAt: new Date().toISOString().split('T')[0],
        views: 0,
        author: 'Jessica Pearson'
      } as Announcement;
    }
  }

  async broadcastNotification(message: string): Promise<void> {
    await this.request('admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // --- Audit Logs ---
  async getAuditLogs(): Promise<AuditLog[]> {
    if (this.useMock) return this.logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    try {
      return await this.request<AuditLog[]>('admin/audit-logs');
    } catch (error) {
      return this.logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  async createAuditLog(
    action: string,
    targetId: string,
    note: string,
    previousState?: string,
    newState?: string,
    reason?: string
  ): Promise<void> {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action,
      targetId,
      note,
      previousState,
      newState,
      reason,
      adminName: 'Jessica Pearson', // Mock current admin
      adminId: 'u4',
      createdAt: new Date().toISOString()
    };

    this.logs.unshift(newLog);

    if (!this.useMock) {
      try {
        await this.request('admin/audit-logs', {
          method: 'POST',
          body: JSON.stringify({ action, targetId, note, previousState, newState, reason })
        });
      } catch (error) {
        console.error("Failed to sync audit log to backend", error);
      }
    }
  }

  // --- System Health ---
  async getSystemHealth(): Promise<SystemHealth> {
    if (this.useMock) return data.mockSystemHealth;
    try {
      return await this.request<SystemHealth>('admin/health');
    } catch (error) {
      return data.mockSystemHealth;
    }
  }

  // --- Analytics ---
  async getAnalytics(timeframe: Timeframe): Promise<AnalyticsData> {
    if (this.useMock) return data.mockAnalyticsData;
    try {
      return await this.request<AnalyticsData>(`admin/analytics?timeframe=${timeframe}`);
    } catch (error) {
      return data.mockAnalyticsData;
    }
  }
}

export const api = new ApiService();
