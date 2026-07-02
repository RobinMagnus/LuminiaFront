import React, { useState } from 'react';
import { Sparkles, Volume2, Square, RotateCcw } from 'lucide-react';

export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "w-full rounded-xl py-3 px-4 font-medium text-center transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90",
    secondary: "bg-primary-light text-primary hover:bg-primary-light/80",
    outline: "border-2 border-border text-foreground hover:border-primary hover:text-primary bg-card",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
  };
  
  return (
    <button className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card = ({ children, className = '', ...props }: any) => {
  return (
    <div className={`bg-card rounded-2xl p-5 shadow-sm border border-border ${className}`} {...props}>
      {children}
    </div>
  );
};

export const Badge = ({ children, variant = 'default', className = '' }: any) => {
  const variants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary-light text-primary",
    success: "bg-[#E6F8F0] text-[#008A56]",
    warning: "bg-[#FFF4E5] text-[#D97706]",
  };
  
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </span>
  );
};

export const AITag = () => (
  <span className="inline-flex items-center gap-1 bg-primary-light text-primary px-2 py-0.5 rounded-md text-xs font-medium">
    <Sparkles size={12} />
    IA
  </span>
);

export const ReadAloudButton = ({ label = "Ouvir texto", className = "" }: { label?: string, className?: string }) => {
  const [state, setState] = useState<'idle' | 'playing'>('idle');

  const toggleState = () => {
    setState(s => s === 'idle' ? 'playing' : 'idle');
  };

  return (
    <button 
      onClick={toggleState}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors border border-transparent hover:border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
        state === 'playing' 
          ? 'bg-primary-light text-primary' 
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      } ${className}`}
      aria-label={state === 'playing' ? 'Pausar leitura' : label}
    >
      {state === 'playing' ? (
        <>
          <Square size={16} fill="currentColor" aria-hidden="true" />
          <span>Pausar leitura</span>
          <RotateCcw size={15} aria-hidden="true" />
          <span className="sr-only">Repetir leitura</span>
        </>
      ) : (
        <>
          <Volume2 size={16} aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

export const StatusTag = ({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "success" | "warning" | "primary" | "danger" }) => (
  <Badge variant={tone === "danger" ? "warning" : tone}>{children}</Badge>
);

export const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <header>
    <h1 className="text-2xl font-medium text-foreground mb-1" tabIndex={0}>{title}</h1>
    {subtitle ? <p className="text-base text-muted-foreground" tabIndex={0}>{subtitle}</p> : null}
  </header>
);

export const ProfileHeader = ({ initials, name, subtitle }: { initials: string; name: string; subtitle: string }) => (
  <div className="flex flex-col items-center text-center bg-card border border-border rounded-2xl p-6 shadow-sm">
    <div className="w-20 h-20 rounded-2xl bg-primary-light text-primary flex items-center justify-center text-2xl font-medium mb-4" aria-hidden="true">
      {initials}
    </div>
    <h1 className="text-2xl font-medium text-foreground">{name}</h1>
    <p className="text-base text-muted-foreground mt-1">{subtitle}</p>
  </div>
);
