import React, { useState, useEffect, useRef } from 'react';
import './SyncModal.css';
import { formatMoney, formatDateKey } from '../../utils/formatters';

const SYNC_MODAL_TEXT = {
  en: {
    title: 'CDI Bank Synchronization',
    subtitle: 'Daily compound yields reconciled against official B3 and bank positions',
    accruedIncomeLabel: 'Total Accrued Income',
    portfolioBalanceLabel: 'Total Portfolio Balance',
    businessDaysLabel: 'Business Days Accrued',
    settlementDateLabel: 'Bank Position Date',
    statusConnecting: 'Reading BCB SGS Series 12 rates...',
    statusCompounding: 'Compounding daily CDI across business days...',
    statusReconciling: 'Verifying position balance...',
    statusCompleted: '✓ 100% Synced & Reconciled with Bank!',
    done: 'Done',
    stopwatch: 'Stopwatch',
    daysUnit: 'business days'
  },
  pt: {
    title: 'Sincronização CDI Bancária',
    subtitle: 'Rendimentos compostos reconciliados com a B3 e posição bancária',
    accruedIncomeLabel: 'Rendimento Total Acumulado',
    portfolioBalanceLabel: 'Saldo Total em Carteira',
    businessDaysLabel: 'Dias Úteis Acumulados',
    settlementDateLabel: 'Data da Posição Bancária',
    statusConnecting: 'Consultando taxas BCB SGS Série 12...',
    statusCompounding: 'Calculando juros compostos nos dias úteis...',
    statusReconciling: 'Conferindo saldo da posição...',
    statusCompleted: '✓ 100% Sincronizado e Reconciliado com o Banco!',
    done: 'Concluir',
    stopwatch: 'Cronômetro',
    daysUnit: 'dias úteis'
  }
};

const SyncModal = ({
  isOpen,
  onClose,
  targetIncome = 0,
  targetTotal = 0,
  initialPrincipal = 0,
  businessDays = 0,
  referenceDate = '',
  locale = 'pt',
  duration = 650
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
      const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
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

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hundredths = Math.floor((elapsedMs % 1000) / 10);
  const timerDisplay = `${String(totalSeconds).padStart(2, '0')}:${String(hundredths).padStart(2, '0')}`;
  const progressPct = duration > 0 ? Math.min(100, Math.round((elapsedMs / duration) * 100)) : 100;

  let statusText = t.statusConnecting;
  if (isCompleted || progressPct >= 100) {
    statusText = t.statusCompleted;
  } else if (progressPct >= 70) {
    statusText = t.statusReconciling;
  } else if (progressPct >= 20) {
    statusText = t.statusCompounding;
  }

  const handleHeroClick = () => {
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
        <div className="sync-modal-header">
          <div className="sync-modal-header-text">
            <h2 id="sync-modal-title" className="sync-modal-title">
              <span>{t.title}</span>
              <span className="sync-stopwatch-timer-badge" aria-label={t.stopwatch}>
                {timerDisplay}s
              </span>
            </h2>
            <p className="sync-modal-subtitle">{t.subtitle}</p>
          </div>
        </div>

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
              {businessDays} <small className="sync-submetric-unit">{t.daysUnit}</small>
            </strong>
          </div>

          {referenceDate && (
            <div className="sync-submetric-card span-two">
              <span>{t.settlementDateLabel}</span>
              <strong>{formatDateKey(referenceDate, locale)} · B3 / CETIP</strong>
            </div>
          )}
        </div>

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
