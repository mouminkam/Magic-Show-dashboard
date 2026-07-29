<p align="center">
  <img src=".github/assets/logo.png" alt="Magic Show" width="260" />
</p>

<h1 align="center">Magic Show — Admin Console</h1>

<p align="center">
  <em>Every screen a real admin would need to run the store — with no server behind it.</em>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" />
  <img alt="TanStack Query" src="https://img.shields.io/badge/TanStack_Query-5-FF4154" />
  <img alt="Radix UI" src="https://img.shields.io/badge/Radix_UI-primitives-161618" />
</p>

---

## What this is

A **React + TypeScript admin console** for the Magic Show e-commerce platform — the internal tool
staff would use to manage products, orders, customers, inventory, marketing, and site content.

It runs **entirely on an in-browser mock backend**. There is no server: every screen talks to a
typed service layer that reads and writes an in-memory database, seeded the moment the app loads
and persisted to `localStorage` so your changes survive a refresh. Clone it, `npm install`,
`npm run dev`, and you have a fully populated admin console in seconds — 32 screens, real seeded
data (orders spread across statuses and dates, customers, inventory, coupons with usage history),
zero setup.

This is one of three sibling projects in the Magic Show portfolio, alongside a Next.js **storefront**
and a Laravel **backend API** — each lives in its own repository and runs standalone on its own
mock/seed data, so any one of the three can be evaluated on its own.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5180
```

Sign in with the seeded demo account shown on the login screen, or any email from the seed data
paired with any password of 6+ characters:

```
amira.chalhoub@magicshow.ae / magicshow
```

```bash
npm run typecheck  # tsc -p tsconfig.app.json --noEmit
npm run build      # tsc -b && vite build
npm run preview    # serve the production build locally
```

## Why it's built this way

A mock-data admin console is easy to make feel like a toy — a handful of screens with `useState`
and a `console.log` where the mutation should be. This one is deliberately built to the shape of a
real admin product instead, so the architecture itself is part of what's being demonstrated:

- **Every list screen behaves like it's talking to a real paginated REST API** — search, filter,
  sort, and pagination are all resolved server-side style inside the mock layer
  (`services/core.ts#runQuery`), not by filtering an array in the component. Swap the mock service
  for a real HTTP client later, and the screens don't change.
- **Mutations are real mutations.** Editing a product, applying a coupon, changing an order's
  status — every write goes through TanStack Query, updates the in-memory database, and persists to
  `localStorage`. Nothing here is decorative.
- **One shared `ResourceCrudPage`** drives every "flat resource" screen (categories, brands, sizes,
  warehouses, users, and a dozen others) — list, create/edit dialog, delete confirmation — so
  adding the 25th resource screen is a small, boring, predictable change instead of a fresh
  from-scratch build.

## Architecture

```
src/
  mocks/          Seed data generator + the in-memory "database" (mocks/db.ts).
                   Persists to localStorage under magic-show.admin.db.
  services/       One module per domain (catalog, orders, settings, content, …).
                   Every call is Promise-based with simulated latency, mirroring
                   a real REST API. services/crud.ts factors out the repetitive
                   list/all/get/create/update/patch/remove shape used by ~20
                   "flat resource" screens. Screens with different anatomy
                   (products, orders, the inbox) call a hand-written service.
  hooks/          TanStack Query bindings. hooks/use-crud.ts wraps a CrudService
                   in list/all/create/update/patch/remove hooks with toasts and
                   cache invalidation; hooks/resources.ts instantiates one per
                   resource. use-list-controls.ts owns pagination/search/sort/
                   filter state for list screens.
  components/
    data-table/    The single TanStack Table wrapper used by every list screen —
                   manual pagination/sorting, column visibility, row selection.
    resource/      ResourceCrudPage — the shared list + create/edit dialog +
                   delete-confirm screen every flat resource renders through —
                   plus form-controls.tsx, the field bindings (TextField,
                   SelectField, SwitchField, …) that wire react-hook-form to
                   the design system's inputs.
    ui/            Design-system primitives (Button, Dialog, Select, Table
                   chrome, Toaster, …), mostly thin wrappers around Radix.
    layout/        AppShell, Sidebar, Topbar, command palette (Ctrl/Cmd K),
                   breadcrumbs. layout/nav.ts is the single source of truth
                   for the sidebar and command palette.
    charts/        Shared Recharts styling (axis/grid/tooltip/legend).
  pages/          One folder per section (catalog, orders, customers,
                   inventory, marketing, content, support, settings, auth)
                   plus dashboard.tsx and not-found.tsx.
  auth/           Mock session (auth-context.tsx, persisted to localStorage)
                   and protected-route.tsx, which gates every route but /login.
  lib/            Zod schemas (the single source of truth for every write
                   shape), formatting helpers, status/tone lookup tables, the
                   query-key registry, misc utils.
  types/          Domain model (mirrors the Laravel backend's Eloquent models)
                   and the transport-shaped API types (Paginated<T>, ListParams).
```

