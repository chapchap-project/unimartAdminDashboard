export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

export enum UserStatus {
  VERIFIED = 'VERIFIED',
  PENDING = 'PENDING',
  BANNED = 'BANNED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  role: UserRole;
  status: UserStatus;
  joinDate: string;
  avatarUrl: string;
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  FLAGGED = 'FLAGGED'
}

export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  seller: string;
  status: ProductStatus;
  postedDate: string;
  views: number;
  likes: number;
}

export interface Transaction {
  id: string;
  product: string;
  buyer: string;
  seller: string;
  amount: number;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'DISPUTED';
}

export interface DashboardMetrics {
  totalUsers: number;
  activeListings: number;
  totalRevenue: number;
  pendingDisputes: number;
  dailyActiveUsers: number[];
  revenueData: { name: string; value: number }[];
  categoryDistribution: { name: string; value: number }[];
}

export type ViewState = 'DASHBOARD' | 'USERS' | 'LISTINGS' | 'DISPUTES';

export interface DisputeMessage {
  id: string;
  sender: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  text: string;
  timestamp: string;
}

export interface Dispute {
  id: string;
  transactionId: string;
  reporter: string;
  reportedUser: string;
  productName: string;
  amount: number;
  reason: string;
  description: string;
  status: 'OPEN' | 'RESOLVED_BUYER' | 'RESOLVED_SELLER';
  date: string;
  evidence: string[];
  messages: DisputeMessage[];
}