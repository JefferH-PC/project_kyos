import { useEffect, useState } from 'react';
import './App.css';
import Header from './Components/Header/Header';
import MiddleMilestoneCard from './Components/MiddleMilestoneCard/MiddleMilestoneCard';
import SectionButton from './Components/SectionButton/SectionButton';
import TimeArea from './Components/TimeArea/TimeArea';
import MiddleNetWorthCard from './MiddleNetWorthCard/MiddleNetWorthCard';
import AddMoreButton from './Components/AddMoreButton/AddMoreButton';
import RemoveButton from './Components/RemoveButton/RemoveButton';
import { formatDecimal, formatMoney } from './utils/formatters';

const CDI_RATE = 0.051660;
const CDI_API_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json';
const DATABASE_VERSION = 9;
const toFiniteNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateBrazilian = (dateKey) => {
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const isValidDateKey = (dateKey) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const shiftDate = (date, amount) => {
  const shiftedDate = new Date(date);
  shiftedDate.setDate(shiftedDate.getDate() + amount);
  return shiftedDate;
};

const getEasterSunday = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

const getBrazilianNationalHolidays = (year) => {
  const easter = getEasterSunday(year);
  return new Set([
    `${year}-01-01`,
    getDateKey(shiftDate(easter, -2)),
    `${year}-04-21`,
    `${year}-05-01`,
    `${year}-09-07`,
    `${year}-10-12`,
    `${year}-11-02`,
    `${year}-11-15`,
    `${year}-11-20`,
    `${year}-12-25`
  ]);
};

const getDailyAssetIncome = (asset, cdiRate) => Number(asset.investedAmount || 0) * (Number(asset.yieldRate || 0) / 100) * (cdiRate / 100);
const getIncomeDaysInYear = (year) => {
  const holidays = getBrazilianNationalHolidays(year);
  let incomeDays = 0;
  for (let date = new Date(year, 0, 1); date.getFullYear() === year; date = shiftDate(date, 1)) {
    if (date.getDay() !== 0 && date.getDay() !== 6 && !holidays.has(getDateKey(date))) incomeDays += 1;
  }
  return incomeDays;
};
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
    database: 'Database',
    localDatabase: 'Local Database',
    saveDatabase: 'Save database',
    topInvestment: 'Top Investment',
    cdi: 'CDI',
    assets: 'Assets',
    date: 'Date',
    decreaseDays: 'Decrease days',
    increaseDays: 'Increase days',
    add: 'Add',
    name: 'Name',
    yieldRate: 'Yield %',
    investedAmount: 'Invested amount',
    yield: 'Yield',
    invested: 'Invested',
    dailyIncome: 'Daily income',
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
    editDatabase: 'Edit local database'
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
    database: 'Banco de dados',
    localDatabase: 'Banco de dados local',
    saveDatabase: 'Salvar banco de dados',
    topInvestment: 'Maior investimento',
    cdi: 'CDI',
    assets: 'Ativos',
    date: 'Data',
    decreaseDays: 'Diminuir dias',
    increaseDays: 'Aumentar dias',
    add: 'Adicionar',
    name: 'Nome',
    yieldRate: 'Rendimento %',
    investedAmount: 'Valor investido',
    yield: 'Rendimento',
    invested: 'Investido',
    dailyIncome: 'Rendimento diário',
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
    editDatabase: 'Editar banco de dados local'
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
  incomeHistory: {}
};

