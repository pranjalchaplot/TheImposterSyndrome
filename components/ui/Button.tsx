import React from 'react';
import { haptics } from '../../services/haptics';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false, 
  className = '', 
  onClick,
  onPointerDown,
  ...props 
}) => {
  const baseStyles = 
    "relative inline-flex items-center justify-center font-bold tracking-tight select-none " +
    "transition-all duration-150 ease-out transform active:scale-[0.98] " +
    "disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-void";
  
  const sizeStyles = {
    sm: "px-3.5 py-2 text-xs rounded-xl min-h-[38px] gap-1.5",
    md: "px-5 py-3 text-sm rounded-2xl min-h-[46px] gap-2",
    lg: "px-6 py-4 text-base rounded-2xl min-h-[52px] gap-2.5",
  };

  const variants = {
    primary: "bg-brand-primary text-white hover:bg-brand-primaryHover shadow-[0_8px_24px_-4px_rgba(255,68,56,0.35)] active:shadow-none border border-brand-primary/40",
    secondary: "bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-surfaceHover hover:border-brand-borderLight active:bg-brand-border",
    danger: "bg-brand-danger text-white hover:bg-red-600 shadow-[0_8px_20px_-4px_rgba(239,68,68,0.35)] active:shadow-none border border-red-500/30",
    ghost: "bg-transparent text-brand-muted hover:text-brand-text hover:bg-brand-surface/60 border border-transparent"
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!props.disabled) {
      if (variant === 'primary' || variant === 'danger') {
        haptics.impact();
      } else {
        haptics.tick();
      }
    }
    if (onPointerDown) onPointerDown(e);
  };

  return (
    <button 
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      onPointerDown={handlePointerDown}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};