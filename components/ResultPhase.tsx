
import React, { useEffect, useState } from 'react';
import { Player, GameData } from '../types';
import { Button } from './ui/Button';

declare global {
  interface Window {
    confetti: any;
    html2canvas: any;
  }
}

interface GameOverPhaseProps {
  players: Player[];
  gameData: GameData;
  winner: 'CREW' | 'IMPOSTER';
  onReset: () => void;
}

export const GameOverPhase: React.FC<GameOverPhaseProps> = ({ players, gameData, winner, onReset }) => {
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (window.confetti) {
      const colors = winner === 'CREW' ? ['#8b5cf6', '#06b6d4'] : ['#ef4444', '#ec4899'];
      window.confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: colors,
          disableForReducedMotion: true
      });
    }
  }, [winner]);

  // Sort players: Winners first, then others.
  const sortedPlayers = [...players].sort((a, b) => {
    // If crew won, crew comes first
    if (winner === 'CREW') {
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
    
    setIsSharing(true);
    const element = document.getElementById('mission-report');
    
    if (element) {
      try {
        const canvas = await window.html2canvas(element, {
          backgroundColor: '#09090b', // Ensure dark background
          scale: 2, // High res
        });
        
        canvas.toBlob(async (blob: Blob | null) => {
           if (!blob) return;
           
           const file = new File([blob], 'mission-report.png', { type: 'image/png' });
           
           if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                 files: [file],
                 title: 'Imposter Protocol Report',
                 text: `Mission Outcome: ${winner === 'CREW' ? 'Agents Won' : 'Imposters Won'}!`
              });
           } else {
              // Fallback to download
              const link = document.createElement('a');
              link.download = 'mission-report.png';
              link.href = canvas.toDataURL();
              link.click();
           }
        });
      } catch (err) {
        console.error("Share failed", err);
      } finally {
        setIsSharing(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto p-6 animate-fade-in text-center overflow-y-auto custom-scrollbar">
      
      {/* Capture Container */}
      <div id="mission-report" className="flex-1 flex flex-col items-center pt-8 bg-brand-dark p-4 rounded-xl">
        
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl ${winner === 'CREW' ? 'bg-brand-primary text-white shadow-brand-primary/40' : 'bg-brand-danger text-white shadow-brand-danger/40'}`}>
          {winner === 'CREW' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20"/><path d="M12 2v17"/><path d="m9 5 6 6"/><path d="m15 5-6 6"/></svg>
          )}
        </div>

        {/* Replaced Gradient Text with Solid Color to fix Screenshot Bug */}
        <h1 className={`text-5xl font-black mb-2 tracking-tighter uppercase ${winner === 'CREW' ? 'text-brand-primary' : 'text-brand-danger'}`}>
          {winner === 'CREW' ? 'Agents Win' : 'Imposters Win'}
        </h1>
        <p className="text-slate-400 mb-8 text-lg">
          {winner === 'CREW' ? 'The facility is secure.' : 'Sabotage complete.'}
        </p>

        {/* Word Reveal */}
        <div className="w-full bg-brand-card rounded-2xl p-4 border border-slate-800 mb-8">
             <p className="text-xs uppercase text-slate-500 font-bold mb-1">The Secret Word Was</p>
             <p className="text-2xl font-black text-white">{gameData.word}</p>
        </div>

        {/* Player Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-8">
            {sortedPlayers.map(p => {
                const isWinner = (winner === 'CREW' && !p.isImposter) || (winner === 'IMPOSTER' && p.isImposter);
                
                return (
                    <div 
                        key={p.id} 
                        className={`relative flex items-center gap-3 p-3 rounded-xl border overflow-hidden ${
                            p.isDead ? 'bg-slate-900/50 border-slate-800 opacity-50 grayscale' : 
                            isWinner ? 'bg-brand-surface border-slate-600' : 
                            'bg-brand-dark border-slate-800 opacity-60'
                        }`}
                    >
                        {/* Generic Natural Avatar */}
                        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 shadow-inner text-slate-200 font-bold text-sm">
                           {p.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex flex-col items-start overflow-hidden">
                            <span className={`text-sm font-bold truncate w-full text-left ${p.isDead ? 'text-slate-500 line-through' : isWinner ? 'text-white' : 'text-slate-400'}`}>{p.name}</span>
                            {/* Role Text instead of Icon */}
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${p.isImposter ? 'text-rose-500' : 'text-blue-500'}`}>
                              {p.isImposter ? 'Imposter' : 'Agent'}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-4">
        <Button 
            onClick={handleShare} 
            variant="secondary"
            disabled={isSharing}
            className="flex-1 flex items-center justify-center gap-2"
        >
            {isSharing ? (
               <div className="animate-spin h-4 w-4 border-2 border-slate-400 rounded-full border-t-transparent"></div>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            )}
            Share
        </Button>
        <Button onClick={onReset} className="flex-[2] text-lg">
            Play Again
        </Button>
      </div>
    </div>
  );
};
