/// <reference types="vite/client" />
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GamePhase, Player, GameData, GameSettings, DEFAULT_SETTINGS } from './types';
import { SetupPhase } from './components/SetupPhase';
import { RevealPhase } from './components/RevealPhase';
import { PlayPhase } from './components/PlayPhase';
import { GameOverPhase } from './components/ResultPhase';
import { generateGameTopic } from './services/geminiService';
import backgroundVideo from './assets/videos/udaipur_b-roll.mp4';

// Dynamically import all audio files from bgm_radio folder using Vite's modern query format
const bgmModules = import.meta.glob('./assets/audios/bgm_radio/*.{wav,mp3,ogg}', { query: '?url', import: 'default', eager: true });
const BGM_TRACKS = Object.values(bgmModules) as string[];

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SETUP);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [winner, setWinner] = useState<'CREW' | 'IMPOSTER' | 'JESTER' | null>(null);

  // Espionage BGM Radio
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try { return localStorage.getItem('bgm_muted') === 'true'; } catch { return false; }
  });
  const [currentTrackName, setCurrentTrackName] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackIndexRef = useRef(0);
  const shuffledTracks = useRef<string[]>([...BGM_TRACKS].sort(() => Math.random() - 0.5));

  // Extract clean track name from JS asset path
  const getTrackName = (src: string) => {
    try {
      let name = src.split('/').pop() || '';
      name = name.split('?')[0];
      name = decodeURIComponent(name);
      return name.replace(/\.\w+$/, '');
    } catch {
      return 'Intercept Stream';
    }
  };

  const playNextTrack = useCallback(() => {
    trackIndexRef.current = (trackIndexRef.current + 1) % shuffledTracks.current.length;
    const audio = audioRef.current;
    const src = shuffledTracks.current[trackIndexRef.current];
    if (audio) {
      audio.src = src;
      audio.play().catch(() => {});
    }
    setCurrentTrackName(getTrackName(src));
  }, []);

  const playPrevTrack = useCallback(() => {
    trackIndexRef.current = (trackIndexRef.current - 1 + shuffledTracks.current.length) % shuffledTracks.current.length;
    const audio = audioRef.current;
    const src = shuffledTracks.current[trackIndexRef.current];
    if (audio) {
      audio.src = src;
      audio.play().catch(() => {});
    }
    setCurrentTrackName(getTrackName(src));
  }, []);

  // Play audio on first user touch / pointerdown
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const firstSrc = shuffledTracks.current[0];
    setCurrentTrackName(getTrackName(firstSrc));

    const startOnInteraction = () => {
      audio.play().catch(() => {});
      window.removeEventListener('pointerdown', startOnInteraction);
    };
    audio.play().catch(() => {
      window.addEventListener('pointerdown', startOnInteraction);
    });
    return () => window.removeEventListener('pointerdown', startOnInteraction);
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio && audio.paused) {
      audio.play().catch(() => {});
    }
    setIsMuted(prev => {
      const next = !prev;
      try { localStorage.setItem('bgm_muted', String(next)); } catch {}
      return next;
    });
  };

  // Initialize and Launch Game
  const startGame = async (names: string[], newSettings: GameSettings) => {
    setSettings(newSettings);
    setPhase(GamePhase.LOADING);

    // Generate Classified Word / Category
    const data = await generateGameTopic(newSettings.targetCategory, newSettings.enableAdultMode);
    setGameData(data);

    // Assign Roles with Fisher-Yates Shuffle
    const indices = Array.from({ length: names.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    const imposterIndices = new Set(indices.slice(0, newSettings.imposterCount));

    // Assign Jester from non-imposters if enabled
    let jesterIndex: number | null = null;
    if (newSettings.extraRoles.jesterEnabled) {
      const nonImposterIndices = indices.filter(idx => !imposterIndices.has(idx));
      if (nonImposterIndices.length > 0) {
        jesterIndex = nonImposterIndices[Math.floor(Math.random() * nonImposterIndices.length)];
      }
    }

    const newPlayers: Player[] = names.map((name, idx) => ({
      id: crypto.randomUUID(),
      name,
      isImposter: imposterIndices.has(idx),
      isDead: false,
      avatarSeed: Math.floor(Math.random() * 1000),
      extraRole: idx === jesterIndex ? 'JESTER' : null
    }));

    setPlayers(newPlayers);
    setPhase(GamePhase.REVEAL);
  };

  // Handle Player Elimination from Play Phase
  const handlePlayerEjection = (ejectedPlayerId: string) => {
    const ejectedPlayer = players.find(p => p.id === ejectedPlayerId);
    
    const updatedPlayers = players.map(p => 
      p.id === ejectedPlayerId ? { ...p, isDead: true } : p
    );
    setPlayers(updatedPlayers);
    
    // Check Jester Win Condition
    if (ejectedPlayer?.extraRole === 'JESTER') {
      setWinner('JESTER');
      setPhase(GamePhase.GAME_OVER);
      return;
    }
    
    // Check Win Conditions
    const activeImposters = updatedPlayers.filter(p => p.isImposter && !p.isDead).length;
    const activeCrew = updatedPlayers.filter(p => !p.isImposter && !p.isDead).length;

    if (activeImposters === 0) {
      setWinner('CREW');
      setPhase(GamePhase.GAME_OVER);
    } else if (activeImposters >= activeCrew) {
      setWinner('IMPOSTER');
      setPhase(GamePhase.GAME_OVER);
    }
  };

  const resetGame = () => {
    setPlayers([]);
    setGameData(null);
    setWinner(null);
    setPhase(GamePhase.SETUP);
  };

  return (
    <div className="h-full w-full bg-brand-void text-brand-text overflow-hidden relative select-none">
      {/* Ambient Surveillance Video Backdrop */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-20 pointer-events-none filter grayscale contrast-125 brightness-75"
        style={{ objectPosition: 'center center' }}
      >
        <source src={backgroundVideo} type="video/mp4" />
      </video>

      {/* Atmospheric Vignette Overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-brand-void via-brand-void/85 to-brand-void/90 pointer-events-none" />

      {/* Hidden BGM Player */}
      <audio
        id="bgm-player-element"
        ref={audioRef}
        src={shuffledTracks.current[0]}
        muted={isMuted}
        onEnded={playNextTrack}
        style={{ display: 'none' }}
      />

      {/* Primary Mobile Container with Safe Area Insets */}
      <div className="relative z-10 w-full h-full overflow-hidden flex flex-col pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        
        {/* Tactical Mission Loading Screen */}
        {phase === GamePhase.LOADING && (
          <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-2 border-brand-border rounded-full" />
              <div className="absolute inset-0 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-3 bg-brand-dossier rounded-full flex items-center justify-center border border-brand-border">
                <span className="text-[10px] font-mono font-bold text-brand-primary animate-pulse">
                  ENC
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-muted block mb-1">
              Neural Cryptographic Core
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">
              Synthesizing Directive
            </h2>
            <p className="text-xs text-brand-muted mt-1.5 max-w-xs font-mono">
              Scrambling frequency channels and generating classified word bank...
            </p>
          </div>
        )}

        {phase === GamePhase.SETUP && (
          <SetupPhase 
            onStartGame={startGame} 
            isMuted={isMuted} 
            onToggleMute={toggleMute} 
            currentTrackName={currentTrackName} 
            onNextTrack={playNextTrack}
            onPrevTrack={playPrevTrack}
          />
        )}
        
        {phase === GamePhase.REVEAL && gameData && (
          <RevealPhase 
            players={players} 
            gameData={gameData} 
            settings={settings}
            onComplete={() => setPhase(GamePhase.PLAY)} 
          />
        )}

        {phase === GamePhase.PLAY && gameData && (
          <PlayPhase 
            players={players} 
            gameData={gameData} 
            settings={settings}
            onEject={handlePlayerEjection} 
          />
        )}

        {phase === GamePhase.GAME_OVER && gameData && winner && (
          <GameOverPhase 
            players={players} 
            gameData={gameData} 
            winner={winner}
            onReset={resetGame} 
          />
        )}
      </div>
    </div>
  );
};

export default App;
