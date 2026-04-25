# Jusoor — Full System Fix Report

**Branch suggested:** `fix/dashboard-identity-deals-integration`
**Scope:** Dashboard system • User name privacy • Optional identity verification • Commission admin exposure • Offers/Meetings/Deals connectivity • Actionable notifications • Logout • Safety

---

## 1. SUMMARY

This iteration closes the four P0 issues from the v1 audit and the three P1 issues, and delivers the connective tissue (components, helpers, diffs) that turn the existing backend+frontend into one coherent transactional system. Nothing in the existing product model was removed; every change is additive or surgical.

The bundle has two layers:

1. **New files** — drop-in modules that don't depend on reading existing source. `push-all.sh` copies them into place.
2. **Integration diffs** — precise edits to existing files, listed in `INTEGRATION_DIFFS.md`. Each is a scoped find-and-replace, not a rewrite.

---

## 2. WHAT ALREADY EXISTED (and was reused)

- Apollo client + encrypted-cookie `tokenManager.ts` with auto-refresh service.
- Custom SPA router in `App.tsx` with view state machine (no React Router).
- Bilingual text pattern: `isAr ? '...' : '...'` via `useApp()`.
- Gregorian date formatter rule (`ar-SA-u-ca-gregory`, `en-GB`).
- The 4-step deal progression fields (`isDsaBuyer/Seller`, `isDocVedifiedBuyer/Seller`, `isCommissionVerified`, `isBuyerCompleted/Sellercompleted`).
- Notification polling (every 30s) + mark-as-read mutation.
- Meeting state machine (`PENDING → SCHEDULED → READY → COMPLETED`).
- `getUserDetails(id)` query returning status + identity fields (extended, not replaced).
- Tiered commission brackets + versioning at the backend level.

All of the above is preserved. No breaking changes outside the intentional privacy projection on counterparty objects.

---

## 3. CHANGES MADE

### Frontend (`new-jasoor-website-main`)

**New files**

| Path | Purpose |
|---|---|
| `src/utils/maskName.ts` | `maskCounterparty()` — UX-layer first-name + "***" masking. Self-view bypasses the mask. |
| `src/utils/logout.ts` | `performLogout({ client })` — stops Apollo, best-effort LOGOUT mutation, delegates cookie wipe to tokenManager, scoped localStorage/sessionStorage cleanup, dispatches `jusoor:auth:logged-out` event. |
| `src/utils/notificationRouter.ts` | `routeNotification(n)` — returns `{ label, execute(onNavigate), kind }`. Only routes to views the custom SPA router knows (`offers`, `meetings`, `deals`, `alerts`, `settings`, `details`). No invented views. |
| `src/utils/tokenManager-addendum.md` | Exact `clearAllTokens()` block to append to the existing tokenManager. |
| `src/hooks/useVerificationGate.ts` | Normalises `status` → `VERIFIED/PENDING_VERIFICATION/UNVERIFIED/REJECTED/UNKNOWN`. `UNKNOWN` falls back to legacy `isVerified` bool so users aren't locked out during migration. `gateButton()` helper for disabled + tooltip. |
| `src/app/components/VerificationBanner.tsx` | Dashboard banner for UNVERIFIED/PENDING/REJECTED. Routes to Settings → identity section. |
| `src/app/components/StateBlock.tsx` | Unified loading / empty / error / success wrapper. Replaces `"---"` blanks everywhere. |
| `src/app/components/DealLifecycle.tsx` | 4-stage horizontal rail (NDA → Docs → Commission → Complete). Reads only fields already selected by deal queries. |

**In-place edits** — documented in `INTEGRATION_DIFFS.md`, with exact find/replace snippets for:

| File | What changes |
|---|---|
| `src/context/AppContext.tsx` | `logout()` body → `performLogout({ client })` + state flips |
| `src/app/App.tsx` | add `jusoor:auth:logged-out` event listener → `setView('signin')` |
| `src/graphql/queries/dashboard.ts` | extend `GET_USER_DETAILS` to also select `firstName`, `lastName`, `status`, `verificationNote` |
| `src/app/pages/dashboard/DashboardView.tsx` | render `<VerificationBanner>` + wrap stats in `<StateBlock>` |
| `src/app/pages/dashboard/OffersView.tsx` | `maskCounterparty(...)` at render sites; gate Accept/Counter with `useVerificationGate()` |
| `src/app/pages/dashboard/MeetingsView.tsx` | mask counterparty; gate Request Meeting |
| `src/app/pages/dashboard/DealsView.tsx` | render `<DealLifecycle>`; mask counterparty |
| `src/app/pages/dashboard/AlertsView.tsx` | use `routeNotification(n)` for action buttons |
| `src/app/pages/auth/SignUp.tsx` | remove identity-document step; split fullName → firstName/lastName inputs with hidden fallback |
| `src/utils/tokenManager.ts` | append `clearAllTokens()` per addendum |

