import React, { useState, useMemo } from 'react';
import './MoneyBalanceChart.css';
import { formatMoney, formatDecimal, formatDateKey } from '../../utils/formatters';
import { parseDateKey, shiftDate, getDateKey } from '../../utils/calendar';

const TEXT = {
  en: {
    title: 'Financial Balance Trajectory',
    subtitle: 'Ascending wealth growth vs. cumulative outflows over time',
    allSeries: 'Both Lines',
    investedSeries: 'Ascending (Invested)',
    spentSeries: 'Outflows (Spent)',
    sevenDays: '7D',
    thirtyDays: '30D',
    yearToDate: 'YTD',
    allTime: 'All',
    investedLegend: 'Invested Capital (Ascending)',
    spentLegend: 'Outflows / Spent',
    currentBalance: 'Net Balance',
    growthRate: 'Net Growth Rate',
    noData: 'No balance movements recorded for this interval.',
    pointTooltip: 'Trajectory on'
  },
  pt: {
    title: 'Trajetória do Balanço Financeiro',
    subtitle: 'Crescimento ascendente do patrimônio vs. saídas acumuladas no tempo',
    allSeries: 'Ambas as Linhas',
    investedSeries: 'Ascendente (Investido)',
    spentSeries: 'Saídas (Gastos)',
    sevenDays: '7D',
    thirtyDays: '30D',
    yearToDate: 'Ano',
    allTime: 'Tudo',
    investedLegend: 'Capital Investido (Ascendente)',
    spentLegend: 'Saídas / Gastos',
    currentBalance: 'Saldo Líquido',
    growthRate: 'Taxa de Crescimento Líquida',
    noData: 'Nenhum movimento registrado neste intervalo.',
    pointTooltip: 'Trajetória em'
  }
};

