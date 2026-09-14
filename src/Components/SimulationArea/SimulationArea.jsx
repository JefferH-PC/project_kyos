import React, { useState, useEffect, useMemo } from 'react';
import './SimulationArea.css';
import { formatMoney, formatDecimal } from '../../utils/formatters';
import {
  getDateKey,
  parseDateKey,
  shiftDate,
  getBusinessDaysInRange,
  fetchBrazilianHolidays
} from '../../utils/calendar';
import { calculateDailyYield, calculateAnnualizedCDI, DEFAULT_CDI_RATE } from '../../utils/cdi';

const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
};

const DAY_NAMES = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
};

const TEXT = {
  en: {
    title: 'Dedicated Simulation Environment',
    resetToLive: 'Reset to Live Baseline',
    clearAll: 'Clear All',
    cdiOverride: 'Simulation CDI (% daily):',
    cdiAnnual: 'Annual equivalent:',
    calendarTitle: 'Select Target Future Date',
    nonWorkingLegend: 'Non-working (Weekend / Holiday)',
    workingLegend: 'Business Day',
    baselineLegend: 'Baseline Date',
    targetLegend: 'Target Date',
    projectionsTitle: 'Projection Results',
    baselineDate: 'Baseline Date',
    targetDate: 'Target Date',
    calendarDays: 'Calendar Days',
    businessDays: 'Business Days',
    projectedYield: 'Projected Income',
    projectedNetWorth: 'Projected Net Worth',
    completedItems: 'Projected Completed Items',
    noCompletedItems: 'No items would be completed in this timeframe.',
    assetsSummary: 'Projected Assets',
    weekend: 'Weekend',
    holiday: 'Holiday',
    businessDay: 'Business day',
    wishlist: 'Wishlist',
    recovery: 'Recovery'
  },
  pt: {
    title: 'Ambiente Dedicado de Simulação',
    resetToLive: 'Restaurar Dados Reais',
    clearAll: 'Limpar Tudo',
    cdiOverride: 'CDI da Simulação (% diário):',
    cdiAnnual: 'Equivalente anual:',
    calendarTitle: 'Selecionar Data Futura Alvo',
    nonWorkingLegend: 'Não útil (Fim de semana / Feriado)',
    workingLegend: 'Dia Útil',
    baselineLegend: 'Data Base',
    targetLegend: 'Data Alvo',
    projectionsTitle: 'Resultados da Projeção',
    baselineDate: 'Data Base',
    targetDate: 'Data Alvo',
    calendarDays: 'Dias Corridos',
    businessDays: 'Dias Úteis',
    projectedYield: 'Rendimento Projetado',
    projectedNetWorth: 'Patrimônio Projetado',
    completedItems: 'Itens Concluídos na Projeção',
    noCompletedItems: 'Nenhum item seria concluído neste intervalo.',
    assetsSummary: 'Ativos Projetados',
    weekend: 'Fim de semana',
    holiday: 'Feriado',
    businessDay: 'Dia útil',
    wishlist: 'Lista de Desejos',
    recovery: 'Recuperação'
  }
};

const cloneState = (database) => {
  return JSON.parse(JSON.stringify(database || {}));
};

