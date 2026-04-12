# KiTN POS - Business Workflow Guide (Imani Collective)

This guide walks through the lifecycle of using KiTN POS for a business like **Imani Collective**, from its first store opening to ongoing maintenance.

---

## 🏗️ Phase 1: Onboarding & Deployment
### 1. Account Creation (Superadmin)
The KiTN team registers Imani Collective in the `Superadmin` panel:
- **Registration**: Navigate to `Superadmin > Businesses` and click **"Register New Partner"**.
- **Admin Configuration**: Input the business name (e.g., "Imani Collective"), location, and provide the primary **Store Admin's** email and a temporary password.
- **Node Deployment**: Clicking "Deploy" automatically creates the Business Tenant, a default "Main Branch", and the root Admin account.

### 2. Store Admin's First Login & Setup
Once registered, the Store Admin receives their credentials:
- **First Login**: Log in at `/login` as "ADMIN" using the provided email and password.
- **Onboarding Interface**: On first login, the Admin is guided through the **KiTN Onboarding Flow** to refine their store details, add their opening hours, and upload their initial product catalog.
- **System Initialization**: The system automatically prepares the POS terminal and Sales dashboards.

### 2. Physical Hardware Setup
- Open `https://kitn-pos.vercel.app` on a tablet or PC at the shop.
- Connect the **Barcode Scanner** (Plug-and-play USB or Bluetooth).
- Connect the **ESC/POS Receipt Printer**.

### 3. Staff Registration (Admin/Manager)
The Store Admin goes to **Settings > Team** to add staff (Cashiers).
- **Credentials**: Each staff member gets a login email/password AND a 4-digit PIN for quick terminal access.
- **Permissions**: Cashiers can make sales but cannot edit product prices or see profit reports.

---

## ⚡ Phase 2: Daily Operations ("A Day at the Shop")
### 1. Opening & Inventory
The Manager checks the **Inventory** page.
- Scan new fabric or products using the scanner.
- Adjust stock levels if items were manufactured in-house.
- Check "Low Stock" notifications on the dashboard.

### 2. Making a Sale (Cashier)
The Cashier logs in via **4-Digit PIN** (fast & efficient).
1. **Cart**: Scan items or select from the visual grid.
2. **Payment**: Choose **Cash** or **M-Pesa**. 
   - *If M-Pesa*: Enter the customer's phone number -> System triggers a "STK Push" -> Customer enters PIN on their phone.
3. **Closing**: Once paid, the system triggers the printer to print the receipt and logs the sale in the background.

---

## 📊 Phase 3: Business Growth & Maintenance
### 1. Reviewing Profit & Finance
At the end of the month, the owner reviews the **Finance** dashboard.
- See which branch is performing best.
- Track expenses (Rent, Utilities) against total revenue.
- View profit margins automatically calculated after VAT.

### 2. Deployment Updates & Support
- **Updates**: The system is web-based (SaaS). Updates were deployed automatically by KiTN without Imani Collective needing to download anything.
- **Support**: If a cashier forgets their PIN, the Admin can reset it in seconds from the **Settings** menu.
- **Audit Logs**: Every price change or deleted sale is tracked in the **Audit Log** for security and accountability.

---

## 🛠️ Deployment & Maintenance Overview
- **Deployment**: Hosted on Vercel with a Supabase PostgreSQL backend.
- **Scalability**: As Imani Collective grows, they can add new "Branches" in the dashboard, and the system handles them as a single entity with consolidated reporting.
- **Security**: All passwords are encrypted; M-Pesa transactions are handled via the secure Safaricom Daraja API.
