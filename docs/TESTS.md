# Test Matrix -- Bois & Bocage App

Complete test matrix covering 90 tests across 6 categories. Generated from the security and code audit dated 2026-02-11.

## Recommended Stack

| Tool | Role | Package |
|------|------|---------|
| **Vitest** | Unit + integration test runner | `vitest` |
| **React Testing Library** | Component rendering + DOM queries | `@testing-library/react` |
| **jest-dom** | DOM assertion matchers | `@testing-library/jest-dom` |
| **user-event** | Simulated user interactions | `@testing-library/user-event` |
| **MSW** | API mocking (Supabase PostgREST) | `msw` |
| **Playwright** | End-to-end browser tests | `@playwright/test` |
| **happy-dom** | Lightweight DOM for Vitest | `happy-dom` |

### Installation

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event msw happy-dom @playwright/test
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

Add `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

---

## Summary

| Category | Count | P0 | P1 | P2 | P3 |
|----------|-------|----|----|----|-----|
| Auth | 8 | 3 | 3 | 2 | 0 |
| CRUD | 14 | 4 | 5 | 3 | 2 |
| RLS | 8 | 4 | 3 | 1 | 0 |
| UI | 28 | 2 | 10 | 12 | 4 |
| Performance | 5 | 1 | 2 | 2 | 0 |
| Error Handling | 13 | 2 | 5 | 4 | 2 |
| **Total** | **90** | **16** | **28** | **24** | **8** |

**Priority definitions**: P0 = blocker (security, data loss); P1 = critical path; P2 = important but non-blocking; P3 = nice to have.

---

## Category 1: Auth (8 tests)

### T-001 -- Login with valid credentials

- **Priority**: P0
- **Type**: integration
- **Description**: Verify that a user can log in with correct email and password.
- **Preconditions**: MSW intercepts Supabase Auth endpoint. Mock returns a valid session with JWT.
- **Steps**:
  1. Render `<App />` (no session in state).
  2. Verify the Login form is displayed.
  3. Type `demo@bois-bocage.fr` in the email field.
  4. Type a password in the password field.
  5. Click "Se connecter".
- **Expected Result**: `signInWithPassword` is called with the entered credentials. After the mock resolves, the Login form is replaced by the authenticated Layout with Dashboard.

### T-002 -- Login with invalid credentials

- **Priority**: P0
- **Type**: integration
- **Description**: Verify that incorrect credentials show an error message.
- **Preconditions**: MSW returns an `AuthError` for the Supabase Auth endpoint.
- **Steps**:
  1. Render `<App />`.
  2. Enter invalid email/password.
  3. Click "Se connecter".
- **Expected Result**: The text "Email ou mot de passe incorrect" is displayed within the form. The Login form remains visible. No navigation occurs.

### T-003 -- Session persistence on reload

- **Priority**: P0
- **Type**: integration
- **Description**: Verify that an existing session is restored from localStorage on app mount.
- **Preconditions**: MSW mocks `onAuthStateChange` to fire with an existing session.
- **Steps**:
  1. Set up mock to emit `SIGNED_IN` event with a valid session.
  2. Render `<App />`.
- **Expected Result**: The loading spinner ("Chargement...") appears briefly, then the authenticated Layout is rendered. The Login form is never shown.

### T-004 -- Sign out clears session

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that clicking "Deconnexion" signs the user out.
- **Preconditions**: App rendered in authenticated state. MSW mocks `signOut` to succeed.
- **Steps**:
  1. Render `<App />` in authenticated state.
  2. Click the "Deconnexion" button in the header.
- **Expected Result**: `supabase.auth.signOut()` is called. After the mock resolves, the Login form is displayed.

### T-005 -- Auth loading state

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that the app shows a loading indicator while auth state is being determined.
- **Preconditions**: MSW mocks `onAuthStateChange` with a delayed callback.
- **Steps**:
  1. Render `<App />` with `onAuthStateChange` not yet firing.
- **Expected Result**: The text "Chargement..." is visible. Neither Login nor Layout is rendered.

### T-006 -- Auth state change listener cleanup

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that the `onAuthStateChange` subscription is unsubscribed on unmount.
- **Preconditions**: Spy on the `subscription.unsubscribe` method.
- **Steps**:
  1. Render the `useAuth` hook in a test wrapper.
  2. Unmount the wrapper.
- **Expected Result**: `subscription.unsubscribe()` is called exactly once.

### T-007 -- Login button disabled during submission

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that the "Se connecter" button is disabled and shows "Connexion..." while the login request is in flight.
- **Preconditions**: MSW mocks Supabase Auth with a delayed response.
- **Steps**:
  1. Render `<Login />`.
  2. Fill in email and password.
  3. Click "Se connecter".
  4. Immediately check button state before the mock resolves.
- **Expected Result**: Button text is "Connexion..." and the button has `disabled` attribute.

### T-008 -- Empty form submission prevented

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that the form cannot be submitted with empty email or password.
- **Preconditions**: None.
- **Steps**:
  1. Render `<Login />`.
  2. Click "Se connecter" without entering any data.
- **Expected Result**: Browser-native HTML validation prevents form submission. `onLogin` is never called.

---

## Category 2: CRUD (14 tests)

### T-009 -- Fetch prospects on mount

- **Priority**: P0
- **Type**: integration
- **Description**: Verify that prospects are fetched from Supabase on initial mount.
- **Preconditions**: MSW intercepts `GET /rest/v1/prospects` and returns 3 mock prospects sorted by `score_pertinence DESC`.
- **Steps**:
  1. Render a component tree that includes `ProspectsProvider`.
  2. Wait for loading to complete.
- **Expected Result**: The `prospects` array contains all 3 mock prospects with `statut` field derived from actions.

### T-010 -- Fetch actions on mount

- **Priority**: P0
- **Type**: integration
- **Description**: Verify that actions are fetched in parallel with prospects on mount.
- **Preconditions**: MSW intercepts `GET /rest/v1/actions` and returns 5 mock actions.
- **Steps**:
  1. Render a component tree with `ProspectsProvider`.
  2. Wait for loading.
- **Expected Result**: The `actions` array contains all 5 mock actions. Both requests are made in parallel (check MSW request timing).

### T-011 -- Prospect status derived from latest action

- **Priority**: P0
- **Type**: unit
- **Description**: Verify that each prospect's `statut` is set to the type of their most recent action, or `en_attente` if no actions exist.
- **Preconditions**: Mock data: prospect A has actions [interesse, appele]; prospect B has no actions.
- **Steps**:
  1. Process mock data through the enrichment logic in `useProspects`.
- **Expected Result**: Prospect A has `statut: 'interesse'` (first in date-sorted list). Prospect B has `statut: 'en_attente'`.

### T-012 -- Add action inserts into Supabase

- **Priority**: P0
- **Type**: integration
- **Description**: Verify that `addAction` sends an INSERT to the actions table with the correct payload.
- **Preconditions**: MSW intercepts `POST /rest/v1/actions` and validates the request body.
- **Steps**:
  1. Call `addAction(42, 'appele')`.
  2. Inspect the intercepted request body.
- **Expected Result**: Request body contains `{ prospect_id: 42, type: 'appele', notes: null, created_by: '<mock-email>' }`.

### T-013 -- Add action with notes

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that `addAction` passes notes when provided.
- **Preconditions**: MSW intercepts the POST request.
- **Steps**:
  1. Call `addAction(42, 'rappeler', 'Rappeler mardi matin')`.
- **Expected Result**: Request body includes `notes: 'Rappeler mardi matin'`.

### T-014 -- Add action triggers refetch

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that after a successful action insert, the full dataset is re-fetched.
- **Preconditions**: MSW intercepts both POST (insert) and GET (refetch) requests. Count the number of GET requests.
- **Steps**:
  1. Wait for initial load (1 GET for prospects, 1 GET for actions).
  2. Call `addAction(42, 'interesse')`.
  3. Wait for refetch.
- **Expected Result**: After the insert, an additional GET to both `/rest/v1/prospects` and `/rest/v1/actions` is observed (silent refetch with `loading` staying `false`).

### T-015 -- Add action returns error on failure

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that `addAction` returns the Supabase error when the insert fails.
- **Preconditions**: MSW returns a 403 error for the POST request.
- **Steps**:
  1. Call `addAction(42, 'recrute')`.
  2. Inspect the returned value.
- **Expected Result**: The returned value is a Supabase error object with a message. No refetch occurs.

### T-016 -- created_by is set from current session

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that `addAction` reads the email from `getSession()` and uses it as `created_by`.
- **Preconditions**: MSW mocks `getSession` to return `{ user: { email: 'demo@bois-bocage.fr' } }`.
- **Steps**:
  1. Call `addAction(42, 'appele')`.
  2. Inspect the intercepted request body.
- **Expected Result**: `created_by` is `'demo@bois-bocage.fr'`.

### T-017 -- created_by is null when session has no email

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that if the session user has no email, `created_by` is set to `null`.
- **Preconditions**: MSW mocks `getSession` to return `{ user: { email: undefined } }`.
- **Steps**:
  1. Call `addAction(42, 'appele')`.
- **Expected Result**: `created_by` is `null` in the request body.

### T-018 -- AbortController cancels in-flight requests

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that calling `fetchAll` while a previous fetch is in-flight aborts the previous request.
- **Preconditions**: MSW adds a delay to the response. Spy on `AbortController.prototype.abort`.
- **Steps**:
  1. Call `fetchAll()`.
  2. Immediately call `fetchAll()` again before the first resolves.
- **Expected Result**: The first `AbortController` is aborted. Only the second fetch's results are applied to state.

### T-019 -- Cleanup aborts requests on unmount

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that unmounting the hook aborts any in-flight fetch.
- **Preconditions**: MSW delays the response.
- **Steps**:
  1. Render `useProspects` in a test wrapper.
  2. Unmount while the fetch is still pending.
- **Expected Result**: `AbortController.abort()` is called. No state update occurs after unmount.

### T-020 -- Score decomposition for prospect with all criteria met

- **Priority**: P2
- **Type**: unit
- **Description**: Verify `decomposeScore` returns correct breakdown when all 5 criteria are met.
- **Preconditions**: Prospect with `sau_estimee_ha=80`, `tonnage_total=200`, `certifications='HVE'`, `annee_fidelite=5`.
- **Steps**:
  1. Call `decomposeScore(prospect)`.
- **Expected Result**: Returns 5 criteria, all with `met: true`, total points = 85.

### T-021 -- Score decomposition for prospect with no criteria met

- **Priority**: P3
- **Type**: unit
- **Description**: Verify `decomposeScore` returns correct breakdown when no criteria are met.
- **Preconditions**: Prospect with `sau_estimee_ha=0`, `tonnage_total=0`, `certifications=null`, `annee_fidelite=0`.
- **Steps**:
  1. Call `decomposeScore(prospect)`.
- **Expected Result**: Returns 5 criteria, all with `met: false`, total points = 0.

### T-022 -- Score decomposition handles null fields

- **Priority**: P3
- **Type**: unit
- **Description**: Verify `decomposeScore` treats `null` numeric fields as 0 and `null`/empty/`'0.0'` certifications as false.
- **Preconditions**: Prospect with all nullable fields set to `null`.
- **Steps**:
  1. Call `decomposeScore(prospect)`.
- **Expected Result**: No runtime error. All criteria return `met: false`.

---

## Category 3: RLS (8 tests)

### T-023 -- Anonymous user cannot read prospects

- **Priority**: P0
- **Type**: integration
- **Description**: Verify that a request without a JWT cannot read the prospects table.
- **Preconditions**: Supabase test instance or MSW mock simulating PostgREST RLS behavior. No auth token provided.
- **Steps**:
  1. Send a GET request to `/rest/v1/prospects` without `Authorization` header.
- **Expected Result**: Response is 401 Unauthorized or returns empty data (depending on PostgREST config). No prospect data is leaked.

### T-024 -- Anonymous user cannot read actions

- **Priority**: P0
- **Type**: integration
- **Description**: Verify that a request without a JWT cannot read the actions table.
- **Preconditions**: Same as T-023 but targeting actions.
- **Steps**:
  1. Send a GET request to `/rest/v1/actions` without `Authorization` header.
- **Expected Result**: Response is 401 Unauthorized or empty.

### T-025 -- Authenticated user can read all prospects

- **Priority**: P0
- **Type**: integration
- **Description**: Verify that an authenticated user with role `authenticated` can SELECT from prospects.
- **Preconditions**: Valid JWT with `role: authenticated`. MSW returns 200 with prospect data.
- **Steps**:
  1. Send a GET request to `/rest/v1/prospects` with a valid JWT.
- **Expected Result**: Response is 200 with all prospect rows.

### T-026 -- Authenticated user can read all actions

- **Priority**: P0
- **Type**: integration
- **Description**: Verify that an authenticated user can SELECT from actions.
- **Preconditions**: Valid JWT. MSW returns 200 with action data.
- **Steps**:
  1. Send a GET request to `/rest/v1/actions` with a valid JWT.
- **Expected Result**: Response is 200 with all action rows.

### T-027 -- Authenticated user can insert action with matching email

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that an authenticated user can INSERT into actions when `created_by` matches their JWT email.
- **Preconditions**: JWT contains `email: demo@bois-bocage.fr`. MSW validates `created_by` in request body.
- **Steps**:
  1. Send a POST to `/rest/v1/actions` with `created_by: 'demo@bois-bocage.fr'`.
- **Expected Result**: Response is 201 Created.

### T-028 -- Authenticated user cannot insert action with mismatched email

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that the RLS policy rejects an INSERT when `created_by` does not match the JWT email.
- **Preconditions**: JWT contains `email: demo@bois-bocage.fr`. Request body has `created_by: 'attacker@evil.com'`.
- **Steps**:
  1. Send a POST to `/rest/v1/actions` with `created_by: 'attacker@evil.com'`.
- **Expected Result**: Response is 403 Forbidden or the row is not created (RLS violation).

### T-029 -- Authenticated user cannot UPDATE actions

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that no UPDATE policy exists on the actions table.
- **Preconditions**: Authenticated JWT. Action ID exists.
- **Steps**:
  1. Send a PATCH to `/rest/v1/actions?id=eq.1` with `{ type: 'recrute' }`.
- **Expected Result**: Response is 403 or 0 rows affected (RLS denies UPDATE by default).

### T-030 -- Authenticated user cannot DELETE actions

- **Priority**: P2
- **Type**: integration
- **Description**: Verify that no DELETE policy exists on the actions table.
- **Preconditions**: Authenticated JWT. Action ID exists.
- **Steps**:
  1. Send a DELETE to `/rest/v1/actions?id=eq.1`.
- **Expected Result**: Response is 403 or 0 rows affected (RLS denies DELETE by default).

---

## Category 4: UI (28 tests)

### T-031 -- Dashboard renders KPI cards

- **Priority**: P0
- **Type**: unit
- **Description**: Verify that the Dashboard displays 4 KPI cards with correct values.
- **Preconditions**: ProspectsContext provides 3 mock prospects with known SAU, certifications, and scores.
- **Steps**:
  1. Render `<Dashboard />` inside ProspectsContext with mock data.
- **Expected Result**: "Prospects" card shows "3". "SAU totale" shows the sum. "Certifies" shows the percentage. "Score moyen" shows the average.

### T-032 -- Dashboard renders prospect table

- **Priority**: P0
- **Type**: unit
- **Description**: Verify that the prospect table renders all prospects with correct columns.
- **Preconditions**: ProspectsContext provides 3 mock prospects.
- **Steps**:
  1. Render `<Dashboard />`.
  2. Count table rows in tbody.
- **Expected Result**: 3 rows displayed. Each row shows nom, ville, departement, zone, SAU, score, and statut.

### T-033 -- Dashboard text search filters by name

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that typing in the search input filters prospects by name (case-insensitive).
- **Preconditions**: 3 prospects: "GAEC DU MOULIN", "EARL BREIZH", "SAS FERMIERE".
- **Steps**:
  1. Render `<Dashboard />`.
  2. Type "breizh" in the search input.
- **Expected Result**: Only "EARL BREIZH" is visible in the table. KPIs update to reflect 1 prospect.

### T-034 -- Dashboard text search filters by numero_tiers

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that typing a numero_tiers in the search input filters correctly.
- **Preconditions**: Prospect with `numero_tiers: '123456'`.
- **Steps**:
  1. Type "123456" in the search input.
- **Expected Result**: Only the matching prospect is shown.

### T-035 -- Dashboard department filter

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that selecting a department from the dropdown filters the table.
- **Preconditions**: Prospects in departments "22", "29", "35".
- **Steps**:
  1. Select "29" in the department dropdown.
- **Expected Result**: Only prospects in department "29" are shown.

### T-036 -- Dashboard zone filter

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that selecting a zone from the dropdown filters the table.
- **Preconditions**: Prospects in zones "A", "B", "C".
- **Steps**:
  1. Select "A" in the zone dropdown.
- **Expected Result**: Only prospects in zone "A" are shown.

### T-037 -- Dashboard certification filter

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that the "Certifies" checkbox filters to only certified prospects.
- **Preconditions**: 2 certified (certifications not null/0/0.0) and 1 uncertified prospect.
- **Steps**:
  1. Check the "Certifies" checkbox.
- **Expected Result**: Only 2 certified prospects shown.

### T-038 -- Dashboard minimum score filter

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that the score minimum dropdown filters prospects below the threshold.
- **Preconditions**: Prospects with scores 45, 60, 75.
- **Steps**:
  1. Select "70+" from the score dropdown.
- **Expected Result**: Only the prospect with score 75 is shown.

### T-039 -- Dashboard combined filters

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that multiple filters combine with AND logic.
- **Preconditions**: 5 prospects with varying departments, scores, and certifications.
- **Steps**:
  1. Set department to "22", check "Certifies", set score min to "50+".
- **Expected Result**: Only prospects matching ALL three criteria are shown.

### T-040 -- Dashboard column sort ascending/descending

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that clicking a column header toggles sort direction.
- **Preconditions**: 3 prospects with different scores.
- **Steps**:
  1. Click the "Score" column header (default is DESC).
  2. Verify order is descending.
  3. Click "Score" again.
  4. Verify order is ascending.
- **Expected Result**: First click shows highest score first. Second click shows lowest score first.

### T-041 -- Dashboard sort by name

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that clicking "Exploitation" sorts alphabetically.
- **Preconditions**: 3 prospects: "GAEC Z", "EARL A", "SAS M".
- **Steps**:
  1. Click "Exploitation" header.
- **Expected Result**: Rows reorder by name. Second click reverses.

### T-042 -- Dashboard CSV export downloads file

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that clicking the CSV button triggers a file download.
- **Preconditions**: Mock `URL.createObjectURL` and `document.createElement('a').click`.
- **Steps**:
  1. Render `<Dashboard />` with mock data.
  2. Click the "CSV" button.
- **Expected Result**: A Blob with CSV content is created. The anchor element is clicked triggering download. Filename is `prospects_bois_bocage.csv`.

### T-043 -- Dashboard CSV content matches filtered data

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that the CSV export contains only the currently filtered prospects.
- **Preconditions**: 3 prospects, filter applied to show only 1.
- **Steps**:
  1. Apply a text search filter.
  2. Trigger CSV export.
  3. Parse the generated CSV content.
- **Expected Result**: CSV contains header row + 1 data row matching the filtered prospect.

### T-044 -- Dashboard CSV escapes formula injection

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that the `escapeCsv` function prefixes dangerous characters (`=`, `+`, `-`, `@`, tab, CR) with a single quote.
- **Preconditions**: None.
- **Steps**:
  1. Call `escapeCsv('=CMD()')`.
  2. Call `escapeCsv('+HYPERLINK()')`.
  3. Call `escapeCsv('-1+1')`.
  4. Call `escapeCsv('@SUM(A1)')`.
- **Expected Result**: Results are `"'=CMD()"`, `"'+HYPERLINK()"`, `"'-1+1"`, `"'@SUM(A1)"`.

### T-045 -- Dashboard row click navigates to prospect detail

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that clicking a table row navigates to `/prospect/:id`.
- **Preconditions**: Router wrapper with a mock navigate function.
- **Steps**:
  1. Render `<Dashboard />` with prospects.
  2. Click the first table row.
- **Expected Result**: `navigate('/prospect/42')` is called (where 42 is the prospect's ID).

### T-046 -- Dashboard empty state when no prospects match

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that the empty state message is shown when all filters exclude every prospect.
- **Preconditions**: 1 prospect, filter search text that matches nothing.
- **Steps**:
  1. Type "zzz_no_match" in the search input.
- **Expected Result**: The text "Aucun prospect ne correspond aux filtres" is displayed.

### T-047 -- Dashboard loading state

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that the Dashboard shows "Chargement..." while data is loading.
- **Preconditions**: ProspectsContext with `loading: true`.
- **Steps**:
  1. Render `<Dashboard />`.
- **Expected Result**: The text "Chargement..." is visible. No table or KPIs are rendered.

### T-048 -- MapView renders markers for geolocated prospects

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that the map renders a marker for each prospect with latitude and longitude.
- **Preconditions**: 2 prospects with lat/lng, 1 without.
- **Steps**:
  1. Render `<MapView />`.
  2. Count Leaflet markers in the DOM.
- **Expected Result**: 2 markers rendered. The counter text shows "2 prospects geolocalises".

### T-049 -- MapView marker color by score

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that marker colors correspond to score thresholds (green >= 70, orange 50-69, red < 50).
- **Preconditions**: 3 geolocated prospects with scores 80, 55, 30.
- **Steps**:
  1. Render `<MapView />`.
  2. Inspect marker icon HTML for each.
- **Expected Result**: Score 80 marker contains `#16a34a` (green). Score 55 contains `#d97706` (orange). Score 30 contains `#dc2626` (red).

