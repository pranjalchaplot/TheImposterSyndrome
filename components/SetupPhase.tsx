
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { MIN_PLAYERS, MAX_PLAYERS, GameSettings, DEFAULT_SETTINGS } from '../types';
import { WORD_BANK } from '../services/wordBank';
import { DiceIcon, RobotIcon, CategoryCard } from './ui/AnimatedIcons';
import imposterLogo from '../assets/IMPOSTER.png';

interface SetupPhaseProps {
  onStartGame: (names: string[], settings: GameSettings) => void;
}

const STORAGE_KEY_PLAYERS = 'imposter_saved_players';
const STORAGE_KEY_ACTIVE_PLAYERS = 'imposter_active_players';
const STORAGE_KEY_SETTINGS = 'imposter_settings';

export const SetupPhase: React.FC<SetupPhaseProps> = ({ onStartGame }) => {
  // Players State
  const [activePlayers, setActivePlayers] = useState<string[]>([]);
  const [savedPlayers, setSavedPlayers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // UI State
  const [step, setStep] = useState<'ROSTER' | 'SETTINGS'>('ROSTER');
  const [showInfo, setShowInfo] = useState(false);
  const [showNSFWWarning, setShowNSFWWarning] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Data on Mount
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

  // Persistence Effects
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
  }, [activePlayers.length]);

  const addNewPlayer = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    
    // Check for duplicates in Active List
    if (activePlayers.includes(trimmed)) {
        setErrorMsg(`'${trimmed}' is already in the squad.`);
        return;
    }

    setErrorMsg(null);

    if (savedPlayers.includes(trimmed)) {
      // If exists in saved but not active, move to active
      movePlayerToActive(trimmed);
      setInputValue('');
      return;
    }

    // New player completely
    if (activePlayers.length < MAX_PLAYERS) {
      const newSaved = [...savedPlayers, trimmed];
      setSavedPlayers(newSaved);
      setActivePlayers(prev => [...prev, trimmed]);
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const movePlayerToActive = (name: string) => {
    if (activePlayers.length < MAX_PLAYERS && !activePlayers.includes(name)) {
      setActivePlayers(prev => [...prev, name]);
      setErrorMsg(null);
    }
  };

  const movePlayerToReserve = (name: string) => {
    setActivePlayers(prev => prev.filter(p => p !== name));
  };

  const deletePlayerPermanently = (name: string) => {
    movePlayerToReserve(name);
    setSavedPlayers(prev => prev.filter(p => p !== name));
  };

  const clearActiveSquad = () => {
    setActivePlayers([]);
  };

  const clearReserveList = () => {
    // Keep only those who are currently active, delete the rest from saved
    setSavedPlayers(prev => prev.filter(p => activePlayers.includes(p)));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addNewPlayer();
    if (errorMsg) setErrorMsg(null);
  };

  const maxImpostersAllowed = Math.max(1, Math.floor((activePlayers.length - 1) / 2));
  const availableReserve = savedPlayers.filter(p => !activePlayers.includes(p));

  // Category Helpers
  const handleCategorySelect = (cat: string) => {
    setSettings(s => ({ ...s, targetCategory: cat }));
  };

  const handleAdultModeToggle = () => {
    if (!settings.enableAdultMode) {
      // User trying to enable
      setShowNSFWWarning(true);
    } else {
      // User disabling
      setSettings(s => ({ 
        ...s, 
        enableAdultMode: false,
        targetCategory: s.targetCategory === "NSFW (18+)" ? "LOCAL_RANDOM" : s.targetCategory 
      }));
    }
  };

  const confirmNSFW = () => {
    setSettings(s => ({ ...s, enableAdultMode: true }));
    setShowNSFWWarning(false);
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto animate-fade-in relative">
      
      {/* Header */}
      <div className="pt-10 pb-6 px-6 text-center flex flex-col items-center justify-center relative">
        <img 
          src={imposterLogo} 
          alt="Imposter Syndrome" 
          className="w-64 object-contain mix-blend-screen drop-shadow-2xl"
        />
        {((settings.targetCategory === "LOCAL_RANDOM" && settings.enableAdultMode) || settings.targetCategory === "NSFW (18+)") && (
            <div className="absolute top-4 right-4 rotate-12 bg-red-600 text-white font-black text-xs px-2 py-1 rounded border-2 border-white shadow-xl animate-pulse cursor-default" title="Adult Content Active">
                NSFW 18+
            </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex px-6 gap-2 mb-6">
        <button 
          onClick={() => setStep('ROSTER')}
          className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${step === 'ROSTER' ? 'bg-white text-brand-dark shadow-lg shadow-white/10' : 'bg-brand-surface text-slate-400 hover:bg-slate-700'}`}
        >
          ROSTER <span className="ml-1 text-xs opacity-60">({activePlayers.length})</span>
        </button>
        <button 
          onClick={() => setStep('SETTINGS')}
          className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${step === 'SETTINGS' ? 'bg-white text-brand-dark shadow-lg shadow-white/10' : 'bg-brand-surface text-slate-400 hover:bg-slate-700'}`}
        >
          MISSION
        </button>
        
        <button 
          onClick={() => setShowInfo(true)}
          className="w-9 h-9 rounded-full bg-brand-surface text-slate-400 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-all font-serif font-bold italic border border-transparent hover:border-slate-500 shrink-0"
          title="Game Info"
        >
          i
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar">
        
        {step === 'ROSTER' && (
          <div className="space-y-6 animate-fade-in">
             {/* Input */}
             <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter codename..."
                className={`w-full bg-brand-surface border-2 rounded-2xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all shadow-lg shadow-black/20 ${errorMsg ? 'border-brand-danger focus:border-brand-danger' : 'border-transparent focus:border-brand-primary'}`}
                maxLength={12}
              />
              <button 
                onClick={addNewPlayer}
                disabled={!inputValue.trim()}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-brand-primary rounded-xl flex items-center justify-center text-white disabled:opacity-0 transition-all hover:scale-95 active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </button>
             </div>
             {errorMsg && (
                <p className="text-brand-danger text-xs font-bold px-2 -mt-4 animate-fade-in">{errorMsg}</p>
             )}

             {/* Active Squad */}
             <div>
               <div className="flex justify-between items-end mb-3 pl-1 pr-1">
                  <h3 className="text-xs font-bold text-brand-primary uppercase tracking-widest">Active Squad</h3>
                  {activePlayers.length > 0 && (
                    <button 
                        onClick={clearActiveSquad}
                        className="text-slate-500 hover:text-brand-danger transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider"
                        title="Clear Active Squad"
                    >
                        <span>Clear</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  )}
               </div>

               {activePlayers.length === 0 ? (
                 <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-xl text-slate-600 text-sm">
                   No agents assigned to mission.
                 </div>
               ) : (
                 <div className="grid grid-cols-2 gap-3">
                    {activePlayers.map((name) => (
                      <div key={name} className="flex items-center justify-between bg-brand-card border border-brand-primary/30 p-3 rounded-xl group animate-fade-in relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="font-bold text-white truncate pl-2">{name}</span>
                        </div>
                        {/* Active = Open Eye. Click to deactivate. */}
                        <button 
                          onClick={() => movePlayerToReserve(name)}
                          className="text-brand-primary hover:text-white transition-colors p-1"
                          title="Deactivate Agent"
                        >
                          {/* Open Eye Icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </div>
                    ))}
                 </div>
               )}
             </div>

             {/* Reserve Roster */}
             {availableReserve.length > 0 && (
               <div className="pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-end mb-3 pl-1 pr-1">
                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reserve List</h3>
                     <button 
                        onClick={clearReserveList}
                        className="text-slate-600 hover:text-brand-danger transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider"
                        title="Delete All Reserves"
                    >
                        <span>Clear</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {availableReserve.map((name) => (
                      <div key={name} className="flex items-center bg-slate-800/50 border border-slate-700/50 rounded-full pl-4 pr-1 py-1 transition-all group hover:border-slate-600">
                        <span className="font-medium text-slate-400 text-sm mr-2">{name}</span>
                        
                        <div className="flex items-center gap-1">
                            {/* Reserve = Crossed Eye. Click to activate. */}
                            <button 
                                onClick={() => movePlayerToActive(name)}
                                disabled={activePlayers.length >= MAX_PLAYERS}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 transition-all disabled:opacity-30"
                                title="Activate Agent"
                            >
                                {/* Crossed Eye Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                            </button>
                            
                            {/* Delete */}
                            <button 
                                onClick={() => deletePlayerPermanently(name)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:bg-brand-danger hover:text-white transition-all"
                                title="Delete Permanently"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}
          </div>
        )}

        {step === 'SETTINGS' && (
          <div className="space-y-6 animate-fade-in pb-10">
            
            {/* Timer Setting */}
            <div className="bg-brand-card p-5 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <span className="font-bold text-slate-200">Timer</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.timerDuration > 0}
                    onChange={() => setSettings(s => ({ ...s, timerDuration: s.timerDuration > 0 ? 0 : 180 }))}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-success"></div>
                </label>
              </div>
              
              {settings.timerDuration > 0 && (
                <div className="flex gap-2">
                  {[60, 120, 180, 300].map(time => (
                    <button
                      key={time}
                      onClick={() => setSettings(s => ({...s, timerDuration: time}))}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border ${
                        settings.timerDuration === time 
                        ? 'bg-brand-primary text-white border-brand-primary' 
                        : 'bg-brand-dark text-slate-400 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {time / 60}m
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Imposter Settings Group */}
            <div className="space-y-3">
                {/* Imposter Count */}
                <div className="bg-brand-card p-5 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <span className="font-bold text-slate-200">Imposters</span>
                    </div>
                    <span className="text-xl font-black text-rose-500">{settings.imposterCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max={maxImpostersAllowed} 
                    value={settings.imposterCount}
                    onChange={(e) => setSettings(s => ({...s, imposterCount: parseInt(e.target.value)}))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Imposter Teaming - Only if count > 1 */}
                {settings.imposterCount > 1 && (
                    <div className="bg-brand-card p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-200 text-sm">Imposter Network</span>
                                <span className="text-xs text-slate-500">Imposters see each other</span>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={settings.imposterTeaming}
                                onChange={() => setSettings(s => ({ ...s, imposterTeaming: !s.imposterTeaming }))}
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                    </div>
                )}
            </div>

            {/* Reveal Setting */}
            <div className="bg-brand-card p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-200 text-sm">Reveal Roles</span>
                    <span className="text-xs text-slate-500">Show role after ejection</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.revealRoleOnDeath}
                    onChange={() => setSettings(s => ({ ...s, revealRoleOnDeath: !s.revealRoleOnDeath }))}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                </label>
            </div>

            {/* Extra Roles Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <span className="font-bold text-slate-200">Extra Roles</span>
              </div>

              {/* Jester Role */}
              <div className="bg-brand-card p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5 2 8 8 0 0 0-5-2H2Z"/><path d="M6 11c1.5 0 3 .5 3 2-2 0-3 0-3-2Z"/><path d="M18 11c-1.5 0-3 .5-3 2 2 0 3 0 3-2Z"/></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-200 text-sm">Jester</span>
                    <span className="text-xs text-slate-500">Wins when eliminated</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.extraRoles.jesterEnabled}
                    onChange={() => setSettings(s => ({ ...s, extraRoles: { ...s.extraRoles, jesterEnabled: !s.extraRoles.jesterEnabled } }))}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
            </div>



              {/* Adult Mode Setting */}
              <div className="bg-brand-card p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600/10 rounded-lg text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-200 text-sm">Adult Mode (18+)</span>
                    <span className="text-xs text-slate-500">Enable explicit content</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.enableAdultMode}
                    onChange={handleAdultModeToggle}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

            {/* Category Selector */}
            <div className="space-y-4">
               <div className="flex items-center gap-3 px-1">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM12 8v8m-4-4h8"/></svg>
                  </div>
                  <span className="font-bold text-slate-200">Target Category</span>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  {/* AI Random */}
                  <CategoryCard
                    active={settings.targetCategory === ""}
                    onClick={() => handleCategorySelect("")}
                    label="AI Intelligence"
                    subLabel="Infinite Categories"
                    colorClass="from-indigo-600 to-violet-600"
                    icon={<RobotIcon />}
                  />

                  {/* Local Random */}
                  <CategoryCard
                    active={settings.targetCategory === "LOCAL_RANDOM"}
                    onClick={() => handleCategorySelect("LOCAL_RANDOM")}
                    label="Offline Deck"
                    subLabel="Pre-loaded"
                    colorClass="from-amber-500 to-orange-600"
                    icon={<DiceIcon />}
                  />
               </div>
               
               {/* Local Categories Grid */}
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Manual Selection</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(WORD_BANK)
                      .filter(cat => settings.enableAdultMode || cat !== "NSFW (18+)")
                      .map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={`p-3 rounded-xl text-xs font-bold border text-left transition-all flex items-center gap-2 ${
                          settings.targetCategory === cat
                            ? 'bg-slate-200 text-brand-dark border-white scale-[1.02]' 
                            : 'bg-brand-card text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${settings.targetCategory === cat ? 'bg-brand-primary' : 'bg-slate-600'}`}></div>
                        {cat}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Custom Input */}
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-500 group-focus-within:text-brand-primary transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                 </div>
                 <input
                    type="text"
                    value={(!Object.keys(WORD_BANK).includes(settings.targetCategory) && settings.targetCategory !== "LOCAL_RANDOM") ? settings.targetCategory : ""}
                    onChange={(e) => setSettings(s => ({...s, targetCategory: e.target.value}))}
                    placeholder="Custom AI Topic (e.g. '80s Movies')"
                    className="w-full bg-brand-card border border-slate-800 rounded-xl pl-10 pr-4 py-4 text-sm text-white placeholder-slate-600 focus:border-brand-primary outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                  />
               </div>
            </div>

          </div>
        )}
      </div>

      <div className="p-6 bg-gradient-to-t from-brand-dark via-brand-dark to-transparent z-20">
        <Button 
          fullWidth 
          onClick={() => onStartGame(activePlayers, settings)} 
          disabled={activePlayers.length < MIN_PLAYERS}
          className="text-lg py-4 shadow-lg shadow-brand-primary/25"
        >
          {activePlayers.length < MIN_PLAYERS ? `Need ${MIN_PLAYERS - activePlayers.length} more Agents` : 'INITIALIZE MISSION'}
        </Button>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-card border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                <button 
                    onClick={() => setShowInfo(false)}
                    className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                
                <h2 className="text-2xl font-bold text-white mb-4">About</h2>
                
                <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                    <p>
                        <strong className="text-brand-primary">Imposter Syndrome</strong> is a social deduction game where players must work together to identify the hidden imposters among them.
                    </p>
                    <p>
                        Ask questions, analyze behavior, and vote to eliminate the suspects. But be careful—the imposters are trying to blend in and sabotage the mission!
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Developed By</p>
                    <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">
                        Pranjal Chaplot
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* NSFW Warning Modal */}
      {showNSFWWarning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-brand-card border-2 border-red-600 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(220,38,38,0.5)] relative text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Warning: 18+</h2>
                
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    This category contains <strong className="text-red-400">explicit, adult, and double-meaning words</strong>.<br/><br/>
                    Are you sure you want to proceed?
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setShowNSFWWarning(false)}
                        className="py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={confirmNSFW}
                        className="py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/25"
                    >
                        I'M OVER 18
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
