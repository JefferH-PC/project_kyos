import { OFFICIAL_HISTORICAL_CDI_RATES, LATEST_BUNDLED_CDI_DATE } from './historicalCdiData';

export const HOLIDAYS_CACHE_KEY = 'kyos-holidays-cache';

export const getDateKey = (date) => {
  if (typeof date === 'string') return date.slice(0, 10);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isValidDateKey = (dateKey) => {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

export const parseDateKey = (dateKey) => {
  if (dateKey instanceof Date) return new Date(dateKey.getFullYear(), dateKey.getMonth(), dateKey.getDate());
  const [year, month, day] = String(dateKey).split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const shiftDate = (date, amount) => {
  const d = parseDateKey(date);
  d.setDate(d.getDate() + amount);
  return d;
};

/**
 * Reads the cached Brazilian holidays from localStorage.
 * @returns {Record<string, Array<{ date: string, name: string, type?: string }>>}
 */
export const getHolidaysCache = () => {
  try {
    const raw = window.localStorage.getItem(HOLIDAYS_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

/**
 * Fetches Brazilian national holidays for a given year from BrasilAPI,
 * caching results in localStorage under 'kyos-holidays-cache'.
 * If the fetch fails and cached data exists, returns cached data.
 * If fetch fails and no cache exists, throws an error.
 *
 * @param {number|string} year
 * @returns {Promise<Array<{ date: string, name: string, type?: string }>>}
 */
export const fetchBrazilianHolidays = async (year) => {
  const yearKey = String(year);
  const cache = getHolidaysCache();

  if (Array.isArray(cache[yearKey]) && cache[yearKey].length > 0) {
    return cache[yearKey];
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${yearKey}`);
    if (!response.ok) {
      throw new Error(`BrasilAPI holiday request failed with status: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      const updatedCache = { ...cache, [yearKey]: data };
      try {
        window.localStorage.setItem(HOLIDAYS_CACHE_KEY, JSON.stringify(updatedCache));
      } catch {
        // Ignore localStorage quota errors
      }
      return data;
    }
    throw new Error('Invalid holiday data structure received from BrasilAPI');
  } catch (error) {
    if (Array.isArray(cache[yearKey]) && cache[yearKey].length > 0) {
      return cache[yearKey];
    }
    throw error;
  }
};

/**
 * Returns fixed national holidays for a given year as offline fallback.
 * @param {number|string} year
 * @returns {Array<{ date: string, name: string }>}
 */
export const getFixedNationalHolidays = (year) => {
  const y = Number(year);
  if (!Number.isFinite(y)) return [];
  return [
    { date: `${y}-01-01`, name: 'Confraternização Universal' },
    { date: `${y}-04-21`, name: 'Tiradentes' },
    { date: `${y}-05-01`, name: 'Dia do Trabalho' },
    { date: `${y}-09-07`, name: 'Independência do Brasil' },
    { date: `${y}-10-12`, name: 'Nossa Senhora Aparecida' },
    { date: `${y}-11-02`, name: 'Finados' },
    { date: `${y}-11-15`, name: 'Proclamação da República' },
    { date: `${y}-11-20`, name: 'Dia da Consciência Negra' },
    { date: `${y}-12-25`, name: 'Natal' }
  ];
};

/**
 * Fetches holidays across multiple years, using cached data where available.
 *
 * @param {number|string} startYear
 * @param {number|string} endYear
 * @returns {Promise<Array<{ date: string, name: string, type?: string }>>}
 */
export const fetchHolidaysForYearRange = async (startYear, endYear) => {
  const start = Math.min(Number(startYear), Number(endYear));
  const end = Math.max(Number(startYear), Number(endYear));
  const allHolidays = [];

  for (let y = start; y <= end; y += 1) {
    try {
      const holidays = await fetchBrazilianHolidays(y);
      if (Array.isArray(holidays)) {
        allHolidays.push(...holidays);
      }
    } catch {
      allHolidays.push(...getFixedNationalHolidays(y));
    }
  }

  return allHolidays;
};

/**
 * Checks if a given date is a Brazilian business day (not weekend and not a holiday).
 *
 * @param {Date|string} date
 * @param {Set<string>|Array<string>|Array<{ date: string }>} holidays
 * @returns {boolean}
 */
export const isBusinessDay = (date, holidays) => {
  const dateObj = parseDateKey(date);
  const dayOfWeek = dateObj.getDay();

  // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  const dateStr = getDateKey(dateObj);

  if (holidays instanceof Set) {
    if (holidays.has(dateStr)) return false;
  } else if (Array.isArray(holidays) && holidays.length > 0) {
    if (typeof holidays[0] === 'string') {
      if (holidays.includes(dateStr)) return false;
    } else if (holidays.some((item) => item && item.date === dateStr)) {
      return false;
    }
  }

  // Official ground truth: if within verified BCB series 12 dataset, exact presence verifies banking business day
  if (dateStr <= LATEST_BUNDLED_CDI_DATE && dateStr >= '2010-01-04') {
    return OFFICIAL_HISTORICAL_CDI_RATES[dateStr] !== undefined;
  }

  return true;
};

/**
 * Returns an array of Date objects representing valid business days within [startDate, endDate] (inclusive).
 *
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @param {Set<string>|Array<string>|Array<{ date: string }>} holidays
 * @returns {Date[]}
 */
export const getBusinessDaysInRange = (startDate, endDate, holidays) => {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  const businessDays = [];

  if (start > end) {
    return businessDays;
  }

  for (let current = new Date(start); current <= end; current = shiftDate(current, 1)) {
    if (isBusinessDay(current, holidays)) {
      businessDays.push(new Date(current));
    }
  }

  return businessDays;
};

/**
 * Calculates the exact schedule of holding days and credit dates for fixed-income accrual
 * according to B3 / CETIP Caderno de Fórmulas.
 *
 * Rules:
 * 1. An application made on a business day begins earning overnight yield from that day to the next business day.
 *    The first yield is credited on that next business day, using the CDI rate published for the application date.
 * 2. An application made on a weekend or holiday becomes effective on the next Brazilian business day.
 * 3. For each pair:
 *    - holdingDate: the business day whose CDI rate applies to the overnight holding period.
 *    - creditDate: the business day on which that overnight yield is credited to the asset balance.
 *
 * @param {Date|string} creationDate Date of deposit / investment (data da aplicação)
 * @param {Date|string} targetDate Reference date (e.g. today / simulatedDate)
 * @param {Set<string>|Array<string>|Array<{ date: string }>} [holidays=[]]
 * @returns {Array<{ creditDate: Date, holdingDate: Date }>}
 */
export const getAccrualSchedule = (creationDate, targetDate, holidays = []) => {
  if (!creationDate || !targetDate) return [];
  const start = parseDateKey(creationDate);
  const end = parseDateKey(targetDate);
  if (start >= end) return [];

  let effectiveAppDate = new Date(start);
  while (!isBusinessDay(effectiveAppDate, holidays)) {
    effectiveAppDate = shiftDate(effectiveAppDate, 1);
  }

  const allBusinessDays = getBusinessDaysInRange(effectiveAppDate, end, holidays);
  if (allBusinessDays.length <= 1) return [];

  const schedule = [];
  for (let i = 1; i < allBusinessDays.length; i += 1) {
    schedule.push({
      creditDate: allBusinessDays[i],
      holdingDate: allBusinessDays[i - 1]
    });
  }
  return schedule;
};

/**
 * Calculates the exact sequence of business days on which fixed-income yields accrue
 * and are credited, starting strictly after the effective application date up to targetDate.
 *
 * @param {Date|string} creationDate Date of deposit / investment (data da aplicação)
 * @param {Date|string} targetDate Reference date (e.g. today / simulatedDate)
 * @param {Set<string>|Array<string>|Array<{ date: string }>} [holidays=[]]
 * @returns {Date[]}
 */
export const getAccrualBusinessDays = (creationDate, targetDate, holidays = []) => {
  const schedule = getAccrualSchedule(creationDate, targetDate, holidays);
  return schedule.map((item) => item.creditDate);
};

/**
 * Resolves the latest official settled banking business day for which fixed-income
 * positions have been cleared and reflected on bank statements.
 *
 * Brazilian Banking Conventions (B3 / CETIP):
 * - On Saturdays and Sundays: clearing for Friday trades does not settle until Monday night.
 *   Bank statements and portfolio screens over the weekend display the settled position
 *   as of Thursday close (D-2).
 * - On normal business days: returns the reference date if it is a business day,
 *   or rolls back to the latest completed business day if on a holiday or weekend.
 *
 * @param {Date|string} [referenceDate] Defaults to today
 * @param {Set<string>|Array<string>|Array<{ date: string }>} [holidays=[]]
 * @returns {string} Date key YYYY-MM-DD
 */
export const getLatestSettledBankingDate = (referenceDate = new Date(), holidays = []) => {
  const dateObj = parseDateKey(referenceDate);
  const dayOfWeek = dateObj.getDay();

  if (dayOfWeek === 6) {
    // Saturday: rolls back 2 days to Thursday
    dateObj.setDate(dateObj.getDate() - 2);
  } else if (dayOfWeek === 0) {
    // Sunday: rolls back 3 days to Thursday
    dateObj.setDate(dateObj.getDate() - 3);
  }

  while (!isBusinessDay(dateObj, holidays)) {
    dateObj.setDate(dateObj.getDate() - 1);
  }

  return getDateKey(dateObj);
};


