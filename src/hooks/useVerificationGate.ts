/**
 * useVerificationGate.ts — read-only gate for the current user's verification.
 *
 * IMPORTANT: This is UX only. The BACKEND must enforce the same gate in
 * resolvers (see `verification.resolvers.ts`). Hiding buttons here will not
 * stop an attacker hitting the mutation directly.
 *
 * Product states (in order of permission):
 *   UNVERIFIED           — account created, no document uploaded yet. Browsing only.
 *   PENDING_VERIFICATION — document uploaded, awaiting admin review. Browsing only.
 *   VERIFIED             — admin approved. Full transactional access.
 *   REJECTED             — admin rejected; can re-upload.
 *
 * The one trap from v1:
 *   If `GET_USER_DETAILS` does NOT yet select `status` (the migration hasn't
 *   run or the frontend hasn't been extended yet), the old hook defaulted to
 *   `UNVERIFIED` and locked EVERY user out of offers overnight.
 *
 *   This version adds an `UNKNOWN` state that falls back to the legacy
 *   `isVerified: boolean` field if present. Only once we have a real status
 *   string do we treat the absence of it as meaningful.
 */

import { useQuery } from '@apollo/client';
import { useApp } from '../context/AppContext';
import { GET_USER_DETAILS } from '../graphql/queries/dashboard';

export type VerificationStatus =
  | 'VERIFIED'
  | 'PENDING_VERIFICATION'
  | 'UNVERIFIED'
  | 'REJECTED'
  | 'UNKNOWN';

export interface VerificationGate {
  /** Normalised status. */
  status: VerificationStatus;
  /** True iff backend says this user can perform sensitive actions. */
  canTransact: boolean;
  /** True iff a document has been uploaded and is waiting on admin review. */
  isPending: boolean;
  /** True iff the user has never uploaded identity. */
  isUnverified: boolean;
  /** True iff admin rejected the last upload. */
  isRejected: boolean;
  /** True iff the user's full name/identity has been confirmed. */
  isVerified: boolean;
  /** True iff Apollo is still loading the status query. */
  loading: boolean;
  /** Admin-supplied rejection reason, when REJECTED. */
  rejectionNote: string | null;
  /** Raw user details payload for banner / settings rendering. */
  user: UserDetails | null;
}

interface UserDetails {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  status?: string | null;       // new model
  isVerified?: boolean | null;  // legacy boolean fallback
  verificationNote?: string | null;
  identityDocumentUrl?: string | null;
}

interface GetUserDetailsData {
  getUserDetails?: UserDetails | null;
}

function normaliseStatus(details: UserDetails | null | undefined): VerificationStatus {
  if (!details) return 'UNKNOWN';

  // 1. Explicit status wins.
  const raw = (details.status ?? '').toString().trim().toUpperCase();
  if (raw === 'VERIFIED') return 'VERIFIED';
  if (raw === 'PENDING_VERIFICATION' || raw === 'UNDER_REVIEW' || raw === 'PENDING') {
    return 'PENDING_VERIFICATION';
  }
  if (raw === 'REJECTED') return 'REJECTED';
  if (raw === 'UNVERIFIED' || raw === 'NEW') return 'UNVERIFIED';

  // 2. No explicit status field — fall back to legacy boolean.
  if (details.isVerified === true) return 'VERIFIED';
  if (details.isVerified === false) {
    // Legacy boolean explicitly set to false. If they've uploaded a doc but
    // haven't been approved, treat as pending. We can't tell reliably from
    // just a boolean, so we return UNKNOWN and let the caller decide.
    return 'UNKNOWN';
  }

  // 3. Status field absent AND boolean absent. Safer to return UNKNOWN than
  //    to lock every user out.
  return 'UNKNOWN';
}

export function useVerificationGate(): VerificationGate {
  const { userId } = useApp();

  const { data, loading } = useQuery<GetUserDetailsData>(GET_USER_DETAILS, {
    variables: { id: userId },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    skip: !userId,
  });

  const user = data?.getUserDetails ?? null;
  const status = normaliseStatus(user);

  return {
    status,
    user,
    loading,
    canTransact: status === 'VERIFIED',
    isPending: status === 'PENDING_VERIFICATION',
    isUnverified: status === 'UNVERIFIED',
    isRejected: status === 'REJECTED',
    isVerified: status === 'VERIFIED',
    rejectionNote: user?.verificationNote ?? null,
  };
}

/**
 * Helper for a UI site that conditionally disables a button. Keeps toast /
 * banner logic out of the hook itself.
 *
 *   const gate = useVerificationGate();
 *   const { disabled, reason } = gateButton(gate, isAr);
 *   <button disabled={disabled} title={reason}>Make offer</button>
 */
export function gateButton(
  gate: VerificationGate,
  isAr: boolean,
): { disabled: boolean; reason: string | null } {
  if (gate.loading || gate.status === 'UNKNOWN') {
    // Neither allow nor block while we don't know — keep UI stable.
    return { disabled: false, reason: null };
  }
  if (gate.canTransact) return { disabled: false, reason: null };

  if (gate.isPending) {
    return {
      disabled: true,
      reason: isAr
        ? 'حسابك قيد المراجعة. بعد الموافقة يمكنك إتمام العمليات.'
        : 'Your account is under review. You can transact once approved.',
    };
  }
  if (gate.isRejected) {
    return {
      disabled: true,
      reason: isAr
        ? 'تم رفض المستند. يرجى إعادة الرفع من الإعدادات.'
        : 'Your document was rejected. Please re-upload it from Settings.',
    };
  }
  return {
    disabled: true,
    reason: isAr
      ? 'يتطلب هذا الإجراء توثيق الهوية. ابدأ من الإعدادات.'
      : 'This action requires identity verification. Start it from Settings.',
  };
}
