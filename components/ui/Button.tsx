import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative px-6 py-3 rounded-xl font-bold transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark";
  
  const variants = {
    primary: "bg-gradient-to-r from-brand-primary to-indigo-600 text-white hover:shadow-lg hover:shadow-brand-primary/30 focus:ring-brand-primary",
    secondary: "bg-brand-card border border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500 focus:ring-slate-500",
    danger: "bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:shadow-lg hover:shadow-rose-600/30 focus:ring-rose-500",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};