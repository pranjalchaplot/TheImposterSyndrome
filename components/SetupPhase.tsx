import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { MIN_PLAYERS, MAX_PLAYERS, GameSettings, DEFAULT_SETTINGS } from '../types';
import { WORD_BANK } from '../services/wordBank';
import { DiceIcon, RobotIcon, CategoryCard } from './ui/AnimatedIcons';
import { RadioDeck } from './ui/RadioDeck';
import { RulesModal } from './ui/RulesModal';
import { haptics } from '../services/haptics';
import imposterLogo from '../assets/IMPOSTER.png';

interface SetupPhaseProps {
  onStartGame: (names: string[], settings: GameSettings) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  currentTrackName: string;
  onNextTrack: () => void;
  onPrevTrack: () => void;
}

const STORAGE_KEY_PLAYERS = 'imposter_saved_players';
const STORAGE_KEY_ACTIVE_PLAYERS = 'imposter_active_players';
const STORAGE_KEY_SETTINGS = 'imposter_settings';

// Quick Preset Squads for instant party fun
const PRESET_SQUADS = [
  ['Shadow', 'Cipher', 'Viper', 'Ghost'],
  ['Apex', 'Echo', 'Raven', 'Phantom', 'Oracle', 'Specter'],
  ['Titan', 'Nova', 'Pulse', 'Blaze', 'Mirage', 'Siren', 'Havoc', 'Rogue']
];

