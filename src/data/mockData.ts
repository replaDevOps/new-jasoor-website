/**
 * mockData.ts - Single source of truth for all mock data.
 * Bug #12 fix: previously each page had its own isolated data island.
 * Bug #13 fix: IDs are now consistent across Browse, Details, and Dashboard.
 * When a real backend API is ready, replace these exports with API calls.
 */

export interface Listing {
  id: number;
  titleAr: string; titleEn: string;
  descriptionAr: string; descriptionEn: string;
  image: string;
  categoryAr: string; categoryEn: string; categoryId: string;
  locationAr: string; locationEn: string;
  revenue: string; profit: string; recovery: string; price: string;
  ref: string; type: 'acquisition' | 'taqbeel'; verified: boolean;
  established: string; staff: string; margin: string; breakEven: string;
  summaryAr: string; summaryEn: string;
  reasonAr: string; reasonEn: string;
  assets: { nameAr: string; nameEn: string; quantity: number; value: string; date: string }[];
  liabilities: { nameAr: string; nameEn: string; quantity: number; value: string; date: string }[];
  inventory: { nameAr: string; nameEn: string; quantity: number; value: string; date: string }[];
  support: { sessions: number; period: string };
}

export const LISTINGS: Listing[] = [
  {
    id: 1,
    titleAr: 'متجر إلكتروني متخصص في القهوة المختصة', titleEn: 'Specialty Coffee E-Commerce Store',
    descriptionAr: 'مشروع قائم ومربح لبيع أدوات ومحاصيل القهوة المختصة مع قاعدة عملاء قوية.', descriptionEn: 'Profitable existing project selling specialty coffee tools and beans with a strong customer base.',
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1000',
    categoryAr: 'تجزئة', categoryEn: 'Retail', categoryId: 'retail',
    locationAr: 'الرياض', locationEn: 'Riyadh',
    revenue: '45,000', profit: '12,000', recovery: '18', price: '250,000',
    ref: 'REF-2045', type: 'acquisition', verified: true,
    established: '2020', staff: '4', margin: '25%', breakEven: '18 Months',
    summaryAr: 'فرصة استثمارية مميزة في قطاع القهوة المتنامي. متجر إلكتروني متكامل بقاعدة عملاء تتجاوز 50,000 وعلامة تجارية موثقة.',
    summaryEn: 'A distinct investment opportunity in the growing coffee sector with over 50,000 customers and a documented brand.',
    reasonAr: 'عدم وجود وقت والرغبة في السيولة للاستثمار في مشروع عقاري جديد.', reasonEn: 'Lack of time and desire for liquidity to invest in a new real estate project.',
    assets: [
      { nameAr: 'ماكينة تحميص صناعية', nameEn: 'Industrial Roasting Machine', quantity: 1, value: '45,000 SAR', date: '2021' },
      { nameAr: 'معدات تعبئة', nameEn: 'Packaging Equipment', quantity: 2, value: '15,000 SAR', date: '2022' },
    ],
    liabilities: [{ nameAr: 'قرض بنك التنمية', nameEn: 'Development Bank Loan', quantity: 1, value: '60,000 SAR', date: '2021' }],
    inventory: [{ nameAr: 'حبوب قهوة خضراء', nameEn: 'Green Coffee Beans', quantity: 500, value: '25,000 SAR', date: '2024' }],
    support: { sessions: 4, period: '3 Months' },
  },
  {
    id: 2,
    titleAr: 'مركز صيانة سيارات متكامل', titleEn: 'Integrated Car Maintenance Center',
    descriptionAr: 'مركز مجهز بالكامل بأحدث المعدات في موقع استراتيجي، عقود حكومية سارية.', descriptionEn: 'Fully equipped center with latest equipment in a strategic location, valid government contracts.',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=1000',
    categoryAr: 'خدمات', categoryEn: 'Services', categoryId: 'services',
    locationAr: 'جدة', locationEn: 'Jeddah',
    revenue: '120,000', profit: '35,000', recovery: '24', price: '850,000',
    ref: 'REF-3092', type: 'taqbeel', verified: true,
    established: '2018', staff: '12', margin: '29%', breakEven: '24 Months',
    summaryAr: 'مركز مجهز بالكامل بأحدث المعدات في موقع استراتيجي، عقود حكومية سارية، وطاقم عمل متخصص.',
    summaryEn: 'Fully equipped center with the latest tools in a prime location, valid government contracts, and a trained team.',
    reasonAr: 'الانتقال للخارج.', reasonEn: 'Relocating abroad.',
    assets: [{ nameAr: 'رافعات هيدروليكية', nameEn: 'Hydraulic Lifts', quantity: 4, value: '80,000 SAR', date: '2019' }],
    liabilities: [],
    inventory: [{ nameAr: 'قطع غيار', nameEn: 'Spare Parts', quantity: 1, value: '30,000 SAR', date: '2024' }],
    support: { sessions: 6, period: '6 Months' },
  },
  {
    id: 4,
    titleAr: 'سلسلة مطاعم برجر (3 فروع)', titleEn: 'Burger Chain (3 Branches)',
    descriptionAr: 'علامة تجارية معروفة في المنطقة الشرقية، تقدم برجر بجودة عالية ووصفات خاصة.', descriptionEn: 'Well-known brand in Eastern region, serving high quality burgers with special recipes.',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1000',
    categoryAr: 'مطاعم', categoryEn: 'Food', categoryId: 'food',
    locationAr: 'الخبر', locationEn: 'Khobar',
    revenue: '280,000', profit: '60,000', recovery: '30', price: '2,500,000',
    ref: 'REF-5521', type: 'acquisition', verified: true,
    established: '2017', staff: '35', margin: '21%', breakEven: '30 Months',
    summaryAr: 'علامة تجارية معروفة في المنطقة الشرقية، تقدم برجر بجودة عالية ووصفات خاصة وتاريخ حافل.',
    summaryEn: 'Well-known brand in the Eastern region serving high-quality burgers with special recipes and a strong track record.',
    reasonAr: 'الرغبة في التقاعد.', reasonEn: 'Desire to retire.',
    assets: [{ nameAr: 'معدات مطبخ', nameEn: 'Kitchen Equipment', quantity: 3, value: '300,000 SAR', date: '2018' }],
    liabilities: [{ nameAr: 'قرض توسعة', nameEn: 'Expansion Loan', quantity: 1, value: '200,000 SAR', date: '2020' }],
    inventory: [],
    support: { sessions: 8, period: '3 Months' },
  },
  {
    id: 5,
    titleAr: 'عيادة تجميل وليزر', titleEn: 'Beauty & Laser Clinic',
    descriptionAr: 'عيادة قائمة بكامل طاقمها الطبي، سمعة ممتازة وتقييمات عالية في خرائط جوجل.', descriptionEn: 'Existing clinic with full medical staff, excellent reputation and high ratings on Google Maps.',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1000',
    categoryAr: 'صحة', categoryEn: 'Health', categoryId: 'health',
    locationAr: 'الرياض', locationEn: 'Riyadh',
    revenue: '350,000', profit: '90,000', recovery: '20', price: '3,200,000',
    ref: 'REF-8823', type: 'acquisition', verified: true,
    established: '2019', staff: '15', margin: '26%', breakEven: '20 Months',
    summaryAr: 'عيادة قائمة بكامل طاقمها الطبي، سمعة ممتازة وتقييمات عالية في خرائط جوجل.',
    summaryEn: 'Established clinic with full medical staff, excellent reputation and high Google Maps ratings.',
    reasonAr: 'الشراكة مع مستثمر استراتيجي.', reasonEn: 'Seeking a strategic investor partnership.',
    assets: [{ nameAr: 'أجهزة ليزر', nameEn: 'Laser Devices', quantity: 5, value: '500,000 SAR', date: '2020' }],
    liabilities: [],
    inventory: [],
    support: { sessions: 4, period: '2 Months' },
  },
  {
    id: 6,
    titleAr: 'مصنع مياه معبأة', titleEn: 'Bottled Water Factory',
    descriptionAr: 'مصنع حديث بطاقة إنتاجية عالية، يمتلك شبكة توزيع واسعة وعقود توريد مستمرة.', descriptionEn: 'Modern factory with high production capacity, wide distribution network and ongoing contracts.',
    image: 'https://images.unsplash.com/photo-1603912699214-92627f304eb6?auto=format&fit=crop&q=80&w=1000',
    categoryAr: 'صناعة', categoryEn: 'Industry', categoryId: 'manufacturing',
    locationAr: 'القصيم', locationEn: 'Qassim',
    revenue: '500,000', profit: '110,000', recovery: '42', price: '6,500,000',
    ref: 'REF-9912', type: 'acquisition', verified: true,
    established: '2016', staff: '50', margin: '22%', breakEven: '42 Months',
    summaryAr: 'مصنع حديث بطاقة إنتاجية عالية، يمتلك شبكة توزيع واسعة وعقود توريد مستمرة.',
    summaryEn: 'Modern factory with high production capacity, wide distribution network and ongoing supply contracts.',
    reasonAr: 'الرغبة في الاندماج مع شركة أكبر.', reasonEn: 'Seeking merger with a larger company.',
    assets: [{ nameAr: 'خطوط إنتاج', nameEn: 'Production Lines', quantity: 3, value: '1,200,000 SAR', date: '2017' }],
    liabilities: [{ nameAr: 'تمويل بنكي', nameEn: 'Bank Financing', quantity: 1, value: '400,000 SAR', date: '2019' }],
    inventory: [{ nameAr: 'مواد خام', nameEn: 'Raw Materials', quantity: 1, value: '80,000 SAR', date: '2024' }],
    support: { sessions: 10, period: '6 Months' },
  },
];

export const getListingById = (id: number): Listing | undefined =>
  LISTINGS.find(l => l.id === id);