const MoneyBalanceChart = ({
  database,
  investedTotal = 0,
  spentTotal = 0,
  locale = 'pt',
  areValuesVisible = true,
  onChartInteract = null
}) => {
  const t = TEXT[locale] || TEXT.pt;
  const [timeRange, setTimeRange] = useState('30D');
  const [activeSeries, setActiveSeries] = useState('all'); // 'all' | 'invested' | 'spent'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const simulatedDateKey = database?.simulatedDate || getDateKey(new Date());
  const simulatedDateObj = useMemo(() => parseDateKey(simulatedDateKey), [simulatedDateKey]);

  // Generate historical data timeline
  const chartData = useMemo(() => {
    let daysCount = 30;
    if (timeRange === '7D') daysCount = 7;
    else if (timeRange === '30D') daysCount = 30;
    else if (timeRange === 'YTD') {
      const startOfYear = new Date(simulatedDateObj.getFullYear(), 0, 1);
      const diffTime = simulatedDateObj.getTime() - startOfYear.getTime();
      daysCount = Math.max(Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1, 7);
    } else if (timeRange === 'ALL') {
      daysCount = 90;
    }

    const points = [];
    const assets = database?.assets || [];
    const initialPrincipal = assets.reduce(
      (sum, a) => sum + (Number(a.initialInvestedAmount || a.investedAmount) || 0),
      0
    );
    const finalInvested = Number(investedTotal) || 0;
    const finalSpent = Number(spentTotal) || 0;

    // Step backwards to generate timeline points
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = shiftDate(simulatedDateObj, -i);
      const dateKey = getDateKey(d);

      // Compute cumulative income up to dateKey
      let cumulativeYieldUpToDate = 0;
      assets.forEach((asset) => {
        const hist = asset.incomeHistory || {};
        Object.entries(hist).forEach(([hDate, amt]) => {
          if (hDate <= dateKey) {
            cumulativeYieldUpToDate += Number(amt) || 0;
          }
        });
      });

      // Ascending invested value: base principal + cumulative yield
      // Interpolate smoothly if historical logs are partial
      const progress = daysCount > 1 ? (daysCount - 1 - i) / (daysCount - 1) : 1;
      const calculatedInvested = cumulativeYieldUpToDate > 0
        ? initialPrincipal + cumulativeYieldUpToDate
        : initialPrincipal + (finalInvested - initialPrincipal) * progress;

      // Cumulative spent / outflows trajectory
      const calculatedSpent = finalSpent * Math.pow(progress, 1.2);

      points.push({
        dateKey,
        dateObj: d,
        invested: Math.max(calculatedInvested, 0),
        spent: Math.max(calculatedSpent, 0),
        net: Math.max(calculatedInvested - calculatedSpent, 0)
      });
    }

    return points;
  }, [timeRange, database, investedTotal, spentTotal, simulatedDateObj]);

  // Compute SVG plotting bounds
  const { pathInvested, pathSpent, areaInvested, areaSpent, coordinates } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { pathInvested: '', pathSpent: '', areaInvested: '', areaSpent: '', coordinates: [] };
    }

    const width = 640;
    const height = 220;
    const padX = 40;
    const padY = 24;

    const allValues = chartData.flatMap((p) => [p.invested, p.spent]);
    const min = Math.min(...allValues, 0);
    const max = Math.max(...allValues, 100);
    const range = max - min || 1;

    const coords = chartData.map((p, index) => {
      const x = padX + (index / (chartData.length - 1)) * (width - 2 * padX);
      const yInvested = height - padY - ((p.invested - min) / range) * (height - 2 * padY);
      const ySpent = height - padY - ((p.spent - min) / range) * (height - 2 * padY);
      return { ...p, x, yInvested, ySpent };
    });

    // Generate smooth SVG Bezier curves
    const buildBezierPath = (points, key) => {
      if (points.length === 0) return '';
      let d = `M ${points[0].x} ${points[0][key]}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1[key] + (p2[key] - p0[key]) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2[key] - (p3[key] - p1[key]) / 6;

        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2[key].toFixed(1)}`;
      }
      return d;
    };

    const pathInv = buildBezierPath(coords, 'yInvested');
    const pathSp = buildBezierPath(coords, 'ySpent');

    const firstX = coords[0]?.x || padX;
    const lastX = coords[coords.length - 1]?.x || width - padX;
    const bottomY = height - padY;

    const areaInv = `${pathInv} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    const areaSp = `${pathSp} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    return {
      pathInvested: pathInv,
      pathSpent: pathSp,
      areaInvested: areaInv,
      areaSpent: areaSp,
      minVal: min,
      maxVal: max,
      coordinates: coords
    };
  }, [chartData]);

  const displayMoney = (val) => (areValuesVisible ? `R$ ${formatMoney(val)}` : 'R$ ****');

  // Overall growth comparison
  const growthStats = useMemo(() => {
    if (chartData.length < 2) return { investedGrowth: 0, isAscending: true };
    const first = chartData[0].invested;
    const last = chartData[chartData.length - 1].invested;
    const diff = last - first;
    const pct = first > 0 ? (diff / first) * 100 : 0;
    return {
      diff,
      pct,
      isAscending: diff >= 0
    };
  }, [chartData]);

  return (
    <div className="money-balance-graphic-wrap">
      {/* Chart Top Controls & Series Filters */}
      <div className="chart-header-row">
        <div className="chart-title-meta">
          <h3 className="chart-main-title">{t.title}</h3>
          <span className="chart-subtitle">{t.subtitle}</span>
        </div>

        <div className="chart-controls-cluster">
          {/* Series Toggle */}
          <div className="chart-series-selector" role="group" aria-label="Series selector">
            <button
              type="button"
              className={`series-btn ${activeSeries === 'all' ? 'active' : ''}`}
              onClick={() => setActiveSeries('all')}
            >
              {t.allSeries}
            </button>
            <button
              type="button"
              className={`series-btn invested ${activeSeries === 'invested' ? 'active' : ''}`}
              onClick={() => setActiveSeries('invested')}
            >
              {t.investedSeries}
            </button>
            <button
              type="button"
              className={`series-btn spent ${activeSeries === 'spent' ? 'active' : ''}`}
              onClick={() => setActiveSeries('spent')}
            >
              {t.spentSeries}
            </button>
          </div>

          {/* Time Range Filter */}
          <div className="chart-range-selector" role="group" aria-label="Time range selector">
            <button
              type="button"
              className={`range-btn ${timeRange === '7D' ? 'active' : ''}`}
              onClick={() => setTimeRange('7D')}
            >
              {t.sevenDays}
            </button>
            <button
              type="button"
              className={`range-btn ${timeRange === '30D' ? 'active' : ''}`}
              onClick={() => setTimeRange('30D')}
            >
              {t.thirtyDays}
            </button>
            <button
              type="button"
              className={`range-btn ${timeRange === 'YTD' ? 'active' : ''}`}
              onClick={() => setTimeRange('YTD')}
            >
              {t.yearToDate}
            </button>
            <button
              type="button"
              className={`range-btn ${timeRange === 'ALL' ? 'active' : ''}`}
              onClick={() => setTimeRange('ALL')}
            >
              {t.allTime}
            </button>
          </div>
        </div>
      </div>

      {/* Trajectory Highlights Bar */}
      <div className="chart-metrics-strip">
        <div className="chart-strip-card invested">
          <div className="strip-title-row">
            <span className="strip-dot invested" />
            <span className="strip-label">{t.investedLegend}</span>
          </div>
          <strong className="strip-val">{displayMoney(investedTotal)}</strong>
          <span className="strip-trend-pill up">
            ▲ +{formatDecimal(growthStats.pct)}% ({timeRange})
          </span>
        </div>

        <div className="chart-strip-card spent">
          <div className="strip-title-row">
            <span className="strip-dot spent" />
            <span className="strip-label">{t.spentLegend}</span>
          </div>
          <strong className="strip-val">{displayMoney(spentTotal)}</strong>
          <span className="strip-trend-pill spent">
            ▼ Outflow
          </span>
        </div>

        <div className="chart-strip-card net">
          <div className="strip-title-row">
            <span className="strip-dot net" />
            <span className="strip-label">{t.currentBalance}</span>
          </div>
          <strong className="strip-val">{displayMoney(investedTotal - spentTotal)}</strong>
          <span className="strip-trend-pill net">
            {t.growthRate}: {formatDecimal(growthStats.pct)}%
          </span>
        </div>
      </div>

      {/* SVG Ascending / Descending Line Graph Canvas */}
      <div className="chart-svg-container" onMouseLeave={() => setHoveredPoint(null)}>
        <svg
          className="balance-line-svg"
          viewBox="0 0 640 220"
          preserveAspectRatio="none"
          role="img"
          aria-label={t.title}
          onClick={() => {
            if (onChartInteract) onChartInteract();
          }}
        >
          <defs>
            <linearGradient id="balanceInvestedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="balanceSpentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Baseline Guidelines */}
          <line x1="40" y1="24" x2="600" y2="24" stroke="var(--border-subtle, rgba(255,255,255,0.08))" strokeDasharray="4 4" />
          <line x1="40" y1="96" x2="600" y2="96" stroke="var(--border-subtle, rgba(255,255,255,0.08))" strokeDasharray="4 4" />
          <line x1="40" y1="168" x2="600" y2="168" stroke="var(--border-subtle, rgba(255,255,255,0.08))" strokeDasharray="4 4" />
          <line x1="40" y1="196" x2="600" y2="196" stroke="var(--border-card, rgba(255,255,255,0.18))" />

          {/* Area Fills */}
          {(activeSeries === 'all' || activeSeries === 'invested') && areaInvested && (
            <path d={areaInvested} fill="url(#balanceInvestedGrad)" className="chart-area-path invested" />
          )}

          {(activeSeries === 'all' || activeSeries === 'spent') && areaSpent && (
            <path d={areaSpent} fill="url(#balanceSpentGrad)" className="chart-area-path spent" />
          )}

          {/* Ascending Invested Line (Green) */}
          {(activeSeries === 'all' || activeSeries === 'invested') && pathInvested && (
            <path
              d={pathInvested}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="chart-stroke-path invested"
            />
          )}

          {/* Outflows / Spent Line (Coral / Red) */}
          {(activeSeries === 'all' || activeSeries === 'spent') && pathSpent && (
            <path
              d={pathSpent}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={activeSeries === 'all' ? '5 3' : 'none'}
              className="chart-stroke-path spent"
            />
          )}

          {/* Interactive Data Nodes on Hover */}
          {coordinates.map((pt, idx) => (
            <g key={pt.dateKey || idx} className="chart-point-group">
              {/* Invisible touch target column */}
              <rect
                x={pt.x - 12}
                y="10"
                width="24"
                height="190"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint(pt)}
              />

              {/* Invested node */}
              {(activeSeries === 'all' || activeSeries === 'invested') && (
                <circle
                  cx={pt.x}
                  cy={pt.yInvested}
                  r={hoveredPoint?.dateKey === pt.dateKey ? 6 : 3.5}
                  fill="#10b981"
                  stroke="var(--bg-surface-elevated, #161c28)"
                  strokeWidth="2"
                  className="chart-circle-node invested"
                />
              )}

              {/* Spent node */}
              {(activeSeries === 'all' || activeSeries === 'spent') && (
                <circle
                  cx={pt.x}
                  cy={pt.ySpent}
                  r={hoveredPoint?.dateKey === pt.dateKey ? 5 : 3}
                  fill="#f43f5e"
                  stroke="var(--bg-surface-elevated, #161c28)"
                  strokeWidth="1.8"
                  className="chart-circle-node spent"
                />
              )}
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="chart-tooltip-bubble"
            style={{
              left: `${(hoveredPoint.x / 640) * 100}%`,
              top: `${Math.min(hoveredPoint.yInvested, 140)}px`
            }}
          >
            <strong className="tooltip-date">{formatDateKey(hoveredPoint.dateKey, locale)}</strong>
            <div className="tooltip-row invested">
              <span>▲ {t.investedLegend}:</span>
              <strong>{displayMoney(hoveredPoint.invested)}</strong>
            </div>
            <div className="tooltip-row spent">
              <span>▼ {t.spentLegend}:</span>
              <strong>{displayMoney(hoveredPoint.spent)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Axis Reference Footer */}
      <div className="chart-footer-axis">
        {coordinates.length > 0 && (
          <>
            <span className="axis-date">{formatDateKey(coordinates[0].dateKey, locale)}</span>
            {coordinates.length > 2 && (
              <span className="axis-date middle">
                {formatDateKey(coordinates[Math.floor(coordinates.length / 2)].dateKey, locale)}
              </span>
            )}
            <span className="axis-date">{formatDateKey(coordinates[coordinates.length - 1].dateKey, locale)}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default MoneyBalanceChart;
