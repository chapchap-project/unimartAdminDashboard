export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  riskScore: number; // 0-100
  reportCount: number;
  activityCount: number;
  listingCount: number;
  transactionCount: number;
  status: 'ACTIVE' | 'WARNED' | 'RESTRICTED' | 'SUSPENDED';
  createdAt: string;
  profileImage?: string;
  accountAgeDays: number;
  pastRemovals: number;
  credibilityScore: number; // 0-100 for reporters
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  FLAGGED = 'FLAGGED',
  HIDDEN = 'HIDDEN',
  REMOVED = 'REMOVED',
  SOLD = 'SOLD'
}

export enum Category {
  SHOES = 'SHOES',
  FURNITURE = 'FURNITURE',
  ELECTRONICS = 'ELECTRONICS',
  CLOTHING = 'CLOTHING',
  OTHER = 'OTHER'
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: Category;
  price: number;
  location: string;
  seller: { name: string; email: string; id: string };
  status: ProductStatus | 'REMOVED' | 'HIDDEN' | 'PENDING';
  createdAt: string;
  views: number;
  images: string[];
  riskScore: number;
  flags: string[];
  heuristics: HeuristicMatch[];
  history: EditEntry[];
  aiAnalysis?: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reasoning: string;
    suggestedAction: string;
  };
}

export interface HeuristicMatch {
  label: string;
  passed: boolean;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface EditEntry {
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  listing: { title: string };
  buyer: { name: string };
  seller: { name: string };
  amount: number;
  createdAt: string;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  previousState?: string;
  newState?: string;
  targetId: string;
  reason?: string;
  note?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetAudience: 'ALL' | 'BUYERS' | 'SELLERS' | 'FACULTY';
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'EXPIRED';
  postedAt: string;
  expiresAt: string;
  views: number;
  author: string;
}

export interface DashboardMetrics {
  users: number;
  listings: number;
  activeListings: number;
  totalRevenue: number;
  openReports: number;
  flaggedListings: number;
  deltas: {
    users: number;
    activeListings: number;
    revenue: number;
    openReports: number;
    flaggedListings: number;
  };
  usersByDay: Record<string, number>;
  listingsByDay: Record<string, number>;
  revenueByDay: Record<string, number>;
  categoryShares: { category: Category; _count: { id: number } }[];
}

export interface PriorityAlert {
  id: string;
  type: 'FRAUD' | 'SPIKE' | 'REPORT' | 'PAYMENT' | 'SYSTEM';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  status: 'ACTIVE' | 'SNOOZED' | 'DISMISSED' | 'ESCALATED';
  targetId?: string;
  actionLabel?: string;
  actionView?: ViewState;
  snoozedUntil?: string;
  createdAt: string;
}

export interface FraudQueueItem {
  id: string;
  title: string;
  riskScore: number;
  reason: string;
}

export enum SystemStatus {
  OPERATIONAL = 'OPERATIONAL',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN'
}

export interface SystemHealth {
  apiStatus: SystemStatus;
  apiUptime: string;
  apiLatency: number;
  paymentProviderStatus: SystemStatus;
  paymentProviderUptime: string;
  backgroundJobsStatus: SystemStatus;
  backgroundJobsUptime: string;
  deliveryStatus: SystemStatus;
  deliveryUptime: string;
  cpuUsage: number;
  memoryUsage: number;
  lastCheck: string;
}

export type Timeframe = 'TODAY' | '7D' | '30D' | 'CUSTOM';

export interface AnalyticsData {
  growth: { date: string; users: number; listings: number }[];
  fraudRate: { date: string; rate: number }[];
  categoryPerformance: { category: Category; growth: number; revenue: number }[];
  funnel: { stage: string; count: number; percentage: number }[];
  retention: { date: string; newUsers: number; returningUsers: number }[];
  revenueByCategory: { category: Category; revenue: number }[];
}

export type ViewState = 'DASHBOARD' | 'USERS' | 'LISTINGS' | 'REPORTS' | 'TRANSACTIONS' | 'AUDIT_LOGS' | 'ANNOUNCEMENTS' | 'NOTIFICATIONS' | 'NOTIFICATION_ANALYTICS' | 'SYSTEM_HEALTH' | 'ANALYTICS' | 'SETTINGS' | 'LOGS' | 'WALLET';

export interface WalletBalance {
  collection_balance: number;
  service_balance: number;
  currency: string;
}

export interface Report {
  id: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  type: 'LISTING' | 'USER';
  createdAt: string;
  reporter: { name: string; email: string; credibilityScore: number };
  listing?: { title: string; id: string };
  reportedUser?: { name: string; id: string };
}