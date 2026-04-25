# INTEGRATION_DIFFS.md — Exact edits for existing files

The "new file" category is handled by `push-all.sh`. This document covers the
files that **already exist** and need small, surgical edits. Every change is
scoped and labelled; nothing is a full-file replacement. Apply with a normal
editor's find-and-replace.

All paths are relative to the frontend repo root unless noted.

---

## 1. `src/context/AppContext.tsx`

### Imports (add near the top, after React imports)

```ts
import { performLogout, LOGGED_OUT_EVENT } from '../utils/logout';
import { apolloClient } from '../config/apolloClient';
```

### Replace the body of `logout`

Find the existing `logout` function. It probably looks like one of these:

```ts
const logout = () => {
  setIsLoggedIn(false);
  setUserId(null);
  // (some localStorage or cookie manipulation here)
};
```

Replace the body with:

```ts
const logout = useCallback(async () => {
  // 1. Keep any app-specific cleanup you already had (e.g., reset wizard draft).
  //    Put those calls BEFORE performLogout so they can still read state.

  // 2. Terminate session on client + server.
  await performLogout({ client: apolloClient });

  // 3. Flip React state so guarded views re-render immediately.
  setIsLoggedIn(false);
  setUserId(null);
  // setUser?.(null);  // uncomment if the context carries a user object
}, []);
```

Do NOT keep a `window.location.reload()` line. Navigation is handled by the
event listener in `App.tsx` (below).

---

## 2. `src/app/App.tsx`

### Add the logout listener

Inside the component that owns the `view` state (the SPA router), add this
`useEffect`:

```tsx
useEffect(() => {
  const onLoggedOut = () => {
    setView('signin');
  };
  window.addEventListener('jusoor:auth:logged-out', onLoggedOut);
  return () => window.removeEventListener('jusoor:auth:logged-out', onLoggedOut);
}, []);
```

(If `LOGGED_OUT_EVENT` is imported from `utils/logout`, use that constant
instead of the string literal. Both work — the string is stable by design.)

---

## 3. `src/graphql/queries/dashboard.ts`

### Extend `GET_USER_DETAILS`

Find the `GET_USER_DETAILS` query. Add the four fields below to the selection
set. Keep every existing field.

```graphql
query GetUserDetails($id: ID!) {
  getUserDetails(id: $id) {
    id
    # ... existing fields ...
    firstName
    lastName
    status
    verificationNote
  }
}
```

The `isVerified` boolean stays if it's already there — `useVerificationGate`
uses it as a fallback when `status` is null.

---

## 4. `src/app/pages/dashboard/DashboardView.tsx`

### Imports

```ts
import { VerificationBanner } from '../../components/VerificationBanner';
import { StateBlock } from '../../components/StateBlock';
```

### Render the banner at the top of the overview

```tsx
return (
  <div className="space-y-5">
    <VerificationBanner onNavigate={onNavigate} />
    {/* existing stats grid */}
    {/* ... */}
  </div>
);
```

### Wrap each stat block in `<StateBlock>` (compact variant)

Replace every pattern like:

```tsx
<div className="stat">
  <span className="value">{data?.offersCount ?? '---'}</span>
</div>
```

With:

```tsx
<StateBlock
  compact
  loading={loading}
  error={error}
  isEmpty={!loading && data?.offersCount == null}
  emptyTitle={isAr ? 'لا توجد عروض' : 'No offers'}
>
  <div className="stat">
    <span className="value">{data?.offersCount ?? 0}</span>
  </div>
</StateBlock>
```

---

## 5. `src/app/pages/dashboard/OffersView.tsx`

### Imports

```ts
import { maskCounterparty } from '../../../utils/maskName';
import { useVerificationGate, gateButton } from '../../../hooks/useVerificationGate';
import { useApp } from '../../../context/AppContext';
```

### Mask counterparty name at every render site

Find places where the seller's or buyer's name is rendered, e.g.:

```tsx
<span>{offer.fromUser?.fullName}</span>
```

Replace with:

```tsx
<span>{maskCounterparty(offer.fromUser, { viewerId: userId })}</span>
```

Do the same for `offer.toUser`, `offer.seller`, `offer.buyer` — whichever
fields the query actually selects (if the backend already shipped
`privacy.resolvers.ts`, the server returns a `MaskedUser` and `displayName`
is ready to use directly — but going through `maskCounterparty` is still safe
because it will accept the `firstName` that comes back and pass through any
pre-masked value).

### Gate the Accept / Counter / Reject buttons

```tsx
const gate = useVerificationGate();
const { disabled, reason } = gateButton(gate, isAr);

<button
  disabled={disabled || actionLoading}
  onClick={() => acceptOffer(offer.id)}
  title={reason ?? undefined}
  className="..."
>
  {isAr ? 'قبول العرض' : 'Accept offer'}
</button>
```

Repeat for Counter and Meeting-request buttons.

---

## 6. `src/app/pages/dashboard/MeetingsView.tsx`

### Imports

```ts
import { maskCounterparty } from '../../../utils/maskName';
import { useVerificationGate, gateButton } from '../../../hooks/useVerificationGate';
```

### Mask counterparty at render sites

Replace every full-name render for `meeting.requestedBy` / `meeting.receiver`
with `maskCounterparty(meeting.requestedBy, { viewerId: userId })` etc.

### Gate "Request Meeting" button