const SimulationArea = ({
  mainDatabase,
  liveCdiRate = DEFAULT_CDI_RATE,
  holidaysList = [],
  locale = 'en'
}) => {
  const t = TEXT[locale] || TEXT.en;
  const monthNames = MONTH_NAMES[locale] || MONTH_NAMES.en;
  const dayNames = DAY_NAMES[locale] || DAY_NAMES.en;

  // Isolated simulation state
  const [simDatabase, setSimDatabase] = useState(() => cloneState(mainDatabase));
  const [customCdi, setCustomCdi] = useState(liveCdiRate);
  const [targetDate, setTargetDate] = useState('');
  const [holidaysMap, setHolidaysMap] = useState({});

  // Calendar month/year navigation
  const baselineDateKey = simDatabase.simulatedDate || getDateKey(new Date());
  const baselineDateObj = useMemo(() => parseDateKey(baselineDateKey), [baselineDateKey]);

  const [calendarYear, setCalendarYear] = useState(() => baselineDateObj.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => baselineDateObj.getMonth());

  // Load and cache holidays for current calendar view year
  useEffect(() => {
    let isCancelled = false;
    fetchBrazilianHolidays(calendarYear)
      .then((data) => {
        if (isCancelled || !Array.isArray(data)) return;
        const map = {};
        data.forEach((h) => {
          if (h && h.date) map[h.date] = h;
        });
        setHolidaysMap((current) => ({ ...current, ...map }));
      })
      .catch(() => {
        // Handled gracefully via existing cache
      });
    return () => {
      isCancelled = true;
    };
  }, [calendarYear]);

  // Merge initial holidaysList into holidaysMap
  useEffect(() => {
    if (Array.isArray(holidaysList) && holidaysList.length > 0) {
      const map = {};
      holidaysList.forEach((h) => {
        if (h && h.date) map[h.date] = h;
      });
      setHolidaysMap((current) => ({ ...map, ...current }));
    }
  }, [holidaysList]);

  // Keep CDI default aligned with live rate initially
  useEffect(() => {
    if (customCdi === DEFAULT_CDI_RATE && liveCdiRate) {
      setCustomCdi(liveCdiRate);
    }
  }, [liveCdiRate, customCdi]);

  // Actions
  const handleResetToBaseline = () => {
    setSimDatabase(cloneState(mainDatabase));
    setCustomCdi(liveCdiRate);
    setTargetDate('');
  };

  const handleClearAll = () => {
    setSimDatabase({
      ...simDatabase,
      assets: [],
      wishlistSlots: [],
      recoverySlots: [],
      purchasedTotal: 0,
      recoverySpentTotal: 0,
      incomeHistory: {}
    });
    setTargetDate('');
  };

  // Calendar navigation
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  // Projection calculation
  const projection = useMemo(() => {
    if (!targetDate) return null;

    const targetDateObj = parseDateKey(targetDate);
    if (targetDateObj <= baselineDateObj) return null;

    // Determine calendar days
    const diffTime = targetDateObj.getTime() - baselineDateObj.getTime();
    const calendarDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Get business days strictly between baseline (exclusive) and target (inclusive)
    const startDate = shiftDate(baselineDateObj, 1);
    const holidaysArray = Object.values(holidaysMap);
    const businessDaysList = getBusinessDaysInRange(startDate, targetDateObj, holidaysArray);

    let assets = JSON.parse(JSON.stringify(simDatabase.assets || []));
    let wishlistSlots = JSON.parse(JSON.stringify(simDatabase.wishlistSlots || []));
    let recoverySlots = JSON.parse(JSON.stringify(simDatabase.recoverySlots || []));
    const completedSlots = [];
    let totalProjectedIncome = 0;

    const rateToUse = Number(customCdi) || 0;

    businessDaysList.forEach((dayDate) => {
      let dayTotalYield = 0;

      assets = assets.map((asset) => {
        const yieldAmount = calculateDailyYield(asset.investedAmount, asset.yieldRate, rateToUse);
        dayTotalYield += yieldAmount;
        return {
          ...asset,
          investedAmount: Number(asset.investedAmount || 0) + yieldAmount,
          totalIncome: Number(asset.totalIncome || 0) + yieldAmount
        };
      });

      totalProjectedIncome += dayTotalYield;

      // Distribute yield to recovery first
      const recoveryIndex = recoverySlots.findIndex((s) => s.type === 'recovery' && s.isProcessing);
      const wishlistProcessingIndex = wishlistSlots.findIndex((s) => s.type === 'processing');
      const wishlistIndex = recoveryIndex === -1
        ? wishlistProcessingIndex >= 0
          ? wishlistProcessingIndex
          : wishlistSlots.findIndex((s) => s.type === 'expense')
        : -1;

      if (recoveryIndex >= 0) {
        const slot = recoverySlots[recoveryIndex];
        const nextPrice = Math.max((Number(slot.price) || 0) - dayTotalYield, 0);
        if (nextPrice === 0) {
          completedSlots.push({
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
        const nextPrice = Math.max((Number(slot.price) || 0) - dayTotalYield, 0);
        if (nextPrice === 0) {
          completedSlots.push({
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
    });

    const projectedInvestedTotal = assets.reduce((acc, a) => acc + (Number(a.investedAmount) || 0), 0);

    return {
      calendarDays,
      businessDays: businessDaysList.length,
      totalProjectedIncome,
      projectedInvestedTotal,
      completedSlots,
      assets
    };
  }, [targetDate, baselineDateObj, simDatabase, customCdi, holidaysMap]);

  // Calendar Day Cells rendering
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="calendar-day-cell empty" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentCellDate = new Date(calendarYear, calendarMonth, day);
    const dateKey = getDateKey(currentCellDate);
    const dayOfWeek = currentCellDate.getDay();

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holiday = holidaysMap[dateKey];
    const isNonWorking = isWeekend || Boolean(holiday);
    const isPast = currentCellDate < baselineDateObj;
    const isBaseline = dateKey === baselineDateKey;
    const isSelected = dateKey === targetDate;

    let tooltip = t.businessDay;
    if (holiday) {
      tooltip = `${t.holiday}: ${holiday.name}`;
    } else if (isWeekend) {
      tooltip = t.weekend;
    }

    const classNames = ['calendar-day-cell'];
    if (isNonWorking) classNames.push('non-working'); // RED HIGHLIGHT
    if (isBaseline) classNames.push('baseline-day');
    if (isSelected) classNames.push('selected-target');
    if (isPast) classNames.push('past-day');

    calendarCells.push(
      <div
        key={dateKey}
        className={classNames.join(' ')}
        title={tooltip}
        onClick={() => {
          if (!isPast && !isBaseline) {
            setTargetDate(dateKey);
          }
        }}
      >
        <span>{day}</span>
        {holiday && <span className="calendar-holiday-indicator" />}
      </div>
    );
  }

  const annualCdi = calculateAnnualizedCDI(customCdi);

  return (
    <div className="simulation-area">
      <div className="simulation-toolbar">
        <div className="simulation-actions">
          <button type="button" className="simulation-btn" onClick={handleResetToBaseline}>
            {t.resetToLive}
          </button>
          <button type="button" className="simulation-btn btn-clear" onClick={handleClearAll}>
            {t.clearAll}
          </button>
        </div>

        <div className="simulation-cdi-control">
          <label htmlFor="sim-cdi-input">{t.cdiOverride}</label>
          <input
            id="sim-cdi-input"
            className="simulation-cdi-input"
            type="number"
            step="0.0001"
            min="0"
            value={customCdi}
            onChange={(e) => setCustomCdi(e.target.value)}
          />
          <span className="simulation-cdi-annual">
            ({t.cdiAnnual} {formatDecimal(annualCdi)}%)
          </span>
        </div>
      </div>

      <div className="simulation-content">
        {/* Calendar UI */}
        <div className="simulation-calendar-card">
          <div className="calendar-header">
            <button type="button" className="calendar-nav-btn" onClick={handlePrevMonth}>&lt;</button>
            <h3>{monthNames[calendarMonth]} {calendarYear}</h3>
            <button type="button" className="calendar-nav-btn" onClick={handleNextMonth}>&gt;</button>
          </div>

          <div className="calendar-legend">
            <div className="calendar-legend-item">
              <span className="legend-dot red" />
              <span>{t.nonWorkingLegend}</span>
            </div>
            <div className="calendar-legend-item">
              <span className="legend-dot green" />
              <span>{t.targetLegend}</span>
            </div>
            <div className="calendar-legend-item">
              <span className="legend-dot blue" />
              <span>{t.baselineLegend}</span>
            </div>
          </div>

          <div className="calendar-grid">
            {dayNames.map((name) => (
              <div key={name} className="calendar-day-header">{name}</div>
            ))}
            {calendarCells}
          </div>
        </div>

        {/* Projection Results */}
        <div className="simulation-results-card">
          <div className="simulation-results-header">
            <h3>{t.projectionsTitle}</h3>
            {targetDate && <span style={{ fontSize: '13px', color: '#90cdf4' }}>{t.targetDate}: {targetDate}</span>}
          </div>

          {projection ? (
            <>
              <div className="simulation-metric-grid">
                <div className="simulation-metric neutral">
                  <span>{t.calendarDays}</span>
                  <strong>{projection.calendarDays}</strong>
                </div>

                <div className="simulation-metric neutral">
                  <span>{t.businessDays}</span>
                  <strong>{projection.businessDays}</strong>
                </div>

                <div className="simulation-metric">
                  <span>{t.projectedYield}</span>
                  <strong>R$ {formatMoney(projection.totalProjectedIncome)}</strong>
                </div>

                <div className="simulation-metric">
                  <span>{t.projectedNetWorth}</span>
                  <strong>R$ {formatMoney(projection.projectedInvestedTotal)}</strong>
                </div>
              </div>

              <div className="simulation-slots-section">
                <h4>{t.completedItems} ({projection.completedSlots.length})</h4>
                {projection.completedSlots.length > 0 ? (
                  <div className="simulation-completed-list">
                    {projection.completedSlots.map((slot, index) => (
                      <div className="catchup-slot-item" key={slot.id || index}>
                        <div className="catchup-slot-info">
                          <span className={`simulation-slot-badge ${slot.type}`}>
                            {slot.type === 'recovery' ? t.recovery : t.wishlist}
                          </span>
                          <span className="catchup-slot-name">{slot.name}</span>
                        </div>
                        <span className="catchup-slot-price">R$ {formatMoney(slot.price)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="catchup-empty">{t.noCompletedItems}</p>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#888888', fontStyle: 'italic' }}>
              {targetDate
                ? (locale === 'pt' ? 'Selecione uma data após a data base.' : 'Select a date after the baseline date.')
                : (locale === 'pt' ? 'Clique em uma data futura no calendário para simular rendimentos.' : 'Click any future date on the calendar to project yield.')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationArea;