export const SetupPhase: React.FC<SetupPhaseProps> = ({ 
  onStartGame, 
  isMuted, 
  onToggleMute, 
  currentTrackName, 
  onNextTrack, 
  onPrevTrack 
}) => {
  // Players State
  const [activePlayers, setActivePlayers] = useState<string[]>([]);
  const [savedPlayers, setSavedPlayers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // UI Navigation Tabs
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'DIRECTIVE'>('ROSTER');
  const [showRules, setShowRules] = useState(false);
  const [showNSFWWarning, setShowNSFWWarning] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [aiCustomInput, setAiCustomInput] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Saved Data from LocalStorage
  useEffect(() => {
    try {
      const loadedPlayers = localStorage.getItem(STORAGE_KEY_PLAYERS);
      if (loadedPlayers) setSavedPlayers(JSON.parse(loadedPlayers));

      const loadedActive = localStorage.getItem(STORAGE_KEY_ACTIVE_PLAYERS);
      if (loadedActive) setActivePlayers(JSON.parse(loadedActive));

      const loadedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (loadedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(loadedSettings) });
      }
    } catch (e) {
      console.error("Failed to load local storage data", e);
    }
  }, []);

  // Save changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(savedPlayers));
  }, [savedPlayers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_PLAYERS, JSON.stringify(activePlayers));
  }, [activePlayers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Adjust max imposters based on active player count
  useEffect(() => {
    const maxImposters = Math.max(1, Math.floor((activePlayers.length - 1) / 2));
    if (settings.imposterCount > maxImposters) {
      setSettings(s => ({ ...s, imposterCount: maxImposters }));
    }
  }, [activePlayers.length, settings.imposterCount]);

  const addNewPlayer = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    
    if (activePlayers.includes(trimmed)) {
      setErrorMsg(`"${trimmed}" is already on the mission roster.`);
      haptics.tick();
      return;
    }

    if (activePlayers.length >= MAX_PLAYERS) {
      setErrorMsg(`Maximum squad limit reached (${MAX_PLAYERS} agents).`);
      haptics.tick();
      return;
    }

    setErrorMsg(null);
    haptics.tap();

    if (savedPlayers.includes(trimmed)) {
      setActivePlayers(prev => [...prev, trimmed]);
      setInputValue('');
      return;
    }

    setSavedPlayers(prev => [...prev, trimmed]);
    setActivePlayers(prev => [...prev, trimmed]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const movePlayerToActive = (name: string) => {
    if (activePlayers.length < MAX_PLAYERS && !activePlayers.includes(name)) {
      haptics.tick();
      setActivePlayers(prev => [...prev, name]);
      setErrorMsg(null);
    }
  };

  const movePlayerToReserve = (name: string) => {
    haptics.tick();
    setActivePlayers(prev => prev.filter(p => p !== name));
  };

  const deletePlayerPermanently = (name: string) => {
    haptics.tick();
    movePlayerToReserve(name);
    setSavedPlayers(prev => prev.filter(p => p !== name));
  };

  const loadPresetSquad = (preset: string[]) => {
    haptics.impact();
    setActivePlayers(preset);
    setSavedPlayers(prev => Array.from(new Set([...prev, ...preset])));
    setErrorMsg(null);
  };

  const clearActiveSquad = () => {
    haptics.tick();
    setActivePlayers([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addNewPlayer();
    if (errorMsg) setErrorMsg(null);
  };

  const maxImpostersAllowed = Math.max(1, Math.floor((activePlayers.length - 1) / 2));
  const availableReserve = savedPlayers.filter(p => !activePlayers.includes(p));

  // Category selections
  const handleCategorySelect = (cat: string) => {
    haptics.tick();
    setSettings(s => ({ ...s, targetCategory: cat }));
  };

  const handleAdultModeToggle = () => {
    if (!settings.enableAdultMode) {
      setShowNSFWWarning(true);
    } else {
      haptics.tick();
      setSettings(s => ({ 
        ...s, 
        enableAdultMode: false,
        targetCategory: s.targetCategory === "NSFW (18+)" ? "LOCAL_RANDOM" : s.targetCategory 
      }));
    }
  };

  const confirmNSFW = () => {
    haptics.impact();
    setSettings(s => ({ ...s, enableAdultMode: true }));
    setShowNSFWWarning(false);
  };

  const canStart = activePlayers.length >= MIN_PLAYERS;

  return (
    <div className="flex flex-col h-full max-w-md mx-auto px-4 pb-6 pt-3 select-none justify-between overflow-hidden">
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* Adult Mode NSFW Warning Modal */}
      {showNSFWWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-brand-dossier border border-brand-primary/50 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-brand-primary/20 border border-brand-primary flex items-center justify-center mx-auto mb-4 text-brand-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Age-Restricted Content</h3>
            <p className="text-xs text-brand-muted leading-relaxed mb-6">
              You are enabling adult content (18+). Topics may contain mature, provocative, and party themes. Proceed only if all players are consenting adults.
            </p>
            <div className="flex gap-2.5">
              <Button onClick={() => setShowNSFWWarning(false)} variant="secondary" fullWidth size="md">
                Cancel
              </Button>
              <Button onClick={confirmNSFW} variant="danger" fullWidth size="md">
                Confirm 18+
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar: Radio Deck, Logo & Info */}
      <header className="flex items-center justify-between pb-3 pt-1 border-b border-brand-border/60">
        <RadioDeck
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          currentTrackName={currentTrackName}
          onNextTrack={onNextTrack}
          onPrevTrack={onPrevTrack}
        />

        <button
          type="button"
          onClick={() => {
            haptics.tick();
            setShowRules(true);
          }}
          className="w-9 h-9 rounded-full bg-brand-surface border border-brand-border hover:border-brand-borderLight text-brand-muted hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
          title="Mission Rules"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
      </header>

      {/* Hero Title */}
      <div className="text-center pt-3 pb-2 relative flex flex-col items-center">
        <div className="relative">
          <img 
            src={imposterLogo} 
            alt="Imposter Syndrome" 
            className="w-52 h-auto object-contain drop-shadow-xl brightness-110"
          />
          {settings.enableAdultMode && (
            <span className="absolute -top-1 -right-4 bg-brand-primary text-white font-mono font-black text-[10px] px-2 py-0.5 rounded-full border border-white/20 shadow-lg tracking-wider animate-pulse">
              18+
            </span>
          )}
        </div>
        <p className="text-[11px] font-mono tracking-widest uppercase text-brand-muted mt-0.5">
          Social Deduction Protocol
        </p>
      </div>

      {/* Segmented Tab Switcher (iOS benchmark style) */}
      <div className="p-1 rounded-2xl bg-brand-dossier border border-brand-border flex gap-1 mb-3">
        <button
          type="button"
          onClick={() => {
            haptics.tick();
            setActiveTab('ROSTER');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
            activeTab === 'ROSTER' 
              ? 'bg-brand-surface text-white shadow-sm border border-brand-borderLight/40' 
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <span>Squad Roster</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeTab === 'ROSTER' ? 'bg-brand-primary text-white' : 'bg-brand-border text-brand-muted'
          }`}>
            {activePlayers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.tick();
            setActiveTab('DIRECTIVE');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
            activeTab === 'DIRECTIVE' 
              ? 'bg-brand-surface text-white shadow-sm border border-brand-borderLight/40' 
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <span>Mission Directive</span>
          {settings.extraRoles.jesterEnabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-warning animate-pulse" />
          )}
        </button>
      </div>

      {/* Scrollable Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 space-y-4">
        {activeTab === 'ROSTER' && (
          <div className="space-y-4 animate-fade-in">
            {/* Quick Add Player Input */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter agent code name..."
                    maxLength={18}
                    className="w-full h-11 px-4 bg-brand-dossier border border-brand-border rounded-2xl text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  />
                  {inputValue && (
                    <button
                      onClick={() => setInputValue('')}
                      className="absolute right-3 top-3 text-brand-muted hover:text-brand-text"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <Button 
                  onClick={addNewPlayer} 
                  disabled={!inputValue.trim()} 
                  size="md"
                  className="px-5 shrink-0"
                >
                  Add
                </Button>
              </div>

              {errorMsg && (
                <p className="text-xs text-brand-primary font-mono tracking-wide px-1">
                  ⚠ {errorMsg}
                </p>
              )}
            </div>

            {/* Quick Preset Squads */}
            <div className="p-3 rounded-2xl bg-brand-dossier/70 border border-brand-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-brand-muted">
                  Quick Party Presets
                </span>
                <span className="text-[10px] text-brand-muted">Tap to load</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadPresetSquad(PRESET_SQUADS[0])}
                  className="flex-1 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono font-bold text-brand-text hover:border-brand-primary/50 transition-all active:scale-95"
                >
                  Squad of 4
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetSquad(PRESET_SQUADS[1])}
                  className="flex-1 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono font-bold text-brand-text hover:border-brand-primary/50 transition-all active:scale-95"
                >
                  Squad of 6
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetSquad(PRESET_SQUADS[2])}
                  className="flex-1 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono font-bold text-brand-text hover:border-brand-primary/50 transition-all active:scale-95"
                >
                  Squad of 8
                </button>
              </div>
            </div>

            {/* Active Squad List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-muted font-mono">
                  Active Operatives ({activePlayers.length}/{MAX_PLAYERS})
                </span>
                {activePlayers.length > 0 && (
                  <button
                    onClick={clearActiveSquad}
                    className="text-xs text-brand-muted hover:text-brand-primary font-mono transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {activePlayers.length === 0 ? (
                <div className="p-8 rounded-3xl bg-brand-dossier border border-dashed border-brand-border text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center mx-auto text-brand-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <h4 className="text-sm font-bold text-white">No Agents on Roster</h4>
                  <p className="text-xs text-brand-muted max-w-[220px] mx-auto">
                    Type a name above or choose a party preset to assemble your squad.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {activePlayers.map((name, index) => (
                    <div 
                      key={name}
                      className="group flex items-center justify-between p-2.5 rounded-2xl bg-brand-dossier border border-brand-border hover:border-brand-borderLight transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-xs font-mono font-bold text-brand-primary shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-xs font-bold text-white truncate">
                          {name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => movePlayerToReserve(name)}
                        className="w-6 h-6 rounded-lg text-brand-muted hover:text-brand-primary hover:bg-brand-surface flex items-center justify-center transition-all shrink-0"
                        title="Remove from active squad"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Reserves (Bench) */}
            {availableReserve.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-brand-border/40">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-muted font-mono">
                    Reserve Agents ({availableReserve.length})
                  </span>
                  <span className="text-[11px] text-brand-muted">Tap to recruit</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableReserve.map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-brand-surface border border-brand-border text-xs text-brand-muted hover:text-white hover:border-brand-borderLight transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => movePlayerToActive(name)}
                        className="font-medium"
                      >
                        + {name}
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePlayerPermanently(name)}
                        className="text-brand-muted hover:text-brand-primary ml-1 p-0.5"
                        title="Delete permanently"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'DIRECTIVE' && (
          <div className="space-y-4 animate-fade-in">
            {/* Mission Decks Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-muted font-mono px-1">
                Category Directive
              </span>

              <div className="grid grid-cols-2 gap-2">
                {/* Random Offline Deck */}
                <CategoryCard
                  active={settings.targetCategory === "LOCAL_RANDOM"}
                  onClick={() => handleCategorySelect("LOCAL_RANDOM")}
                  label="Classified Decks"
                  subLabel="Offline Random"
                  icon={<DiceIcon className="w-5 h-5 text-brand-primary" />}
                />

                {/* AI Infiltration Deck */}
                <CategoryCard
                  active={settings.targetCategory === "" || (!WORD_BANK[settings.targetCategory] && settings.targetCategory !== "LOCAL_RANDOM" && settings.targetCategory !== "NSFW (18+)")}
                  onClick={() => handleCategorySelect("")}
                  label="Gemini AI"
                  subLabel="Neural Core"
                  icon={<RobotIcon className="w-5 h-5 text-brand-primary" />}
                />
              </div>

              {/* AI Custom Prompt Input (if AI is active) */}
              {(settings.targetCategory === "" || (!WORD_BANK[settings.targetCategory] && settings.targetCategory !== "LOCAL_RANDOM" && settings.targetCategory !== "NSFW (18+)")) && (
                <div className="p-3 rounded-2xl bg-brand-dossier border border-brand-border space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-brand-muted">
                    Custom AI Mission Subject (Optional)
                  </span>
                  <input
                    type="text"
                    value={settings.targetCategory}
                    onChange={(e) => setSettings(s => ({ ...s, targetCategory: e.target.value }))}
                    placeholder="e.g. 90s Cartoons, Cyberpunk, Quantum Physics..."
                    className="w-full h-10 px-3 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-primary transition-all font-mono"
                  />
                  <p className="text-[10px] text-brand-muted">
                    Leave blank for Gemini to choose a mysterious classified topic.
                  </p>
                </div>
              )}
            </div>

            {/* Offline Specific Categories Carousel/List */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-muted font-mono px-1">
                Specific Classified Archives
              </span>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(WORD_BANK).slice(0, 6).map((catName) => (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => handleCategorySelect(catName)}
                    className={`p-3 rounded-2xl text-left border transition-all active:scale-95 ${
                      settings.targetCategory === catName
                        ? 'bg-brand-surface border-brand-primary text-white ring-1 ring-brand-primary/40'
                        : 'bg-brand-dossier border-brand-border text-brand-text hover:border-brand-borderLight'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{catName}</span>
                      <span className="text-[10px] font-mono text-brand-muted">
                        {WORD_BANK[catName]?.length || 0} words
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mission Parameters (Sliders & Toggles) */}
            <div className="p-4 rounded-3xl bg-brand-dossier border border-brand-border space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-muted font-mono block">
                Mission Parameters
              </span>

              {/* Imposter Count Selector */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Infiltrators (Imposters)</h4>
                  <p className="text-[10px] text-brand-muted">Max {maxImpostersAllowed} for this squad size</p>
                </div>
                <div className="flex items-center gap-1 bg-brand-surface p-1 rounded-xl border border-brand-border">
                  {[1, 2, 3].map((count) => {
                    const isDisabled = count > maxImpostersAllowed;
                    return (
                      <button
                        key={count}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          haptics.tick();
                          setSettings(s => ({ ...s, imposterCount: count }));
                        }}
                        className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                          settings.imposterCount === count
                            ? 'bg-brand-primary text-white shadow-sm'
                            : isDisabled
                              ? 'text-brand-muted/30 cursor-not-allowed'
                              : 'text-brand-muted hover:text-white'
                        }`}
                      >
                        {count}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mission Timer Segmented Selector */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-border/60">
                <div>
                  <h4 className="text-xs font-bold text-white">Interrogation Timer</h4>
                  <p className="text-[10px] text-brand-muted">Countdown per mission</p>
                </div>
                <div className="flex items-center gap-1 bg-brand-surface p-1 rounded-xl border border-brand-border">
                  {[
                    { label: 'Off', val: 0 },
                    { label: '2m', val: 120 },
                    { label: '3m', val: 180 },
                    { label: '5m', val: 300 },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        haptics.tick();
                        setSettings(s => ({ ...s, timerDuration: item.val }));
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        settings.timerDuration === item.val
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'text-brand-muted hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jester Wildcard Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-border/60">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white">The Jester</h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Wildcard
                    </span>
                  </div>
                  <p className="text-[10px] text-brand-muted">Wins if falsely voted out by squad</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setSettings(s => ({
                      ...s,
                      extraRoles: { ...s.extraRoles, jesterEnabled: !s.extraRoles.jesterEnabled }
                    }));
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 border ${
                    settings.extraRoles.jesterEnabled ? 'bg-brand-primary border-brand-primary' : 'bg-brand-surface border-brand-border'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.extraRoles.jesterEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Imposter Teaming Toggle (if > 1 imposter) */}
              {settings.imposterCount > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-brand-border/60">
                  <div>
                    <h4 className="text-xs font-bold text-white">Syndicate Intel (Teaming)</h4>
                    <p className="text-[10px] text-brand-muted">Imposters know each other's identities</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      haptics.tick();
                      setSettings(s => ({ ...s, imposterTeaming: !s.imposterTeaming }));
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 border ${
                      settings.imposterTeaming ? 'bg-brand-primary border-brand-primary' : 'bg-brand-surface border-brand-border'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.imposterTeaming ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              )}

              {/* Reveal Role on Death */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-border/60">
                <div>
                  <h4 className="text-xs font-bold text-white">Ejection Transparency</h4>
                  <p className="text-[10px] text-brand-muted">Reveal true role upon player elimination</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setSettings(s => ({ ...s, revealRoleOnDeath: !s.revealRoleOnDeath }));
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 border ${
                    settings.revealRoleOnDeath ? 'bg-brand-primary border-brand-primary' : 'bg-brand-surface border-brand-border'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.revealRoleOnDeath ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* NSFW (18+) Mode */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-border/60">
                <div>
                  <h4 className="text-xs font-bold text-white">Undercover 18+ (NSFW)</h4>
                  <p className="text-[10px] text-brand-muted">Mature party topics and provocative cues</p>
                </div>
                <button
                  type="button"
                  onClick={handleAdultModeToggle}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 border ${
                    settings.enableAdultMode ? 'bg-brand-danger border-brand-danger' : 'bg-brand-surface border-brand-border'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.enableAdultMode ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bottom Action Dock */}
      <footer className="pt-3 border-t border-brand-border/60">
        <Button
          onClick={() => {
            haptics.impact();
            onStartGame(activePlayers, settings);
          }}
          disabled={!canStart}
          fullWidth
          size="lg"
          variant="primary"
          className="shadow-xl"
        >
          {canStart ? (
            <div className="flex items-center justify-center gap-2">
              <span>Deploy Mission</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          ) : (
            <span className="font-mono text-xs">
              Recruit {MIN_PLAYERS - activePlayers.length} more agent{MIN_PLAYERS - activePlayers.length > 1 ? 's' : ''} to deploy
            </span>
          )}
        </Button>
      </footer>
    </div>
  );
};
