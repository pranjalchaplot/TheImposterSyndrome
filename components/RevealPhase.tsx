import React, { useState, useRef, useEffect } from 'react';
import { Player, GameData, GameSettings } from '../types';
import { Button } from './ui/Button';
import { ImposterIcon, CivilianIcon, JesterIcon } from './ui/AnimatedIcons';
import { haptics } from '../services/haptics';

interface RevealPhaseProps {
  players: Player[];
  gameData: GameData;
  settings: GameSettings;
  onComplete: () => void;
}

export const RevealPhase: React.FC<RevealPhaseProps> = ({ 
  players, 
  gameData, 
  settings, 
  onComplete 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPassing, setIsPassing] = useState(false);
  
  // Biometric hold-to-decrypt state
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPlayer = players[currentIndex];
  const nextPlayer = currentIndex < players.length - 1 ? players[currentIndex + 1] : null;

  // Other imposters for teaming
  const otherImposters = players.filter(p => p.isImposter && p.id !== currentPlayer.id);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const startHold = () => {
    if (isRevealed || isPassing) return;
    haptics.scanPulse();

    setHoldProgress(10);
    const stepTime = 40; // total hold time ~ 600ms
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          revealDossier();
          return 100;
        }
        haptics.tick();
        return prev + 12;
      });
    }, stepTime);
  };

  const cancelHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (!isRevealed) {
      setHoldProgress(0);
    }
  };

  const revealDossier = () => {
    haptics.reveal();
    setIsRevealed(true);
    setHoldProgress(0);
  };

  const handleNext = () => {
    haptics.tap();
    setIsRevealed(false);
    setIsPassing(true);
  };

  const handleReadyNextPlayer = () => {
    haptics.tap();
    if (currentIndex < players.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsPassing(false);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto px-4 py-6 justify-between select-none relative animate-fade-in overflow-hidden">
      
      {/* Top Progress Track */}
      <div className="space-y-1.5 pb-2">
        <div className="flex justify-between items-center text-xs font-mono text-brand-muted">
          <span className="uppercase tracking-wider">Clearance Sequence</span>
          <span>Agent {currentIndex + 1} of {players.length}</span>
        </div>
        <div className="flex gap-1 h-1.5">
          {players.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                idx < currentIndex 
                  ? 'bg-brand-primary' 
                  : idx === currentIndex 
                    ? 'bg-brand-primary animate-pulse' 
                    : 'bg-brand-surface'
              }`} 
            />
          ))}
        </div>
      </div>

      {/* PRIVACY HANDOFF CURTAIN (Prevents accidental glances) */}
      {isPassing && nextPlayer ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-brand-void/95 rounded-3xl border border-brand-border my-auto animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-muted mb-6 shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-brand-primary mb-1">
            Privacy Lock Engaged
          </span>
          <h2 className="text-2xl font-black text-white mb-3">
            Hand Device to Agent
          </h2>
          <div className="inline-block px-5 py-2.5 rounded-2xl bg-brand-surface border border-brand-border text-lg font-bold text-brand-primary mb-8 tracking-tight">
            {nextPlayer.name}
          </div>
          <p className="text-xs text-brand-muted max-w-[240px] mb-8">
            Do not view the screen until the device is safely in {nextPlayer.name}'s hands.
          </p>
          <Button 
            onClick={handleReadyNextPlayer} 
            fullWidth 
            size="lg" 
            variant="primary"
          >
            I am {nextPlayer.name} — Unlock Dossier
          </Button>
        </div>
      ) : (
        /* PERSPECTIVE CARD CONTAINER */
        <div className="flex-1 flex flex-col justify-center my-auto perspective-1000 py-2">
          <div className={`relative w-full transition-transform duration-500 transform-style-3d ${isRevealed ? 'rotate-y-180' : ''}`}>
            
            {/* FRONT OF CARD: Biometric Authentication Screen */}
            <div className="backface-hidden w-full bg-brand-dossier rounded-3xl border border-brand-border p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden min-h-[460px] justify-between">
              
              {/* Scanline Ambience */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                <div className="w-full h-[2px] bg-brand-primary shadow-[0_0_12px_#FF4438] animate-scan" />
              </div>

              {/* Clearance Header */}
              <div className="pt-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-[10px] font-mono text-brand-muted tracking-wider uppercase mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                  Classified Briefing
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  {currentPlayer.name}
                </h1>
                <p className="text-xs text-brand-muted mt-1">
                  Identity verification required to decrypt mission.
                </p>
              </div>

              {/* Fingerprint Biometric Scanner */}
              <div className="my-auto py-6 flex flex-col items-center">
                <button
                  type="button"
                  onPointerDown={startHold}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  className="relative w-28 h-28 rounded-full bg-brand-surface border-2 border-brand-border hover:border-brand-primary/50 flex items-center justify-center shadow-inner transition-transform active:scale-95 group focus:outline-none"
                >
                  {/* Progress Ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="#1E222B"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="#FF4438"
                      strokeWidth="6"
                      strokeDasharray="276"
                      strokeDashoffset={276 - (276 * holdProgress) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-75"
                    />
                  </svg>

                  {/* Fingerprint Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-brand-muted group-hover:text-brand-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                    <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                    <path d="M2 12a10 10 0 0 1 18-6"/>
                    <path d="M2 16h.01"/>
                    <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                    <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/>
                    <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                    <path d="M9 12v-1a3 3 0 0 1 6 0v1.5"/>
                  </svg>
                </button>

                <p className="text-xs font-mono text-brand-muted mt-4 uppercase tracking-wider">
                  {holdProgress > 0 ? `Decrypting (${Math.round(holdProgress)}%)...` : 'Press & Hold to Decrypt'}
                </p>
              </div>

              {/* Instant Reveal Fallback (For accessibility / desktop clicks) */}
              <button
                type="button"
                onClick={revealDossier}
                className="text-[11px] font-mono text-brand-muted underline hover:text-brand-text mb-1"
              >
                Or tap here to reveal directly
              </button>
            </div>

            {/* BACK OF CARD: Classified Dossier Revealed */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 w-full h-full bg-brand-dossier rounded-3xl border border-brand-border p-6 shadow-2xl flex flex-col justify-between text-center overflow-hidden">
              
              {/* CREW MEMBER DOSSIER */}
              {!currentPlayer.isImposter && currentPlayer.extraRole !== 'JESTER' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Classified Clearance: Loyal Agent
                    </div>
                    <CivilianIcon className="w-16 h-16 mx-auto mb-2" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-brand-muted">
                      Target Category: <strong className="text-white">{gameData.category}</strong>
                    </h3>
                  </div>

                  {/* Secret Word Stamp */}
                  <div className="p-4 rounded-2xl bg-brand-surface border border-brand-border shadow-inner my-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-brand-muted block mb-1">
                      The Secret Word
                    </span>
                    <h2 className="text-3xl font-black text-white tracking-tight">
                      {gameData.word}
                    </h2>
                  </div>

                  <p className="text-xs text-brand-muted leading-relaxed px-2">
                    Blend in, formulate subtle interrogation questions, and deduce which player is bluffing without the word.
                  </p>
                </div>
              )}

              {/* IMPOSTER DOSSIER */}
              {currentPlayer.isImposter && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-[10px] font-mono text-brand-primary uppercase tracking-widest mb-3 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                      Alert: You Are The Infiltrator
                    </div>
                    <ImposterIcon className="w-16 h-16 mx-auto mb-2" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-brand-muted">
                      Category Intel: <strong className="text-white">{gameData.category}</strong>
                    </h3>
                  </div>

                  {/* Redacted Secret Word Box */}
                  <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 shadow-inner my-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-brand-primary block mb-1">
                      Secret Word
                    </span>
                    <h2 className="text-2xl font-mono font-black text-brand-primary tracking-widest uppercase">
                      [CLASSIFIED / REDACTED]
                    </h2>
                  </div>

                  {/* Teammates Intel */}
                  {settings.imposterTeaming && otherImposters.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs mb-2">
                      <span className="text-[10px] font-mono uppercase text-brand-muted block">Co-Infiltrator(s):</span>
                      <strong className="text-brand-primary font-mono">{otherImposters.map(p => p.name).join(', ')}</strong>
                    </div>
                  )}

                  <p className="text-xs text-brand-muted leading-relaxed px-2">
                    You do NOT have the word! Bluff your answers, blend into the discussion, and frame innocent agents.
                  </p>
                </div>
              )}

              {/* JESTER DOSSIER */}
              {currentPlayer.extraRole === 'JESTER' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Wildcard: The Jester
                    </div>
                    <JesterIcon className="w-16 h-16 mx-auto mb-2" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-brand-muted">
                      Category Intel: <strong className="text-white">{gameData.category}</strong>
                    </h3>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-inner my-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block mb-1">
                      Primary Directive
                    </span>
                    <h2 className="text-xl font-black text-amber-400 tracking-tight">
                      Get Yourself Ejected
                    </h2>
                  </div>

                  <p className="text-xs text-brand-muted leading-relaxed px-2">
                    If the group votes you out during interrogation, you immediately win the game! Act suspicious without giving away your trick.
                  </p>
                </div>
              )}

              {/* Confirm & Pass Button */}
              <div className="pt-4 mt-auto border-t border-brand-border/60">
                <Button 
                  onClick={handleNext} 
                  fullWidth 
                  size="md" 
                  variant="primary"
                >
                  {currentIndex < players.length - 1 ? 'Lock & Pass to Next Agent' : 'All Clear — Begin Interrogation'}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
