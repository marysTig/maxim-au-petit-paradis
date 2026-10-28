# Admin modules completion — design

Date: 2026-10-28 · Branch: `feature/admin-modules`

## Goal
Make the `/admin` dashboard of "Maxim au Petit Paradis" look complete within ~1 hour by adding the four modules the user considers "coming soon": **Personnel, Rapports, Menus, Activités**. Keep the current design and UI. Backend work stays shallow.

## Confirmed decisions (from the user)
- Keep existing glassmorphism UI and French labels; new modules reuse the existing inline-style patterns.
- Storage for new data: Supabase tables, SQL appended to `supabase_schema.sql`. The user runs the SQL; Claude never touches the live database.
- Existing-admin fixes: only the quick ones (see below). No edit forms for children/parents.
- Out of scope: public site (`/`), real authentication, RLS hardening.
- Priority is a complete-looking, working admin, built fast.

## Quick fixes in existing admin
1. Persist parent–child link toggles (`toggleChildLink` must call the parent upsert).
2. Surface Supabase write errors to the user (a visible error banner/toast) instead of only `console.error`.
3. Move the payment-status Supabase call out of the `setState` updater.

## New modules
Each is its own component file imported by `admin.tsx`; `admin.tsx` receives only small additions (Section type, nav items, rendering, data load).

### Personnel
- Staff CRUD + search. Fields: name, role, phone, email, section (Bébés/Moyens/Grands/Aucune), hire date, notes.
- Daily staff pointage: arrival/departure buttons per staff member, same behaviour as children pointage; one row per staff per date.

### Rapports (read-only, derived from existing data)
- Attendance rate per month, payments paid/pending/late with totals, children per section.
- Print (browser print) and CSV export of the payments report.

### Menus
- Weekly plan, Monday–Friday, each day: petit-déjeuner, déjeuner, goûter (free text). Editable inline, saved per week.

### Activités
- Weekly schedule by day and time slot: title, section, notes. Add/delete.

## Data model (appended to `supabase_schema.sql`)
- `staff(id, name, role, phone, email, section, hire_date, notes, created_at)`
- `staff_attendance(id, staff_id → staff on delete cascade, date, arrival, departure, created_at, unique(staff_id, date))`
- `menus(id, week_start, day, breakfast, lunch, snack, created_at, unique(week_start, day))`
- `activities(id, day, start_time, end_time, title, section, notes, created_at)`
- All: RLS enabled with the same open "allow all" policy as existing tables (consistent with current state; hardening is out of scope).
- `src/lib/supabase.ts` gets matching `Db*` types.

## Error handling
Writes use optimistic local state like the existing code, plus a shared error message shown on failure. Load failures reuse the existing retry card.

## Testing
`npm run lint` and `npm run build` must pass. Unit tests (Vitest) for pure helpers (report calculations, CSV builder, week/date helpers). Supabase flows are not testable without the live DB; the user verifies them after running the SQL.

## Risk / cut order
If time runs short, cut in this order: Activités → Menus → Rapports export. Personnel is the last to cut.

## Process
New branch, normal commits, no history rewriting (project is synced with Lovable, see `AGENTS.md`).