### T-050 -- MapView popup shows prospect info

- **Priority**: P2
- **Type**: integration
- **Description**: Verify that clicking a marker opens a popup with the prospect's name, city, SAU, and score.
- **Preconditions**: 1 geolocated prospect.
- **Steps**:
  1. Render `<MapView />`.
  2. Simulate click on the marker.
- **Expected Result**: Popup contains the prospect's nom, ville, departement, SAU, and score.

### T-051 -- MapView "Voir la fiche" navigates to detail

- **Priority**: P2
- **Type**: integration
- **Description**: Verify that clicking "Voir la fiche" in a popup navigates to the prospect detail.
- **Preconditions**: Popup is open for prospect with ID 42.
- **Steps**:
  1. Click "Voir la fiche" button in the popup.
- **Expected Result**: Navigation to `/prospect/42`.

### T-052 -- ProspectCard renders prospect details

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that the ProspectCard displays all prospect fields correctly.
- **Preconditions**: Route param `id=42`. ProspectsContext contains prospect with ID 42.
- **Steps**:
  1. Render `<ProspectCard />` with route params.
- **Expected Result**: Displays: nom, civilite, numero_tiers, zone, address, phones (as `tel:` links), email (as `mailto:` link), SAU, tonnage, certification status, fidelity, score, score decomposition.

