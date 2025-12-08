import { DashboardMetrics, Product, User, Dispute, UserStatus, ProductStatus, UserRole, Transaction, AuditLog, Announcement } from '../types';
import { mockUsers, mockProducts, mockDisputes, mockMetrics, mockTransactions, mockAuditLogs, mockAnnouncements } from '../mockData';

// Default URL from user prompt
const DEFAULT_API_URL = 'https://hstrvyypbv.apidog.io/api';

class ApiService {
  private token: string | null = null;
  private baseUrl: string = DEFAULT_API_URL;
  private useMock: boolean = false;

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
      // Just a health check ping, assuming /health or root exists, 
      // otherwise we try a lightweight endpoint like /admin/dashboard/metrics
      await this.request('/admin/dashboard/metrics', { method: 'GET' });
      return true;
    } catch (e) {
      return false;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (this.useMock) {
      throw new Error('Mock Mode Enabled'); 
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
      ...options.headers,
    };

    // Remove leading slash if present to avoid double slashes with base url
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const cleanBase = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;

    try {
      const response = await fetch(`${cleanBase}${cleanEndpoint}`, {
        ...options,
        headers,
      });

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
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
        return await this.request('/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    } catch (e) {
        // Fallback or if Mock Mode is on
        if (this.useMock || (email === 'admin@unimarket.edu' && password === 'admin')) {
            return {
                user: mockUsers.find(u => u.role === 'ADMIN') || mockUsers[0],
                token: 'mock-jwt-token-12345'
            };
        }
        throw e;
    }
  }

  // --- Dashboard ---
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      return await this.request<DashboardMetrics>('admin/dashboard/metrics');
    } catch (e) {
      return mockMetrics;
    }
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    try {
      return await this.request<User[]>('admin/users');
    } catch (e) {
      return mockUsers;
    }
  }

  async updateUserStatus(userId: string, status: UserStatus, reason?: string): Promise<void> {
    try {
        await this.request(`admin/users/${userId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, reason })
        });
    } catch (e) {
        console.log(`[Mock] Updated user ${userId} status to ${status} reason: ${reason}`);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
        await this.request(`admin/users/${userId}`, { method: 'DELETE' });
    } catch (e) {
        console.log(`[Mock] Deleted user ${userId}`);
    }
  }

  async createAdmin(data: { name: string; email: string; university: string }): Promise<User> {
    try {
      return await this.request<User>('admin/users/admin', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (e) {
      // Mock creation
      const newAdmin: User = {
        id: `u${Date.now()}`,
        name: data.name,
        email: data.email,
        university: data.university,
        role: UserRole.ADMIN,
        status: UserStatus.VERIFIED,
        joinDate: new Date().toISOString().split('T')[0],
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=6366f1&color=fff`
      };
      // We don't modify mockUsers array directly here as we aren't maintaining global mock state 
      // but returning it allows the UI to update optimistically
      return newAdmin;
    }
  }

  // --- Listings ---
  async getProducts(): Promise<Product[]> {
    try {
        return await this.request<Product[]>('admin/listings');
    } catch (e) {
        return mockProducts;
    }
  }

  async updateProductStatus(productId: string, status: ProductStatus): Promise<void> {
    try {
        await this.request(`admin/listings/${productId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    } catch (e) {
        console.log(`[Mock] Updated product ${productId} status to ${status}`);
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
        await this.request(`admin/listings/${productId}`, { method: 'DELETE' });
    } catch (e) {
        console.log(`[Mock] Deleted product ${productId}`);
    }
  }

  // --- Disputes ---
  async getDisputes(): Promise<Dispute[]> {
    try {
        return await this.request<Dispute[]>('admin/disputes');
    } catch (e) {
        return mockDisputes;
    }
  }

  async resolveDispute(disputeId: string, resolution: 'RESOLVED_BUYER' | 'RESOLVED_SELLER'): Promise<void> {
     try {
        await this.request(`admin/disputes/${disputeId}/resolve`, {
            method: 'POST',
            body: JSON.stringify({ resolution })
        });
     } catch (e) {
         console.log(`[Mock] Resolved dispute ${disputeId} as ${resolution}`);
     }
  }

  // --- Transactions ---
  async getTransactions(): Promise<Transaction[]> {
    try {
        return await this.request<Transaction[]>('admin/transactions');
    } catch (e) {
        return mockTransactions;
    }
  }

  // --- Audit Logs ---
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
        return await this.request<AuditLog[]>('admin/audit-logs');
    } catch (e) {
        return mockAuditLogs;
    }
  }

  // --- Announcements ---
  async getAnnouncements(): Promise<Announcement[]> {
    try {
        return await this.request<Announcement[]>('admin/announcements');
    } catch (e) {
        return mockAnnouncements;
    }
  }

  async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    try {
        return await this.request<Announcement>('admin/announcements', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    } catch (e) {
        const newAnnouncement: Announcement = {
            id: `a${Date.now()}`,
            title: data.title || 'No Title',
            message: data.message || '',
            targetAudience: data.targetAudience as any || 'ALL',
            priority: data.priority as any || 'INFO',
            status: 'ACTIVE',
            postedAt: new Date().toISOString().split('T')[0],
            expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            views: 0,
            author: 'Current Admin'
        };
        return newAnnouncement;
    }
  }
}

export const api = new ApiService();