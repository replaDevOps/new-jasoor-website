// ─────────────────────────────────────────────────────────────────────────────
// Dashboard mock data — single source of truth
// Replace these with real API calls when the backend is ready
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_USER = {
  name: 'أحمد الراشد',
  nameEn: 'Ahmed Al-Rashid',
  email: 'ahmed@example.com',
  phone: '+966 54 354 3654',
  city: 'الرياض',
  cityEn: 'Riyadh',
  region: 'الوسطى',
  regionEn: 'Central',
  memberSince: 'يناير 2024',
  memberSinceEn: 'January 2024',
  avatar: 'A',
};

export const LISTINGS = [
  { id: 1, title: 'سلسلة مطاعم برجر فاخرة', titleEn: 'Premium Burger Restaurant Chain', location: 'الرياض، العليا', locationEn: 'Riyadh, Olaya', price: '2,500,000', status: 'active', views: 1250, offers: 3, favorites: 45, image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=400' },
  { id: 2, title: 'تطبيق توصيل طلبات', titleEn: 'Delivery App', location: 'جدة، التحلية', locationEn: 'Jeddah, Tahlia', price: '850,000', status: 'under-review', views: 0, offers: 0, favorites: 0, image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=400' },
  { id: 3, title: 'مقهى مختص', titleEn: 'Specialty Coffee Shop', location: 'الدمام، الشاطئ', locationEn: 'Dammam, Beachfront', price: '450,000', status: 'sold', views: 3400, offers: 12, favorites: 120, image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400' },
];

export const OFFERS = [
  { id: 101, listingTitle: 'سلسلة مطاعم برجر فاخرة', listingTitleEn: 'Premium Burger Restaurant Chain', buyerName: 'عبدالله **', buyerNameEn: 'Abdullah **', listingPrice: '2,500,000', offerPrice: '2,300,000', date: '2024-03-10', status: 'pending', type: 'full', direction: 'received' },
  { id: 102, listingTitle: 'سلسلة مطاعم برجر فاخرة', listingTitleEn: 'Premium Burger Restaurant Chain', buyerName: 'فيصل **', buyerNameEn: 'Faisal **', listingPrice: '2,500,000', offerPrice: '2,100,000', date: '2024-03-08', status: 'rejected', type: 'preliminary', direction: 'received' },
  { id: 103, listingTitle: 'مقهى مختص', listingTitleEn: 'Specialty Coffee Shop', buyerName: 'محمد **', buyerNameEn: 'Mohammed **', listingPrice: '450,000', offerPrice: '450,000', date: '2024-02-15', status: 'accepted', type: 'instant', direction: 'received' },
  { id: 104, listingTitle: 'شركة تقنية ناشئة', listingTitleEn: 'Tech Startup', buyerName: 'أحمد الراشد', buyerNameEn: 'Ahmed Al-Rashid', listingPrice: '1,200,000', offerPrice: '1,100,000', date: '2024-03-12', status: 'sent', type: 'full', direction: 'sent' },
];

export const MEETINGS = [
  { id: 1, with: 'محمد **', withEn: 'Mohammed **', role: 'مستثمر', roleEn: 'Investor', reqDate: '2024-03-14', recDate: '2024-03-14', prefDate: '2024-03-20 10:00 AM', schedDate: '2024-03-20 10:00 AM', status: 'scheduled', link: 'https://zoom.us/j/987654' },
  { id: 2, with: 'سارة **', withEn: 'Sarah **', role: 'بائع', roleEn: 'Seller', reqDate: '2024-03-10', recDate: '2024-03-10', prefDate: '2024-03-18 02:30 PM', schedDate: '2024-03-18 02:30 PM', status: 'scheduled', link: 'https://zoom.us/j/123456' },
  { id: 3, with: 'خالد **', withEn: 'Khalid **', role: 'مستثمر', roleEn: 'Investor', reqDate: '2024-02-01', recDate: '2024-02-01', prefDate: '2024-02-05 09:00 AM', schedDate: '2024-02-05 09:00 AM', status: 'past', link: null },
];

export const getDeals = (content: any) => [
  { id: 'JUS-DEAL-001', title: 'منصة SaaS للشركات الناشئة', titleEn: 'SaaS Platform for Startups', seller: 'أحمد **', sellerEn: 'Ahmed **', buyer: 'خالد **', buyerEn: 'Khalid **', finalOffer: '4,800,000', status: 'in-progress', finalizedDate: '2024-01-22', startDate: '2024-01-22', expectedDate: '2024-02-15', progress: 50, currentStep: 3, steps: [ { id: 1, title: content.dashboard.deals.steps.platformFee.title, desc: content.dashboard.deals.steps.platformFee.desc, status: 'verified' }, { id: 2, title: content.dashboard.deals.steps.contract.title, desc: content.dashboard.deals.steps.contract.desc, status: 'signed' }, { id: 3, title: content.dashboard.deals.steps.payment.title, desc: content.dashboard.deals.steps.payment.desc, status: 'pending' }, { id: 4, title: content.dashboard.deals.steps.finalize.title, desc: content.dashboard.deals.steps.finalize.desc, status: 'pending' } ], files: [] },
  { id: 'JUS-DEAL-002', title: 'مقهى مختص', titleEn: 'Specialty Coffee Shop', seller: 'أحمد **', sellerEn: 'Ahmed **', buyer: 'محمد **', buyerEn: 'Mohammed **', finalOffer: '450,000', status: 'completed', finalizedDate: '2024-02-20', startDate: '2024-02-01', expectedDate: '2024-02-20', progress: 100, currentStep: 4, steps: [ { id: 1, title: content.dashboard.deals.steps.platformFee.title, desc: content.dashboard.deals.steps.platformFee.desc, status: 'verified' }, { id: 2, title: content.dashboard.deals.steps.contract.title, desc: content.dashboard.deals.steps.contract.desc, status: 'verified' }, { id: 3, title: content.dashboard.deals.steps.payment.title, desc: content.dashboard.deals.steps.payment.desc, status: 'verified' }, { id: 4, title: content.dashboard.deals.steps.finalize.title, desc: content.dashboard.deals.steps.finalize.desc, status: 'verified' } ], files: [ { name: 'Sale_Contract.pdf', size: '2.4 MB' }, { name: 'Payment_Receipt.pdf', size: '1.1 MB' }, { name: 'Ownership_Transfer.pdf', size: '3.5 MB' } ] },
];

export const getAlerts = (language: string) => [
  { id: 1, title: language === 'ar' ? 'عرض مضاد جديد' : 'New Counter Offer', desc: language === 'ar' ? 'تلقيت عرضاً مضاداً على "سلسلة مطاعم برجر"' : 'You received a counter offer on "Burger Restaurant Chain"', time: language === 'ar' ? 'منذ ساعتين' : '2 hours ago', type: 'offer' },
  { id: 2, title: language === 'ar' ? 'تأكيد دفع العمولة' : 'Commission Payment Confirmed', desc: language === 'ar' ? 'تم تأكيد استلام عمولة المنصة بنجاح' : 'Platform commission received successfully', time: language === 'ar' ? 'منذ 5 ساعات' : '5 hours ago', type: 'payment' },
];

export const getWalletAccounts = (language: string) => [
  { id: 1, bank: language === 'ar' ? 'مصرف الراجحي' : 'Al Rajhi Bank', holder: language === 'ar' ? 'أحمد الراشد' : 'Ahmed Al-Rashid', iban: 'SA56 8000 0000 0000 1234', last4: '1234' },
];

export const getStats = (content: any) => [
  { label: content.dashboard.stats.views, value: '1,250', colorClass: 'bg-blue-50 text-blue-600' },
  { label: content.dashboard.stats.listedBusinesses, value: '3', colorClass: 'bg-purple-50 text-purple-600' },
  { label: content.dashboard.stats.receivedOffers, value: '8', colorClass: 'bg-orange-50 text-orange-600' },
  { label: content.dashboard.stats.meetingRequests, value: '4', colorClass: 'bg-yellow-50 text-yellow-600' },
  { label: content.dashboard.stats.scheduledMeetings, value: '2', colorClass: 'bg-indigo-50 text-indigo-600' },
  { label: content.dashboard.stats.closedDeals, value: '1', colorClass: 'bg-green-50 text-green-600' },
];
