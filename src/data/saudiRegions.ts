// Saudi Arabia — Regions and Cities
// Source: Saudi_Regions_Cities_Final.xlsx
// 13 regions, 59 cities total

export interface City {
  slug: string;
  en: string;
  ar: string;
}

export interface Region {
  slug: string;
  en: string;
  ar: string;
  cities: City[];
}

export const SAUDI_REGIONS: Region[] = [
  {
    slug: 'riyadh', en: 'Riyadh', ar: 'الرياض',
    cities: [
      { slug: 'riyadh',          en: 'Riyadh',          ar: 'الرياض' },
      { slug: 'al_kharj',        en: 'Al Kharj',        ar: 'الخرج' },
      { slug: 'al_dawadmi',      en: 'Al Dawadmi',      ar: 'الدوادمي' },
      { slug: 'al_majmaah',      en: 'Al Majmaah',      ar: 'المجمعة' },
      { slug: 'wadi_al_dawasir', en: 'Wadi Al Dawasir', ar: 'وادي الدواسر' },
      { slug: 'az_zulfi',        en: 'Az Zulfi',        ar: 'الزلفي' },
    ],
  },
  {
    slug: 'makkah', en: 'Makkah', ar: 'مكة المكرمة',
    cities: [
      { slug: 'makkah',       en: 'Makkah',       ar: 'مكة المكرمة' },
      { slug: 'jeddah',       en: 'Jeddah',       ar: 'جدة' },
      { slug: 'taif',         en: 'Taif',         ar: 'الطائف' },
      { slug: 'al_qunfudhah', en: 'Al Qunfudhah', ar: 'القنفذة' },
      { slug: 'rabigh',       en: 'Rabigh',       ar: 'رابغ' },
    ],
  },
  {
    slug: 'madinah', en: 'Madinah', ar: 'المدينة المنورة',
    cities: [
      { slug: 'madinah', en: 'Madinah', ar: 'المدينة المنورة' },
      { slug: 'yanbu',   en: 'Yanbu',   ar: 'ينبع' },
      { slug: 'khaybar', en: 'Khaybar', ar: 'خيبر' },
      { slug: 'al_ula',  en: 'Al Ula',  ar: 'العلا' },
    ],
  },
  {
    slug: 'qassim', en: 'Qassim', ar: 'القصيم',
    cities: [
      { slug: 'buraydah',     en: 'Buraydah',     ar: 'بريدة' },
      { slug: 'unaizah',      en: 'Unaizah',      ar: 'عنيزة' },
      { slug: 'ar_rass',      en: 'Ar Rass',      ar: 'الرس' },
      { slug: 'al_bukayriyah',en: 'Al Bukayriyah',ar: 'البكيرية' },
    ],
  },
  {
    slug: 'eastern_province', en: 'Eastern Province', ar: 'المنطقة الشرقية',
    cities: [
      { slug: 'dammam',        en: 'Dammam',        ar: 'الدمام' },
      { slug: 'khobar',        en: 'Khobar',        ar: 'الخبر' },
      { slug: 'dhahran',       en: 'Dhahran',       ar: 'الظهران' },
      { slug: 'jubail',        en: 'Jubail',        ar: 'الجبيل' },
      { slug: 'al_ahsa',       en: 'Al Ahsa',       ar: 'الأحساء' },
      { slug: 'qatif',         en: 'Qatif',         ar: 'القطيف' },
      { slug: 'hafar_al_batin',en: 'Hafar Al Batin',ar: 'حفر الباطن' },
      { slug: 'al_khafji',     en: 'Al Khafji',     ar: 'الخفجي' },
    ],
  },
  {
    slug: 'asir', en: 'Asir', ar: 'عسير',
    cities: [
      { slug: 'abha',         en: 'Abha',         ar: 'أبها' },
      { slug: 'khamis_mushait',en:'Khamis Mushait',ar: 'خميس مشيط' },
      { slug: 'mahail_asir',  en: 'Mahail Asir',  ar: 'محايل عسير' },
      { slug: 'bisha',        en: 'Bisha',        ar: 'بيشة' },
      { slug: 'al_namas',     en: 'Al Namas',     ar: 'النماص' },
      { slug: 'sabt_al_alaya',en: 'Sabt Al Alaya',ar: 'سبت العلايا' },
    ],
  },
  {
    slug: 'tabuk', en: 'Tabuk', ar: 'تبوك',
    cities: [
      { slug: 'tabuk',   en: 'Tabuk',   ar: 'تبوك' },
      { slug: 'al_wajh', en: 'Al Wajh', ar: 'الوجه' },
      { slug: 'duba',    en: 'Duba',    ar: 'ضباء' },
      { slug: 'haql',    en: 'Haql',    ar: 'حقل' },
      { slug: 'umluj',   en: 'Umluj',   ar: 'أملج' },
    ],
  },
  {
    slug: 'hail', en: 'Hail', ar: 'حائل',
    cities: [
      { slug: 'hail',        en: 'Hail',        ar: 'حائل' },
      { slug: 'baqaa',       en: 'Baqaa',       ar: 'بقعاء' },
      { slug: 'al_ghazalah', en: 'Al Ghazalah', ar: 'الغزالة' },
      { slug: 'jubbah',      en: 'Jubbah',      ar: 'جبة' },
      { slug: 'ash_shinan',  en: 'Ash Shinan',  ar: 'الشنان' },
    ],
  },
  {
    slug: 'northern_borders', en: 'Northern Borders', ar: 'الحدود الشمالية',
    cities: [
      { slug: 'arar',   en: 'Arar',   ar: 'عرعر' },
      { slug: 'rafha',  en: 'Rafha',  ar: 'رفحاء' },
      { slug: 'turaif', en: 'Turaif', ar: 'طريف' },
    ],
  },
  {
    slug: 'al_jouf', en: 'Al Jouf', ar: 'الجوف',
    cities: [
      { slug: 'sakaka',          en: 'Sakaka',          ar: 'سكاكا' },
      { slug: 'al_qurayyat',     en: 'Al Qurayyat',     ar: 'القريات' },
      { slug: 'dumat_al_jandal', en: 'Dumat Al Jandal', ar: 'دومة الجندل' },
    ],
  },
  {
    slug: 'jazan', en: 'Jazan', ar: 'جازان',
    cities: [
      { slug: 'jazan',     en: 'Jazan',     ar: 'جازان' },
      { slug: 'samtah',    en: 'Samtah',    ar: 'صامطة' },
      { slug: 'abu_arish', en: 'Abu Arish', ar: 'أبو عريش' },
      { slug: 'sabya',     en: 'Sabya',     ar: 'صبيا' },
    ],
  },
  {
    slug: 'najran', en: 'Najran', ar: 'نجران',
    cities: [
      { slug: 'najran',   en: 'Najran',   ar: 'نجران' },
      { slug: 'sharurah', en: 'Sharurah', ar: 'شرورة' },
      { slug: 'hubuna',   en: 'Hubuna',   ar: 'حبونا' },
    ],
  },
  {
    slug: 'al_baha', en: 'Al Baha', ar: 'الباحة',
    cities: [
      { slug: 'al_baha',    en: 'Al Baha',    ar: 'الباحة' },
      { slug: 'baljurashi', en: 'Baljurashi', ar: 'بلجرشي' },
      { slug: 'al_mandaq',  en: 'Al Mandaq',  ar: 'المندق' },
    ],
  },
];
