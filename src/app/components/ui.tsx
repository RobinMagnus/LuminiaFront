import React, { useEffect, useId, useRef, useState } from 'react';
import { Pencil, Sparkles, Volume2, Square } from 'lucide-react';

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

const SPEECH_STARTED_EVENT = 'luminia:speech-started';
let activeSpeechId: string | null = null;

export const ReadAloudButton = ({
  text,
  label = "Ouvir texto",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) => {
  const speechId = useId();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && 'SpeechSynthesisUtterance' in window;

  useEffect(() => {
    const handleAnotherSpeech = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== speechId) {
        setIsSpeaking(false);
      }
    };

    window.addEventListener(SPEECH_STARTED_EVENT, handleAnotherSpeech);
    return () => {
      window.removeEventListener(SPEECH_STARTED_EVENT, handleAnotherSpeech);
      if (activeSpeechId === speechId && isSupported) {
        window.speechSynthesis.cancel();
        activeSpeechId = null;
      }
    };
  }, [isSupported, speechId]);

  const stopReading = () => {
    window.speechSynthesis.cancel();
    activeSpeechId = null;
    utteranceRef.current = null;
    setIsSpeaking(false);
  };

  const startReading = () => {
    if (!isSupported || !text.trim()) return;

    window.dispatchEvent(new CustomEvent(SPEECH_STARTED_EVENT, { detail: speechId }));
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.lang.toLowerCase() === 'pt-br')
      || voices.find(voice => voice.lang.toLowerCase().startsWith('pt'))
      || null;
    utterance.lang = utterance.voice?.lang || 'pt-BR';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const finish = () => {
      if (activeSpeechId === speechId) activeSpeechId = null;
      utteranceRef.current = null;
      setIsSpeaking(false);
    };
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = finish;
    utterance.onerror = finish;

    activeSpeechId = speechId;
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button 
      type="button"
      onClick={isSpeaking ? stopReading : startReading}
      disabled={!isSupported || !text.trim()}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors border border-transparent hover:border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
        isSpeaking
          ? 'bg-primary-light text-primary' 
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      } ${className}`}
      aria-label={isSpeaking ? 'Parar leitura' : label}
      aria-pressed={isSpeaking}
      title={!isSupported ? 'Síntese de voz não disponível neste navegador' : undefined}
    >
      {isSpeaking ? (
        <>
          <Square size={16} fill="currentColor" aria-hidden="true" />
          <span>Parar leitura</span>
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

export const ProfileHeader = ({ initials, name, subtitle, photo, photoInputId, isSavingPhoto = false }: { initials: string; name: string; subtitle: string; photo?: string; photoInputId?: string; isSavingPhoto?: boolean }) => (
  <div className="flex flex-col items-center text-center bg-card border border-border rounded-2xl p-6 shadow-sm">
    <div className="relative mb-4">
      {photo ? <img src={photo} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-primary-light" /> : (
        <div className="w-20 h-20 rounded-2xl bg-primary-light text-primary flex items-center justify-center text-2xl font-medium" aria-hidden="true">
          {initials}
        </div>
      )}
      {photoInputId ? (
        <label
          htmlFor={photoInputId}
          className={`absolute -right-2 -top-2 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary text-white shadow-md transition-colors hover:bg-primary/90 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${isSavingPhoto ? 'pointer-events-none opacity-60' : ''}`}
          aria-label={isSavingPhoto ? 'Salvando foto' : photo ? 'Trocar foto do perfil' : 'Adicionar foto ao perfil'}
          title={isSavingPhoto ? 'Salvando foto' : photo ? 'Trocar foto' : 'Adicionar foto'}
        >
          <Pencil size={17} aria-hidden="true" />
        </label>
      ) : null}
    </div>
    <h1 className="text-2xl font-medium text-foreground">{name}</h1>
    <p className="text-base text-muted-foreground mt-1">{subtitle}</p>
  </div>
);