### T-053 -- ProspectCard renders 5 action buttons

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that all 5 action buttons are rendered with correct labels.
- **Preconditions**: Valid prospect rendered.
- **Steps**:
  1. Render `<ProspectCard />`.
  2. Query for buttons.
- **Expected Result**: 5 buttons found: "Appele", "Interesse", "Rappeler", "Refus", "Recrute".

### T-054 -- ProspectCard action button triggers addAction

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that clicking a non-destructive action button (e.g., "Appele") immediately calls `addAction`.
- **Preconditions**: Mock `addAction` in ProspectsContext.
- **Steps**:
  1. Click the "Appele" button.
- **Expected Result**: `addAction(42, 'appele')` is called. No confirmation modal appears.

### T-055 -- ProspectCard destructive action shows confirmation modal

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that clicking "Refus" or "Recrute" shows a confirmation modal before executing.
- **Preconditions**: Valid prospect rendered.
- **Steps**:
  1. Click the "Refus" button.
- **Expected Result**: A modal appears with text "Confirmer l'action" and "Annuler" / "Confirmer" buttons. `addAction` is NOT yet called.

### T-056 -- ProspectCard confirmation modal executes on confirm

- **Priority**: P2
- **Type**: integration
- **Description**: Verify that clicking "Confirmer" in the modal executes the action.
- **Preconditions**: Modal is open for "Refus" action.
- **Steps**:
  1. Click "Confirmer" in the modal.