### Admin frontend (`jasoor-admin-frontend-main`)

**New file**

| Path | Purpose |
|---|---|
| `src/pages/settings/CommissionBracketsAdmin.tsx` | List brackets, add new bracket, toggle active, activate a different version. Warns that historical deals keep their original version. |

⚠️ Mutation names in that file (`getCommissionBrackets`, `createCommissionBracket`, `activateCommissionVersion`, ...) have NOT been verified against the backend schema. Before shipping, introspect the endpoint (command at the top of the file) and rename to match the real operations. The component is otherwise complete.

### Backend (`jasoor-backend-main`)

**New files**

| Path | Purpose |
|---|---|
| `schema/user-privacy.graphql` | Adds `firstName`, `lastName`, `status`, `verificationNote` to `User`. Adds `MaskedUser` type + `UserStatus` enum. Re-types counterparty fields on `Offer`/`Meeting`/`Deal`/`Notification`/`Business.owner` to `MaskedUser`. Adds `uploadIdentityDocument`, `adminApproveIdentity`, `adminRejectIdentity` mutations. |
| `src/graphql/resolvers/privacy.resolvers.ts` | `projectCounterparty(viewer, user)` — returns full User for admins & self, MaskedUser otherwise. Field-level resolvers for the 5 parent types. `loadUser(ctx, id)` is a shim to wire to the real data loader. |
| `src/graphql/resolvers/verification.resolvers.ts` | `requireVerified(ctx)` + `gated(resolver)` + `gateAll({...})`. Explicitly wraps the 7 transactional mutations and explicitly leaves login/signup/upload/admin mutations ungated. |
| `migrations/<timestamp>_user_privacy_and_verification.sql` | Transaction-wrapped. Adds columns with `ADD COLUMN IF NOT EXISTS`. Backfills names with the **correct** split (mononym → last_name = NULL). Backfills `status` from legacy `is_verified` + `identity_document_url`. Safety asserts: aborts if the v1 mononym bug reappears; warns if any VERIFIED user has NULL first_name. |

**In-place edit**

| File | Change |
|---|---|
| `src/graphql/resolvers/index.ts` (or equivalent composition file) | Deep-merge `privacyFieldResolvers` into resolver map. Wrap the 7 mutations with `gated(...)`. See `INTEGRATION_DIFFS.md` §11. |

---

## 4. MIGRATION / COMPATIBILITY NOTES

### `fullName` → `firstName` + `lastName`

- Schema keeps `fullName` as a computed field (server returns `first + ' ' + last` when both exist, otherwise falls back to the legacy stored value). Old clients don't break.
- Database: `first_name` and `last_name` are added as `ADD COLUMN IF NOT EXISTS`. The legacy `full_name` column is NOT dropped; a follow-up migration can drop it once every client ships the new fields.
- SignUp form is split into two inputs with a hidden `fullName` fallback so the `CREATE_USER` mutation keeps validating while the backend mutation input is migrated.

### Verification state standardisation

- New `status` column is text + CHECK constraint (easier to alter later than a Postgres enum).
- Old `isVerified` boolean stays. Server-computed boolean returns `status === 'VERIFIED'`.
- `useVerificationGate.ts` returns `UNKNOWN` when neither `status` nor `isVerified` is known — guarantees no user is locked out just because the query hasn't been extended yet.
- Mononym users (e.g., `"Yazid"`, `"عبدالله"`) migrate to `first_name = Yazid`, `last_name = NULL`. No data corruption.

### Verification permission model

- `UNVERIFIED` / `PENDING_VERIFICATION` / `REJECTED` → browsing + saving listings only.
- `VERIFIED` → full transactional access.
- Backend enforces via `gated(...)`. Frontend mirrors via `gateButton(...)` with tooltip explaining why the button is disabled. If a user bypasses the frontend, the server returns `VERIFICATION_REQUIRED`.

### Commission config exposure

- No schema change to commission tables. Admin UI just exposes what the backend already supports.
- All historical deals/offers reference the bracket version that was active when they were created (this must remain true in the resolver; nothing here touches it).
- `CommissionBracketsAdmin.tsx` uses provisional mutation names — must be verified against the backend before merge.

---

## 5. BUSINESS RULES ENFORCED

Server-side (authoritative):

- **Verification gate** — 7 transactional mutations throw `VERIFICATION_REQUIRED` when `ctx.user.status !== 'VERIFIED'` (admins bypass).
- **Counterparty privacy** — every counterparty field on `Offer`/`Meeting`/`Deal`/`Notification`/`Business.owner` returns a `MaskedUser` for non-admins & non-self; admins and self see the full record.
- **Auth required** — gating wrapper re-checks `ctx.user.id` before running.

