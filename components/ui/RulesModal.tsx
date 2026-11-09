import React from 'react';
import { Button } from './Button';
import { ImposterIcon, CivilianIcon, JesterIcon } from './AnimatedIcons';
import { haptics } from '../../services/haptics';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    haptics.tick();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-md bg-brand-dossier border border-brand-border rounded-3xl p-6 shadow-2xl max-h-[88vh] overflow-y-auto custom-scrollbar animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
            <h2 className="text-base font-bold text-white tracking-tight uppercase">
              Classified Protocol Manual
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-brand-surface text-brand-muted hover:text-white flex items-center justify-center border border-brand-border"
          >
            ✕
          </button>
        </div>

        {/* Roles Breakdown */}
        <div className="space-y-4 my-5">
          {/* Crew */}
          <div className="p-4 rounded-2xl bg-brand-surface/60 border border-brand-border flex gap-3.5 items-start">
            <CivilianIcon className="w-11 h-11 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-emerald-400">Loyal Agents (Crew)</h4>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">Majority</span>
              </div>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                You receive the exact <strong className="text-brand-text">Secret Word</strong> and Category. Ask clever, ambiguous questions. Listen for hesitations and deduce who doesn't know the word.
              </p>
            </div>
          </div>

          {/* Imposter */}
          <div className="p-4 rounded-2xl bg-brand-surface/60 border border-brand-border flex gap-3.5 items-start">
            <ImposterIcon className="w-11 h-11 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-brand-primary">The Infiltrator (Imposter)</h4>
                <span className="text-[10px] font-mono uppercase bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded border border-brand-primary/20">Covert</span>
              </div>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                You receive only the broad <strong className="text-brand-text">Category</strong>—NOT the secret word! Bluff your answers, decipher the secret word from context, and frame innocent agents.
              </p>
            </div>
          </div>

          {/* Jester */}
          <div className="p-4 rounded-2xl bg-brand-surface/60 border border-brand-border flex gap-3.5 items-start">
            <JesterIcon className="w-11 h-11 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-brand-warning">The Jester (Wildcard)</h4>
                <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">Optional</span>
              </div>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                A chaotic third party. You win <strong className="text-brand-text">instantly</strong> if the group votes you out! Act slightly suspicious to bait an accusation without being too obvious.
              </p>
            </div>
          </div>
        </div>

        {/* Tactical Game Flow */}
        <div className="p-4 rounded-2xl bg-brand-surface/30 border border-brand-border space-y-2 mb-6">
          <h5 className="text-xs font-mono font-bold text-brand-text uppercase tracking-wider">
            Rules of Engagement:
          </h5>
          <ol className="text-xs text-brand-muted space-y-1.5 list-decimal list-inside leading-relaxed">
            <li><strong>Pass the Device:</strong> Each agent holds the biometric sensor to read their dossier secretly.</li>
            <li><strong>Cross-Examination:</strong> Take turns asking one person one question about the word.</li>
            <li><strong>The Vote:</strong> When suspicion peaks or time runs out, call an emergency vote to eject the suspect!</li>
          </ol>
        </div>

        <Button onClick={handleClose} fullWidth variant="primary">
          Understood, Return to Mission
        </Button>
      </div>
    </div>
  );
};