- **Expected Result**: `addAction(42, 'refus')` is called. Modal closes.

### T-057 -- ProspectCard confirmation modal cancels on cancel

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that clicking "Annuler" closes the modal without executing.
- **Preconditions**: Modal is open.
- **Steps**:
  1. Click "Annuler" in the modal.
- **Expected Result**: Modal closes. `addAction` is NOT called.

### T-058 -- ProspectCard not found state

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that navigating to a nonexistent prospect ID shows "Prospect non trouve".
- **Preconditions**: Route param `id=9999`. ProspectsContext has no prospect with that ID.
- **Steps**:
  1. Render `<ProspectCard />` with `id=9999`.
- **Expected Result**: Text "Prospect non trouve" is displayed with a "Retour" link.

### T-059 -- ProspectCard action history renders chronologically

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that the action history list shows actions sorted by date (most recent first).
- **Preconditions**: 3 actions for the prospect with different timestamps.
- **Steps**:
  1. Render `<ProspectCard />`.
  2. Inspect the order of action history items.
- **Expected Result**: Actions appear from most recent to oldest, each with a type badge and formatted date.

### T-060 -- CampaignTracker goal gauge percentage

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that the goal gauge shows the correct percentage toward 40 recruitments.
- **Preconditions**: ProspectsContext has 10 prospects with `statut: 'recrute'`.
- **Steps**:
  1. Render `<CampaignTracker />`.
