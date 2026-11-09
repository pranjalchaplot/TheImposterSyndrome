import React, { useEffect, useState } from 'react';
import { Player, GameData } from '../types';
import { Button } from './ui/Button';
import { ImposterIcon, CivilianIcon, JesterIcon } from './ui/AnimatedIcons';
import { haptics } from '../services/haptics';

declare global {
  interface Window {
    confetti: any;
    html2canvas: any;
  }
}

interface GameOverPhaseProps {
  players: Player[];
  gameData: GameData;
  winner: 'CREW' | 'IMPOSTER' | 'JESTER';
  onReset: () => void;
}

export const GameOverPhase: React.FC<GameOverPhaseProps> = ({ 
  players, 
  gameData, 
  winner, 
  onReset 
}) => {
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    haptics.reveal();
    if (window.confetti) {
      const colors = winner === 'CREW' 
        ? ['#10B981', '#34D399', '#059669'] 
        : winner === 'JESTER' 
          ? ['#F59E0B', '#FBBF24', '#D97706'] 
          : ['#FF4438', '#EF4444', '#DC2626'];
      
      window.confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: colors,
        disableForReducedMotion: true
      });
    }
  }, [winner]);

  // Sort players: Winners first, then others.
  const sortedPlayers = [...players].sort((a, b) => {
    if (winner === 'JESTER') {
      if (a.extraRole === 'JESTER' && b.extraRole !== 'JESTER') return -1;
      if (a.extraRole !== 'JESTER' && b.extraRole === 'JESTER') return 1;
    } else if (winner === 'CREW') {
      if (!a.isImposter && b.isImposter) return -1;
      if (a.isImposter && !b.isImposter) return 1;
    } else {
      if (a.isImposter && !b.isImposter) return -1;
      if (!a.isImposter && b.isImposter) return 1;
    }
    return 0;
  });

  const handleShare = async () => {
    if (!window.html2canvas) return;
    
    haptics.tap();
    setIsSharing(true);
    const element = document.getElementById('mission-report');
    
    if (element) {
      try {
        const canvas = await window.html2canvas(element, {
          backgroundColor: '#0B0C0E',
          scale: 2,
        });
        
        canvas.toBlob(async (blob: Blob | null) => {
          if (!blob) return;
          
          const file = new File([blob], 'classified-mission-report.png', { type: 'image/png' });
          
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Imposter Syndrome Debrief',
              text: `Mission Outcome: ${winner === 'CREW' ? 'Loyal Agents Won' : winner === 'JESTER' ? 'Jester Won' : 'Infiltrators Won'}!`
            });
          } else {
            const link = document.createElement('a');
            link.download = 'classified-mission-report.png';
            link.href = canvas.toDataURL();
            link.click();
          }
        });
      } catch (err) {
        console.error("Share export failed", err);
      } finally {
        setIsSharing(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto px-4 py-6 justify-between select-none relative animate-fade-in overflow-hidden">
      
      {/* Scrollable Report Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 my-auto">
        <div 
          id="mission-report" 
          className="bg-brand-dossier border border-brand-border rounded-3xl p-6 shadow-2xl text-center space-y-5"
        >
          {/* Header Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-[10px] font-mono uppercase tracking-widest text-brand-muted">
            <span className={`w-1.5 h-1.5 rounded-full ${
              winner === 'CREW' ? 'bg-emerald-400' : winner === 'JESTER' ? 'bg-amber-400' : 'bg-brand-primary'
            }`} />
            After-Action Debrief #007
          </div>

          {/* Victor Icon & Title */}
          <div>
            <div className="my-2">
              {winner === 'CREW' ? (
                <CivilianIcon className="w-20 h-20 mx-auto" />
              ) : winner === 'JESTER' ? (
                <JesterIcon className="w-20 h-20 mx-auto" />
              ) : (
                <ImposterIcon className="w-20 h-20 mx-auto" />
              )}
            </div>

            <h1 className={`text-3xl font-black uppercase tracking-tight mt-3 ${
              winner === 'CREW' 
                ? 'text-emerald-400' 
                : winner === 'JESTER' 
                  ? 'text-brand-warning' 
                  : 'text-brand-primary'
            }`}>
              {winner === 'CREW' ? 'Agents Prevail' : winner === 'JESTER' ? 'Jester Ascendant' : 'Syndicate Wins'}
            </h1>
            <p className="text-xs text-brand-muted mt-1">
              {winner === 'CREW' 
                ? 'All infiltrators were successfully unmasked and eliminated.' 
                : winner === 'JESTER' 
                  ? 'The Jester tricked the squad into an erroneous execution!' 
                  : 'The infiltrators remained hidden and compromised the mission.'}
            </p>
          </div>

          {/* Secret Word Reveal Box */}
          <div className="p-4 rounded-2xl bg-brand-surface border border-brand-border shadow-inner">
            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-muted block mb-1">
              Mission Objective Revealed
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-mono text-brand-muted">Category:</span>
              <span className="text-xs font-bold text-brand-text">{gameData.category}</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-1">
              "{gameData.word}"
            </h2>
          </div>

          {/* Operatives Unmasked Roster */}
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block px-1">
              Operatives Dossier Breakdown
            </span>

            <div className="grid grid-cols-2 gap-2">
              {sortedPlayers.map((p) => {
                const isWinner = 
                  (winner === 'CREW' && !p.isImposter && p.extraRole !== 'JESTER') ||
                  (winner === 'IMPOSTER' && p.isImposter) ||
                  (winner === 'JESTER' && p.extraRole === 'JESTER');

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      p.isDead
                        ? 'bg-brand-void/60 border-brand-border/40 opacity-50'
                        : isWinner
                          ? 'bg-brand-surface border-brand-borderLight ring-1 ring-white/10'
                          : 'bg-brand-dossier border-brand-border opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold truncate ${
                        p.isDead ? 'line-through text-brand-muted' : 'text-white'
                      }`}>
                        {p.name}
                      </span>
                      {isWinner && (
                        <span className="text-[10px] text-brand-warning font-mono font-bold">★</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.extraRole === 'JESTER' ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Jester
                        </span>
                      ) : p.isImposter ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-brand-primary/10 text-brand-primary border border-brand-primary/30">
                          Imposter
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Agent
                        </span>
                      )}

                      {p.isDead && (
                        <span className="text-[9px] font-mono text-brand-muted">
                          (Ejected)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <footer className="pt-4 border-t border-brand-border/60 flex gap-2.5">
        <Button 
          onClick={handleShare} 
          variant="secondary"
          disabled={isSharing}
          size="lg"
          className="flex-1"
        >
          {isSharing ? (
            <div className="animate-spin h-4 w-4 border-2 border-brand-text rounded-full border-t-transparent" />
          ) : (
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span>Export</span>
            </div>
          )}
        </Button>

        <Button 
          onClick={() => {
            haptics.impact();
            onReset();
          }} 
          variant="primary"
          size="lg"
          className="flex-[2] shadow-xl"
        >
          <span>Deploy Next Mission</span>
        </Button>
      </footer>
    </div>
  );
};
