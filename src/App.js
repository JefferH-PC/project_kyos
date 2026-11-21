import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import './App.css';
import Header from './Components/Header/Header';
import SectionButton from './Components/SectionButton/SectionButton';
import TimeArea from './Components/TimeArea/TimeArea';
import CatchUpModal from './Components/CatchUpModal/CatchUpModal';
import AboutModal from './Components/AboutModal/AboutModal';
import SyncModal from './Components/SyncModal/SyncModal';
import SimulationArea from './Components/SimulationArea/SimulationArea';
import NetWorthArea from './Components/NetWorthArea/NetWorthArea';
import BalanceArea from './Components/BalanceArea/BalanceArea';
import InvestmentsArea from './Components/InvestmentsArea/InvestmentsArea';
import { formatMoney } from './utils/formatters';
import { APP_TEXT } from './utils/translations';
import {
  getDateKey,
  parseDateKey,
  shiftDate,
  isValidDateKey,
  getBusinessDaysInRange,
  getAccrualBusinessDays,
  fetchBrazilianHolidays,
  fetchHolidaysForYearRange,
  getLatestSettledBankingDate,
  getPreviousBankingBusinessDay
} from './utils/calendar';
import {
  calculateDailyYield,
  fetchLatestCDI,
  calculateAnnualizedCDI,
  calculateAssetAccrualSinceDate,
  synchronizeAllAssetsIncomes,
  fetchCDIRatesForDateRange,
  getCDIRateForDate,
  DEFAULT_CDI_RATE,
  LATEST_CDI_KEY
} from './utils/cdi';
import { calculateTaxBreakdown } from './utils/tax';
import { distributeDailyIncome } from './utils/incomeDistribution';

const DATABASE_VERSION = 11;
const toFiniteNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const getDailyAssetIncome = (asset, cdiRate) => calculateDailyYield(asset.investedAmount, asset.yieldRate, cdiRate);

const rebuildIncomeHistory = (assets) => assets.reduce((history, asset) => {
  Object.entries(asset.incomeHistory || {}).forEach(([date, income]) => {
    history[date] = Number(history[date] || 0) + Number(income || 0);
  });
  return history;
}, {});

const normalizeIncomeHistory = (incomeHistory) => Object.entries(incomeHistory || {}).reduce((history, [date, income]) => {
  const numericIncome = Number(income);
  if (isValidDateKey(date) && Number.isFinite(numericIncome) && numericIncome >= 0) history[date] = numericIncome;
  return history;
}, {});

const defaultDatabase = {
  schemaVersion: DATABASE_VERSION,
  wishlistSlots: [],
  recoverySlots: [],
  milestone: { target: 0 },
  assets: [],
  purchasedTotal: 0,
  simulatedDate: getDateKey(new Date()),
  incomeHistory: {},
  recoverySpentTotal: 0,
  expenses: []
};

