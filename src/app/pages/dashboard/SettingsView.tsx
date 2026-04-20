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

  const { data: userData, loading: userLoading, refetch: refetchUser } = useQuery(GET_USER_DETAILS, {
    variables: { getUserDetailsId: userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
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

  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', city: '', region: '' });
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [idDoc, setIdDoc] = useState({ file: null, type: 'national_id', uploaded: false, filePath: null });
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountTitle: '', iban: '' });

  useEffect(() => {
    const u = userData?.getUserDetails;
    if (u) {
      setProfileForm({ name: u.name ?? '', email: u.email ?? '', phone: u.phone ?? '', city: u.city ?? '', region: u.district ?? '' });
    }
  }, [userData]);

  const handleSaveProfile = async () => {
    const { errors } = await updateUser({ variables: { input: { name: profileForm.name, email: profileForm.email, phone: profileForm.phone, city: profileForm.city, district: profileForm.region } } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ أثناء الحفظ' : 'Error saving changes'); return; }
    toast.success(isAr ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
  };

  const handleChangePassword = async () => {
    if (!pwdForm.current || !pwdForm.new) { toast.error(isAr ? 'يرجى تعبئة جميع الحقول' : 'Please fill all fields'); return; }
    if (pwdForm.new !== pwdForm.confirm) { toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'); return; }
    const { errors } = await changePwd({ variables: { adminChangePasswordId: userId, oldPassword: pwdForm.current, newPassword: pwdForm.new } });
    if (errors?.length) { toast.error(isAr ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect'); return; }
    toast.success(isAr ? 'تم تغيير كلمة المرور' : 'Password updated successfully');
    setPwdForm({ current: '', new: '', confirm: '' });
  };

  const handleAddBank = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountTitle) { toast.error(isAr ? 'يرجى تعبئة الحقول المطلوبة' : 'Please fill required fields'); return; }
    const { errors } = await addBank({ variables: { input: { bankName: bankForm.bankName, accountNumber: bankForm.accountNumber, accountTitle: bankForm.accountTitle, iban: bankForm.iban } } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error adding bank'); return; }
    toast.success(isAr ? 'تم إضافة الحساب المصرفي' : 'Bank account added');
    setBankForm({ bankName: '', accountNumber: '', accountTitle: '', iban: '' });
    refetchBanks();
  };

  const handleUploadId = async () => {
    if (!idDoc.file) return;
    const title = idDoc.type === 'passport' ? (isAr ? 'جواز السفر' : 'Passport') : (isAr ? 'الهوية الوطنية' : 'National ID');
    const uploaded = await uploadFile(idDoc.file, title);
    if (!uploaded) { toast.error(isAr ? 'فشل رفع الملف' : 'Upload failed'); return; }
    const { errors } = await uploadIdentityDocument({ variables: { input: { title, fileName: uploaded.fileName, filePath: uploaded.filePath, fileType: uploaded.fileType, description: idDoc.type } } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ أثناء حفظ المستند' : 'Error saving document'); return; }
    setIdDoc(d => ({ ...d, uploaded: true, filePath: uploaded.filePath }));
    toast.success(isAr ? 'تم إرسال وثيقتك، سيتم مراجعتها قريباً' : 'Document submitted, it will be reviewed shortly');
    await refetchUser();
  };

  const handleDeleteBank = async (id) => {
    const { errors } = await deleteBank({ variables: { deleteBankId: id } });
    if (errors?.length) { toast.error(isAr ? 'حدث خطأ' : 'Error'); return; }
    toast.success(isAr ? 'تم حذف الحساب' : 'Account removed');
    refetchBanks();
  };

  const tabs = [
    { id: 'profile',  label: 'Profile', icon: User },
    { id: 'wallet',   label: 'Wallet',  icon: CreditCard },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'identity', label: isAr ? 'الهوية' : 'Identity', icon: FileText },
  ];

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

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold text-[#111827] mb-6 border-b border-gray-100 pb-4">
                  {content.dashboard.settings.sections.profile}
                </h3>

                {isUnverified && (
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex gap-4 items-start">
                    <AlertTriangle size={24} className="text-amber-500 shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-800 mb-3">
                        {isAr ? 'لم يتم توثيق حسابك بعد. قم برفع هويتك لتتمكن من الوصول إلى جميع خدمات جسور.' : "Your account hasn't been verified yet. Upload your ID to access all Jusoor services."}
                      </p>
                      <button onClick={() => setActiveTab('identity')} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-700 transition-colors">
                        {isAr ? 'رفع الهوية الآن' : 'Upload ID Now'}
                      </button>
                    </div>
                  </div>
                )}

                {userLoading ? (
                  <div className="space-y-6 animate-pulse">
                    <div className="flex items-center gap-6 mb-8"><div className="w-24 h-24 rounded-full bg-gray-200" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1,2,3,4,5].map(i => (<div key={i} className="space-y-2"><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-11 bg-gray-200 rounded-xl" /></div>))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 rounded-full bg-[#111827] text-white flex items-center justify-center text-3xl font-bold">
                        {profileForm.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      {isVerified && (<div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[#E6F3EF] text-[#008A66]"><ShieldCheck size={16} />{isAr ? 'موثق بالكامل' : 'Fully Verified'}</div>)}
                      {isUnderReview && (<div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-50 text-amber-700"><Clock size={16} />{isAr ? 'قيد المراجعة' : 'Under Review'}</div>)}
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
                          <input type={f.type} value={profileForm[f.key]} onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]" />
                        </div>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                      <button onClick={handleSaveProfile} disabled={savingProfile} className="bg-[#10B981] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#008A66] transition-colors disabled:opacity-60">
                        {savingProfile ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : content.dashboard.settings.profile.saveChanges}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold text-[#111827] mb-6 border-b border-gray-100 pb-4">{content.dashboard.settings.wallet.title}</h3>
                {banksLoading ? (
                  <div className="space-y-3 animate-pulse">{[1,2].map(i => (<div key={i} className="h-16 bg-gray-200 rounded-2xl" />))}</div>
                ) : (
                  <div className="space-y-4">
                    {(banksData?.getUserBanks ?? []).map((b) => (
                      <div key={b.id} className="p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-[#111827]">{b.bankName}</p>
                          <p className="text-sm text-gray-500 mt-1">{b.iban || b.accountNumber}</p>
                          {b.isActive && (<span className="text-xs text-[#10B981] font-bold">{isAr ? 'نشط' : 'Active'}</span>)}
                        </div>
                        <button onClick={() => handleDeleteBank(b.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-base font-bold text-[#111827] mb-4 flex items-center gap-2"><Plus size={18} className="text-[#10B981]" />{content.dashboard.settings.wallet.addAccount}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'bankName',      label: isAr ? 'اسم البنك' : 'Bank Name',      req: true },
                      { key: 'accountNumber', label: isAr ? 'رقم الحساب' : 'Account Number', req: true },
                      { key: 'accountTitle',  label: isAr ? 'اسم الحساب' : 'Account Title',  req: true },
                      { key: 'iban',          label: isAr ? 'رقم الآيبان' : 'IBAN',           req: false },
                    ].map(f => (
                      <div key={f.key} className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">{f.label}{f.req && <span className="text-red-500 ml-1">*</span>}</label>
                        <input value={bankForm[f.key]} onChange={e => setBankForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] text-sm" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <button onClick={handleAddBank} disabled={addingBank} className="bg-[#10B981] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#008A66] transition-colors disabled:opacity-60">
                      {addingBank ? (isAr ? 'جارٍ...' : 'Adding...') : content.dashboard.settings.wallet.addAccount}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold text-[#111827] mb-6 border-b border-gray-100 pb-4">{content.dashboard.settings.sections.password}</h3>
                <div className="space-y-4">
                  {[
                    { key: 'current', label: content.dashboard.settings.password.current, type: 'password' },
                    { key: 'new',     label: content.dashboard.settings.password.new,     type: 'password' },
                    { key: 'confirm', label: content.dashboard.settings.password.confirm, type: 'password' },
                  ].map(f => (
                    <div key={f.key} className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">{f.label}</label>
                      <input type={f.type} value={pwdForm[f.key]} onChange={e => setPwdForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]" />
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button onClick={handleChangePassword} disabled={savingPassword} className="bg-[#10B981] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#008A66] transition-colors disabled:opacity-60">
                    {savingPassword ? (isAr ? 'جارٍ...' : 'Saving...') : content.dashboard.settings.password.change}
                  </button>
                </div>
              </div>
            )}

            {/* Identity Tab */}
            {activeTab === 'identity' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold text-[#111827] mb-6 border-b border-gray-100 pb-4">
                  {isAr ? 'التحقق من الهوية' : 'Identity Verification'}
                </h3>

                {/* Verification status banner */}
                {isVerified && (
                  <div className="bg-[#E6F3EF] border border-[#10B981]/30 rounded-2xl p-4 flex items-center gap-4">
                    <ShieldCheck size={24} className="text-[#008A66]" />
                    <div>
                      <p className="font-bold text-[#008A66]">{isAr ? 'تم التحقق من حسابك بنجاح' : 'Your account has been verified'}</p>
                      <p className="text-sm text-[#008A66]/70 mt-0.5">{isAr ? 'يمكنك الآن الوصول إلى جميع خدمات جسور' : 'You now have full access to all Jusoor services'}</p>
                    </div>
                  </div>
                )}
                {isUnderReview && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
                    <Clock size={24} className="text-amber-500" />
                    <div>
                      <p className="font-bold text-amber-800">{isAr ? 'وثائقك قيد المراجعة' : 'Your documents are under review'}</p>
                      <p className="text-sm text-amber-600 mt-0.5">{isAr ? 'سيتم إخطارك بمجرد الانتهاء من المراجعة' : 'You will be notified once the review is complete'}</p>
                    </div>
                  </div>
                )}

                {/* Document type selector */}
                {!isVerified && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">{isAr ? 'نوع الوثيقة' : 'Document Type'}</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'national_id', label: isAr ? 'هوية وطنية' : 'National ID' },
                          { value: 'passport',    label: isAr ? 'جواز سفر' : 'Passport' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setIdDoc(d => ({ ...d, type: opt.value }))}
                            className={cn('p-3 rounded-xl border-2 font-bold text-sm transition-all', idDoc.type === opt.value ? 'border-[#008A66] bg-[#E6F3EF] text-[#008A66]' : 'border-gray-200 text-gray-500 hover:border-gray-300')}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">{isAr ? 'رفع الملف' : 'Upload File'}</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#008A66]/50 transition-colors">
                        <input type="file" id="idFileInput" accept="image/*,.pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setIdDoc(d => ({ ...d, file: f })); }} />
                        <label htmlFor="idFileInput" className="cursor-pointer flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-[#E6F3EF] flex items-center justify-center">
                            <Upload size={24} className="text-[#008A66]" />
                          </div>
                          <div>
                            <p className="font-bold text-[#111827] text-sm">{idDoc.file ? idDoc.file.name : (isAr ? 'اضغط للرفع أو سحب وإفلات' : 'Click to upload or drag and drop')}</p>
                            <p className="text-xs text-gray-400 mt-1">{isAr ? 'PNG, JPG, PDF حتى 10MB' : 'PNG, JPG, PDF up to 10MB'}</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleUploadId}
                        disabled={!idDoc.file || idUploading}
                        className="bg-[#008A66] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#007053] transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {idUploading ? (<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{isAr ? 'جارٍ الرفع...' : 'Uploading...'}</>) : (<><Upload size={16} />{isAr ? 'إرسال الوثيقة' : 'Submit Document'}</>)}
                      </button>
                    </div>
                  </div>
                )}

                {/* Uploaded Documents List */}
                {(() => {
                  const docs = userData?.getUserDetails?.documents ?? [];
                  if (docs.length === 0) return null;
                  return (
                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-base font-bold text-[#111827] mb-3 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-[#10B981]" />
                        {isAr ? 'الوثائق المرفوعة' : 'Uploaded Documents'}
                      </h4>
                      <div className="space-y-2">
                        {docs.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                            <div className="flex items-center gap-3">
                              <FileText size={18} className="text-[#008A66]" />
                              <div>
                                <p className="text-sm font-bold text-[#111827]">{doc.title || doc.fileName}</p>
                                <p className="text-xs text-gray-400">{doc.description === 'passport' ? (isAr ? 'جواز سفر' : 'Passport') : (isAr ? 'هوية وطنية' : 'National ID')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isVerified ? (
                                <span className="bg-[#E6F3EF] text-[#008A66] text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={12} />{isAr ? 'موثق' : 'Verified'}</span>
                              ) : isUnderReview ? (
                                <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><Clock size={12} />{isAr ? 'قيد المراجعة' : 'Under Review'}</span>
                              ) : (
                                <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded-full">{isAr ? 'مرفوع' : 'Submitted'}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
