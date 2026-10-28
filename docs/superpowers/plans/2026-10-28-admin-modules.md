# Admin Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Personnel, Rapports, Menus and Activités modules to `/admin`, plus three quick fixes, keeping the current UI.

**Architecture:** New modules live in their own files under `src/components/admin/`; shared styles/helpers are extracted from `admin.tsx` into `src/components/admin/ui.tsx` so modules reuse the exact existing look. Pure logic (dates, report maths, CSV, DB mappers) lives in `src/lib/` and is unit-tested with Vitest. `admin.tsx` only gains wiring (state, fetch, nav, render).

**Tech Stack:** TanStack Start/Router, React 19, Supabase JS, lucide-react, Vitest + jsdom, inline styles (existing pattern).

**Spec:** `docs/superpowers/specs/2026-10-28-admin-modules-design.md`

## Global Constraints

- Keep the existing glassmorphism look: reuse `card`, `inputStyle`, `labelStyle`, `badge`, `PageHeader`, `Field`, `EmptyState` (inline styles, French labels, `var(--font-display)` / `var(--font-sans)`).
- All UI text in French.
- Do not run SQL against the live database; only edit `supabase_schema.sql`.
- Do not touch `/`, `accullie.tsx`, auth, or RLS policy strictness (new tables use the same open `allow_all_*` policy pattern).
- No git history rewriting; commit on branch `feature/admin-modules`. Every commit message ends with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Ids are `text` primary keys generated client-side with `uid()`, as in existing tables.
- Sections for children/staff/activities: `"Bébés" | "Moyens" | "Grands"` (staff and activities may also use `"Toutes"`).
- Cut order if time runs short: Activités → Menus → Rapports export. Personnel is last to cut.

## Review Focus

- Report on a month with no children or no attendance rows must show 0 % and zeros, never `NaN`/`Infinity`.
- CSV with a child name containing `;`, `"` or a newline must still open as a correct 4-column file.
- Before the user runs the new SQL, the new tables do not exist: the admin must still load children/parents/attendance/payments and show a non-blocking notice instead of the full-page error.
- Staff arrival tapped twice must update the same row (one row per staff per date), and departure before arrival must be ignored.
- Menu for a week with no saved rows must render five empty editable days; week navigation must not skip or repeat a week across month/year boundaries.
- Deleting a child or parent must not leave stale ids in the other side's link array after reload.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/admin-helpers.ts` (create) | `localDateStr`, `weekStartOf`, `addDays`, `buildReport`, `paymentsToCsv` |
| `src/lib/admin-extra.ts` (create) | App types + DB mappers for staff, staff attendance, menus, activities |
| `src/lib/supabase.ts` (modify) | Add `DbStaff`, `DbStaffAttendance`, `DbMenu`, `DbActivity` |
| `src/components/admin/ui.tsx` (create) | Shared styles/components extracted from `admin.tsx` + `ErrorBanner` |
| `src/components/admin/StaffSection.tsx` (create) | Personnel list/CRUD + staff pointage |
| `src/components/admin/ReportsSection.tsx` (create) | Rapports |
| `src/components/admin/MenusSection.tsx` (create) | Menus |
| `src/components/admin/ActivitiesSection.tsx` (create) | Activités |
| `src/routes/admin.tsx` (modify) | Import shared UI, quick fixes, wiring |
| `supabase_schema.sql` (modify) | 4 new tables |
| `src/test/admin-helpers.test.ts`, `src/test/admin-extra.test.ts` (create) | Unit tests |

---

### Task 0: Environment baseline

**Files:** none changed.

- [ ] **Step 1: Install dependencies** — Run: `npm install` in the repo root. Expected: exits 0.
- [ ] **Step 2: Record baseline** — Run `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm test -- --run`. Note any pre-existing failures so later tasks only answer for new ones. Expected: commands run; failures (if any) are written down, not fixed.

---

### Task 1: Pure helpers + shared UI extraction