const normalizeDatabase = (parsedDatabase, resetIncome = false) => {
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
        investedAmount: resetIncome ? baseAmount : Math.max(investedAmount, 0),
        initialInvestedAmount: baseAmount,
        totalIncome: resetIncome ? 0 : Math.max(totalIncome, 0),
        incomeHistory: resetIncome ? {} : normalizeIncomeHistory(asset.incomeHistory),
        creationDate
      };
    }) : [];
  return {
    ...defaultDatabase,
    ...parsedDatabase,
    schemaVersion: DATABASE_VERSION,
    wishlistSlots: Array.isArray(parsedDatabase.wishlistSlots) ? parsedDatabase.wishlistSlots.filter((slot) => slot && typeof slot === 'object' && !preAddedSlotIds.includes(slot.id)) : [],
    recoverySlots: Array.isArray(parsedDatabase.recoverySlots) ? parsedDatabase.recoverySlots.filter((slot) => slot && typeof slot === 'object' && !preAddedSlotIds.includes(slot.id)) : [],
    assets,
    milestone: { ...defaultDatabase.milestone, ...(parsedDatabase.milestone || {}), target: Math.max(toFiniteNumber(parsedDatabase.milestone?.target), 0) },
    purchasedTotal: Math.max(toFiniteNumber(parsedDatabase.purchasedTotal), 0),
    simulatedDate: resetIncome ? getDateKey(new Date()) : parsedDate,
    incomeHistory: rebuildIncomeHistory(assets)
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
  const [daysToSimulate, setDaysToSimulate] = useState('1');
  const [cdiRate, setCdiRate] = useState(CDI_RATE);
  const [areValuesVisible, setAreValuesVisible] = useState(true);
  const [databaseDraft, setDatabaseDraft] = useState('');
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

  useEffect(() => {
    let isCancelled = false;
    fetch(CDI_API_URL)
      .then((response) => {
        if (!response.ok) throw new Error('CDI request failed');
        return response.json();
      })
      .then((data) => {
        const dailyRate = Number(String(data[0]?.valor || '').replace(',', '.'));
        if (!isCancelled && Number.isFinite(dailyRate)) {
          setCdiRate(dailyRate);
        }
      })
      .catch(() => {
        // Keep the fallback CDI rate when the external service is unavailable.
      });
    return () => { isCancelled = true; };
  }, []);

  const wishlistTotal = database.wishlistSlots.reduce((total, slot) => total + Math.max(toFiniteNumber(slot.price), 0), 0);
  const recoveryTotal = database.recoverySlots.reduce((total, slot) => total + Math.max(toFiniteNumber(slot.price), 0), 0);
  const investedTotal = database.assets.reduce((total, asset) => total + Math.max(toFiniteNumber(asset.investedAmount), 0), 0);
  const topInvestment = database.assets.reduce((top, asset) => toFiniteNumber(asset.investedAmount) > toFiniteNumber(top.investedAmount) ? asset : top, { name: 'None', investedAmount: 0 });
  const simulatedDate = parseDateKey(database.simulatedDate);
  const annualCdiRate = ((1 + cdiRate / 100) ** getIncomeDaysInYear(simulatedDate.getFullYear()) - 1) * 100;
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
  const startOfWeek = shiftDate(simulatedDate, -(simulatedDate.getDay() === 0 ? 6 : simulatedDate.getDay() - 1));
  const startOfMonth = new Date(simulatedDate.getFullYear(), simulatedDate.getMonth(), 1);
  const startOfYear = new Date(simulatedDate.getFullYear(), 0, 1);
  const previousWeekStart = shiftDate(startOfWeek, -7);
  const previousWeekEnd = shiftDate(startOfWeek, -1);
  const previousMonthStart = new Date(simulatedDate.getFullYear(), simulatedDate.getMonth() - 1, 1);
  const previousMonthEnd = new Date(simulatedDate.getFullYear(), simulatedDate.getMonth(), 0);
  const previousYearStart = new Date(simulatedDate.getFullYear() - 1, 0, 1);
  const previousYearEnd = new Date(simulatedDate.getFullYear() - 1, 11, 31);
  const todayIncome = getIncomeForDate(simulatedDate);
  const yesterdayIncome = getIncomeForDate(shiftDate(simulatedDate, -1));
  const weekIncome = getIncomeBetween(startOfWeek, simulatedDate);
  const previousWeekIncome = getIncomeBetween(previousWeekStart, previousWeekEnd);
  const monthIncome = getIncomeBetween(startOfMonth, simulatedDate);
  const previousMonthIncome = getIncomeBetween(previousMonthStart, previousMonthEnd);
  const yearIncome = getIncomeBetween(startOfYear, simulatedDate);
  const previousYearIncome = getIncomeBetween(previousYearStart, previousYearEnd);
  const netWorthTotal = investedTotal;
  const spentTotal = recoveryTotal + Math.max(toFiniteNumber(database.purchasedTotal), 0);
  const milestoneRemaining = Math.max(Number(database.milestone.target) - netWorthTotal, 0);
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

  const simulateDays = (direction) => {
    setDatabase((current) => {
      const days = Math.max(1, Math.floor(Number(daysToSimulate) || 1));
      let nextDate = parseDateKey(current.simulatedDate);
      let assets = current.assets;

      for (let day = 0; day < days; day += 1) {
        nextDate = shiftDate(nextDate, direction);
        const simulationDate = nextDate;
        const nextDateKey = getDateKey(simulationDate);
        if (direction > 0) {
          assets = assets.map((asset) => {
            const dailyIncome = getDailyAssetIncome(asset, cdiRate);
            const previousIncome = Number(asset.incomeHistory?.[nextDateKey] || 0);
            return {
              ...asset,
              investedAmount: Number(asset.investedAmount || 0) + dailyIncome,
              totalIncome: Number(asset.totalIncome || 0) + dailyIncome,
              incomeHistory: { ...(asset.incomeHistory || {}), [nextDateKey]: previousIncome + dailyIncome }
            };
          });
        } else {
          assets = assets.map((asset) => {
            const dailyIncome = Number(asset.incomeHistory?.[nextDateKey] || getDailyAssetIncome(asset, cdiRate));
            const { [nextDateKey]: removedIncome, ...remainingIncomeHistory } = asset.incomeHistory || {};
            const availableIncome = Math.max(toFiniteNumber(asset.totalIncome), 0);
            const incomeReduction = Math.min(Math.max(dailyIncome, 0), availableIncome);
            return {
              ...asset,
              investedAmount: Math.max(toFiniteNumber(asset.investedAmount) - incomeReduction, 0),
              totalIncome: availableIncome - incomeReduction,
              incomeHistory: remainingIncomeHistory
            };
          });
        }
      }

      return {
        ...current,
        assets,
        simulatedDate: getDateKey(nextDate),
        incomeHistory: rebuildIncomeHistory(assets)
      };
    });
  };

  const recordWishlistPurchase = (amount) => {
    setDatabase((current) => ({ ...current, purchasedTotal: Number(current.purchasedTotal || 0) + Number(amount || 0) }));
  };

  const openDatabaseSection = () => {
    setDatabaseDraft(JSON.stringify(database, null, 2));
    setActiveSection('Database');
  };

  const saveDatabaseDraft = () => {
    try {
      const parsedDraft = JSON.parse(databaseDraft);
      if (!Array.isArray(parsedDraft.wishlistSlots) || !Array.isArray(parsedDraft.recoverySlots) || !Array.isArray(parsedDraft.assets)) return;
      setDatabase(normalizeDatabase(parsedDraft, parsedDraft.schemaVersion !== DATABASE_VERSION));
    } catch {
      return;
    }
  };

  const renderMiddleContent = () => {
    if (activeSection === 'Database') {
      return (
        <div className='database-view'>
          <div className='database-heading'>
            <h2>{t.localDatabase}</h2>
            <span>{database.wishlistSlots.length + database.recoverySlots.length} slots | {database.assets.length} {t.assets.toLowerCase()}</span>
          </div>
          <textarea value={databaseDraft} onChange={(event) => setDatabaseDraft(event.target.value)} aria-label={t.editDatabase}></textarea>
          <button className='database-save' type='button' onClick={saveDatabaseDraft}>{t.saveDatabase}</button>
        </div>
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
              <strong>{formatDecimal(annualCdiRate)}%</strong>
            </div>
          </div>
          <div className='assets-panel'>
            <div className='assets-heading'>
              <h2>{t.assets}</h2>
              <AddMoreButton label={t.addExpense} onClick={() => setIsAssetFormOpen((current) => !current)}></AddMoreButton>
              <span className='simulated-date'>{t.date}: {formatDateBrazilian(database.simulatedDate)}</span>
              <div className='simulate-days-control'>
                <input className='simulate-days-input' type='number' min='1' step='1' value={daysToSimulate} onChange={(event) => setDaysToSimulate(event.target.value)} aria-label='Days to simulate' />
                <button className='simulate-day-button' type='button' onClick={() => simulateDays(-1)}>{t.decreaseDays}</button>
                <button className='simulate-day-button' type='button' onClick={() => simulateDays(1)}>{t.increaseDays}</button>
              </div>
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
              <strong>{simulatedDate.getFullYear()}</strong>
              <strong>R$ {displayMoney(spentTotal)}</strong>
              <h3>{t.lastYear}</h3>
              <strong>R$ {displayMoney(0)}</strong>
            </div>
            <div className='balance-card'>
              <h2>{t.invested}</h2>
              <strong>{simulatedDate.getFullYear()}</strong>
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
            <MiddleMilestoneCard title={t.milestone} next={displayMoney(database.milestone.target)} remaining={`${displayMoney(milestoneRemaining)} - X ${t.days}`}></MiddleMilestoneCard>
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
              <strong>{formatDecimal(annualCdiRate)}%</strong>
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
      <Header locale={locale} isLightTheme={isLightTheme} areValuesVisible={areValuesVisible} onToggleValues={() => setAreValuesVisible((current) => !current)} onToggleTheme={() => setIsLightTheme((current) => !current)} onChangeLocale={(nextLocale) => setLocale(nextLocale)} labelSet={t}></Header>
      <div className='app-areas'>
        <TimeArea title={t.wishlist} area='wishlist' labels={{ add: t.add, expenseName: t.expenseName, expenseValue: t.expenseValue, total: t.totalLabel }} slots={database.wishlistSlots} onSlotsChange={(slots) => updateSlots('wishlistSlots', slots)} onBuy={recordWishlistPurchase} total={wishlistTotal} className='wishlist'></TimeArea>
        <div className='middle'>
          <div className='section-buttons'>
            <SectionButton title={t.netWorth} active={activeSection === 'Net Worth'} onClick={() => setActiveSection('Net Worth')}></SectionButton>
            <SectionButton title={t.balance} active={activeSection === 'Balance'} onClick={() => setActiveSection('Balance')}></SectionButton>
            <SectionButton title={t.investments} active={activeSection === 'Investments'} onClick={() => setActiveSection('Investments')}></SectionButton>
            <SectionButton title={t.database} active={activeSection === 'Database'} onClick={openDatabaseSection}></SectionButton>
          </div>
          {renderMiddleContent()}
        </div>
        <TimeArea title={t.recovery} area='recovery' labels={{ add: t.add, expenseName: t.expenseName, expenseValue: t.expenseValue, total: t.totalLabel }} slots={database.recoverySlots} onSlotsChange={(slots) => updateSlots('recoverySlots', slots)} total={recoveryTotal} className='recovery'></TimeArea>
      </div>
    </div>
  );
}

export default App;
