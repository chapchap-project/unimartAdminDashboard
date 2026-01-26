import { User, Product, Transaction, DashboardMetrics, UserRole, ProductStatus, Report, AuditLog, Announcement, Category, AnalyticsData, PriorityAlert, FraudQueueItem } from './types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Alex Johnson', universityEmail: 'alex.j@uni.edu', role: UserRole.USER, isVerified: true, riskScore: 12, reportCount: 0, activityCount: 154, listingCount: 12, transactionCount: 8, status: 'ACTIVE', createdAt: '2023-09-01T12:00:00Z', accountAgeDays: 145, pastRemovals: 0, credibilityScore: 85 },
  { id: 'u2', name: 'Sarah Connor', universityEmail: 's.connor@tech.edu', role: UserRole.USER, isVerified: true, riskScore: 5, reportCount: 0, activityCount: 320, listingCount: 25, transactionCount: 18, status: 'ACTIVE', createdAt: '2023-09-15T12:00:00Z', accountAgeDays: 130, pastRemovals: 0, credibilityScore: 95 },
  { id: 'u3', name: 'Mike Ross', universityEmail: 'mike.r@law.edu', role: UserRole.USER, isVerified: false, riskScore: 45, reportCount: 2, activityCount: 85, listingCount: 5, transactionCount: 2, status: 'WARNED', createdAt: '2023-10-02T12:00:00Z', accountAgeDays: 110, pastRemovals: 1, credibilityScore: 60 },
  { id: 'u4', name: 'Jessica Pearson', universityEmail: 'j.pearson@uni.edu', role: UserRole.ADMIN, isVerified: true, riskScore: 2, reportCount: 0, activityCount: 2000, listingCount: 0, transactionCount: 50, status: 'ACTIVE', createdAt: '2023-08-20T12:00:00Z', accountAgeDays: 155, pastRemovals: 0, credibilityScore: 100 },
  { id: 'u5', name: 'Louis Litt', universityEmail: 'l.litt@law.edu', role: UserRole.USER, isVerified: true, riskScore: 88, reportCount: 15, activityCount: 500, listingCount: 40, transactionCount: 35, status: 'RESTRICTED', createdAt: '2023-11-05T12:00:00Z', accountAgeDays: 80, pastRemovals: 4, credibilityScore: 40 },
  { id: 'u6', name: 'Trevor Evans', universityEmail: 't.evans@uni.edu', role: UserRole.USER, isVerified: false, riskScore: 95, reportCount: 28, activityCount: 45, listingCount: 10, transactionCount: 1, status: 'SUSPENDED', createdAt: '2024-01-10T09:00:00Z', accountAgeDays: 12, pastRemovals: 8, credibilityScore: 10 },
];

export const mockProducts: Product[] = [
  {
    id: 'p1',
    title: 'Calculus 3 Textbook',
    description: 'Good condition, slightly worn edges.',
    category: Category.TEXTBOOKS,
    price: 45,
    location: 'Main Campus Library',
    seller: { id: 'u1', name: 'Alex Johnson', universityEmail: 'alex.j@uni.edu' },
    status: ProductStatus.ACTIVE,
    createdAt: '2023-10-25T12:00:00Z',
    views: 145,
    images: ['https://picsum.photos/400/400?random=11'],
    riskScore: 0.5,
    flags: [],
    heuristics: [
      { label: 'Price vs Market', passed: true, severity: 'INFO' },
      { label: 'Account Age Check', passed: true, severity: 'INFO' }
    ],
    history: []
  },
  {
    id: 'p6',
    title: 'MacBook Pro 2021',
    description: 'Box opened but never used. Selling because I got a new one.',
    category: Category.ELECTRONICS,
    price: 500,
    location: 'Student Union',
    seller: { id: 'u6', name: 'Trevor Evans', universityEmail: 'suspicious@gmail.com' },
    status: ProductStatus.ACTIVE,
    createdAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    views: 890,
    images: ['https://picsum.photos/400/400?random=12', 'https://picsum.photos/400/400?random=13'],
    riskScore: 8.5,
    flags: ['SCAM_LANGUAGE', 'UNDERPRICED'],
    heuristics: [
      { label: 'Price 60% below median', passed: false, severity: 'CRITICAL' },
      { label: 'New account (<24h)', passed: false, severity: 'WARNING' },
      { label: 'Scam language detected', passed: false, severity: 'CRITICAL' }
    ],
    history: [
      { field: 'price', oldValue: '1200', newValue: '500', timestamp: new Date(Date.now() - 1000 * 3600 * 1).toISOString() }
    ]
  },
  {
    id: 'p7',
    title: 'iPhone 15 Pro Max',
    description: 'Won it in a contest, dont need it. Message me on Whatsapp +254712345678.',
    category: Category.ELECTRONICS,
    price: 400,
    location: 'Off-Campus',
    seller: { id: 'u5', name: 'Louis Litt', universityEmail: 'l.litt@law.edu' },
    status: ProductStatus.ACTIVE,
    createdAt: new Date(Date.now() - 1000 * 3600 * 5).toISOString(),
    views: 412,
    images: ['https://picsum.photos/400/400?random=14'],
    riskScore: 7.2,
    flags: ['EXTERNAL_CONTACT'],
    heuristics: [
      { label: 'External contact detected', passed: false, severity: 'CRITICAL' },
      { label: 'Image reuse (hash match)', passed: false, severity: 'WARNING' }
    ],
    history: []
  }
];

