import React, { useEffect } from 'react';
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
    done: 'Done',
    daysUnit: 'business days'
  },
  pt: {
    title: 'Sincronização CDI Bancária',
    subtitle: 'Rendimentos compostos reconciliados com a B3 e posição bancária',
    accruedIncomeLabel: 'Rendimento Total Acumulado',
    portfolioBalanceLabel: 'Saldo Total em Carteira',
    businessDaysLabel: 'Dias Úteis Acumulados',
    settlementDateLabel: 'Data da Posição Bancária',
    done: 'Concluir',
    daysUnit: 'dias úteis'
  }
};

const SyncModal = ({
  isOpen,
  onClose,
  targetIncome = 0,
  targetTotal = 0,
  businessDays = 0,
  referenceDate = '',
  locale = 'pt'
}) => {
  const t = SYNC_MODAL_TEXT[locale] || SYNC_MODAL_TEXT.pt;
  const targetIncomeNum = Math.max(0, Number(targetIncome) || 0);
  const targetTotalNum = Math.max(0, Number(targetTotal) || 0);

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
              {t.title}
            </h2>
            <p className="sync-modal-subtitle">{t.subtitle}</p>
          </div>
        </div>

        <div className="sync-money-hero-card" role="region" aria-live="polite">
          <span className="sync-money-label">{t.accruedIncomeLabel}</span>
          <div className="sync-money-counter-display" data-testid="sync-money-display">
            R$ {formatMoney(targetIncomeNum, locale)}
          </div>
        </div>

        <div className="sync-modal-metrics-grid">
          <div className="sync-submetric-card highlight">
            <span>{t.portfolioBalanceLabel}</span>
            <strong data-testid="sync-portfolio-balance">
              R$ {formatMoney(targetTotalNum, locale)}
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
