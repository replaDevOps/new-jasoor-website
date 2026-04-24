// jasoor-admin-frontend-main / src/pages/settings/CommissionBracketsAdmin.tsx
// Admin surface for the existing tiered commission + versioning backend model.
// Reads/writes commission brackets. Respects versioning — historical deals must
// continue referencing the bracket version active at the time they were created.
//
// Backend assumptions (verify against actual schema):
//   query   getCommissionBrackets(version?: Int)      -> [CommissionBracket!]!
//   query   getActiveCommissionVersion                -> Int!
//   mutation createCommissionBracket(input)           -> CommissionBracket!
//   mutation updateCommissionBracket(id, input)       -> CommissionBracket!
//   mutation activateCommissionVersion(version: Int)  -> Int! (returns new active version)

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_BRACKETS = gql`
  query getCommissionBrackets($version: Int) {
    getCommissionBrackets(version: $version) {
      id
      minPrice
      maxPrice
      percentage
      fixedFee
      version
      active
    }
    getActiveCommissionVersion
  }
`;

const CREATE_BRACKET = gql`
  mutation createCommissionBracket($input: CreateCommissionBracketInput!) {
    createCommissionBracket(input: $input) { id version }
  }
`;

const UPDATE_BRACKET = gql`
  mutation updateCommissionBracket($id: ID!, $input: UpdateCommissionBracketInput!) {
    updateCommissionBracket(id: $id, input: $input) { id version }
  }
`;

const ACTIVATE_VERSION = gql`
  mutation activateCommissionVersion($version: Int!) {
    activateCommissionVersion(version: $version)
  }
`;

interface Bracket {
  id: string;
  minPrice: number;
  maxPrice: number | null;
  percentage: number;
  fixedFee: number;
  version: number;
  active: boolean;
}

const CommissionBracketsAdmin: React.FC<{ isAr?: boolean }> = ({ isAr = false }) => {
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>();
  const { data, loading, error, refetch } = useQuery(GET_BRACKETS, {
    variables: { version: selectedVersion },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });

  const [createBracket, { loading: creating }] = useMutation(CREATE_BRACKET);
  const [updateBracket, { loading: updating }] = useMutation(UPDATE_BRACKET);
  const [activateVersion, { loading: activating }] = useMutation(ACTIVATE_VERSION);

  const brackets: Bracket[] = data?.getCommissionBrackets ?? [];
  const activeVersion: number = data?.getActiveCommissionVersion ?? 0;

  const versions = useMemo(() => {
    const s = new Set<number>(brackets.map((b) => b.version));
    s.add(activeVersion);
    return Array.from(s).sort((a, b) => b - a);
  }, [brackets, activeVersion]);

  const handleCreate = async () => {
    await createBracket({
      variables: {
        input: { minPrice: 0, maxPrice: 100000, percentage: 2.5, fixedFee: 0 },
      },
      errorPolicy: 'all',
    });
    await refetch();
  };

  const handleSave = async (b: Bracket, patch: Partial<Bracket>) => {
    await updateBracket({
      variables: {
        id: b.id,
        input: {
          minPrice: patch.minPrice ?? b.minPrice,
          maxPrice: patch.maxPrice ?? b.maxPrice,
          percentage: patch.percentage ?? b.percentage,
          fixedFee: patch.fixedFee ?? b.fixedFee,
        },
      },
      errorPolicy: 'all',
    });
    await refetch();
  };

  const handleActivate = async (v: number) => {
    if (!window.confirm(
      isAr
        ? 'سيتم تفعيل هذه النسخة للعروض/الصفقات الجديدة. الصفقات السابقة لن تتأثر. متابعة؟'
        : 'This will activate the version for NEW offers/deals. Historical deals are unaffected. Continue?',
    )) return;
    await activateVersion({ variables: { version: v }, errorPolicy: 'all' });
    await refetch();
  };

  if (loading && !data) return <p className="p-6">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</p>;
  if (error && !data) return <p className="p-6 text-red-600">{error.message}</p>;

  return (
    <div className="p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#111827]">
          {isAr ? 'إدارة شرائح العمولة' : 'Commission brackets'}
        </h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">
            {isAr ? 'النسخة' : 'Version'}:
          </label>
          <select
            value={selectedVersion ?? activeVersion}
            onChange={(e) => setSelectedVersion(Number(e.target.value))}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
          >
            {versions.map((v) => (
              <option key={v} value={v}>
                v{v}{v === activeVersion ? ` (${isAr ? 'نشطة' : 'active'})` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="bg-[#008A66] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#007053] disabled:opacity-60"
          >
            {isAr ? 'شريحة جديدة' : 'New bracket'}
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-start">{isAr ? 'من' : 'From'}</th>
              <th className="px-4 py-3 text-start">{isAr ? 'إلى' : 'To'}</th>
              <th className="px-4 py-3 text-start">%</th>
              <th className="px-4 py-3 text-start">{isAr ? 'رسوم ثابتة' : 'Fixed fee'}</th>
              <th className="px-4 py-3 text-start">{isAr ? 'النسخة' : 'Version'}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {brackets.map((b) => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{b.minPrice.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {b.maxPrice === null ? (isAr ? 'بدون سقف' : 'No cap') : b.maxPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3">{b.percentage}%</td>
                <td className="px-4 py-3">{b.fixedFee.toLocaleString()}</td>
                <td className="px-4 py-3">v{b.version}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleSave(b, { percentage: b.percentage })}
                    disabled={updating}
                    className="text-[#008A66] font-bold hover:underline"
                  >
                    {isAr ? 'تعديل' : 'Edit'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleActivate(selectedVersion ?? activeVersion)}
          disabled={activating || (selectedVersion ?? activeVersion) === activeVersion}
          className="bg-[#0A1F13] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-black disabled:opacity-60"
        >
          {isAr ? 'تفعيل هذه النسخة' : 'Activate this version'}
        </button>
        <p className="text-xs text-gray-500">
          {isAr
            ? 'تنبيه: الصفقات السابقة تستخدم نسختها الأصلية ولن تتغير.'
            : 'Note: historical deals keep the bracket version they were created with.'}
        </p>
      </div>
    </div>
  );
};

export default CommissionBracketsAdmin;
