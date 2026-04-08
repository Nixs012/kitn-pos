# KiTN POS — Automation Roadmap

This document outlines the processes within the KiTN POS ecosystem that are currently manual but can be automated in future development phases to increase store efficiency.

---

## 🚀 Priority Automation Targets

### 1. Automated Restocking (Purchase Orders)
- **Current Process**: Owners manually check the "Low Stock" alert and call suppliers.
- **Automation**: System generates a standardized **Purchase Order (PDF)** when an item hits its reorder level and emails it directly to the saved supplier.

### 2. Daily Financial Reconciliation
- **Current Process**: Owners manually cross-reference MPesa statements with POS transaction logs.
- **Automation**: A background job (Edge Function) pulls MPesa statements daily and flags any discrepancies where a sale was recorded but payment was not received (or vice versa).

### 3. Smart Employee Payroll
- **Current Process**: Owners manually count hours from shift logs and calculate commissions.
- **Automation**: The system automatically calculates **Monthly Payroll** based on:
  - Total `Hours on Shift` (from shift logs).
  - `Sales Commission` (calculated per employee based on their net sales).
  - Generation of digital payslips.

### 4. Dynamic Pricing & Markdown
- **Current Process**: Owners manually lower prices for items near expiry.
- **Automation**: System automatically applies a **Markdown Discount** (e.g., 20% off) when a product's "Expiry Date" is within 7 days, alerting staff to move the stock.

---

## 📡 Customer Relationship Automation

### 5. Automated Loyalty Rewards
- **Current Process**: Staff manually track repeat customers.
- **Automation**: System identifies "Top 10% Customers" and automatically sends a **Discount SMS/Email** on their birthday or after their 10th purchase.

### 6. Abandoned Cart Recovery (for B2B/Wholesale)
- **Current Process**: Wholesale orders left in "Draft" are forgotten.
- **Automation**: System sends a reminder to the manager if a high-value cart has been open for more than 2 hours without completion.

---

## 🏛️ Compliance & Governance

### 7. Automated Tax (KRA TIMS) Filing
- **Current Process**: Manual export of data for filing returns.
- **Automation**: Direct integration with the **KRA iTax Portal** to push daily Z-Reports and monthly VAT summaries automatically.

### 8. Predictive Stock Forecasting
- **Current Process**: Owners guess how much stock to buy for holidays.
- **Automation**: Use historical data to predict stock requirements for the next 30 days, accounting for seasonal trends (e.g., "Demand for soft drinks increases by 40% in December").
