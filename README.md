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
- Persists the last opened date, database, and user preferences in `localStorage`.
- Provides a **simulation mode** that lets users experiment with different CDI rates without affecting the main database.

---

## Features (User View)

| Section | What the user sees | Key interactions |
|--------|--------------------|-----------------|
| **Header** | Language selector (EN/PT), theme toggle (light/dark), money‑visibility toggle | Switch language instantly, toggle night mode, hide/reveal monetary values |
| **Net Worth Card** | Shows total net worth, a green upward trend arrow, and day‑to‑day change | Quick glance at overall financial health |
| **Weekly Summary** | Bar‑graph‑style cards for today, yesterday, and the current week | Shows daily income, yesterday’s income, and weekly total |
| **Investments Area** | List of assets with name, invested amount, daily yield, and edit button on each card | Edit name, yield rate, or invested amount → immediate recalculation |
| **Wishlist / Recovery** | Cards for pending expenses (wishlist) and debt‑recovery items, each with progress bars | When the daily yield is enough, items are automatically marked **Completed** |
| **Catch‑Up Modal** (on app start) | Summarizes business days processed while the user was away, total accrued income, and any completed slots | “Continue” button dismisses the modal; no duplicate accrual on subsequent loads |
| **Simulation Tab** | Independent sandbox where users can set a custom CDI rate, reset to live baseline, or clear all data | Allows “what‑if” analysis without touching the real data |
| **Error Banner** | Appears when holiday data cannot be fetched and there is no cache | “Retry” button forces a fresh fetch once connectivity is restored |

All UI elements are fully localized (English \u0026 Portuguese) and respect the user's preference for showing or hiding monetary values.

---

## Usage / Quick Start

1. **Open the app** – If you have been away, a **Catch‑Up Summary** modal appears showing missed business days, accrued income, and any completed wishlist/recovery items. Click **Continue** to proceed.
2. **Select Language** – Use the dropdown in the top‑right corner to switch between English and Portuguese instantly.
3. **Toggle Theme** – Click the sun/moon icon to switch between light and dark themes.
4. **Hide/Show Money Values** – Click the eye icon to hide monetary numbers for privacy.
5. **Edit an Asset** – In the **Investments** section, click the **Edit** (pencil) button on an asset card. Change the name, yield rate, or invested amount, then click **Save**. The dashboard updates immediately, and the asset’s income history is rebuilt.
6. **Wish‑List / Recovery** – Add new expense or debt items via the respective tabs. As daily yield accrues, the app automatically reduces the price until the item is marked **Completed** and appears in the modal’s “Completed Slots” list.
7. **Simulation Mode** – Switch to the **Simulation** tab to experiment with a custom CDI rate. Use **Reset to Live Baseline** to revert to the real data, or **Clear All** to start a fresh sandbox.
8. **Error Handling** – If the holiday API fails and there is no cached data, an error banner appears with a **Retry** button. Clicking **Retry** forces a fresh fetch once the network is reachable.

All actions are persisted in `localStorage`, so reloading or reopening the browser retains your data and preferences.

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 <Your Name>

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