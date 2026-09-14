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

  if (!holidays) {
    return true;
  }

  if (holidays instanceof Set) {
    return !holidays.has(dateStr);
  }

  if (Array.isArray(holidays)) {
    if (holidays.length === 0) return true;
    if (typeof holidays[0] === 'string') {
      return !holidays.includes(dateStr);
    }
    return !holidays.some((item) => item && item.date === dateStr);
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
