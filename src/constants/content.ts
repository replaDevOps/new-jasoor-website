export const CONTENT = {
  ar: {
    direction: "rtl",
    nav: {
      browse: "تصفح الشركات",
      about: "من نحن؟",
      articles: "المقالات",
      contact: "تواصل معنا",
      signUp: "سجل",
      signIn: "تسجيل الدخول",
      profile: "حسابي",
    },
    auth: {
      signUp: {
        title: "إنشاء حساب جديد",
        subtitle: "انضم إلى مجتمع جسور وابدأ رحلتك الاستثمارية",
        nafath: "المتابعة عبر نفاذ",
        soon: "قريباً",
        or: "أو التسجيل بالبريد الإلكتروني",
        fullName: "الاسم الكامل",
        fullNamePlaceholder: "الاسم الثلاثي",
        email: "البريد الإلكتروني",
        emailPlaceholder: "name@example.com",
        phone: "رقم الجوال",
        phonePlaceholder: "5XXXXXXXX",
        region: "المنطقة",
        selectRegion: "اختر المنطقة",
        city: "المدينة",
        cityPlaceholder: "مثال: الرياض، جدة، الدمام",
        idUpload: "إرفاق الهوية الوطنية أو جواز السفر (اختياري)",
        uploadText: "اضغط هنا لرفع الملف أو قم بسحبه وإفلاته",
        uploadHint: "PNG, JPG, PDF حتى 5 ميجابايت",
        password: "كلمة المرور",
        confirmPassword: "تأكيد كلمة المرور",
        passwordPlaceholder: "********",
        agree: "أوافق على",
        terms: "شروط الخدمة",
        and: "و",
        privacy: "سياسة الخصوصية",
        agreeConfirm: "، وأقر بأن جميع البيانات المدخلة صحيحة.",
        submit: "تسجيل الحساب",
        haveAccount: "هل لديك حساب بالفعل؟",
        signIn: "تسجيل الدخول",
        // BUG-10 FIX: moved from signIn (where it was a duplicate key) to correct location
        success: "تم إنشاء حسابك بنجاح! مرحباً بك في جسور",
        regions: {
          riyadh: "الرياض",
          makkah: "مكة المكرمة",
          madinah: "المدينة المنورة",
          eastern: "المنطقة الشرقية",
          qassim: "القصيم",
          asir: "عسير",
          tabuk: "تبوك",
          hail: "حائل",
          northern: "الحدود الشمالية",
          jazan: "جازان",
          najran: "نجران",
          bahah: "الباحة",
          jouf: "الجوف"
        }
      },
      signIn: {
        title: "تسجيل الدخول",
        subtitle: "مرحباً بعودتك إلى منصة جسور",
        nafath: "الدخول عبر نفاذ",
        soon: "قريباً",
        or: "أو الدخول بالبريد الإلكتروني",
        emailOrPhone: "البريد الإلكتروني أو رقم الجوال",
        emailOrPhonePlaceholder: "name@example.com",
        password: "كلمة المرور",
        passwordPlaceholder: "********",
        rememberMe: "تذكرني",
        forgotPassword: "نسيت كلمة المرور؟",
        submit: "تسجيل الدخول",
        loading: "جاري الدخول...",
        noAccount: "ليس لديك حساب؟",
        signUp: "إنشاء حساب جديد",
        // BUG-10 FIX: duplicate 'success' key — JS silently kept only the last one (signup message)
        // restored correct signIn success message; signUp success is on signUp.success below
        success: "تم تسجيل الدخول بنجاح",
      },
      forgotPassword: {
        titleEmail: "استعادة كلمة المرور",
        titleOtp: "التحقق من الرمز",
        subtitleEmail: "أدخل بريدك الإلكتروني المسجل لدينا لاستلام رمز التحقق",
        subtitleOtp: "أدخل الرمز المكون من 5 أرقام الذي تم إرساله لبريدك الإلكتروني",
        back: "العودة",
        email: "البريد الإلكتروني",
        emailPlaceholder: "name@example.com",
        sendCode: "إرسال رمز التحقق",
        confirm: "تأكيد الرمز",
        didNotReceive: "لم يصلك الرمز؟",
        resend: "إعادة الإرسال",
        codeSent: "تم إرسال رمز التحقق إلى هاتفك"
      }
    },
    hero: {
      title: "منصتك لشراء وبيع الشركات بكل ثقة.",
      subtitle: "نُقدّم لك فرصًا موثّقة، إجراءات قانونية آمنة، وتجربة سلسة من البداية حتى نقل الملكية",
      cta: "تصفح الشركات",
      ctaSecondary: "أدرج شركتك",
      // BUG-14 FIX: trustedBy was hardcoded in English only in Hero.tsx — now translatable
      trustedBy: "موثوق من +500 شركة",
      stats: {
        label: "قيمة الصفقات",
        value: "٠٠٠+ مليون"
      }
    },
    sections: {
      features: "مميزات جسور",
      featuresSubtitle: "جسور تصنع الفرق ... إليك كيف!",
      howItWorks: "كيف تعمل منصة جسور",
      listings: "فرص استثمارية مقترحة",
      faq: "الأسئلة الشائعة"
    },
    features: [
      {
        title: "صفقات محمية",
        desc: "نوفر بيئة آمنة لإتمام الصفقات مع حماية قانونية لكلا الطرفين."
      },
      {
        title: "فرص موثقة",
        desc: "نتحقق من هوية صاحب الشركة والسجل التجاري والبيانات المالية قبل نشر أي شركة، لتتخذ قرارك بثقة."
      },
      {
        title: "بيانات شفافة",
        desc: "نقدم كافة البيانات المالية والتشغيلية بشفافية تامة لاتخاذ قرارات مدروسة."
      },
      {
        title: "تجربة سلسة لإتمام الصفقات",
        desc: "نرشدك خطوة بخطوة.. من تقديم العرض إلى توقيع عقد البيع وتحويل الملكية، ضمن تجربة سلسة وآمنة."
      }
    ],
    howItWorks: {
      subheadline: "الطريقة <span class='text-[#34D399]'>الأسهل</span> لبيع وشراء الشركات",
      seller: {
        title: "للبائعين",
        steps: [
          { title: "أدرج شركتك", desc: "سجّل بيانات شركتك وابدأ رحلة البيع." },
          { title: "وثّق شركتك", desc: "يقوم فريقنا بالتحقق من البيانات لضمان الموثوقية." },
          { title: "استقبل العروض", desc: "تلقى عروض الشراء من المستثمرين الجادين." },
          { title: "أكمِل الصفقة بأمان", desc: "أتمم إجراءات البيع ونقل الملكية بضمانات كاملة." }
        ]
      },
      buyer: {
        title: "للمشترين",
        steps: [
          { title: "تصفح الفرص", desc: "استعرض قائمة واسعة من الشركات الموثقة." },
          { title: "تقدم للشراء أو قدم عرض يناسبك", desc: "قدم عرضك المالي أو ابدأ إجراءات الشراء المباشر." },
          { title: "وقّع اتفاقية عدم الإفصاح وحدّد اجتماع", desc: "احصل على التفاصيل الكاملة بعد توقيع الاتفاقية." },
          { title: "أكمِل الصفقة", desc: "أتمم عملية الاستحواذ ونقل الملكية بنجاح." }
        ]
      },
      cta: "سجل الان"
    },
    listings: {
      headline: "شركات متاحة الان <span class='text-[#008A66]'>للبيع</span>",
      subheadline: "تصفّح مجموعة مختارة من الشركات الموثّقة عبر قطاعات ومدن مختلفة داخل السعودية. استخدم أدوات التصفية حسب القطاع، الموقع، السعر، وغير ذلك.",
      revenue: "الإيرادات",
      profit: "الربح",
      recovery: "استرداد رأس المال",
      details: "التفاصيل",
      browseAll: "تصفح المزيد",
      // BUG-23 FIX: category names were hardcoded inline in BrowseBusinesses — moved here
      categories: {
        tech: "تقنية",
        retail: "تجزئة",
        food: "مطاعم",
        health: "صحة",
        services: "خدمات",
        manufacturing: "صناعة",
        education: "تعليم",
        logistics: "لوجستي",
      },
    },
    faq: {
      headline: "لديك أسئلة؟",
      subheadline: "لدينا الإجابات.",
      description: "جمعنا لك أهم الأسئلة التي يطرحها المستثمرون والبائعون لمساعدتك في فهم آلية عمل جسور بشكل أفضل.",
      notFound: "لم تجد إجابتك؟ ",
      cta: "الأسئلة الشائعة الكاملة",
      items: [
        { q: "كيف تضمن جسور سرية المعلومات؟", a: "نستخدم اتفاقيات عدم إفصاح صارمة (NDA) وتشفير للبيانات لضمان سرية جميع الأطراف." },
        { q: "ما هي رسوم استخدام المنصة؟", a: "تختلف الرسوم بناءً على نوع الصفقة وحجمها، يمكنك الاطلاع على صفحة الرسوم للتفاصيل." },
        { q: "كم تستغرق عملية البيع؟", a: "تعتمد المدة على جاهزية الأوراق وسرعة التفاوض، وتتراوح عادة بين أسبوعين إلى شهرين." },
        { q: "هل يمكنني بيع حصة من الشركة فقط؟", a: "نعم، تتيح جسور خيار بيع حصص أو شراكات استراتيجية." },
        { q: "كيف يتم تقييم الشركات؟", a: "نعتمد على معايير مالية وتشغيلية دقيقة لتقديم تقييم عادل يعكس قيمة الشركة الحقيقية في السوق." },
        { q: "ما هي المستندات المطلوبة للإدراج؟", a: "تشمل المستندات السجل التجاري، القوائم المالية، وعقد التأسيس، بالإضافة إلى إثبات الهوية للمالك." }
      ]
    },
    footer: {
      about: "جسور هي منصة سعودية مرخّصة برقم (7050269450) -- لبيع وشراء المؤسسات والشركات، نوفّر لك تجربة آمنة وسلسة تبدأ من فحص الشركة والتحقق من هوية مالكها، مرورًا بالدفع الآمن، وصولًا إلى نقل الملكية بكل مرونة …",
      supportHeader: "تحتاج إلى مساعدة؟",
      supportCTA: "سجّل الدخول للوصول إلى الدعم، والأدوات، والفرص الموثّقة.",
      rights: "جميع الحقوق محفوظة © 2026 جسور",
      quickLinks: {
        title: "روابط سريعة",
        links: [
           { label: "تصفح الشركات", url: "#" },
           { label: "أدرج شركتك", url: "#" },
           { label: "كيف تعمل المنصة", url: "#" },
           { label: "من نحن", url: "#" }
        ]
      },
      resources: {
        title: "المصادر",
        links: [
           { label: "المدونة", url: "#" },
           { label: "دليل التقييم", url: "#" },
           { label: "نماذج العقود", url: "#" },
           { label: "الشروط والأحكام", url: "#" }
        ]
      },
      contact: {
        title: "تواصل معنا",
        email: "info@jusoor.sa",
        phone: "920000000",
        address: "الرياض، المملكة العربية السعودية"
      }
    },
    buttons: {
      primary: "ابدأ الآن",
      secondary: "المزيد من التفاصيل",
      contact: "تواصل معنا"
    },
    dashboard: {
      tabs: {
        dashboard: "لوحة التحكم",
        listings: "إدراجاتي",
        offers: "العروض",
        deals: "الصفقات",
        meetings: "الاجتماعات",
        favorites: "المحفوظة",
        alerts: "التنبيهات",
        settings: "الإعدادات"
      },
      stats: {
        views: "عدد المشاهدات",
        listedBusinesses: "الشركات المدرجة",
        receivedOffers: "العروض المستلمة",
        meetingRequests: "طلبات الاجتماعات",
        scheduledMeetings: "الاجتماعات المجدولة",
        closedDeals: "الصفقات المغلقة"
      },
      meetings: {
        title: "الاجتماعات",
        filters: {
          all: "الكل",
          scheduled: "القادمة",
          past: "السابقة"
        },
        table: {
          otherParty: "الطرف الآخر",
          role: "الدور",
          requestDate: "تاريخ الطلب",
          preferredDate: "التاريخ المفضل",
          meetingDate: "تاريخ الاجتماع",
          status: "الحالة",
          meetingLink: "رابط الاجتماع",
          actions: "خيارات"
        },
        status: {
          scheduled: "قادم",
          confirmed: "مؤكد",
          past: "منتهي"
        },
        actions: {
          joinMeeting: "الانضمام للاجتماع",
          viewDetails: "عرض التفاصيل",
          join: "انضمام",
          zoomLink: "رابط الزووم",
          noActions: "لا توجد إجراءات"
        },
        empty: "لا توجد اجتماعات في هذه القائمة"
      },
      listings: {
        title: "إدراجاتي",
        addNew: "أدرج شركتك",
        filters: {
          all: "الكل",
          sold: "المباعة"
        },
        status: {
          active: "مفعل",
          sold: "تم البيع",
          underReview: "قيد المراجعة"
        },
        stats: {
          offers: "العروض",
          views: "المشاهدات",
          favorites: "المحفوظة"
        },
        actions: {
          manage: "إدارة",
          details: "التفاصيل",
          remove: "إزالة",
          view: "عرض",
          edit: "تعديل"
        },
        sar: "ر.س",
        successMessage: "تم حفظ الإدراج بنجاح!"
      },
      offers: {
        title: "العروض المستلمة",
        filters: {
          all: "الكل",
          sent: "المرسلة",
          received: "المستلمة",
          pending: "المعلقة",
          accepted: "المقبولة",
          rejected: "المرفوضة"
        },
        table: {
          offerNumber: "رقم العرض",
          listing: "الإدراج",
          status: "الحالة",
          offerType: "نوع العرض",
          buyer: "المشتري",
          seller: "البائع",
          offerAmount: "قيمة العرض",
          salePrice: "سعر البيع",
          offerValue: "قيمة العرض",
          date: "التاريخ",
          actions: "خيارات"
        },
        status: {
          pending: "معلق",
          accepted: "مقبول",
          rejected: "مرفوض",
          sent: "مرسل"
        },
        offerTypes: {
          full: "عرض كامل",
          preliminary: "عرض مبدئي",
          instant: "شراء فوري"
        },
        actions: {
          viewDetails: "عرض التفاصيل",
          counterOffer: "تقديم عرض مضاد",
          scheduleMeeting: "جدولة اجتماع",
          submit: "إرسال",
          cancel: "إلغاء",
          amount: "القيمة الجديدة",
          notes: "ملاحظات إضافية",
          meetingDate: "تاريخ الاجتماع",
          meetingTime: "وقت الاجتماع",
          successCounter: "تم إرسال العرض المضاد بنجاح",
          successMeeting: "تم إرسال طلب الاجتماع بنجاح",
          accept: "قبول العرض",
          scheduleNew: "جدولة اجتماع جديد",
          downloadFiles: "تحميل وثائق الصفقة"
        },
        sar: "ر.س",
        types: {
          fullPurchase: "عرض شراء كامل",
          preliminary: "عرض مبدئي",
          instant: "شراء فوري"
        }
      },
      deals: {
        title: "الصفقات",
        filters: {
          inProgress: "الجارية",
          completed: "المكتملة"
        },
        status: {
          inProgress: "قيد التنفيذ",
          completed: "مكتملة"
        },
        labels: {
          buyer: "المشتري",
          finalOffer: "العرض النهائي",
          progress: "التقدم في الصفقة",
          start: "البداية",
          expected: "المتوقع",
          backToDeals: "العودة للصفقات"
        },
        steps: {
          platformFee: {
            title: "دفع العمولة",
            desc: "تحويل مبلغ عمولة المنصة لبدء الصفقة"
          },
          contract: {
            title: "عقد البيع الإلكتروني",
            desc: "مراجعة وتوقيع عقد البيع"
          },
          payment: {
            title: "دفع قيمة الصفقة",
            desc: "تحويل كامل مبلغ الصفقة للبائع"
          },
          finalize: {
            title: "إتمام الصفقة",
            desc: "استكمال المستندات النهائية وإغلاق الصفقة"
          }
        },
        stepStatus: {
          verified: "تم التحقق",
          signed: "تم التوقيع",
          pending: "معلق",
          inProcess: "قيد الإجراء"
        }
      },
      alerts: {
        title: "التنبيهات",
        types: {
          offer: "عرض مضاد جديد",
          payment: "تأكيد دفع",
          docs: "مستندات جديدة",
          meeting: "طلب اجتماع"
        },
        markAllRead: "تعيين الكل كمقروء"
      },
      settings: {
        title: "الإعدادات",
        tabs: {
          profile: "الملف الشخصي",
          wallet: "المحفظة",
          password: "كلمة المرور"
        },
        sections: {
          profile: "الملف الشخصي",
          account: "معلومات الحساب",
          wallet: "محفظتي",
          notifications: "الإشعارات",
          security: "الأمان"
        },
        profile: {
          name: "الاسم الكامل",
          email: "البريد الإلكتروني",
          phone: "رقم الجوال",
          city: "المدينة",
          region: "المنطقة",
          memberSince: "عضو منذ",
          save: "حفظ التغييرات",
          saveChanges: "حفظ التغييرات"
        },
        wallet: {
          title: "الحسابات البنكية",
          addAccount: "إضافة حساب جديد",
          bank: "البنك",
          holder: "اسم صاحب الحساب",
          iban: "رقم الآيبان",
          actions: "خيارات"
        },
        password: {
          currentPassword: "كلمة المرور الحالية",
          newPassword: "كلمة المرور الجديدة",
          confirmPassword: "تأكيد كلمة المرور",
          updatePassword: "تحديث كلمة المرور"
        },
        notifications: {
          email: "إشعارات البريد",
          emailDesc: "تلقي إشعارات على بريدك الإلكتروني",
          sms: "إشعارات الرسائل",
          smsDesc: "تلقي إشعارات عبر الرسائل القصيرة",
          push: "الإشعارات الفورية",
          pushDesc: "تلقي إشعارات داخل المنصة"
        },
        security: {
          changePassword: "تغيير كلمة المرور",
          twoFactor: "التحقق بخطوتين",
          twoFactorDesc: "تفعيل المصادقة الثنائية لحماية حسابك"
        }
      },
      activity: {
        title: "النشاط الأخير",
        viewHistory: "عرض السجل",
        items: {
          newOffer: {
            title: "تلقيت عرضاً جديداً",
            desc: "قام \"شركة النمو\" بتقديم عرض بقيمة 2.3 مليون ريال",
            time: "منذ ساعتين"
          },
          upcomingMeeting: {
            title: "موعد اجتماع قادم",
            desc: "اجتماع مجدول مع المستشار القاوني لمراجعة العقود",
            time: "غداً، 10:00 ص"
          },
          listingPublished: {
            title: "تم نشر الإدراج",
            desc: "تمت الموافقة على نشر \"سلسلة مطاعم برجر فاخرة\"",
            time: "منذ يومين"
          }
        },
        label: "آخر الأنشطة",
        empty: "لا يوجد نشاط بعد"
      },
      accountStatus: {
        title: "حالة الحساب",
        verified: "موثق بالكامل",
        verifiedDesc: "هويتك التجارية موثقة",
        underReview: "قيد المراجعة",
        underReviewDesc: "يتم مراجعة حسابك حالياً",
        message: "حسابك جاهز لإجراء الصفقات. تأكد من تحديث بياناتك البنكية لتسهيل عمليات التحويل."
      }
    }
  },
  en: {
    direction: "ltr",
    nav: {
      browse: "Browse Businesses",
      about: "About Us",
      articles: "Articles",
      contact: "Contact Us",
      signUp: "Sign Up",
      signIn: "Sign In",
      profile: "Profile",
    },
    auth: {
      signUp: {
        title: "Create New Account",
        subtitle: "Join Jusoor community and start your investment journey",
        nafath: "Continue via Nafath",
        soon: "Soon",
        or: "Or sign up with email",
        fullName: "Full Name",
        fullNamePlaceholder: "Full Name",
        email: "Email",
        emailPlaceholder: "name@example.com",
        phone: "Phone Number",
        phonePlaceholder: "5XXXXXXXX",
        region: "Region",
        selectRegion: "Select Region",
        city: "City",
        cityPlaceholder: "e.g. Riyadh, Jeddah, Dammam",
        idUpload: "Upload National ID or Passport (Optional)",
        uploadText: "Click to upload or drag and drop",
        uploadHint: "PNG, JPG, PDF up to 5MB",
        password: "Password",
        confirmPassword: "Confirm Password",
        passwordPlaceholder: "********",
        agree: "I agree to",
        terms: "Terms of Service",
        and: "and",
        privacy: "Privacy Policy",
        agreeConfirm: "and I confirm that all entered data is correct.",
        submit: "Sign Up",
        haveAccount: "Already have an account?",
        signIn: "Sign In",
        success: "Your account has been created successfully! Welcome to Jusoor",
        regions: {
          riyadh: "Riyadh",
          makkah: "Makkah",
          madinah: "Madinah",
          eastern: "Eastern Province",
          qassim: "Al-Qassim",
          asir: "Asir",
          tabuk: "Tabuk",
          hail: "Hail",
          northern: "Northern Borders",
          jazan: "Jazan",
          najran: "Najran",
          bahah: "Al-Bahah",
          jouf: "Al-Jouf"
        }
      },
      signIn: {
        title: "Sign In",
        subtitle: "Welcome back to Jusoor",
        nafath: "Login via Nafath",
        soon: "Soon",
        or: "Or login with email",
        emailOrPhone: "Email or Phone Number",
        emailOrPhonePlaceholder: "name@example.com",
        password: "Password",
        passwordPlaceholder: "********",
        rememberMe: "Remember me",
        forgotPassword: "Forgot Password?",
        submit: "Sign In",
        loading: "Signing in...",
        noAccount: "Don't have an account?",
        signUp: "Create New Account",
        success: "Signed in successfully"
      },
      forgotPassword: {
        titleEmail: "Reset Password",
        titleOtp: "Verify Code",
        subtitleEmail: "Enter your registered email to receive verification code",
        subtitleOtp: "Enter the 5-digit code sent to your email",
        back: "Back",
        email: "Email",
        emailPlaceholder: "name@example.com",
        sendCode: "Send Verification Code",
        confirm: "Confirm Code",
        didNotReceive: "Didn't receive code?",
        resend: "Resend",
        codeSent: "Verification code sent to your phone"
      }
    },
    hero: {
      title: "Buy or Sell a Verified Business with Confidence",
      subtitle: "Explore real, revenue-generating businesses across Saudi Arabia. Whether you're an investor or an owner, Jusoor makes the process safe, simple, and secure.",
      cta: "Explore Businesses",
      ctaSecondary: "Sell Your Business",
      // BUG-14 FIX: trustedBy was hardcoded in English only in Hero.tsx — now translatable
      trustedBy: "Trusted by 500+ Businesses",
      stats: {
        label: "Transaction Value",
        value: "100+ Million"
      }
    },
    sections: {
      features: "Jusoor Features",
      featuresSubtitle: "Jusoor Makes the Difference ... Here's How!",
      howItWorks: "How Jusoor Works",
      listings: "Suggested Business Listings",
      faq: "FAQ"
    },
    features: [
      {
        title: "Secure & Protected Deals",
        desc: "We provide a secure environment for closing deals with legal protection."
      },
      {
        title: "Verified Listings",
        desc: "Every business on Jusoor is verified for identity and commercial registration, ensuring you make decisions with confidence."
      },
      {
        title: "Transparent Business Data",
        desc: "We offer full financial and operational transparency for informed decisions."
      },
      {
        title: "Finalized Transactions Made Easy",
        desc: "Connecting serious buyers with trusted sellers through a secure and streamlined process."
      }
    ],
    howItWorks: {
      subheadline: "A <span class='text-[#34D399]'>Simple Way</span> to Buy or Sell a Business",
      seller: {
        title: "Seller",
        steps: [
          { title: "Create Your Listing", desc: "Register your business details and start selling." },
          { title: "Get Verified", desc: "Our team verifies the data to ensure authenticity." },
          { title: "Receive Offers", desc: "Receive purchase offers from serious investors." },
          { title: "Finalize the Deal", desc: "Complete the sale and transfer ownership securely." }
        ]
      },
      buyer: {
        title: "Buyer",
        steps: [
          { title: "Explore Listings", desc: "Browse a wide range of verified businesses." },
          { title: "Make an Offer or Processed to Pay", desc: "Submit your financial offer or start direct purchase." },
          { title: "Sign NDA & Virtual Meeting", desc: "Get full details after signing the NDA." },
          { title: "Close the Deal", desc: "Complete the acquisition and transfer ownership successfully." }
        ]
      },
      cta: "Get Started"
    },
    listings: {
      headline: "Businesses Currently <span class='text-[#008A66]'>Available for Sale</span>",
      subheadline: "Discover a curated selection of verified businesses across various categories and cities in Saudi Arabia. Use filters to narrow down by industry, location, price, and more.",
      revenue: "Revenue",
      profit: "Profit",
      recovery: "Capital Recovery",
      details: "Details",
      browseAll: "Browse Business",
      // BUG-23 FIX: category names were hardcoded inline in BrowseBusinesses — moved here
      categories: {
        tech: "Tech",
        retail: "Retail",
        food: "Food",
        health: "Health",
        services: "Services",
        manufacturing: "Industry",
        education: "Education",
        logistics: "Logistics",
      },
    },
    faq: {
      headline: "Have Questions?",
      subheadline: "We have answers.",
      description: "We've compiled the most asked questions by investors and sellers to help you better understand how Jusoor works.",
      notFound: "Didn't find your answer? ",
      cta: "Full FAQs",
      items: [
        { q: "How does Jusoor ensure confidentiality?", a: "We use strict NDAs and data encryption to ensure confidentiality for all parties." },
        { q: "What are the platform fees?", a: "Fees vary based on deal type and size. Check our pricing page for details." },
        { q: "How long does the selling process take?", a: "It depends on documentation readiness and negotiation speed, usually 2-8 weeks." },
        { q: "Can I sell only a share of the business?", a: "Yes, Jusoor allows selling shares or strategic partnerships." },
        { q: "How are businesses valued?", a: "We rely on accurate financial and operational standards to provide a fair valuation reflecting real market value." },
        { q: "What documents are required for listing?", a: "Documents include Commercial Registration, financial statements, articles of association, and owner identity proof." }
      ]
    },
    footer: {
      about: "Jusoor is a licensed Saudi platform (7050269450) for buying and selling verified businesses. We offer a secure and seamless experience — with identity and business verification, secure payments, and smooth ownership transfer.",
      supportHeader: "Need more help?",
      supportCTA: "Sign up to access support, tools, and verified listings.",
      rights: "All rights reserved © 2026 Jusoor",
      quickLinks: {
        title: "Quick Links",
        links: [
           { label: "Browse Businesses", url: "#" },
           { label: "List Your Business", url: "#" },
           { label: "How it Works", url: "#" },
           { label: "About Us", url: "#" }
        ]
      },
      resources: {
        title: "Resources",
        links: [
           { label: "Blog", url: "#" },
           { label: "Valuation Guide", url: "#" },
           { label: "Contract Templates", url: "#" },
           { label: "Terms & Conditions", url: "#" }
        ]
      },
      contact: {
        title: "Contact Us",
        email: "info@jusoor.sa",
        phone: "920000000",
        address: "Riyadh, Saudi Arabia"
      }
    },
    buttons: {
      primary: "Get Started",
      secondary: "Learn More",
      contact: "Contact Us"
    },
    dashboard: {
      tabs: {
        dashboard: "Dashboard",
        listings: "My Listings",
        offers: "Offers",
        deals: "Deals",
        meetings: "Meetings",
        favorites: "Saved",
        alerts: "Alerts",
        settings: "Settings"
      },
      stats: {
        views: "Total Views",
        listedBusinesses: "Listed Businesses",
        receivedOffers: "Received Offers",
        meetingRequests: "Meeting Requests",
        scheduledMeetings: "Scheduled Meetings",
        closedDeals: "Closed Deals"
      },
      meetings: {
        title: "Meetings",
        filters: {
          all: "All",
          scheduled: "Upcoming",
          past: "Past"
        },
        table: {
          otherParty: "Other Party",
          role: "Role",
          requestDate: "Request Date",
          preferredDate: "Preferred Date",
          meetingDate: "Meeting Date",
          status: "Status",
          meetingLink: "Meeting Link",
          actions: "Actions"
        },
        status: {
          scheduled: "Upcoming",
          confirmed: "Confirmed",
          past: "Completed"
        },
        actions: {
          joinMeeting: "Join Meeting",
          viewDetails: "View Details",
          join: "Join",
          zoomLink: "Zoom Link",
          noActions: "No actions available"
        },
        empty: "No meetings in this list"
      },
      listings: {
        title: "My Listings",
        addNew: "List Business",
        filters: {
          all: "All",
          sold: "Sold"
        },
        status: {
          active: "Active",
          sold: "Sold",
          underReview: "Under Review"
        },
        stats: {
          offers: "Offers",
          views: "Views",
          favorites: "Saved"
        },
        actions: {
          manage: "Manage",
          details: "Details",
          remove: "Remove",
          view: "View",
          edit: "Edit"
        },
        sar: "SAR",
        successMessage: "Listing saved successfully!"
      },
      offers: {
        title: "Offers",
        filters: {
          all: "All",
          sent: "Sent",
          received: "Received",
          pending: "Pending",
          accepted: "Accepted",
          rejected: "Rejected"
        },
        table: {
          offerNumber: "Offer Number",
          listing: "Listing",
          status: "Status",
          offerType: "Offer Type",
          buyer: "Buyer",
          seller: "Seller",
          offerAmount: "Offer Amount",
          salePrice: "Sale Price",
          offerValue: "Offer Value",
          date: "Date",
          actions: "Actions"
        },
        status: {
          pending: "Pending",
          accepted: "Accepted",
          rejected: "Rejected",
          sent: "Sent"
        },
        offerTypes: {
          full: "Full Offer",
          preliminary: "Preliminary Offer",
          instant: "Instant Purchase"
        },
        actions: {
          viewDetails: "View Details",
          counterOffer: "Counter Offer",
          scheduleMeeting: "Schedule Meeting",
          submit: "Submit",
          cancel: "Cancel",
          amount: "New Amount",
          notes: "Additional Notes",
          meetingDate: "Meeting Date",
          meetingTime: "Meeting Time",
          successCounter: "Counter offer sent successfully",
          successMeeting: "Meeting request sent successfully",
          accept: "Accept Offer",
          scheduleNew: "Schedule New Meeting",
          downloadFiles: "Download Deal Documents"
        },
        sar: "SAR",
        types: {
          fullPurchase: "Full Purchase Offer",
          preliminary: "Preliminary Offer",
          instant: "Instant Purchase"
        }
      },
      deals: {
        title: "Deals",
        filters: {
          inProgress: "In Progress",
          completed: "Completed"
        },
        status: {
          inProgress: "In Progress",
          completed: "Completed"
        },
        labels: {
          buyer: "Buyer",
          finalOffer: "Final Offer",
          progress: "Deal Progress",
          start: "Start",
          expected: "Expected",
          backToDeals: "Back to Deals"
        },
        steps: {
          platformFee: {
            title: "Pay Platform Fee",
            desc: "Transfer platform commission to start the deal"
          },
          contract: {
            title: "Electronic Sale Contract",
            desc: "Review and sign the sale contract"
          },
          payment: {
            title: "Pay Deal Amount",
            desc: "Transfer full deal amount to seller"
          },
          finalize: {
            title: "Finalize Deal",
            desc: "Complete final documents and close the deal"
          }
        },
        stepStatus: {
          verified: "Verified",
          signed: "Signed",
          pending: "Pending",
          inProcess: "In Process"
        }
      },
      alerts: {
        title: "Alerts",
        types: {
          offer: "New Counter Offer",
          payment: "Payment Confirmation",
          docs: "New Documents",
          meeting: "Meeting Request"
        },
        markAllRead: "Mark All as Read"
      },
      settings: {
        title: "Settings",
        tabs: {
          profile: "Profile",
          wallet: "Wallet",
          password: "Password"
        },
        sections: {
          profile: "Profile",
          account: "Account Information",
          wallet: "My Wallet",
          notifications: "Notifications",
          security: "Security"
        },
        profile: {
          name: "Full Name",
          email: "Email",
          phone: "Phone Number",
          city: "City",
          region: "Region",
          memberSince: "Member Since",
          save: "Save Changes",
          saveChanges: "Save Changes"
        },
        wallet: {
          title: "Bank Accounts",
          addAccount: "Add New Account",
          bank: "Bank",
          holder: "Account Holder",
          iban: "IBAN Number",
          actions: "Actions"
        },
        password: {
          currentPassword: "Current Password",
          newPassword: "New Password",
          confirmPassword: "Confirm Password",
          updatePassword: "Update Password"
        },
        notifications: {
          email: "Email Notifications",
          emailDesc: "Receive notifications via email",
          sms: "SMS Notifications",
          smsDesc: "Receive notifications via SMS",
          push: "Push Notifications",
          pushDesc: "Receive in-platform notifications"
        },
        security: {
          changePassword: "Change Password",
          twoFactor: "Two-Factor Authentication",
          twoFactorDesc: "Enable two-factor authentication to protect your account"
        }
      },
      activity: {
        title: "Recent Activity",
        viewHistory: "View History",
        items: {
          newOffer: {
            title: "New Offer Received",
            desc: "\"Growth Company\" submitted an offer of 2.3 million SAR",
            time: "2 hours ago"
          },
          upcomingMeeting: {
            title: "Upcoming Meeting",
            desc: "Scheduled meeting with legal advisor to review contracts",
            time: "Tomorrow, 10:00 AM"
          },
          listingPublished: {
            title: "Listing Published",
            desc: "\"Premium Burger Restaurant Chain\" has been approved and published",
            time: "2 days ago"
          }
        },
        label: "Recent Activity",
        empty: "No recent activity"
      },
      accountStatus: {
        title: "Account Status",
        verified: "Fully Verified",
        verifiedDesc: "Your business identity is verified",
        underReview: "Under Review",
        underReviewDesc: "Your account is being reviewed",
        message: "Your account is ready for transactions. Make sure to update your bank details to facilitate transfers."
      }
    },
    browse: {
      title: "Browse Listed Businesses",
      subtitle: "Explore verified investment opportunities across Saudi Arabia",
      filterTitle: "Filters",
      showFilter: "Show Filters",
      hideFilter: "Hide Filters",
      region: "Region",
      city: "City",
      priceRange: "Price Range",
      revenue: "Revenue",
      moreThan: "More than",
      lessThan: "Less than",
      all: "All",
      riyadh: "Riyadh",
      jeddah: "Jeddah",
      khobar: "Khobar",
      qassim: "Qassim",
      makkah: "Makkah",
      eastern: "Eastern Region",
      apply: "Apply Filters",
      sortNewest: "Newest",
      sortHighest: "Highest Price",
      sortLowest: "Lowest Price",
      revenueLabel: "Revenue",
      profitLabel: "Profit",
      recoveryLabel: "Recovery Period",
      askingPrice: "Asking Price",
      sar: "SAR",
      month: "month",
      details: "View Details",
      acquisition: "Acquisition",
      taqbeel: "Taqbeel",
      noResults: "No results found",
      noResultsDesc: "Try adjusting your search or resetting the filters",
      resetFilters: "Reset Filters"
    },
    support: {
      title: "Help Center",
      subtitle: "How can we help you?",
      searchPlaceholder: "Search for your question here...",
      contactTitle: "Contact Support",
      contactEmail: "Email",
      contactPhone: "Phone",
      contactHours: "Working hours: Sun – Thu, 9 AM – 6 PM"
    },
    terms: {
      title: "Terms & Conditions",
      lastUpdated: "Last updated:",
      intro: "Please read these terms carefully before using the Jusoor platform."
    },
    articles: {
      title: "Articles & News",
      subtitle: "Discover the latest articles and tips from platform experts",
      readMore: "Read More",
      minRead: "min read"
    }
  }
};