export const mockTransactions: Transaction[] = [
  ...Array(5).fill(0).map((_, i) => ({
    id: `t${i + 1}`,
    listing: { title: 'Mini Fridge' },
    buyer: { name: 'Mike Ross' },
    seller: { name: 'Sarah Connor' },
    amount: 80,
    createdAt: '2023-10-22T12:00:00Z',
    paymentStatus: 'SUCCESS' as const,
    paymentMethod: 'STRIPE'
  }))
];

export const mockReports: Report[] = [
  {
    id: 'r1',
    reason: 'Item Significantly Not as Described',
    description: 'The listing stated the laptop was in "Good Condition" but the screen flickers violently when turned on.',
    status: 'PENDING',
    type: 'LISTING',
    createdAt: '2023-10-26T12:00:00Z',
    reporter: { name: 'Sarah Connor', universityEmail: 's.connor@tech.edu', credibilityScore: 95 },
    listing: { title: 'HP Pavilion Laptop 15"', id: 'p101' },
    reportedUser: { name: 'Louis Litt', id: 'u5' }
  },
  {
    id: 'r2',
    reason: 'Item Not Received',
    description: 'I paid for this item 5 days ago and the seller claims to have dropped it off but it was not there.',
    status: 'PENDING',
    type: 'USER',
    createdAt: '2023-10-28T12:00:00Z',
    reporter: { name: 'Mike Ross', universityEmail: 'mike.r@law.edu', credibilityScore: 60 },
    reportedUser: { name: 'Alex Johnson', id: 'u1' }
  }
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'log1', adminName: 'Jessica Pearson', adminId: 'u4', action: 'SUSPEND_USER', targetId: 'u6', previousState: 'ACTIVE', newState: 'SUSPENDED', reason: 'POLICY_VIOLATION', note: 'Full account suspension for high risk score (95%) and multiple fraud reports.', createdAt: '2024-01-10T09:15:00Z' },
  { id: 'log2', adminName: 'Jessica Pearson', adminId: 'u4', action: 'RESTRICT_USER', targetId: 'u5', previousState: 'ACTIVE', newState: 'RESTRICTED', reason: 'SUSPICIOUS_ACTIVITY', note: 'Marketplace privileges restricted due to suspicious activity pattern.', createdAt: '2023-11-05T15:30:00Z' },
  { id: 'log3', adminName: 'Jessica Pearson', adminId: 'u4', action: 'WARN_USER', targetId: 'u3', reason: 'MISLEADING_CONTENT', note: 'Official warning issued for "Item Not as Described" report.', createdAt: '2023-11-02T11:20:00Z' },
  { id: 'log4', adminName: 'Jessica Pearson', adminId: 'u4', action: 'CREATE_BROADCAST', targetId: 'a1', note: 'Posted announcement: "Platform Maintenance Scheduled".', createdAt: '2023-11-08T10:00:00Z' },
  { id: 'log5', adminName: 'Jessica Pearson', adminId: 'u4', action: 'DELETE_LISTING', targetId: 'p201', previousState: 'ACTIVE', newState: 'REMOVED', reason: 'PROHIBITED_ITEM', note: 'Removed prohibited item: "Counterfeit Textbook PDF".', createdAt: '2023-11-07T16:45:00Z' },
  { id: 'log6', adminName: 'System', adminId: 'system', action: 'FLAG_LISTING', targetId: 'p5', previousState: 'ACTIVE', newState: 'FLAGGED', note: 'AI Flagged for potential prohibited content', createdAt: '2023-10-26T11:00:00Z' },
  { id: 'log7', adminName: 'Jessica Pearson', adminId: 'u4', action: 'UPDATE_SYSTEM_SETTINGS', targetId: 'config', note: 'Changed marketplace commission fee from 2.5% to 3.0%.', createdAt: '2023-10-30T14:00:00Z' },
  { id: 'log8', adminName: 'Jessica Pearson', adminId: 'u4', action: 'RESOLVE_DISPUTE', targetId: 'd2', note: 'Resolved in favor of buyer due to lack of shipping proof', createdAt: '2023-11-04T09:15:00Z' },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'a1',
    title: 'Platform Maintenance Scheduled',
    message: 'Unimarket will be down for scheduled maintenance on Sunday, Nov 12th from 2AM to 4AM EST.',
    targetAudience: 'ALL',
    priority: 'WARNING',
    status: 'ACTIVE',
    postedAt: '2023-11-08',
    expiresAt: '2023-11-12',
    views: 1250,
    author: 'Jessica Pearson'
  },
  {
    id: 'a2',
    title: 'Safety Tip: Meeting in Person',
    message: 'Remember to always meet in well-lit, public areas when exchanging items. The Campus Library is a designated safe zone.',
    targetAudience: 'ALL',
    priority: 'INFO',
    status: 'ACTIVE',
    postedAt: '2023-11-01',
    expiresAt: '2023-12-01',
    views: 3420,
    author: 'System'
  },
  {
    id: 'a3',
    title: 'New Feature: Instant Messaging',
    message: 'You can now message buyers and sellers directly within the app without sharing your phone number.',
    targetAudience: 'ALL',
    priority: 'INFO',
    status: 'EXPIRED',
    postedAt: '2023-10-01',
    expiresAt: '2023-10-15',
    views: 5600,
    author: 'Jessica Pearson'
  }
];

