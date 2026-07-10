import React, { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2, RotateCcw } from 'lucide-react';
import { AppError, normalizeApiError } from '../services/api';
import { Button, Card } from './ui';

type FeedbackType = 'success' | 'error' | 'warning' | 'info';

const toneClasses: Record<FeedbackType, string> = {
  success: 'border-[#BDEBD8] bg-[#F2FBF7] text-[#006B43]',
  error: 'border-[#FFD1D1] bg-[#FFF5F5] text-accent',
  warning: 'border-[#FFE0AD] bg-[#FFF8ED] text-[#9A5A00]',
  info: 'border-primary-light bg-primary-light text-primary',
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
};

type ErrorStateProps = {
  title?: string;
  message?: string;
  error?: unknown;
  status?: number;
  onRetry?: () => void;
  onBack?: () => void;
  retryLabel?: string;
  backLabel?: string;
  compact?: boolean;
  page?: boolean;
  focusOnMount?: boolean;
  ariaLive?: 'polite' | 'assertive' | 'off';
};

export function ErrorState({
  title = 'Não foi possível concluir a ação',
  message,
  error,
  status,
  onRetry,
  onBack,
  retryLabel = 'Tentar novamente',
  backLabel = 'Voltar',
  compact = false,
  page = false,
  focusOnMount = false,
  ariaLive = 'polite',
}: ErrorStateProps) {
  const normalized: AppError | null = error ? normalizeApiError(error) : null;
  const content = message || normalized?.message || 'Ocorreu um erro inesperado. Tente novamente.';
  const resolvedStatus = status || normalized?.status;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusOnMount) {
      ref.current?.focus();
    }
  }, [focusOnMount]);

  const body = (
    <div
      ref={ref}
      role="alert"
      aria-live={ariaLive}
      tabIndex={focusOnMount ? -1 : undefined}
      className={`rounded-xl border border-[#FFD1D1] bg-[#FFF5F5] text-accent ${compact ? 'p-3' : 'p-4'} focus:outline-none focus:ring-2 focus:ring-primary`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>{title}</h2>
          <p className="mt-1 text-sm">{content}</p>
          {resolvedStatus ? <p className="mt-1 text-xs opacity-80">Código {resolvedStatus}</p> : null}
          {onRetry || onBack ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {onRetry ? (
                <Button type="button" variant="outline" className="!w-auto !py-2 !px-3 bg-card" onClick={onRetry}>
                  <RotateCcw size={16} aria-hidden="true" />
                  <span className="ml-2">{retryLabel}</span>
                </Button>
              ) : null}
              {onBack ? (
                <Button type="button" variant="ghost" className="!w-auto !py-2 !px-3" onClick={onBack}>
                  {backLabel}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (page) {
    return <Card>{body}</Card>;
  }

  return body;
}

type FeedbackMessageProps = {
  type: FeedbackType;
  message: string;
  onClose?: () => void;
  compact?: boolean;
};

export function FeedbackMessage({ type, message, onClose, compact = false }: FeedbackMessageProps) {
  const Icon = icons[type];

  if (!message) {
    return null;
  }

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`rounded-xl border ${toneClasses[type]} ${compact ? 'p-3' : 'p-4'} text-sm`}
    >
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p className="flex-1">{message}</p>
        {onClose ? (
          <button type="button" onClick={onClose} className="rounded-md px-2 text-current focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Fechar aviso">
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function LoadingState({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: React.ReactNode }) {
  return (
    <Card>
      <p className="font-medium">{title}</p>
      {message ? <p className="text-sm text-muted-foreground mt-1">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
