import React, { useState } from 'react';
import { Button } from '../../components/Button';
import { Eye, EyeOff, Home } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { toast } from 'sonner';
import logoIcon from '../../../assets/logo-icon.png';
// BUG-06 FIX: replaced fake setTimeout with real GraphQL mutation
import { useMutation } from '@apollo/client';
import { LOGIN } from '../../../graphql/mutations/auth';
import { setAuthTokens } from '../../../utils/tokenManager';

interface Errors { identifier?: string; password?: string; }

export const SignIn = ({
  onNavigate,
  returnTo,
}: {
  onNavigate: (page: string, id?: string | number) => void;
  returnTo?: { view: string; id?: string | number };
}) => {
  const { login, content, direction, language, setLanguage } = useApp();
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier]     = useState('');
  const [password, setPassword]         = useState('');
  const [errors, setErrors]             = useState<Errors>({});


  const isAr = language === 'ar';

  // BUG-06 FIX: real Apollo mutation — mirrors OLD frontend login.js exactly
  const [loginMutation] = useMutation(LOGIN, { errorPolicy: 'all' });

  const validate = (): boolean => {
    const e: Errors = {};
    if (!identifier.trim()) {
      e.identifier = isAr ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
      e.identifier = isAr ? 'أدخل بريداً إلكترونياً صحيحاً' : 'Enter a valid email address';
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
      const normalized = identifier.trim().toLowerCase();
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
      // Return to where the user came from (e.g. a listing they were viewing when auth was required)
      if (returnTo?.view) {
        onNavigate(returnTo.view, returnTo.id);
      } else {
        onNavigate('dashboard');
      }
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
          <button
            className="w-full bg-[#39A997] text-white font-bold py-3.5 rounded-xl hover:bg-[#2D8D7E] transition-all flex items-center justify-center gap-3 relative shadow-md"
          >
            <span className="text-lg">{content.auth.signIn.nafath}</span>
            <div className={`absolute top-2 bg-[#FBAA1A] text-white text-[11px] leading-none font-bold px-2.5 py-1 rounded-full shadow-sm ${direction === 'rtl' ? 'right-3' : 'left-3'}`}>
              {content.auth.signIn.soon}
            </div>
          </button>

          <div className="relative flex items-center gap-4 my-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-gray-400 text-sm font-medium px-2">{content.auth.signIn.or}</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          {/* Email field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
            <div className="relative">
              <input
                type="email"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setErrors(ev => ({...ev, identifier: undefined})); }}
                className={`${inputBase} ${errors.identifier ? inputErr : inputOk} transition-all`}
                placeholder={content.auth.signIn.emailOrPhonePlaceholder}
                autoComplete="email"
              />
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
                className={`${inputBase} ${errors.password ? inputErr : inputOk} ${direction === 'rtl' ? 'pl-11' : 'pr-11'}`}
                placeholder={content.auth.signIn.passwordPlaceholder}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#008A66] transition-colors ${direction === 'rtl' ? 'left-4' : 'right-4'}`}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
          </div>

          {/* Forgot password */}
          <div className="flex justify-end text-xs md:text-sm">
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
