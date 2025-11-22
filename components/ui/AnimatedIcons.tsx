import React from 'react';

// --- 2D Dice Icon ---
export const DiceIcon: React.FC = () => (
  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg border border-amber-300">
    <svg xmlns="http://www.w3.org/2000/svg" className="text-white w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <path d="M16 8h.01"/><path d="M16 16h.01"/><path d="M8 8h.01"/><path d="M8 16h.01"/><path d="M12 12h.01"/>
    </svg>
  </div>
);

// --- 2D Robot Icon ---
export const RobotIcon: React.FC = () => (
  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg border border-indigo-300">
    <svg xmlns="http://www.w3.org/2000/svg" className="text-white w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="12" x="3" y="6" rx="2"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 14h.01"/><path d="M12 2v4"/><path d="M12 22v-4"/>
    </svg>
  </div>
);

// --- Imposter Icon (Clean 2D) ---
export const ImposterIcon: React.FC = () => (
    <div className="w-20 h-20 bg-rose-900/80 rounded-full border-4 border-rose-500 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)] relative">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-rose-500">
            <path d="M12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M3 12C3 7.03 7.03 3 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/>
            <circle cx="9" cy="11" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="11" r="1.5" fill="currentColor"/>
            <path d="M8 15C8 15 10 17 12 17C14 17 16 15 16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    </div>
);

// --- Civilian Icon (Clean 2D) ---
export const CivilianIcon: React.FC = () => (
    <div className="w-20 h-20 bg-blue-900/80 rounded-full border-4 border-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] relative">
         <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
    </div>
);


// --- Generic Category Card ---
interface CategoryCardProps {
  active: boolean;
  onClick: () => void;
  colorClass?: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ active, onClick, colorClass, label, subLabel, icon }) => {
  return (
    <button
      onClick={onClick}
      className={`relative group p-1 rounded-2xl transition-all duration-200 ${active ? 'scale-[1.02]' : 'scale-100 hover:scale-[1.01]'}`}
    >
      <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} bg-gradient-to-br ${colorClass || 'from-brand-primary to-brand-accent'} opacity-20 blur-sm`}></div>
      
      <div className={`relative h-full bg-brand-card border-2 rounded-2xl p-4 flex flex-col items-start text-left transition-all duration-300 ${active ? 'border-brand-primary bg-brand-surface/80' : 'border-slate-800 hover:border-slate-600'}`}>
        <div className="mb-3 flex items-center justify-between w-full">
           {icon}
           {active && (
             <div className="w-3 h-3 rounded-full bg-brand-success shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
           )}
        </div>
        <div>
          <p className={`font-bold text-sm ${active ? 'text-white' : 'text-slate-300'}`}>{label}</p>
          {subLabel && <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">{subLabel}</p>}
        </div>
      </div>
    </button>
  );
};