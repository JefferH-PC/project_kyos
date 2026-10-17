/**
 * Brazilian Fixed Income Tax Engine (IOF & IR Regressivo)
 * Compliant with Lei nº 11.033/2004 and Decreto nº 6.306/2007.
 */

import { parseDateKey } from './calendar';

/**
 * IOF regressive rates for calendar days 1 to 29.
 * Day 0 and 1 are 96%.
 * Day 30+ is strictly 0%.
 */
export const IOF_TABLE = [
  96, 96, 93, 90, 86, 83, 80, 76, 73, 70, // Days 0-9
  66, 63, 60, 56, 53, 50, 46, 43, 40, 36, // Days 10-19
  33, 30, 26, 23, 20, 16, 13, 10, 6, 3    // Days 20-29
];

/**
 * Calculates calendar days elapsed between investment date and current/reference date.
 *
 * @param {Date|string} startDate Investment date (YYYY-MM-DD or Date object)
 * @param {Date|string} [referenceDate=new Date()] Reference date (YYYY-MM-DD or Date object)
 * @returns {number} Non-negative calendar days
 */
export const getCalendarDaysElapsed = (startDate, referenceDate = new Date()) => {
  const start = parseDateKey(startDate);
  const end = parseDateKey(referenceDate);
  const diffTime = end.getTime() - start.getTime();
  if (diffTime <= 0) return 0;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Retrieves the IOF percentage for a given number of calendar days.
 * Returns 0% on day 30 and beyond.
 *
 * @param {number} daysElapsed
 * @returns {number} IOF percentage (0 to 96)
 */
export const getIOFRate = (daysElapsed) => {
  const days = Math.max(0, Math.floor(Number(daysElapsed) || 0));
  if (days >= 30) return 0;
  return IOF_TABLE[days] ?? 0;
};

/**
 * Retrieves the regressive Income Tax (IR) percentage based on calendar days elapsed.
 * - Up to 180 days: 22.5%
 * - 181 to 360 days: 20.0%
 * - 361 to 720 days: 17.5%
 * - Above 720 days: 15.0%
 *
 * @param {number} daysElapsed
 * @returns {number} IR percentage (15 to 22.5)
 */
export const getIRRate = (daysElapsed) => {
  const days = Math.max(0, Math.floor(Number(daysElapsed) || 0));
  if (days <= 180) return 22.5;
  if (days <= 360) return 20.0;
  if (days <= 720) return 17.5;
  return 15.0;
};

/**
 * Calculates net yield and tax breakdown (IOF and IR) for an asset.
 * In Brazilian legislation, IOF is deducted first from gross profits;
 * IR is then calculated on the remaining taxable profit.
 *
 * @param {number} grossYield Total accumulated gross income or daily income
 * @param {Date|string|number} dateOrDays Investment date (string/Date) or number of days elapsed
 * @param {Date|string} [referenceDate=new Date()] Reference date if first param is a date
 * @returns {{
 *   grossYield: number,
 *   daysElapsed: number,
 *   iofRate: number,
 *   iofAmount: number,
 *   taxableYield: number,
 *   irRate: number,
 *   irAmount: number,
 *   totalTax: number,
 *   netYield: number,
 *   effectiveTaxRate: number
 * }}
 */
export const calculateTaxBreakdown = (grossYield, dateOrDays, referenceDate = new Date()) => {
  const gross = Math.max(0, Number(grossYield) || 0);
  const daysElapsed = typeof dateOrDays === 'number'
    ? Math.max(0, Math.floor(dateOrDays))
    : getCalendarDaysElapsed(dateOrDays, referenceDate);

  const iofRate = getIOFRate(daysElapsed);
  const iofAmount = gross * (iofRate / 100);

  const taxableYield = Math.max(0, gross - iofAmount);
  const irRate = getIRRate(daysElapsed);
  const irAmount = taxableYield * (irRate / 100);

  const totalTax = iofAmount + irAmount;
  const netYield = Math.max(0, gross - totalTax);
  const effectiveTaxRate = gross > 0 ? (totalTax / gross) * 100 : 0;

  return {
    grossYield: gross,
    daysElapsed,
    iofRate,
    iofAmount,
    taxableYield,
    irRate,
    irAmount,
    totalTax,
    netYield,
    effectiveTaxRate
  };
};
