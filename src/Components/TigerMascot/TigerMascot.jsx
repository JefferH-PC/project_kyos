import React, { useState, useEffect, useRef, useMemo } from 'react';
import './TigerMascot.css';

const TIGER_DIALOGUES = {
  pt: {
    name: 'Herby, o Tigre do Kyos',
    role: 'Guardião do Patrimônio',
    feedBtn: 'Alimentar 🪙',
    coinsFedLabel: 'Moedas guardadas',
    minimize: 'Minimizar mascote',
    expand: 'Expandir Herby',
    petMe: 'Clique para fazer carinho!',
    reactions: {
      default: [
        'Roar! Cuidando do seu patrimônio com garras afiadas!',
        'Juros compostos: a oitava maravilha do mundo trabalhando pra você!',
        'Miau... quer dizer, ROAR! Seu dinheiro nunca dorme!',
        'Regra de ouro do Kyos: nunca toque no principal, viva dos juros!',
        'Adoro ver essa barra de rendimentos diários crescer!',
        'Um carinho atrás da orelha me dá +10% de foco nos investimentos!',
        'Cada centavo de rendimento hoje é um soldado trabalhando amanhã!',
        'De grão em grão, o tigre constrói o reino!'
      ],
      sleeping: [
        'Zzz... A B3 tá fechada hoje. Aproveite o descanso, segunda os juros voltam!',
        'Zzz... Cochilo de tigre enquanto o mercado descansa... zZz',
        'Zzz... Final de semana é dia de recarregar as energias!'
      ],
      wakeUp: [
        'Bocejo... acordei! A B3 tá fechada hoje, mas tô de sentinela!',
        'Opa! Um carinho no final de semana sempre me acorda feliz!'
      ],
      syncing: [
        'Reconciliando cada centavo com a B3! Olha a máquina girando!',
        'Stopwatch na mão! Calculando os rendimentos em tempo real!'
      ],
      syncDone: [
        '✓ 100% Reconciliado com o banco! Nosso patrimônio tá rugindo alto!',
        'Posição bancária sincronizada com perfeição! Bom trabalho!'
      ],
      recovery: [
        'Modo Guarda ativado! 100% dos rendimentos diários focados em zerar essa recuperação!',
        'Protegendo o principal! Vamos quitar essa pendência rapidinho!'
      ],
      milestone: [
        'Estamos a um salto da próxima meta de 10k! Aguenta firme!',
        'Quase lá! Sinto cheiro de comemoração de marco em breve!'
      ],
      wishlistReady: [
        'Oba! Tem item 100% pago só com rendimentos! Pode resgatar sem peso na consciência!',
        'Meta concluída sem mexer em 1 centavo do principal! Esse é o poder do Kyos!'
      ],
      fed: [
        'NHAC! 🪙 Mais um aporte alimentando o efeito bola de neve!',
        'Obrigado! Moeda guardada com sucesso no cofre do tigre!',
        'Adoro moedas de ouro! Elas rendem que é uma beleza!'
      ],
      hideValues: '🙈 Shhh! Valores protegidos a sete chaves!',
      showValues: '👀 Olhos bem abertos no patrimônio!',
      sectionSimulation: '🔮 Simulando o futuro! Juros compostos acelerando!',
      sectionBalance: '📈 Olha essa curva de rendimentos crescendo!',
      sectionInvestments: '💼 Cada aporte fortalece a bola de neve!',
      sectionNetWorth: '🦁 Guardando o patrimônio com garras afiadas!'
    }
  },
  en: {
    name: 'Herby, the Kyos Tiger',
    role: 'Wealth Guardian',
    feedBtn: 'Feed 🪙',
    coinsFedLabel: 'Coins vaulted',
    minimize: 'Minimize mascot',
    expand: 'Expand Herby',
    petMe: 'Click to pet me!',
    reactions: {
      default: [
        'Roar! Guarding your wealth with sharp claws!',
        'Compound interest: the 8th wonder of the world working for you!',
        'Meow... I mean, ROAR! Your money never sleeps!',
        'Golden rule of Kyos: never touch the principal, live off the yield!',
        'Love watching your daily income bar grow!',
        'A scratch behind the ears gives +10% investment focus!',
        'Every cent of yield today is a soldier working for you tomorrow!',
        'Step by step, the tiger builds an empire!'
      ],
      sleeping: [
        'Zzz... B3 & banking markets are closed today. Rest easy, compounding resumes Monday!',
        'Zzz... Taking a catnap while markets rest... zZz',
        'Zzz... Weekends are for recharging energy!'
      ],
      wakeUp: [
        'Yawn... I am awake! B3 is closed, but I remain on sentry duty!',
        'A weekend scratch behind the ears always wakes me up happy!'
      ],
      syncing: [
        'Reconciling every cent with B3! Look at the compounding engine run!',
        'Stopwatch in paw! Calculating returns in real-time!'
      ],
      syncDone: [
        '✓ 100% Reconciled with bank position! Our net worth is roaring!',
        'Banking balance synced to perfection! Great job!'
      ],
      recovery: [
        'Guard Mode active! 100% of daily yields prioritized to clear recovery first!',
        'Shielding your principal! We will wipe out this recovery item in no time!'
      ],
      milestone: [
        'We are just a pounce away from the next 10k milestone! Keep it up!',
        'Almost there! I can smell a milestone celebration coming!'
      ],
      wishlistReady: [
        'Woohoo! An item is 100% funded purely from yields! Redeem with zero guilt!',
        'Goal reached without spending 1 cent of principal! That is the power of Kyos!'
      ],
      fed: [
        'CHOMP! 🪙 Another deposit feeding the compound snowball effect!',
        'Thank you! Coin safely vaulted in the tiger safe!',
        'Love gold coins! They compound like a charm!'
      ],
      hideValues: '🙈 Shhh! Values locked away safely!',
      showValues: '👀 Eyes wide open on our wealth!',
      sectionSimulation: '🔮 Simulating the future! Compound interest in action!',
      sectionBalance: '📈 Tracking our ascending yield trajectory!',
      sectionInvestments: '💼 Every investment powers up the snowball!',
      sectionNetWorth: '🦁 Guarding our net worth with sharp claws!'
    }
  }
};

