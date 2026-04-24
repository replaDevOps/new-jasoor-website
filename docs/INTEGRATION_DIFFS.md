# Integration Diffs — v2 wiring

These are the specific edits to existing files. Without these, the new
components are dead code.

## 1. `src/context/AppContext.tsx`

```tsx
// ADD to imports
import { useApolloClient, useMutation } from '@apollo/client';
import { performLogout } from '../utils/logout';
import { LOGOUT } from '../graphql/mutations/auth';

// INSIDE AppProvider, AFTER existing state hooks
const apolloClient = useApolloClient();
const [logoutMutation] = useMutation(LOGOUT, { errorPolicy: 'all' });

// REPLACE existing logout() body with:
const logout = useCallback(async () => {
  setIsLoggedIn(false);
  setUserId(null);
  await performLogout({
    apolloClient,
    serverLogout: () => logoutMutation(),
    redirect: () => window.dispatchEvent(new CustomEvent('jusoor:auth:logged-out')),
  });
}, [apolloClient, logoutMutation]);
```

## 2. `src/app/App.tsx`

```tsx
// ADD near the top of the component, alongside existing useEffects
useEffect(() => {
  const onLogout = () => setView('signin');
  window.addEventListener('jusoor:auth:logged-out', onLogout);
  return () => window.removeEventListener('jusoor:auth:logged-out', onLogout);
}, []);
```

## 3. `src/graphql/queries/dashboard.ts`

Extend `GET_USER_DETAILS` to select the new fields (fall back to legacy
`isVerified` boolean for rollout).

```ts
export const GET_USER_DETAILS = gql`
  query getUserDetails($id: ID!) {
    getUserDetails(id: $id) {
      id
      firstName           # new
      lastName            # new
      fullName            # legacy — keep for transition
      email
      phone
      status              # new enum
      verificationNote    # new
      submittedAt         # new
      reviewedAt          # new
      isVerified          # legacy — drop after migration confirmed
    }
  }
`;
```

## 4. `src/app/pages/dashboard/DashboardView.tsx`

```tsx
import VerificationBanner from '../../components/VerificationBanner';
import StateBlock from '../../components/StateBlock';

// In the JSX, as the first child of the content area:
<VerificationBanner onNavigate={onNavigate} />

// Wrap each stats card / notifications list:
<StateBlock
  loading={loading}
  error={error}
  isEmpty={!items?.length}
  emptyLabel={{ ar: 'لا توجد عروض بعد', en: 'No offers yet' }}
  emptyCta={{
    ar: 'تصفح الفرص', en: 'Browse opportunities',
    onClick: () => onNavigate?.('browse'),
  }}
  onRetry={() => refetch()}
>
  {/* existing cards */}
</StateBlock>
```

## 5. `src/app/pages/dashboard/OffersView.tsx`

```tsx
import { maskCounterparty } from '../../../utils/maskName';
import { useVerificationGate } from '../../../hooks/useVerificationGate';

const { allowed, reason } = useVerificationGate();

// Replace counterparty name renders:
// OLD:  {offer.fromUser?.fullName}
// NEW:
{maskCounterparty(offer.fromUser, isAr)}   // on received-offers tab
{maskCounterparty(offer.toUser,   isAr)}   // on sent-offers tab

// If field name differs per API (check with read_page on Chrome first):
//   try `offer.buyer` / `offer.seller` and pick the one that is NOT the
//   current user.

// Gate the "Counter offer" and "Accept" buttons:
const gate = (action: 'COUNTER_OFFER') => {
  if (allowed(action)) return true;
  const r = reason(action)!;
  toast.error(isAr ? r.ar : r.en);
  return false;
};

<button onClick={() => gate('COUNTER_OFFER') && openCounterModal()}>
  {isAr ? 'عرض مضاد' : 'Counter'}
</button>
```

## 6. `src/app/pages/dashboard/MeetingsView.tsx`

```tsx
import { maskCounterparty } from '../../../utils/maskName';

// On the sent-requests tab:
{maskCounterparty(meeting.receiver, isAr)}
// On the received-requests tab:
{maskCounterparty(meeting.requester, isAr)}
// Fall back to `meeting.fromUser`/`meeting.toUser` if the resolver uses those.
```

## 7. `src/app/pages/dashboard/DealsView.tsx`

```tsx
import { maskCounterparty } from '../../../utils/maskName';
import DealLifecycle from '../../components/DealLifecycle';

// Inside each deal card:
<DealLifecycle deal={deal} compact />

// Counterparty:
const isBuyer = userId === deal.buyer?.id;
const counterparty = isBuyer ? deal.seller : deal.buyer;
<p>{maskCounterparty(counterparty, isAr)}</p>
```

## 8. `src/app/pages/dashboard/AlertsView.tsx`

```tsx
import { routeNotification } from '../../../utils/notificationRouter';

// For each notification row:
const target = routeNotification(n);
<button
  onClick={() => onNavigate?.(target.view, target.id)}
  className="bg-[#008A66] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#007053]"
>
  {isAr ? target.label.ar : target.label.en}
</button>
```

## 9. `src/app/pages/auth/SignUp.tsx`

Remove the identity-document upload step from signup. Leave registration
working with name + email + password + OTP only. Identity upload happens
later via `SettingsView → Identity`.

If the existing `CREATE_USER` mutation input still requires identity fields,
coordinate with backend: either make those fields optional in the input, or
send placeholder/null values and let the resolver skip them.

## 10. `jasoor-backend` resolvers index

```ts
import { privacyFieldResolvers } from './resolvers/privacy.resolvers';
import { gated, identityMutations } from './resolvers/verification.resolvers';

// Merge privacy projections on top of existing type resolvers.
const resolvers = merge(existingResolvers, privacyFieldResolvers, {
  Mutation: {
    ...existingResolvers.Mutation,
    createOffer:       gated(existingResolvers.Mutation.createOffer),
    counterOffer:      gated(existingResolvers.Mutation.counterOffer),
    updateOfferStatus: gated(existingResolvers.Mutation.updateOfferStatus),
    requestMeeting:    gated(existingResolvers.Mutation.requestMeeting),
    updateMeeting:     gated(existingResolvers.Mutation.updateMeeting),
    createDeal:        gated(existingResolvers.Mutation.createDeal),
    createEnda:        gated(existingResolvers.Mutation.createEnda),
    ...identityMutations,
  },
});
```

## 11. `jasoor-admin-frontend` — verify commission mutation names

Before shipping `CommissionBracketsAdmin.tsx`, confirm the real operation
names by reading `jasoor-backend/schema/*.graphql` (or running an
introspection query). Replace in the `gql` templates if they differ from:

- `getCommissionBrackets`
- `getActiveCommissionVersion`
- `createCommissionBracket`
- `updateCommissionBracket`
- `activateCommissionVersion`

If any differ, the UI will throw `Cannot query field` errors until renamed.
