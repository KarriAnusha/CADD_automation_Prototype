## Goal
Remove the login/signup wall so anyone landing on the app goes straight to the pipeline — no Auth page, no ProtectedRoute.

## Challenge
Almost every pipeline component (LigandManagement, ProteinSelection, DockingAnalysis, ADMETScreening, CompoundComparison, ResultsDashboard, the `cadd-agent` edge function) currently reads `user.id` from the session and writes it into rows. The database tables have RLS scoped to `auth.uid()`. If we simply strip auth, every DB read/write will fail with a permission error and the app will look broken.

## Approach
Keep a lightweight session under the hood using **Supabase anonymous sign-in**, but remove all user-facing auth UI. Each visitor gets an auto-provisioned anonymous user on first load, so RLS keeps working and every existing `user.id` reference keeps functioning without code changes in the pipeline components.

### Changes
1. **Enable anonymous sign-ins** on the backend auth config.
2. **`src/App.tsx`** — remove `ProtectedRoute` and the `/auth` route. Wrap the app in a small `AuthBootstrap` component that, on mount, checks for a session and calls `supabase.auth.signInAnonymously()` if none exists. Show a brief loading state until the session is ready, then render the app.
3. **Delete** `src/pages/Auth.tsx` and `src/components/ProtectedRoute.tsx`.
4. **Remove the sign-out button** (if present in `PipelineOverview` / header) since there's no longer a login concept — replace with nothing, or leave a "Reset session" action only if the user later asks.
5. Leave all pipeline components, edge functions, and RLS policies untouched — they continue to work against the anonymous user's `auth.uid()`.

### Trade-offs to know
- Each browser/device gets its own anonymous user, so **data is not shared across devices** and clearing browser storage creates a fresh empty account. That matches an "open project" feel.
- Existing accounts already in the DB stay intact but become unreachable from the UI (no sign-in form). If you'd rather **wipe RLS and make all data globally shared/public**, that's a different path — let me know and I'll revise.

## Out of scope
- Removing RLS or migrating existing data to a shared public dataset.
- Rebuilding a "profile" or "my history" concept.