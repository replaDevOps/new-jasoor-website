import React, { useState, useRef } from 'react';
import { Button } from '../../components/Button';
import { TrendingUp, Upload, Eye, EyeOff, Check, X, Globe, Home, ArrowRight, ChevronDown } from 'lucide-react';
import logoIcon from '../../../assets/logo-icon.png';
import { useApp } from '../../../context/AppContext';
import { toast } from 'sonner';
// BUG-07 FIX: wire real GraphQL mutations for account creation + OTP verification
import { useMutation } from '@apollo/client';
import { CREATE_USER, VERIFY_EMAIL, VERIFY_EMAIL_OTP } from '../../../graphql/mutations/auth';
import { setAuthTokens } from '../../../utils/tokenManager';

export const SignUp = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { content, direction, language, setLanguage } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const isAr = language === 'ar';

  // BUG-01 FIX: toggleLanguage was called but never defined — caused ReferenceError crash on load
  const toggleLanguage = () => setLanguage(language === 'ar' ? 'en' : 'ar');

  // Form field state
  const [fullName, setFullName]           = useState('');
  const [email, setEmail]                 = useState('');
  const [phone, setPhone]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // BUG-07 FIX: OTP digits state — was missing entirely, inputs captured nothing
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [createUser] = useMutation(CREATE_USER, { errorPolicy: 'all' });
  // BUG-4 FIX: missing step — tell server to send OTP email after account created
  const [verifyEmail] = useMutation(VERIFY_EMAIL, { errorPolicy: 'all' });
  const [verifyEmailOTP] = useMutation(VERIFY_EMAIL_OTP, { errorPolicy: 'all' });

  const regionsList = Object.values(content.auth.signUp.regions);
  // BUG-17 FIX: ID upload field had no state — file was never captured or validated
  const [idFile, setIdFile]           = useState<File | null>(null);
  const [idFileError, setIdFileError] = useState<string>('');

  // BUG-18 FIX: Region dropdown had no state — selected value was never captured
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // Country code picker
  const [countryCode, setCountryCode]         = useState('+966');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const countryPickerRef = useRef<HTMLDivElement>(null);
  const COUNTRIES = [
    { code: '+966', flag: '🇸🇦', name: 'السعودية', nameEn: 'Saudi Arabia' },
    { code: '+971', flag: '🇦🇪', name: 'الإمارات', nameEn: 'UAE' },
    { code: '+965', flag: '🇰🇼', name: 'الكويت',   nameEn: 'Kuwait' },
    { code: '+973', flag: '🇧🇭', name: 'البحرين',  nameEn: 'Bahrain' },
    { code: '+974', flag: '🇶🇦', name: 'قطر',      nameEn: 'Qatar' },
    { code: '+968', flag: '🇴🇲', name: 'عُمان',    nameEn: 'Oman' },
    { code: '+20',  flag: '🇪🇬', name: 'مصر',      nameEn: 'Egypt' },
    { code: '+962', flag: '🇯🇴', name: 'الأردن',   nameEn: 'Jordan' },
    { code: '+961', flag: '🇱🇧', name: 'لبنان',    nameEn: 'Lebanon' },
    { code: '+1',   flag: '🇺🇸', name: 'أمريكا',   nameEn: 'USA' },
    { code: '+44',  flag: '🇬🇧', name: 'بريطانيا', nameEn: 'UK' },
    { code: '+49',  flag: '🇩🇪', name: 'ألمانيا',  nameEn: 'Germany' },
    { code: '+33',  flag: '🇫🇷', name: 'فرنسا',    nameEn: 'France' },
    { code: '+90',  flag: '🇹🇷', name: 'تركيا',    nameEn: 'Turkey' },
    { code: '+92',  flag: '🇵🇰', name: 'باكستان',  nameEn: 'Pakistan' },
    { code: '+91',  flag: '🇮🇳', name: 'الهند',    nameEn: 'India' },
    { code: '+63',  flag: '🇵🇭', name: 'فلبين',    nameEn: 'Philippines' },
    { code: '+880', flag: '🇧🇩', name: 'بنغلاديش', nameEn: 'Bangladesh' },
  ];

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setIdFileError(isAr ? 'الصيغة غير مدعومة. يُرجى رفع صورة (JPG/PNG) أو ملف PDF' : 'Unsupported format. Please upload an image (JPG/PNG) or PDF');
        setIdFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setIdFileError(isAr ? 'حجم الملف يتجاوز 5 ميجابايت' : 'File size exceeds 5 MB');
        setIdFile(null);
        return;
      }
      setIdFile(file);
      setIdFileError('');
    }
  };


  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!fullName.trim())
      e.fullName = isAr ? 'الاسم الكامل مطلوب' : 'Full name is required';
    if (!email.trim())
      e.email = isAr ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = isAr ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address';
    if (!phone.trim())
      e.phone = isAr ? 'رقم الجوال مطلوب' : 'Phone number is required';
    else if (!/^\d{4,15}$/.test(phone.replace(/[\s\-]/g,'')))
      e.phone = isAr ? 'أدخل رقم جوال صحيح' : 'Enter a valid phone number';
    if (!password)
      e.password = isAr ? 'كلمة المرور مطلوبة' : 'Password is required';
    else if (password.length < 8)
      e.password = isAr ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters';
    if (!confirmPassword)
      e.confirmPassword = isAr ? 'تأكيد كلمة المرور مطلوب' : 'Please confirm your password';
    else if (password !== confirmPassword)
      e.confirmPassword = isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearError = (field: string) => setErrors(prev => { const n = {...prev}; delete n[field]; return n; });

  // BUG-07 FIX: OTP input handler — auto-advance focus, handle backspace
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 4) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // BUG-07 FIX: handleDetailsSubmit now calls real CREATE_USER mutation
  const handleDetailsSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const { data, errors: gqlErrors } = await createUser({
        variables: {
          input: {
            name: fullName,
            email,
            phone: (() => {
              const p = phone.replace(/[\s\-]/g, '');
              // Remove leading zero if present, then prepend country code
              const digits = p.startsWith('0') ? p.slice(1) : p;
              return countryCode + digits;
            })(),
            password,
            // BUG-18 FIX: region now captured and sent to API
            region: selectedRegion || undefined,
          }
        }
      });

      if (gqlErrors?.length) {
        const msg = gqlErrors[0].message;
        if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('exist')) {
          setErrors({ email: isAr ? 'هذا البريد الإلكتروني مسجل بالفعل' : 'This email is already registered' });
        } else {
          toast.error(isAr ? 'حدث خطأ، يرجى المحاولة مجدداً' : 'An error occurred, please try again');
        }
        return;
      }

      // Account created — store tokens, trigger OTP email, then advance
      const { token, refreshToken, user } = data.createUser;
      setAuthTokens(token, refreshToken, user);
      // BUG-4 FIX: call VERIFY_EMAIL so server generates + sends OTP to user's email
      try { await verifyEmail({ variables: { email } }); } catch { /* proceed even if OTP send fails */ }
      setStep('otp');
      toast.success(isAr ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' : 'Verification code sent to your email');
    } catch (err) {
      console.error('SignUp error:', err);
      toast.error(isAr ? 'تعذر الاتصال بالخادم' : 'Could not connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  // BUG-07 FIX: handleOtpVerify now validates digits and calls real VERIFY_EMAIL_OTP mutation
  const handleOtpVerify = async () => {
    const otp = otpDigits.join('');
    if (otp.length < 5) {
      toast.error(isAr ? 'يرجى إدخال الرمز المكون من 5 أرقام كاملاً' : 'Please enter the complete 5-digit code');
      return;
    }
    setIsLoading(true);
    try {
      const { data, errors: gqlErrors } = await verifyEmailOTP({ variables: { email, otp } });

      if (gqlErrors?.length || !data?.verifyEmailOTP?.success) {
        toast.error(isAr ? 'الرمز غير صحيح أو منتهي الصلاحية، يرجى المحاولة مجدداً' : 'Incorrect or expired code, please try again');
        return;
      }

      toast.success(content.auth.signUp.success);
      onNavigate('signin');
    } catch (err) {
      console.error('OTP verify error:', err);
      toast.error(isAr ? 'حدث خطأ أثناء التحقق' : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className={`min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 py-6 md:py-12 relative ${direction === 'rtl' ? 'dir-rtl' : 'dir-ltr'}`}>
      
      <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-xl p-6 md:p-12 w-full max-w-2xl border border-gray-100 flex flex-col">
        
        {/* Top Controls - In Flow for better mobile layout */}
        <div className="flex justify-between items-center mb-6">
          {/* Home Button (Start Side) */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white rounded-full border border-gray-200 text-gray-600 hover:border-[#008A66] hover:text-[#008A66] hover:shadow-md transition-all"
          >
            <Home size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="font-bold text-xs md:text-sm">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
          </button>

          {/* Language Toggle (End Side) */}
          <button 
            onClick={toggleLanguage}
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full border bg-white border-gray-200 text-gray-600 hover:border-[#008A66] hover:text-[#008A66] hover:shadow-md transition-all"
            title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
          >
            <span className="font-bold text-xs md:text-sm mb-0.5">{language === 'ar' ? 'E' : 'ع'}</span>
          </button>
        </div>

        {step === 'details' ? (
          <>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4 md:mb-6">
                <img src={logoIcon} alt="Jusoor" className="h-12 md:h-16 w-auto object-contain" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2 tracking-tight">{content.auth.signUp.title}</h1>
              <p className="text-gray-500 text-sm md:text-lg">{content.auth.signUp.subtitle}</p>
            </div>

            <div className="space-y-5 md:space-y-6">
              {/* Nafath Button - Text Only, Teal Background */}
              <button className="w-full bg-[#39A997] text-white font-bold py-3.5 rounded-xl hover:bg-[#2D8D7E] transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group shadow-md hover:shadow-lg">
                <span className="text-lg">{content.auth.signUp.nafath}</span>
                <div className={`absolute top-0 bg-[#FBAA1A] text-white text-[10px] font-bold px-3 py-1 shadow-sm ${direction === 'rtl' ? 'right-0 rounded-bl-xl' : 'left-0 rounded-br-xl'}`}>
                  {content.auth.signUp.soon}
                </div>
              </button>

              <div className="relative flex items-center gap-4 my-6 md:my-8">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-gray-400 text-sm font-medium px-2">{content.auth.signUp.or}</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2">{content.auth.signUp.fullName}</label>
                  <input 
                    type="text" 
                    value={fullName} onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }} placeholder={content.auth.signUp.fullNamePlaceholder}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 md:py-3.5 focus:outline-none focus:border-[#008A66] focus:ring-4 focus:ring-[#008A66]/10 transition-all text-sm md:text-base" 
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2">{content.auth.signUp.email}</label>
                  <input 
                    type="email" 
                    value={email} onChange={(e) => { setEmail(e.target.value); clearError("email"); }} placeholder={content.auth.signUp.emailPlaceholder}
                    className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 md:py-3.5 focus:outline-none focus:border-[#008A66] focus:ring-4 focus:ring-[#008A66]/10 transition-all text-sm md:text-base ${direction === 'rtl' ? 'text-left dir-ltr placeholder:text-right' : 'text-left dir-ltr'}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2">{content.auth.signUp.phone}</label>
                  <div className="relative" ref={countryPickerRef}>
                    {/* Country code button */}
                    <button
                      type="button"
                      onClick={() => setShowCountryPicker(v => !v)}
                      className="absolute top-1/2 -translate-y-1/2 left-3 z-10 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1 transition-colors"
                    >
                      <span className="text-base leading-none">{COUNTRIES.find(c => c.code === countryCode)?.flag}</span>
                      <span className="text-xs font-bold text-gray-700 dir-ltr">{countryCode}</span>
                      <ChevronDown size={12} className="text-gray-500"/>
                    </button>
                    <input
                      type="tel"
                      className={`w-full bg-gray-50 border rounded-xl py-3 md:py-3.5 focus:outline-none transition-all dir-ltr text-sm md:text-base pr-4 ${errors.phone ? 'border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-400/10' : 'border-gray-200 focus:border-[#008A66] focus:ring-4 focus:ring-[#008A66]/10'}`}
                      style={{ paddingLeft: `${countryCode.length * 8 + 56}px` }}
                      value={phone} onChange={(e) => { setPhone(e.target.value); clearError("phone"); }}
                      placeholder="5XXXXXXXX"
                    />
                    {/* Dropdown */}
                    {showCountryPicker && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl w-64 max-h-64 overflow-y-auto">
                        {COUNTRIES.map(country => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => { setCountryCode(country.code); setShowCountryPicker(false); clearError("phone"); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm ${countryCode === country.code ? 'bg-[#E6F7F2] font-bold' : ''}`}
                          >
                            <span className="text-xl">{country.flag}</span>
                            <span className="flex-1 text-right text-gray-800">{isAr ? country.name : country.nameEn}</span>
                            <span className="text-gray-400 dir-ltr font-mono text-xs">{country.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2">{content.auth.signUp.region}</label>
                  <div className="relative">
                    {/* BUG-18 FIX: select had no state — value was never captured */}
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 md:py-3.5 focus:outline-none focus:border-[#008A66] focus:ring-4 focus:ring-[#008A66]/10 transition-all appearance-none text-sm md:text-base"
                    >
                      <option value="">{content.auth.signUp.selectRegion}</option>
                      {regionsList.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                    <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 ${direction === 'rtl' ? 'left-4' : 'right-4'}`}>
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Uploads — BUG-17 FIX: now has state, filename display, and validation */}
              <div className="space-y-3 md:space-y-4">
                <label className="block text-sm font-bold text-gray-700">{content.auth.signUp.idUpload}</label>
                <label className={`border-2 border-dashed rounded-xl p-6 md:p-8 flex flex-col items-center justify-center cursor-pointer transition-all group ${idFile ? 'border-[#008A66] bg-[#008A66]/5' : idFileError ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-[#008A66] hover:bg-[#008A66]/5'}`}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={handleIdFileChange}
                  />
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${idFile ? 'bg-[#008A66]/10' : 'bg-gray-100 group-hover:bg-[#008A66]/10'}`}>
                    <Upload size={20} className={idFile ? 'text-[#008A66]' : 'text-gray-400 group-hover:text-[#008A66]'} />
                  </div>
                  {idFile ? (
                    <>
                      <span className="text-sm font-bold text-[#008A66] truncate max-w-[80%] text-center">{idFile.name}</span>
                      <span className="text-xs text-gray-400 mt-1">{(idFile.size / 1024).toFixed(0)} KB — {isAr ? 'انقر للتغيير' : 'Click to change'}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium">{content.auth.signUp.uploadText}</span>
                      <span className="text-xs text-gray-400 mt-1 text-center">{content.auth.signUp.uploadHint}</span>
                    </>
                  )}
                </label>
                {idFileError && <p className="text-red-500 text-xs mt-1 font-medium">{idFileError}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2">{content.auth.signUp.password}</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 md:py-3.5 focus:outline-none focus:border-[#008A66] focus:ring-4 focus:ring-[#008A66]/10 transition-all text-sm md:text-base"
                      placeholder={content.auth.signUp.passwordPlaceholder}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#008A66] transition-colors ${direction === 'rtl' ? 'left-4' : 'right-4'}`}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2">{content.auth.signUp.confirmPassword}</label>
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 md:py-3.5 focus:outline-none focus:border-[#008A66] focus:ring-4 focus:ring-[#008A66]/10 transition-all text-sm md:text-base"
                    placeholder={content.auth.signUp.passwordPlaceholder}
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-100">
                <div className="relative flex items-center">
                    <input type="checkbox" id="terms" className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-[#008A66] checked:bg-[#008A66]" />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                      <Check size={14} strokeWidth={3} />
                    </div>
                </div>
                <label htmlFor="terms" className="text-xs md:text-sm text-gray-600 leading-relaxed cursor-pointer select-none">
                  {content.auth.signUp.agree} <a href="#" className="text-[#008A66] font-bold hover:underline">{content.auth.signUp.terms}</a> {content.auth.signUp.and} <a href="#" className="text-[#008A66] font-bold hover:underline">{content.auth.signUp.privacy}</a>{content.auth.signUp.agreeConfirm}
                </label>
              </div>

              <Button 
                onClick={handleDetailsSubmit}
                disabled={isLoading}
                className="w-full py-3.5 md:py-4 text-base md:text-lg font-bold shadow-lg shadow-[#008A66]/20 hover:shadow-[#008A66]/40 transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                  </span>
                ) : content.auth.signUp.submit}
              </Button>

              <p className="text-center text-gray-600 mt-4 md:mt-6 text-sm md:text-base">
                {content.auth.signUp.haveAccount} 
                <button onClick={() => onNavigate('signin')} className="text-[#008A66] font-bold hover:underline mx-1 px-1">
                  {content.auth.signUp.signIn}
                </button>
              </p>
            </div>
          </>
        ) : (
          /* OTP Step */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center mb-8 md:mb-10 mt-4 md:mt-8">
              <div className="flex justify-center mb-4 md:mb-6">
                <img src={logoIcon} alt="Jusoor" className="h-12 md:h-16 w-auto object-contain" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-[#111827] mb-2 md:mb-3">
                {content.auth.forgotPassword.titleOtp || "Verification"}
              </h1>
              <p className="text-gray-500 text-sm md:text-base max-w-[90%] md:max-w-[80%] mx-auto leading-relaxed">
                {content.auth.forgotPassword.subtitleOtp || "Please enter the verification code sent to your email/phone"}
              </p>
            </div>

             <div className="flex justify-center gap-2 md:gap-3 mb-6 md:mb-8 dir-ltr">
               {[0,1,2,3,4].map((i) => (
                 <input
                   key={i}
                   ref={el => { otpRefs.current[i] = el; }}
                   type="text"
                   inputMode="numeric"
                   maxLength={1}
                   value={otpDigits[i]}
                   onChange={e => handleOtpChange(i, e.target.value)}
                   onKeyDown={e => handleOtpKeyDown(i, e)}
                   className="w-10 h-10 md:w-14 md:h-14 text-center text-lg md:text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:border-[#008A66] focus:ring-4 focus:ring-[#008A66]/10 transition-all text-[#111827]"
                   autoFocus={i === 0}
                 />
               ))}
             </div>
             
             <Button 
               onClick={handleOtpVerify}
               disabled={isLoading}
               className="w-full py-3.5 md:py-4 mb-4 md:mb-6 text-base md:text-lg font-bold shadow-lg shadow-[#008A66]/20 hover:shadow-[#008A66]/40 transition-all"
             >
                {isLoading ? (
                   <span className="flex items-center gap-2">
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     {language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}
                   </span>
                ) : (content.auth.forgotPassword.confirm || "Verify")}
             </Button>

             <button 
              onClick={() => setStep('details')}
              className="w-full text-gray-500 hover:text-[#008A66] font-medium text-sm transition-colors py-2 mb-4"
            >
              {content.auth.forgotPassword.back || 'Back to details'}
            </button>
             
             <div className="text-center">
               <span className="text-gray-500 text-sm mx-1">{content.auth.forgotPassword.didNotReceive || "Did not receive code?"}</span>
               <button className="text-[#008A66] font-bold hover:underline text-sm hover:text-[#007053] transition-colors">
                 {content.auth.forgotPassword.resend || "Resend"}
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
