
import React, { useState } from 'react';
import { Player, GameData, GameSettings } from '../types';
import { Button } from './ui/Button';
import { ImposterIcon, CivilianIcon } from './ui/AnimatedIcons';

interface RevealPhaseProps {
  players: Player[];
  gameData: GameData;
  settings: GameSettings;
  onComplete: () => void;
}

export const RevealPhase: React.FC<RevealPhaseProps> = ({ players, gameData, settings, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  
  // State to hide the name while passing the device
  const [isPassing, setIsPassing] = useState(false);

  const currentPlayer = players[currentIndex];

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleNext = () => {
    // 1. Start flipping back to front
    setIsRevealed(false);
    
    // 2. Immediately set Passing state to hide the current name on the front card
    setIsPassing(true);

    // 3. Wait for flip transition to finish before swapping data
    setTimeout(() => {
        if (currentIndex < players.length - 1) {
            setCurrentIndex(prev => prev + 1);
            // Note: We keep isPassing true for a moment or let the user click?
            // Current design: The front card shows "Access File" for the new player.
            setIsPassing(false); 
        } else {
            onComplete();
        }
    }, 600); // Matches transition duration
  };

  // Logic for Imposter Teaming
  const otherImposters = players.filter(p => p.isImposter && p.id !== currentPlayer.id);

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-6 animate-fade-in justify-center relative">
      
      {/* Progress Bar */}
      <div className="absolute top-6 left-6 right-6 flex gap-1 z-10">
        {players.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              idx < currentIndex ? 'bg-slate-600' : 
              idx === currentIndex ? 'bg-brand-primary animate-pulse' : 'bg-slate-800'
            }`} 
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full perspective-1000">
        
        {/* Card Container with Flip Logic - Dynamic Height */}
        <div className={`relative w-full max-w-md transition-transform duration-700 transform-style-3d ${isRevealed ? 'rotate-y-180' : ''}`}>
            
            {/* Front of Card (Pass to Player) */}
            <div className="backface-hidden bg-brand-card rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center justify-center p-8 relative min-h-[500px]">
                
                {/* Decor - Scanning lines */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                    <div className="absolute top-0 w-full h-[2px] bg-brand-primary shadow-[0_0_10px_#8b5cf6] animate-[scan_3s_ease-in-out_infinite]"></div>
                </div>

                {/* Mystery Lock Icon */}
                <div className="w-28 h-28 rounded-full bg-slate-900/80 border-2 border-dashed border-slate-600 flex items-center justify-center mb-8 relative group shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    {/* Rotating Ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-primary/50 border-r-brand-primary/50 animate-[spin_4s_linear_infinite]"></div>
                    <div className="relative z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                </div>

                <h2 className="text-xs font-bold text-brand-primary uppercase tracking-[0.3em] mb-2 select-none pointer-events-none">
                    {isPassing ? 'SECURE LINK' : 'Classified'}
                </h2>
                <h1 className="text-3xl font-black text-white mb-4 text-center min-h-[2.5rem] select-none pointer-events-none">
                    {isPassing ? 'SECURING DATA...' : currentPlayer.name}
                </h1>
                <p className="text-slate-500 text-center text-sm mb-10 px-4 select-none pointer-events-none">
                    {isPassing ? 'Please wait while file encrypts.' : 'Identity verification required. Hand device to agent.'}
                </p>
                
                <Button onClick={handleReveal} fullWidth disabled={isPassing} className="mt-auto border border-brand-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                    <div className="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span>Access File</span>
                    </div>
                </Button>
            </div>

            {/* Back of Card (Role Reveal) */}
            <div className="absolute top-0 left-0 right-0 backface-hidden rotate-y-180 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl flex flex-col p-6 min-h-[500px]">
                
                <div className="flex-1 flex flex-col items-center justify-start w-full relative z-10 py-4">
                    
                    <div className="mb-6 scale-110">
                        {currentPlayer.isImposter ? <ImposterIcon /> : <CivilianIcon />}
                    </div>

                    <h3 className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mb-2 select-none pointer-events-none">
                        Role Info
                    </h3>
                    
                    {/* Reduced Font Size Here */}
                    <h2 className={`text-xl font-black mb-6 tracking-wide select-none pointer-events-none ${currentPlayer.isImposter ? 'text-rose-600' : currentPlayer.extraRole === 'JESTER' ? 'text-yellow-400' : 'text-blue-400'}`}>
                        {currentPlayer.isImposter ? 'IMPOSTER' : currentPlayer.extraRole === 'JESTER' ? 'NEUTRAL' : 'AGENT'}
                    </h2>

                    {/* Extra Role Badge */}
                    {currentPlayer.extraRole === 'JESTER' && (
                      <div className="mb-4 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                        <div className="flex items-center gap-2 justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5 2 8 8 0 0 0-5-2H2Z"/><path d="M6 11c1.5 0 3 .5 3 2-2 0-3 0-3-2Z"/><path d="M18 11c-1.5 0-3 .5-3 2 2 0 3 0 3-2Z"/></svg>
                          <span className="text-yellow-500 font-black text-sm uppercase tracking-wider">JESTER</span>
                        </div>
                      </div>
                    )}

                    <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10 text-center backdrop-blur-sm">
                        {currentPlayer.isImposter ? (
                        <div className="space-y-2">
                            <p className="text-rose-400 text-sm font-bold uppercase tracking-wide select-none">Mission: Sabotage</p>
                            
                            {/* Imposter Teaming Display */}
                            {settings.imposterTeaming && otherImposters.length > 0 && (
                                <div className="bg-rose-900/30 p-2 rounded border border-rose-500/30 mt-2">
                                    <p className="text-[8px] text-rose-300 uppercase tracking-widest mb-1 select-none">Allies Detected</p>
                                    <p className="text-rose-100 font-bold text-sm select-none">
                                        {otherImposters.map(p => p.name).join(', ')}
                                    </p>
                                </div>
                            )}

                            <div className="h-px w-full bg-white/10 my-2"></div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest select-none">Topic Reference</p>
                            <p className="text-white font-bold text-base select-none">{gameData.category}</p>
                        </div>
                        ) : currentPlayer.extraRole === 'JESTER' ? (
                        <div className="space-y-2">
                            <p className="text-yellow-400 text-sm font-bold uppercase tracking-wide select-none">Mission: Get Eliminated</p>
                            <div className="h-px w-full bg-white/10 my-2"></div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest select-none">Win Condition</p>
                            <p className="text-yellow-300 font-bold text-sm select-none">You win if you get voted out!</p>
                            <p className="text-xs text-slate-400 mt-2 select-none italic">You don't know the secret word.</p>
                        </div>
                        ) : (
                        <div className="space-y-2">
                            <p className="text-[10px] text-blue-300/70 uppercase tracking-widest select-none">Secret Keyword</p>
                            <p className="text-3xl font-black text-white break-words tracking-tight select-none">{gameData.word}</p>
                        </div>
                        )}
                    </div>
                </div>

                <Button 
                    onClick={handleNext} 
                    fullWidth 
                    variant="ghost"
                    className="mt-4 border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-600 transition-all flex-shrink-0"
                >
                    {currentIndex < players.length - 1 ? 'Close & Pass Device' : 'Burn File & Start'}
                </Button>
            </div>

        </div>

      </div>
    </div>
  );
};
