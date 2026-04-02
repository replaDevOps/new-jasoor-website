import React, { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';
import { toast } from 'sonner';
import { User, CreditCard, Lock, Plus, Trash2 } from 'lucide-react';
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
} from '../../../graphql/mutations/dashboard';
import { SectionHeader } from './DashboardView';

export const SettingsView = () => {
  const { content, language, userId } = useApp();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState('profile');

  // P6-FIX R-04: real user data
  const { data: userData, loading: userLoading } = useQuery(GET_USER_DETAILS, {
    variables: { getUserDetailsId: userId },
    skip: !userId,
    errorPolicy: 'all',
  });

  const { data: banksData, loading: banksLoading, refetch: refetchBanks } = useQuery(GET_USER_BANKS, {
    errorPolicy: 'all',
  });

  const [updateUser,  { loading: savingProfile  }] = useMutation(UPDATE_USER,       { errorPolicy: 'all' });
  const [changePwd,   { loading: savingPassword }] = useMutation(CHANGE_PASSWORD,   { errorPolicy: 'all' });
  const [addBank,     { loading: addingBank     }] = useMutation(ADD_BANK,           { errorPolicy: 'all' });
  const [deleteBank                               ] = useMutation(DELETE_BANK,        { errorPolicy: 'all' });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '', email: '', phone: '', city: '', region: '',
  });

  // Password form state
  const [pwdForm, setPwdForm] = useState({
    current: '', new: '', confirm: '',
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
  ];

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

                {userLoading ? (
                  <div className="text-gray-400 text-center py-8">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
                ) : (
                  <>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 rounded-full bg-[#111827] text-white flex items-center justify-center text-3xl font-bold">
                        {profileForm.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
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
                  <div className="text-gray-400 text-center py-8">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
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

          </div>
        </div>
      </div>
    </div>
  );
};
