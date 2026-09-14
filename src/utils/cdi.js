export const DEFAULT_CDI_RATE = 0.051660;
export const CDI_BUSINESS_DAYS = 252;
export const CDI_LATEST_API_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json';
export const CDI_CACHE_KEY = 'kyos-cdi-cache';
export const LATEST_CDI_KEY = 'kyos-latest-cdi';

/**
 * Computes daily monetary return based on invested amount, yield rate (%), and daily CDI rate (%).
 * Formula: investedAmount * (yieldRate / 100) * (cdiRate / 100)
 *
 * @param {number} investedAmount
 * @param {number} yieldRate
 * @param {number} cdiRate
 * @returns {number}
 */
export const calculateDailyYield = (investedAmount, yieldRate, cdiRate) => {
  const amount = Number(investedAmount) || 0;
  const yieldPct = Number(yieldRate) || 0;
  const cdiPct = Number(cdiRate) || 0;
  return amount * (yieldPct / 100) * (cdiPct / 100);
};

/**
 * Converts daily CDI rate to equivalent annualized percentage.
 *
 * @param {number} dailyRate
 * @returns {number}
 */
export const calculateAnnualizedCDI = (dailyRate) => {
  const rate = Number(dailyRate) || 0;
  return ((1 + rate / 100) ** CDI_BUSINESS_DAYS - 1) * 100;
};

/**
 * Retrieves the local cache of historical CDI rates.
 * @returns {Record<string, number>}
 */
export const getCDICache = () => {
  try {
    const raw = window.localStorage.getItem(CDI_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

/**
 * Fetches the latest published CDI rate from Banco Central do Brasil SGS Series 12.
 *
 * @param {number} fallbackRate
 * @returns {Promise<number>}
 */
export const fetchLatestCDI = async (fallbackRate = DEFAULT_CDI_RATE) => {
  try {
    const response = await fetch(CDI_LATEST_API_URL);
    if (!response.ok) throw new Error(`Latest CDI request failed with status: ${response.status}`);
    const data = await response.json();
    const rate = Number(String(data[0]?.valor || '').replace(',', '.'));
    if (Number.isFinite(rate)) {
      try {
        window.localStorage.setItem(LATEST_CDI_KEY, String(rate));
      } catch {
        // Ignore localStorage quota errors
      }
      return rate;
    }
  } catch {
    // Fall back to cached latest rate or constant fallback
    try {
      const cached = Number(window.localStorage.getItem(LATEST_CDI_KEY));
      if (Number.isFinite(cached) && cached > 0) return cached;
    } catch {
      // Ignore error
    }
  }
  return fallbackRate;
};

/**
 * Fetches daily CDI rate from BCB SGS Series 12 for a specific date (YYYY-MM-DD).
 * Falls back to the latest available CDI rate or fallbackRate if the historical day endpoint fails.
 *
 * @param {string} dateStr Format YYYY-MM-DD
 * @param {number} fallbackRate
 * @returns {Promise<number>}
 */
export const fetchHistoricalCDI = async (dateStr, fallbackRate = DEFAULT_CDI_RATE) => {
  const cache = getCDICache();
  if (Number.isFinite(cache[dateStr])) {
    return cache[dateStr];
  }

  const [year, month, day] = dateStr.split('-');
  const formattedDate = `${day}/${month}/${year}`;
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${formattedDate}&dataFinal=${formattedDate}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Historical CDI request failed with status: ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const rate = Number(String(data[0]?.valor || '').replace(',', '.'));
      if (Number.isFinite(rate)) {
        try {
          window.localStorage.setItem(CDI_CACHE_KEY, JSON.stringify({ ...cache, [dateStr]: rate }));
        } catch {
          // Ignore localStorage quota errors
        }
        return rate;
      }
    }
  } catch {
    // Fall back to latest available CDI rate
  }

  const latestRate = await fetchLatestCDI(fallbackRate);
  return latestRate;
};
