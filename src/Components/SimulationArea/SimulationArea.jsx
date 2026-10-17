import React, { useState, useEffect, useMemo } from 'react';
import './SimulationArea.css';
import { formatMoney, formatDecimal, formatDateKey } from '../../utils/formatters';
import {
  getDateKey,
  parseDateKey,
  shiftDate,
  getBusinessDaysInRange,
  fetchBrazilianHolidays
} from '../../utils/calendar';
import { calculateDailyYield, calculateAnnualizedCDI, DEFAULT_CDI_RATE } from '../../utils/cdi';
import { calculateTaxBreakdown } from '../../utils/tax';
import { distributeDailyIncome } from '../../utils/incomeDistribution';

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
    assetsSummary: 'Simulation Assets',
    weekend: 'Weekend',
    holiday: 'Holiday',
    businessDay: 'Business day',
    wishlist: 'Wishlist',
    recovery: 'Recovery',
    addSimAsset: '+ Add Simulation Asset',
    simulatedBadge: 'Simulated',
    removeSimAsset: 'Remove simulated asset',
    noAssets: 'No assets in simulation.',
    assetName: 'Asset Name',
    investedAmount: 'Invested Amount (R$)',
    yieldRate: 'Yield (% of CDI)',
    creationDate: 'Start Date',
    applyTax: 'Deduct Taxes (IR & IOF)',
    saveAsset: 'Add to Simulation',
    cancel: 'Cancel',
    inflationToggle: 'Adjust for Inflation (IPCA)',
    annualIpcaLabel: 'Annual IPCA (% p.a.):',
    realPurchasingPower: 'Real Purchasing Power',
    realYield: 'Real Yield',
    accumulatedInflation: 'Accumulated Inflation',
    realGainLabel: 'Real Gain Above Inflation',
    nominalBadge: 'Nominal',
    realBadge: 'Real'
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
    assetsSummary: 'Ativos da Simulação',
    weekend: 'Fim de semana',
    holiday: 'Feriado',
    businessDay: 'Dia útil',
    wishlist: 'Lista de Desejos',
    recovery: 'Recuperação',
    addSimAsset: '+ Adicionar Ativo na Simulação',
    simulatedBadge: 'Simulado',
    removeSimAsset: 'Remover ativo simulado',
    noAssets: 'Nenhum ativo na simulação.',
    assetName: 'Nome do Ativo',
    investedAmount: 'Valor Investido (R$)',
    yieldRate: 'Taxa (% do CDI)',
    creationDate: 'Data Inicial',
    applyTax: 'Deduzir Impostos (IR e IOF)',
    saveAsset: 'Adicionar à Simulação',
    cancel: 'Cancelar',
    inflationToggle: 'Descontar Inflação (IPCA)',
    annualIpcaLabel: 'IPCA Anual (% a.a.):',
    realPurchasingPower: 'Poder de Compra Real',
    realYield: 'Rendimento Real',
    accumulatedInflation: 'Inflação Acumulada',
    realGainLabel: 'Ganho Real Acima da Inflação',
    nominalBadge: 'Nominal',
    realBadge: 'Real'
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

  // Simulation-only asset form state
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [simAssetForm, setSimAssetForm] = useState({
    name: '',
    investedAmount: '',
    yieldRate: '100',
    creationDate: '',
    applyTax: false
  });

  // Inflation (IPCA) adjustment state
  const [adjustInflation, setAdjustInflation] = useState(false);
  const [annualIpca, setAnnualIpca] = useState('4.5');

  // Calendar month/year navigation
  const baselineDateKey = simDatabase.simulatedDate || getDateKey(new Date());
  const baselineDateObj = useMemo(() => parseDateKey(baselineDateKey), [baselineDateKey]);

  const minYear = baselineDateObj.getFullYear();
  const minMonth = baselineDateObj.getMonth();

  const [calendarYear, setCalendarYear] = useState(() => minYear);
  const [calendarMonth, setCalendarMonth] = useState(() => minMonth);

  const isAtMinMonth =
    calendarYear < minYear ||
    (calendarYear === minYear && calendarMonth <= minMonth);

  useEffect(() => {
    if (calendarYear < minYear || (calendarYear === minYear && calendarMonth < minMonth)) {
      setCalendarYear(minYear);
      setCalendarMonth(minMonth);
    }
  }, [minYear, minMonth, calendarYear, calendarMonth]);

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
  // Reset completely removes all simulation-added assets and restores live baseline
  const handleResetToBaseline = () => {
    setSimDatabase(cloneState(mainDatabase));
    setCustomCdi(liveCdiRate);
    setTargetDate('');
    setCalendarYear(minYear);
    setCalendarMonth(minMonth);
    setAdjustInflation(false);
    setAnnualIpca('4.5');
    setIsAddAssetOpen(false);
  };

  // Clear all removes all assets including simulation-added assets
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
    setAdjustInflation(false);
    setIsAddAssetOpen(false);
  };

  // Add asset specifically to the simulation area
  const handleAddSimAsset = (event) => {
    event.preventDefault();
    const amount = Number(simAssetForm.investedAmount);
    const rate = Number(simAssetForm.yieldRate);
    if (!simAssetForm.name.trim() || !Number.isFinite(amount) || amount <= 0) return;

    const newSimAsset = {
      id: `sim-asset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: simAssetForm.name.trim(),
      investedAmount: amount,
      initialInvestedAmount: amount,
      yieldRate: Number.isFinite(rate) ? rate : 100,
      creationDate: simAssetForm.creationDate || baselineDateKey,
      applyTax: Boolean(simAssetForm.applyTax),
      isSimulationOnly: true,
      totalIncome: 0,
      incomeHistory: {}
    };

    setSimDatabase((current) => ({
      ...current,
      assets: [...(current.assets || []), newSimAsset]
    }));

    setSimAssetForm({
      name: '',
      investedAmount: '',
      yieldRate: '100',
      creationDate: '',
      applyTax: false
    });
    setIsAddAssetOpen(false);
  };

  // Remove individual simulation asset
  const handleRemoveSimAsset = (id) => {
    setSimDatabase((current) => ({
      ...current,
      assets: (current.assets || []).filter((a) => a.id !== id)
    }));
  };

  // Calendar navigation
  const handlePrevMonth = () => {
    if (isAtMinMonth) return;
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

  // Projection calculation with date-coherent inflation adjustment
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
        const assetStartDate = parseDateKey(asset.creationDate || baselineDateKey);
        // Only accrue yield if the current projection day is on or after the asset start date
        if (dayDate < assetStartDate) {
          return asset;
        }

        const currentAmount = Number(asset.investedAmount) || 0;
        const yieldAmount = calculateDailyYield(currentAmount, asset.yieldRate, rateToUse);
        const effectiveYield = asset.applyTax
          ? calculateTaxBreakdown(yieldAmount, asset.creationDate, dayDate).netYield
          : yieldAmount;
        dayTotalYield += effectiveYield;
        return {
          ...asset,
          investedAmount: currentAmount + yieldAmount,
          totalIncome: (Number(asset.totalIncome) || 0) + yieldAmount
        };
      });

      totalProjectedIncome += dayTotalYield;

      if (dayTotalYield > 0) {
        const distributionResult = distributeDailyIncome({
          recoverySlots,
          wishlistSlots,
          dailyYield: dayTotalYield
        });
        recoverySlots = distributionResult.recoverySlots;
        wishlistSlots = distributionResult.wishlistSlots;
        if (distributionResult.completedSlots.length > 0) {
          completedSlots.push(...distributionResult.completedSlots);
        }
      }
    });

    const projectedInvestedTotal = assets.reduce((acc, a) => acc + (Number(a.investedAmount) || 0), 0);

    // Coherent inflation deflator for every single date
    let deflator = 1;
    let accumulatedInflationPct = 0;
    const ipcaNum = Number(annualIpca);

    if (adjustInflation && Number.isFinite(ipcaNum) && ipcaNum > 0 && calendarDays > 0) {
      // Annual IPCA compounded over the exact elapsed calendar days: (1 + IPCA / 100)^(days / 365.25)
      deflator = Math.pow(1 + ipcaNum / 100, calendarDays / 365.25);
      accumulatedInflationPct = (deflator - 1) * 100;
    }

    const realProjectedNetWorth = deflator > 0 ? projectedInvestedTotal / deflator : projectedInvestedTotal;
    const realProjectedIncome = deflator > 0 ? totalProjectedIncome / deflator : totalProjectedIncome;

    return {
      calendarDays,
      businessDays: businessDaysList.length,
      totalProjectedIncome,
      projectedInvestedTotal,
      realProjectedNetWorth,
      realProjectedIncome,
      deflator,
      accumulatedInflationPct,
      completedSlots,
      assets
    };
  }, [targetDate, baselineDateObj, baselineDateKey, simDatabase, customCdi, holidaysMap, adjustInflation, annualIpca]);

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
    if (isNonWorking) classNames.push('non-working');
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
      <div className="simulation-header-bar">
        <h3 className="simulation-area-title">{t.title}</h3>
      </div>

      <div className="simulation-toolbar">
        <div className="simulation-actions">
          <button type="button" className="simulation-btn" onClick={handleResetToBaseline}>
            {t.resetToLive}
          </button>
          <button type="button" className="simulation-btn btn-clear" onClick={handleClearAll}>
            {t.clearAll}
          </button>
          <button
            type="button"
            className="simulation-btn btn-add-sim-asset"
            onClick={() => setIsAddAssetOpen((prev) => !prev)}
          >
            {t.addSimAsset}
          </button>
        </div>

        <div className="simulation-controls-wrap">
          {/* CDI Rate Control */}
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

          {/* Inflation (IPCA) Control */}
          <div className="simulation-inflation-control">
            <label className="simulation-inflation-toggle-label">
              <input
                type="checkbox"
                checked={adjustInflation}
                onChange={(e) => setAdjustInflation(e.target.checked)}
              />
              <span>{t.inflationToggle}</span>
            </label>
            {adjustInflation && (
              <div className="simulation-inflation-input-wrap">
                <label htmlFor="sim-ipca-input">{t.annualIpcaLabel}</label>
                <input
                  id="sim-ipca-input"
                  className="simulation-ipca-input"
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={annualIpca}
                  onChange={(e) => setAnnualIpca(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Simulation Asset Form / Drawer */}
      {isAddAssetOpen && (
        <form className="sim-add-asset-form" onSubmit={handleAddSimAsset}>
          <div className="sim-form-header">
            <h4>{t.addSimAsset}</h4>
            <button
              type="button"
              className="sim-form-close"
              onClick={() => setIsAddAssetOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="sim-form-fields">
            <div className="sim-form-field">
              <label>{t.assetName}</label>
              <input
                type="text"
                required
                placeholder="Ex: CDB 110% CDI"
                value={simAssetForm.name}
                onChange={(e) => setSimAssetForm({ ...simAssetForm, name: e.target.value })}
              />
            </div>
            <div className="sim-form-field">
              <label>{t.investedAmount}</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={simAssetForm.investedAmount}
                onChange={(e) => setSimAssetForm({ ...simAssetForm, investedAmount: e.target.value })}
              />
            </div>
            <div className="sim-form-field">
              <label>{t.yieldRate}</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                placeholder="100"
                value={simAssetForm.yieldRate}
                onChange={(e) => setSimAssetForm({ ...simAssetForm, yieldRate: e.target.value })}
              />
            </div>
            <div className="sim-form-field">
              <label>{t.creationDate}</label>
              <input
                type="date"
                value={simAssetForm.creationDate || baselineDateKey}
                onChange={(e) => setSimAssetForm({ ...simAssetForm, creationDate: e.target.value })}
              />
            </div>
            <div className="sim-form-field checkbox-field">
              <label>
                <input
                  type="checkbox"
                  checked={simAssetForm.applyTax}
                  onChange={(e) => setSimAssetForm({ ...simAssetForm, applyTax: e.target.checked })}
                />
                <span>{t.applyTax}</span>
              </label>
            </div>
          </div>
          <div className="sim-form-actions">
            <button type="button" className="simulation-btn" onClick={() => setIsAddAssetOpen(false)}>
              {t.cancel}
            </button>
            <button type="submit" className="simulation-btn btn-save">
              {t.saveAsset}
            </button>
          </div>
        </form>
      )}

      <div className="simulation-content">
        {/* Calendar UI */}
        <div className="simulation-calendar-card">
          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handlePrevMonth}
              disabled={isAtMinMonth}
              aria-label={locale === 'pt' ? 'Mês anterior' : 'Previous month'}
              title={isAtMinMonth ? (locale === 'pt' ? 'Não é possível voltar antes do mês atual' : 'Cannot navigate before current month') : (locale === 'pt' ? 'Mês anterior' : 'Previous month')}
            >
              &lt;
            </button>
            <h3>{monthNames[calendarMonth]} {calendarYear}</h3>
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handleNextMonth}
              aria-label={locale === 'pt' ? 'Próximo mês' : 'Next month'}
              title={locale === 'pt' ? 'Próximo mês' : 'Next month'}
            >
              &gt;
            </button>
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
            {targetDate && <span style={{ fontSize: '13px', color: 'var(--accent-blue)' }}>{t.targetDate}: {formatDateKey(targetDate, locale)}</span>}
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
                  <div className="sim-metric-title-row">
                    <span>{t.projectedYield}</span>
                    {adjustInflation && <span className="sim-badge real">{t.realBadge}</span>}
                  </div>
                  <strong>
                    R$ {formatMoney(adjustInflation ? projection.realProjectedIncome : projection.totalProjectedIncome)}
                  </strong>
                  {adjustInflation && projection.deflator > 1 && (
                    <small className="sim-metric-subtext">
                      {t.nominalBadge}: R$ {formatMoney(projection.totalProjectedIncome)}
                    </small>
                  )}
                </div>

                <div className="simulation-metric">
                  <div className="sim-metric-title-row">
                    <span>{t.projectedNetWorth}</span>
                    {adjustInflation && <span className="sim-badge real">{t.realBadge}</span>}
                  </div>
                  <strong>
                    R$ {formatMoney(adjustInflation ? projection.realProjectedNetWorth : projection.projectedInvestedTotal)}
                  </strong>
                  {adjustInflation && projection.deflator > 1 && (
                    <small className="sim-metric-subtext">
                      {t.nominalBadge}: R$ {formatMoney(projection.projectedInvestedTotal)}
                    </small>
                  )}
                </div>

                {adjustInflation && (
                  <div className="simulation-metric highlight-ipca" style={{ gridColumn: 'span 2' }}>
                    <div className="sim-metric-title-row">
                      <span>{t.accumulatedInflation} ({annualIpca}% a.a.)</span>
                      <span className="sim-badge-pill">+{formatDecimal(projection.accumulatedInflationPct)}%</span>
                    </div>
                    <small className="sim-inflation-details">
                      {t.realPurchasingPower}: <strong>R$ {formatMoney(projection.realProjectedNetWorth)}</strong>
                    </small>
                  </div>
                )}
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

      {/* Simulation Assets Overview Bar */}
      <div className="simulation-assets-section">
        <div className="sim-assets-header">
          <h4>{t.assetsSummary} ({simDatabase.assets?.length || 0})</h4>
          <span className="sim-assets-subtitle">
            {locale === 'pt' ? 'Ativos vigentes na simulação (reiniciam ao clicar em Restaurar)' : 'Active assets in simulation (resets upon clicking Reset to Live)'}
          </span>
        </div>
        <div className="sim-assets-chips-grid">
          {(simDatabase.assets || []).map((asset) => (
            <div
              key={asset.id}
              className={`sim-asset-chip ${asset.isSimulationOnly ? 'is-simulated' : ''}`}
            >
              <div className="sim-chip-info">
                <strong>{asset.name}</strong>
                <span>R$ {formatMoney(asset.investedAmount)} ({asset.yieldRate}% CDI)</span>
              </div>
              {asset.isSimulationOnly && (
                <div className="sim-chip-actions">
                  <span className="sim-asset-tag">{t.simulatedBadge}</span>
                  <button
                    type="button"
                    className="sim-chip-delete"
                    onClick={() => handleRemoveSimAsset(asset.id)}
                    title={t.removeSimAsset}
                    aria-label={t.removeSimAsset}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
          {(!simDatabase.assets || simDatabase.assets.length === 0) && (
            <p className="catchup-empty">{t.noAssets}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationArea;
