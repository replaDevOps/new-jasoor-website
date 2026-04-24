// src/hooks/useVerificationGate.ts  (v2 — safe for rollout)
//
// CRITICAL CHANGE vs v1:
//   v1 returned 'UNVERIFIED' as a default whenever `data.getUserDetails.status`
//   was missing. That would have locked out every user on the platform if the
//   migration + GET_USER_DETAILS query update hadn't shipped first.
//
//   v2 uses a tri-state: 'UNKNOWN' while loading or when the backend hasn't
//   exposed the new enum yet. In UNKNOWN, the gate falls back to the legacy
//   boolean `isVerified` (if present) and treats absence of both as "do not
//   block" — so the UX cannot regress for already-working users. Block-by-
//   default lives on the SERVER (see verification.resolvers.ts).

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_USER_DETAILS } from '../graphql/queries/dashboard';
import { useApp } from '../context/AppContext';

export type VerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'UNKNOWN';

export type GatedAction =
  | 'MAKE_OFFER'
  | 'REQUEST_MEETING'
  | 'COUNTER_OFFER'
  | 'PROGRESS_DEAL'
  | 'UPLOAD_DOCUMENT'
  | 'PAY_COMMISSION';

interface GateResult {
  status: VerificationStatus;
  loading: boolean;
  /** True = FE may let the user attempt the action. Server still has final say. */
  allowed: (action: GatedAction) => boolean;
  reason: (action: GatedAction) => { ar: string; en: string } | null;
  needsUpload: boolean;
  pending: boolean;
  rejected: boolean;
  verified: boolean;
}

const SENSITIVE_ACTIONS: ReadonlySet<GatedAction> = new Set([
  'MAKE_OFFER',
  'REQUEST_MEETING',
  'COUNTER_OFFER',
  'PROGRESS_DEAL',
  'UPLOAD_DOCUMENT',
  'PAY_COMMISSION',
]);

/**
 * Resolve status from whichever shape the backend currently returns.
 * Priority: new enum `status` → legacy boolean `isVerified` → UNKNOWN.
 */
function resolveStatus(u: unknown): VerificationStatus {
  if (!u || typeof u !== 'object') return 'UNKNOWN';
  const raw = (u as Record<string, unknown>);
  const enumStatus = raw.status;
  if (
    enumStatus === 'UNVERIFIED' ||
    enumStatus === 'PENDING_VERIFICATION' ||
    enumStatus === 'VERIFIED' ||
    enumStatus === 'REJECTED'
  ) {
    return enumStatus;
  }
  if (typeof raw.isVerified === 'boolean') {
    return raw.isVerified ? 'VERIFIED' : 'UNVERIFIED';
  }
  return 'UNKNOWN';
}

export function useVerificationGate(): GateResult {
  const { userId } = useApp();

  const { data, loading } = useQuery(GET_USER_DETAILS, {
    variables: { id: userId },
    skip: !userId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  });

  const status = resolveStatus(data?.getUserDetails);

  return useMemo(() => {
    const pending = status === 'PENDING_VERIFICATION';
    const rejected = status === 'REJECTED';
    const verified = status === 'VERIFIED';
    const needsUpload = status === 'UNVERIFIED' || status === 'REJECTED';

    // FE permissiveness policy:
    //   VERIFIED  → allow
    //   UNKNOWN   → allow (server enforces)  ← prevents accidental lockout during rollout
    //   other     → block
    const allowed = (action: GatedAction) => {
      if (!SENSITIVE_ACTIONS.has(action)) return true;
      return verified || status === 'UNKNOWN';
    };

    const reason = (action: GatedAction) => {
      if (allowed(action)) return null;
      if (needsUpload)
        return {
          ar: 'يرجى رفع وثيقة الهوية من لوحة التحكم للمتابعة.',
          en: 'Upload your ID from the dashboard to continue.',
        };
      if (pending)
        return {
          ar: 'حسابك قيد مراجعة الإدارة. ستتمكن من المتابعة فور الاعتماد.',
          en: 'Your account is under admin review. You can continue once approved.',
        };
      return {
        ar: 'هذا الإجراء يتطلب حساباً موثقاً بالكامل.',
        en: 'This action requires a fully verified account.',
      };
    };

    return { status, loading, allowed, reason, needsUpload, pending, rejected, verified };
  }, [status, loading]);
}
