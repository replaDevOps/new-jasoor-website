import React, { useState, useRef } from 'react';
import { Button } from '../../components/Button';
import { Eye, EyeOff, Check, Home, ChevronDown } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { toast } from 'sonner';
import logoIcon from '../../../assets/logo-icon.png';
// BUG-06 FIX: replaced fake setTimeout with real GraphQL mutation
import { useMutation } from '@apollo/client';
import { LOGIN } from '../../../graphql/mutations/auth';
import { setAuthTokens } from '../../../utils/tokenManager';

interface Errors { identifier?: string; password?: string; }

export const SignIn = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { login, content, direction, language, setLanguage } = useApp();
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier]     = useState('');
  const [password, setPassword]         = useState('');
  const [errors, setErrors]             = useState<Errors>({});

  // Country code picker (only shown when phone number detected)
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
  // Phone detection: identifier looks like a phone if it starts with digit, 0, or +
  const isPhoneInput = /^[\d+]/.test(identifier);
  const isAr = language === 'ar';

  // BUG-06 FIX: real Apollo mutation — mirrors OLD frontend login.js exactly
  const [loginMutation] = useMutation(LOGIN, { errorPolicy: 'all' });

  const validate = (): boolean => {
    const e: Errors = {};
    if (!identifier.trim()) {
      e.identifier = isAr ? 'هذا الحقل مطلوب' : 'This field is required';
    } else if (
      !identifier.includes('@') &&
      !/^[\d+][\d\s\-]{5,17}$/.test(identifier.trim())
    ) {
      e.identifier = isAr
        ? 'أدخل بريد إلكتروني صحيح أو رقم جوال سعودي'
        : 'Enter a valid email or Saudi phone number';
    }
    if (!password) {
      e.password = isAr ? 'كلمة المرور مطلوبة' : 'Password is required';
    } else if (password.length < 6) {
      e.password = isAr ? 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' : 'Password too short (min 6 characters)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // BUG-06 FIX: call real LOGIN mutation — email field matches OLD frontend contract
      // Normalize phone with selected country code, or keep as email
      const raw = identifier.trim().replace(/[\s\-]/g, '');
      let normalized = raw;
      if (!raw.includes('@')) {
        // It's a phone — prepend country code if not already there
        const digits = raw.replace(/^\+\d{1,4}/, ''); // strip any existing code
        const noLeadingZero = digits.startsWith('0') ? digits.slice(1) : digits;
        normalized = countryCode + noLeadingZero;
      } else {
        normalized = raw.toLowerCase();
      }
      const { data, errors: gqlErrors } = await loginMutation({
        variables: { email: normalized, password },
      });

      if (gqlErrors?.length) {
        const msg = gqlErrors[0].message;
        const isCredentials =
          msg.includes('Invalid') || msg.includes('credentials') || msg.includes('password') || msg.includes('not found');
        if (isCredentials) {
          setErrors({ identifier: isAr ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Incorrect email or password' });
        } else {
          toast.error(isAr ? 'حدث خطأ، يرجى المحاولة مجدداً' : 'An error occurred, please try again');
        }
        return;
      }

      const { token, refreshToken, user } = data.login;
      setAuthTokens(token, refreshToken, user);
      login();
      toast.success(content.auth.signIn.success);
      onNavigate('dashboard');
    } catch (err: unknown) {
      console.error('Login error:', err);
      toast.error(isAr ? 'تعذر الاتصال بالخادم، تحقق من اتصالك' : 'Could not connect to server, check your connection');
    } finally {
      setLoading(false);
    }
  };

  const inputBase = `w-full bg-gray-50 border rounded-xl px-4 py-3 md:py-3.5 focus:outline-none focus:ring-4 transition-all text-sm md:text-base ${direction === 'rtl' ? 'text-left dir-ltr placeholder:text-right' : 'text-left'}`;
  const inputOk  = 'border-gray-200 focus:border-[#008A66] focus:ring-[#008A66]/10';
  const inputErr = 'border-red-400 focus:border-red-400 focus:ring-red-100 bg-red-50';

  return (
    <div className={`min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 py-6 md:py-12 relative ${direction === 'rtl' ? 'dir-rtl' : 'dir-ltr'}`}>
      <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-xl p-6 md:p-12 w-full max-w-lg border border-gray-100 flex flex-col">

        {/* Top Controls */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white rounded-full border border-gray-200 text-gray-600 hover:border-[#008A66] hover:text-[#008A66] hover:shadow-md transition-all">
            <Home size={16} />
            <span className="font-bold text-xs md:text-sm">{isAr ? 'الرئيسية' : 'Home'}</span>
          </button>
          <button onClick={() => setLanguage(isAr ? 'en' : 'ar')} aria-label={isAr ? 'Switch to English' : 'التبديل للعربية'} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full border bg-white border-gray-200 text-gray-600 hover:border-[#008A66] hover:text-[#008A66] hover:shadow-md transition-all">
            <span className="font-bold text-xs md:text-sm">{isAr ? 'E' : 'ع'}</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 md:mb-6">
            <img src={logoIcon} alt="Jusoor" className="h-12 md:h-16 w-auto object-contain" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2 tracking-tight">{content.auth.signIn.title}</h1>
          <p className="text-gray-500 text-sm md:text-lg">{content.auth.signIn.subtitle}</p>
        </div>

        <div className="space-y-5 md:space-y-6">
          {/* Nafath */}
          <button className="w-full bg-[#39A997] text-white font-bold py-3.5 rounded-xl hover:bg-[#2D8D7E] transition-all flex items-center justify-center gap-3 relative overflow-hidden shadow-md">
            <span className="text-lg">{content.auth.signIn.nafath}</span>
            <div className={`absolute top-0 bg-[#FBAA1A] text-white text-[10px] font-bold px-3 py-1 shadow-sm ${direction === 'rtl' ? 'right-0 rounded-bl-xl' : 'left-0 rounded-br-xl'}`}>
              {content.auth.signIn.soon}
            </div>
          </button>

          <div className="relative flex items-center gap-4 my-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-gray-400 text-sm font-medium px-2">{content.auth.signIn.or}</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          {/* Email/Phone field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">{content.auth.signIn.emailOrPhone}</label>
            <div className="relative" ref={countryPickerRef}>
              {/* Country code button — only shown when typing a phone */}
              {isPhoneInput && (
                <button
                  type="button"
                  onClick={() => setShowCountryPicker(v => !v)}
                  className="absolute top-1/2 -translate-y-1/2 left-3 z-10 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1 transition-colors"
                >
                  <span className="text-base leading-none">{COUNTRIES.find(cn => cn.code === countryCode)?.flag}</span>
                  <span className="text-xs font-bold text-gray-700 dir-ltr">{countryCode}</span>
                  <ChevronDown size={12} className="text-gray-500"/>
                </button>
              )}
              <input
                type="text"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setErrors(ev => ({...ev, identifier: undefined})); }}
                className={`${inputBase} ${errors.identifier ? inputErr : inputOk} transition-all`}
                style={isPhoneInput ? { paddingLeft: `${countryCode.length * 8 + 56}px` } : {}}
                placeholder={content.auth.signIn.emailOrPhonePlaceholder}
              />
              {/* Country dropdown */}
              {isPhoneInput && showCountryPicker && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl w-64 max-h-64 overflow-y-auto">
                  {COUNTRIES.map(country => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => { setCountryCode(country.code); setShowCountryPicker(false); }}
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
            {errors.identifier && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.identifier}</p>}
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">{content.auth.signIn.password}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(ev => ({...ev, password: undefined})); }}
                className={`${inputBase} ${errors.password ? inputErr : inputOk}`}
                placeholder={content.auth.signIn.passwordPlaceholder}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-[#008A66] transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
          </div>

          {/* Remember me + forgot */}
          <div className="flex items-center justify-between text-xs md:text-sm">
            <div className="relative flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" id="remember" className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-[#008A66] checked:bg-[#008A66]" />
              <div className="pointer-events-none absolute left-[2px] top-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                <Check size={14} strokeWidth={3} />
              </div>
              <label htmlFor="remember" className="text-gray-600 font-medium cursor-pointer">{content.auth.signIn.rememberMe}</label>
            </div>
            <button onClick={() => onNavigate('forgot-password')} className="text-[#008A66] font-bold hover:underline">
              {content.auth.signIn.forgotPassword}
            </button>
          </div>

          <Button className="w-full py-3.5 md:py-4 text-base md:text-lg font-bold shadow-lg shadow-[#008A66]/20" onClick={handleLogin} disabled={loading}>
            {loading ? content.auth.signIn.loading : content.auth.signIn.submit}
          </Button>

          <p className="text-center text-gray-600 mt-4 text-sm md:text-base">
            {content.auth.signIn.noAccount}
            <button onClick={() => onNavigate('signup')} className="text-[#008A66] font-bold hover:underline mx-1 px-1">
              {content.auth.signIn.signUp}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
