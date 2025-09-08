Step 0 — Repo reconnaissance (must do, don’t skip)

Search the repo for:

The Products list page component (look for “Products”, “/products”, table headers Product / Variants / Status).

The API layer (fetcher, client, or hooks calling /vendor/... endpoints).

The config hook that reads product-catalog flags (global_product_catalog, product_request_enabled, product_import_enabled).

Shared UI primitives (Modal/Dialog, Button, Table, Input, Select, Combobox/Command palette, Tabs).

Any existing Requests or Import modals (copy patterns).

Document (in comments in a scratch file) where you found:

ProductsList component file path.

API client or fetch wrapper file path(s).

Config hook file path (e.g., useVendorConfig()).

Toast/notification utility.

Route config file (if there’s a central route map).

If something doesn’t exist (e.g., no config hook), create a tiny one that calls the backend config endpoint already in use by other screens (do not invent endpoints).

Step 1 — UI surface: add the button in Products header

In the Products list page header (same place as “Create”/“Import”), add a conditional button:

Label: “Attach from Catalog”

Visible only if global_product_catalog === true

Clicking the button opens a modal. Use the panel’s existing Modal/Dialog component.

Files to add:

src/features/catalog-attach/AttachFromCatalogButton.tsx (wrapper)

src/features/catalog-attach/AttachFromCatalogModal.tsx (modal with content)

Export the button from an index.ts barrel in the same folder.

Step 2 — Modal content and flow (3 screens inside the modal)

The modal is a 3-step wizard:

Step A: Search global catalog

A searchable list (table or list) of global products:

Search input (debounced).

Table columns: Product title, Collections (optional), Variants count, Status (must be published to be attachable), “Select” action.

Pagination (Prev/Next).

Data source: a Vendor-accessible endpoint for global products. Try an existing route (search the repo for /vendor/catalog or similar). If no vendor route exists, use a temporary Admin proxy route already used elsewhere in vendor panel. If nothing exists, define a new vendor client method that calls a backend route named /vendor/catalog/products (GET with q, limit, offset).

Step B: Pick variants + per-seller fields

Once a product is selected, show its variants (fetch details by product id):

Checkbox per variant to attach.

For each selected variant:

Seller SKU (text input).

Price(s) for the seller’s allowed regions/currencies (multi-input if multiple regions are enabled).

Inventory quantity for the seller’s stock location(s). If multiple locations exist, render a row per location with qty.

Backorder allowed (toggle) and manage inventory (toggle) — default to platform policy if present.

If seller has no stock location, show a blocking banner with instructions and disable the Next button.

Step C: Review & Submit

Show a compact summary: product title, selected variant count, per-variant SKU/price(s)/inventory.

Submit posts to an attach endpoint; on success:

Close modal.

Invalidate/refetch the Products list query so the new items appear.

Show success toast.

Files to add:

src/features/catalog-attach/steps/SearchGlobalProducts.tsx

src/features/catalog-attach/steps/ConfigureVariants.tsx

src/features/catalog-attach/steps/ReviewAndSubmit.tsx

Shared types in src/features/catalog-attach/types.ts

Step 3 — Types & API contracts

Create or extend types (adjust names to match repo conventions):

// src/features/catalog-attach/types.ts
export type GlobalProduct = {
  id: string
  title: string
  status: "published" | "draft" | "proposed"
  handle?: string
  collection_title?: string | null
  variants_count: number
}

export type GlobalVariant = {
  id: string
  title: string
  sku?: string | null
  options?: Array<{ id: string; title: string; value: string }>
}

export type SellerStockLocation = {
  id: string
  name: string
}

export type RegionPrice = {
  region_id: string
  currency_code: string
  amount: number // in minor units if that’s what the panel uses elsewhere
}

export type VariantAttachmentInput = {
  variant_id: string
  seller_sku?: string
  allow_backorder?: boolean
  manage_inventory?: boolean
  prices: RegionPrice[]
  inventory_by_location: Array<{ location_id: string; quantity: number }>
}

export type AttachRequest = {
  product_id: string
  variants: VariantAttachmentInput[]
}


Expected endpoints (prefer existing; otherwise create client stubs and TODOs):

GET /vendor/catalog/products?q=&limit=&offset= → { products: GlobalProduct[], count, limit, offset }

GET /vendor/catalog/products/:id → product + variants: GlobalVariant[]