export const mockMetrics: DashboardMetrics = {
  users: 12543,
  listings: 3420,
  activeListings: 3150,
  totalRevenue: 145230,
  openReports: 12,
  flaggedListings: 8,
  deltas: {
    users: 12,
    activeListings: 5,
    revenue: 8.4,
    openReports: -15,
    flaggedListings: 22
  },
  usersByDay: { 'Mon': 450, 'Tue': 520, 'Wed': 480, 'Thu': 600, 'Fri': 750, 'Sat': 800, 'Sun': 720 },
  listingsByDay: { 'Mon': 10, 'Tue': 15, 'Wed': 8, 'Thu': 20, 'Fri': 25, 'Sat': 30, 'Sun': 22 },
  revenueByDay: { 'Mon': 2400, 'Tue': 1398, 'Wed': 9800, 'Thu': 3908, 'Fri': 4800, 'Sat': 3800, 'Sun': 4300 },
  categoryShares: [
    { category: Category.TEXTBOOKS, _count: { id: 45 } },
    { category: Category.ELECTRONICS, _count: { id: 25 } },
    { category: Category.FURNITURE, _count: { id: 20 } },
    { category: Category.CLOTHING, _count: { id: 10 } },
  ],
};

export const mockPriorityAlerts: PriorityAlert[] = [
  {
    id: 'a1',
    type: 'FRAUD',
    severity: 'CRITICAL',
    message: '3 High-risk listings require immediate review',
    status: 'ACTIVE',
    targetId: 'p6',
    actionLabel: 'Review Now',
    actionView: 'LISTINGS',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15m ago
  },
  {
    id: 'a2',
    type: 'SPIKE',
    severity: 'WARNING',
    message: 'Spike in Electronics listings detected (+42% vs avg)',
    status: 'ACTIVE',
    actionLabel: 'View Listings',
    actionView: 'LISTINGS',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45m ago
  },
  {
    id: 'a3',
    type: 'PAYMENT',
    severity: 'INFO',
    message: 'Payment gateway stable with 0% failure rate',
    status: 'ACTIVE',
    actionLabel: 'Monitor Health',
    actionView: 'SYSTEM_HEALTH',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2h ago
  },
];

