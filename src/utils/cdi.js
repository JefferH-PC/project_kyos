import { getDateKey, isValidDateKey, getAccrualBusinessDays } from './calendar';

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
export const HISTORICAL_CDI_BENCHMARKS = {
  2010: 0.0366,
  2011: 0.0429,
  2012: 0.0315,
  2013: 0.0308,
  2014: 0.040741,
  2015: 0.049353,
  2016: 0.052009,
  2017: 0.037576,
  2018: 0.024695,
  2019: 0.022975,
  2020: 0.010805,
  2021: 0.017165,
  2022: 0.046327,
  2023: 0.048651,
  2024: 0.040168,
  2025: 0.044095,
  2026: 0.051660
};

/**
 * Returns the best fallback CDI daily rate for a given date based on official historical yearly benchmarks.
 *
 * @param {string} dateStr Format YYYY-MM-DD
 * @param {number} defaultRate
 * @returns {number}
 */
export const getHistoricalFallbackRateForDate = (dateStr, defaultRate = DEFAULT_CDI_RATE) => {
  if (typeof dateStr === 'string' && dateStr.length >= 4) {
    const year = Number(dateStr.slice(0, 4));
    const currentYear = new Date().getFullYear();
    if (year === currentYear && Number.isFinite(defaultRate) && defaultRate > 0) {
      return defaultRate;
    }
    if (HISTORICAL_CDI_BENCHMARKS[year] !== undefined) {
      return HISTORICAL_CDI_BENCHMARKS[year];
    }
  }
  return defaultRate;
};

/**
 * Fetches daily CDI rate from BCB SGS Series 12 for a specific date (YYYY-MM-DD).
 * Falls back to local benchmark or latest available CDI rate if the endpoint fails.
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
    // Fall back to benchmark rate or latest rate
  }

  const benchmarkRate = getHistoricalFallbackRateForDate(dateStr, fallbackRate);
  return benchmarkRate;
};

/**
 * Fetches historical CDI rates for a range of dates from Banco Central do Brasil.
 * Splits into annual chunks to avoid BCB 406 payload limit errors.
 * Caches all retrieved days into localStorage under CDI_CACHE_KEY.
 *
 * @param {string} startDateKey YYYY-MM-DD
 * @param {string} endDateKey YYYY-MM-DD
 * @param {number} fallbackRate
 * @returns {Promise<Record<string, number>>}
 */
export const fetchCDIRatesForDateRange = async (startDateKey, endDateKey, fallbackRate = DEFAULT_CDI_RATE) => {
  const cache = getCDICache();
  const startYear = Number(startDateKey.slice(0, 4));
  const endYear = Number(endDateKey.slice(0, 4));

  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    return cache;
  }

  const minYear = Math.min(startYear, endYear);
  const maxYear = Math.max(startYear, endYear);
  const updatedCache = { ...cache };
  let hasNewData = false;

  for (let year = minYear; year <= maxYear; year += 1) {
    const isStartYear = year === minYear;
    const isEndYear = year === maxYear;

    const startDay = isStartYear ? startDateKey.slice(8, 10) : '01';
    const startMonth = isStartYear ? startDateKey.slice(5, 7) : '01';
    const endDay = isEndYear ? endDateKey.slice(8, 10) : '31';
    const endMonth = isEndYear ? endDateKey.slice(5, 7) : '12';

    const dataInicial = `${startDay}/${startMonth}/${year}`;
    const dataFinal = `${endDay}/${endMonth}/${year}`;
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`;

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item && item.data && item.valor) {
              const [d, m, y] = item.data.split('/');
              const dateKey = `${y}-${m}-${d}`;
              const rate = Number(String(item.valor).replace(',', '.'));
              if (Number.isFinite(rate)) {
                updatedCache[dateKey] = rate;
                hasNewData = true;
              }
            }
          }
        }
      }
    } catch {
      // Handled gracefully via fallback
    }
  }

  if (hasNewData) {
    try {
      window.localStorage.setItem(CDI_CACHE_KEY, JSON.stringify(updatedCache));
    } catch {
      // Ignore quota errors
    }
  }

  return updatedCache;
};

/**
 * Accrues daily yields for an asset from its creationDate up to targetDateKey
 * across all valid business days, compounding and generating income history.
 * Uses exact historical rates from cache or accurate benchmark rates per year.
 *
 * @param {Object} asset Asset with initialInvestedAmount/investedAmount, yieldRate, and creationDate
 * @param {string} targetDateKey Reference date key YYYY-MM-DD (typically today/simulatedDate)
 * @param {Array} holidays Array of holiday dates or objects
 * @param {number} fallbackCdi
 * @param {Record<string, number>} [ratesMap] Optional pre-loaded map of rates
 * @returns {Object} Updated asset with computed investedAmount, totalIncome, and incomeHistory
 */
export const calculateAssetAccrualSinceDate = (
  asset,
  targetDateKey,
  holidays = [],
  fallbackCdi = DEFAULT_CDI_RATE,
  ratesMap = null
) => {
  const invested = Number(asset.investedAmount) || 0;
  const prevIncome = Number(asset.totalIncome) || 0;
  const initial = Number(asset.initialInvestedAmount ?? (prevIncome > 0 ? Math.max(0, invested - prevIncome) : invested)) || 0;
  const yieldRate = Number(asset.yieldRate) || 0;
  if (yieldRate <= 0) {
    return asset;
  }

  const creationDate = asset.creationDate;

  if (!creationDate || !isValidDateKey(creationDate) || !targetDateKey) {
    return asset;
  }

  if (creationDate >= targetDateKey) {
    return {
      ...asset,
      investedAmount: initial,
      initialInvestedAmount: initial,
      totalIncome: 0,
      incomeHistory: {}
    };
  }

  const businessDays = getAccrualBusinessDays(creationDate, targetDateKey, holidays);
  const cdiCache = ratesMap || getCDICache();

  let currentPrincipal = initial;
  let totalIncome = 0;
  const incomeHistory = {};

  for (const day of businessDays) {
    const dayKey = getDateKey(day);
    const dayRate = cdiCache[dayKey] ?? getHistoricalFallbackRateForDate(dayKey, fallbackCdi);
    const income = calculateDailyYield(currentPrincipal, yieldRate, dayRate);
    incomeHistory[dayKey] = income;
    currentPrincipal += income;
    totalIncome += income;
  }

  return {
    ...asset,
    investedAmount: currentPrincipal,
    initialInvestedAmount: initial,
    totalIncome,
    incomeHistory
  };
};

/**
 * Synchronizes all existing assets from their creation dates up to targetDateKey,
 * recalculating compound interest, total income, and income histories coherently.
 *
 * @param {Array<Object>} assets Array of asset objects
 * @param {string} targetDateKey Reference date (e.g. today)
 * @param {Array} holidays Array of holiday objects or strings
 * @param {number} fallbackCdi Live or default CDI rate
 * @param {Record<string, number>} [ratesMap] Pre-fetched historical rates
 * @returns {Array<Object>} Synchronized assets
 */
export const synchronizeAllAssetsIncomes = (
  assets = [],
  targetDateKey,
  holidays = [],
  fallbackCdi = DEFAULT_CDI_RATE,
  ratesMap = null
) => {
  if (!Array.isArray(assets)) return [];
  return assets.map((asset) => {
    return calculateAssetAccrualSinceDate(
      asset,
      targetDateKey,
      holidays,
      fallbackCdi,
      ratesMap
    );
  });
};

