import React from 'react';
import { haptics } from '../../services/haptics';

// --- Tactical Randomizer Icon (Dice) ---
export const DiceIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <div className={`${className} bg-brand-surface border border-brand-border rounded-xl flex items-center justify-center shadow-sm text-brand-text group-hover:border-brand-primary/50 transition-colors`}>
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="3" ry="3"/>
      <circle cx="8" cy="8" r="1.2" fill="currentColor"/>
      <circle cx="16" cy="8" r="1.2" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
      <circle cx="8" cy="16" r="1.2" fill="currentColor"/>
      <circle cx="16" cy="16" r="1.2" fill="currentColor"/>
    </svg>
  </div>
);

// --- AI Infiltration Icon (Neural Core) ---
export const RobotIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <div className={`${className} bg-brand-surface border border-brand-border rounded-xl flex items-center justify-center shadow-sm text-brand-text group-hover:border-brand-primary/50 transition-colors`}>
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M15 2v2" />
      <path d="M15 20v2" />
      <path d="M2 15h2" />
      <path d="M2 9h2" />
      <path d="M20 15h2" />
      <path d="M20 9h2" />
      <path d="M9 2v2" />
      <path d="M9 20v2" />
    </svg>
  </div>
);

// --- Imposter Icon (Redacted Syndicate Infiltrator) ---
export const ImposterIcon: React.FC<{ className?: string }> = ({ className = "w-20 h-20" }) => (
  <div className={`${className} bg-brand-primary/10 rounded-full border-2 border-brand-primary flex items-center justify-center shadow-[0_0_24px_rgba(255,68,56,0.35)] relative`}>
    <div className="absolute inset-0 rounded-full border border-brand-primary/30 animate-ping opacity-25 pointer-events-none" />
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="3" y1="3" x2="21" y2="21" stroke="#FF4438" strokeWidth="2.5" />
    </svg>
  </div>
);

// --- Civilian Icon (Loyal Agent Shield) ---
export const CivilianIcon: React.FC<{ className?: string }> = ({ className = "w-20 h-20" }) => (
  <div className={`${className} bg-emerald-500/10 rounded-full border-2 border-brand-success flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)] relative`}>
    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-brand-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  </div>
);

// --- Jester Icon (Wildcard Trickster) ---
export const JesterIcon: React.FC<{ className?: string }> = ({ className = "w-20 h-20" }) => (
  <div className={`${className} bg-amber-500/10 rounded-full border-2 border-brand-warning flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.3)] relative`}>
    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-brand-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  </div>
);

// --- Classified Category Deck Card ---
interface CategoryCardProps {
  active: boolean;
  onClick: () => void;
  colorClass?: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ 
  active, 
  onClick, 
  label, 
  subLabel, 
  icon 
}) => {
  const handleClick = () => {
    haptics.tick();
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative w-full text-left rounded-2xl p-4 transition-all duration-150 ease-out active:scale-[0.98] border ${
        active 
          ? 'bg-brand-surface border-brand-primary shadow-[0_4px_16px_-2px_rgba(255,68,56,0.25)] ring-1 ring-brand-primary/50' 
          : 'bg-brand-dossier/90 border-brand-border hover:border-brand-borderLight hover:bg-brand-surface/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="p-2 rounded-xl bg-brand-surface border border-brand-border/60">
          {icon}
        </div>
        {active ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-primary text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Active
          </span>
        ) : (
          <span className="w-2 h-2 rounded-full bg-brand-border mt-1" />
        )}
      </div>
      <div>
        <h4 className={`text-sm font-bold tracking-tight ${active ? 'text-white' : 'text-brand-text'}`}>
          {label}
        </h4>
        {subLabel && (
          <p className="text-[11px] font-mono text-brand-muted tracking-wide mt-0.5 uppercase">
            {subLabel}
          </p>
        )}
      </div>
    </button>
  );
};