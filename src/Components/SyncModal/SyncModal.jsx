import React, { useState, useEffect, useRef } from 'react';
import './SyncModal.css';
import { formatMoney, formatDateKey } from '../../utils/formatters';

const SYNC_MODAL_TEXT = {
  en: {
    title: 'CDI Bank Synchronization',
    subtitle: 'Reconciling daily compound yields with official B3 and bank positions',
    accruedIncomeLabel: 'Total Accrued Income',
    portfolioBalanceLabel: 'Total Portfolio Balance',
    businessDaysLabel: 'Business Days Accrued',
    settlementDateLabel: 'Bank Position Date',
    statusConnecting: 'Connecting to Banco Central do Brasil & B3...',
    statusCompounding: 'Compounding daily CDI yield across business days...',
    statusReconciling: 'Reconciling positions with bank statement...',
    statusCompleted: '✓ 100% Synced & Reconciled with Bank!',
    done: 'Done',
    stopwatch: 'Stopwatch',
    daysUnit: 'business days'
  },
  pt: {
    title: 'Sincronização CDI Bancária',
    subtitle: 'Reconciliando rendimentos compostos com a B3 e posição bancária',
    accruedIncomeLabel: 'Rendimento Total Acumulado',
    portfolioBalanceLabel: 'Saldo Total em Carteira',
    businessDaysLabel: 'Dias Úteis Acumulados',
    settlementDateLabel: 'Data da Posição Bancária',
    statusConnecting: 'Conectando ao Banco Central do Brasil e B3...',
    statusCompounding: 'Calculando juros compostos diários do CDI...',
    statusReconciling: 'Reconciliando posições com o extrato bancário...',
    statusCompleted: '✓ 100% Sincronizado e Reconciliado com o Banco!',
    done: 'Concluir',
    stopwatch: 'Cronômetro',
    daysUnit: 'dias úteis'
  }
};

/**
 * SyncModal presents an animated stopwatch counter that begins at 0
 * and dynamically calculates and increments the income up to the current total value.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {number} props.targetIncome Final accrued income to reach
 * @param {number} props.targetTotal Final total balance in portfolio
 * @param {number} props.initialPrincipal Starting principal amount
 * @param {number} props.businessDays Number of business days accrued
 * @param {string} props.referenceDate Reference position date (YYYY-MM-DD)
 * @param {string} [props.locale='pt'] 'pt' | 'en'
 * @param {number} [props.duration=2400] Stopwatch animation duration in ms
 */
