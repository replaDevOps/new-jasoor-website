import React, { useState, useRef } from 'react';
import { Button } from '../../components/Button';
import { ArrowRight, Mail, ShieldCheck, Globe, Home } from 'lucide-react';
import logoIcon from '../../../assets/logo-icon.png';
import { inputBase, inputOtp } from '../../../lib/inputStyles';
import { useApp } from '../../../context/AppContext';
import { toast } from 'sonner';
// BUG-08 FIX: wire real GraphQL mutations — was using no state, no handlers, no API calls
import { useMutation } from '@apollo/client';
import { REQUEST_PASSWORD_RESET, VERIFY_PASSWORD_RESET_OTP } from '../../../graphql/mutations/auth';
export const ForgotPassword = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { content, direction, language, setLanguage } = useApp();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const isAr = language === 'ar';

  // BUG-08 FIX: email field had no state — value was never captured
  const [email, setEmail]     = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  // BUG-08 FIX: OTP inputs had no state — digits were never captured
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [requestReset] = useMutation(REQUEST_PASSWORD_RESET, { errorPolicy: 'all' });
  const [verifyOTP]    = useMutation(VERIFY_PASSWORD_RESET_OTP, { errorPolicy: 'all' });

  const toggleLanguage = () => setLanguage(language === 'ar' ? 'en' : 'ar');

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
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

  // BUG-08 FIX: Send Code button now calls real REQUEST_PASSWORD_RESET mutation
  const handleSendCode = async () => {
    if (!email.trim()) {
      setEmailError(isAr ? 'البريد الإلكتروني مطلوب' : 'Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(isAr ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address');
      return;
    }
    setEmailError('');
    setIsLoading(true);
    try {
      const { data, errors: gqlErrors } = await requestReset({ variables: { email } });
      if (gqlErrors?.length || !data?.requestPasswordReset?.success) {
        const msg = data?.requestPasswordReset?.message || gqlErrors?.[0]?.message || '';
        const notFound = msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('exist');
        setEmailError(
          notFound
            ? (isAr ? 'هذا البريد الإلكتروني غير مسجل' : 'This email is not registered')
            : (isAr ? 'حدث خطأ، يرجى المحاولة مجدداً' : 'An error occurred, please try again')
        );
        return;
      }
      setStep('otp');
      toast.success(content.auth.forgotPassword.codeSent);
    } catch (err) {
      console.error('RequestReset error:', err);
      toast.error(isAr ? 'تعذر الاتصال بالخادم' : 'Could not connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  // BUG-08 FIX: Confirm button now validates digits and calls VERIFY_PASSWORD_RESET_OTP
  const handleConfirmOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length < 5) {
      toast.error(isAr ? 'يرجى إدخال الرمز المكون من 5 أرقام كاملاً' : 'Please enter the complete 5-digit code');
      return;
    }
    setIsLoading(true);
    try {
      const { data, errors: gqlErrors } = await verifyOTP({ variables: { email, otp } });
      if (gqlErrors?.length || !data?.verifyPasswordResetOTP?.success) {
        toast.error(isAr ? 'الرمز غير صحيح أو منتهي الصلاحية' : 'Incorrect or expired code');
        return;
      }
      // resetToken returned — in future: pass to reset-password page
      toast.success(isAr ? 'تم التحقق بنجاح. يمكنك الآن إعادة تعيين كلمة المرور' : 'Verified successfully. You can now reset your password');
      onNavigate('signin');
    } catch (err) {
      console.error('VerifyOTP error:', err);
      toast.error(isAr ? 'حدث خطأ أثناء التحقق' : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 py-6 md:py-12 relative ${direction === 'rtl' ? 'dir-rtl' : 'dir-ltr'}`}>
      
      <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-xl p-6 md:p-12 w-full max-w-lg border border-gray-100 flex flex-col">
        
        {/* Top Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white rounded-full border border-gray-200 text-gray-600 hover:border-[#008A66] hover:text-[#008A66] hover:shadow-md transition-all"
            >
              <Home size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="font-bold text-xs md:text-sm">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </button>
          </div>
          <button
            onClick={toggleLanguage}
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full border bg-white border-gray-200 text-gray-600 hover:border-[#008A66] hover:text-[#008A66] hover:shadow-md transition-all"
            title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
          >
            <span className="font-bold text-xs md:text-sm mb-0.5">{language === 'ar' ? 'E' : 'ع'}</span>
          </button>
        </div>

        <div className="text-center mb-8 md:mb-10 mt-4 md:mt-8">
          <div className="flex justify-center mb-4 md:mb-6">
            <img src={logoIcon} alt="Jusoor" className="h-12 md:h-16 w-auto object-contain" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827] mb-2 md:mb-3">
            {step === 'email' ? content.auth.forgotPassword.titleEmail : content.auth.forgotPassword.titleOtp}
          </h1>
          <p className="text-gray-500 max-w-[90%] md:max-w-[80%] mx-auto leading-relaxed text-sm md:text-base">
            {step === 'email'
              ? content.auth.forgotPassword.subtitleEmail
              : content.auth.forgotPassword.subtitleOtp}
          </p>
        </div>

        <div className="space-y-5 md:space-y-6">
          {step === 'email' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2">
                {content.auth.forgotPassword.email}
              </label>
              {/* BUG-08 FIX: email input now has value + onChange */}
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                className={`${inputBase} ${direction === 'rtl' ? 'text-left dir-ltr placeholder:text-right' : 'text-left dir-ltr'} ${emailError ? 'border-red-400 bg-red-50' : ''}`}
                placeholder={content.auth.forgotPassword.emailPlaceholder}
              />
              {emailError && <p className="text-red-500 text-xs mt-1.5 font-medium">{emailError}</p>}
              <Button
                onClick={handleSendCode}
                disabled={isLoading}
                className="w-full mt-6 md:mt-8 py-3.5 md:py-4 text-base md:text-lg font-bold shadow-lg shadow-[#008A66]/20 hover:shadow-[#008A66]/40 transition-all"
              >
                {isLoading ? (isAr ? 'جاري الإرسال...' : 'Sending...') : content.auth.forgotPassword.sendCode}
              </Button>
              <div className="mt-4 md:mt-6 text-center">
                <button
                  onClick={() => onNavigate('signin')}
                  className="text-gray-500 hover:text-[#008A66] font-medium text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowRight size={16} className={`transition-transform ${direction === 'rtl' ? 'rotate-180' : ''}`} />
                  <span>{content.auth.forgotPassword.back}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* BUG-08 FIX: OTP inputs now have value, onChange, onKeyDown, and ref */}
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
                    className={inputOtp}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <Button
                onClick={handleConfirmOtp}
                disabled={isLoading}
                className="w-full py-3.5 md:py-4 mb-4 md:mb-6 text-base md:text-lg font-bold shadow-lg shadow-[#008A66]/20 hover:shadow-[#008A66]/40 transition-all"
              >
                {isLoading ? (isAr ? 'جاري التحقق...' : 'Verifying...') : content.auth.forgotPassword.confirm}
              </Button>
              <div className="text-center mb-4">
                <span className="text-gray-500 text-sm mx-1">{content.auth.forgotPassword.didNotReceive}</span>
                <button
                  onClick={handleSendCode}
                  disabled={isLoading}
                  className="text-[#008A66] font-bold hover:underline text-sm hover:text-[#007053] transition-colors"
                >
                  {content.auth.forgotPassword.resend}
                </button>
              </div>
              <div className="text-center">
                <button
                  onClick={() => setStep('email')}
                  className="text-gray-500 hover:text-[#008A66] font-medium text-sm transition-colors"
                >
                  {content.auth.forgotPassword.back || 'Back to email'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};