const getRandomItem = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
};

const TigerMascot = ({
  isWeekendOrHoliday = false,
  isSyncing = false,
  hasRecovery = false,
  hasReadyWishlist = false,
  isMilestoneClose = false,
  areValuesVisible = true,
  activeSection = 'Net Worth',
  locale = 'pt',
  inline = false,
  className = ''
}) => {
  const strings = TIGER_DIALOGUES[locale] || TIGER_DIALOGUES.en;

  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return window.localStorage.getItem('kyos-tiger-minimized') === 'true';
    } catch {
      return false;
    }
  });

  const [coinsFed, setCoinsFed] = useState(() => {
    try {
      return Number(window.localStorage.getItem('kyos-tiger-coins') || 0);
    } catch {
      return 0;
    }
  });

  const [bubbleText, setBubbleText] = useState('');
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [tigerEmotion, setTigerEmotion] = useState('idle'); // 'idle' | 'happy' | 'fed' | 'celebrating' | 'guarding' | 'hiding'
  const [particles, setParticles] = useState([]);

  const bubbleTimeoutRef = useRef(null);
  const emotionTimeoutRef = useRef(null);

  // Determine current ambient state
  const isSleeping = isWeekendOrHoliday && tigerEmotion !== 'happy' && tigerEmotion !== 'fed' && tigerEmotion !== 'hiding';

  // Persist minimized state
  useEffect(() => {
    try {
      window.localStorage.setItem('kyos-tiger-minimized', String(isMinimized));
    } catch {
      // Ignore quota error
    }
  }, [isMinimized]);

  // Persist coins fed count
  useEffect(() => {
    try {
      window.localStorage.setItem('kyos-tiger-coins', String(coinsFed));
    } catch {
      // Ignore quota error
    }
  }, [coinsFed]);

  const showSpeechBubble = (text, durationMs = 4500) => {
    if (!text) return;
    setBubbleText(text);
    setIsBubbleVisible(true);
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = setTimeout(() => {
      setIsBubbleVisible(false);
    }, durationMs);
  };

  const spawnParticles = (type = 'heart') => {
    const id = Date.now() + Math.random();
    const symbol = type === 'coin' ? '🪙' : type === 'star' ? '⭐' : '❤️';
    setParticles((prev) => [...prev.slice(-4), { id, symbol }]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 1200);
  };

  // React to syncing status changes
  const prevSyncingRef = useRef(isSyncing);
  useEffect(() => {
    if (isSyncing && !prevSyncingRef.current) {
      setTigerEmotion('celebrating');
      showSpeechBubble(getRandomItem(strings.reactions.syncing), 3500);
    } else if (!isSyncing && prevSyncingRef.current) {
      setTigerEmotion('celebrating');
      spawnParticles('star');
      showSpeechBubble(getRandomItem(strings.reactions.syncDone), 4500);
    }
    prevSyncingRef.current = isSyncing;
  }, [isSyncing, strings]);

  // React to visibility toggles (player clicks eye icon)
  const prevValuesVisibleRef = useRef(areValuesVisible);
  useEffect(() => {
    if (prevValuesVisibleRef.current !== undefined && prevValuesVisibleRef.current !== areValuesVisible) {
      if (!areValuesVisible) {
        setTigerEmotion('hiding');
        showSpeechBubble(strings.reactions.hideValues, 3500);
        if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current);
        emotionTimeoutRef.current = setTimeout(() => {
          setTigerEmotion('idle');
        }, 3200);
      } else {
        setTigerEmotion('happy');
        showSpeechBubble(strings.reactions.showValues, 3000);
        if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current);
        emotionTimeoutRef.current = setTimeout(() => {
          setTigerEmotion('idle');
        }, 2500);
      }
    }
    prevValuesVisibleRef.current = areValuesVisible;
  }, [areValuesVisible, strings]);

  // React to section navigation changes (player clicks tabs)
  const prevSectionRef = useRef(activeSection);
  useEffect(() => {
    if (prevSectionRef.current !== undefined && prevSectionRef.current !== activeSection && activeSection) {
      setTigerEmotion('happy');
      if (activeSection === 'Simulation') {
        showSpeechBubble(strings.reactions.sectionSimulation, 3500);
      } else if (activeSection === 'Balance') {
        showSpeechBubble(strings.reactions.sectionBalance, 3500);
      } else if (activeSection === 'Investments') {
        showSpeechBubble(strings.reactions.sectionInvestments, 3500);
      } else if (activeSection === 'Net Worth') {
        showSpeechBubble(strings.reactions.sectionNetWorth, 3500);
      }
      if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current);
      emotionTimeoutRef.current = setTimeout(() => {
        setTigerEmotion('idle');
      }, 3000);
    }
    prevSectionRef.current = activeSection;
  }, [activeSection, strings]);

  // Handle clicking on the Tiger (Petting / Interaction)
  const handlePetTiger = () => {
    setTigerEmotion('happy');
    spawnParticles('heart');

    if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current);
    emotionTimeoutRef.current = setTimeout(() => {
      setTigerEmotion('idle');
    }, 2000);

    if (isWeekendOrHoliday) {
      showSpeechBubble(getRandomItem(strings.reactions.wakeUp));
    } else if (hasRecovery) {
      showSpeechBubble(getRandomItem(strings.reactions.recovery));
    } else if (hasReadyWishlist) {
      showSpeechBubble(getRandomItem(strings.reactions.wishlistReady));
    } else if (isMilestoneClose) {
      showSpeechBubble(getRandomItem(strings.reactions.milestone));
    } else {
      showSpeechBubble(getRandomItem(strings.reactions.default));
    }
  };

  // Handle Feeding a coin
  const handleFeedCoin = (e) => {
    e.stopPropagation();
    setCoinsFed((c) => c + 1);
    setTigerEmotion('fed');
    spawnParticles('coin');

    if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current);
    emotionTimeoutRef.current = setTimeout(() => {
      setTigerEmotion('idle');
    }, 2400);

    showSpeechBubble(getRandomItem(strings.reactions.fed));
  };

  const toggleMinimize = (e) => {
    e.stopPropagation();
    setIsMinimized((prev) => !prev);
    setIsBubbleVisible(false);
  };

  // Mode badge & accessory indicators
  const accessory = useMemo(() => {
    if (isSyncing) return 'stopwatch';
    if (isMilestoneClose) return 'crown';
    if (hasRecovery) return 'shield';
    if (hasReadyWishlist) return 'gift';
    if (activeSection === 'Simulation') return 'glasses';
    return null;
  }, [isSyncing, isMilestoneClose, hasRecovery, hasReadyWishlist, activeSection]);

  return (
    <aside
      className={`tiger-companion-dock ${inline ? 'inline-companion' : ''} ${isMinimized ? 'minimized' : ''} ${isSleeping ? 'sleeping' : ''} emotion-${tigerEmotion} ${className}`}
      aria-label={strings.name}
      data-testid="tiger-mascot-container"
    >
      {/* Floating Interactive Speech Bubble */}
      {isBubbleVisible && !isMinimized && (
        <div
          className="tiger-speech-bubble"
          role="status"
          aria-live="polite"
          onClick={() => setIsBubbleVisible(false)}
          title="Click to dismiss"
          data-testid="tiger-speech-bubble"
        >
          <div className="tiger-bubble-tail" />
          <p>{bubbleText}</p>
        </div>
      )}

      {/* Floating Particles (Hearts, Coins, Stars) */}
      <div className="tiger-particles-layer" aria-hidden="true">
        {particles.map((p) => (
          <span key={p.id} className="tiger-particle">
            {p.symbol}
          </span>
        ))}
      </div>

      {/* Minimized Quick Icon */}
      {isMinimized ? (
        <button
          type="button"
          className="tiger-minimized-paw-btn"
          onClick={toggleMinimize}
          title={strings.expand}
          aria-label={strings.expand}
          data-testid="tiger-expand-btn"
        >
          <span className="paw-emoji" aria-hidden="true">🐯</span>
          {coinsFed > 0 && <span className="tiger-coin-badge">{coinsFed}</span>}
        </button>
      ) : (
        <div
          className="tiger-living-card"
          onClick={handlePetTiger}
          title={strings.petMe}
          data-testid="tiger-interactive-card"
        >
          {/* Top Controls: Minimize Button */}
          <button
            type="button"
            className="tiger-dock-minimize-btn"
            onClick={toggleMinimize}
            title={strings.minimize}
            aria-label={strings.minimize}
            data-testid="tiger-minimize-btn"
          >
            ×
          </button>

          {/* Living Tiger Vector Avatar */}
          <div className="tiger-avatar-stage">
            {/* Sleeping zZz Animation */}
            {isSleeping && (
              <div className="tiger-sleeping-particles" aria-hidden="true" data-testid="tiger-sleeping-particles">
                <span className="zzz-1">z</span>
                <span className="zzz-2">Z</span>
                <span className="zzz-3">Z</span>
              </div>
            )}

            {/* Accessory Overlay: Crown, Shield, Gift, or Stopwatch */}
            {accessory === 'crown' && (
              <div className="tiger-accessory crown" title="Meta de 10k próxima!" aria-hidden="true" data-testid="accessory-crown">
                👑
              </div>
            )}
            {accessory === 'shield' && (
              <div className="tiger-accessory shield" title="Modo Recuperação Ativo" aria-hidden="true" data-testid="accessory-shield">
                🛡️
              </div>
            )}
            {accessory === 'gift' && (
              <div className="tiger-accessory gift" title="Item 100% Financiado!" aria-hidden="true" data-testid="accessory-gift">
                🎁
              </div>
            )}
            {accessory === 'stopwatch' && (
              <div className="tiger-accessory stopwatch" title="Sincronizando..." aria-hidden="true" data-testid="accessory-stopwatch">
                ⏱️
              </div>
            )}
            {accessory === 'glasses' && (
              <div className="tiger-accessory glasses" title="Modo Simulação Ativo" aria-hidden="true" data-testid="accessory-glasses">
                👓
              </div>
            )}

            {/* Hand-Crafted Responsive SVG Tiger */}
            <svg
              className="tiger-svg"
              viewBox="0 0 120 120"
              width="90"
              height="90"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                {/* Clean non-neon gradients */}
                <linearGradient id="tigerCoatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="tigerCreamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fffbeb" />
                  <stop offset="100%" stopColor="#fef3c7" />
                </linearGradient>
                <linearGradient id="tigerCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>

              {/* Dynamic Tail (Wagging) */}
              <g className="tiger-tail-group">
                <path
                  d="M 30,95 C 10,95 5,75 14,68 C 18,65 24,70 26,76"
                  fill="none"
                  stroke="url(#tigerCoatGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Tail tip stripes */}
                <path d="M 12,71 L 18,73" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 16,77 L 22,79" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              </g>

              {/* Torso */}
              <ellipse cx="60" cy="88" rx="28" ry="22" fill="url(#tigerCoatGrad)" />
              {/* White Belly */}
              <ellipse cx="60" cy="90" rx="16" ry="14" fill="url(#tigerCreamGrad)" />

              {/* Left & Right Ears */}
              <g className="tiger-ear left-ear">
                <circle cx="34" cy="34" r="15" fill="url(#tigerCoatGrad)" />
                <circle cx="34" cy="34" r="9" fill="#fbcfe8" />
                <circle cx="34" cy="32" r="3" fill="#ffffff" />
              </g>
              <g className="tiger-ear right-ear">
                <circle cx="86" cy="34" r="15" fill="url(#tigerCoatGrad)" />
                <circle cx="86" cy="34" r="9" fill="#fbcfe8" />
                <circle cx="86" cy="32" r="3" fill="#ffffff" />
              </g>

              {/* Tiger Head */}
              <g className="tiger-head-group">
                <circle cx="60" cy="54" r="32" fill="url(#tigerCoatGrad)" />

                {/* White Cheek Tufts */}
                <ellipse cx="33" cy="62" rx="10" ry="8" fill="url(#tigerCreamGrad)" />
                <ellipse cx="87" cy="62" rx="10" ry="8" fill="url(#tigerCreamGrad)" />

                {/* Forehead Tiger Stripes */}
                <path d="M 60,26 L 60,34" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                <path d="M 52,29 L 55,34" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 68,29 L 65,34" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 54,39 L 66,39" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

                {/* Cheek Stripes */}
                <path d="M 33,52 L 40,54" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 32,58 L 41,59" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 87,52 L 80,54" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 88,58 L 79,59" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

                {/* Cream Muzzle */}
                <ellipse cx="60" cy="64" rx="16" ry="11" fill="url(#tigerCreamGrad)" />

                {/* Nose */}
                <polygon points="56,60 64,60 60,65" fill="#1e293b" />

                {/* Cute Mouth & Little Fangs */}
                <path d="M 60,65 L 60,69" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
                <path
                  d="M 54,69 Q 60,73 66,69"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                {tigerEmotion === 'happy' && (
                  <path d="M 58,70 L 62,70 L 60,73 Z" fill="#ef4444" />
                )}

                {/* Whiskers */}
                <line x1="48" y1="64" x2="36" y2="62" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="48" y1="67" x2="37" y2="68" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="72" y1="64" x2="84" y2="62" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="72" y1="67" x2="83" y2="68" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />

                {/* Expressive Eyes */}
                {tigerEmotion === 'hiding' ? (
                  /* Paws over eyes when hiding values */
                  <g className="tiger-eyes-hiding" data-testid="tiger-paws-hiding">
                    <ellipse cx="48" cy="49" rx="9" ry="7" fill="url(#tigerCreamGrad)" stroke="#d97706" strokeWidth="1.2" />
                    <ellipse cx="72" cy="49" rx="9" ry="7" fill="url(#tigerCreamGrad)" stroke="#d97706" strokeWidth="1.2" />
                    <circle cx="48" cy="49" r="3" fill="#fbcfe8" />
                    <circle cx="72" cy="49" r="3" fill="#fbcfe8" />
                  </g>
                ) : isSleeping ? (
                  /* Sleeping eyes */
                  <g className="tiger-eyes-sleeping" data-testid="tiger-eyes-sleeping">
                    <path d="M 45,50 Q 50,54 55,50" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 65,50 Q 70,54 75,50" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                ) : tigerEmotion === 'happy' || tigerEmotion === 'fed' ? (
                  /* Happy squint eyes */
                  <g className="tiger-eyes-happy">
                    <path d="M 45,51 Q 50,46 55,51" fill="none" stroke="#1e293b" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M 65,51 Q 70,46 75,51" fill="none" stroke="#1e293b" strokeWidth="2.8" strokeLinecap="round" />
                  </g>
                ) : (
                  /* Regular awake blinking eyes */
                  <g className="tiger-eyes-awake">
                    {/* Left Eye */}
                    <circle cx="49" cy="49" r="6.5" fill="#1e293b" />
                    <circle cx="49" cy="49" r="5" fill="#10b981" />
                    <circle cx="48" cy="48" r="2.2" fill="#0f172a" />
                    <circle cx="47.5" cy="47" r="1.3" fill="#ffffff" />

                    {/* Right Eye */}
                    <circle cx="71" cy="49" r="6.5" fill="#1e293b" />
                    <circle cx="71" cy="49" r="5" fill="#10b981" />
                    <circle cx="70" cy="48" r="2.2" fill="#0f172a" />
                    <circle cx="69.5" cy="47" r="1.3" fill="#ffffff" />
                  </g>
                )}
              </g>

              {/* Golden Coin Base */}
              <g className="tiger-coin-base">
                <ellipse cx="60" cy="107" rx="36" ry="9" fill="url(#tigerCoinGrad)" stroke="#b45309" strokeWidth="1.5" />
                <ellipse cx="60" cy="107" rx="28" ry="6.5" fill="none" stroke="#fef3c7" strokeWidth="1" strokeDasharray="3 2" />
                <text x="60" y="110" fontSize="8" fontWeight="800" fill="#78350f" textAnchor="middle">KYOS</text>
              </g>

              {/* Front Paws resting on coin */}
              <g className="tiger-paws">
                <ellipse cx="45" cy="103" rx="7" ry="5.5" fill="url(#tigerCreamGrad)" stroke="#d97706" strokeWidth="1" />
                <ellipse cx="75" cy="103" rx="7" ry="5.5" fill="url(#tigerCreamGrad)" stroke="#d97706" strokeWidth="1" />
                {/* Claw markings */}
                <line x1="43" y1="102" x2="43" y2="106" stroke="#1e293b" strokeWidth="1" />
                <line x1="46" y1="102" x2="46" y2="106" stroke="#1e293b" strokeWidth="1" />
                <line x1="73" y1="102" x2="73" y2="106" stroke="#1e293b" strokeWidth="1" />
                <line x1="76" y1="102" x2="76" y2="106" stroke="#1e293b" strokeWidth="1" />
              </g>
            </svg>
          </div>

          {/* Tiger Info & Interactive Actions */}
          <div className="tiger-info-bar">
            <div className="tiger-title-wrap">
              <strong className="tiger-name">{strings.name}</strong>
              <span className="tiger-role">{strings.role}</span>
            </div>

            <div className="tiger-actions-row">
              <button
                type="button"
                className="tiger-feed-btn"
                onClick={handleFeedCoin}
                title="Feed a coin to Herby"
                data-testid="tiger-feed-btn"
              >
                {strings.feedBtn}
              </button>

              <span className="tiger-coins-counter" title={strings.coinsFedLabel}>
                🪙 {coinsFed}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default TigerMascot;
