import { useEffect, useState, useCallback, useRef } from 'react';
import './App.css';
import Header from './Components/Header/Header';
import MiddleMilestoneCard from './Components/MiddleMilestoneCard/MiddleMilestoneCard';
import SectionButton from './Components/SectionButton/SectionButton';
import TimeArea from './Components/TimeArea/TimeArea';
import MiddleNetWorthCard from './MiddleNetWorthCard/MiddleNetWorthCard';
import AddMoreButton from './Components/AddMoreButton/AddMoreButton';
import RemoveButton from './Components/RemoveButton/RemoveButton';
import CatchUpModal from './Components/CatchUpModal/CatchUpModal';
import AboutModal from './Components/AboutModal/AboutModal';
import SimulationArea from './Components/SimulationArea/SimulationArea';
import { formatDecimal, formatMoney, formatDateKey } from './utils/formatters';
import {
  getDateKey,
  parseDateKey,
  shiftDate,
  isValidDateKey,
  getBusinessDaysInRange,
  fetchBrazilianHolidays
} from './utils/calendar';
import {
  calculateDailyYield,
  fetchHistoricalCDI,
  fetchLatestCDI,
  calculateAnnualizedCDI,
  calculateAssetAccrualSinceDate,
  DEFAULT_CDI_RATE
} from './utils/cdi';
import { calculateTaxBreakdown, getCalendarDaysElapsed } from './utils/tax';

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

