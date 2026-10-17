import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
import SyncModal from './Components/SyncModal/SyncModal';
import SimulationArea from './Components/SimulationArea/SimulationArea';
import TigerMascot from './Components/TigerMascot/TigerMascot';
import { formatDecimal, formatMoney, formatDateKey } from './utils/formatters';
import {
  getDateKey,
  parseDateKey,
  shiftDate,
  isValidDateKey,
  getBusinessDaysInRange,
  getAccrualBusinessDays,
  fetchBrazilianHolidays,
  fetchHolidaysForYearRange,
  getLatestSettledBankingDate
} from './utils/calendar';
import {
  calculateDailyYield,
  fetchLatestCDI,
  calculateAnnualizedCDI,
  calculateAssetAccrualSinceDate,
  synchronizeAllAssetsIncomes,
  fetchCDIRatesForDateRange,
  DEFAULT_CDI_RATE
} from './utils/cdi';
import { calculateTaxBreakdown, getCalendarDaysElapsed } from './utils/tax';
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
    syncIncomes: 'Sync Incomes',
    syncIncomesTip: 'Recalculate and update all existing incomes coherently from their creation dates to today',
    syncedSuccess: 'Incomes synchronized coherently!',
    iofRateLabel: 'IOF',
    irRateLabel: 'IR',
    appliedAmount: 'Principal Invested',
    grossBalance: 'Gross Balance',
    netBalance: 'Net Balance',
    currentBalance: 'Current Balance',
    taxDeductedBadge: 'Net (IR & IOF Deducted)',
    mobileNavWishlist: 'Wishlist',
    mobileNavDashboard: 'Dashboard',
    mobileNavRecovery: 'Recovery',
    milestoneProgress: 'Progress',
    capitalAllocation: 'Capital Distribution',
    totalFlow: 'Total Capital Flow',
    capitalEfficiency: 'Preserved vs Outflow',
    installApp: 'Install App (PWA)',
    appInstalled: 'App installed successfully!',
    offlineActive: 'Offline mode active - data saved locally',
    onlineRestored: 'Online connection restored'
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
    syncIncomes: 'Sincronizar Rendimentos',
    syncIncomesTip: 'Recalcular e atualizar todos os rendimentos de forma coerente desde a data de criação até hoje',
    syncedSuccess: 'Rendimentos sincronizados com sucesso!',
    iofRateLabel: 'IOF',
    irRateLabel: 'IR',
    appliedAmount: 'Valor Aplicado',
    grossBalance: 'Saldo Bruto',
    netBalance: 'Saldo Líquido',
    currentBalance: 'Saldo Atual',
    taxDeductedBadge: 'Líquido (IR e IOF Deduzidos)',
    mobileNavWishlist: 'Lista de Desejos',
    mobileNavDashboard: 'Painel',
    mobileNavRecovery: 'Recuperação',
    milestoneProgress: 'Progresso',
    capitalAllocation: 'Distribuição de Capital',
    totalFlow: 'Fluxo Total de Capital',
    capitalEfficiency: 'Preservado vs Saídas',
    installApp: 'Instalar Aplicativo (PWA)',
    appInstalled: 'Aplicativo instalado com sucesso!',
    offlineActive: 'Modo offline ativo - dados salvos localmente',
    onlineRestored: 'Conexão online restabelecida'
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
    creationDate: '',
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

    const startKey = getDateKey(startDate);
    const endKey = getDateKey(endDate);
    const dayRates = await fetchCDIRatesForDateRange(startKey, endKey, currentCdi);

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
      let dayYieldForDistribution = 0;

      const updatedAssets = [];
      for (const asset of assets) {
        if (asset.incomeHistory && typeof asset.incomeHistory[dayKey] === 'number') {
          updatedAssets.push(asset);
          continue;
        }

        if (asset.creationDate && asset.creationDate > dayKey) {
          updatedAssets.push(asset);
          continue;
        }

        const income = calculateDailyYield(asset.investedAmount, asset.yieldRate, dayRate);
        const netIncome = asset.applyTax
          ? calculateTaxBreakdown(income, asset.creationDate, day).netYield
          : income;

        dayYieldForDistribution += netIncome;
        accruedSum += income;

        updatedAssets.push({
          ...asset,
          investedAmount: Number(asset.investedAmount || 0) + income,
          totalIncome: Number(asset.totalIncome || 0) + income,
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

  const syncExistingAssetsIncomes = useCallback(async (holidays, currentCdi) => {
    const today = new Date();
    const currentDateKey = getDateKey(today);
    const currentDb = readDatabase();
    const assets = currentDb.assets || [];
    if (!Array.isArray(assets) || assets.length === 0) return currentDb;

    const settledBankingDate = getLatestSettledBankingDate(currentDateKey, holidays);
    const targetDateKey = (currentDb.simulatedDate && isValidDateKey(currentDb.simulatedDate) && currentDb.simulatedDate !== currentDateKey)
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
      simulatedDate: currentDb.simulatedDate || currentDateKey,
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
      await processMissedDays(holidays, cdiRateRef.current);
      await syncExistingAssetsIncomes(holidays, cdiRateRef.current);
    } finally {
      isCatchingUpRef.current = false;
    }
  }, [processMissedDays, syncExistingAssetsIncomes]);

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

  const {
    weekIncome,
    previousWeekIncome,
    monthIncome,
    previousMonthIncome,
    yearIncome,
    previousYearIncome
  } = useMemo(() => {
    const history = database.incomeHistory || {};
    const refDate = parseDateKey(database.simulatedDate);
    const sumRange = (start, end) => {
      let sum = 0;
      for (let d = new Date(start); d <= end; d = shiftDate(d, 1)) {
        sum += Number(history[getDateKey(d)] || 0);
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
  }, [database.incomeHistory, database.simulatedDate]);

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

  const isWeekend = actualDate.getDay() === 0 || actualDate.getDay() === 6;
  const isHoliday = (holidaysList || []).some((h) => h && h.date === database.simulatedDate);
  const isWeekendOrHoliday = isWeekend || isHoliday;
  const isMilestoneClose = milestoneDays > 0 && milestoneDays <= 10;
  const hasRecovery = (database.recoverySlots || []).some((s) => s.type === 'recovery');
  const hasReadyWishlist = (database.wishlistSlots || []).some((s) => s.type === 'ready');
  const isSyncing = Boolean(syncModalData.isOpen);

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
      const targetDateKey = updatedDb?.simulatedDate || getDateKey(new Date());

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
              <div className='assets-heading-actions'>
                <button
                  type='button'
                  className='sync-incomes-btn'
                  onClick={handleManualSync}
                  title={t.syncIncomesTip}
                  aria-label={t.syncIncomes}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M224,128a96,96,0,0,1-96,96A95.8,95.8,0,0,1,64,195.9V216a8,8,0,0,1-16,0V168a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H76.7A79.9,79.9,0,0,0,128,208a80,80,0,0,0,80-80,8,8,0,0,1,16,0ZM48,88a8,8,0,0,1,8-8H84.3A79.9,79.9,0,0,1,128,48a80,80,0,0,1,80,80,8,8,0,0,1,16,0A96,96,0,0,0,64,60.1V40a8,8,0,0,1-16,0V88A8,8,0,0,1,48,88Z"/>
                  </svg>
                  <span>{t.syncIncomes}</span>
                </button>
                <AddMoreButton label={t.addInvestment} onClick={() => setIsAssetFormOpen((current) => !current)}></AddMoreButton>
              </div>
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
                <label className='asset-date-input-label'>
                  <span>{t.investmentDate}</span>
                  <input
                    type='date'
                    aria-label={t.investmentDate}
                    max={database.simulatedDate}
                    value={assetForm.creationDate || ''}
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
                            aria-label={t.investmentDate}
                            max={database.simulatedDate}
                            value={editAssetForm.creationDate || ''}
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

          <div className='balance-chart-card balance-graphic-card'>
            <div className='balance-graphic-header'>
              <div className='graphic-title-group'>
                <h2>{t.moneyBalance}</h2>
                <span className='graphic-subtitle'>{t.capitalAllocation}</span>
              </div>
              <div className='graphic-total-badge'>
                <span className='total-badge-label'>{t.totalFlow}</span>
                <strong>R$ {displayMoney(totalBalance)}</strong>
              </div>
            </div>

            <div className='balance-visual-track-wrap'>
              <div className='balance-track-header'>
                <span className='track-marker invested-marker'>
                  <span className='marker-dot invested'></span>
                  {t.invested}: <strong>{formatDecimal(investedRatio)}%</strong>
                </span>
                <span className='track-marker spent-marker'>
                  <span className='marker-dot spent'></span>
                  {t.spent}: <strong>{formatDecimal(spentRatio)}%</strong>
                </span>
              </div>
              <div
                className='balance-proportional-bar'
                role='progressbar'
                aria-valuenow={investedRatio}
                aria-valuemin='0'
                aria-valuemax='100'
                aria-label={t.moneyBalance}
              >
                <div
                  className='bar-segment invested-segment'
                  style={{ width: `${totalBalance > 0 ? Math.max(investedRatio, 3) : 50}%` }}
                  title={`${t.invested}: R$ ${displayMoney(investedTotal)} (${formatDecimal(investedRatio)}%)`}
                >
                  {investedRatio >= 14 && <span className='segment-label'>{formatDecimal(investedRatio)}%</span>}
                </div>
                <div
                  className='bar-segment spent-segment'
                  style={{ width: `${totalBalance > 0 ? Math.max(spentRatio, 3) : 50}%` }}
                  title={`${t.spent}: R$ ${displayMoney(spentTotal)} (${formatDecimal(spentRatio)}%)`}
                >
                  {spentRatio >= 14 && <span className='segment-label'>{formatDecimal(spentRatio)}%</span>}
                </div>
              </div>
            </div>

            <div className='balance-graphic-grid'>
              <div className='graphic-flow-card invested-flow'>
                <div className='flow-card-top'>
                  <div className='flow-icon-wrap invested'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M240,56v48a8,8,0,0,1-13.66,5.66L205.66,89,141.66,153a8,8,0,0,1-11.32,0L96,118.63,29.66,185a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0L136,136.69l58.34-58.35L173.66,57.66A8,8,0,0,1,184,48h48A8,8,0,0,1,240,56Z"></path>
                    </svg>
                  </div>
                  <div className='flow-meta'>
                    <span className='flow-type-label'>{t.invested}</span>
                    <span className='flow-ratio-pill invested'>{formatDecimal(investedRatio)}%</span>
                  </div>
                </div>
                <strong className='flow-amount'>R$ {displayMoney(investedTotal)}</strong>
                <div className='flow-bar-container'>
                  <div className='flow-mini-bar invested' style={{ width: `${totalBalance > 0 ? investedRatio : 0}%` }}></div>
                </div>
              </div>

              <div className='graphic-flow-card spent-flow'>
                <div className='flow-card-top'>
                  <div className='flow-icon-wrap spent'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M240,192a8,8,0,0,1-8,8H184a8,8,0,0,1-5.66-13.66L199,165.66l-58.34-58.35L106.34,142a8,8,0,0,1-11.32,0l-72-72A8,8,0,0,1,34.34,58.69L96,120.34l34.34-34.35a8,8,0,0,1,11.32,0l64,64,20.68-20.69A8,8,0,0,1,240,136Z"></path>
                    </svg>
                  </div>
                  <div className='flow-meta'>
                    <span className='flow-type-label'>{t.spent}</span>
                    <span className='flow-ratio-pill spent'>{formatDecimal(spentRatio)}%</span>
                  </div>
                </div>
                <strong className='flow-amount'>R$ {displayMoney(spentTotal)}</strong>
                <div className='flow-bar-container'>
                  <div className='flow-mini-bar spent' style={{ width: `${totalBalance > 0 ? spentRatio : 0}%` }}></div>
                </div>
              </div>
            </div>

            {database.assets.length > 0 && investedTotal > 0 && (
              <div className='balance-asset-breakdown'>
                <div className='asset-breakdown-header'>
                  <span className='asset-breakdown-title'>{locale === 'pt' ? 'Composição dos Investimentos' : 'Investment Portfolio Breakdown'}</span>
                  <span className='asset-breakdown-count'>{database.assets.length} {t.investmentsCount}</span>
                </div>
                <div className='breakdown-track' role='progressbar' aria-label={locale === 'pt' ? 'Composição dos Investimentos' : 'Investment Portfolio Breakdown'}>
                  {database.assets.map((asset, index) => {
                    const ratio = investedTotal > 0 ? (asset.investedAmount / investedTotal) * 100 : 0;
                    const colors = [
                      'hsl(156, 72%, 46%)',
                      'hsl(190, 85%, 48%)',
                      'hsl(215, 85%, 60%)',
                      'hsl(280, 75%, 65%)',
                      'hsl(42, 90%, 55%)',
                      'hsl(340, 80%, 60%)'
                    ];
                    const color = colors[index % colors.length];
                    return (
                      <div
                        key={asset.id}
                        className='breakdown-segment'
                        style={{ width: `${Math.max(ratio, 1.5)}%`, backgroundColor: color }}
                        title={`${asset.name}: R$ ${displayMoney(asset.investedAmount)} (${formatDecimal(ratio)}%)`}
                      />
                    );
                  })}
                </div>
                <div className='breakdown-legend'>
                  {database.assets.map((asset, index) => {
                    const ratio = investedTotal > 0 ? (asset.investedAmount / investedTotal) * 100 : 0;
                    const colors = [
                      'hsl(156, 72%, 46%)',
                      'hsl(190, 85%, 48%)',
                      'hsl(215, 85%, 60%)',
                      'hsl(280, 75%, 65%)',
                      'hsl(42, 90%, 55%)',
                      'hsl(340, 80%, 60%)'
                    ];
                    const color = colors[index % colors.length];
                    return (
                      <div key={asset.id} className='breakdown-legend-item'>
                        <span className='legend-color-dot' style={{ backgroundColor: color }} />
                        <span className='legend-asset-name'>{asset.name}</span>
                        <strong className='legend-asset-pct'>{formatDecimal(ratio)}%</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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

      <TigerMascot
        isWeekendOrHoliday={isWeekendOrHoliday}
        isSyncing={isSyncing}
        hasRecovery={hasRecovery}
        hasReadyWishlist={hasReadyWishlist}
        isMilestoneClose={isMilestoneClose}
        locale={locale}
      />
    </div>
  );
}

export default App;