**Files:**
- Create: `src/lib/admin-helpers.ts`, `src/components/admin/ui.tsx`, `src/test/admin-helpers.test.ts`
- Modify: `src/routes/admin.tsx` (remove `uid`, `todayStr`, `nowStr`, `card`, `inputStyle`, `labelStyle`, `badge`, `PageHeader`, `SectionTitle`, `Field`, `EmptyState` definitions at lines ~86–149 and ~1988–2076, except `InfoRow`; import them from the new files)

**Interfaces:**
- Produces (`admin-helpers.ts`):
  - `localDateStr(d?: Date): string` → local `YYYY-MM-DD` (fixes the UTC bug of the old `todayStr`)
  - `addDays(dateStr: string, n: number): string`
  - `weekStartOf(d: Date): string` → local Monday `YYYY-MM-DD`
  - `type PayStatus = "paid" | "pending" | "late"`
  - `interface Report { sectionCounts: Record<string, number>; attendanceDays: number; attendanceRate: number; payments: Record<PayStatus, { count: number; total: number }> }`
  - `buildReport(input: { children: { id: string; section: string }[]; attendance: { childId: string; date: string; arrival: string | null }[]; payments: { childId: string; month: string; amount: number; status: PayStatus }[]; month: string }): Report` — `month` is `YYYY-MM`; `attendanceDays` = distinct dates in that month with ≥1 arrival; `attendanceRate` = (arrivals in month) / (children.length × attendanceDays), `0` when either is 0; payments filtered by `month`.
  - `paymentsToCsv(rows: { childName: string; month: string; amount: number; status: string }[]): string` — header `Enfant;Mois;Montant;Statut`, `;` separator, `\n` line ends, fields containing `;` `"` or newline wrapped in quotes with `"` doubled.
- Produces (`ui.tsx`): exports `uid()`, `todayStr()` (= `localDateStr()`), `nowStr()`, `card`, `inputStyle`, `labelStyle`, `badge(color)`, `PageHeader`, `SectionTitle`, `Field`, `EmptyState` (same props/markup as today), and new `ErrorBanner({ message, onClose }: { message: string; onClose: () => void })` (red-tinted `card`-style bar with a close ✕).