- **Expected Result**: Display shows "10 / 40". Progress bar width is 25%. Text shows "25% de l'objectif".

### T-061 -- CampaignTracker pipeline status cards

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that 6 pipeline status cards are rendered with correct counts.
- **Preconditions**: Known distribution of statuses.
- **Steps**:
  1. Render `<CampaignTracker />`.
- **Expected Result**: 6 cards (recrute, interesse, appele, rappeler, refus, en_attente) with correct counts.

### T-062 -- CampaignTracker recent actions list

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that the recent actions list shows up to 20 items.
- **Preconditions**: ProspectsContext has 25 actions.
- **Steps**:
  1. Render `<CampaignTracker />`.
  2. Count action items.
- **Expected Result**: 20 items shown (not 25).

### T-063 -- CampaignTracker action click navigates to prospect

- **Priority**: P2
- **Type**: integration
- **Description**: Verify that clicking a recent action navigates to the associated prospect.
- **Preconditions**: Recent action for prospect with ID 42.
- **Steps**:
  1. Click the action row.
- **Expected Result**: Navigation to `/prospect/42`.

### T-064 -- Layout navigation tabs render

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that the Layout renders 4 navigation tabs with correct labels and links.
- **Preconditions**: None.
- **Steps**:
  1. Render `<Layout />` within a Router.
