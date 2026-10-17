import React, { useEffect } from 'react';
import './AboutModal.css';

const ABOUT_TEXT = {
  en: {
    title: 'How Kyos Works',
    subtitle: 'A yield-driven system to grow your net worth and fund purchases without touching your principal investment.',
    close: 'Close',
    gotIt: 'Got it',
    priorityTitle: 'Daily Yield Allocation Flow',
    priorityStep1Badge: 'Input',
    priorityStep1Title: 'Daily Yield',
    priorityStep1Desc: 'Accrues every business day from your active investments.',
    priorityStep2Badge: '1st Priority',
    priorityStep2Title: 'Recovery',
    priorityStep2Desc: 'Reimburses spending & unplanned expenses first.',
    priorityStep3Badge: '2nd Priority',
    priorityStep3Title: 'Wishlist',
    priorityStep3Desc: 'Progressively funds items once recovery is clear.',
    cards: [
      {
        id: 'daily-income',
        icon: 'lightning',
        badge: 'Foundation',
        title: 'Daily Income Driven',
        description: 'All calculations, time estimates, and progress in Kyos are driven by your total daily investment income (calculated via CDI and asset yield rates). Your invested principal is never consumed.'
      },
      {
        id: 'milestones',
        icon: 'flag',
        badge: 'Milestone Target',
        title: 'Auto 10k Milestones',
        description: 'Your milestone automatically targets the next 10,000 interval above your current net worth (e.g. 10k, 20k, 30k). Kyos continuously calculates the remaining amount and business days to achieve it.'
      },
      {
        id: 'recovery',
        icon: 'shield',
        badge: '1st Priority',
        title: 'Recovery System',
        description: 'When you record spent money or unexpected expenses, they enter the Recovery column. 100% of your daily yield is prioritized here to pay down the balance before funding any wishlist items.'
      },
      {
        id: 'wishlist',
        icon: 'gift',
        badge: '2nd Priority',
        title: 'Wishlist Funding',
        description: 'Queue up items you want to buy. Daily income amortizes the active item day-by-day. Once the remaining price hits R$ 0, it becomes "Ready", meaning it has been 100% funded by your investment returns.'
      },
      {
        id: 'taxes',
        icon: 'percent',
        badge: 'Optional Tax Mode',
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
    priorityStep1Badge: 'Entrada',
    priorityStep1Title: 'Rendimento Diário',
    priorityStep1Desc: 'Acumulado a cada dia útil a partir dos seus investimentos.',
    priorityStep2Badge: '1ª Prioridade',
    priorityStep2Title: 'Recuperação',
    priorityStep2Desc: 'Reembolsa gastos e despesas não planejadas primeiro.',
    priorityStep3Badge: '2ª Prioridade',
    priorityStep3Title: 'Lista de Desejos',
    priorityStep3Desc: 'Financia itens progressivamente após zerar a recuperação.',
    cards: [
      {
        id: 'daily-income',
        icon: 'lightning',
        badge: 'Fundamento',
        title: 'Base no Rendimento Diário',
        description: 'Todos os cálculos, estimativas de prazo e barras de progresso no Kyos são alimentados pelo rendimento diário dos seus investimentos (CDI e taxa de rendimento). Seu capital investido nunca é consumido.'
      },
      {
        id: 'milestones',
        icon: 'flag',
        badge: 'Metas',
        title: 'Metas Automáticas de 10k',
        description: 'Sua meta é definida automaticamente para o próximo múltiplo de 10.000 acima do seu patrimônio atual (ex: 10k, 20k, 30k). O Kyos projeta o valor restante e os dias úteis necessários para alcançá-la.'
      },
      {
        id: 'recovery',
        icon: 'shield',
        badge: '1ª Prioridade',
        title: 'Sistema de Recuperação',
        description: 'Ao registrar um gasto ou despesa não planejada, ele entra na coluna de Recuperação. Todo o rendimento diário é canalizado para cá primeiro até quitar o saldo antes de financiar qualquer item de desejo.'
      },
      {
        id: 'wishlist',
        icon: 'gift',
        badge: '2ª Prioridade',
        title: 'Financiamento de Desejos',
        description: 'Adicione aquilo que deseja comprar. O rendimento diário reduz o saldo do item ativo dia após dia. Ao atingir R$ 0, ele fica "Pronto", financiado 100% pelos lucros dos seus investimentos.'
      },
      {
        id: 'taxes',
        icon: 'percent',
        badge: 'Modo Opcional de Tributação',
        title: 'Tributação e IOF Regressivo',
        description: 'Ative a dedução opcional de impostos para ver o rendimento líquido real segundo o IR Regressivo (22,5% a 15%) e o IOF (que zera exatamente após 30 dias corridos).'
      }
    ]
  }
};

const renderIcon = (iconName) => {
  switch (iconName) {
    case 'lightning':
      return (
        <svg aria-hidden="true" viewBox="0 0 256 256" width="24" height="24" fill="currentColor">
          <path d="M215.79,118.11a8,8,0,0,0-7.79-6.11H152V32a8,8,0,0,0-13.66-5.66l-96,96a8,8,0,0,0,5.66,13.66H104v80a8,8,0,0,0,13.66,5.66l96-96A8,8,0,0,0,215.79,118.11ZM120,196.69V144a8,8,0,0,0-8-8H59.31L136,59.31V112a8,8,0,0,0,8,8h52.69Z" />
        </svg>
      );
    case 'flag':
      return (
        <svg aria-hidden="true" viewBox="0 0 256 256" width="24" height="24" fill="currentColor">
          <path d="M245.71,77.56A8,8,0,0,0,240,72H149.37L125.75,41.49A16,16,0,0,0,113.11,36c-.46,0-.91,0-1.37,0H40a16,16,0,0,0-16,16V216a8,8,0,0,0,16,0V160h71.69l24.4,29.88A16,16,0,0,0,148.73,196H240a8,8,0,0,0,7.71-10.44ZM40,52h71.74l24.4,30.5A16,16,0,0,0,148.78,88H230l-17.65,44L230,176H148.73l-24.4-30.5A16,16,0,0,0,111.69,140H40Z" />
        </svg>
      );
    case 'shield':
      return (
        <svg aria-hidden="true" viewBox="0 0 256 256" width="24" height="24" fill="currentColor">
          <path d="M208,40H48A16,16,0,0,0,32,56v58.77c0,89.61,75.82,119.34,91,124.39a15.54,15.54,0,0,0,10,0c15.2-5.05,91-34.78,91-124.39V56A16,16,0,0,0,208,40ZM128,223.44C114,218.49,48,190.62,48,114.77V56H208v58.77C208,190.57,142,218.47,128,223.44ZM165.66,101.66,120,147.31,98.34,125.66a8,8,0,0,0-11.32,11.31l27.32,27.32a8,8,0,0,0,11.32,0l51.32-51.32a8,8,0,0,0-11.32-11.31Z" />
        </svg>
      );
    case 'gift':
      return (
        <svg aria-hidden="true" viewBox="0 0 256 256" width="24" height="24" fill="currentColor">
          <path d="M216,72H180.49A44,44,0,0,0,108,48a43.59,43.59,0,0,0-4,18.4A44,44,0,0,0,32,108a8,8,0,0,0,8,8h8v96a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V116h8a8,8,0,0,0,8-8V80A8,8,0,0,0,216,72ZM120,52a28,28,0,0,1,50.7,16.57A27.67,27.67,0,0,1,168.49,72H120ZM60,100a28,28,0,0,1,56-4.57A27.67,27.67,0,0,1,118.49,100H60Zm60,16h72v44H120Zm-16,0v44H48V116Zm0,60v48H64a4,4,0,0,1-4-4V176Zm16,48V176h72v44a4,4,0,0,1-4,4Zm96-120H136V88h80Z" />
        </svg>
      );
    case 'percent':
      return (
        <svg aria-hidden="true" viewBox="0 0 256 256" width="24" height="24" fill="currentColor">
          <path d="M205.66,61.66l-144,144a8,8,0,0,1-11.32-11.32l144-144a8,8,0,0,1,11.32,11.32ZM64,104A36,36,0,1,0,28,68,36,36,0,0,0,64,104Zm0-56A20,20,0,1,1,44,68,20,20,0,0,1,64,48Zm128,104a36,36,0,1,0,36,36A36,36,0,0,0,192,152Zm0,56a20,20,0,1,1,20-20A20,20,0,0,1,192,208Z" />
        </svg>
      );
    default:
      return null;
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
          <svg aria-hidden="true" viewBox="0 0 256 256" width="20" height="20" fill="currentColor">
            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
          </svg>
        </button>

        <header className="about-modal-header">
          <div className="about-modal-badge">
            <svg className="about-modal-coin-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-68a28,28,0,0,1-28,28h-4v8a8,8,0,0,1-16,0v-8H104a8,8,0,0,1,0-16h36a12,12,0,0,0,0-24H116a28,28,0,0,1,0-56h4V72a8,8,0,0,1,16,0v8h16a8,8,0,0,1,0,16H116a12,12,0,0,0,0,24h24A28,28,0,0,1,168,148Z" />
            </svg>
            <span>KYOS PHILOSOPHY</span>
          </div>
          <h2 id="about-modal-title">{t.title}</h2>
          <p className="about-modal-subtitle">{t.subtitle}</p>
        </header>

        {/* Priority Flow Banner */}
        <section className="about-priority-banner" aria-label={t.priorityTitle}>
          <div className="about-priority-header">
            <span className="about-priority-label">{t.priorityTitle}</span>
          </div>
          <div className="about-flow-steps">
            <div className="about-flow-step income">
              <div className="about-flow-badge">{t.priorityStep1Badge}</div>
              <strong>{t.priorityStep1Title}</strong>
              <span>{t.priorityStep1Desc}</span>
            </div>

            <div className="about-flow-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="about-flow-step recovery">
              <div className="about-flow-badge">{t.priorityStep2Badge}</div>
              <strong>{t.priorityStep2Title}</strong>
              <span>{t.priorityStep2Desc}</span>
            </div>

            <div className="about-flow-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="about-flow-step wishlist">
              <div className="about-flow-badge">{t.priorityStep3Badge}</div>
              <strong>{t.priorityStep3Title}</strong>
              <span>{t.priorityStep3Desc}</span>
            </div>
          </div>
        </section>

        {/* Concept Cards Grid */}
        <div className="about-cards-grid">
          {t.cards.map((card) => (
            <article className={`about-card card-${card.id}`} key={card.id}>
              <div className="about-card-top">
                <div className="about-card-icon-wrap">
                  {renderIcon(card.icon)}
                </div>
                <span className="about-card-badge">{card.badge}</span>
              </div>
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