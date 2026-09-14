import { useEffect, useState, useCallback } from 'react';
import './App.css';
import Header from './Components/Header/Header';
import MiddleMilestoneCard from './Components/MiddleMilestoneCard/MiddleMilestoneCard';
import SectionButton from './Components/SectionButton/SectionButton';
import TimeArea from './Components/TimeArea/TimeArea';
import MiddleNetWorthCard from './MiddleNetWorthCard/MiddleNetWorthCard';
import AddMoreButton from './Components/AddMoreButton/AddMoreButton';
import RemoveButton from './Components/RemoveButton/RemoveButton';
import CatchUpModal from './Components/CatchUpModal/CatchUpModal';
import SimulationArea from './Components/SimulationArea/SimulationArea';
import { formatDecimal, formatMoney } from './utils/formatters';
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
  DEFAULT_CDI_RATE
} from './utils/cdi';

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
    decreaseDays: 'Reset Incomes',
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
    retry: 'Retry'
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
    decreaseDays: 'Resetar rendimentos',
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
    retry: 'Tentar novamente'
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
        creationDate
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
  const [database, setDatabase] = useState(readDatabase);
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({ name: '', yieldRate: '', investedAmount: '' });
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

  const t = APP_TEXT[locale] || APP_TEXT.en;

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
      // If there's an existing simulatedDate older than today, catch up from it.
      // Otherwise initialize to today.
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

    // Fetch CDI rate for each business day
    const dayRates = {};
    for (const day of businessDaysList) {
      const key = getDateKey(day);
      dayRates[key] = await fetchHistoricalCDI(key, currentCdi);
    }

    let accruedSum = 0;
    const completed = [];

    setDatabase((current) => {
      let assets = JSON.parse(JSON.stringify(current.assets || []));
      let wishlistSlots = JSON.parse(JSON.stringify(current.wishlistSlots || []));
      let recoverySlots = JSON.parse(JSON.stringify(current.recoverySlots || []));
      let recoverySpentTotal = Number(current.recoverySpentTotal || 0);

      for (const day of businessDaysList) {
        const dayKey = getDateKey(day);
        const dayRate = dayRates[dayKey] || currentCdi;
        let dayYield = 0;

        assets = assets.map((asset) => {
          const income = calculateDailyYield(asset.investedAmount, asset.yieldRate, dayRate);
          dayYield += income;
          const prev = Number(asset.incomeHistory?.[dayKey] || 0);
          return {
            ...asset,
            investedAmount: Number(asset.investedAmount || 0) + income,
            totalIncome: Number(asset.totalIncome || 0) + income,
            incomeHistory: {
              ...(asset.incomeHistory || {}),
              [dayKey]: prev + income
            }
          };
        });

        accruedSum += dayYield;

        // Apply yield to Recovery first, then Wishlist
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

      return {
        ...current,
        assets,
        wishlistSlots,
        recoverySlots,
        recoverySpentTotal,
        simulatedDate: currentDateKey,
        incomeHistory: rebuildIncomeHistory(assets)
      };
    });

    window.localStorage.setItem('kyos-last-opened-date', currentDateKey);

    setCatchUpModalData({
      isOpen: true,
      businessDays: businessDaysList.length,
      calendarDays,
      totalAccrued: accruedSum,
      completedSlots: completed
    });
  }, [database.simulatedDate]);

  // Pre-fetch Brazilian holidays & execute catch-up
  const loadHolidaysAndCatchUp = useCallback(async () => {
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
            // Non-blocking for past year
          }
        }
      }
      setHolidaysList(holidays);
      setHolidaysError(false);
    } catch (err) {
      // Resiliency rule: Block auto-update calculations & display error banner
      setHolidaysError(true);
      return;
    }

    await processMissedDays(holidays, cdiRate);
  }, [cdiRate, processMissedDays]);

  useEffect(() => {
    loadHolidaysAndCatchUp();
  }, [loadHolidaysAndCatchUp]);

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
  const todayIncome = getIncomeForDate(actualDate);
  const yesterdayIncome = getIncomeForDate(shiftDate(actualDate, -1));
  const weekIncome = getIncomeBetween(startOfWeek, actualDate);
  const previousWeekIncome = getIncomeBetween(previousWeekStart, previousWeekEnd);
  const monthIncome = getIncomeBetween(startOfMonth, actualDate);
  const previousMonthIncome = getIncomeBetween(previousMonthStart, previousMonthEnd);
  const yearIncome = getIncomeBetween(startOfYear, actualDate);
  const previousYearIncome = getIncomeBetween(previousYearStart, previousYearEnd);
  const netWorthTotal = investedTotal;
  const totalDailyIncome = database.assets.reduce((total, asset) => total + getDailyAssetIncome(asset, cdiRate), 0);
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
    setDatabase((current) => ({
      ...current,
      assets: [...current.assets, {
        id: `${Date.now()}-${Math.random()}`,
        name: assetForm.name.trim(),
        yieldRate: Number(assetForm.yieldRate || 0),
        investedAmount: Number(assetForm.investedAmount),
        initialInvestedAmount: Number(assetForm.investedAmount),
        totalIncome: 0,
        incomeHistory: {},
        creationDate: current.simulatedDate
      }]
    }));
    setAssetForm({ name: '', yieldRate: '', investedAmount: '' });
    setIsAssetFormOpen(false);
  };

  const removeAsset = (id) => {
    setDatabase((current) => {
      const assets = current.assets.filter((asset) => asset.id !== id);
      return { ...current, assets, incomeHistory: rebuildIncomeHistory(assets) };
    });
  };

  const resetIncomes = () => {
    setDatabase((current) => {
      const assets = current.assets.map((asset) => ({
        ...asset,
        investedAmount: Math.max(toFiniteNumber(asset.initialInvestedAmount), 0),
        totalIncome: 0,
        incomeHistory: {}
      }));
      return {
        ...current,
        assets,
        simulatedDate: getDateKey(new Date()),
        incomeHistory: {}
      };
    });
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
              <span className='total-daily-income'>{t.totalDailyIncome}: R$ {displayMoney(totalDailyIncome)}</span>
              <AddMoreButton label={t.addInvestment} onClick={() => setIsAssetFormOpen((current) => !current)}></AddMoreButton>
              <button className='simulate-day-button' type='button' onClick={resetIncomes}>{t.decreaseDays}</button>
            </div>
            {isAssetFormOpen && (
              <form className='asset-form' onSubmit={addAsset}>
                <input placeholder={t.name} value={assetForm.name} onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })} required />
                <input placeholder={t.yieldRate} type='number' min='0' step='0.01' value={assetForm.yieldRate} onChange={(event) => setAssetForm({ ...assetForm, yieldRate: event.target.value })} />
                <input placeholder={t.investedAmount} type='number' min='0' step='0.01' value={assetForm.investedAmount} onChange={(event) => setAssetForm({ ...assetForm, investedAmount: event.target.value })} required />
                <button type='submit'>{t.add}</button>
              </form>
            )}
            <div className='assets-grid'>
              {database.assets.map((asset) => (
                <div className='asset-card' key={asset.id}>
                  <div className='asset-title'><strong>{asset.name}</strong><RemoveButton label={t.removeSlot} onClick={() => removeAsset(asset.id)}></RemoveButton></div>
                  <strong>{t.yield}</strong><p>{formatDecimal(asset.yieldRate)}% {t.cdi}</p>
                  <strong>{t.invested}</strong><p>R$ {displayMoney(asset.investedAmount)}</p>
                  <strong>{t.dailyIncome}</strong><p>R$ {displayMoney(getDailyAssetIncome(asset, cdiRate))}</p>
                  <strong>{t.totalIncome}</strong><p>R$ {displayMoney(asset.totalIncome)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'Balance') {
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
            <div className='balance-donut' style={{ '--spent-ratio': `${spentTotal + investedTotal ? (spentTotal / (spentTotal + investedTotal)) * 100 : 0}%` }} aria-label='Money balance chart'></div>
            <div className='balance-legend'>
              <h2>{t.moneyBalance}</h2>
              <p><span className='legend-swatch invested'></span>{t.invested}</p>
              <p><span className='legend-swatch spent'></span>{t.spent}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className='middle-summary'>
          <div className='middle-summary-main'>
            <MiddleNetWorthCard title={t.total} money={displayMoney(netWorthTotal)} investments={database.assets.length} investmentLabel={t.investmentsCount}></MiddleNetWorthCard>
            <MiddleMilestoneCard title={t.milestone} next={displayMoney(nextMilestone)} remaining={`${displayMoney(milestoneRemaining)} - ${milestoneDays} ${t.days}`}></MiddleMilestoneCard>
          </div>
          <div className='middle-summary-side'>
            <div className='summary-card today-card'>
              <h2>{t.today}</h2>
              <strong>R$ {displayMoney(todayIncome)} <span className={`trend ${todayTrend.className}`}>{todayTrend.symbol}</span></strong>
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
      {holidaysError && (
        <div className='holiday-error-banner' role='alert'>
          <span>⚠️ {t.holidayError}</span>
          <button type='button' onClick={loadHolidaysAndCatchUp}>{t.retry}</button>
        </div>
      )}
      <Header
        locale={locale}
        isLightTheme={isLightTheme}
        areValuesVisible={areValuesVisible}
        onToggleValues={() => setAreValuesVisible((current) => !current)}
        onToggleTheme={() => setIsLightTheme((current) => !current)}
        onChangeLocale={(nextLocale) => setLocale(nextLocale)}
        labelSet={t}
      ></Header>
      <div className='app-areas'>
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
        ></TimeArea>
        <div className='middle'>
          <div className='section-buttons'>
            <SectionButton title={t.netWorth} active={activeSection === 'Net Worth'} onClick={() => setActiveSection('Net Worth')}></SectionButton>
            <SectionButton title={t.balance} active={activeSection === 'Balance'} onClick={() => setActiveSection('Balance')}></SectionButton>
            <SectionButton title={t.investments} active={activeSection === 'Investments'} onClick={() => setActiveSection('Investments')}></SectionButton>
            <SectionButton title={t.simulation} active={activeSection === 'Simulation'} onClick={() => setActiveSection('Simulation')}></SectionButton>
          </div>
          {renderMiddleContent()}
        </div>
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
        ></TimeArea>
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
    </div>
  );
}

export default App;