- [ ] **Step 1: Write failing tests in `src/test/admin-helpers.test.ts`**: `localDateStr(new Date(2026,0,5,23,30))==="2026-01-05"`; `weekStartOf(new Date(2026,9,28))==="2026-10-26"` and a Sunday (`2026-11-01`) → `"2026-10-26"`; `addDays("2026-12-30",3)==="2027-01-02"`; `buildReport` with 2 children, 3 arrivals over 2 days in `2026-10` → `attendanceDays 2`, `attendanceRate 0.75`; `buildReport` with empty arrays → rate `0`, all totals `0`, no NaN; payments totals split by status and month; `paymentsToCsv([{childName:'Dupont; "Léa"',month:"2026-10",amount:350,status:"paid"}])` equals `'Enfant;Mois;Montant;Statut\n"Dupont; ""Léa""";2026-10;350;paid'`.
- [ ] **Step 2: Run** `npm test -- --run src/test/admin-helpers.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement `admin-helpers.ts`** to the signatures above (build date strings from local `getFullYear/getMonth/getDate`, never `toISOString`).
- [ ] **Step 4: Run** the same command → PASS.
- [ ] **Step 5: Create `ui.tsx`** by moving the listed definitions verbatim from `admin.tsx` (add `export`), `todayStr` delegating to `localDateStr`; add `ErrorBanner`. In `admin.tsx` replace the removed code with `import { ... } from "../components/admin/ui";`.
- [ ] **Step 6: Verify** `npx tsc --noEmit` and `npm run lint` show no new errors vs. baseline; `npm run build` succeeds.
- [ ] **Step 7: Commit** `refactor: extract admin shared ui and date/report helpers`.

---

### Task 2: Schema, DB types and mappers

**Files:**
- Modify: `supabase_schema.sql` (append before the "Row Level Security" block's end: tables, indexes, `enable row level security`, `allow_all_*` policies, same style as existing), `src/lib/supabase.ts`
- Create: `src/lib/admin-extra.ts`, `src/test/admin-extra.test.ts`

**Interfaces:**
- Produces SQL tables (all `id text primary key`, `created_at timestamptz default now()`):
  - `staff(name text not null, role text, phone text, email text, section text default 'Toutes', hire_date text, notes text)`
  - `staff_attendance(staff_id text not null references staff(id) on delete cascade, date text not null, arrival text, departure text, unique(staff_id, date))`
  - `menus(week_start text not null, day smallint not null check (day between 0 and 4), breakfast text, lunch text, snack text, unique(week_start, day))`
  - `activities(day smallint not null check (day between 0 and 4), start_time text, end_time text, title text not null, section text default 'Toutes', notes text)`
- Produces (`admin-extra.ts`):
  - `interface Staff { id: string; name: string; role: string; phone: string; email: string; section: string; hireDate: string; notes: string }`
  - `interface StaffAttendance { staffId: string; date: string; arrival: string | null; departure: string | null }`
  - `interface MenuDay { weekStart: string; day: number; breakfast: string; lunch: string; snack: string }`
  - `interface Activity { id: string; day: number; startTime: string; endTime: string; title: string; section: string; notes: string }`
  - `dbToStaff/staffToDb`, `dbToStaffAttendance/staffAttendanceToDb` (db `id` = `` `${staffId}_${date}` ``), `dbToMenu/menuToDb` (db `id` = `` `${weekStart}_${day}` ``), `dbToActivity/activityToDb`. Same convention as existing mappers: `dbTo*(r: Record<string, unknown>)` turns null into `""`; `*ToDb` turns `""` into `null`.
- `supabase.ts`: add `DbStaff`, `DbStaffAttendance`, `DbMenu`, `DbActivity` interfaces mirroring the tables.

- [ ] **Step 1: Write failing tests** in `admin-extra.test.ts`: staff round-trip (`dbToStaff(staffToDb(s))` equals `s`); `staffToDb({...email:""})` has `email: null`; `staffAttendanceToDb` id is `"s1_2026-10-28"`; `menuToDb` id is `"2026-10-26_0"`; activity round-trip with null `notes`.
- [ ] **Step 2: Run** `npm test -- --run src/test/admin-extra.test.ts` → FAIL.
- [ ] **Step 3: Implement** `admin-extra.ts`, the `Db*` types, and the SQL.
- [ ] **Step 4: Run** the test → PASS; `npx tsc --noEmit` no new errors.
- [ ] **Step 5: Commit** `feat: add schema, types and mappers for staff, menus, activities`.

---

### Task 3: Quick fixes in `admin.tsx`

**Files:** Modify `src/routes/admin.tsx`

**Interfaces:**
- Consumes: `ErrorBanner` from Task 1.
- Produces: `writeError: string | null` state in `AdminDashboard` and `reportWrite(label: string, error: unknown): void` (logs and sets `writeError` to `` `Échec de l'enregistrement (${label}). Vos modifications peuvent être perdues.` ``), used by every existing `upsert*/delete*` helper instead of bare `console.error`; `ErrorBanner` rendered above the sections.

- [ ] **Step 1: Persist link toggles.** `ParentsSection.toggleChildLink` computes the updated parent once (outside `setParents`), calls `setParents` with it and `onParentAdded(updated)`; also update the linked child's `parentIds`: add prop `onChildLinkChange: (childId: string, parentId: string, linked: boolean) => void` to `ParentsSection`; in `AdminDashboard` implement it to update `children` state and `upsertChild` the changed child.
- [ ] **Step 2: Clean links on delete.** In `ChildrenSection.removeChild` and `ParentsSection.removeParent`, also remove the id from the other side's arrays in state and persist each changed record via the existing `onParentAdded`/`onChildAdded`-style upserts (pass `upsertParent`/`upsertChild` down as needed).
- [ ] **Step 3: Payment updater.** `PaymentsSection.updateStatus` finds the payment from `payments`, builds `updated`, then calls `setPayments` (pure map) and `onPaymentUpsert(updated)` outside the updater.
- [ ] **Step 4: Error banner.** Add `writeError` state, `reportWrite`, replace the `console.error` calls in the 8 helpers (lines ~283–310) with `reportWrite("<label>", error)`, render `<ErrorBanner message={writeError} onClose={() => setWriteError(null)} />` just above the sections when set.
- [ ] **Step 5: Verify** `npx tsc --noEmit`, `npm run lint`, `npm run build` pass (no new errors).
- [ ] **Step 6: Commit** `fix(admin): persist parent-child links, surface write errors, pure payment updater`.

