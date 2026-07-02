import React, { useState } from 'react';
import { ArrowRight, BookOpen, Sparkles, Target } from 'lucide-react';
import { Card, ReadAloudButton } from './ui';

export const AIFeedbackCard = ({
  feedback,
  pointsToStudy,
  relatedContent,
}: {
  feedback: string;
  pointsToStudy: string[];
  relatedContent: string[];
}) => {
  const [level, setLevel] = useState<'simples' | 'resumida' | 'detalhada'>('resumida');

  return (
    <Card className="border-primary/20 bg-primary-light/10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <div className="flex items-center gap-2 text-primary mb-4">
        <Sparkles size={20} aria-hidden="true" />
        <h3 className="font-medium text-lg">Feedback da IA Luminia</h3>
      </div>

      <div className="flex gap-2 mb-4 bg-muted p-1 rounded-xl" role="tablist" aria-label="Nível de detalhe do feedback">
        {(['simples', 'resumida', 'detalhada'] as const).map(option => (
          <button
            key={option}
            role="tab"
            aria-selected={level === option}
            onClick={() => setLevel(option)}
            className={`flex-1 text-sm py-1.5 rounded-lg capitalize transition-colors ${level === option ? 'bg-card text-primary shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="text-foreground text-base leading-relaxed mb-4" aria-live="polite">
        {level === 'simples' && "Você confundiu a fórmula principal, mas a ideia inicial estava no caminho. Revise com calma e tente novamente."}
        {level === 'resumida' && feedback}
        {level === 'detalhada' && `${feedback} Primeiro identifique a fórmula, depois substitua os valores e isole a variável. A IA apoia o estudo, mas a decisão final da nota continua com o professor.`}
      </div>

      <div className="mb-6">
        <ReadAloudButton label="Ouvir feedback" />
      </div>

      <div className="mb-6 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-base font-medium text-foreground">
            <Target size={18} className="text-accent" aria-hidden="true" />
            <span>Pontos para estudar</span>
          </div>
          <ReadAloudButton label="Ouvir texto" className="!bg-transparent !border-none !p-1 hover:!bg-muted" />
        </div>
        <ul className="space-y-3">
          {pointsToStudy.map(point => (
            <li key={point} className="text-base text-foreground flex items-start gap-3">
              <span className="text-accent mt-1" aria-hidden="true">-</span> {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-5 border-t border-border/50">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-base font-medium text-foreground">
            <BookOpen size={18} className="text-secondary" aria-hidden="true" />
            <span>Conteúdos relacionados</span>
          </div>
          <ReadAloudButton label="Ouvir texto" className="!bg-transparent !border-none !p-1 hover:!bg-muted" />
        </div>
        <div className="space-y-3">
          {relatedContent.map(content => (
            <div
              key={content}
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              role="button"
              tabIndex={0}
              aria-label={`Abrir conteúdo relacionado: ${content}`}
            >
              <span className="text-base text-foreground font-medium">{content}</span>
              <ArrowRight size={20} className="text-muted-foreground" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
