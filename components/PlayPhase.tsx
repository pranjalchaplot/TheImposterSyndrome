import React, { useState, useEffect } from 'react';
import { Player, GameData, GameSettings, ExtraRole } from '../types';
import { Button } from './ui/Button';
import { ImposterIcon, CivilianIcon, JesterIcon } from './ui/AnimatedIcons';
import { haptics } from '../services/haptics';

interface PlayPhaseProps {
  players: Player[];
  gameData: GameData;
  settings: GameSettings;
  onEject: (playerId: string) => void;
}

export const PlayPhase: React.FC<PlayPhaseProps> = ({ 
  players, 
  gameData, 
  settings, 
  onEject 
}) => {
  const [timeLeft, setTimeLeft] = useState(settings.timerDuration); 
  const [timerActive, setTimerActive] = useState(settings.timerDuration > 0);
  const [votingMode, setVotingMode] = useState(false);
  
  // Tagging players as suspects during verbal debate
  const [markedSuspects, setMarkedSuspects] = useState<string[]>([]);
  
  // Voting & Ejection State
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [revealPopupData, setRevealPopupData] = useState<{
    name: string;
    isImposter: boolean;
    extraRole: ExtraRole;
  } | null>(null);

  // Timer Tick Interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (settings.timerDuration > 0 && timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 10 && prev > 0) {
            haptics.tick(); // Haptic pulse during final countdown
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, settings.timerDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayerTap = (player: Player) => {
    if (player.isDead) return;
    
    if (votingMode) {
      haptics.tap();
      setSelectedPlayerId(player.id);
    } else {
      // Toggle suspicion marker
      haptics.tick();
      setMarkedSuspects(prev => 
        prev.includes(player.id) 
          ? prev.filter(id => id !== player.id) 
          : [...prev, player.id]
      );
    }
  };

  const confirmEjection = () => {
    if (!selectedPlayerId) return;
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player) return;

    haptics.alarm();
    setRevealPopupData({
      name: player.name,
      isImposter: player.isImposter,
      extraRole: player.extraRole
    });
    setSelectedPlayerId(null);
  };

  const closeRevealAndProceed = () => {
    if (revealPopupData) {
      const p = players.find(p => p.name === revealPopupData.name && !p.isDead);
      setRevealPopupData(null);
      setVotingMode(false);
      if (p) onEject(p.id);
    }
  };

  const activePlayers = players.filter(p => !p.isDead);
  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <div className="flex flex-col h-full max-w-md mx-auto px-4 py-6 justify-between select-none relative animate-fade-in overflow-hidden">
      
      {/* CONFIRM EJECTION ACTION SHEET */}
      {selectedPlayerId && selectedPlayer && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedPlayerId(null)}
        >
          <div 
            className="w-full max-w-sm bg-brand-dossier border border-brand-primary/50 rounded-3xl p-6 shadow-2xl animate-slide-up text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 border-2 border-brand-primary flex items-center justify-center mx-auto mb-4 text-brand-primary animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-primary block mb-1">
              Emergency Ejection Protocol
            </span>
            <h3 className="text-xl font-black text-white mb-2">
              Eliminate Agent {selectedPlayer.name}?
            </h3>
            <p className="text-xs text-brand-muted mb-6 leading-relaxed">
              This action cannot be undone. If this operative is the Jester, they win immediately!
            </p>

            <div className="flex gap-2.5">
              <Button 
                onClick={() => setSelectedPlayerId(null)} 
                variant="secondary" 
                fullWidth 
                size="md"
              >
                Abort
              </Button>
              <Button 
                onClick={confirmEjection} 
                variant="danger" 
                fullWidth 
                size="md"
              >
                Confirm Ejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VERDICT REVEAL MODAL */}
      {revealPopupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in text-center">
          <div className="w-full max-w-sm bg-brand-dossier border border-brand-border rounded-3xl p-6 shadow-2xl animate-slide-up">
            
            {/* Identity Revealed Graphic */}
            <div className="mb-4">
              {revealPopupData.extraRole === 'JESTER' && settings.revealRoleOnDeath ? (
                <JesterIcon className="w-20 h-20 mx-auto mb-2" />
              ) : revealPopupData.isImposter && settings.revealRoleOnDeath ? (
                <ImposterIcon className="w-20 h-20 mx-auto mb-2" />
              ) : (
                <CivilianIcon className="w-20 h-20 mx-auto mb-2" />
              )}
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-muted block mb-1">
              Field Ejection Outcome
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              {revealPopupData.name}
            </h2>

            {settings.revealRoleOnDeath ? (
              <div className="p-3.5 rounded-2xl bg-brand-surface border border-brand-border my-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block mb-0.5">
                  True Identity Confirmed
                </span>
                <p className={`text-lg font-black tracking-wide uppercase ${
                  revealPopupData.extraRole === 'JESTER' 
                    ? 'text-brand-warning' 
                    : revealPopupData.isImposter 
                      ? 'text-brand-primary' 
                      : 'text-brand-success'
                }`}>
                  {revealPopupData.extraRole === 'JESTER' 
                    ? '★ The Jester (Wildcard)' 
                    : revealPopupData.isImposter 
                      ? '⚠ Infiltrator (Imposter)' 
                      : '✓ Loyal Agent (Crew)'}
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-brand-surface border border-brand-border my-4">
                <p className="text-sm font-bold text-brand-muted">
                  Role identity remains classified under mission rules.
                </p>
              </div>
            )}

            <Button onClick={closeRevealAndProceed} fullWidth size="lg" variant="primary">
              Continue Mission
            </Button>
          </div>
        </div>
      )}

      {/* TOP MISSION HUD: Category & Countdown Timer */}
      <header className="space-y-3 pb-3 border-b border-brand-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand-muted">
              Active Interrogation
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-[11px] font-mono text-brand-text">
            Category: <strong className="text-white">{gameData.category}</strong>
          </span>
        </div>

        {/* Big Countdown Timer HUD */}
        {settings.timerDuration > 0 && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-dossier border border-brand-border">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block">
                Time Remaining
              </span>
              <span className={`text-2xl font-mono font-black tracking-tight ${
                timeLeft <= 30 ? 'text-brand-primary animate-pulse' : 'text-white'
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  haptics.tick();
                  setTimerActive(!timerActive);
                }}
                className="px-3 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono font-bold text-brand-text hover:text-white transition-all active:scale-95"
              >
                {timerActive ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* SUSPECT SURVEILLANCE BOARD */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 my-3 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-muted">
            Suspect Surveillance ({activePlayers.length} Active)
          </span>
          <span className="text-[11px] text-brand-muted">
            {votingMode ? 'Tap agent to eject' : 'Tap to mark suspect'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {players.map((player) => {
            const isMarked = markedSuspects.includes(player.id);
            return (
              <button
                key={player.id}
                type="button"
                disabled={player.isDead}
                onClick={() => handlePlayerTap(player)}
                className={`relative p-3.5 rounded-2xl text-left border transition-all active:scale-[0.98] ${
                  player.isDead
                    ? 'bg-brand-void/50 border-brand-border/30 opacity-40 cursor-not-allowed'
                    : votingMode
                      ? 'bg-brand-primary/10 border-brand-primary hover:bg-brand-primary/20 ring-1 ring-brand-primary/50'
                      : isMarked
                        ? 'bg-brand-surface border-brand-warning ring-1 ring-brand-warning/40 shadow-sm'
                        : 'bg-brand-dossier border-brand-border hover:border-brand-borderLight hover:bg-brand-surface/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center font-mono font-bold text-xs text-white">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  {player.isDead ? (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-brand-border text-brand-muted line-through">
                      Ejected
                    </span>
                  ) : isMarked ? (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-brand-warning/15 text-brand-warning border border-brand-warning/30">
                      Suspect
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>

                <h4 className={`text-sm font-bold tracking-tight truncate ${
                  player.isDead ? 'line-through text-brand-muted' : 'text-white'
                }`}>
                  {player.name}
                </h4>

                <p className="text-[10px] font-mono text-brand-muted mt-0.5">
                  {player.isDead ? 'Off the board' : isMarked ? 'Under interrogation' : 'Active operative'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM ACTION DOCK: EMERGENCY VOTING TRIGGER */}
      <footer className="pt-3 border-t border-brand-border/60">
        {votingMode ? (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                haptics.tick();
                setVotingMode(false);
              }}
              variant="secondary"
              fullWidth
              size="lg"
            >
              Cancel Voting
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => {
              haptics.alarm();
              setVotingMode(true);
            }}
            variant="danger"
            fullWidth
            size="lg"
            className="shadow-xl"
          >
            <div className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Call Emergency Vote / Accuse</span>
            </div>
          </Button>
        )}
      </footer>
    </div>
  );
};