export const mockFraudQueue: FraudQueueItem[] = [
  { id: 'p6', title: 'MacBook Pro 2021', riskScore: 8.5, reason: 'Underpriced + New seller profile' },
  { id: 'p7', title: 'iPhone 15 Pro Max', riskScore: 7.2, reason: 'Scam language patterns detected' },
  { id: 'p8', title: 'Sony WH-1000XM5', riskScore: 6.8, reason: 'Duplicate listing from different university' },
  { id: 'p3', title: 'Graphing Calculator', riskScore: 6.5, reason: 'High velocity listing' },
  { id: 'p5', title: 'Intro to Psychology', riskScore: 6.2, reason: 'Inconsistent metadata patterns' },
];

export const mockSystemHealth: any = {
  apiStatus: 'OPERATIONAL',
  apiUptime: '99.98%',
  apiLatency: 45,
  paymentProviderStatus: 'OPERATIONAL',
  paymentProviderUptime: '99.99%',
  backgroundJobsStatus: 'DEGRADED',
  backgroundJobsUptime: '98.50%',
  deliveryStatus: 'OPERATIONAL',
  deliveryUptime: '99.95%',
  cpuUsage: 24,
  memoryUsage: 62,
  lastCheck: new Date().toISOString()
};

export const mockAnalyticsData: AnalyticsData = {
  growth: [
    { date: '2023-11-01', users: 12000, listings: 3000 },
    { date: '2023-11-02', users: 12100, listings: 3050 },
    { date: '2023-11-03', users: 12300, listings: 3100 },
    { date: '2023-11-04', users: 12450, listings: 3200 },
    { date: '2023-11-05', users: 12600, listings: 3300 },
    { date: '2023-11-06', users: 12800, listings: 3420 },
  ],
  fraudRate: [
    { date: '2023-11-01', rate: 1.2 },
    { date: '2023-11-02', rate: 1.0 },
    { date: '2023-11-03', rate: 1.5 },
    { date: '2023-11-04', rate: 0.8 },
    { date: '2023-11-05', rate: 0.9 },
    { date: '2023-11-06', rate: 0.7 },
  ],
  categoryPerformance: [
    { category: Category.TEXTBOOKS, growth: 12, revenue: 45000 },
    { category: Category.ELECTRONICS, growth: 25, revenue: 38000 },
    { category: Category.FURNITURE, growth: -5, revenue: 22000 },
    { category: Category.CLOTHING, growth: 18, revenue: 15000 },
  ],
  funnel: [
    { stage: 'Visitors', count: 50000, percentage: 100 },
    { stage: 'Prod View', count: 35000, percentage: 70 },
    { stage: 'Add Cart', count: 12000, percentage: 24 },
    { stage: 'Checkout', count: 8000, percentage: 16 },
    { stage: 'Purchase', count: 6500, percentage: 13 },
  ],
  retention: [
    { date: '2023-11-01', newUsers: 450, returningUsers: 1200 },
    { date: '2023-11-02', newUsers: 520, returningUsers: 1150 },
    { date: '2023-11-03', newUsers: 480, returningUsers: 1300 },
    { date: '2023-11-04', newUsers: 600, returningUsers: 1250 },
    { date: '2023-11-05', newUsers: 750, returningUsers: 1400 },
    { date: '2023-11-06', newUsers: 800, returningUsers: 1450 },
  ],
  revenueByCategory: [
    { category: Category.TEXTBOOKS, revenue: 45000 },
    { category: Category.ELECTRONICS, revenue: 38000 },
    { category: Category.FURNITURE, revenue: 22000 },
    { category: Category.CLOTHING, revenue: 15000 },
    { category: Category.OTHER, revenue: 8000 },
  ]
};