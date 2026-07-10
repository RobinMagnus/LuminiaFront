import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AUTH_EXPIRED_EVENT, AUTH_TOKEN_KEY, ApiError } from '../services/api';
import { alunoUser, authToken, professorUser } from '../test/fixtures';
import { AuthProvider, useAuth } from './AuthContext';

const getMeMock = vi.fn();
const loginMock = vi.fn();

vi.mock('../services/authService', async importOriginal => {
  const actual = await importOriginal<typeof import('../services/authService')>();
  return {
    ...actual,
    getMe: () => getMeMock(),
    login: (email: string, senha: string) => loginMock(email, senha),
  };
});

function AuthProbe() {
  const { user, token, role, isAuthenticated, isLoading, sessionMessage, login, logout } = useAuth();

  return (
    <div>
      <p>loading: {String(isLoading)}</p>
      <p>authenticated: {String(isAuthenticated)}</p>
      <p>user: {user?.nome || 'sem usuário'}</p>
      <p>role: {role || 'sem role'}</p>
      <p>token: {token || 'sem token'}</p>
      <p>message: {sessionMessage || 'sem mensagem'}</p>
      <button type="button" onClick={() => login('professor@luminia.test', '123456')}>login</button>
      <button type="button" onClick={logout}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('restaura sessão válida com token salvo', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
    getMeMock.mockResolvedValueOnce({ user: professorUser });

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    expect(screen.getByText('loading: true')).toBeInTheDocument();
    expect(await screen.findByText('user: Professor Teste')).toBeInTheDocument();
    expect(screen.getByText('authenticated: true')).toBeInTheDocument();
    expect(screen.getByText('role: professor')).toBeInTheDocument();
  });

  test('inicia sem autenticação quando não há token', async () => {
    render(<AuthProvider><AuthProbe /></AuthProvider>);

    await waitFor(() => expect(screen.getByText('loading: false')).toBeInTheDocument());
    expect(getMeMock).not.toHaveBeenCalled();
    expect(screen.getByText('authenticated: false')).toBeInTheDocument();
  });

  test('remove sessão quando token expira', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
    getMeMock.mockRejectedValueOnce(new ApiError('jwt expirado', 401));

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    expect(await screen.findByText('message: Sua sessão expirou. Entre novamente.')).toBeInTheDocument();
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(screen.getByText('authenticated: false')).toBeInTheDocument();
  });

  test('encerra sessão em erro de rede durante restauração conforme política atual', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
    getMeMock.mockRejectedValueOnce(new TypeError('fetch failed'));

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    await waitFor(() => expect(screen.getByText('loading: false')).toBeInTheDocument());
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(screen.getByText('authenticated: false')).toBeInTheDocument();
  });

  test('login salva sessão e logout limpa estados', async () => {
    loginMock.mockResolvedValueOnce({ token: authToken, user: alunoUser });

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('loading: false')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'login' }));
    expect(await screen.findByText('user: Aluno Teste')).toBeInTheDocument();
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe(authToken);

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));
    expect(screen.getByText('user: sem usuário')).toBeInTheDocument();
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  test('evento global de 401 limpa sessão uma única vez', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
    getMeMock.mockResolvedValueOnce({ user: professorUser });

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    expect(await screen.findByText('authenticated: true')).toBeInTheDocument();

    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));

    expect(await screen.findByText('message: Sua sessão expirou. Entre novamente.')).toBeInTheDocument();
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });
});
