import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, ChevronLeft, Upload, Plus, Trash2, 
  CheckCircle2, AlertCircle, Calendar,
  Briefcase, FileText, ArrowRight, ArrowLeft, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { SAUDI_REGIONS } from '../../data/saudiRegions';
// P5-FIX R-06: wire real createBusiness mutation + file upload
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_BUSINESS, UPDATE_BUSINESS } from '../../graphql/mutations/business';
import { GET_CATEGORIES, GET_BUSINESS } from '../../graphql/queries/business';
import { useFileUpload } from '../../hooks/useFileUpload';

type ListingMode = 'create' | 'edit';

interface ListingWizardProps {
  mode?: ListingMode;
  initialData?: Record<string, unknown>;
  onClose?: () => void;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const ListingWizard = ({ mode = 'create', initialData, onClose, onSuccess, onCancel }: ListingWizardProps) => {
  const { language, direction } = useApp();
  const isAr = language === 'ar';
  const [currentStep, setCurrentStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  // P5-FIX R-06: real submission hooks
  const [createBusiness, { loading: createSubmitting }] = useMutation(CREATE_BUSINESS, { errorPolicy: 'all' });
  const [updateBusiness, { loading: updateSubmitting }] = useMutation(UPDATE_BUSINESS, { errorPolicy: 'all' });
  const submitting = createSubmitting || updateSubmitting;
  const { uploadFile, uploading: fileUploading } = useFileUpload();

  // BUG-9 FIX: real category IDs from API (same pattern as BrowseBusinesses.tsx R-05)
  const { data: categoriesData } = useQuery(GET_CATEGORIES, { fetchPolicy: 'cache-first' });
  const apiCategories: { id: string; name: string; arabicName: string }[] =
    categoriesData?.getAllCategories?.categories ?? [];

  // EDIT MODE: fetch existing business data
  const editId = mode === 'edit' ? String(initialData?.id ?? '') : '';
  const { data: editData, loading: editLoading } = useQuery(GET_BUSINESS, {
    variables: { getBusinessByIdId: editId },
    skip: mode !== 'edit' || !editId,
    fetchPolicy: 'network-only',
  });
  
  // --- Content Generators based on Language ---
  const t = useMemo(() => {
    const isAr = language === 'ar';
    return {
      // General
      back: isAr ? 'رجوع' : 'Back',
      next: isAr ? 'التالي' : 'Next',
      cancel: isAr ? 'إلغاء' : 'Cancel',
      saveDraft: isAr ? 'حفظ كمسودة' : 'Save as Draft',
      publish: isAr ? 'نشر الإدراج' : 'Publish Listing',
      saveChanges: isAr ? 'حفظ التعديلات' : 'Save Changes',
      underReview: isAr ? 'قيد المراجعة' : 'Under Review',
      
      // Headers
      createTitle: isAr ? 'أدرج شركتك' : 'Create Listing',
      editTitle: isAr ? 'تعديل الإدراج' : 'Edit Listing',
      createDesc: isAr ? 'حدثنا عن شركتك / مؤسستك. نحن نساعدك في الوصول للمستثمرين الجادين.' : 'Tell us about your company. We help you reach serious investors.',
      editDesc: isAr ? 'قم بتحديث بيانات شركتك لضمان دقة المعلومات للمشترين.' : 'Update your company data to ensure accuracy for buyers.',
      
      // Step 1
      sellingType: isAr ? 'نوع البيع' : 'Selling Type',
      sellingTypeReq: isAr ? 'يرجى اختيار نوع البيع' : 'Please select a selling type',
      acquisition: isAr ? 'بيع بالاستحواذ' : 'Acquisition',
      acquisitionDesc: isAr ? 'يشمل العلامة التجارية، السجل التجاري، الأصول، والالتزامات.' : 'Includes brand, CR, assets, and liabilities.',
      assetSale: isAr ? 'بيع بالتقبيل' : 'Asset Sale (Taqbeel)',
      assetSaleDesc: isAr ? 'يشمل الأصول فقط دون العلامة التجارية أو السجل التجاري.' : 'Includes assets only, without brand or CR.',
      
      bizTitle: isAr ? 'اسم الشركة / المؤسسة' : 'Business Title',
      bizTitlePh: isAr ? 'اكتب اسم الشركة/ المؤسسة' : 'Write business name',
      
      category: isAr ? 'القطاع التجاري' : 'Business Category',
      categoryPh: isAr ? 'اختر القطاع التجاري' : 'Choose business category',
      
      region: isAr ? 'المنطقة' : 'Region',
      regionPh: isAr ? 'اختر المنطقة' : 'Choose Region',
      
      city: isAr ? 'المدينة' : 'City',
      cityPh: isAr ? 'اختر المدينة' : 'Choose City',
      
      foundation: isAr ? 'سنة التأسيس' : 'Foundation Year',
      foundationPh: isAr ? 'اختر السنة' : 'Select Year',
      
      team: isAr ? 'حجم الفريق' : 'Team Size',
      teamPh: isAr ? 'العدد' : 'Count', // Shortened for mobile
      
      desc: isAr ? 'الوصف' : 'Description',
      descPh: isAr ? 'اكتب وصفًا عن شركتك / مؤسستك' : 'Write description about your business',
      
      website: isAr ? 'رابط الموقع الإلكتروني' : 'Business Website URL',
      websitePh: isAr ? 'أضف رابط الموقع الإلكتروني' : 'Add website url',

      // Step 2
      financialTitle: isAr ? 'البيانات المالية' : 'Financial & Growth Information',
      financialDesc: isAr ? 'شارك بيانات شركتك المالية والنمو' : 'Share your business numbers & potential',
      financialSub: isAr ? 'تساعد هذه المعلومات المستثمرين في فهم قيمة شركتك بشكل أفضل.' : 'These numbers help buyers understand your business value.',
      
      revenue: isAr ? 'المبيعات' : 'Revenue',
      revenuePh: isAr ? 'ادخل المبيعات' : 'Enter Revenue',
      
      profit: isAr ? 'الأرباح' : 'Profit',
      profitPh: isAr ? 'ادخل الارباح' : 'Enter Profit',
      
      margin: isAr ? 'هامش الربح %' : 'Margin %', // Shortened
      marginPh: isAr ? '20' : '20',
      
      price: isAr ? 'سعر البيع' : 'Asking Price',
      pricePh: isAr ? 'المبلغ' : 'Amount',
      
      assets: isAr ? 'الأصول' : 'Key Assets',
      addAsset: isAr ? 'إضافة أصل' : 'Add Asset',
      assetName: isAr ? 'اسم الأصل' : 'Asset Name',
      assetCount: isAr ? 'العدد' : 'Count',
      assetYear: isAr ? 'سنة الشراء' : 'Year',
      assetPrice: isAr ? 'السعر' : 'Price',
      noAssets: isAr ? 'لا توجد أصول مضافة' : 'No assets added',
      
      liabilities: isAr ? 'الالتزامات / الديون' : 'Outstanding Liabilities',
      addLiability: isAr ? 'إضافة التزام' : 'Add Liability',
      liabilityName: isAr ? 'اسم الالتزام' : 'Liability Name',
      liabilityDate: isAr ? 'تاريخ البدء' : 'Start Date',
      noLiabilities: isAr ? 'لا توجد التزامات مضافة' : 'No liabilities added',
      
      inventory: isAr ? 'المخزون' : 'Inventory',
      addItem: isAr ? 'إضافة عنصر' : 'Add Item',
      itemName: isAr ? 'الاسم' : 'Item Name',
      noItems: isAr ? 'لم يتم إضافة عناصر مخزون' : 'No items added',

      // Step 3
      visionTitle: isAr ? 'رؤية الشركة وخطط الخروج' : 'Business Vision & Exit Plans',
      visionDesc: isAr ? 'وضّح للمشترين فرص نمو الشركة وخططك للدعم بعد البيع.' : 'Help buyers understand the future potential and support plans.',
      
      supportDur: isAr ? 'مدة الدعم (أشهر)' : 'Support (Months)',
      supportDurPh: isAr ? 'المدة' : 'Duration',
      
      supportSess: isAr ? 'جلسات الدعم' : 'Support Sessions',
      supportSessPh: isAr ? 'العدد' : 'Count',
      
      growth: isAr ? 'فرص النمو (اختياري)' : 'Growth Opportunities (Optional)',
      growthPh: isAr ? 'تحدث عن فرص التوسع...' : 'Talk about expansion opportunities...',
      
      reason: isAr ? 'سبب البيع' : 'Reason for Selling',
      reasonPh: isAr ? 'اشرح بإيجاز...' : 'Briefly explain why...',

      // Step 4
      docsTitle: isAr ? 'إرفاق الوثائق' : 'Document Uploads',
      docsDesc: isAr ? 'البيانات الموثقة تعزز ثقة المشتري وتسرع عملية البيع.' : 'Verified data builds buyer confidence and speeds up the process.',
      
      cr: isAr ? 'السجل التجاري' : 'Commercial Registration (CR)',
      crReq: isAr ? 'مطلوب' : 'Required',
      upload: isAr ? 'إرفاق' : 'Upload',
      uploadCRPh: isAr ? 'اضغط لرفع السجل التجاري' : 'Click to upload CR',
      formats: isAr ? 'الصيغ المقبولة: PDF, JPG, PNG. الحد الأقصى: 10 ميجابايت.' : 'Accepted formats: PDF, JPG, PNG. Max size: 10MB.',
      uploaded: isAr ? 'تم الرفع اليوم' : 'Uploaded Today',
      
      otherDocs: isAr ? 'إرفاق وثائق أخرى (اختياري)' : 'Upload Other Documents (Optional)',
      otherDocsPh: isAr ? 'إرفاق ملفات إضافية' : 'Upload additional files',

      // Modals & Success
      cancelTitle: isAr ? 'إلغاء الإدراج؟' : 'Cancel Listing?',
      cancelMsg: isAr ? 'هل أنت متأكد؟ سيتم فقدان جميع البيانات غير المحفوظة.' : 'Are you sure? All unsaved data will be lost.',
      confirm: isAr ? 'تأكيد' : 'Confirm',
      
      successTitleCreate: isAr ? 'إدراجك قيد المراجعة' : 'Listing Under Review',
      successMsgCreate: isAr ? 'إدراجك قيد المراجعة حالياً من قبل فريق جسور. سيتم إشعارك فور الموافقة عليه ونشره.' : 'Your listing is currently under review by Jusoor team. You will be notified once approved.',
      successTitleEdit: isAr ? 'تم حفظ التعديلات' : 'Changes Saved',
      successMsgEdit: isAr ? 'تم تحديث بيانات الإدراج بنجاح.' : 'Your listing data has been updated successfully.',
      backHome: isAr ? 'العودة للرئيسية' : 'Back to Home',
      newList: isAr ? 'إدراج جديد' : 'New Listing',
      
      privacy: isAr ? 'ملاحظة:' : 'Confidential Note:',
      privacyText: isAr ? 'نحن ملتزمون بالحفاظ على سرية معلوماتك. لن يظهر اسم الشركة أو هوية المالك أو أي بيانات حساسة للمشتري إلا بعد توقيع اتفاقية عدم الإفصاح (NDA).' : 'We are committed to maintaining the confidentiality of your information. No sensitive data will be shown without a signed NDA.',
      help: isAr ? 'للمساعدة:' : 'Need Help:',
      
      fillReq: isAr ? 'يرجى تعبئة الحقول الإلزامية' : 'Please fill required fields',
      draftSaved: isAr ? 'تم حفظ المسودة بنجاح' : 'Draft saved successfully',
      changesSaved: isAr ? 'تم حفظ التعديلات بنجاح' : 'Changes saved successfully',
    };
  }, [language]);

  const steps = useMemo(() => [
    { id: 1, title: language === 'ar' ? 'بيانات الشركة' : 'Basic Information' },
    { id: 2, title: language === 'ar' ? 'البيانات المالية' : 'Financial & Growth' },
    { id: 3, title: language === 'ar' ? 'رؤية الشركة' : 'Vision & Exit Plans' },
    { id: 4, title: language === 'ar' ? 'إرفاق الوثائق' : 'Document Uploads' },
  ], [language]);

  const periodOptions = useMemo(() => [
    { value: 'last_6_months', label: language === 'ar' ? 'آخر 6 أشهر' : 'Last 6 months' },
    { value: 'last_year', label: language === 'ar' ? 'آخر سنة' : 'Last year' },
    { value: 'last_2_years', label: language === 'ar' ? 'آخر سنتين' : 'Last 2 years' },
    { value: 'ytd', label: language === 'ar' ? 'منذ بداية العام' : 'YTD' }
  ], [language]);

  // Annualize a value to a 12-month equivalent based on its period
  const toAnnual = (value: number, period: string): number => {
    if (period === 'last_6_months') return value * 2;
    if (period === 'last_2_years')  return value / 2;
    return value; // last_year + ytd treated as annual
  };

  // Margin = annualized profit / annualized revenue * 100
  const calcMargin = (): number | null => {
    const rev = Number(formData.revenue);
    const pro = Number(formData.profit);
    if (!rev || !pro || rev <= 0) return null;
    const annualRev = toAnnual(rev, formData.revenuePeriod);
    const annualPro = toAnnual(pro, formData.profitPeriod);
    if (annualRev <= 0) return null;
    return parseFloat(((annualPro / annualRev) * 100).toFixed(1));
  };

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 50 }, (_, i) => currentYear - i);
  }, []);

  const defaultData = {
    // Step 1
    sellingType: '',
    title: '',
    category: '',
    region: '',
    city: '',
    foundationDate: '',
    teamSize: '',
    description: '',
    website: '',
    // Step 2
    revenue: '',
    revenuePeriod: 'last_6_months',
    profit: '',
    profitPeriod: 'last_year',
    profitMargin: '',
    price: '',
    capitalRecovery: '',
    assets: [],
    liabilities: [],
    inventory: [],
    // Step 3
    supportDuration: '',
    supportSessions: '',
    growthOpportunities: '',
    reason: '',
    // Step 4
    crFile: null,
    otherFiles: []
  };

  const [formData, setFormData] = useState(() => {
    // BUG-12 FIX: restore saved draft on mount if present (initialData takes priority for edit mode)
    try {
      if (!initialData || Object.keys(initialData).length === 0) {
        const saved = localStorage.getItem('jusoor_listing_draft');
        if (saved) return { ...defaultData, ...JSON.parse(saved) };
      }
    } catch { /* ignore parse errors */ }
    return { ...defaultData };
  });

  // Populate form when edit data loads from API
  React.useEffect(() => {
    if (mode !== 'edit' || !editData?.getBusinessById?.business) return;
    const b = editData.getBusinessById.business;

    // Reverse-map English region/city names (stored on backend) back to slugs (used by selects).
    const regionMatch = SAUDI_REGIONS.find(r => r.en === b.district) ?? SAUDI_REGIONS.find(r => r.slug === b.district) ?? null;
    const regionSlug = regionMatch?.slug ?? b.district ?? '';
    const citySlug = regionMatch?.cities.find(c => c.en === b.city)?.slug
      ?? regionMatch?.cities.find(c => c.slug === b.city)?.slug
      ?? b.city ?? '';

    setFormData(prev => ({
      ...prev,
      // Step 1
      sellingType: b.isByTakbeer ? 'selling_by_taqbeel' : 'selling_by_acquiring',
      title: b.businessTitle ?? '',
      category: b.category?.id ?? '',
      region: regionSlug,
      city: citySlug,
      district: regionSlug,
      description: b.description ?? '',
      foundationDate: b.foundedDate ? String(new Date(b.foundedDate).getFullYear()) : '',
      teamSize: b.numberOfEmployees ? String(b.numberOfEmployees) : '',
      website: b.url ?? '',
      // Step 2
      revenue: b.revenue ? String(b.revenue) : '',
      profit: b.profit ? String(b.profit) : '',
      price: b.price ? String(b.price) : '',
      capitalRecovery: b.capitalRecovery ? String(b.capitalRecovery) : '',
      assets: (b.assets ?? []).map((a: any) => ({
        name: a.name ?? '',
        count: String(a.quantity ?? 1),
        year: String(a.purchaseYear ?? new Date().getFullYear()),
        price: String(a.price ?? 0),
      })),
      liabilities: (b.liabilities ?? []).map((a: any) => ({
        name: a.name ?? '',
        amount: String(a.price ?? 0),
        year: String(a.purchaseYear ?? new Date().getFullYear()),
      })),
      inventory: (b.inventoryItems ?? []).map((a: any) => ({
        name: a.name ?? '',
        quantity: String(a.quantity ?? 1),
        price: String(a.price ?? 0),
      })),
      // Step 3
      reason: b.reason ?? '',
      growthOpportunities: b.growthOpportunities ?? '',
      supportSessions: b.supportSession ? String(b.supportSession) : '',
      supportDuration: b.supportDuration ? String(b.supportDuration) : '',
    }));
  }, [editData, mode]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleNext = () => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.sellingType || !['selling_by_acquiring','selling_by_taqbeel'].includes(formData.sellingType)) errs.sellingType = isAr ? 'يرجى اختيار نوع البيع' : 'Please select a selling type';
      if (!formData.title)       errs.title       = isAr ? 'يرجى إدخال اسم الشركة' : 'Please enter business title';
      if (!formData.category)    errs.category    = isAr ? 'يرجى اختيار القطاع' : 'Please select a category';
      if (!formData.region)      errs.region      = isAr ? 'يرجى اختيار المنطقة' : 'Please select a region';
      if (!formData.city)        errs.city        = isAr ? 'يرجى اختيار المدينة' : 'Please select a city';
    }
    if (currentStep === 2) {
      if (!formData.price)   errs.price   = isAr ? 'يرجى إدخال سعر الطلب' : 'Please enter the asking price';
      if (!formData.revenue) errs.revenue = isAr ? 'يرجى إدخال الإيرادات' : 'Please enter revenue';
      if (!formData.profit)  errs.profit  = isAr ? 'يرجى إدخال الأرباح' : 'Please enter profit';
    }
    if (currentStep === 3) {
      if (!formData.description) errs.description = isAr ? 'يرجى إدخال وصف الشركة' : 'Please enter a business description';
    }

    if (Object.keys(errs).length > 0) {
      setStepErrors(errs);
      toast.error(t.fillReq);
      window.scrollTo(0, 0);
      return;
    }

    setStepErrors({});
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    // P5-FIX R-06: submit real listing to backend via createBusiness mutation
    // NOTE: setIsSubmitted(true) is intentionally called AFTER a successful mutation,
    // not at the start — to prevent the success screen flashing during file uploads.
    try {
      // Upload CR file if present (Step 4)
      let crDocument = null;
      if (formData.crFile instanceof File) {
        const uploaded = await uploadFile(formData.crFile, 'Commercial Registration');
        if (uploaded) {
          crDocument = {
            title: 'Commercial Registration',
            fileName: uploaded.fileName,
            filePath: uploaded.filePath,
            fileType: uploaded.fileType,
            description: 'CR document',
          };
        }
      }

      // Upload additional files
      const otherDocuments: any[] = [];
      if (Array.isArray(formData.otherFiles)) {
        for (const f of formData.otherFiles as File[]) {
          if (f instanceof File) {
            const uploaded = await uploadFile(f, f.name);
            if (uploaded) {
              otherDocuments.push({
                title: uploaded.title || f.name,
                fileName: uploaded.fileName,
                filePath: uploaded.filePath,
                fileType: uploaded.fileType,
                description: '',
              });
            }
          }
        }
      }

      // Map formData → CreateBusinessInput field names (matches backend schema)
      const input = {
        businessTitle: formData.title,
        description: formData.description,
        city: (() => {
          const region = SAUDI_REGIONS.find(r => r.slug === formData.region);
          const city   = region?.cities.find(c => c.slug === formData.city);
          return city?.en ?? formData.city; // send English city name
        })(),
        district: (() => {
          const region = SAUDI_REGIONS.find(r => r.slug === formData.region);
          return region?.en ?? formData.region; // send English region name
        })(),
        foundedDate: formData.foundationDate ? new Date(String(formData.foundationDate)).toISOString() : undefined,
        numberOfEmployees: formData.teamSize ? String(formData.teamSize) : undefined,
        price: formData.price ? parseFloat(String(formData.price).replace(/,/g, '')) : 0,
        capitalRecovery: formData.capitalRecovery ? parseFloat(String(formData.capitalRecovery).replace(/,/g, '')) : undefined,
        // Annualize revenue + profit to yearly figures before sending to backend
        profit:  formData.profit  ? toAnnual(parseFloat(String(formData.profit).replace(/,/g, '')),  formData.profitPeriod)  : 0,
        revenue: formData.revenue ? toAnnual(parseFloat(String(formData.revenue).replace(/,/g, '')), formData.revenuePeriod) : 0,
        profitMargen: calcMargin() ?? (formData.profitMargin ? parseFloat(String(formData.profitMargin)) : undefined),
        revenueTime: formData.revenuePeriod,
        profittime: formData.profitPeriod,
        supportSession: formData.supportSessions ? parseInt(String(formData.supportSessions)) : undefined,
        supportDuration: formData.supportDuration ? parseInt(String(formData.supportDuration)) : undefined,
        growthOpportunities: formData.growthOpportunities,
        reason: formData.reason,
        isByTakbeer: formData.sellingType === 'selling_by_taqbeel', // selling_by_acquiring = false (acquisition)
        categoryId: formData.category,
        url: formData.website || undefined,
        assets: (formData.assets as any[]).map(a => ({
          name: a.name,
          quantity: parseInt(a.count) || 1,
          price: parseFloat(String(a.price).replace(/,/g, '')) || 0,
          purchaseYear: parseInt(a.year) || new Date().getFullYear(),
        })),
        liabilities: (formData.liabilities as any[]).map(a => ({
          name: a.name,
          quantity: 1,
          price: parseFloat(String(a.amount).replace(/,/g, '')) || 0,
          purchaseYear: parseInt(a.year) || new Date().getFullYear(),
        })),
        inventoryItems: (formData.inventory as any[]).map(a => ({
          name: a.name,
          quantity: parseInt(a.quantity) || 1,
          price: parseFloat(String(a.price).replace(/,/g, '')) || 0,
          purchaseYear: new Date().getFullYear(),
        })),
        documents: [
          ...(crDocument ? [crDocument] : []),
          ...otherDocuments,
        ],
      };

      if (mode === 'create') {
        const { errors } = await createBusiness({ variables: { input } });
        if (errors?.length) {
          toast.error(language === 'ar' ? 'حدث خطأ أثناء إرسال الإدراج' : 'Error submitting listing');
          return;
        }
        setIsSubmitted(true); // Only set true AFTER successful mutation — prevents success screen flash
        localStorage.removeItem('jusoor_listing_draft'); // clear draft so next create starts fresh
        toast.success(t.successTitleCreate);
        // isSubmitted = true — success screen shown; user clicks Continue → onSuccess()
      } else {
        const { errors } = await updateBusiness({ variables: { input: { id: editId, ...input } } });
        if (errors?.length) {
          toast.error(language === 'ar' ? 'حدث خطأ أثناء حفظ التعديلات' : 'Error saving changes');
          return;
        }
        toast.success(t.changesSaved);
        onSuccess();
      }
    } catch (err) {
      console.error('ListingWizard submit error:', err);
      toast.error(language === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong, please try again');
    }
  };

  const handleSaveDraft = () => {
    // BUG-12 FIX: persist form data to localStorage so user doesn't lose progress on navigation
    try {
      localStorage.setItem('jusoor_listing_draft', JSON.stringify(formData));
      toast.success(t.draftSaved);
    } catch {
      toast.error(isAr ? 'تعذر حفظ المسودة' : 'Could not save draft');
    }
  };

  // --- Helpers ---
  const FormLabel = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <label className={cn("block text-sm font-bold text-gray-900 mb-2 truncate", direction === 'rtl' ? "text-right" : "text-left")}>
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );

  const FieldError = ({ field }: { field: string }) => stepErrors[field] ? (
    <p className="text-red-500 text-xs mt-1 font-medium">{stepErrors[field]}</p>
  ) : null;

  const errBorder = (field: string) => stepErrors[field] ? "border-red-400 focus:border-red-400" : "";

  const InputStyles = cn(
    "w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#10B981] text-gray-800 placeholder:text-gray-400 placeholder:text-xs placeholder:font-normal transition-colors",
    direction === 'rtl' ? "text-right" : "text-left"
  );

  // --- Render Steps ---

  const renderStep1 = () => (
    <div className={cn("space-y-8 animate-in fade-in duration-300", direction === 'rtl' ? "slide-in-from-left-4" : "slide-in-from-right-4")}>
      {/* Selling Type Cards */}
      <div className="space-y-4">
        <FormLabel required>{t.sellingType}</FormLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => { setFormData({...formData, sellingType: 'selling_by_acquiring'}); setStepErrors(p=>({...p,sellingType:''})); }}
            className={cn(
              "border-2 rounded-2xl p-4 cursor-pointer transition-all hover:border-[#10B981]/50 relative flex flex-col gap-2 h-full",
              formData.sellingType === 'selling_by_acquiring' ? "border-[#10B981] bg-[#E6F3EF]" : "border-gray-200 bg-white"
            )}
          >
            <div className={cn("flex items-center gap-3", direction === 'rtl' ? "justify-start" : "justify-start")}>
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", formData.sellingType === 'selling_by_acquiring' ? "border-[#10B981]" : "border-gray-300")}>
                {formData.sellingType === 'selling_by_acquiring' && <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />}
              </div>
              <span className="font-bold text-gray-900 text-base">{t.acquisition}</span>
            </div>
            <p className={cn("text-xs leading-relaxed", direction === 'rtl' ? "pr-8" : "pl-8", formData.sellingType === 'selling_by_acquiring' ? "text-[#004E39]" : "text-gray-500")}>
              {t.acquisitionDesc}
            </p>
          </div>

          <div 
            onClick={() => { setFormData({...formData, sellingType: 'selling_by_taqbeel'}); setStepErrors(p=>({...p,sellingType:''})); }}
            className={cn(
              "border-2 rounded-2xl p-4 cursor-pointer transition-all hover:border-[#10B981]/50 relative flex flex-col gap-2 h-full",
              formData.sellingType === 'selling_by_taqbeel' ? "border-[#10B981] bg-[#E6F3EF]" : "border-gray-200 bg-white"
            )}
          >
            <div className={cn("flex items-center gap-3", direction === 'rtl' ? "justify-start" : "justify-start")}>
               <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", formData.sellingType === 'selling_by_taqbeel' ? "border-[#10B981]" : "border-gray-300")}>
                {formData.sellingType === 'selling_by_taqbeel' && <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />}
              </div>
              <span className="font-bold text-gray-900 text-base">{t.assetSale}</span>
            </div>
            <p className={cn("text-xs leading-relaxed", direction === 'rtl' ? "pr-8" : "pl-8", formData.sellingType === 'selling_by_taqbeel' ? "text-[#004E39]" : "text-gray-500")}>
              {t.assetSaleDesc}
            </p>
          </div>
        </div>
      </div>
      <FieldError field="sellingType" />

      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <div className="col-span-2 md:col-span-1">
          <FormLabel required>{t.bizTitle}</FormLabel>
          <input 
            type="text" 
            value={formData.title}
            onChange={(e) => { setFormData({...formData, title: e.target.value}); if(e.target.value) setStepErrors(p=>({...p,title:''})); }}
            placeholder={t.bizTitlePh} 
            className={cn(InputStyles, errBorder('title'))}
          />
          <FieldError field="title" />
        </div>
        <div className="col-span-2 md:col-span-1">
          <FormLabel required>{t.category}</FormLabel>
          <select
            value={formData.category}
            onChange={(e) => { setFormData({...formData, category: e.target.value}); if(e.target.value) setStepErrors(p=>({...p,category:''})); }}
            className={cn(InputStyles, "bg-white", errBorder('category'))}
          >
            <option value="">{t.categoryPh}</option>
            {/* BUG-9 FIX: real category IDs from API instead of hardcoded strings */}
            {apiCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {isAr ? (cat.arabicName || cat.name) : cat.name}
              </option>
            ))}
          </select>
          <FieldError field="category" />
        </div>
        
        {/* Region & City - Side by Side on Mobile */}
        <div className="col-span-1">
          <FormLabel required>{t.region}</FormLabel>
          <select 
            value={formData.region}
            onChange={(e) => { setFormData({...formData, region: e.target.value, city: ''}); if(e.target.value) setStepErrors(p=>({...p,region:''})); }}
            className={cn(InputStyles, "bg-white", errBorder('region'))}
          >
            <option value="">{t.regionPh}</option>
            {SAUDI_REGIONS.map(r => (
              <option key={r.slug} value={r.slug}>{language === 'ar' ? r.ar : r.en}</option>
            ))}
          </select>
          <FieldError field="region" />
        </div>
        <div className="col-span-1">
          <FormLabel required>{t.city}</FormLabel>
          <select 
            value={formData.city}
            onChange={(e) => { setFormData({...formData, city: e.target.value}); if(e.target.value) setStepErrors(p=>({...p,city:''})); }}
            className={cn(InputStyles, "bg-white", errBorder('city'))}
          >
            <option value="">{t.cityPh}</option>
            {(SAUDI_REGIONS.find(r => r.slug === formData.region)?.cities ?? []).map(city => (
              <option key={city.slug} value={city.slug}>{language === 'ar' ? city.ar : city.en}</option>
            ))}
          </select>
          <FieldError field="city" />
        </div>
        
        {/* Foundation & Team - Side by Side on Mobile */}
        <div className="col-span-1">
          <FormLabel>{t.foundation}</FormLabel>
          <select
            value={formData.foundationDate}
            onChange={(e) => setFormData({...formData, foundationDate: e.target.value})}
            className={cn(InputStyles, "bg-white")}
          >
            <option value="">{t.foundationPh}</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <FormLabel>{t.team}</FormLabel>
          <input 
            type="number" 
            value={formData.teamSize}
            onChange={(e) => setFormData({...formData, teamSize: e.target.value})}
            placeholder={t.teamPh} 
            className={InputStyles}
          />
        </div>
      </div>
      
      <div>
        <FormLabel>{t.desc}</FormLabel>
        <textarea 
          value={formData.description}
          onChange={(e) => { setFormData({...formData, description: e.target.value}); if(e.target.value) setStepErrors(p=>({...p,description:''})); }}
          placeholder={t.descPh} 
          rows={4}
          className={cn(InputStyles, errBorder('description'))}
        />
        <FieldError field="description" />
      </div>

      <div>
        <FormLabel>{t.website}</FormLabel>
        <input 
          type="url" 
          value={formData.website}
          onChange={(e) => setFormData({...formData, website: e.target.value})}
          placeholder={t.websitePh} 
          className={cn(InputStyles, "dir-ltr", direction === 'rtl' ? "text-right placeholder:text-right" : "text-left placeholder:text-left")}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={cn("space-y-8 animate-in fade-in duration-300", direction === 'rtl' ? "slide-in-from-left-4" : "slide-in-from-right-4")}>
      <div className="bg-[#E6F3EF] border border-[#10B981]/20 rounded-xl p-4 flex items-start gap-3">
        <Briefcase className="text-[#10B981] shrink-0 mt-1" size={20} />
        <div>
          <p className="font-bold text-[#004E39] text-sm">{t.financialDesc}</p>
          <p className="text-[#004E39]/70 text-xs">{t.financialSub}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <div className="col-span-2 md:col-span-1">
          <div className="flex justify-between items-end mb-2">
             <FormLabel>{t.revenue}</FormLabel>
          </div>
          <div className="flex gap-2">
             <input 
               type="number" 
               value={formData.revenue}
               onChange={(e) => { setFormData({...formData, revenue: e.target.value}); if(e.target.value) setStepErrors(p=>({...p,revenue:''})); }}
               placeholder={t.revenuePh} 
               className={cn(InputStyles, "flex-[2]", errBorder('revenue'))}
             />
             <select 
               value={formData.revenuePeriod}
               onChange={(e) => setFormData({...formData, revenuePeriod: e.target.value})}
               className={cn(InputStyles, "flex-1 bg-gray-50 text-xs px-2")}
             >
                {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
             </select>
          </div>
          <FieldError field="revenue" />
        </div>

        <div className="col-span-2 md:col-span-1">
           <div className="flex justify-between items-end mb-2">
            <FormLabel>{t.profit}</FormLabel>
          </div>
          <div className="flex gap-2">
            <input 
               type="number" 
               value={formData.profit}
               onChange={(e) => { setFormData({...formData, profit: e.target.value}); if(e.target.value) setStepErrors(p=>({...p,profit:''})); }}
               placeholder={t.profitPh} 
               className={cn(InputStyles, "flex-[2]", errBorder('profit'))}
             />
             <select 
               value={formData.profitPeriod}
               onChange={(e) => setFormData({...formData, profitPeriod: e.target.value})}
               className={cn(InputStyles, "flex-1 bg-gray-50 text-xs px-2")}
             >
                {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
             </select>
          </div>
          <FieldError field="profit" />
        </div>

        {/* Margin & Price - Side by Side on Mobile */}
        <div className="col-span-1">
          <FormLabel>{t.margin}</FormLabel>
          {calcMargin() !== null ? (
            <div className={cn(InputStyles, "bg-[#E6F3EF] text-[#004E39] font-bold cursor-default flex items-center gap-2")}>
              <span>{calcMargin()}%</span>
              <span className="text-[10px] text-[#008A66] font-normal">{isAr ? 'محسوب تلقائياً' : 'Auto-calculated'}</span>
            </div>
          ) : (
            <input 
              type="number" 
              value={formData.profitMargin}
              onChange={(e) => setFormData({...formData, profitMargin: e.target.value})}
              placeholder={t.marginPh} 
              className={InputStyles}
            />
          )}
        </div>
        <div className="col-span-1">
          <FormLabel>{t.price}</FormLabel>
          <input 
            type="number" 
            value={formData.price}
            onChange={(e) => { setFormData({...formData, price: e.target.value}); if(e.target.value) setStepErrors(p=>({...p,price:''})); }}
            placeholder={t.pricePh} 
            className={cn(InputStyles, errBorder('price'))}
          />
          <FieldError field="price" />
        </div>

        {/* Capital Recovery */}
        <div className="col-span-1">
          <FormLabel>{isAr ? 'فترة استرداد رأس المال (أشهر)' : 'Capital Recovery (Months)'}</FormLabel>
          <input
            type="number"
            min="1"
            value={formData.capitalRecovery}
            onChange={(e) => setFormData({...formData, capitalRecovery: e.target.value})}
            placeholder={isAr ? 'مثال: 24' : 'e.g. 24'}
            className={InputStyles}
          />
        </div>
      </div>

      {/* Tables Section */}
      <div className="space-y-8 pt-4 border-t border-gray-100">
        {/* Assets Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <FormLabel>{t.assets}</FormLabel>
            <button 
              onClick={() => setFormData({...formData, assets: [...formData.assets, {name: '', count: '', year: '', price: ''}]})}
              className="text-[#10B981] text-xs font-bold flex items-center gap-1 hover:bg-[#E6F3EF] px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} /> {t.addAsset}
            </button>
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
             <table className={cn("w-full text-sm", direction === 'rtl' ? "text-right" : "text-left")}>
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 text-xs">
                   <tr>
                      <th className="p-3">{t.assetName}</th>
                      <th className="p-3 w-16 md:w-24">{t.assetCount}</th>
                      <th className="p-3 w-20 md:w-28">{t.assetYear}</th>
                      <th className="p-3 w-24 md:w-32">{t.assetPrice}</th>
                      <th className="p-3 w-10"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {formData.assets.length === 0 && (
                      <tr><td colSpan={5} className="p-4 text-center text-gray-400 text-xs">{t.noAssets}</td></tr>
                   )}
                   {formData.assets.map((asset: { name: string; quantity: string; value: string; date: string }, idx: number) => (
                      <tr key={idx}>
                         <td className="p-2"><input className={cn("w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder:text-xs text-gray-600", direction === 'rtl' ? "text-right" : "text-left")} placeholder={t.assetName} value={asset.name} onChange={e => {
                           const newAssets = [...formData.assets]; newAssets[idx].name = e.target.value; setFormData({...formData, assets: newAssets});
                         }} /></td>
                         <td className="p-2"><input type="number" className={cn("w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder:text-xs text-gray-600", direction === 'rtl' ? "text-right" : "text-left")} placeholder="0" value={asset.count} onChange={e => {
                           const newAssets = [...formData.assets]; newAssets[idx].count = e.target.value; setFormData({...formData, assets: newAssets});
                         }} /></td>
                         <td className="p-2"><input type="number" className={cn("w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder:text-xs text-gray-600", direction === 'rtl' ? "text-right" : "text-left")} placeholder="YYYY" value={asset.year} onChange={e => {
                           const newAssets = [...formData.assets]; newAssets[idx].year = e.target.value; setFormData({...formData, assets: newAssets});
                         }} /></td>
                         <td className="p-2"><input type="number" className={cn("w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder:text-xs text-gray-600", direction === 'rtl' ? "text-right" : "text-left")} placeholder={language === 'ar' ? 'SAR' : '$'} value={asset.price} onChange={e => {
                           const newAssets = [...formData.assets]; newAssets[idx].price = e.target.value; setFormData({...formData, assets: newAssets});
                         }} /></td>
                         <td className="p-2 text-center">
                            <button onClick={() => {
                               const newAssets = formData.assets.filter((_: unknown, i: number) => i !== idx);
                               setFormData({...formData, assets: newAssets});
                            }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Liabilities Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <FormLabel>{t.liabilities}</FormLabel>
            <button 
              onClick={() => setFormData({...formData, liabilities: [...formData.liabilities, {name: '', amount: '', date: ''}]})}
              className="text-[#10B981] text-xs font-bold flex items-center gap-1 hover:bg-[#E6F3EF] px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} /> {t.addLiability}
            </button>
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
             <table className={cn("w-full text-sm", direction === 'rtl' ? "text-right" : "text-left")}>
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 text-xs">
                   <tr>
                      <th className="p-3">{t.liabilityName}</th>
                      <th className="p-3 w-32 md:w-40">{isAr ? 'القيمة (ر.س)' : 'Amount (SAR)'}</th>
                      <th className="p-3 w-32 md:w-40">{t.liabilityDate}</th>
                      <th className="p-3 w-10"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {formData.liabilities.length === 0 && (
                      <tr><td colSpan={3} className="p-4 text-center text-gray-400 text-xs">{t.noLiabilities}</td></tr>
                   )}
                   {formData.liabilities.map((item: { name: string; quantity: string; value: string; date: string }, idx: number) => (
                      <tr key={idx}>
                         <td className="p-2"><input className={cn("w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder:text-xs text-gray-600", direction === 'rtl' ? "text-right" : "text-left")} placeholder={t.liabilityName} value={item.name} onChange={e => {
                           const newL = [...formData.liabilities]; newL[idx].name = e.target.value; setFormData({...formData, liabilities: newL});
                         }} /></td>
                         <td className="p-2"><input type="number" min="0" className={cn("w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder:text-xs text-gray-600", direction === 'rtl' ? "text-right" : "text-left")} placeholder="0" value={item.amount} onChange={e => {
                           const newL = [...formData.liabilities]; newL[idx].amount = e.target.value; setFormData({...formData, liabilities: newL});
                         }} /></td>
                         <td className="p-2"><input type="date" className={cn("w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-gray-600", direction === 'rtl' ? "text-right" : "text-left")} value={item.date} onChange={e => {
                           const newL = [...formData.liabilities]; newL[idx].date = e.target.value; setFormData({...formData, liabilities: newL});
                         }} /></td>
                         <td className="p-2 text-center">
                            <button onClick={() => {
                               const newL = formData.liabilities.filter((_: unknown, i: number) => i !== idx);
                               setFormData({...formData, liabilities: newL});
                            }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Inventory */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <FormLabel>{t.inventory}</FormLabel>
            <button 
              onClick={() => setFormData({...formData, inventory: [...formData.inventory, {name: '', quantity: '1', price: ''}]})}
              className="text-[#10B981] text-xs font-bold flex items-center gap-1 hover:bg-[#E6F3EF] px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} /> {t.addItem}
            </button>
          </div>
          <div className="space-y-2">
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className={cn("w-full text-sm", direction === 'rtl' ? "text-right" : "text-left")}>
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 text-xs">
                  <tr>
                    <th className="p-3">{t.itemName}</th>
                    <th className="p-3 w-24">{isAr ? 'الكمية' : 'Qty'}</th>
                    <th className="p-3 w-36">{isAr ? 'القيمة (ر.س)' : 'Value (SAR)'}</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formData.inventory.length === 0 && (
                    <tr><td colSpan={4} className="p-4 text-center text-gray-400 text-xs">{t.noItems}</td></tr>
                  )}
                  {formData.inventory.map((item: { name: string; quantity: string; price: string }, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input className={cn("w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder:text-xs text-gray-600", direction === 'rtl' ? "text-right" : "text-left")} placeholder={t.itemName} value={item.name} onChange={e => {
                          const n = [...formData.inventory]; n[idx].name = e.target.value; setFormData({...formData, inventory: n});
                        }} />
                      </td>
                      <td className="p-2">
                        <input type="number" min="1" className={cn("w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder:text-xs text-gray-600", direction === 'rtl' ? "text-right" : "text-left")} placeholder="1" value={item.quantity} onChange={e => {
                          const n = [...formData.inventory]; n[idx].quantity = e.target.value; setFormData({...formData, inventory: n});
                        }} />
                      </td>
                      <td className="p-2">
                        <input type="number" min="0" className={cn("w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder:text-xs text-gray-600", direction === 'rtl' ? "text-right" : "text-left")} placeholder="0" value={item.price} onChange={e => {
                          const n = [...formData.inventory]; n[idx].price = e.target.value; setFormData({...formData, inventory: n});
                        }} />
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => {
                          const n = formData.inventory.filter((_: unknown, i: number) => i !== idx);
                          setFormData({...formData, inventory: n});
                        }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={cn("space-y-8 animate-in fade-in duration-300", direction === 'rtl' ? "slide-in-from-left-4" : "slide-in-from-right-4")}>
      <div className="bg-[#E6F3EF] border border-[#10B981]/20 rounded-xl p-4 flex items-start gap-3">
        <Briefcase className="text-[#10B981] shrink-0 mt-1" size={20} />
        <div>
          <p className="font-bold text-[#004E39] text-sm">{t.visionTitle}</p>
          <p className="text-[#004E39]/70 text-xs">{t.visionDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <div className="col-span-1">
          <FormLabel>{t.supportDur}</FormLabel>
          <input 
            type="number" 
            value={formData.supportDuration}
            onChange={(e) => setFormData({...formData, supportDuration: e.target.value})}
            placeholder={t.supportDurPh} 
            className={InputStyles} 
          />
        </div>
        <div className="col-span-1">
          <FormLabel>{t.supportSess}</FormLabel>
          <input 
            type="number" 
            value={formData.supportSessions}
            onChange={(e) => setFormData({...formData, supportSessions: e.target.value})}
            placeholder={t.supportSessPh} 
            className={InputStyles} 
          />
        </div>
      </div>
      
      <div>
        <FormLabel>{t.growth}</FormLabel>
        <textarea 
          value={formData.growthOpportunities}
          onChange={(e) => setFormData({...formData, growthOpportunities: e.target.value})}
          placeholder={t.growthPh} 
          rows={4}
          className={InputStyles} 
        />
      </div>

      <div>
        <FormLabel>{t.reason}</FormLabel>
        <textarea 
          value={formData.reason}
          onChange={(e) => setFormData({...formData, reason: e.target.value})}
          placeholder={t.reasonPh} 
          rows={4}
          className={InputStyles}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className={cn("space-y-8 animate-in fade-in duration-300", direction === 'rtl' ? "slide-in-from-left-4" : "slide-in-from-right-4")}>
      <div className="bg-[#E6F3EF] border border-[#10B981]/20 rounded-xl p-4 flex items-start gap-3">
        <FileText className="text-[#10B981] shrink-0 mt-1" size={20} />
        <div>
          <p className="font-bold text-[#004E39] text-sm">{t.docsTitle}</p>
          <p className="text-[#004E39]/70 text-xs">{t.docsDesc}</p>
        </div>
      </div>

      {/* Main Upload - CR */}
      <div className="space-y-3">
        <FormLabel required>{t.cr}</FormLabel>
        {formData.crFile ? (
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 text-red-500 rounded-lg flex items-center justify-center font-bold">PDF</div>
                <div>
                   <p className="text-sm font-bold text-gray-900">Commercial_Registration.pdf</p>
                   <p className="text-xs text-gray-500">2.5 MB • {t.uploaded}</p>
                </div>
             </div>
             <button onClick={() => setFormData({...formData, crFile: null})} className="text-gray-400 hover:text-red-500">
                <Trash2 size={20} />
             </button>
          </div>
        ) : (
          /* BUG-10 FIX: real file input — stores File object instead of boolean true */
          <label htmlFor="cr-file-input" className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-[#10B981] hover:bg-[#10B981]/5 transition-all cursor-pointer">
             <input
               id="cr-file-input"
               type="file"
               accept=".pdf,.jpg,.jpeg,.png"
               className="hidden"
               onChange={(e) => {
                 const file = e.target.files?.[0] || null;
                 setFormData({ ...formData, crFile: file });
               }}
             />
             <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Upload size={24} />
             </div>
             <p className="font-bold text-gray-900 mb-1">{t.uploadCRPh}</p>
             <p className="text-xs text-gray-500 mb-4">{t.formats}</p>
             <span className="bg-[#111827] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-black transition-colors">
                {t.upload}
             </span>
          </label>
        )}
      </div>

      {/* Other Docs */}
      <div className="space-y-3 pt-6 border-t border-gray-100">
        <FormLabel>{t.otherDocs}</FormLabel>
        {/* BUG-11 FIX: real file input for additional documents */}
        <label htmlFor="other-docs-input" className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex items-center justify-center gap-4 hover:border-[#10B981] hover:bg-[#10B981]/5 transition-all cursor-pointer">
          <input
            id="other-docs-input"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setFormData({ ...formData, otherFiles: [...(formData.otherFiles || []), ...files] });
            }}
          />
          <Upload size={20} className="text-gray-400" />
          <span className="font-bold text-gray-600 text-sm">
            {formData.otherFiles?.length
              ? (isAr ? `${formData.otherFiles.length} ملف مرفق` : `${formData.otherFiles.length} file(s) selected`)
              : t.otherDocsPh}
          </span>
        </label>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500 text-center">
       <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} />
       </div>
       <h2 className="text-3xl font-black text-[#111827] mb-4">
         {mode === 'create' ? t.successTitleCreate : t.successTitleEdit}
       </h2>
       <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
         {mode === 'create' ? t.successMsgCreate : t.successMsgEdit}
       </p>
       <div className="flex gap-4">
          <button onClick={onSuccess} className="bg-[#111827] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-lg">
             {t.backHome}
          </button>
          {mode === 'create' && (
            <button onClick={() => { setIsSubmitted(false); setCurrentStep(1); setFormData({...defaultData}); }} className="bg-white border border-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">
               {t.newList}
            </button>
          )}
       </div>
    </div>
  );

  if (isSubmitted && mode === 'create') return renderSuccess();

  return (
    <div className="flex flex-col font-sans min-h-screen" dir={direction}>
      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-center text-[#111827] mb-2">{t.cancelTitle}</h3>
              <p className="text-gray-500 text-center text-sm mb-6">{t.cancelMsg}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200">{t.back}</button>
                <button onClick={onClose} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700">{t.confirm}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
           <div className="flex items-center justify-between mb-6">
              {/* Back Button */}
              <button 
                onClick={onCancel || onClose} 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold"
              >
                 {direction === 'rtl' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                <span>{t.back}</span>
              </button>

              {mode === 'edit' && (
                 <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-100">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    {t.underReview}
                 </div>
              )}
           </div>
           
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                 <h1 className="text-3xl font-black text-[#111827] mb-2">
                   {mode === 'create' ? t.createTitle : t.editTitle}
                 </h1>
                 <p className="text-gray-500 font-medium max-w-lg">
                    {mode === 'create' ? t.createDesc : t.editDesc}
                 </p>
              </div>
           </div>
        </div>

        {/* Wizard Progress - Fixed Desktop Line */}
        <div className="mb-10">
           <div className="relative">
              {/* Desktop Line */}
              <div className="hidden md:block absolute top-5 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full mx-6"></div>
              <div 
                className={cn(
                  "hidden md:block absolute top-5 h-1 bg-[#10B981] -translate-y-1/2 z-0 rounded-full transition-all duration-500 mx-6",
                  direction === 'rtl' ? "right-0" : "left-0"
                )}
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>

              {/* Mobile Line */}
              <div className="md:hidden absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full"></div>
              <div 
                className={cn(
                  "md:hidden absolute top-1/2 h-1 bg-[#10B981] -translate-y-1/2 z-0 rounded-full transition-all duration-500",
                  direction === 'rtl' ? "right-0" : "left-0"
                )}
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
              
              <div className="flex justify-between relative z-10">
                {steps.map((step) => (
                   <div key={step.id} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => {
                     if (step.id < currentStep) setCurrentStep(step.id);
                   }}>
                      <div className={cn(
                         "w-10 h-10 rounded-full flex items-center justify-center border-4 font-bold transition-all shadow-sm bg-white z-10",
                         step.id === currentStep ? "bg-[#10B981] border-[#10B981] text-white scale-110" :
                         step.id < currentStep ? "bg-[#10B981] border-[#10B981] text-white" :
                         "bg-white border-gray-200 text-gray-300 group-hover:border-gray-300"
                      )}>
                         {step.id < currentStep ? <CheckCircle2 size={20} /> : step.id}
                      </div>
                      <span className={cn("text-xs font-bold hidden md:block transition-colors", step.id === currentStep ? "text-[#111827]" : "text-gray-400")}>
                         {step.title}
                      </span>
                   </div>
                ))}
              </div>
           </div>
           <h3 className="text-center font-bold text-lg mt-6 md:hidden">{steps[currentStep-1].title}</h3>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm min-h-[400px]">
           {currentStep === 1 && renderStep1()}
           {currentStep === 2 && renderStep2()}
           {currentStep === 3 && renderStep3()}
           {currentStep === 4 && renderStep4()}
        </div>

        {/* Actions */}
        <div className="mt-8">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4">
             {currentStep === 1 ? (
               <button onClick={() => setShowCancelModal(true)} className="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                  {t.cancel}
               </button>
             ) : (
               <button onClick={handleBack} className="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  {direction === 'rtl' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                  {t.back}
               </button>
             )}
  
             {/* 
                 Mobile Order: Next (Top), Draft (Bottom)
                 Desktop Order: Draft (Left), Next (Right)
             */}
             <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={handleNext}
                  disabled={submitting || fileUploading}
                  className="w-full md:w-auto bg-[#111827] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2 md:order-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {(submitting || fileUploading) && currentStep === 4
                    ? (language === 'ar' ? 'جارٍ الإرسال...' : 'Submitting...')
                    : currentStep === 4 ? (mode === 'create' ? t.publish : t.saveChanges) : t.next}
                  {currentStep !== 4 && !(submitting || fileUploading) && (direction === 'rtl' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />)}
                </button>
                
                <button onClick={handleSaveDraft} className="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-[#10B981] bg-[#E6F3EF] hover:bg-[#d0ebe5] transition-colors md:order-1">
                   {t.saveDraft}
                </button>
             </div>
          </div>

          {/* Privacy Note */}
          <div className="mt-8 flex flex-col md:flex-row gap-4 text-xs font-medium bg-blue-50/50 p-4 rounded-xl border border-blue-100">
             <div className={cn("flex-1 text-gray-600 leading-relaxed", direction === 'rtl' ? "text-right" : "text-left")}>
                <strong className="text-blue-700 block mb-1">{t.privacy}</strong> 
                {t.privacyText}
             </div>
             <div className={cn("flex items-center justify-center gap-2 text-gray-500 border-t md:border-t-0 pt-3 md:pt-0 md:mr-auto", direction === 'rtl' ? "md:border-r md:pr-4" : "md:border-l md:pl-4")}>
                <Phone size={14} /> 
                <span>{t.help} <span className="dir-ltr font-bold">+966 55 555 5555</span></span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};