# KiTN POS — Technical API Reference

This document provides developers with an overview of the APIs, data types, and integration patterns used within the KiTN POS platform.

---

## 🏗️ Core Architecture
The platform is built on **Next.js 14** and uses **Supabase** as its central Backend-as-a-Service (BaaS).

- **Database**: PostgreSQL (hosted by Supabase).
- **Authentication**: Supabase Auth (JWT-based).
- **Storage**: Supabase Storage (for product images).
- **Real-time**: Supabase Realtime (via the `notifications` table and CDC).

---

## ⚡ API Types & Patterns

### 1. Supabase JS Client (Primary)
Used in most client components for direct CRUD operations.
- **Library**: `@supabase/supabase-js`.
- **Initialization**: `lib/supabase/client.ts`.
- **Usage**:
  ```typescript
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('branch_id', id);
  ```

### 2. Next.js API Routes (Internal Sync)
Located in `apps/web/app/api/`.
- **/api/mpesa**: Handlers for C2B/B2C callbacks.
- **/api/sync**: Manages offline/online data reconciliation.
- **/api/receipts**: Server-side receipt formatting and PDF generation.
- **/api/tims**: Integration with the Kenya Revenue Authority (KRA) TIMS device.

### 3. Edge Functions (Serverless)
Located in `supabase/functions/`.
- **daily-report**: Cron-triggered function that generates daily sales summaries.
- **send-receipt**: Function to email receipts to customers after checkout.

### 4. Real-time Subscriptions
Used in `Dashboard` and `POS` for live updates.
- **Channel**: `supabase_realtime`.
- **Logic**: Listen for `INSERT` on the `notifications` table or `UPDATE` on `inventory` quantities.

---

## 📊 Core Data Schemas (Zod)
All frontend data is validated using **Zod** schemas in `lib/validations/`.

- **ProductSchema**: Validates name, price, SKU, and category.
- **SaleSchema**: Validates the cart items, tax calculations, and payment status.
- **BranchSchema**: Validates branch location and manager assignment.

---

## 🔗 External Integrations

### 1. MPesa Daraja API
- **Implementation**: `app/api/mpesa/`.
- **Flow**: POS trigger → STK Push → Callback to KiTN API → Update sale status.

### 2. TIMS (Tax Integration)
- **Implementation**: `app/api/tims/`.
- **Protocol**: TCP/IP or Serial communication with local fiscal devices.
- **Requirement**: Must be enabled in **Settings > Devices**.

---

## 🛠️ Developer Commands
- `npm run dev`: Start local development server.
- `npm run build`: Production build and type checking.
- `npx next lint`: Verify code style and accessibility.
- `supabase gen types typescript`: Renew TypeScript definitions from DB schema.