Frontend (UX):

- **Disabled + tooltip** on transactional buttons when not verified.
- **Masked display** via `maskCounterparty(...)` at every render site. Self-view bypasses masking.
- **Single source of verification state** — every banner, button, badge reads from `useVerificationGate()`.
- **Scoped logout** — cookies + `jusoor:` prefix in localStorage/sessionStorage, no blind `.clear()`.
- **No dead-end notifications** — every notification kind routes to an existing view.

---

## 6. TESTING / VALIDATION

Because this bundle was produced in a sandbox without live access to the three repositories, validation is described as a manual plan. After the "in-place edits" are applied and the branch is pushed:

| Test | Expected |
|---|---|
| Signup without identity | Account created, token issued, dashboard renders. Banner = UNVERIFIED. |
| Click "Start verification" | Navigates to Settings → identity section. Upload file → banner = PENDING. |
| Admin opens review queue | Sees the submitted document, approve → user dashboard banner disappears. Reject with reason → user sees REJECTED banner with note. |
| Unverified user tries Make Offer via GraphQL directly | Server responds `VERIFICATION_REQUIRED`. Frontend button was disabled with tooltip. |
| Verified user full lifecycle | Make offer → seller accepts → NDA signed → docs verified → commission paid → deal completed. `<DealLifecycle>` ticks each stage. |
| Masked name check | Counterparty shows "Yazid***". Open DevTools → Network → GQL response shows `displayName: "Yazid***"`, no `lastName`/`email` exposed. |
| Logout from user menu | Cookies gone. `localStorage` `jusoor:` keys gone. Header updates to signed-out state WITHOUT page reload. Apollo doesn't trigger a refresh-cascade. |
| Notifications click-through | Each notification type routes to the correct dashboard tab — no dead-end clicks, no blank pages. |
| Mononym user migration | Manually insert `INSERT INTO users(full_name) VALUES('Yazid')`. Run migration. Verify `first_name='Yazid'`, `last_name=NULL`. Re-running migration does not duplicate the insert or corrupt the row. |
| Commission brackets admin | Open admin settings → brackets tab. See current active version. Create a new bracket. Activate next version. Confirm old deals still reflect their original bracket (server rule — not tested by this UI). |

Automated tests are NOT included in this bundle. Adding Jest/Vitest coverage for `maskName`, `useVerificationGate`, `routeNotification`, and `projectCounterparty` is low-hanging fruit for a follow-up PR.

---

## 7. GITHUB DETAILS

| Item | Value |
|---|---|
| Branch | `fix/dashboard-identity-deals-integration` |
| Base | `main` |
| PR title (suggested) | `Full System Fix – Dashboard, Identity, Privacy, Deals Integration` |

Suggested commit breakdown:

- `feat(frontend): add optional identity verification flow from dashboard`
- `feat(frontend): add firstName/lastName and masked counterparty display`
- `fix(frontend): clear auth state properly on logout`
- `feat(frontend): actionable notifications and deal lifecycle rail`
- `feat(admin): expose commission brackets`
- `feat(backend): server-side counterparty privacy + verification gating`
- `chore(backend): user_privacy_and_verification migration`

The automated push is NOT performed by this bundle — the shell is sandboxed and has no GitHub credentials. Run `push-all.sh` against the actual cloned repos to get the new-file commits. The in-place edits still need to be committed by hand (or by a follow-up run with repo access).

---

## 8. BLOCKERS / RISKS

1. **Commission mutation names are unverified.** `CommissionBracketsAdmin.tsx` will throw "Cannot query field" until renamed to match the real schema. Verify via introspection first.
2. **Counterparty field names assumed.** `privacy.resolvers.ts` assumes `fromUser/toUser`, `requestedBy/receiver`, `buyer/seller`, `actorUser`. If the real schema uses different names, rename the keys in `privacyFieldResolvers` and the FK lookups inside each field resolver.
3. **`loadUser()` is a shim.** The function needs wiring to the real data loader (DataLoader, Prisma, TypeORM, raw SQL) before privacy resolvers will return useful data on the four parent types.
4. **In-place edits not applied.** `push-all.sh` only copies new files. The 11 surgical edits in `INTEGRATION_DIFFS.md` must be applied manually (or in a follow-up session with live repo access).
5. **No automated tests.** A manual test plan is included; adding Jest/Vitest covers for the pure helpers is a cheap follow-up.
6. **Nafath integration.** Not addressed by this bundle. If the current UI shows a Nafath button that is unimplemented, hide it behind a `VITE_ENABLE_NAFATH` feature flag (default off) until real integration exists.
7. **`full_name` / `is_verified` columns not dropped.** Intentional — they stay until every client ships the new model. Drop in a separate migration after a full release cycle.