```tsx
const gate = useVerificationGate();
const { disabled, reason } = gateButton(gate, isAr);

<button disabled={disabled} onClick={openMeetingModal} title={reason ?? undefined}>
  {isAr ? 'طلب اجتماع' : 'Request meeting'}
</button>
```

---

## 7. `src/app/pages/dashboard/DealsView.tsx`

### Imports

```ts
import { maskCounterparty } from '../../../utils/maskName';
import { DealLifecycle } from '../../components/DealLifecycle';
```

### Render the lifecycle rail for every deal card

Inside the card:

```tsx
<DealLifecycle deal={deal} />
```

### Mask buyer/seller name

```tsx
<span>{maskCounterparty(deal.buyer, { viewerId: userId })}</span>
<span>{maskCounterparty(deal.seller, { viewerId: userId })}</span>
```

---

## 8. `src/app/pages/dashboard/AlertsView.tsx`

### Imports

```ts
import { routeNotification, actionLabel } from '../../../utils/notificationRouter';
```

### Replace the click handler + CTA rendering

Find the place where each notification row is rendered. Replace:

```tsx
<li onClick={() => { /* dead-end or invented route */ }}>
  {n.title}
</li>
```

With:

```tsx
{notifications.map((n) => {
  const action = routeNotification(n);
  return (
    <li
      key={n.id}
      className="flex items-start justify-between gap-3 p-3 border-b border-gray-100"
    >
      <div>
        <p className="font-bold text-[#111827]">{n.title}</p>
        <p className="text-sm text-gray-600">{n.body}</p>
      </div>
      <button
        onClick={() => action.execute(onNavigate!)}
        className="shrink-0 bg-[#008A66] text-white text-sm font-bold px-3 py-2 rounded-xl hover:bg-[#007053]"
      >
        {actionLabel(action, isAr)}
      </button>
    </li>
  );
})}
```

---

## 9. `src/app/pages/auth/SignUp.tsx`

Goal: allow signup WITHOUT identity upload. The upload moves to Settings.

### Remove the identity-document step from the wizard

- Delete the step that renders the document uploader (usually step 3 of a
  3-step wizard).
- Renumber step indicators if needed.
- Remove `identityDocumentUrl` / `documentUrl` from the mutation variables
  passed to `CREATE_USER`.
- Remove the `required` flag from any remaining hidden inputs tied to that
  field.

### Do NOT remove the `firstName` / `lastName` inputs

The firstName/lastName split is part of the privacy model. If the form
currently has a single "Full Name" input, split it into two inputs. Keep the
existing input as a hidden fallback for one release so legacy validation
passes:

```tsx
<input name="firstName" required />
<input name="lastName" />
<input name="fullName" type="hidden" value={`${firstName} ${lastName}`.trim()} />
```

---

## 10. `src/utils/tokenManager.ts`

Append the `clearAllTokens()` implementation from
`utils/tokenManager-addendum.md`. Do not replace the file; append the new
export. See the addendum for the exact block and which internal fields to
reset.

---

## 11. Backend `src/graphql/resolvers/index.ts` (or equivalent)

### Merge the privacy field resolvers

```ts
import { privacyFieldResolvers } from './privacy.resolvers';
import merge from 'lodash/merge';

export const resolvers = merge({}, existingResolvers, privacyFieldResolvers);
```

### Wrap the 7 mutations with `gated(...)`

```ts
import { gated } from './verification.resolvers';
import {
  createOffer,
  counterOffer,
  updateOfferStatus,
  requestMeeting,
  updateMeeting,
  createDeal,
  createEnda,
} from './mutations';

export const Mutation = {
  ...existingMutations,
  createOffer:       gated(createOffer,       'create an offer'),
  counterOffer:      gated(counterOffer,      'make a counter-offer'),
  updateOfferStatus: gated(updateOfferStatus, 'accept or reject offers'),
  requestMeeting:    gated(requestMeeting,    'request a meeting'),
  updateMeeting:     gated(updateMeeting,     'update a meeting'),
  createDeal:        gated(createDeal,        'create a deal'),
  createEnda:        gated(createEnda,        'sign an NDA'),

  // Do NOT wrap these — they must stay open to unverified users:
  // login, signup, verifyEmailOtp, uploadIdentityDocument,
  // adminApproveIdentity, adminRejectIdentity, logout, saveBusiness
};
```

---

## Verification checklist

After applying every edit above, grep the repo for these regressions:

| Command | Expected |
|---|---|
| `grep -r "fullName" src/app/pages/dashboard/` | only appears via `maskCounterparty` or in self-view cards |
| `grep -r "window.location.reload" src/context/AppContext.tsx` | no hits |
| `grep -r "'---'" src/app/pages/dashboard/` | no hits (use `StateBlock` instead) |
| `grep -rn "nav\('payment'\)\|nav\('dealDetails'\)\|nav\('listingDetails'\)" src/` | no hits |
| `grep -rn "status.*VERIFIED" src/hooks/useVerificationGate.ts` | should exist |

Run the app locally, sign up without a document, and confirm:

1. Account created, dashboard shown.
2. `VerificationBanner` appears, state = UNVERIFIED.
3. Click "Start verification" → Settings opens to the identity section.
4. Upload document → banner flips to PENDING.
5. Admin approves → banner disappears, Make Offer button enabled.
6. Logout → header updates without a reload.
