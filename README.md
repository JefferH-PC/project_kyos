# Kyos

Kyos is a browser-based personal finance dashboard for tracking investments, simulated income, net worth milestones, Wishlist goals, Recovery spending, and balance summaries.

## Features

- Net Worth dashboard with total invested value, investment count, milestone progress, and income comparisons.
- Investments section with asset creation, invested balance, yield, daily income, lifetime income, top investment, and combined daily income.
- Simulated Increase days and Decrease days controls for testing compounded asset income and paying down Wishlist or Recovery values.
- Wishlist items automatically enter processing when the processing lane is available. Processing can be moved between Wishlist items, and completed Wishlist items return as Ready items.
- Recovery items are processed one at a time and block Wishlist processing while active. Completed Recovery items are removed and remain recorded as Balance spending; manually removed items are removed from spending totals.
- Dynamic next milestone targets in R$10,000 increments, with remaining value and estimated days based on total daily investment income.
- Balance summary for invested and spent values, including completed Wishlist purchases and Recovery additions.
- Current-day, week, month, and year income cards based on the actual system date. Simulations update income history without changing the displayed calendar date.
- CDI loading from the Banco Central do Brasil SGS API, refreshed daily. Cards show the annualized total based on the current daily CDI value, while asset income uses the daily rate.
- English and Portuguese interface text, persisted locally.
- Dark and light themes, persisted investment data, local database editing, and optional money-value masking.

## Requirements

- Node.js 18 or newer is recommended.
- npm.
- A modern browser with `localStorage` and `fetch` support.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The app opens at `http://localhost:3000` by default.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Starts the development server. |
| `npm test` | Runs the test watcher. |
| `npm test -- --watch=false --runInBand` | Runs the test suite once. |
| `npm run build` | Creates an optimized production build in `build/`. |
| `npm run eject` | Ejects the Create React App configuration. This is irreversible. |

## How It Works

### Investments

Create assets with a name, yield percentage, and initial investment. Daily income is calculated from the current invested amount, the asset yield, and the daily CDI value:

```text
daily income = invested amount x (asset yield / 100) x (daily CDI / 100)
```

Increasing simulated days compounds income into each asset's invested amount and lifetime income. Decreasing simulated days rolls back recorded income without reducing an asset below its original principal.

### Income Cards and Dates

The application always uses the computer's actual date for Today, Yesterday, Week, Month, and Year calculations. Simulation controls change recorded income and goal progress only; they do not move the displayed day, month, or year.

### Wishlist and Recovery

Wishlist and Recovery values display both their remaining amount and estimated days based on the combined daily income of all assets. Recovery has priority over Wishlist processing. When no Recovery item is active, Wishlist automatically processes the active item or selects the first queued item. A completed Wishlist item becomes Ready and can be bought or removed.

Adding a Recovery item immediately contributes its original value to Balance spending. Removing it manually reverses that contribution. Completing it through processing leaves the amount recorded as spent.

### Persistence and Reset Migrations

Application data is stored in browser `localStorage` under `kyos-database`. The application normalizes stored data on startup and uses a schema version to apply one-time migrations.

The current schema migration preserves assets while resetting non-asset values when required. This includes Wishlist, Recovery, milestones, spending totals, dates, and income history according to the migration version in `src/App.js`.

The Database section provides a JSON editor for inspecting or replacing the local database. Invalid or incomplete database drafts are ignored.

## CDI Data Source

Kyos requests the latest SGS series 12 value from Banco Central do Brasil:

```text
https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json
```

The API value is treated as a daily percentage and refreshed every 24 hours. If the request fails, the built-in fallback value is used until a later refresh succeeds. Browser network policies or API availability may affect live CDI updates.

## Project Structure

```text
src/
	App.js                         Main application state and calculations
	App.css                        Main layout and theme styles
	Components/                    Reusable dashboard controls and slot views
	MiddleNetWorthCard/            Net Worth total card
	utils/formatters.js            Brazilian currency and number formatting
	App.test.js                    Application tests
public/                          Static public assets
build/                           Generated production output
```

## Validation

Run the production build before publishing changes:

```bash
npm run build
```

Run the tests once in CI-style mode:

```bash
npm test -- --watch=false --runInBand
```

## License

No license has been specified for this repository yet.