const APP_TEXT = {
  en: {
    selectLanguage: 'Select language',
    languageName: 'English',
    hideMoneyValues: 'Hide money values',
    showMoneyValues: 'Show money values',
    toggleTheme: 'Toggle theme',
    netWorth: 'Net Worth',
    balance: 'Balance',
    investments: 'Investments',
    simulation: 'Simulation',
    topInvestment: 'Top Investment',
    cdi: 'CDI',
    assets: 'Assets',
    date: 'Date',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    addInvestment: 'Add investment',
    add: 'Add',
    name: 'Name',
    yieldRate: 'Yield %',
    investedAmount: 'Invested amount',
    yield: 'Yield',
    invested: 'Invested',
    dailyIncome: 'Daily income',
    totalDailyIncome: 'Total daily income',
    totalIncome: 'Total income',
    spent: 'Spent',
    lastYear: 'Last Year',
    moneyBalance: "Money's Balance",
    total: 'Total',
    milestone: 'Milestone',
    today: 'Today',
    yesterday: 'Yesterday',
    week: 'Week',
    lastWeek: 'Last Week',
    month: 'Month',
    lastMonth: 'Last Month',
    year: 'Year',
    lastYearLabel: 'Last Year',
    wishlist: 'Wishlist',
    recovery: 'Recovery',
    expenseName: 'Expense name',
    expenseValue: 'Expense value',
    totalLabel: 'Total',
    days: 'days',
    investmentsCount: 'Investments',
    eyeToggle: 'Toggle visibility',
    addExpense: 'Add expense',
    completeSlot: 'Complete slot',
    removeSlot: 'Remove slot',
    returnSlot: 'Return slot from processing',
    moveToProcessing: 'Move slot to processing',
    holidayError: 'Unable to fetch holiday data. Auto-update paused. Check your connection.',
    retry: 'Retry',
    aboutKyos: 'How Kyos works',
    exportData: 'Export backup (JSON)',
    importData: 'Import backup (JSON)',
    exportSuccess: 'Backup exported successfully!',
    importSuccess: 'Backup imported successfully!',
    importError: 'Invalid backup file format.',
    applyTaxLabel: 'Apply IR & IOF Tax (CDB / Tesouro)',
    taxExemptBadge: 'Isento',
    taxableBadge: 'Tributado',
    toggleTaxTip: 'Toggle tax (CDB / Tesouro vs LCI / LCA)',
    gross: 'Gross',
    net: 'Net',
    netIncome: 'Net Income',
    netDailyIncome: 'Net daily income',
    netTotalIncome: 'Net total income',
    taxDetails: 'Taxes',
    investmentDate: 'Investment Date',
    investedSince: 'Invested on',
    calendarDaysCount: 'days elapsed',
    iofRateLabel: 'IOF',
    irRateLabel: 'IR',
    taxDeductedBadge: 'Net (IR & IOF Deducted)',
    mobileNavWishlist: 'Wishlist',
    mobileNavDashboard: 'Dashboard',
    mobileNavRecovery: 'Recovery',
    assetAllocation: 'Asset Allocation',
    milestoneProgress: 'Progress'
  },
  pt: {
    selectLanguage: 'Selecionar idioma',
    languageName: 'Português',
    hideMoneyValues: 'Ocultar valores monetários',
    showMoneyValues: 'Mostrar valores monetários',
    toggleTheme: 'Alternar tema',
    netWorth: 'Patrimônio',
    balance: 'Saldo',
    investments: 'Investimentos',
    simulation: 'Simulação',
    topInvestment: 'Maior investimento',
    cdi: 'CDI',
    assets: 'Ativos',
    date: 'Data',
    edit: 'Editar',
    save: 'Salvar',
    cancel: 'Cancelar',
    addInvestment: 'Adicionar investimento',
    add: 'Adicionar',
    name: 'Nome',
    yieldRate: 'Rendimento %',
    investedAmount: 'Valor investido',
    yield: 'Rendimento',
    invested: 'Investido',
    dailyIncome: 'Rendimento diário',
    totalDailyIncome: 'Rendimento diário total',
    totalIncome: 'Rendimento total',
    spent: 'Gasto',
    lastYear: 'Ano anterior',
    moneyBalance: 'Balanço financeiro',
    total: 'Total',
    milestone: 'Meta',
    today: 'Hoje',
    yesterday: 'Ontem',
    week: 'Semana',
    lastWeek: 'Semana anterior',
    month: 'Mês',
    lastMonth: 'Mês anterior',
    year: 'Ano',
    lastYearLabel: 'Ano anterior',
    wishlist: 'Lista de desejos',
    recovery: 'Recuperação',
    expenseName: 'Nome da despesa',
    expenseValue: 'Valor da despesa',
    totalLabel: 'Total',
    days: 'dias',
    investmentsCount: 'Investimentos',
    eyeToggle: 'Alternar visibilidade',
    addExpense: 'Adicionar despesa',
    completeSlot: 'Concluir item',
    removeSlot: 'Remover item',
    returnSlot: 'Retornar item do processamento',
    moveToProcessing: 'Mover item para processamento',
    holidayError: 'Não foi possível carregar os feriados. Atualização automática pausada. Verifique sua conexão.',
    retry: 'Tentar novamente',
    aboutKyos: 'Como o Kyos funciona',
    exportData: 'Exportar backup (JSON)',
    importData: 'Importar backup (JSON)',
    exportSuccess: 'Backup exportado com sucesso!',
    importSuccess: 'Backup importado com sucesso!',
    importError: 'Formato de arquivo inválido.',
    applyTaxLabel: 'Descontar IR e IOF (CDB / Tesouro)',
    taxExemptBadge: 'Isento',
    taxableBadge: 'Tributado',
    toggleTaxTip: 'Alternar tributação (CDB / Tesouro vs LCI / LCA)',
    gross: 'Bruto',
    net: 'Líquido',
    netIncome: 'Rendimento Líquido',
    netDailyIncome: 'Rendimento diário líquido',
    netTotalIncome: 'Rendimento total líquido',
    taxDetails: 'Tributação',
    investmentDate: 'Data do Investimento',
    investedSince: 'Investido em',
    calendarDaysCount: 'dias decorridos',
    iofRateLabel: 'IOF',
    irRateLabel: 'IR',
    taxDeductedBadge: 'Líquido (IR e IOF Deduzidos)',
    mobileNavWishlist: 'Lista de Desejos',
    mobileNavDashboard: 'Painel',
    mobileNavRecovery: 'Recuperação',
    assetAllocation: 'Alocação de Ativos',
    milestoneProgress: 'Progresso'
  }
};

const defaultDatabase = {
  schemaVersion: DATABASE_VERSION,
  wishlistSlots: [],
  recoverySlots: [],
  milestone: { target: 0 },
  assets: [],
  purchasedTotal: 0,
  simulatedDate: getDateKey(new Date()),
  incomeHistory: {},
  recoverySpentTotal: 0
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
    simulatedDate: parsedDate,
    incomeHistory: resetNonAssetValues ? {} : rebuildIncomeHistory(assets)
  };
};

