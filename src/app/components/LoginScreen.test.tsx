import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiError } from '../services/api';
import { alunoUser, professorUser } from '../test/fixtures';
import { LoginScreen } from './LoginScreen';

const navigateMock = vi.fn();
const loginMock = vi.fn();
const clearSessionMessageMock = vi.fn();

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
    user: null,
    isLoading: false,
    sessionMessage: '',
    clearSessionMessage: clearSessionMessageMock,
  }),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginScreen />
    </MemoryRouter>,
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('faz login de professor com sucesso e redireciona', async () => {
    loginMock.mockResolvedValueOnce(professorUser);
    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'professor@luminia.test' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('professor@luminia.test', '123456'));
    expect(navigateMock).toHaveBeenCalledWith('/teacher', { replace: true });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('faz login de aluno com sucesso e redireciona', async () => {
    loginMock.mockResolvedValueOnce(alunoUser);
    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'aluno@luminia.test' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('aluno@luminia.test', '123456'));
    expect(navigateMock).toHaveBeenCalledWith('/student', { replace: true });
  });

  test('mostra erro acessível para credenciais inválidas sem redirecionar', async () => {
    loginMock.mockRejectedValueOnce(new ApiError('Credenciais inválidas', 401));
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha inválidos.');
    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  test('mostra erro de rede preservando formulário', async () => {
    loginMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'aluno@luminia.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor.');
    expect(screen.getByLabelText('Email')).toHaveValue('aluno@luminia.test');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  test('bloqueia envio duplicado durante requisição', async () => {
    let resolveLogin: (value: typeof professorUser) => void = () => {};
    loginMock.mockImplementationOnce(() => new Promise(resolve => {
      resolveLogin = resolve;
    }));
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Entrando...' }));
    expect(loginMock).toHaveBeenCalledTimes(1);

    resolveLogin(professorUser);
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/teacher', { replace: true }));
  });

  test('valida campos obrigatórios antes de enviar', async () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe seu email.')).toBeInTheDocument();
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });
});
