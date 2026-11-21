import React, { useEffect } from 'react';
import './AboutModal.css';

const ABOUT_TEXT = {
  en: {
    title: 'How Kyos Works',
    subtitle: 'A yield-driven system to grow your net worth and fund purchases without touching your principal investment.',
    close: 'Close',
    gotIt: 'Got it',
    priorityTitle: 'Daily Yield Allocation Flow',
    priorityStep1Title: 'Daily Yield',
    priorityStep1Desc: 'Accrues every business day from your active investments.',
    priorityStep2Title: 'Recovery',
    priorityStep2Desc: 'Reimburses spending & unplanned expenses first.',
    priorityStep3Title: 'Wishlist',
    priorityStep3Desc: 'Progressively funds items once recovery is clear.',
    cards: [
      {
        id: 'daily-income',
        title: 'Daily Income Driven',
        description: 'All calculations, time estimates, and progress in Kyos are driven by your total daily investment income (calculated via CDI and asset yield rates). Your invested principal is never consumed.'
      },
      {
        id: 'milestones',
        title: 'Auto 10k Milestones',
        description: 'Your milestone automatically targets the next 10,000 interval above your current net worth (e.g. 10k, 20k, 30k). Kyos continuously calculates the remaining amount and business days to achieve it.'
      },
      {
        id: 'recovery',
        title: 'Recovery System',
        description: 'When you record spent money or unexpected expenses, they enter the Recovery column. 100% of your daily yield is prioritized here to pay down the balance before funding any wishlist items.'
      },
      {
        id: 'wishlist',
        title: 'Wishlist Funding',
        description: 'Queue up items you want to buy. Daily income amortizes the active item day-by-day. Once the remaining price hits R$ 0, it becomes "Ready", meaning it has been 100% funded by your investment returns.'
      },
      {
        id: 'taxes',
        title: 'Tax & IOF Deductions',
        description: 'Toggle optional tax deduction to project real net returns using Brazilian regressive Income Tax (IR from 22.5% to 15%) and IOF (which automatically hits 0% after 30 calendar days).'
      }
    ]
  },
  pt: {
    title: 'Como Funciona o Kyos',
    subtitle: 'Um sistema baseado em rendimento diário para expandir seu patrimônio e financiar compras sem tocar no capital investido.',
    close: 'Fechar',
    gotIt: 'Entendi',
    priorityTitle: 'Fluxo de Alocação do Rendimento',
    priorityStep1Title: 'Rendimento Diário',
    priorityStep1Desc: 'Acumulado a cada dia útil a partir dos seus investimentos.',
    priorityStep2Title: 'Recuperação',
    priorityStep2Desc: 'Reembolsa gastos e despesas não planejadas primeiro.',
    priorityStep3Title: 'Lista de Desejos',
    priorityStep3Desc: 'Financia itens progressivamente após zerar a recuperação.',
    cards: [
      {
        id: 'daily-income',
        title: 'Base no Rendimento Diário',
        description: 'Todos os cálculos, estimativas de prazo e barras de progresso no Kyos são alimentados pelo rendimento diário dos seus investimentos (CDI e taxa de rendimento). Seu capital investido nunca é consumido.'
      },
      {
        id: 'milestones',
        title: 'Metas Automáticas de 10k',
        description: 'Sua meta é definida automaticamente para o próximo múltiplo de 10.000 acima do seu patrimônio atual (ex: 10k, 20k, 30k). O Kyos projeta o valor restante e os dias úteis necessários para alcançá-la.'
      },
      {
        id: 'recovery',
        title: 'Sistema de Recuperação',
        description: 'Ao registrar um gasto ou despesa não planejada, ele entra na coluna de Recuperação. Todo o rendimento diário é canalizado para cá primeiro até quitar o saldo antes de financiar qualquer item de desejo.'
      },
      {
        id: 'wishlist',
        title: 'Financiamento de Desejos',
        description: 'Adicione aquilo que deseja comprar. O rendimento diário reduz o saldo do item ativo dia após dia. Ao atingir R$ 0, ele fica "Pronto", financiado 100% pelos lucros dos seus investimentos.'
      },
      {
        id: 'taxes',
        title: 'Tributação e IOF Regressivo',
        description: 'Ative a dedução opcional de impostos para ver o rendimento líquido real segundo o IR Regressivo (22,5% a 15%) e o IOF (que zera exatamente após 30 dias corridos).'
      }
    ]
  }
};

const AboutModal = ({ isOpen, onClose, locale = 'en' }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const t = ABOUT_TEXT[locale] || ABOUT_TEXT.en;

  return (
    <div className="about-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="about-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="about-modal-close"
          onClick={onClose}
          aria-label={t.close}
        >
          <svg aria-hidden="true" viewBox="0 0 256 256" width="16" height="16" fill="currentColor">
            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
          </svg>
        </button>

        <header className="about-modal-header">
          <h2 id="about-modal-title">{t.title}</h2>
          <p className="about-modal-subtitle">{t.subtitle}</p>
        </header>

        <section className="about-priority-banner" aria-label={t.priorityTitle}>
          <div className="about-priority-header">
            <span className="about-priority-label">{t.priorityTitle}</span>
          </div>
          <div className="about-flow-steps">
            <div className="about-flow-step income">
              <div className="about-flow-step-head">
                <span className="about-flow-index">01</span>
                <strong>{t.priorityStep1Title}</strong>
              </div>
              <span>{t.priorityStep1Desc}</span>
            </div>

            <div className="about-flow-arrow" aria-hidden="true">→</div>

            <div className="about-flow-step recovery">
              <div className="about-flow-step-head">
                <span className="about-flow-index">02</span>
                <strong>{t.priorityStep2Title}</strong>
              </div>
              <span>{t.priorityStep2Desc}</span>
            </div>

            <div className="about-flow-arrow" aria-hidden="true">→</div>

            <div className="about-flow-step wishlist">
              <div className="about-flow-step-head">
                <span className="about-flow-index">03</span>
                <strong>{t.priorityStep3Title}</strong>
              </div>
              <span>{t.priorityStep3Desc}</span>
            </div>
          </div>
        </section>

        <div className="about-cards-grid">
          {t.cards.map((card) => (
            <article className={`about-card card-${card.id}`} key={card.id}>
              <h3 className="about-card-title">{card.title}</h3>
              <p className="about-card-desc">{card.description}</p>
            </article>
          ))}
        </div>

        <footer className="about-modal-footer">
          <button
            type="button"
            className="about-modal-btn-gotit"
            onClick={onClose}
          >
            {t.gotIt}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AboutModal;