GET /vendor/stock-locations → { locations: SellerStockLocation[] }

POST /vendor/catalog/attach with body AttachRequest → { success: true }

If these vendor endpoints do not exist, first search for an Admin route you can read from the vendor panel (some builds use a proxy or shared route). If none exist, leave TODOs and generate a small backend PR separately—but keep the frontend complete and type-safe, with feature flag gating and mock fallback in dev.

Step 4 — API client & hooks

Add a tiny API module and React Query hooks:

Files:

src/lib/api/catalog.ts

src/hooks/useCatalog.ts

src/hooks/useSellerLocations.ts

catalog.ts should export:

export const fetchGlobalProducts = async ({ q, limit, offset }) => { /* GET */ }
export const fetchGlobalProductDetail = async (productId: string) => { /* GET */ }
export const attachGlobalProduct = async (payload: AttachRequest) => { /* POST */ }


useCatalog.ts:

useGlobalProducts(query) → paginated list with q, limit, offset

useGlobalProductDetail(id)

useAttachGlobalProduct() → mutation with success/error toasts

useSellerLocations.ts:

useSellerStockLocations() → list of locations (and memoized hasLocations boolean)

Follow the project’s standard fetcher and error handling. Use existing toast/notification utilities.

Step 5 — Wire into Products page

Import AttachFromCatalogButton into the Products list page header.

Show only when global_product_catalog === true.

Pass through any permissions/role gates already used for “Import/Create”.

Add a tiny empty-state hint: if no products exist and global_product_catalog === true, show “You can Attach from Catalog to start listing existing products.”

Step 6 — Validation & UX details

Disable Next/Submit until:

At least one variant selected,

Each selected variant has at least one price (valid number),

Seller has at least one stock location and entered inventory (>=0).

If backend expects minor units, convert and display a helper text (e.g., “₹499 → 49900 if minor units”). Better: introspect from region config if available elsewhere in the panel.

Prevent duplicate submissions (loading state).

On API error, show the server message inline per field if possible; otherwise toast a readable message.

Step 7 — Tests (Vitest + Testing Library)

Add tests under src/features/catalog-attach/__tests__/:

Button visibility: hidden when global_product_catalog=false, visible when true.

Search list: debounced query calls once, renders rows, pagination works.

Validation: submit disabled until required fields set; selecting variants enables submit.

Mutation success: calls attach API, closes modal, invalidates Products query, shows toast.

Mock the API methods from src/lib/api/catalog.ts.

Step 8 — Lint, types, and build

Run pnpm/yarn npm run lint, type-check, build.

Fix all issues.

Keep bundle size reasonable (don’t import heavy libs).

Step 9 — Minimal docs

Update README.md (or docs/CONTRIBUTING.md) with:

Feature description,

Feature flag dependency: Admin → Product catalog settings → global_product_catalog,

Required backend endpoints,

How to test locally.

Step 10 — (Optional) Backend PR if routes are missing

If the vendor routes aren’t present, generate a separate patch (in the backend repo) adding:

GET /vendor/catalog/products (search + paginate published products)
GET /vendor/catalog/products/:id (with variants)
GET /vendor/stock-locations (seller’s own locations)
POST /vendor/catalog/attach (auth as seller; creates seller–product listing, sets seller prices, and writes inventory to seller’s stock location using the inventory module)

Acceptance criteria server-side:

Only published global products are attachable.

A seller can only attach to their locations.

Idempotency: re-attaching same variant updates values, not duplicates.

Validation: reject if no prices in allowed regions.

Return consistent error shapes the panel already expects.

Acceptance criteria (must all pass)

When global_product_catalog is off, there is no new button.

When on, a seller sees Attach from Catalog on Products.

Seller can search global products, pick variants, set SKU/price/inventory, and Submit.

On success, the newly attached products appear in the seller’s Products list without page reload.

All new code is typed, linted, tested.

Now start:

Locate the Products list page and config hook.

Create the catalog-attach feature folder and files.

Implement the button → modal → 3-step flow.

Add API hooks and tests.

Run lint/type-check/build and show me the diff.

Notes for you (Claude)

If any file path differs, adapt, but keep structure clean.

If an endpoint is missing, leave a TODO comment and create a typed stub so the UI compiles. Then propose the backend diff at the end.

Keep components small and composable.

Use existing design system; do not introduce new UI libraries.