---

### Task 4: Personnel module

**Files:** Create `src/components/admin/StaffSection.tsx`

**Interfaces:**
- Consumes: `Staff`, `StaffAttendance` (Task 2); `card, inputStyle, labelStyle, badge, PageHeader, Field, EmptyState, uid, todayStr, nowStr` (Task 1).
- Produces: `export function StaffSection(props: { staff: Staff[]; setStaff: React.Dispatch<React.SetStateAction<Staff[]>>; staffAttendance: StaffAttendance[]; setStaffAttendance: React.Dispatch<React.SetStateAction<StaffAttendance[]>>; onStaffUpsert: (s: Staff) => void; onStaffDelete: (id: string) => void; onAttendanceUpsert: (r: StaffAttendance) => void }): JSX.Element`

Behaviour: header `PageHeader icon="🧑‍🏫" title="Personnel" count={staff.length}` with an "Ajouter" button; two tabs "Équipe" / "Pointage" (styled like existing pill buttons).
- Équipe: search by name/role; add/edit form (fields name*, role, phone, email, section select Bébés/Moyens/Grands/Toutes, hire date `type="date"`, notes) in a `card`; list cards with phone call link, section `badge`, edit and delete (`confirm`) buttons. Name required.
- Pointage: today's list mirroring `AttendanceSection` (arrival/departure buttons, 3 stat cards Présents/Partis/Non arrivés). Arrival on an existing record updates it; departure without arrival is ignored.

- [ ] **Step 1: Implement the component** per the above, copying the markup patterns from `ParentsSection` (form/list) and `AttendanceSection` (pointage).
- [ ] **Step 2: Verify** `npx tsc --noEmit` and `npm run lint` show no new errors in this file.
- [ ] **Step 3: Commit** `feat(admin): add Personnel module`.

---

### Task 5: Rapports module

**Files:** Create `src/components/admin/ReportsSection.tsx`

**Interfaces:**
- Consumes: `buildReport`, `paymentsToCsv`, `Report`, `PayStatus` (Task 1); UI from Task 1.
- Produces: `export function ReportsSection(props: { children: { id: string; firstName: string; lastName: string; section: string }[]; attendance: { childId: string; date: string; arrival: string | null }[]; payments: { childId: string; month: string; amount: number; status: PayStatus }[] }): JSX.Element`

Behaviour: month picker (`type="month"`, default current month via `localDateStr().slice(0,7)`); cards for Taux de présence (%), Jours de pointage, Paiements payés/en attente/en retard (count + total €), and Enfants par section (Bébés/Moyens/Grands). Buttons: "Imprimer" (`window.print()`) and "Exporter CSV" (builds `paymentsToCsv` for the selected month with `childName = "Prénom Nom"`, downloads via Blob with a leading `﻿`, filename `paiements-YYYY-MM.csv`). Empty state when there are no children.

- [ ] **Step 1: Implement the component** using `buildReport` for all numbers (no maths inline).
- [ ] **Step 2: Verify** `npx tsc --noEmit` and `npm run lint` show no new errors.
- [ ] **Step 3: Commit** `feat(admin): add Rapports module`.

---

### Task 6: Menus module

**Files:** Create `src/components/admin/MenusSection.tsx`

**Interfaces:**
- Consumes: `MenuDay` (Task 2); `weekStartOf`, `addDays`, `localDateStr` (Task 1).
- Produces: `export function MenusSection(props: { menus: MenuDay[]; setMenus: React.Dispatch<React.SetStateAction<MenuDay[]>>; onMenuUpsert: (m: MenuDay) => void }): JSX.Element`