- **Expected Result**: 4 NavLinks present: "Pipeline" (`/`), "Carte" (`/carte`), "Suivi" (`/suivi`), "Limites" (`/limitations`).

### T-065 -- Layout active tab styling

- **Priority**: P3
- **Type**: unit
- **Description**: Verify that the current route's tab has the active CSS class.
- **Preconditions**: Current route is `/carte`.
- **Steps**:
  1. Render `<Layout />` at route `/carte`.
- **Expected Result**: The "Carte" tab has `border-cooperl-600 text-cooperl-700` classes. Other tabs have `border-transparent`.

### T-066 -- Layout header displays user email

- **Priority**: P3
- **Type**: unit
- **Description**: Verify that the header shows the logged-in user's email.
- **Preconditions**: `userEmail` prop is `'demo@bois-bocage.fr'`.
- **Steps**:
  1. Render `<Layout userEmail="demo@bois-bocage.fr" />`.
- **Expected Result**: The text "demo@bois-bocage.fr" is visible in the header.

### T-067 -- Limitations page renders all 7 items

- **Priority**: P3
- **Type**: unit
- **Description**: Verify that the Limitations page renders all 7 limitation cards.
- **Preconditions**: None.
- **Steps**:
  1. Render `<Limitations />`.
  2. Count limitation cards.
- **Expected Result**: 7 cards rendered, each with a title, description, and impact statement.

### T-068 -- Wildcard route redirects to home

- **Priority**: P3
- **Type**: e2e
- **Description**: Verify that navigating to an unknown route redirects to `/`.
- **Preconditions**: Authenticated user.
- **Steps**:
  1. Navigate to `/nonexistent-page`.
- **Expected Result**: Browser is redirected to `/`. Dashboard is displayed.

---

## Category 5: Performance (5 tests)

