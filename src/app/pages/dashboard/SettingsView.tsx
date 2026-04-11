import React, { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { toast } from 'sonner';
import { User, CreditCard, Lock, Plus, Trash2, FileText, Upload, CheckCircle2, ShieldCheck, AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_USER_DETAILS,
  GET_USER_BANKS,
} from '../../../graphql/queries/dashboard';
import {
  UPDATE_USER,
  CHANGE_PASSWORD,
  ADD_BANK,
  DELETE_BANK,
  UPLOAD_IDENTITY_DOCUMENT,
} from '../../../graphql/mutations/dashboard';
import { SectionHeader } from './DashboardView';

export const SettingsView = () => {
  const { content, language, userId } = useApp();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState('profile');

  // Always fetch fresh — admin can change verification status at any time
  const { data: userData, loading: userLoading, refetch: refetchUser } = useQuery(GET_USER_DETAILS, {
    variables: { getUserDetailsId: userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,   // re-check every 60s so unverified status reflects without hard refresh
    errorPolicy: 'all',
  });

  const { data: banksData, loading: banksLoading, refetch: refetchBanks } = useQuery(GET_USER_BANKS, {
    errorPolicy: 'all',
  });

  const [updateUser,  { loading: savingProfile  }] = useMutation(UPDATE_USER,       { errorPolicy: 'all' });
  const [changePwd,   { loading: savingPassword }] = useMutation(CHANGE_PASSWORD,   { errorPolicy: 'all' });
  const [addBank,     { loading: addingBank     }] = useMutation(ADD_BANK,           { errorPolicy: 'all' });
  const [deleteBank                               ] = useMutation(DELETE_BANK,        { errorPolicy: 'all' });
  const [uploadIdentityDocument                  ] = useMutation(UPLOAD_IDENTITY_DOCUMENT, { errorPolicy: 'all' });
  const { uploadFile, uploading: idUploading } = useFileUpload();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '', email: '', phone: '', city: '', region: '',
  });

  // Password form state
  const [pwdForm, setPwdForm] = useState({
    current: '', new: '', confirm: '',
  });

  // Identity document state
  const [idDoc, setIdDoc] = useState<{ file: File | null; type: string; uploaded: boolean; filePath: string | null }>({
    file: null, type: 'national_id', uploaded: false, filePath: null
  });

  // Add bank form
  const [bankForm, setBankForm] = useState({
    bankName: '', accountNumber: '', accountTitle: '', iban: '',
  });

  // Sync form with API data once loaded
  useEffect(() => {
    const u = userData?.getUserDetails;
    if (u) {
      setProfileForm({
        name:   u.name    ?? '',
        email:  u.email   ?? '',
        phone:  u.phone   ?? '',
        city:   u.city    ?? '',
        region: u.district ?? '',
      });
    }
  }, [userData]);

  const handleSaveProfile = async () => {
    const { errors } = await updateUser({
      variables: {
        input: {
          name:     profileForm.name,
          email:    profileForm.email,
          phone:    profileForm.phone,
          city:     profileForm.city,
          district: profileForm.region,
        },
      },
    });
    if (errors?.length) {
      toast.error(isAr ? 'حدث خطأ أثناء الحفظ' : 'Error saving changes');
      return;
    }
    toast.success(isAr ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
  };

  const handleChangePassword = async () => {
    if (!pwdForm.current || !pwdForm.new) {
      toast.error(isAr ? 'يرجى تعبئة جميع الحقول' : 'Please fill all fields');
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    const { errors } = await changePwd({
      variables: {
        adminChangePasswordId: userId,
        oldPassword: pwdForm.current,
        newPassword: pwdForm.new,
      },
    });
    if (errors?.length) {
      toast.error(isAr ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect');
      return;
    }
    toast.success(isAr ? 'تم تغيير كلمة المرور' : 'Password updated successfully');
    setPwdForm({ current: '', new: '', confirm: '' });
  };

  const handleAddBank = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountTitle) {
      toast.error(isAr ? 'يرجى تعبئة الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    const { errors } = await addBank({
      variables: {
        input: {
          bankName:      bankForm.bankName,
          accountNumber: bankForm.accountNumber,
          accountTitle:  bankForm.accountTitle,
          iban:          bankForm.iban,
        },
      },
    });
    if (errors?.length) {
      toast.error(isAr ? 'حدث خطأ' : 'Error adding bank');
      return;
    }
    toast.success(isAr ? 'تم إضافة الحساب المصرفي' : 'Bank account added');
    setBankForm({ bankName: '', accountNumber: '', accountTitle: '', iban: '' });
    refetchBanks();
  };

  const handleUploadId = async () => {
    if (!idDoc.file) return;
    const title = idDoc.type === 'passport'
      ? (isAr ? 'جواز السفر' : 'Passport')
      : (isAr ? 'الهوية الوطنية' : 'National ID');
    const uploaded = await uploadFile(idDoc.file, title);
    if (!uploaded) { toast.error(isAr ? 'فشل رفع الملف' : 'Upload failed'); return; }
    const { errors } = await uploadIdentityDocument({
      variables: { input: { title, fileName: uploaded.fileName, filePath: uploaded.filePath, fileType: uploaded.fileType, description: idDoc.type } },
    });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ أثناء حفظ المستند' : 'Error saving document'); return; }
    setIdDoc(d => ({ ...d, uploaded: true, filePath: uploaded.filePath }));
    toast.success(isAr ? 'تم إرسال وثيقتك، سيتم مراجعتها قريباً' : 'Document submitted, it will be reviewed shortly');
  };

  const handleDeleteBank = async (id: string) => {
    const { errors } = await deleteBank({ variables: { deleteBankId: id } });
    if (errors?.length) {
      toast.error(isAr ? 'حدث خطأ' : 'Error');
      return;
    }
    toast.success(isAr ? 'تم حذف الحساب' : 'Account removed');
    refetchBanks();
  };

  const tabs = [
    { id: 'profile',  label: content.dashboard.settings.tabs.profile,  icon: User },
    { id: 'wallet',   label: content.dashboard.settings.tabs.wallet,    icon: CreditCard },
    { id: 'password', label: content.dashboard.settings.tabs.password,  icon: Lock },
    { id: 'identity', label: isAr ? 'الهوية' : 'Identity',             icon: FileText },
  ];

  // Determine verification status
  const userStatus = userData?.getUserDetails?.status ?? '';
  const isVerified = userStatus === 'VERIFIED' || userStatus === 'verified';
  const isUnderReview = userStatus === 'UNDER_REVIEW' || userStatus === 'PENDING';
  const isUnverified = !isVerified && !isUnderReview;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title={content.dashboard.settings.title} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar tabs */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all mb-1', activeTab === tab.id ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50')}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">

            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold text-[#111827] mb-6 border-b border-gray-100 pb-4">
                  {content.dashboard.settings.sections.profile}
                </h3>

                {/* Unverified banner */}
                {isUnverified && (
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex gap-4 items-start">
                    <AlertTriangle size={24} className="text-amber-500 shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-800 mb-3">
                        {isAr
                          ? 'لم يتم توثيق حسابك بعد. قم برفع هويتك لتتمكن من الوصول إلى جميع خدمات جسور.'
                          : 'Your account hasn\'t been verified yet. Upload your ID to access all Jusoor services.'}
                      </p>
                      <button
                        onClick={() => setActiveTab('identity')}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-700 transition-colors"
                      >
                        {isAr ? 'رفع الهوية الآن' : 'Upload ID Now'}
                      </button>
                    </div>
                  </div>
                )}

                {userLoading ? (
                  <div className="space-y-6 animate-pulse">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 rounded-full bg-gray-200" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3" />
                          <div className="h-11 bg-gray-200 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 rounded-full bg-[#111827] text-white flex items-center justify-center text-3xl font-bold">
                        {profileForm.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      {/* Account verification status badge */}
                      {isVerified && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[#E6F3EF] text-[#008A66]">
                          <ShieldCheck size={16} />
                          {isAr ? 'موثق بالكامل' : 'Fully Verified'}
                        </div>
                      )}
                      {isUnderReview && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-50 text-amber-700">
                          <Clock size={16} />
                          {isAr ? 'قيد المراجعة' : 'Under Review'}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { key: 'name',   label: content.dashboard.settings.profile.name,   type: 'text'  },
                        { key: 'email',  label: content.dashboard.settings.profile.email,  type: 'email' },
                        { key: 'phone',  label: content.dashboard.settings.profile.phone,  type: 'tel'   },
                        { key: 'city',   label: content.dashboard.settings.profile.city,   type: 'text'  },
                        { key: 'region', label: content.dashboard.settings.profile.region, type: 'text'  },
                      ].map(f => (
                        <div key={f.key} className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">{f.label}</label>
                          <input
                            type={f.type}
                            value={(profileForm as any)[f.key]}
                            onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="bg-[#10B981] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#008A66] transition-colors disabled:opacity-60"
                      >
                        {savingProfile ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : content.dashboard.settings.profile.saveChanges}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Wallet Tab ── */}
            {activeTab === 'wallet' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold text-[#111827] mb-6 border-b border-gray-100 pb-4">
                  {content.dashboard.settings.wallet.title}
                </h3>

                {banksLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1,2].map(i => (
                      <div key={i} className="h-16 bg-gray-200 rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(banksData?.getUserBanks ?? []).map((b: any) => (
                      <div key={b.id} className="p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-[#111827]">{b.bankName}</p>
                          <p className="text-sm text-gray-500 mt-1">{b.iban || b.accountNumber}</p>
                          {b.isActive && (
                            <span className="text-xs text-[#10B981] font-bold">{isAr ? 'نشط' : 'Active'}</span>
                          )}
                        </div>
                        <button onClick={() => handleDeleteBank(b.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add bank form */}
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-base font-bold text-[#111827] mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-[#10B981]" />
                    {content.dashboard.settings.wallet.addAccount}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'bankName',      label: isAr ? 'اسم البنك' : 'Bank Name',       type: 'text', req: true  },
                      { key: 'accountTitle',  label: isAr ? 'اسم الحساب' : 'Account Title',   type: 'text', req: true  },
                      { key: 'accountNumber', label: isAr ? 'رقم الحساب' : 'Account Number',  type: 'text', req: true  },
                      { key: 'iban',          label: isAr ? 'رقم الآيبان' : 'IBAN',           type: 'text', req: false },
                    ].map(f => (
                      <div key={f.key} className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">{f.label}{f.req && <span className="text-red-500"> *</span>}</label>
                        <input
                          type={f.type}
                          value={(bankForm as any)[f.key]}
                          onChange={e => setBankForm(b => ({ ...b, [f.key]: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleAddBank}
                      disabled={addingBank}
                      className="bg-[#10B981] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#008A66] transition-colors disabled:opacity-60"
                    >
                      {addingBank ? (isAr ? 'جارٍ الإضافة...' : 'Adding...') : (isAr ? 'إضافة الحساب' : 'Add Account')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Password Tab ── */}
            {activeTab === 'password' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold text-[#111827] mb-6 border-b border-gray-100 pb-4">
                  {content.dashboard.settings.password.updatePassword}
                </h3>
                <div className="space-y-4 max-w-md">
                  {[
                    { key: 'current', label: content.dashboard.settings.password.currentPassword },
                    { key: 'new',     label: content.dashboard.settings.password.newPassword     },
                    { key: 'confirm', label: content.dashboard.settings.password.confirmPassword  },
                  ].map(f => (
                    <div key={f.key} className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">{f.label}</label>
                      <input
                        type="password"
                        value={(pwdForm as any)[f.key]}
                        onChange={e => setPwdForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                      />
                    </div>
                  ))}
                  <div className="pt-4">
                    <button
                      onClick={handleChangePassword}
                      disabled={savingPassword}
                      className="bg-[#111827] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors w-full disabled:opacity-60"
                    >
                      {savingPassword ? (isAr ? 'جارٍ التحديث...' : 'Updating...') : content.dashboard.settings.password.updatePassword}
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* ── Identity Documents Tab ── */}
            {activeTab === 'identity' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold text-[#111827] mb-2 border-b border-gray-100 pb-4">
                  {isAr ? 'وثائق الهوية' : 'Identity Documents'}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {isAr
                    ? 'يُرجى رفع صورة من الهوية الوطنية أو جواز السفر لإتمام التحقق من حسابك.'
                    : 'Please upload a copy of your National ID or Passport to complete account verification.'}
                </p>

                {/* Document Type Selector */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { value: 'national_id', labelAr: 'الهوية الوطنية', labelEn: 'National ID' },
                    { value: 'passport',    labelAr: 'جواز السفر',      labelEn: 'Passport'    },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setIdDoc(d => ({ ...d, type: opt.value, file: null, uploaded: false, filePath: null }))}
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-bold text-sm transition-all ${
                        idDoc.type === opt.value
                          ? 'border-[#10B981] bg-[#E6F3EF] text-[#004E39]'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <FileText size={18} />
                      {isAr ? opt.labelAr : opt.labelEn}
                    </button>
                  ))}
                </div>

                {/* Upload Area */}
                <div
                  onClick={() => document.getElementById('id-file-input')?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                    idDoc.uploaded
                      ? 'border-[#10B981] bg-[#E6F3EF]'
                      : 'border-gray-200 hover:border-[#10B981] hover:bg-[#f0fdf8]'
                  }`}
                >
                  <input
                    id="id-file-input"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0] ?? null;
                      setIdDoc(d => ({ ...d, file, uploaded: false, filePath: null }));
                    }}
                  />
                  {idDoc.uploaded ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 size={40} className="text-[#10B981]" />
                      <p className="font-bold text-[#004E39]">{isAr ? 'تم الرفع بنجاح' : 'Uploaded successfully'}</p>
                    </div>
                  ) : idDoc.file ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={40} className="text-[#10B981]" />
                      <p className="font-bold text-[#111827] text-sm">{idDoc.file.name}</p>
                      <p className="text-xs text-gray-400">{(idDoc.file.size / 1024).toFixed(0)} KB</p>
                      <p className="text-xs text-[#008A66] mt-1">{isAr ? 'اضغط لتغيير الملف' : 'Click to change file'}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <Upload size={24} className="text-gray-400" />
                      </div>
                      <p className="font-bold text-[#111827]">{isAr ? 'اضغط لرفع الملف' : 'Click to upload'}</p>
                      <p className="text-xs text-gray-400">{isAr ? 'PNG، JPG، أو PDF — بحد أقصى 10 ميغابايت' : 'PNG, JPG, or PDF — max 10 MB'}</p>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                {idDoc.file && !idDoc.uploaded && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleUploadId}
                      disabled={idUploading}
                      className="bg-[#10B981] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#008A66] transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                      {idUploading ? (
                        <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />{isAr ? 'جارٍ الرفع...' : 'Uploading...'}</>
                      ) : (
                        <><Upload size={18} />{isAr ? 'رفع المستند' : 'Upload Document'}</>
                      )}
                    </button>
                  </div>
                )}

                {/* Privacy note */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
                  <span className="text-amber-500 shrink-0 font-bold text-lg leading-none">ⓘ</span>
                  <p className="text-sm text-amber-700">
                    {isAr
                      ? 'تُستخدم هذه الوثائق لأغراض التحقق فقط، ولن تُشارك مع أي طرف ثالث.'
                      : 'These documents are used for verification purposes only and will not be shared with any third party.'}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
