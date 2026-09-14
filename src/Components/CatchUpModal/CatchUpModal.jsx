import React from 'react';
import './CatchUpModal.css';
import { formatMoney } from '../../utils/formatters';

const MODAL_TEXT = {
  en: {
    title: 'Catch-Up Summary',
    subtitle: 'Here is what was processed while you were away:',
    businessDaysProcessed: 'Business Days Processed',
    calendarDaysPassed: 'Calendar Days Passed',
    totalAccruedIncome: 'Total Accrued Income',
    completedSlots: 'Completed Wishlist & Recovery Items',
    noCompletedSlots: 'No wishlist or recovery items were completed during this period.',
    continue: 'Continue',
    wishlist: 'Wishlist',
    recovery: 'Recovery'
  },
  pt: {
    title: 'Resumo de Atualização',
    subtitle: 'Veja o que foi processado durante sua ausência:',
    businessDaysProcessed: 'Dias Úteis Processados',
    calendarDaysPassed: 'Dias Corridos',
    totalAccruedIncome: 'Rendimento Acumulado',
    completedSlots: 'Itens de Desejos e Recuperação Concluídos',
    noCompletedSlots: 'Nenhum item da lista de desejos ou recuperação foi concluído neste período.',
    continue: 'Continuar',
    wishlist: 'Lista de Desejos',
    recovery: 'Recuperação'
  }
};

const CatchUpModal = ({
  isOpen,
  onClose,
  businessDays = 0,
  calendarDays = 0,
  totalAccrued = 0,
  completedSlots = [],
  locale = 'en'
}) => {
  if (!isOpen) return null;

  const t = MODAL_TEXT[locale] || MODAL_TEXT.en;

  return (
    <div className="catchup-overlay" onClick={onClose} role="presentation">
      <div
        className="catchup-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catchup-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="catchup-header">
          <h2 id="catchup-modal-title">{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>

        <div className="catchup-metrics">
          <div className="catchup-metric-card neutral">
            <span>{t.businessDaysProcessed}</span>
            <strong>
              {businessDays} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#888' }}>/ {calendarDays} {t.calendarDaysPassed.toLowerCase()}</small>
            </strong>
          </div>

          <div className="catchup-metric-card">
            <span>{t.totalAccruedIncome}</span>
            <strong>R$ {formatMoney(totalAccrued)}</strong>
          </div>
        </div>

        <div className="catchup-section">
          <h3>{t.completedSlots}</h3>
          {completedSlots.length > 0 ? (
            <div className="catchup-slots-list">
              {completedSlots.map((slot, index) => (
                <div className="catchup-slot-item" key={slot.id || index}>
                  <div className="catchup-slot-info">
                    <span className={`catchup-slot-badge ${slot.type || 'wishlist'}`}>
                      {slot.type === 'recovery' ? t.recovery : t.wishlist}
                    </span>
                    <span className="catchup-slot-name">{slot.name || slot.expenseName}</span>
                  </div>
                  <span className="catchup-slot-price">R$ {formatMoney(slot.price || slot.originalPrice || 0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="catchup-empty">{t.noCompletedSlots}</p>
          )}
        </div>

        <div className="catchup-footer">
          <button
            type="button"
            className="catchup-btn-continue"
            onClick={onClose}
          >
            {t.continue}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CatchUpModal;