### T-069 -- Parallel fetch of prospects and actions

- **Priority**: P0
- **Type**: integration
- **Description**: Verify that the initial data load fetches prospects and actions in parallel, not sequentially.
- **Preconditions**: MSW intercepts both endpoints with timestamps.
- **Steps**:
  1. Render the app and record the time each request is received.
- **Expected Result**: Both requests are initiated within 50ms of each other (parallel), not sequentially.

### T-070 -- No unnecessary refetch on tab navigation

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that navigating between tabs (Dashboard, MapView, CampaignTracker) does not trigger additional data fetches.
- **Preconditions**: Initial load complete. MSW counts subsequent requests.
- **Steps**:
  1. Navigate from `/` to `/carte` to `/suivi` and back to `/`.
- **Expected Result**: Zero additional GET requests to `/rest/v1/prospects` or `/rest/v1/actions` after the initial load.

### T-071 -- Actions list limited to 1000

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that the actions fetch includes `.limit(1000)` to cap the result set.
- **Preconditions**: MSW checks the `limit` query parameter in the request URL.
- **Steps**:
  1. Trigger initial fetch.
  2. Inspect the request URL.
- **Expected Result**: Request URL contains `limit=1000`.

### T-072 -- Filter computation memoized

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that the filtered/sorted prospect list is memoized and does not recompute on unrelated state changes.
- **Preconditions**: Mock `useMemo` with a spy.
- **Steps**:
  1. Render `<Dashboard />`.
  2. Trigger an unrelated state change (e.g., hover).
  3. Check if the filter/sort memo recomputed.
- **Expected Result**: The `useMemo` dependency array only triggers recomputation when filter values actually change.

### T-073 -- Icon cache prevents duplicate DivIcon creation

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that the `markerIcon` function in MapView caches icons and reuses them for the same score tier.
- **Preconditions**: None.
- **Steps**:
  1. Call `markerIcon(80)` twice.
  2. Call `markerIcon(55)` once.
- **Expected Result**: Total DivIcon instances created: 2 (one green, one orange). Second call to `markerIcon(80)` returns the cached instance.

---

## Category 6: Error Handling (13 tests)

### T-074 -- Prospect fetch error logged to console

- **Priority**: P0
- **Type**: unit
- **Description**: Verify that a prospect fetch error is logged and loading state is set to false.
- **Preconditions**: MSW returns a 500 error for prospects. Spy on `console.error`.
- **Steps**:
  1. Trigger initial fetch.
- **Expected Result**: `console.error` called with "Failed to fetch prospects:" and the error object. `loading` is set to `false`. `prospects` remains empty.

### T-075 -- Actions fetch error logged to console

- **Priority**: P0
- **Type**: unit
- **Description**: Verify that an actions fetch error is logged and loading state is set to false.
- **Preconditions**: MSW returns a 500 error for actions (prospects succeeds).
- **Steps**:
  1. Trigger initial fetch.
- **Expected Result**: `console.error` called with "Failed to fetch actions:". `loading` is `false`. `prospects` may be empty (early return on actions error).

### T-076 -- Add action error displayed via alert

- **Priority**: P1
- **Type**: integration
- **Description**: Verify that when `addAction` returns an error, ProspectCard shows an alert with the error message.
- **Preconditions**: Mock `addAction` to return `{ message: 'RLS policy violation' }`. Spy on `window.alert`.
- **Steps**:
  1. Render `<ProspectCard />`.
  2. Click "Appele" button.
- **Expected Result**: `alert` called with "Erreur lors de l'enregistrement : RLS policy violation".

### T-077 -- Sign out error logged

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that if `signOut` fails, the error is logged to console.
- **Preconditions**: MSW mocks `signOut` to return an error. Spy on `console.error`.
- **Steps**:
  1. Call `signOut()`.
- **Expected Result**: `console.error` called with "Sign out failed:" and the error.

### T-078 -- Supabase client throws on missing env vars

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that `supabase.ts` throws an error if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing.
- **Preconditions**: Mock `import.meta.env` to return empty values.
- **Steps**:
  1. Import `supabase.ts` with missing env vars.
- **Expected Result**: `Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')` is thrown.

### T-079 -- Root element not found throws

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that `main.tsx` throws if `#root` element does not exist in the DOM.
- **Preconditions**: No `#root` element in the document.
- **Steps**:
  1. Execute `main.tsx` initialization logic.
- **Expected Result**: `Error('Root element #root not found')` is thrown.

### T-080 -- ProspectsContext throws outside provider

- **Priority**: P1
- **Type**: unit
- **Description**: Verify that calling `useProspectsContext()` outside of `ProspectsProvider` throws.
- **Preconditions**: None.
- **Steps**:
  1. Render a component that calls `useProspectsContext()` without wrapping it in `ProspectsProvider`.
- **Expected Result**: `Error('useProspectsContext must be used within ProspectsProvider')` is thrown.

### T-081 -- Prospect fetch failure does not crash the app