const normalizeDatabase = (parsedDatabase, resetNonAssetValues = false) => {
  const preAddedSlotIds = ['expense-default', 'ready-default', 'recovery-default'];
  const preAddedAssetIds = ['asset-1', 'asset-2', 'asset-3'];
  const parsedDate = typeof parsedDatabase.simulatedDate === 'string' && isValidDateKey(parsedDatabase.simulatedDate)
    ? parsedDatabase.simulatedDate
    : getDateKey(new Date());
  const assets = Array.isArray(parsedDatabase.assets) ? parsedDatabase.assets
    .filter((asset) => asset && typeof asset === 'object' && !preAddedAssetIds.includes(asset.id))
    .map((asset) => {
      const investedValue = Number(asset.investedAmount ?? asset.totalIncome ?? 0);
      const totalIncomeValue = Number(asset.totalIncome || 0);
      const initialValue = Number(asset.initialInvestedAmount ?? investedValue - totalIncomeValue);
      const investedAmount = Number.isFinite(investedValue) ? investedValue : 0;
      const totalIncome = Number.isFinite(totalIncomeValue) ? totalIncomeValue : 0;
      const baseAmount = Number.isFinite(initialValue) ? Math.max(initialValue, 0) : 0;
      const creationDate = typeof asset.creationDate === 'string' && isValidDateKey(asset.creationDate) ? asset.creationDate : parsedDate;
      return {
        ...asset,
        name: String(asset.name || 'Unnamed asset'),
        yieldRate: Number.isFinite(Number(asset.yieldRate)) ? Math.max(Number(asset.yieldRate), 0) : 0,
        investedAmount: Math.max(investedAmount, 0),
        initialInvestedAmount: baseAmount,
        totalIncome: Math.max(totalIncome, 0),
        incomeHistory: resetNonAssetValues ? {} : normalizeIncomeHistory(asset.incomeHistory),
        creationDate,
        applyTax: Boolean(asset.applyTax)
      };
    }) : [];

  const rawExpenses = Array.isArray(parsedDatabase.expenses) ? parsedDatabase.expenses : [];
  const expenses = resetNonAssetValues ? [] : rawExpenses
    .filter((e) => e && typeof e === 'object' && Number(e.amount) > 0)
    .map((e) => ({
      id: String(e.id || `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
      name: String(e.name || 'Expense'),
      amount: Number(e.amount),
      date: typeof e.date === 'string' && isValidDateKey(e.date) ? e.date : parsedDate,
      category: e.category === 'recovery' ? 'recovery' : 'wishlist'
    }));

  if (!resetNonAssetValues && expenses.length === 0 && Number(parsedDatabase.purchasedTotal) > 0) {
    expenses.push({
      id: 'legacy-purchased-total',
      name: 'Purchased Items (Legacy)',
      amount: Number(parsedDatabase.purchasedTotal),
      date: parsedDate,
      category: 'wishlist'
    });
  }

  return {
    ...defaultDatabase,
    ...parsedDatabase,
    schemaVersion: DATABASE_VERSION,
    wishlistSlots: resetNonAssetValues ? [] : Array.isArray(parsedDatabase.wishlistSlots) ? parsedDatabase.wishlistSlots.filter((slot) => slot && typeof slot === 'object' && !preAddedSlotIds.includes(slot.id)) : [],
    recoverySlots: resetNonAssetValues ? [] : Array.isArray(parsedDatabase.recoverySlots) ? parsedDatabase.recoverySlots.filter((slot) => slot && typeof slot === 'object' && !preAddedSlotIds.includes(slot.id)) : [],
    assets,
    milestone: resetNonAssetValues ? { ...defaultDatabase.milestone } : { ...defaultDatabase.milestone, ...(parsedDatabase.milestone || {}), target: Math.max(toFiniteNumber(parsedDatabase.milestone?.target), 0) },
    purchasedTotal: resetNonAssetValues ? 0 : Math.max(toFiniteNumber(parsedDatabase.purchasedTotal), 0),
    recoverySpentTotal: resetNonAssetValues ? 0 : Math.max(toFiniteNumber(parsedDatabase.recoverySpentTotal), 0),
    expenses,
    simulatedDate: parsedDate,
    incomeHistory: resetNonAssetValues ? {} : rebuildIncomeHistory(assets)
  };
};

const readDatabase = () => {
  try {
    const savedDatabase = window.localStorage.getItem('kyos-database');
    if (!savedDatabase) return defaultDatabase;
    const parsedDatabase = JSON.parse(savedDatabase);
    return normalizeDatabase(parsedDatabase, false);
  } catch {
    return defaultDatabase;
  }
};

function App() {
  const [activeSection, setActiveSection] = useState('Net Worth');
  const [isLightTheme, setIsLightTheme] = useState(() => {
    try {
      return window.localStorage.getItem('kyos-theme') === 'light';
    } catch {
      return false;
    }
  });
  const [locale, setLocale] = useState(() => {
    try {
      return window.localStorage.getItem('kyos-locale') === 'pt' ? 'pt' : 'en';
    } catch {
      return 'en';
    }
  });
  const [mobileArea, setMobileArea] = useState('dashboard');
  const [toastMessage, setToastMessage] = useState('');
  const [database, setDatabase] = useState(readDatabase);
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [assetForm, setAssetForm] = useState(() => ({
    name: '',
    yieldRate: '',
    investedAmount: '',
    creationDate: '',
    applyTax: false
  }));
  const [cdiRate, setCdiRate] = useState(() => {
    try {
      const cached = Number(window.localStorage.getItem(LATEST_CDI_KEY));
      if (Number.isFinite(cached) && cached > 0) return cached;
    } catch {}
    return DEFAULT_CDI_RATE;
  });
  const [areValuesVisible, setAreValuesVisible] = useState(true);
  const [holidaysList, setHolidaysList] = useState([]);
  const [holidaysError, setHolidaysError] = useState(false);
  const [catchUpModalData, setCatchUpModalData] = useState({
    isOpen: false,
    businessDays: 0,
    calendarDays: 0,
    totalAccrued: 0,
    completedSlots: []
  });
  const [syncModalData, setSyncModalData] = useState({
    isOpen: false,
    targetIncome: 0,
    targetTotal: 0,
    initialPrincipal: 0,
    businessDays: 0,
    referenceDate: ''
  });
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editAssetForm, setEditAssetForm] = useState({
    name: '',
    yieldRate: '',
    investedAmount: '',
    creationDate: '',
    applyTax: false
  });
  const [selectedExpenseYear, setSelectedExpenseYear] = useState('all');

  const hasRunCatchUpRef = useRef(false);
  const isCatchingUpRef = useRef(false);
  const cdiRateRef = useRef(cdiRate);
  cdiRateRef.current = cdiRate;
  const toastTimeoutRef = useRef(null);

  const t = APP_TEXT[locale] || APP_TEXT.en;

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3200);
  }, []);

  useEffect(() => {
    const handleAppInstalled = () => {
      showToast(locale === 'pt' ? 'Aplicativo instalado com sucesso!' : 'App installed successfully!');
    };

    const handleOffline = () => {
      showToast(locale === 'pt' ? 'Modo offline ativo - dados salvos localmente' : 'Offline mode active - data saved locally');
    };

    const handleOnline = () => {
      showToast(locale === 'pt' ? 'Conexão online restabelecida' : 'Online connection restored');
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [locale, showToast]);

  useEffect(() => {
    window.localStorage.setItem('kyos-database', JSON.stringify(database));
  }, [database]);

  useEffect(() => {
    try {
      window.localStorage.setItem('kyos-locale', locale);
    } catch {
      // Ignore storage errors for non-persistent environments.
    }
  }, [locale]);

  useEffect(() => {
    try {
      window.localStorage.setItem('kyos-theme', isLightTheme ? 'light' : 'dark');
    } catch {
      // Ignore storage errors for non-persistent environments.
    }
  }, [isLightTheme]);

  // Initial CDI rate refresh and daily interval
  useEffect(() => {
    let isCancelled = false;
    const loadCdiRate = () => {
      fetchLatestCDI(DEFAULT_CDI_RATE)
        .then((dailyRate) => {
          if (!isCancelled && Number.isFinite(dailyRate)) setCdiRate(dailyRate);
        })
        .catch(() => {
          // Keep fallback
        });
    };
    loadCdiRate();
    const dailyRefresh = window.setInterval(loadCdiRate, 24 * 60 * 60 * 1000);
    return () => {
      isCancelled = true;
      window.clearInterval(dailyRefresh);
    };
  }, []);

  // Daily auto-update (Catch-up system)
  const processMissedDays = useCallback(async (holidays, currentCdi) => {
    const today = new Date();
    const currentDateKey = getDateKey(today);
    let lastOpenedKey = window.localStorage.getItem('kyos-last-opened-date');

    if (!lastOpenedKey) {
      const existingDate = database.simulatedDate;
      if (existingDate && existingDate < currentDateKey) {
        lastOpenedKey = existingDate;
      } else {
        window.localStorage.setItem('kyos-last-opened-date', currentDateKey);
        setDatabase((cur) => ({ ...cur, simulatedDate: currentDateKey }));
        try {
          const curDb = readDatabase();
          window.localStorage.setItem('kyos-database', JSON.stringify({ ...curDb, simulatedDate: currentDateKey }));
        } catch {}
        return;
      }
    }

    if (lastOpenedKey >= currentDateKey) {
      if (database.simulatedDate < currentDateKey) {
        const curDb = readDatabase();
        const updated = { ...curDb, simulatedDate: currentDateKey };
        setDatabase(updated);
        try {
          window.localStorage.setItem('kyos-database', JSON.stringify(updated));
        } catch {}
      }
      return;
    }

    const startDate = shiftDate(parseDateKey(lastOpenedKey), 1);
    const endDate = parseDateKey(currentDateKey);
    const calendarDays = Math.max(1, Math.round((endDate.getTime() - parseDateKey(lastOpenedKey).getTime()) / (1000 * 60 * 60 * 24)));
    const businessDaysList = getBusinessDaysInRange(startDate, endDate, holidays);

    if (businessDaysList.length === 0) {
      window.localStorage.setItem('kyos-last-opened-date', currentDateKey);
      const curDb = readDatabase();
      const updated = { ...curDb, simulatedDate: currentDateKey };
      setDatabase(updated);
      try {
        window.localStorage.setItem('kyos-database', JSON.stringify(updated));
      } catch {}
      return;
    }

    window.localStorage.setItem('kyos-last-opened-date', currentDateKey);

    const earliestHoldingDay = getPreviousBankingBusinessDay(businessDaysList[0], holidays);
    const startRateKey = getDateKey(earliestHoldingDay);
    const endKey = getDateKey(endDate);
    const dayRates = await fetchCDIRatesForDateRange(startRateKey, endKey, currentCdi);

    const currentDb = readDatabase();
    let assets = JSON.parse(JSON.stringify(currentDb.assets || []));
    let wishlistSlots = JSON.parse(JSON.stringify(currentDb.wishlistSlots || []));
    let recoverySlots = JSON.parse(JSON.stringify(currentDb.recoverySlots || []));
    let recoverySpentTotal = Number(currentDb.recoverySpentTotal || 0);
    let expenses = Array.isArray(currentDb.expenses) ? [...currentDb.expenses] : [];

    let accruedSum = 0;
    const completed = [];

    for (const day of businessDaysList) {
      const dayKey = getDateKey(day);
      const holdingDay = getPreviousBankingBusinessDay(day, holidays);
      const holdingDayKey = getDateKey(holdingDay);
      const dayRate = getCDIRateForDate(holdingDayKey, currentCdi, dayRates);
      let dayYieldForDistribution = 0;

      const updatedAssets = [];
      for (const asset of assets) {
        if (asset.incomeHistory && typeof asset.incomeHistory[dayKey] === 'number') {
          updatedAssets.push(asset);
          continue;
        }

        // B3 Schedule: Overnight holding occurs on holdingDayKey; if deposited after holding day, Day 0 yields R$ 0,00
        if (asset.creationDate && asset.creationDate > holdingDayKey) {
          updatedAssets.push(asset);
          continue;
        }

        const income = calculateDailyYield(asset.investedAmount, asset.yieldRate, dayRate);
        const netIncome = asset.applyTax
          ? calculateTaxBreakdown(income, asset.creationDate, day).netYield
          : income;

        const effectiveIncome = asset.applyTax ? netIncome : income;

        dayYieldForDistribution += effectiveIncome;
        accruedSum += effectiveIncome;

        updatedAssets.push({
          ...asset,
          investedAmount: Number(asset.investedAmount || 0) + effectiveIncome,
          totalIncome: Number(asset.totalIncome || 0) + effectiveIncome,
          incomeHistory: {
            ...(asset.incomeHistory || {}),
            [dayKey]: income
          }
        });
      }
      assets = updatedAssets;

      if (dayYieldForDistribution > 0) {
        const distributionResult = distributeDailyIncome({
          recoverySlots,
          wishlistSlots,
          dailyYield: dayYieldForDistribution
        });
        recoverySlots = distributionResult.recoverySlots;
        wishlistSlots = distributionResult.wishlistSlots;
        if (distributionResult.completedSlots.length > 0) {
          completed.push(...distributionResult.completedSlots);
          for (const comp of distributionResult.completedSlots) {
            if (comp.type === 'recovery') {
              expenses.unshift({
                id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: comp.name || 'Recovery item',
                amount: Number(comp.price || 0),
                date: dayKey,
                category: 'recovery'
              });
            }
          }
        }
      }
    }

    const updatedDatabase = {
      ...currentDb,
      assets,
      wishlistSlots,
      recoverySlots,
      recoverySpentTotal,
      expenses,
      simulatedDate: currentDateKey,
      incomeHistory: rebuildIncomeHistory(assets)
    };

    setDatabase(updatedDatabase);
    try {
      window.localStorage.setItem('kyos-database', JSON.stringify(updatedDatabase));
    } catch {
      // Ignore storage errors
    }

    setCatchUpModalData({
      isOpen: true,
      businessDays: businessDaysList.length,
      calendarDays,
      totalAccrued: accruedSum,
      completedSlots: completed
    });
  }, [database.simulatedDate]);

  const syncExistingAssetsIncomes = useCallback(async (holidays, currentCdi) => {
    const today = new Date();
    const currentDateKey = getDateKey(today);
    const currentDb = readDatabase();
    const assets = currentDb.assets || [];
    if (!Array.isArray(assets) || assets.length === 0) return currentDb;

    const settledBankingDate = getLatestSettledBankingDate(currentDateKey, holidays);
    const targetDateKey = (currentDb.simulatedDate && isValidDateKey(currentDb.simulatedDate) && currentDb.simulatedDate > currentDateKey)
      ? currentDb.simulatedDate
      : settledBankingDate;

    let earliestDate = targetDateKey;
    for (const asset of assets) {
      if (asset.creationDate && isValidDateKey(asset.creationDate) && asset.creationDate < earliestDate) {
        earliestDate = asset.creationDate;
      }
    }

    const startYear = parseDateKey(earliestDate).getFullYear();
    const endYear = parseDateKey(targetDateKey).getFullYear();
    let rangeHolidays = holidays || [];
    if (startYear < endYear) {
      try {
        const h = await fetchHolidaysForYearRange(startYear, endYear);
        if (Array.isArray(h) && h.length > 0) rangeHolidays = h;
      } catch {
        // Non-blocking fallback
      }
    }

    let cdiRates = {};
    if (earliestDate < targetDateKey) {
      try {
        cdiRates = await fetchCDIRatesForDateRange(earliestDate, targetDateKey, currentCdi);
      } catch {
        // Non-blocking fallback
      }
    }

    const updatedAssets = synchronizeAllAssetsIncomes(
      assets,
      targetDateKey,
      rangeHolidays,
      currentCdi,
      cdiRates
    );

    const updatedIncomeHistory = rebuildIncomeHistory(updatedAssets);
    const updatedDb = {
      ...currentDb,
      assets: updatedAssets,
      simulatedDate: (currentDb.simulatedDate && currentDb.simulatedDate > currentDateKey)
        ? currentDb.simulatedDate
        : currentDateKey,
      incomeHistory: updatedIncomeHistory
    };

    setDatabase(updatedDb);
    try {
      window.localStorage.setItem('kyos-database', JSON.stringify(updatedDb));
      window.localStorage.setItem('kyos-last-opened-date', currentDateKey);
    } catch {
      // Ignore localStorage errors
    }
    return updatedDb;
  }, []);

  const loadHolidaysAndCatchUp = useCallback(async (forced = false) => {
    if (isCatchingUpRef.current) return;
    if (!forced && hasRunCatchUpRef.current) return;
    isCatchingUpRef.current = true;
    hasRunCatchUpRef.current = true;

    const today = new Date();
    const currentYear = today.getFullYear();
    let holidays = [];

    try {
      holidays = await fetchBrazilianHolidays(currentYear);
      const lastOpened = window.localStorage.getItem('kyos-last-opened-date');
      if (lastOpened) {
        const lastYear = parseDateKey(lastOpened).getFullYear();
        if (lastYear !== currentYear) {
          try {
            const rangeHolidays = await fetchHolidaysForYearRange(Math.min(lastYear, currentYear), Math.max(lastYear, currentYear));
            holidays = rangeHolidays;
          } catch {
            // Non-blocking
          }
        }
      }
      setHolidaysList(holidays);
      setHolidaysError(false);
    } catch (err) {
      setHolidaysError(true);
      isCatchingUpRef.current = false;
      return;
    }

    try {
      let liveCdi = cdiRateRef.current;
      try {
        const fetchedCdi = await fetchLatestCDI(cdiRateRef.current);
        if (Number.isFinite(fetchedCdi) && fetchedCdi > 0) {
          liveCdi = fetchedCdi;
          setCdiRate(fetchedCdi);
          cdiRateRef.current = fetchedCdi;
        }
      } catch {
        // Non-blocking fallback
      }
      await processMissedDays(holidays, liveCdi);
      await syncExistingAssetsIncomes(holidays, liveCdi);
    } finally {
      isCatchingUpRef.current = false;
    }
  }, [processMissedDays, syncExistingAssetsIncomes]);

  useEffect(() => {
    loadHolidaysAndCatchUp();
  }, [loadHolidaysAndCatchUp]);

  // Ensure days pass in real time when app is kept open across midnight or tab is focused
  useEffect(() => {
    const checkDateProgression = () => {
      const todayKey = getDateKey(new Date());
      const lastOpened = window.localStorage.getItem('kyos-last-opened-date');
      if (lastOpened && lastOpened < todayKey) {
        loadHolidaysAndCatchUp(true);
      }
    };

    const interval = window.setInterval(checkDateProgression, 60 * 1000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDateProgression();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkDateProgression);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkDateProgression);
    };
  }, [loadHolidaysAndCatchUp]);

  // JSON Export
  const handleExportJSON = () => {
    try {
      const exportData = {
        app: 'Kyos',
        version: DATABASE_VERSION,
        exportedAt: new Date().toISOString(),
        database: {
          ...database,
          lastOpenedDate: window.localStorage.getItem('kyos-last-opened-date') || database.simulatedDate
        }
      };
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(blob)
        : `data:application/json;charset=utf-8,${encodeURIComponent(jsonStr)}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `kyos-backup-${database.simulatedDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (typeof URL.revokeObjectURL === 'function' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      showToast(t.exportSuccess || 'Backup exported successfully!');
    } catch {
      // Ignore
    }
  };

  // JSON Import
  const handleImportJSON = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        const parsed = JSON.parse(String(content));
        const rawDb = parsed.database || parsed;

        if (!rawDb || typeof rawDb !== 'object') {
          throw new Error('Invalid format');
        }

        const normalized = normalizeDatabase(rawDb);
        setDatabase(normalized);
        window.localStorage.setItem('kyos-database', JSON.stringify(normalized));
        if (rawDb.lastOpenedDate && isValidDateKey(rawDb.lastOpenedDate)) {
          window.localStorage.setItem('kyos-last-opened-date', rawDb.lastOpenedDate);
        }
        showToast(t.importSuccess || 'Backup imported successfully!');
      } catch {
        showToast(t.importError || 'Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const wishlistTotal = database.wishlistSlots.reduce((total, slot) => total + Math.max(toFiniteNumber(slot.price), 0), 0);
  const recoveryTotal = database.recoverySlots.reduce((total, slot) => total + Math.max(toFiniteNumber(slot.price), 0), 0);
  const investedTotal = database.assets.reduce((total, asset) => total + Math.max(toFiniteNumber(asset.investedAmount), 0), 0);
  const topInvestment = database.assets.reduce((top, asset) => toFiniteNumber(asset.investedAmount) > toFiniteNumber(top.investedAmount) ? asset : top, { name: t.none || 'None', investedAmount: 0 });
  const actualDate = parseDateKey(database.simulatedDate);
  const totalCdiRate = calculateAnnualizedCDI(cdiRate);

  // Unified net daily income history (consistently accounts for tax mode)
  const netDailyHistory = useMemo(() => {
    const map = {};
    (database.assets || []).forEach((asset) => {
      Object.entries(asset.incomeHistory || {}).forEach(([dateKey, grossVal]) => {
        const gross = Number(grossVal || 0);
        if (gross <= 0) return;
        let net = gross;
        if (asset.applyTax) {
          const d = parseDateKey(dateKey);
          net = calculateTaxBreakdown(gross, asset.creationDate, d).netYield;
        }
        map[dateKey] = (map[dateKey] || 0) + net;
      });
    });
    return map;
  }, [database.assets]);

  const {
    weekIncome,
    previousWeekIncome,
    monthIncome,
    previousMonthIncome,
    yearIncome,
    previousYearIncome
  } = useMemo(() => {
    const refDate = parseDateKey(database.simulatedDate);
    const sumRange = (start, end) => {
      let sum = 0;
      for (let d = new Date(start); d <= end; d = shiftDate(d, 1)) {
        sum += Number(netDailyHistory[getDateKey(d)] || 0);
      }
      return sum;
    };

    const startOfWeek = shiftDate(refDate, -(refDate.getDay() === 0 ? 6 : refDate.getDay() - 1));
    const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const startOfYear = new Date(refDate.getFullYear(), 0, 1);
    const previousWeekStart = shiftDate(startOfWeek, -7);
    const previousWeekEnd = shiftDate(startOfWeek, -1);
    const previousMonthStart = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(refDate.getFullYear(), refDate.getMonth(), 0);
    const previousYearStart = new Date(refDate.getFullYear() - 1, 0, 1);
    const previousYearEnd = new Date(refDate.getFullYear() - 1, 11, 31);

    return {
      weekIncome: sumRange(startOfWeek, refDate),
      previousWeekIncome: sumRange(previousWeekStart, previousWeekEnd),
      monthIncome: sumRange(startOfMonth, refDate),
      previousMonthIncome: sumRange(previousMonthStart, previousMonthEnd),
      yearIncome: sumRange(startOfYear, refDate),
      previousYearIncome: sumRange(previousYearStart, previousYearEnd)
    };
  }, [netDailyHistory, database.simulatedDate]);

  // Daily incomes calculation (per-asset tax deduction if asset.applyTax is true)
  const totalDailyIncome = database.assets.reduce((total, asset) => {
    const gross = getDailyAssetIncome(asset, cdiRate);
    if (!asset.applyTax) return total + gross;
    const tax = calculateTaxBreakdown(gross, asset.creationDate, actualDate);
    return total + tax.netYield;
  }, 0);

  const todayIncome = database.assets.reduce((total, asset) => {
    const gross = Number(asset.incomeHistory?.[getDateKey(actualDate)] || 0);
    if (!asset.applyTax) return total + gross;
    const tax = calculateTaxBreakdown(gross, asset.creationDate, actualDate);
    return total + tax.netYield;
  }, 0);

  // Actual calendar yesterday strictly 1 day before actualDate
  const yesterdayDate = useMemo(() => {
    return shiftDate(actualDate, -1);
  }, [actualDate]);

  const yesterdayIncome = database.assets.reduce((total, asset) => {
    const gross = Number(asset.incomeHistory?.[getDateKey(yesterdayDate)] || 0);
    if (!asset.applyTax) return total + gross;
    const tax = calculateTaxBreakdown(gross, asset.creationDate, yesterdayDate);
    return total + tax.netYield;
  }, 0);

  const netWorthTotal = investedTotal;
  const nextMilestone = (Math.floor(netWorthTotal / 10000) + 1) * 10000;
  const milestoneProgress = ((netWorthTotal % 10000) / 10000) * 100;
  const spentTotal = (database.expenses && database.expenses.length > 0)
    ? database.expenses.reduce((sum, exp) => sum + Math.max(toFiniteNumber(exp.amount), 0), 0)
    : Math.max(toFiniteNumber(database.recoverySpentTotal), 0) + Math.max(toFiniteNumber(database.purchasedTotal), 0);
  const milestoneRemaining = nextMilestone - netWorthTotal;
  const milestoneDays = totalDailyIncome > 0 ? Math.ceil(milestoneRemaining / totalDailyIncome) : 0;
  const displayMoney = (value) => areValuesVisible ? formatMoney(value) : '****';

  const getTrend = (current, previous) => current === previous
    ? { symbol: '→', className: 'trend-same' }
    : current > previous
      ? { symbol: '↑', className: 'trend-up' }
      : { symbol: '↓', className: 'trend-down' };
  const todayTrend = getTrend(todayIncome, yesterdayIncome);
  const weekTrend = getTrend(weekIncome, previousWeekIncome);
  const monthTrend = getTrend(monthIncome, previousMonthIncome);
  const yearTrend = getTrend(yearIncome, previousYearIncome);

  const updateSlots = (key, slots) => setDatabase((current) => ({ ...current, [key]: slots }));

  const addAsset = async (event) => {
    event.preventDefault();
    if (!assetForm.name.trim() || !assetForm.investedAmount) return;

    const baseAmount = Math.max(Number(assetForm.investedAmount) || 0, 0);
    const yieldRate = Math.max(Number(assetForm.yieldRate) || 0, 0);
    const targetDate = (assetForm.creationDate && isValidDateKey(assetForm.creationDate))
      ? assetForm.creationDate
      : database.simulatedDate;
    const applyTax = Boolean(assetForm.applyTax);

    let newAsset = {
      id: `${Date.now()}-${Math.random()}`,
      name: assetForm.name.trim(),
      yieldRate,
      investedAmount: baseAmount,
      initialInvestedAmount: baseAmount,
      totalIncome: 0,
      incomeHistory: {},
      creationDate: targetDate,
      applyTax
    };

    if (targetDate < database.simulatedDate) {
      const startYear = parseDateKey(targetDate).getFullYear();
      const endYear = parseDateKey(database.simulatedDate).getFullYear();
      const rangeHolidays = await fetchHolidaysForYearRange(startYear, endYear);
      const cdiRates = await fetchCDIRatesForDateRange(targetDate, database.simulatedDate, cdiRate);
      newAsset = calculateAssetAccrualSinceDate(
        newAsset,
        database.simulatedDate,
        rangeHolidays,
        cdiRate,
        cdiRates
      );
    }

    setDatabase((current) => {
      const updatedAssets = [...current.assets, newAsset];
      return {
        ...current,
        assets: updatedAssets,
        incomeHistory: rebuildIncomeHistory(updatedAssets)
      };
    });

    setAssetForm({
      name: '',
      yieldRate: '',
      investedAmount: '',
      creationDate: '',
      applyTax: false
    });
    setIsAssetFormOpen(false);
    showToast(locale === 'pt' ? 'Investimento adicionado!' : 'Investment added!');
  };

  const toggleAssetTax = (assetId) => {
    setDatabase((current) => {
      const updatedAssets = current.assets.map((asset) => {
        if (asset.id !== assetId) return asset;
        return {
          ...asset,
          applyTax: !asset.applyTax
        };
      });
      return {
        ...current,
        assets: updatedAssets
      };
    });
  };

  const removeAsset = (id) => {
    setDatabase((current) => {
      const assets = current.assets.filter((asset) => asset.id !== id);
      return { ...current, assets, incomeHistory: rebuildIncomeHistory(assets) };
    });
  };

  const startEditAsset = (asset) => {
    setEditingAssetId(asset.id);
    setEditAssetForm({
      name: asset.name || '',
      yieldRate: String(asset.yieldRate ?? 0),
      investedAmount: String(asset.initialInvestedAmount ?? asset.investedAmount ?? 0),
      creationDate: asset.creationDate || database.simulatedDate,
      applyTax: Boolean(asset.applyTax)
    });
  };

  const cancelEditAsset = () => {
    setEditingAssetId(null);
    setEditAssetForm({ name: '', yieldRate: '', investedAmount: '', creationDate: '', applyTax: false });
  };

  const saveAssetEdit = async (event) => {
    event.preventDefault();
    if (!editAssetForm.name.trim() || !editAssetForm.investedAmount) return;
    const newInitial = Math.max(Number(editAssetForm.investedAmount) || 0, 0);
    const newYield = Math.max(Number(editAssetForm.yieldRate) || 0, 0);
    const targetCreationDate = (editAssetForm.creationDate && isValidDateKey(editAssetForm.creationDate))
      ? editAssetForm.creationDate
      : database.simulatedDate;
    const editedApplyTax = Boolean(editAssetForm.applyTax);

    const currentAsset = database.assets.find((a) => a.id === editingAssetId);
    let editedAsset = {
      ...(currentAsset || {}),
      id: editingAssetId,
      name: editAssetForm.name.trim(),
      yieldRate: newYield,
      initialInvestedAmount: newInitial,
      investedAmount: newInitial,
      creationDate: targetCreationDate,
      applyTax: editedApplyTax,
      totalIncome: 0,
      incomeHistory: {}
    };

    if (targetCreationDate < database.simulatedDate) {
      const startYear = parseDateKey(targetCreationDate).getFullYear();
      const endYear = parseDateKey(database.simulatedDate).getFullYear();
      const rangeHolidays = await fetchHolidaysForYearRange(startYear, endYear);
      const cdiRates = await fetchCDIRatesForDateRange(targetCreationDate, database.simulatedDate, cdiRate);
      editedAsset = calculateAssetAccrualSinceDate(
        editedAsset,
        database.simulatedDate,
        rangeHolidays,
        cdiRate,
        cdiRates
      );
    }

    setDatabase((current) => {
      const assets = current.assets.map((asset) => {
        if (asset.id !== editingAssetId) return asset;
        return editedAsset;
      });

      return {
        ...current,
        assets,
        incomeHistory: rebuildIncomeHistory(assets)
      };
    });

    setEditingAssetId(null);
    showToast(locale === 'pt' ? 'Investimento atualizado!' : 'Investment updated!');
  };

  const handleManualSync = async () => {
    try {
      const updatedDb = await syncExistingAssetsIncomes(holidaysList, cdiRate);
      const assets = updatedDb?.assets || [];
      const totalInc = assets.reduce((sum, a) => sum + (Number(a.totalIncome) || 0), 0);
      const totalInv = assets.reduce((sum, a) => sum + (Number(a.investedAmount) || 0), 0);
      const initialPrinc = assets.reduce((sum, a) => sum + (Number(a.initialInvestedAmount) || 0), 0);
      const currentDateKey = getDateKey(new Date());
      const settledBankingDate = getLatestSettledBankingDate(currentDateKey, holidaysList);
      const targetDateKey = (updatedDb?.simulatedDate && updatedDb.simulatedDate > currentDateKey)
        ? updatedDb.simulatedDate
        : settledBankingDate;

      let earliestDate = targetDateKey;
      for (const asset of assets) {
        if (asset.creationDate && isValidDateKey(asset.creationDate) && asset.creationDate < earliestDate) {
          earliestDate = asset.creationDate;
        }
      }
      const bDays = getAccrualBusinessDays(earliestDate, targetDateKey, holidaysList).length;

      setSyncModalData({
        isOpen: true,
        targetIncome: totalInc,
        targetTotal: totalInv,
        initialPrincipal: initialPrinc,
        businessDays: bDays,
        referenceDate: targetDateKey
      });
      showToast(locale === 'pt' ? 'Rendimentos atualizados com o banco!' : 'Incomes synced with bank!');
    } catch {
      showToast(locale === 'pt' ? 'Erro ao sincronizar' : 'Failed to sync');
    }
  };

  const recordWishlistPurchase = (amount, slot) => {
    const cost = Number(amount || 0);
    const newExpense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: slot?.expenseName || slot?.name || (locale === 'pt' ? 'Item da Lista de Desejos' : 'Wishlist item'),
      amount: cost,
      date: getDateKey(actualDate),
      category: 'wishlist'
    };
    setDatabase((current) => ({
      ...current,
      purchasedTotal: Number(current.purchasedTotal || 0) + cost,
      expenses: [newExpense, ...(current.expenses || [])]
    }));
  };

  const recordRecoveryAddition = (amount) => {
    setDatabase((current) => ({ ...current, recoverySpentTotal: Number(current.recoverySpentTotal || 0) + Number(amount || 0) }));
  };

  const recordRecoveryRemoval = (amount) => {
    setDatabase((current) => ({ ...current, recoverySpentTotal: Math.max(Number(current.recoverySpentTotal || 0) - Number(amount || 0), 0) }));
  };

  const availableExpenseYears = useMemo(() => {
    const years = new Set();
    (database.expenses || []).forEach((e) => {
      if (e.date && e.date.length >= 4) {
        years.add(e.date.slice(0, 4));
      }
    });
    years.add(String(actualDate.getFullYear()));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [database.expenses, actualDate]);

  const filteredExpenses = useMemo(() => {
    const list = database.expenses || [];
    if (selectedExpenseYear === 'all') return list;
    return list.filter((e) => e.date && e.date.startsWith(selectedExpenseYear));
  }, [database.expenses, selectedExpenseYear]);

  const expensesYearlyMetrics = useMemo(() => {
    let total = 0;
    let wishlistTotal = 0;
    let recoveryTotal = 0;
    let wishlistCount = 0;
    let recoveryCount = 0;

    filteredExpenses.forEach((e) => {
      const val = Number(e.amount || 0);
      total += val;
      if (e.category === 'recovery') {
        recoveryTotal += val;
        recoveryCount += 1;
      } else {
        wishlistTotal += val;
        wishlistCount += 1;
      }
    });

    return {
      total,
      wishlistTotal,
      recoveryTotal,
      wishlistCount,
      recoveryCount,
      count: filteredExpenses.length
    };
  }, [filteredExpenses]);

  const deleteExpense = (id) => {
    setDatabase((current) => {
      const target = (current.expenses || []).find((e) => e.id === id);
      const amount = Number(target?.amount || 0);
      const updated = (current.expenses || []).filter((e) => e.id !== id);
      return {
        ...current,
        expenses: updated,
        purchasedTotal: target?.category === 'wishlist'
          ? Math.max(0, Number(current.purchasedTotal || 0) - amount)
          : current.purchasedTotal
      };
    });
  };

  const addDirectExpense = ({ name, amount, date, category }) => {
    const amt = Number(amount);
    if (!name || !Number.isFinite(amt) || amt <= 0) return;
    const newExp = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      amount: amt,
      date: date && isValidDateKey(date) ? date : getDateKey(actualDate),
      category: category === 'recovery' ? 'recovery' : 'wishlist'
    };
    setDatabase((current) => ({
      ...current,
      expenses: [newExp, ...(current.expenses || [])],
      purchasedTotal: newExp.category === 'wishlist' ? Number(current.purchasedTotal || 0) + amt : current.purchasedTotal
    }));
  };

  const updateExpense = (id, { name, amount, date, category }) => {
    const amt = Number(amount);
    if (!name || !Number.isFinite(amt) || amt <= 0) return;
    const validCategory = category === 'recovery' ? 'recovery' : 'wishlist';

    setDatabase((current) => {
      const existing = (current.expenses || []).find((e) => e.id === id);
      const oldWishlistAmt = existing?.category === 'wishlist' ? Number(existing.amount || 0) : 0;
      const newWishlistAmt = validCategory === 'wishlist' ? amt : 0;
      const updatedExpenses = (current.expenses || []).map((e) => {
        if (e.id !== id) return e;
        return {
          ...e,
          name,
          amount: amt,
          date: date && isValidDateKey(date) ? date : e.date,
          category: validCategory
        };
      });

      return {
        ...current,
        expenses: updatedExpenses,
        purchasedTotal: Math.max(0, Number(current.purchasedTotal || 0) - oldWishlistAmt + newWishlistAmt)
      };
    });
  };

  const renderMiddleContent = () => {
    if (activeSection === 'Simulation') {
      return (
        <SimulationArea
          mainDatabase={database}
          liveCdiRate={cdiRate}
          holidaysList={holidaysList}
          locale={locale}
          areValuesVisible={areValuesVisible}
        />
      );
    }

    if (activeSection === 'Investments') {
      return (
        <InvestmentsArea
          t={t}
          locale={locale}
          displayMoney={displayMoney}
          topInvestment={topInvestment}
          totalDailyIncome={totalDailyIncome}
          assets={database.assets}
          cdiRate={cdiRate}
          actualDate={actualDate}
          simulatedDate={database.simulatedDate}
          getDailyAssetIncome={getDailyAssetIncome}
          isAssetFormOpen={isAssetFormOpen}
          setIsAssetFormOpen={setIsAssetFormOpen}
          assetForm={assetForm}
          setAssetForm={setAssetForm}
          onAddAsset={addAsset}
          editingAssetId={editingAssetId}
          editAssetForm={editAssetForm}
          setEditAssetForm={setEditAssetForm}
          onStartEditAsset={startEditAsset}
          onCancelEditAsset={cancelEditAsset}
          onSaveAssetEdit={saveAssetEdit}
          onToggleAssetTax={toggleAssetTax}
          onRemoveAsset={removeAsset}
          onManualSync={handleManualSync}
        />
      );
    }

    if (activeSection === 'Balance') {
      const lastYearPrefix = String(actualDate.getFullYear() - 1);
      const lastYearSpentTotal = (database.expenses || [])
        .filter((exp) => exp.date && exp.date.startsWith(lastYearPrefix))
        .reduce((sum, exp) => sum + Math.max(toFiniteNumber(exp.amount), 0), 0);

      return (
        <BalanceArea
          t={t}
          locale={locale}
          displayMoney={displayMoney}
          actualDate={actualDate}
          investedTotal={investedTotal}
          spentTotal={spentTotal}
          previousYearIncome={previousYearIncome}
          lastYearSpentTotal={lastYearSpentTotal}
          selectedExpenseYear={selectedExpenseYear}
          onSelectExpenseYear={setSelectedExpenseYear}
          availableExpenseYears={availableExpenseYears}
          filteredExpenses={filteredExpenses}
          expensesYearlyMetrics={expensesYearlyMetrics}
          simulatedDate={database.simulatedDate}
          onAddDirectExpense={addDirectExpense}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
        />
      );
    }

    return (
      <NetWorthArea
        t={t}
        displayMoney={displayMoney}
        netWorthTotal={netWorthTotal}
        assetsCount={database.assets.length}
        nextMilestone={nextMilestone}
        milestoneRemaining={milestoneRemaining}
        milestoneDays={milestoneDays}
        milestoneProgress={milestoneProgress}
        todayIncome={todayIncome}
        todayTrend={todayTrend}
        yesterdayIncome={yesterdayIncome}
        totalCdiRate={totalCdiRate}
        weekIncome={weekIncome}
        weekTrend={weekTrend}
        previousWeekIncome={previousWeekIncome}
        monthIncome={monthIncome}
        monthTrend={monthTrend}
        previousMonthIncome={previousMonthIncome}
        yearIncome={yearIncome}
        yearTrend={yearTrend}
        previousYearIncome={previousYearIncome}
      />
    );
  };

  return (
    <div className={`app ${isLightTheme ? 'light-theme' : ''}`}>
      {toastMessage && (
        <div className='toast-notification' role='status' aria-live='polite'>
          <span>{toastMessage}</span>
        </div>
      )}

      {holidaysError && (
        <div className='holiday-error-banner' role='alert'>
          <span>⚠️ {t.holidayError}</span>
          <button type='button' onClick={() => loadHolidaysAndCatchUp(true)}>{t.retry}</button>
        </div>
      )}

      <Header
        locale={locale}
        isLightTheme={isLightTheme}
        areValuesVisible={areValuesVisible}
        onToggleValues={() => setAreValuesVisible((current) => !current)}
        onToggleTheme={() => setIsLightTheme((current) => !current)}
        onChangeLocale={(nextLocale) => setLocale(nextLocale)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        labelSet={t}
      ></Header>

      {/* Mobile Area Switcher */}
      <nav className='mobile-view-tabs' aria-label='Mobile sections navigation'>
        <button
          type='button'
          className={`mobile-tab-btn ${mobileArea === 'wishlist' ? 'active' : ''}`}
          onClick={() => setMobileArea('wishlist')}
        >
          {t.mobileNavWishlist} ({database.wishlistSlots.length})
        </button>
        <button
          type='button'
          className={`mobile-tab-btn ${mobileArea === 'dashboard' ? 'active' : ''}`}
          onClick={() => setMobileArea('dashboard')}
        >
          {t.mobileNavDashboard}
        </button>
        <button
          type='button'
          className={`mobile-tab-btn ${mobileArea === 'recovery' ? 'active' : ''}`}
          onClick={() => setMobileArea('recovery')}
        >
          {t.mobileNavRecovery} ({database.recoverySlots.length})
        </button>
      </nav>

      <div className={`app-areas mobile-tab-${mobileArea} section-${activeSection.toLowerCase().replace(/\s+/g, '-')}`}>
        <TimeArea
          title={t.wishlist}
          area='wishlist'
          labels={{
            add: t.add,
            expenseName: t.expenseName,
            expenseValue: t.expenseValue,
            total: t.totalLabel,
            days: t.days,
            noItems: t.noItems,
            removeSlot: t.removeSlot,
            completeSlot: t.completeSlot,
            moveToProcessing: t.moveToProcessing,
            returnSlot: t.returnSlot,
            readyLabel: locale === 'pt' ? '✓ 100% Financiado' : '✓ 100% Funded'
          }}
          slots={database.wishlistSlots}
          onSlotsChange={(slots) => updateSlots('wishlistSlots', slots)}
          onBuy={recordWishlistPurchase}
          total={wishlistTotal}
          dailyIncome={totalDailyIncome}
          hasRecoveryProcessing={database.recoverySlots.some((slot) => slot.type === 'recovery' && slot.isProcessing)}
          areValuesVisible={areValuesVisible}
        />

        <main className='middle'>
          <div className='section-buttons'>
            <SectionButton title={t.netWorth} active={activeSection === 'Net Worth'} onClick={() => setActiveSection('Net Worth')}></SectionButton>
            <SectionButton title={t.balance} active={activeSection === 'Balance'} onClick={() => setActiveSection('Balance')}></SectionButton>
            <SectionButton title={t.investments} active={activeSection === 'Investments'} onClick={() => setActiveSection('Investments')}></SectionButton>
            <SectionButton title={t.simulation} active={activeSection === 'Simulation'} onClick={() => setActiveSection('Simulation')}></SectionButton>
          </div>
          {renderMiddleContent()}
        </main>

        <TimeArea
          title={t.recovery}
          area='recovery'
          labels={{
            add: t.add,
            expenseName: t.expenseName,
            expenseValue: t.expenseValue,
            total: t.totalLabel,
            days: t.days,
            noItems: t.noItems,
            removeSlot: t.removeSlot,
            completeSlot: t.completeSlot,
            moveToProcessing: t.moveToProcessing,
            returnSlot: t.returnSlot,
            readyLabel: locale === 'pt' ? '✓ 100% Financiado' : '✓ 100% Funded'
          }}
          slots={database.recoverySlots}
          onSlotsChange={(slots) => updateSlots('recoverySlots', slots)}
          onAdd={recordRecoveryAddition}
          onRemove={recordRecoveryRemoval}
          total={recoveryTotal}
          dailyIncome={totalDailyIncome}
          hasWishlistProcessing={database.wishlistSlots.some((slot) => slot.type === 'processing')}
          areValuesVisible={areValuesVisible}
        />
      </div>

      <CatchUpModal
        isOpen={catchUpModalData.isOpen}
        onClose={() => setCatchUpModalData((cur) => ({ ...cur, isOpen: false }))}
        businessDays={catchUpModalData.businessDays}
        calendarDays={catchUpModalData.calendarDays}
        totalAccrued={catchUpModalData.totalAccrued}
        completedSlots={catchUpModalData.completedSlots}
        locale={locale}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        locale={locale}
      />

      <SyncModal
        isOpen={syncModalData.isOpen}
        onClose={() => setSyncModalData((cur) => ({ ...cur, isOpen: false }))}
        targetIncome={syncModalData.targetIncome}
        targetTotal={syncModalData.targetTotal}
        initialPrincipal={syncModalData.initialPrincipal}
        businessDays={syncModalData.businessDays}
        referenceDate={syncModalData.referenceDate}
        locale={locale}
      />
    </div>
  );
}

export default App;
