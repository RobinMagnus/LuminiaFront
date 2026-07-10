import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { alunoUser, professorUser } from './test/fixtures';
import { ProtectedRoute } from './App';

let authState: any;

vi.mock('./contexts/AuthContext', () => ({
  useAuth: () => authState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderProtected(role: 'aluno' | 'professor') {
  return render(
    <MemoryRouter initialEntries={[role === 'aluno' ? '/student' : '/teacher']}>
      <ProtectedRoute role={role}>
        <p>Conteúdo protegido</p>
      </ProtectedRoute>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authState = {
      user: null,
      isLoading: false,
    };
  });

  test('redireciona usuário não autenticado para login', () => {
    renderProtected('aluno');

    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  test('exibe loading durante restauração sem mostrar conteúdo protegido', () => {
    authState = { user: null, isLoading: true };
    renderProtected('professor');

    expect(screen.getByRole('status')).toHaveTextContent('Carregando sessão...');
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  test('permite aluno em rota de aluno', () => {
    authState = { user: alunoUser, isLoading: false };
    renderProtected('aluno');

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });

  test('permite professor em rota de professor', () => {
    authState = { user: professorUser, isLoading: false };
    renderProtected('professor');

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });

  test('nega acesso de aluno à área de professor', () => {
    authState = { user: alunoUser, isLoading: false };
    renderProtected('professor');

    expect(screen.getByRole('alert')).toHaveTextContent('Acesso negado');
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  test('nega acesso de professor à área de aluno', () => {
    authState = { user: professorUser, isLoading: false };
    renderProtected('aluno');

    expect(screen.getByRole('alert')).toHaveTextContent('Você não tem permissão para acessar esta área.');
  });
});
