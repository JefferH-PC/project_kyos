# Kyos – Personal Finance Dashboard

A modern, responsive React dashboard that helps users track net‑worth, daily income, investments, wish‑list items, and recovery slots while automatically handling Brazilian business‑day logic and offline resiliency.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Features (User View)](#features-user-view)
- [Installation & Setup](#installation--setup)
- [Usage / Quick Start](#usage--quick-start)
- [License](#license)

---

## Project Overview

Kyos is a single‑page React application built with **React 19** and **React‑Scripts**. It is designed for Brazilian users (but works globally) and automatically:
- Calculates daily yield **only on Brazilian business days** (weekends + national holidays are excluded).
- Caches holiday data from **BrasilAPI** in `localStorage` for offline use.
- Persists the last opened date, database, user preferences, and tax deduction modes in `localStorage`.
- Provides an **optional Brazilian Fixed-Income Tax Engine** (IOF regressive table hitting 0% at 30 days, and IR Regressivo brackets 22.5% down to 15%).
- Computes **historical yield accruals** when adding or updating investments with a past investment date.
- Offers **JSON Backup Export and Import** for data safety and cross-device migrations.
- Features **localized date formatting** (Brazilian `DD/MM/YYYY` in Portuguese, US `MM/DD/YYYY` in English).
- Implements an **interactive portfolio allocation chart** and mobile tab-based navigation for screens under 900px.
- Delivers a clean, professional, non-neon matte UI design.
- Provides a **simulation mode** that lets users experiment with different CDI rates without affecting the main database.

---

## Features (User View)

| Section | What the user sees | Key interactions |
|--------|--------------------|-----------------|
| **Header** | Language selector (EN/PT), theme toggle (light/dark), money visibility toggle, IR/IOF tax toggle, JSON Export and Import buttons | Instant language switch, night mode toggle, hide/reveal numbers, backup download, restore backup, toggle tax deduction |
| **Net Worth Card** | Total net worth, upward trend indicator, and day-to-day changes (Gross or Net of taxes) | Quick glance at overall financial health |
| **Weekly Summary** | Summary cards for today, yesterday, and the current week | Shows daily income, yesterday’s income, and weekly total |
| **Investments Area** | List of assets with name, invested date, invested amount, daily yield, and tax breakdown | Add/edit name, yield rate, invested amount, or past investment date (automatically backfilling historical returns) |
| **Balance & Allocation** | Interactive Donut chart (Invested vs Spent) and Portfolio Asset Allocation breakdown | View financial split and percentage breakdown across assets |
| **Wishlist / Recovery** | Cards for pending expenses (wishlist) and debt recovery items with progress bars | Daily yield automatically amortizes items until marked **Completed** |
| **Mobile Navigation** | Segmented tab bar (Wishlist, Dashboard, Recovery) on mobile screens | Fluid mobile navigation without horizontal clipping |
| **Catch‑Up Modal** (on app start) | Summarizes business days processed while away, total accrued income, and completed items | “Continue” button dismisses the modal without duplicate accruals |
| **Simulation Tab** | Independent sandbox where users can set a custom CDI rate, reset to baseline, or project future dates | What-if financial projections |
| **Error Banner** | Appears when holiday data cannot be fetched and there is no cache | “Retry” button forces a fresh fetch |

All UI elements are fully localized (English / Portuguese) and respect the user's preference for showing or hiding monetary values.

---

## Usage / Quick Start

1. **Open the app** – If you have been away, a **Catch‑Up Summary** modal appears showing missed business days, accrued income, and completed items.
2. **Select Language & Date Format** – Use the dropdown in the header to switch between English (`MM/DD/YYYY`) and Portuguese (`DD/MM/YYYY`).
3. **Toggle Taxes (IR / IOF)** – Click the `% IR/IOF` button in the header. Kyos calculates the net daily and total yields based on calendar days elapsed since each asset was invested, zeroing IOF after 30 days and applying the 22.5% to 15% regressive IR bracket.
4. **Add or Edit Investments with Past Dates** – Enter the asset name, CDI yield %, invested principal, and the date it was originally invested. Kyos automatically computes and backfills the compounding daily yields from that date up to today.
5. **Backup & Restore (JSON)** – Click the download icon in the header to export a `kyos-backup-YYYY-MM-DD.json` file. Use the upload icon to restore your database on any device.
6. **Mobile Navigation** – On mobile and tablet devices, use the top navigation tabs to switch between your Wishlist, Overview, and Debt Recovery columns.

All actions are persisted in `localStorage`, so reloading or reopening the browser retains your data and preferences.

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Jeffer Henrique

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```
---