const SyncModal = ({
  isOpen,
  onClose,
  targetIncome = 0,
  targetTotal = 0,
  initialPrincipal = 0,
  businessDays = 0,
  referenceDate = '',
  locale = 'pt',
  duration = 2400
}) => {
  const [currentIncome, setCurrentIncome] = useState(0);
  const [currentTotal, setCurrentTotal] = useState(initialPrincipal);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const animationFrameRef = useRef(null);

  const t = SYNC_MODAL_TEXT[locale] || SYNC_MODAL_TEXT.pt;
  const targetIncomeNum = Math.max(0, Number(targetIncome) || 0);
  const targetTotalNum = Math.max(0, Number(targetTotal) || 0);
  const startingPrincipal = Number.isFinite(Number(initialPrincipal)) && Number(initialPrincipal) > 0
    ? Number(initialPrincipal)
    : Math.max(0, targetTotalNum - targetIncomeNum);

  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setCurrentIncome(0);
      setCurrentTotal(startingPrincipal);
      setElapsedMs(0);
      setIsCompleted(false);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: 1 - (1 - progress)^3
      // Provides a brisk, thrilling start that gracefully decelerates into exact centavos
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const calculatedIncome = targetIncomeNum * easedProgress;
      const calculatedTotal = startingPrincipal + (targetTotalNum - startingPrincipal) * easedProgress;

      setCurrentIncome(calculatedIncome);
      setCurrentTotal(calculatedTotal);
      setElapsedMs(elapsed);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentIncome(targetIncomeNum);
        setCurrentTotal(targetTotalNum);
        setElapsedMs(duration);
        setIsCompleted(true);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, targetIncomeNum, targetTotalNum, startingPrincipal, duration]);

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Format elapsed time as stopwatch: MM:SS.hundredths
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hundredths = Math.floor((elapsedMs % 1000) / 10);
  const timerDisplay = `${String(totalSeconds).padStart(2, '0')}:${String(hundredths).padStart(2, '0')}`;

  // Calculate live progress percentage
  const progressPct = duration > 0 ? Math.min(100, Math.round((elapsedMs / duration) * 100)) : 100;

  // Determine dynamic live status text
  let statusText = t.statusConnecting;
  if (isCompleted || progressPct >= 100) {
    statusText = t.statusCompleted;
  } else if (progressPct >= 70) {
    statusText = t.statusReconciling;
  } else if (progressPct >= 20) {
    statusText = t.statusCompounding;
  }

  const handleHeroClick = () => {
    // If user clicks while animating, skip to finish
    if (!isCompleted) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setCurrentIncome(targetIncomeNum);
      setCurrentTotal(targetTotalNum);
      setElapsedMs(duration);
      setIsCompleted(true);
    }
  };

  return (
    <div
      className="sync-modal-overlay"
      onClick={onClose}
      role="presentation"
      data-testid="sync-modal-overlay"
    >
      <div
        className="sync-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Stopwatch Icon & Timer */}
        <div className="sync-modal-header">
          <div className={`sync-stopwatch-icon-wrapper ${!isCompleted ? 'animating' : ''}`}>
            <div className={`sync-stopwatch-ring ${!isCompleted ? 'spinning' : ''}`} />
            <svg
              className="sync-stopwatch-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              fill="currentColor"
            >
              <path d="M128,40a88,88,0,1,0,88,88A88.1,88.1,0,0,0,128,40Zm0,160a72,72,0,1,1,72-72A72.08,72.08,0,0,1,128,200ZM173.66,90.34a8,8,0,0,1,0,11.32l-40,40a8,8,0,0,1-11.32-11.32l40-40A8,8,0,0,1,173.66,90.34ZM104,16h48a8,8,0,0,0,0-16H104a8,8,0,0,0,0,16Z" />
            </svg>
          </div>
          <div className="sync-modal-header-text">
            <h2 id="sync-modal-title" className="sync-modal-title">
              <span>{t.title}</span>
              <span className="sync-stopwatch-timer-badge" aria-label={t.stopwatch}>
                ⏱ {timerDisplay}
              </span>
            </h2>
            <p className="sync-modal-subtitle">{t.subtitle}</p>
          </div>
        </div>

        {/* Hero Stopwatch Money Counter Display */}
        <div
          className={`sync-money-hero-card ${isCompleted ? 'completed' : ''}`}
          onClick={handleHeroClick}
          title={!isCompleted ? 'Click to jump to end' : ''}
          role="region"
          aria-live="polite"
        >
          <span className="sync-money-label">{t.accruedIncomeLabel}</span>
          <div className="sync-money-counter-display" data-testid="sync-money-display">
            R$ {formatMoney(currentIncome, locale)}
          </div>

          <div className="sync-progress-bar-wrapper">
            <div
              className="sync-progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className={`sync-status-ticker ${isCompleted ? 'completed' : ''}`}>
            {!isCompleted && <span className="sync-status-indicator-dot" />}
            <span>{statusText}</span>
          </div>
        </div>

        {/* Secondary Metrics Breakdown */}
        <div className="sync-modal-metrics-grid">
          <div className="sync-submetric-card highlight">
            <span>{t.portfolioBalanceLabel}</span>
            <strong data-testid="sync-portfolio-balance">
              R$ {formatMoney(currentTotal, locale)}
            </strong>
          </div>

          <div className="sync-submetric-card">
            <span>{t.businessDaysLabel}</span>
            <strong>
              {businessDays} <small style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>{t.daysUnit}</small>
            </strong>
          </div>

          {referenceDate && (
            <div className="sync-submetric-card" style={{ gridColumn: 'span 2' }}>
              <span>{t.settlementDateLabel}</span>
              <strong>{formatDateKey(referenceDate, locale)} (B3 / CETIP)</strong>
            </div>
          )}
        </div>

        {/* Modal Footer / Close Action */}
        <div className="sync-modal-footer">
          <button
            type="button"
            className="sync-btn-done"
            onClick={onClose}
            autoFocus
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
