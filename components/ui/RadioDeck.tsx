import React, { useState, useEffect } from 'react';
import { haptics } from '../../services/haptics';

interface RadioDeckProps {
  isMuted: boolean;
  onToggleMute: () => void;
  currentTrackName: string;
  onNextTrack: () => void;
  onPrevTrack: () => void;
}

export const RadioDeck: React.FC<RadioDeckProps> = ({
  isMuted,
  onToggleMute,
  currentTrackName,
  onNextTrack,
  onPrevTrack,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = document.getElementById('bgm-player-element') as HTMLAudioElement;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = document.getElementById('bgm-player-element') as HTMLAudioElement;
    if (audio) {
      const newTime = parseFloat(e.target.value);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const cleanName = (name: string) => {
    if (!name) return 'Surveillance Wire';
    return name
      .replace(/_/g, ' ')
      .replace(/udaipur/gi, 'Syndicate')
      .replace(/bgm/gi, 'Audio')
      .trim();
  };

  return (
    <>
      {/* Persistent Mini Capsule */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            haptics.tick();
            setIsExpanded(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-dossier/90 border border-brand-border hover:border-brand-borderLight text-xs transition-all active:scale-[0.98] shadow-sm backdrop-blur-md"
          title="Espionage Radio Surveillance"
        >
          {/* Animated Equalizer Waves */}
          <div className="flex items-end gap-0.5 h-3.5 w-3.5">
            <span className={`w-0.5 rounded-full bg-brand-primary ${!isMuted ? 'animate-[musicWave_0.8s_ease-in-out_infinite]' : 'h-1.5 opacity-40'}`} style={{ height: !isMuted ? undefined : '4px' }} />
            <span className={`w-0.5 rounded-full bg-brand-primary ${!isMuted ? 'animate-[musicWave_1.2s_ease-in-out_infinite_0.2s]' : 'h-2.5 opacity-40'}`} style={{ height: !isMuted ? undefined : '8px' }} />
            <span className={`w-0.5 rounded-full bg-brand-primary ${!isMuted ? 'animate-[musicWave_0.9s_ease-in-out_infinite_0.4s]' : 'h-1 opacity-40'}`} style={{ height: !isMuted ? undefined : '3px' }} />
          </div>

          <span className="font-mono text-[11px] text-brand-muted max-w-[120px] truncate uppercase tracking-wider">
            {isMuted ? 'Radio Muted' : cleanName(currentTrackName)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.tap();
            onToggleMute();
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-[0.92] ${
            isMuted 
              ? 'bg-brand-surface border-brand-border text-brand-muted hover:text-brand-text' 
              : 'bg-brand-primary/15 border-brand-primary/40 text-brand-primary hover:bg-brand-primary/25'
          }`}
          title={isMuted ? "Unmute Audio" : "Mute Audio"}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="22" y1="9" x2="16" y2="15" />
              <line x1="16" y1="9" x2="22" y2="15" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      </div>

      {/* Expanded Radio Console Modal / Bottom Sheet */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsExpanded(false)}
        >
          <div 
            className="w-full max-w-sm bg-brand-dossier border border-brand-border rounded-3xl p-6 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-brand-muted">
                  Tactical Surveillance Radio
                </span>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="w-8 h-8 rounded-full bg-brand-surface text-brand-muted hover:text-white flex items-center justify-center border border-brand-border"
              >
                ✕
              </button>
            </div>

            <div className="text-center my-4">
              <h4 className="text-base font-bold text-white tracking-tight truncate">
                {cleanName(currentTrackName)}
              </h4>
              <p className="text-xs font-mono text-brand-muted mt-1 uppercase tracking-wider">
                Intercept Stream #09
              </p>
            </div>

            {/* Scrubber */}
            <div className="space-y-1 mb-5">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-brand-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
              <div className="flex justify-between text-[11px] font-mono text-brand-muted">
                <span>{formatSeconds(currentTime)}</span>
                <span>{formatSeconds(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  haptics.tick();
                  onPrevTrack();
                }}
                className="w-11 h-11 rounded-2xl bg-brand-surface border border-brand-border hover:border-brand-borderLight text-brand-text flex items-center justify-center active:scale-95 transition-all"
                title="Previous Track"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="19 20 9 12 19 4 19 20" />
                  <line x1="5" y1="19" x2="5" y2="5" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptics.impact();
                  onToggleMute();
                }}
                className="w-14 h-14 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/25 active:scale-95 transition-all"
                title={isMuted ? "Resume Transmission" : "Mute Transmission"}
              >
                {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  haptics.tick();
                  onNextTrack();
                }}
                className="w-11 h-11 rounded-2xl bg-brand-surface border border-brand-border hover:border-brand-borderLight text-brand-text flex items-center justify-center active:scale-95 transition-all"
                title="Next Track"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4" />
                  <line x1="19" y1="5" x2="19" y2="19" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