const readDatabase = () => {
  try {
    const savedDatabase = window.localStorage.getItem('kyos-database');
    if (!savedDatabase) return defaultDatabase;
    const parsedDatabase = JSON.parse(savedDatabase);
    return normalizeDatabase(parsedDatabase, parsedDatabase.schemaVersion !== DATABASE_VERSION);
  } catch {
    return defaultDatabase;
  }
};

function App() {
  const [activeSection, setActiveSection] = useState('Net Worth');
  const [isLightTheme, setIsLightTheme] = useState(false);
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
    creationDate: getDateKey(new Date()),
    applyTax: false
  }));
  const [cdiRate, setCdiRate] = useState(DEFAULT_CDI_RATE);
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
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editAssetForm, setEditAssetForm] = useState({
    name: '',
    yieldRate: '',
    investedAmount: '',
    creationDate: '',
    applyTax: false
  });

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
    window.localStorage.setItem('kyos-database', JSON.stringify(database));
  }, [database]);

  useEffect(() => {
    try {
      window.localStorage.setItem('kyos-locale', locale);
    } catch {
      // Ignore storage errors for non-persistent environments.
    }
  }, [locale]);

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
        return;
      }
    }

    if (lastOpenedKey >= currentDateKey) {
      return;
    }

    const startDate = shiftDate(parseDateKey(lastOpenedKey), 1);
    const endDate = parseDateKey(currentDateKey);
    const calendarDays = Math.max(1, Math.round((endDate.getTime() - parseDateKey(lastOpenedKey).getTime()) / (1000 * 60 * 60 * 24)));
    const businessDaysList = getBusinessDaysInRange(startDate, endDate, holidays);

    if (businessDaysList.length === 0) {
      window.localStorage.setItem('kyos-last-opened-date', currentDateKey);
      setDatabase((cur) => ({ ...cur, simulatedDate: currentDateKey }));
      return;
    }

    window.localStorage.setItem('kyos-last-opened-date', currentDateKey);

    const dayRates = {};
    for (const day of businessDaysList) {
      const key = getDateKey(day);
      dayRates[key] = await fetchHistoricalCDI(key, currentCdi);
    }

    const currentDb = readDatabase();
    let assets = JSON.parse(JSON.stringify(currentDb.assets || []));
    let wishlistSlots = JSON.parse(JSON.stringify(currentDb.wishlistSlots || []));
    let recoverySlots = JSON.parse(JSON.stringify(currentDb.recoverySlots || []));
    let recoverySpentTotal = Number(currentDb.recoverySpentTotal || 0);

    let accruedSum = 0;
    const completed = [];

    for (const day of businessDaysList) {
      const dayKey = getDateKey(day);
      const dayRate = dayRates[dayKey] || currentCdi;
      let dayYield = 0;

      assets = assets.map((asset) => {
        if (asset.incomeHistory && typeof asset.incomeHistory[dayKey] === 'number') {
          return asset;
        }

        if (asset.creationDate && asset.creationDate > dayKey) {
          return asset;
        }

        const income = calculateDailyYield(asset.investedAmount, asset.yieldRate, dayRate);
        dayYield += income;
        return {
          ...asset,
          investedAmount: Number(asset.investedAmount || 0) + income,
          totalIncome: Number(asset.totalIncome || 0) + income,
          incomeHistory: {
            ...(asset.incomeHistory || {}),
            [dayKey]: income
          }
        };
      });

      accruedSum += dayYield;

      if (dayYield > 0) {
        const recoveryIndex = recoverySlots.findIndex((s) => s.type === 'recovery' && s.isProcessing);
        const wishlistProcessingIndex = wishlistSlots.findIndex((s) => s.type === 'processing');
        const wishlistIndex = recoveryIndex === -1
          ? wishlistProcessingIndex >= 0
            ? wishlistProcessingIndex
            : wishlistSlots.findIndex((s) => s.type === 'expense')
          : -1;

        if (recoveryIndex >= 0) {
          const slot = recoverySlots[recoveryIndex];
          const nextPrice = Math.max((Number(slot.price) || 0) - dayYield, 0);
          if (nextPrice === 0) {
            completed.push({
              id: slot.id,
              name: slot.expenseName,
              price: slot.originalPrice || slot.price,
              type: 'recovery'
            });
            recoverySlots = recoverySlots
              .filter((_, idx) => idx !== recoveryIndex)
              .map((item, idx) => idx === 0 ? { ...item, isProcessing: true } : item);
          } else {
            recoverySlots = recoverySlots.map((item, idx) => idx === recoveryIndex ? { ...item, price: nextPrice } : item);
          }
        } else if (wishlistIndex >= 0) {
          const slot = wishlistSlots[wishlistIndex];
          const nextPrice = Math.max((Number(slot.price) || 0) - dayYield, 0);
          if (nextPrice === 0) {
            completed.push({
              id: slot.id,
              name: slot.expenseName,
              price: slot.originalPrice || slot.price,
              type: 'wishlist'
            });
            wishlistSlots = wishlistSlots.map((item, idx) => idx === wishlistIndex ? { ...item, type: 'ready', price: 0 } : item);
          } else {
            wishlistSlots = wishlistSlots.map((item, idx) => idx === wishlistIndex ? { ...item, type: 'processing', price: nextPrice } : item);
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
            const prevHolidays = await fetchBrazilianHolidays(lastYear);
            holidays = [...holidays, ...prevHolidays];
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
      await processMissedDays(holidays, cdiRateRef.current);
    } finally {
      isCatchingUpRef.current = false;
    }
  }, [processMissedDays]);

  useEffect(() => {
    loadHolidaysAndCatchUp();
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
  const topInvestment = database.assets.reduce((top, asset) => toFiniteNumber(asset.investedAmount) > toFiniteNumber(top.investedAmount) ? asset : top, { name: 'None', investedAmount: 0 });
  const actualDate = parseDateKey(database.simulatedDate);
  const totalCdiRate = calculateAnnualizedCDI(cdiRate);

  const getIncomeForDate = (date) => {
    return database.assets.reduce((total, asset) => total + Number(asset.incomeHistory?.[getDateKey(date)] || 0), 0);
  };

  const getIncomeBetween = (startDate, endDate) => {
    let total = 0;
    for (let date = new Date(startDate); date <= endDate; date = shiftDate(date, 1)) {
      total += getIncomeForDate(date);
    }
    return total;
  };

  const startOfWeek = shiftDate(actualDate, -(actualDate.getDay() === 0 ? 6 : actualDate.getDay() - 1));
  const startOfMonth = new Date(actualDate.getFullYear(), actualDate.getMonth(), 1);
  const startOfYear = new Date(actualDate.getFullYear(), 0, 1);
  const previousWeekStart = shiftDate(startOfWeek, -7);
  const previousWeekEnd = shiftDate(startOfWeek, -1);
  const previousMonthStart = new Date(actualDate.getFullYear(), actualDate.getMonth() - 1, 1);
  const previousMonthEnd = new Date(actualDate.getFullYear(), actualDate.getMonth(), 0);
  const previousYearStart = new Date(actualDate.getFullYear() - 1, 0, 1);
  const previousYearEnd = new Date(actualDate.getFullYear() - 1, 11, 31);

  const weekIncome = getIncomeBetween(startOfWeek, actualDate);
  const previousWeekIncome = getIncomeBetween(previousWeekStart, previousWeekEnd);
  const monthIncome = getIncomeBetween(startOfMonth, actualDate);
  const previousMonthIncome = getIncomeBetween(previousMonthStart, previousMonthEnd);
  const yearIncome = getIncomeBetween(startOfYear, actualDate);
  const previousYearIncome = getIncomeBetween(previousYearStart, previousYearEnd);

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

  const yesterdayIncome = database.assets.reduce((total, asset) => {
    const yesterdayDate = shiftDate(actualDate, -1);
    const gross = Number(asset.incomeHistory?.[getDateKey(yesterdayDate)] || 0);
    if (!asset.applyTax) return total + gross;
    const tax = calculateTaxBreakdown(gross, asset.creationDate, yesterdayDate);
    return total + tax.netYield;
  }, 0);

  const netWorthTotal = investedTotal;
  const nextMilestone = (Math.floor(netWorthTotal / 10000) + 1) * 10000;
  const spentTotal = Math.max(toFiniteNumber(database.recoverySpentTotal), 0) + Math.max(toFiniteNumber(database.purchasedTotal), 0);
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

  const addAsset = (event) => {
    event.preventDefault();
    if (!assetForm.name.trim() || !assetForm.investedAmount) return;

    const baseAmount = Number(assetForm.investedAmount);
    const creationDate = isValidDateKey(assetForm.creationDate)
      ? assetForm.creationDate
      : database.simulatedDate;

    const applyTax = Boolean(assetForm.applyTax);

    let newAsset = {
      id: `${Date.now()}-${Math.random()}`,
      name: assetForm.name.trim(),
      yieldRate: Number(assetForm.yieldRate || 0),
      investedAmount: baseAmount,
      initialInvestedAmount: baseAmount,
      totalIncome: 0,
      incomeHistory: {},
      creationDate,
      applyTax
    };

    // If invested on a past date, backfill yields up to simulatedDate
    if (creationDate < database.simulatedDate) {
      newAsset = calculateAssetAccrualSinceDate(
        newAsset,
        database.simulatedDate,
        holidaysList,
        cdiRate
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
      creationDate: database.simulatedDate,
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

  const saveAssetEdit = (event) => {
    event.preventDefault();
    if (!editAssetForm.name.trim() || !editAssetForm.investedAmount) return;
    const newInitial = Math.max(Number(editAssetForm.investedAmount) || 0, 0);
    const newYield = Math.max(Number(editAssetForm.yieldRate) || 0, 0);
    const newCreationDate = isValidDateKey(editAssetForm.creationDate)
      ? editAssetForm.creationDate
      : database.simulatedDate;
    const editedApplyTax = Boolean(editAssetForm.applyTax);

    setDatabase((current) => {
      const assets = current.assets.map((asset) => {
        if (asset.id !== editingAssetId) return asset;
        let editedAsset = {
          ...asset,
          name: editAssetForm.name.trim(),
          yieldRate: newYield,
          initialInvestedAmount: newInitial,
          investedAmount: newInitial,
          creationDate: newCreationDate,
          applyTax: editedApplyTax
        };

        if (newCreationDate < current.simulatedDate) {
          editedAsset = calculateAssetAccrualSinceDate(
            editedAsset,
            current.simulatedDate,
            holidaysList,
            cdiRate
          );
        } else {
          editedAsset.totalIncome = 0;
          editedAsset.incomeHistory = {};
        }

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

  const recordWishlistPurchase = (amount) => {
    setDatabase((current) => ({ ...current, purchasedTotal: Number(current.purchasedTotal || 0) + Number(amount || 0) }));
  };

  const recordRecoveryAddition = (amount) => {
    setDatabase((current) => ({ ...current, recoverySpentTotal: Number(current.recoverySpentTotal || 0) + Number(amount || 0) }));
  };

  const recordRecoveryRemoval = (amount) => {
    setDatabase((current) => ({ ...current, recoverySpentTotal: Math.max(Number(current.recoverySpentTotal || 0) - Number(amount || 0), 0) }));
  };

  const renderMiddleContent = () => {
    if (activeSection === 'Simulation') {
      return (
        <SimulationArea
          mainDatabase={database}
          liveCdiRate={cdiRate}
          holidaysList={holidaysList}
          locale={locale}
        />
      );
    }

    if (activeSection === 'Investments') {
      return (
        <div className='investments-view'>
          <div className='investment-summary-grid'>
            <div className='investment-summary-card'>
              <h2>{t.topInvestment}</h2>
              <strong>{topInvestment.name}<br />R$ {displayMoney(topInvestment.investedAmount)}</strong>
            </div>
            <div className='investment-summary-card cdi-investment-card'>
              <h2>{t.cdi}</h2>
              <strong>{formatDecimal(totalCdiRate)}%</strong>
            </div>
          </div>
          <div className='assets-panel'>
            <div className='assets-heading'>
              <h2>{t.assets}</h2>
              <span className='total-daily-income'>
                {t.totalDailyIncome}: R$ {displayMoney(totalDailyIncome)}
              </span>
              <AddMoreButton label={t.addInvestment} onClick={() => setIsAssetFormOpen((current) => !current)}></AddMoreButton>
            </div>
            {isAssetFormOpen && (
              <form className='asset-form' onSubmit={addAsset}>
                <input
                  placeholder={t.name}
                  value={assetForm.name}
                  onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })}
                  required
                />
                <input
                  placeholder={t.yieldRate}
                  type='number'
                  min='0'
                  step='0.01'
                  value={assetForm.yieldRate}
                  onChange={(event) => setAssetForm({ ...assetForm, yieldRate: event.target.value })}
                />
                <input
                  placeholder={t.investedAmount}
                  type='number'
                  min='0'
                  step='0.01'
                  value={assetForm.investedAmount}
                  onChange={(event) => setAssetForm({ ...assetForm, investedAmount: event.target.value })}
                  required
                />
                <label className='asset-date-field-wrap'>
                  <span>{t.investmentDate}:</span>
                  <input
                    type='date'
                    value={assetForm.creationDate || database.simulatedDate}
                    max={database.simulatedDate}
                    onChange={(event) => setAssetForm({ ...assetForm, creationDate: event.target.value })}
                  />
                </label>
                <label className='asset-tax-checkbox-label'>
                  <input
                    type='checkbox'
                    checked={assetForm.applyTax}
                    onChange={(event) => setAssetForm({ ...assetForm, applyTax: event.target.checked })}
                  />
                  <span>{t.applyTaxLabel}</span>
                </label>
                <button type='submit'>{t.add}</button>
              </form>
            )}
            <div className='assets-grid'>
              {database.assets.map((asset) => {
                const dailyGross = getDailyAssetIncome(asset, cdiRate);
                const daysElapsed = getCalendarDaysElapsed(asset.creationDate, actualDate);
                const dailyTax = calculateTaxBreakdown(dailyGross, daysElapsed);
                const totalTax = calculateTaxBreakdown(asset.totalIncome, daysElapsed);

                return (
                  <div className='asset-card' key={asset.id}>
                    {editingAssetId === asset.id ? (
                      <form className='asset-edit-form' onSubmit={saveAssetEdit}>
                        <label className='asset-edit-label'>
                          <span>{t.name}</span>
                          <input
                            value={editAssetForm.name}
                            onChange={(e) => setEditAssetForm({ ...editAssetForm, name: e.target.value })}
                            placeholder={t.name}
                            required
                          />
                        </label>
                        <label className='asset-edit-label'>
                          <span>{t.yieldRate}</span>
                          <input
                            type='number'
                            min='0'
                            step='0.01'
                            value={editAssetForm.yieldRate}
                            onChange={(e) => setEditAssetForm({ ...editAssetForm, yieldRate: e.target.value })}
                            placeholder={t.yieldRate}
                          />
                        </label>
                        <label className='asset-edit-label'>
                          <span>{t.investedAmount}</span>
                          <input
                            type='number'
                            min='0'
                            step='0.01'
                            value={editAssetForm.investedAmount}
                            onChange={(e) => setEditAssetForm({ ...editAssetForm, investedAmount: e.target.value })}
                            placeholder={t.investedAmount}
                            required
                          />
                        </label>
                        <label className='asset-edit-label'>
                          <span>{t.investmentDate}</span>
                          <input
                            type='date'
                            value={editAssetForm.creationDate || database.simulatedDate}
                            max={database.simulatedDate}
                            onChange={(e) => setEditAssetForm({ ...editAssetForm, creationDate: e.target.value })}
                          />
                        </label>
                        <label className='asset-tax-checkbox-label'>
                          <input
                            type='checkbox'
                            checked={editAssetForm.applyTax}
                            onChange={(e) => setEditAssetForm({ ...editAssetForm, applyTax: e.target.checked })}
                          />
                          <span>{t.applyTaxLabel}</span>
                        </label>
                        <div className='asset-edit-actions'>
                          <button type='submit' className='asset-save-btn'>{t.save}</button>
                          <button type='button' className='asset-cancel-btn' onClick={cancelEditAsset}>{t.cancel}</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className='asset-title'>
                          <strong>{asset.name}</strong>
                          <div className='asset-actions'>
                            <button
                              type='button'
                              className={`asset-tax-toggle-btn ${asset.applyTax ? 'taxable' : 'exempt'}`}
                              onClick={() => toggleAssetTax(asset.id)}
                              title={t.toggleTaxTip}
                              aria-label={`${t.toggleTaxTip} - ${asset.name}`}
                            >
                              {asset.applyTax ? t.taxableBadge : t.taxExemptBadge}
                            </button>
                            <button
                              type='button'
                              className='edit-asset-button'
                              aria-label={`${t.edit} ${asset.name}`}
                              title={t.edit}
                              onClick={() => startEditAsset(asset)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
                                <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
                              </svg>
                            </button>
                            <RemoveButton label={t.removeSlot} onClick={() => removeAsset(asset.id)}></RemoveButton>
                          </div>
                        </div>

                        <div className='asset-meta-badge'>
                          <small>
                            {t.investedSince}: <strong>{formatDateKey(asset.creationDate, locale)}</strong> ({daysElapsed} {t.days})
                          </small>
                        </div>

                        <strong>{t.yield}</strong><p>{formatDecimal(asset.yieldRate)}% {t.cdi}</p>
                        <strong>{t.invested}</strong><p>R$ {displayMoney(asset.investedAmount)}</p>

                        {asset.applyTax ? (
                          <div className='asset-tax-block'>
                            <strong>{t.dailyIncome} ({t.net})</strong>
                            <p>
                              R$ {displayMoney(dailyTax.netYield)}
                              <small className='tax-gross-tag'>({t.gross}: R$ {displayMoney(dailyGross)})</small>
                            </p>
                            <strong>{t.totalIncome} ({t.net})</strong>
                            <p>
                              R$ {displayMoney(totalTax.netYield)}
                              <small className='tax-gross-tag'>({t.gross}: R$ {displayMoney(asset.totalIncome)})</small>
                            </p>
                            <div className='asset-tax-tags'>
                              <span className={`tax-rate-pill ${dailyTax.iofRate === 0 ? 'zero-iof' : ''}`}>
                                {t.iofRateLabel}: {dailyTax.iofRate}%
                              </span>
                              <span className='tax-rate-pill'>
                                {t.irRateLabel}: {dailyTax.irRate}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <strong>{t.dailyIncome}</strong><p>R$ {displayMoney(dailyGross)}</p>
                            <strong>{t.totalIncome}</strong><p>R$ {displayMoney(asset.totalIncome)}</p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'Balance') {
      const totalBalance = spentTotal + investedTotal;
      const spentRatio = totalBalance > 0 ? (spentTotal / totalBalance) * 100 : 0;
      const investedRatio = totalBalance > 0 ? (investedTotal / totalBalance) * 100 : 0;

      return (
        <div className='balance-view'>
          <div className='balance-year-grid'>
            <div className='balance-card'>
              <h2>{t.spent}</h2>
              <strong>{actualDate.getFullYear()}</strong>
              <strong>R$ {displayMoney(spentTotal)}</strong>
              <h3>{t.lastYear}</h3>
              <strong>R$ {displayMoney(0)}</strong>
            </div>
            <div className='balance-card'>
              <h2>{t.invested}</h2>
              <strong>{actualDate.getFullYear()}</strong>
              <strong>R$ {displayMoney(investedTotal)}</strong>
              <h3>{t.lastYear}</h3>
              <strong>R$ {displayMoney(0)}</strong>
            </div>
          </div>

          <div className='balance-chart-card'>
            <div
              className='balance-donut'
              style={{ '--spent-ratio': `${spentRatio}%` }}
              aria-label='Money balance chart'
            >
              <div className='donut-inner-content'>
                <span className='donut-pct'>{formatDecimal(investedRatio)}%</span>
                <span className='donut-sub'>{t.invested}</span>
              </div>
            </div>
            <div className='balance-legend'>
              <h2>{t.moneyBalance}</h2>
              <div className='legend-row'>
                <p><span className='legend-swatch invested'></span>{t.invested}</p>
                <strong>R$ {displayMoney(investedTotal)} ({formatDecimal(investedRatio)}%)</strong>
              </div>
              <div className='legend-row'>
                <p><span className='legend-swatch spent'></span>{t.spent}</p>
                <strong>R$ {displayMoney(spentTotal)} ({formatDecimal(spentRatio)}%)</strong>
              </div>
            </div>
          </div>

          {/* Interactive Portfolio Asset Allocation Breakdown */}
          {database.assets.length > 0 && (
            <div className='portfolio-allocation-card'>
              <h3>{t.assetAllocation}</h3>
              <div className='allocation-bar-track'>
                {database.assets.map((asset, idx) => {
                  const pct = investedTotal > 0 ? (Number(asset.investedAmount) / investedTotal) * 100 : 0;
                  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
                  return (
                    <div
                      key={asset.id}
                      className='allocation-segment'
                      style={{
                        width: `${pct}%`,
                        backgroundColor: colors[idx % colors.length]
                      }}
                      title={`${asset.name}: ${formatDecimal(pct)}%`}
                    />
                  );
                })}
              </div>
              <div className='allocation-items-grid'>
                {database.assets.map((asset, idx) => {
                  const pct = investedTotal > 0 ? (Number(asset.investedAmount) / investedTotal) * 100 : 0;
                  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
                  return (
                    <div className='allocation-item' key={asset.id}>
                      <span className='allocation-item-dot' style={{ backgroundColor: colors[idx % colors.length] }} />
                      <span className='allocation-item-name'>{asset.name}</span>
                      <strong className='allocation-item-val'>R$ {displayMoney(asset.investedAmount)} ({formatDecimal(pct)}%)</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        <div className='middle-summary'>
          <div className='middle-summary-main'>
            <MiddleNetWorthCard
              title={t.total}
              money={displayMoney(netWorthTotal)}
              investments={database.assets.length}
              investmentLabel={t.investmentsCount}
            ></MiddleNetWorthCard>
            <MiddleMilestoneCard
              title={t.milestone}
              next={displayMoney(nextMilestone)}
              remaining={`${displayMoney(milestoneRemaining)} - ${milestoneDays} ${t.days}`}
            ></MiddleMilestoneCard>
          </div>
          <div className='middle-summary-side'>
            <div className='summary-card today-card'>
              <h2>{t.today}</h2>
              <strong>
                R$ {displayMoney(todayIncome)}
                <span className={`trend ${todayTrend.className}`}>{todayTrend.symbol}</span>
              </strong>
              <h3>{t.yesterday}</h3>
              <strong>R$ {displayMoney(yesterdayIncome)}</strong>
            </div>
            <div className='summary-card cdi-card'>
              <h2>{t.cdi}</h2>
              <strong>{formatDecimal(totalCdiRate)}%</strong>
            </div>
          </div>
        </div>
        <div className='time-cards'>
          <div className='summary-card period-card'>
            <h2>{t.week}</h2><strong>R$ {displayMoney(weekIncome)} <span className={`trend ${weekTrend.className}`}>{weekTrend.symbol}</span></strong><h3>{t.lastWeek}</h3><strong>R$ {displayMoney(previousWeekIncome)}</strong>
          </div>
          <div className='summary-card period-card'>
            <h2>{t.month}</h2><strong>R$ {displayMoney(monthIncome)} <span className={`trend ${monthTrend.className}`}>{monthTrend.symbol}</span></strong><h3>{t.lastMonth}</h3><strong>R$ {displayMoney(previousMonthIncome)}</strong>
          </div>
          <div className='summary-card period-card'>
            <h2>{t.year}</h2><strong>R$ {displayMoney(yearIncome)} <span className={`trend ${yearTrend.className}`}>{yearTrend.symbol}</span></strong><h3>{t.lastYearLabel}</h3><strong>R$ {displayMoney(previousYearIncome)}</strong>
          </div>
        </div>
      </>
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

      <div className={`app-areas mobile-tab-${mobileArea}`}>
        <TimeArea
          title={t.wishlist}
          area='wishlist'
          labels={{ add: t.add, expenseName: t.expenseName, expenseValue: t.expenseValue, total: t.totalLabel, days: t.days }}
          slots={database.wishlistSlots}
          onSlotsChange={(slots) => updateSlots('wishlistSlots', slots)}
          onBuy={recordWishlistPurchase}
          total={wishlistTotal}
          dailyIncome={totalDailyIncome}
          hasRecoveryProcessing={database.recoverySlots.some((slot) => slot.type === 'recovery' && slot.isProcessing)}
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
          labels={{ add: t.add, expenseName: t.expenseName, expenseValue: t.expenseValue, total: t.totalLabel, days: t.days }}
          slots={database.recoverySlots}
          onSlotsChange={(slots) => updateSlots('recoverySlots', slots)}
          onAdd={recordRecoveryAddition}
          onRemove={recordRecoveryRemoval}
          total={recoveryTotal}
          dailyIncome={totalDailyIncome}
          hasWishlistProcessing={database.wishlistSlots.some((slot) => slot.type === 'processing')}
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
    </div>
  );
}

export default App;