**Data flow:** `pages/*` → `hooks/*` (TanStack Query) → `services/*` → `mocks/db.ts` (in-memory +
`localStorage`). Every list screen sends `{ page, perPage, search, sortBy, sortDir, filters }` to a
service, which runs search → filter → sort → paginate and returns a page envelope — so every screen
behaves like a real paginated API call from day one.

## Brand identity

Shares its design tokens with the storefront by architecture — same variable names, same shape (a
`canvas → surface → raised → sunken → overlay` scale, an `ink` neutral ramp, one `brand` accent,
four semantic tones) — so the two apps read as one product, not two unrelated projects glued
together for a portfolio. The accent is **`#f97316`**, the brand's real color, in both light and
dark mode.

## Screen inventory

Every sidebar item resolves to a real, populated screen — no "coming soon" placeholders. Highlights:

- **`pages/dashboard.tsx`** — KPI tiles, revenue chart, order-status breakdown, top products, recent
  orders, low-stock alerts, a "needs attention" queue.
- **Catalog** — products (list + full editor with variants/attributes/images), categories, brands,
  colors, sizes, materials, seasons, attributes, reviews.
- **Orders** — list, detail with line items and status transitions, a printable invoice view.
- **Customers**, **inventory**, **marketing** (coupons with usage stats, newsletter, testimonials).
- **Content** — blog (editor + comment moderation), a tabbed page-content editor covering the
  home/shop/store/blog/about/contact pages, team members.
- **Support** — a contact-message inbox with read/reply/archive states.
- **Settings** — currencies, warehouses, branches, users, and permissions.

## Mutations, persistence, and the demo data reset

Every mutation calls `commit()` (`mocks/db.ts`), which snapshots the whole in-memory database to
`localStorage`. A refresh keeps your changes exactly as you left them. If you'd rather start over,
**"Reset demo data"** (account menu, top-right) wipes the snapshot and regenerates the full seed —
Settings → General shows a live row count per table so you can see exactly what's populated. The
reset covers every entity the app knows about: products, categories, brands, colors, sizes,
materials, seasons, attributes, reviews, orders, customers, inventory and stock movements, coupons
and their usage, newsletter subscribers, testimonials, blog posts and comments, contact messages,
team members, home/about CMS sections and stats, hero-page copy, contact-page settings, currencies,
warehouses, branches, admin users, and permissions.

## Honest trade-offs

- The production bundle has one chunk over Vite's 500&nbsp;kB advisory — Recharts is the bulk of
  it. Routes are lazy-loaded via `React.lazy`, so this only affects the vendor chart chunk and
  doesn't block any route from rendering; a further split of Recharts specifically would be the
  next optimization if this needed to ship for real.
- This dashboard and the storefront are two independent mock-data apps — neither is wired to the
  Laravel backend in this portfolio. That's a deliberate boundary, not a gap that was missed.
