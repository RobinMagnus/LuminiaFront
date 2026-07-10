import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ApiError } from '../services/api';
import { ErrorState, FeedbackMessage, LoadingState } from './feedback';

describe('feedback visual global', () => {
  test('ErrorState renderiza mensagem normalizada e aciona tentar novamente', () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Falha ao carregar" error={new ApiError('interno', 500)} onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Ocorreu um erro inesperado. Tente novamente.');
    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('FeedbackMessage anuncia sucesso e permite fechar', () => {
    const onClose = vi.fn();
    render(<FeedbackMessage type="success" message="Post criado com sucesso." onClose={onClose} />);

    expect(screen.getByRole('status')).toHaveTextContent('Post criado com sucesso.');
    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('FeedbackMessage de erro usa role alert', () => {
    render(<FeedbackMessage type="error" message="Não foi possível excluir o post." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível excluir o post.');
  });

  test('LoadingState anuncia carregamento', () => {
    render(<LoadingState message="Carregando posts..." />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando posts...');
  });
});
