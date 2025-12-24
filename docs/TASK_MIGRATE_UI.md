# Tasks: Migrate UI to Tailwind + shadcn/ui

## A. Baseline setup (Tailwind + shadcn foundation)
- Install Tailwind in `apps/web` along with `tailwindcss`, `postcss`, and `autoprefixer`.
- Generate `tailwind.config.ts` and `postcss.config.mjs`.
- Configure the `content` paths to include:
  - `./app/**/*.{ts,tsx}`
  - `./components/**/*.{ts,tsx}`
  - `../../packages/shared/**/*.{ts,tsx}` *(if shared UI/types are rendered)*
- Add Tailwind directives to `apps/web/app/globals.css`:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- Remove or disable conflicting global styles (reset frameworks, Bootstrap, etc.).
- Install shadcn prerequisites: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.
- Add `lib/utils.ts` with a `cn()` helper.
- Run `shadcn init` in `apps/web` and confirm that:
  - The components path (e.g., `apps/web/components/ui`) exists.
  - The Tailwind config points to the correct file.
  - The global CSS path resolves to `app/globals.css`.
  - The default style is selected (you can adjust later).
- Seed the theme tokens (CSS variables) for light/dark in `globals.css`, even if only light is used initially.
- Optionally add a `ThemeProvider` to prepare for later theming needs.

✅ **DoD:** A blank page renders with Tailwind classes and at least one basic shadcn button works.

## B. Remove/replace existing CSS framework usage
- Inventory current CSS sources: Bootstrap, custom files, CSS modules, styled-components, etc.
- Decide what to keep—only retain component-scoped CSS modules if truly needed.
- Prefer Tailwind utilities for layout and spacing; remove or isolate legacy styles.
- Delete legacy framework imports from `_app/layout`. If deletion isn’t possible yet, scope them to legacy pages and avoid global selectors that override shadcn styles.

✅ **DoD:** No global CSS collisions remain and shadcn components render correctly.

## C. Add base layout components (ERP shell)
- Create the private `App Shell` layout at `/app/(app)/layout.tsx` with:
  - Sidebar on the left.
  - Navbar on top.
  - Content outlet for child routes.
- Build the Navbar using shadcn parts:
  - Tenant dropdown (Popover or Select).
  - Profile avatar dropdown (DropdownMenu + Avatar).
  - Logout action.
- Build a collapsible sidebar that:
  - Supports expanded and icon-only modes.
  - Persists state to `localStorage`.
  - Shows tooltips when collapsed.
  - Uses shadcn components (Tooltip, Collapsible for the Settings group, Button for the toggle).

✅ **DoD:** Sidebar collapses/expands, labels hide/show, and tooltips appear when collapsed.

## D. Build common UI primitives
- Use the shadcn generator to add the following components:
  `button`, `input`, `label`, `table`, `dropdown-menu`, `avatar`, `dialog`, `alert-dialog`, `select`, `checkbox`, `popover`, `tooltip`, `scroll-area`, `separator`, `badge`.
- Create reusable wrappers:
  - `PageHeader` (title + actions)
  - `EmptyState`
  - `LoadingState`
  - `DataTable` (basic table wrapper)

✅ **DoD:** You can build Roles/Users pages without crafting new styling for each component.

## E. Implement permission-guarded menus
- Build permission hooks such as `useMe()`, `usePermissions()`, and `useActiveTenant()` that expose:
  - `isSuperAdmin`
  - `can(permissionCode)`
  - `canAny([...])`
- Guard sidebar items using these helpers, hiding any item when `!canAny(requiredPerms)` and the user isn’t a super admin.
- Keep the sidebar tree defined in a single file for easier updates.

✅ **DoD:** Sidebar adapts to the permissions returned from the hooks.

## F. Update Cycle-1 pages to use shadcn UI
- **Login**: Build the form with shadcn inputs/buttons and inline error handling.
- **Select tenant**: Render a tenant list or dropdown using shadcn `Card`, `Select`, and `Button`.
- **Roles**: Use a table and create/edit dialog (or separate page); add a grouped, scrollable permission checklist.
- **Users**: Display a table, “add by email” flow UI, and a role assignment dropdown.
- **Tenants (Super admin)**: Implement a table plus a create-tenant dialog/form.

✅ **DoD:** All Cycle-1 screens are consistent, readable, and guard access as required.

## Suggested execution order (fastest path)
1. Tailwind setup ✅
2. `shadcn` init + `cn()` helper ✅
3. Install common shadcn components ✅
4. App shell (sidebar + navbar) ✅
5. Permission guard helpers ✅
6. Implement screens (Login → Select Tenant → Roles/Users → Tenants) ✅

## Assumption
`apps/web` is using the Next.js App Router (`/app`). If you are on the Pages Router, the file locations change but the steps stay the same. Share the current `apps/web` structure (folder tree) and I can adjust this task list to match.