- **Priority**: P2
- **Type**: integration
- **Description**: Verify that a prospect fetch failure results in a graceful empty state, not a crash.
- **Preconditions**: MSW returns a 500 for prospects.
- **Steps**:
  1. Render `<App />` in authenticated state.
  2. Wait for fetch to fail.
- **Expected Result**: Dashboard renders with 0 prospects and shows the empty state message. No unhandled exception.

### T-082 -- Actions fetch failure does not prevent prospect display

- **Priority**: P2
- **Type**: integration
- **Description**: Verify that if the actions fetch fails but prospects succeed, the app still shows prospects (with `en_attente` status).
- **Preconditions**: MSW returns 200 for prospects, 500 for actions.
- **Steps**:
  1. Wait for both fetches.
- **Expected Result**: Prospects are displayed. All have `statut: 'en_attente'` since actions failed. Note: current implementation returns early on actions error, so prospects may also be empty -- this test documents the actual behavior.

### T-083 -- Invalid prospect ID in URL handled gracefully

- **Priority**: P2
- **Type**: unit
- **Description**: Verify that navigating to `/prospect/abc` (non-numeric) shows the "not found" state.
- **Preconditions**: Route param `id='abc'`.
- **Steps**:
  1. Render `<ProspectCard />` with `id='abc'`.
- **Expected Result**: `parseInt('abc', 10)` returns `NaN`. No matching prospect found. "Prospect non trouve" is displayed.

### T-084 -- Network timeout on fetch handled

- **Priority**: P2
- **Type**: integration
- **Description**: Verify that a network timeout does not leave the app in a perpetual loading state.
- **Preconditions**: MSW delays response beyond a reasonable timeout.
- **Steps**:
  1. Trigger initial fetch with a very slow mock response.
  2. Observe behavior after the AbortController would abort.
- **Expected Result**: Loading state eventually resolves (either to data or empty). The app remains interactive.

### T-085 -- CSV export with special characters in prospect data

- **Priority**: P3
- **Type**: unit
- **Description**: Verify that CSV export correctly escapes prospect data containing commas, quotes, and newlines.
- **Preconditions**: Prospect with `nom: 'GAEC "Les Chenes"'` and `ville: 'Saint-Jean, 29'`.
- **Steps**:
  1. Trigger CSV export.
  2. Parse the CSV output.
- **Expected Result**: Double quotes are escaped (`""`). Fields containing commas or quotes are properly wrapped. CSV is parseable.

### T-086 -- Action buttons disabled during action submission

- **Priority**: P3
- **Type**: unit
- **Description**: Verify that all 5 action buttons are disabled while an action is being submitted.
- **Preconditions**: Mock `addAction` with a delayed response.
- **Steps**:
  1. Click "Appele" button.
  2. Check all 5 buttons before the promise resolves.
- **Expected Result**: All buttons have the `disabled` attribute and reduced opacity (`disabled:opacity-50`).

---

## End-to-End Tests (4 tests)

These tests require Playwright and a running Supabase instance (or mock server).

### T-087 -- Full login to dashboard flow

- **Priority**: P1
- **Type**: e2e
- **Description**: Verify the complete flow from login to viewing the dashboard.
- **Steps**:
  1. Open the app URL.
  2. Enter valid credentials.
  3. Click "Se connecter".
  4. Wait for the dashboard to load.
- **Expected Result**: Login form disappears. Dashboard is visible with KPI cards and prospect table.

### T-088 -- Navigate through all tabs

- **Priority**: P2
- **Type**: e2e
- **Description**: Verify that all navigation tabs work correctly.
- **Steps**:
  1. Log in.
  2. Click "Carte" tab.
  3. Verify map is visible.
  4. Click "Suivi" tab.
  5. Verify campaign tracker is visible.
  6. Click "Limites" tab.
  7. Verify limitations page is visible.
  8. Click "Pipeline" tab.
  9. Verify dashboard is visible.
- **Expected Result**: Each tab displays the correct content. No errors in the browser console.

### T-089 -- Record an action end-to-end

- **Priority**: P1
- **Type**: e2e
- **Description**: Verify the complete flow of recording an action on a prospect.
- **Steps**:
  1. Log in.
  2. Click the first prospect row in the dashboard.
  3. On the prospect detail page, click "Appele".
  4. Verify the action appears in the history.
  5. Navigate back to the dashboard.
  6. Verify the prospect's status badge shows "Appele".
- **Expected Result**: Action is persisted. Status is updated across all views.

### T-090 -- CSV download end-to-end

- **Priority**: P2
- **Type**: e2e
- **Description**: Verify that the CSV download button produces a valid file.
- **Steps**:
  1. Log in.
  2. On the dashboard, click the "CSV" button.
  3. Intercept the download.
  4. Parse the downloaded CSV.
- **Expected Result**: Downloaded file is named `prospects_bois_bocage.csv`. Contains a header row and data rows matching the displayed prospects. UTF-8 BOM is present.