Behaviour: week navigator (← Semaine précédente / Aujourd'hui / Semaine suivante →) over `weekStart` (starts at `weekStartOf(new Date())`, moves with `addDays(weekStart, ±7)`), showing the date range label in French. Five day cards Lundi–Vendredi, each with three inputs (Petit-déjeuner, Déjeuner, Goûter). Missing rows render as empty values; saving happens `onBlur` of an input: build `MenuDay` for that `(weekStart, day)`, replace-or-append in `menus`, call `onMenuUpsert`.

- [ ] **Step 1: Implement the component.**
- [ ] **Step 2: Verify** `npx tsc --noEmit`, `npm run lint` no new errors.
- [ ] **Step 3: Commit** `feat(admin): add Menus module`.

---

### Task 7: Activités module

**Files:** Create `src/components/admin/ActivitiesSection.tsx`

**Interfaces:**
- Consumes: `Activity` (Task 2); `uid` and UI (Task 1).
- Produces: `export function ActivitiesSection(props: { activities: Activity[]; setActivities: React.Dispatch<React.SetStateAction<Activity[]>>; onActivityUpsert: (a: Activity) => void; onActivityDelete: (id: string) => void }): JSX.Element`

Behaviour: add form (day select Lundi–Vendredi, start/end `type="time"`, title*, section select Bébés/Moyens/Grands/Toutes, notes); schedule shown as five day cards listing activities sorted by `startTime`, each with time range, title, section `badge`, delete (`confirm`). Empty days show "Aucune activité".

- [ ] **Step 1: Implement the component.**
- [ ] **Step 2: Verify** `npx tsc --noEmit`, `npm run lint` no new errors.
- [ ] **Step 3: Commit** `feat(admin): add Activités module`.

---

### Task 8: Wire everything into `admin.tsx`

**Files:** Modify `src/routes/admin.tsx`

**Interfaces:** Consumes everything above.

- [ ] **Step 1: Types and nav.** Extend `Section` with `"staff" | "reports" | "menus" | "activities"`. Add to `navItems` (lucide icons `UserCog`, `BarChart3`, `UtensilsCrossed`, `CalendarDays`): `Personnel`, `Rapports`, `Menus`, `Activités`. In the mobile-bottom-nav CSS (`.mobile-bottom-nav`) add `overflow-x: auto` so 8 items stay reachable.
- [ ] **Step 2: State and fetch.** Add state `staff`, `staffAttendance`, `menus`, `activities` and `extrasMissing: boolean`. Add `fetchExtras()` that queries the four new tables independently of `fetchAll`; on any error set `extrasMissing = true` and keep lists empty, never touching `dbError`. Call it after `fetchAll` succeeds.
- [ ] **Step 3: Persistence helpers** `upsertStaff`, `deleteStaffDb`, `upsertStaffAttendance` (`onConflict: "staff_id,date"`), `upsertMenu` (`onConflict: "week_start,day"`), `upsertActivity`, `deleteActivityDb`, all using `reportWrite` and the Task 2 mappers.
- [ ] **Step 4: Render** the four sections with the props defined in Tasks 4–7 (Reports gets `children`, `attendance`, `payments`). When `extrasMissing` and the section is one of the four new ones, show a notice `card` above it: "Les tables Personnel / Menus / Activités n'existent pas encore. Exécutez supabase_schema.sql dans Supabase puis rechargez." (the section still renders; Rapports works regardless).
- [ ] **Step 5: Sidebar stat** — change the "présents aujourd'hui" count to exclude children with a departure (`a.arrival && !a.departure`).
- [ ] **Step 6: Verify** `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm test -- --run` all pass (apart from baseline failures recorded in Task 0).
- [ ] **Step 7: Commit** `feat(admin): wire Personnel, Rapports, Menus, Activités into dashboard`.

---

### Task 9: Final verification

- [ ] **Step 1:** Run `npm run dev`, open `/accullie` then `/admin` in the browser pane (login values are in `accullie.tsx`; do not print them), click through all 8 nav items at desktop and mobile width, confirm no console errors and the "tables missing" notice appears if SQL has not been run.
- [ ] **Step 2:** `git status` clean, `git log --oneline` shows the task commits. Report anything not verified (live Supabase flows) to the user, and remind them to run the new SQL.
