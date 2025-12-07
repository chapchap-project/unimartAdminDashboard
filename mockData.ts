import { User, Product, Transaction, DashboardMetrics, UserRole, UserStatus, ProductStatus, Dispute } from './types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Alex Johnson', email: 'alex.j@uni.edu', university: 'State University', role: UserRole.STUDENT, status: UserStatus.VERIFIED, joinDate: '2023-09-01', avatarUrl: 'https://picsum.photos/200/200?random=1' },
  { id: 'u2', name: 'Sarah Connor', email: 's.connor@tech.edu', university: 'Tech Institute', role: UserRole.STUDENT, status: UserStatus.VERIFIED, joinDate: '2023-09-15', avatarUrl: 'https://picsum.photos/200/200?random=2' },
  { id: 'u3', name: 'Mike Ross', email: 'mike.r@law.edu', university: 'Law College', role: UserRole.STUDENT, status: UserStatus.PENDING, joinDate: '2023-10-02', avatarUrl: 'https://picsum.photos/200/200?random=3' },
  { id: 'u4', name: 'Jessica Pearson', email: 'j.pearson@uni.edu', university: 'State University', role: UserRole.ADMIN, status: UserStatus.VERIFIED, joinDate: '2023-08-20', avatarUrl: 'https://picsum.photos/200/200?random=4' },
  { id: 'u5', name: 'Louis Litt', email: 'l.litt@law.edu', university: 'Law College', role: UserRole.STUDENT, status: UserStatus.BANNED, joinDate: '2023-11-05', avatarUrl: 'https://picsum.photos/200/200?random=5' },
];

export const mockProducts: Product[] = [
  { id: 'p1', title: 'Calculus 3 Textbook', category: 'Textbooks', price: 45, seller: 'Alex Johnson', status: ProductStatus.ACTIVE, postedDate: '2023-10-25', views: 120, likes: 5 },
  { id: 'p2', title: 'Mini Fridge', category: 'Furniture', price: 80, seller: 'Sarah Connor', status: ProductStatus.SOLD, postedDate: '2023-10-20', views: 340, likes: 12 },
  { id: 'p3', title: 'Graphing Calculator', category: 'Electronics', price: 60, seller: 'Mike Ross', status: ProductStatus.ACTIVE, postedDate: '2023-10-28', views: 85, likes: 2 },
  { id: 'p4', title: 'Study Desk Lamp', category: 'Furniture', price: 15, seller: 'Alex Johnson', status: ProductStatus.ACTIVE, postedDate: '2023-10-29', views: 45, likes: 0 },
  { id: 'p5', title: 'Intro to Psychology', category: 'Textbooks', price: 30, seller: 'Louis Litt', status: ProductStatus.FLAGGED, postedDate: '2023-10-26', views: 200, likes: 1 },
];

export const mockTransactions: Transaction[] = [
  { id: 't1', product: 'Mini Fridge', buyer: 'Mike Ross', seller: 'Sarah Connor', amount: 80, date: '2023-10-22', status: 'COMPLETED' },
  { id: 't2', product: 'Chemistry Set', buyer: 'Alex Johnson', seller: 'Jessica Pearson', amount: 50, date: '2023-10-24', status: 'COMPLETED' },
  { id: 't3', product: 'Broken Laptop', buyer: 'Sarah Connor', seller: 'Louis Litt', amount: 120, date: '2023-10-25', status: 'DISPUTED' },
];

export const mockDisputes: Dispute[] = [
  {
    id: 'd1',
    transactionId: 't3',
    reporter: 'Sarah Connor',
    reportedUser: 'Louis Litt',
    productName: 'HP Pavilion Laptop 15"',
    amount: 120,
    reason: 'Item Significantly Not as Described',
    description: 'The listing stated the laptop was in "Good Condition" but the screen flickers violently when turned on and the ' +
                 'battery does not hold a charge. I tried contacting the seller but they refused a refund.',
    status: 'OPEN',
    date: '2023-10-26',
    evidence: [
      'https://picsum.photos/400/300?random=101', 
      'https://picsum.photos/400/300?random=102'
    ],
    messages: [
      { id: 'm1', role: 'BUYER', sender: 'Sarah Connor', text: 'Hi, I just received the laptop. The screen is flickering. You said it was good condition.', timestamp: 'Oct 25, 10:30 AM' },
      { id: 'm2', role: 'SELLER', sender: 'Louis Litt', text: 'It was working perfectly when I shipped it. Must be shipping damage. Not my problem.', timestamp: 'Oct 25, 11:15 AM' },
      { id: 'm3', role: 'BUYER', sender: 'Sarah Connor', text: 'The box was undamaged. This is a hardware issue. I want a refund.', timestamp: 'Oct 25, 11:30 AM' },
      { id: 'm4', role: 'SELLER', sender: 'Louis Litt', text: 'No refunds. Final sale.', timestamp: 'Oct 25, 11:45 AM' },
    ]
  },
  {
    id: 'd2',
    transactionId: 't4',
    reporter: 'Mike Ross',
    reportedUser: 'Alex Johnson',
    productName: 'Organic Chemistry Set',
    amount: 55,
    reason: 'Item Not Received',
    description: 'I paid for this item 5 days ago and the seller claims to have dropped it off at the student center, but it was not there.',
    status: 'OPEN',
    date: '2023-10-28',
    evidence: [],
    messages: [
      { id: 'm5', role: 'BUYER', sender: 'Mike Ross', text: 'Hey, I checked the front desk, no package for me.', timestamp: 'Oct 27, 09:00 AM' },
      { id: 'm6', role: 'SELLER', sender: 'Alex Johnson', text: 'I definitely left it there. Maybe someone took it?', timestamp: 'Oct 27, 09:30 AM' },
    ]
  }
];

export const mockMetrics: DashboardMetrics = {
  totalUsers: 12543,
  activeListings: 3420,
  totalRevenue: 145230,
  pendingDisputes: 12,
  dailyActiveUsers: [450, 520, 480, 600, 750, 800, 720],
  revenueData: [
    { name: 'Mon', value: 2400 },
    { name: 'Tue', value: 1398 },
    { name: 'Wed', value: 9800 },
    { name: 'Thu', value: 3908 },
    { name: 'Fri', value: 4800 },
    { name: 'Sat', value: 3800 },
    { name: 'Sun', value: 4300 },
  ],
  categoryDistribution: [
    { name: 'Textbooks', value: 45 },
    { name: 'Electronics', value: 25 },
    { name: 'Furniture', value: 20 },
    { name: 'Clothing', value: 10 },
  ]
};