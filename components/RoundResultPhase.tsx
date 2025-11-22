import React from 'react';
import { Player, GameSettings } from '../types';
import { Button } from './ui/Button';

interface RoundResultPhaseProps {
  eliminatedPlayerId: string | null;
  players: Player[];
  settings: GameSettings;
  onContinue: () => void;
}

export const RoundResultPhase: React.FC<RoundResultPhaseProps> = ({ 
  eliminatedPlayerId, 
  players, 
  settings, 
  onContinue 
}) => {
  
  if (!eliminatedPlayerId) {
    return (
      <div className="flex flex-col h-full max-w-md mx-auto p-6 items-center justify-center animate-fade-in text-center">
        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
           <svg className="text-slate-500 w-12 h-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">No One Ejected</h2>
        <p className="text-slate-400 mb-8">The team decided to skip voting this round.</p>
        <Button onClick={onContinue} fullWidth variant="primary">Continue Mission</Button>
      </div>
    );
  }

  const eliminatedPlayer = players.find(p => p.id === eliminatedPlayerId);
  if (!eliminatedPlayer) return null;

  const isImposter = eliminatedPlayer.isImposter;

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-6 items-center justify-center animate-fade-in text-center">
      
      {/* Avatar Large */}
      <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-2xl border-4 ${isImposter && settings.revealRoleOnDeath ? 'bg-brand-danger border-rose-400' : 'bg-slate-700 border-slate-600'}`}>
         <span className="text-5xl font-bold text-white">{eliminatedPlayer.name.charAt(0)}</span>
      </div>

      <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">
        {eliminatedPlayer.name}
      </h2>
      <p className="text-lg text-rose-500 font-bold mb-8">was ejected.</p>

      {settings.revealRoleOnDeath ? (
        <>
            <div className={`w-full p-6 rounded-2xl border mb-10 animate-slide-up ${isImposter ? 'bg-rose-900/20 border-brand-danger' : 'bg-brand-primary/10 border-brand-primary'}`}>
            <p className="text-xs uppercase font-bold tracking-widest mb-2 opacity-70">Identity Confirmed</p>
            <p className={`text-3xl font-black ${isImposter ? 'text-brand-danger' : 'text-brand-primary'}`}>
                {isImposter ? 'THE IMPOSTER' : 'INNOCENT'}
            </p>
            </div>

            <div className="flex justify-center gap-8 text-sm font-mono text-slate-500 mb-4">
                <div className="flex flex-col items-center">
                    <span className="text-white font-bold text-lg">{players.filter(p => !p.isDead && p.isImposter).length}</span>
                    <span>IMPOSTERS</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-white font-bold text-lg">{players.filter(p => !p.isDead && !p.isImposter).length}</span>
                    <span>AGENTS</span>
                </div>
            </div>
        </>
      ) : (
        <div className="w-full p-6 rounded-2xl border border-slate-700 bg-brand-surface mb-10">
           <p className="text-slate-400 italic">Identity remains unknown...</p>
           <p className="text-xs text-slate-600 mt-2">Game continues.</p>
        </div>
      )}

      <div className="w-full space-y-4 mt-4">
         <Button onClick={onContinue} fullWidth className="py-4 text-lg">
           Proceed to Next Round
         </Button>
      </div>
    </div>
  );
};