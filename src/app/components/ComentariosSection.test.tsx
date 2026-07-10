import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiError } from '../services/api';
import { ComentariosSection } from './ComentariosSection';

const navigateMock = vi.fn();
const logoutMock = vi.fn();

const listarComentariosMock = vi.fn();
const criarComentarioMock = vi.fn();
const atualizarComentarioMock = vi.fn();
const excluirComentarioMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    logout: logoutMock,
  }),
}));

vi.mock('../services/comentarioService', () => ({
  listarComentarios: (...args: unknown[]) => listarComentariosMock(...args),
  criarComentario: (...args: unknown[]) => criarComentarioMock(...args),
  atualizarComentario: (...args: unknown[]) => atualizarComentarioMock(...args),
  excluirComentario: (...args: unknown[]) => excluirComentarioMock(...args),
}));

const comentarioPermitido = {
  _id: 'comentario-1',
  postId: 'post-1',
  conteudo: 'Comentário inicial',
  autor: {
    _id: 'user-1',
    nome: 'Aluno Teste',
    role: 'aluno' as const,
  },
  criadoEm: '2026-07-09T20:00:00.000Z',
  atualizadoEm: '2026-07-09T20:00:00.000Z',
  podeEditar: true,
  podeExcluir: true,
};

const comentarioSemPermissao = {
  ...comentarioPermitido,
  _id: 'comentario-2',
  conteudo: 'Comentário de outra pessoa',
  podeEditar: false,
  podeExcluir: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  listarComentariosMock.mockResolvedValue({ dados: [comentarioPermitido] });
  criarComentarioMock.mockResolvedValue({
    mensagem: 'Comentário criado com sucesso.',
    dados: {
      ...comentarioPermitido,
      _id: 'comentario-3',
      conteudo: 'Novo comentário',
    },
  });
  atualizarComentarioMock.mockResolvedValue({
    mensagem: 'Comentário atualizado com sucesso.',
    dados: {
      ...comentarioPermitido,
      conteudo: 'Comentário editado',
    },
  });
  excluirComentarioMock.mockResolvedValue({ mensagem: 'Comentário excluído com sucesso.' });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('ComentariosSection', () => {
  test('renderiza lista de comentários', async () => {
    render(<ComentariosSection postId="post-1" />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando comentários...');
    expect(await screen.findByText('Comentário inicial')).toBeInTheDocument();
    expect(screen.getByText('Aluno Teste')).toBeInTheDocument();
    expect(screen.getByText('Aluno')).toBeInTheDocument();
  });

  test('renderiza comentário de professor', async () => {
    listarComentariosMock.mockResolvedValueOnce({
      dados: [{
        ...comentarioPermitido,
        autor: { _id: 'professor-1', nome: 'Professor Teste', role: 'professor' as const },
      }],
    });

    render(<ComentariosSection postId="post-1" />);

    expect(await screen.findByText('Professor Teste')).toBeInTheDocument();
    expect(screen.getByText('Professor')).toBeInTheDocument();
  });

  test('renderiza estado vazio', async () => {
    listarComentariosMock.mockResolvedValueOnce({ dados: [] });

    render(<ComentariosSection postId="post-1" />);

    expect(await screen.findByText('Ainda não há comentários neste post.')).toBeInTheDocument();
    expect(screen.getByText('Seja a primeira pessoa a comentar.')).toBeInTheDocument();
  });

  test('envia comentário e mostra contador', async () => {
    render(<ComentariosSection postId="post-1" />);

    await screen.findByText('Comentário inicial');
    const campo = screen.getByLabelText('Novo comentário');
    fireEvent.change(campo, { target: { value: 'Novo comentário' } });

    expect(screen.getByText('15/1000')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(criarComentarioMock).toHaveBeenCalledWith('post-1', 'Novo comentário');
    });
    expect(await screen.findByText('Comentário criado com sucesso.')).toBeInTheDocument();
  });

  test('valida campo vazio antes de enviar', async () => {
    render(<ComentariosSection postId="post-1" />);

    await screen.findByText('Comentário inicial');
    const campo = screen.getByLabelText('Novo comentário');
    fireEvent.change(campo, { target: { value: '   ' } });
    fireEvent.submit(campo.closest('form')!);

    expect(await screen.findByText('O conteúdo do comentário é obrigatório.')).toBeInTheDocument();
    expect(criarComentarioMock).not.toHaveBeenCalled();
  });

  test('edita comentário permitido', async () => {
    render(<ComentariosSection postId="post-1" />);

    await screen.findByText('Comentário inicial');
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText('Editar comentário'), { target: { value: 'Comentário editado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(atualizarComentarioMock).toHaveBeenCalledWith('comentario-1', 'Comentário editado');
    });
    expect(await screen.findByText('Comentário atualizado com sucesso.')).toBeInTheDocument();
  });

  test('exclui comentário permitido', async () => {
    render(<ComentariosSection postId="post-1" />);

    await screen.findByText('Comentário inicial');
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(excluirComentarioMock).toHaveBeenCalledWith('comentario-1');
    });
    expect(await screen.findByText('Comentário excluído com sucesso.')).toBeInTheDocument();
  });

  test('cancela exclusão de comentário', async () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);

    render(<ComentariosSection postId="post-1" />);

    await screen.findByText('Comentário inicial');
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(excluirComentarioMock).not.toHaveBeenCalled();
    expect(screen.getByText('Comentário inicial')).toBeInTheDocument();
  });

  test('esconde ações sem permissão', async () => {
    listarComentariosMock.mockResolvedValueOnce({ dados: [comentarioSemPermissao] });

    render(<ComentariosSection postId="post-1" />);

    expect(await screen.findByText('Comentário de outra pessoa')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
  });

  test('trata erro 403 sem redirecionar', async () => {
    listarComentariosMock.mockRejectedValueOnce(new ApiError('Sem permissão', 403));

    render(<ComentariosSection postId="post-1" />);

    expect(await screen.findByText('Você não tem permissão para realizar esta ação.')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  test('trata erro 401 com logout e redirecionamento', async () => {
    listarComentariosMock.mockRejectedValueOnce(new ApiError('Token inválido', 401));

    render(<ComentariosSection postId="post-1" />);

    expect(await screen.findByText('Sua sessão expirou. Entre novamente.')).toBeInTheDocument();
    expect(logoutMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
  });

  test('trata erro de rede ao listar', async () => {
    listarComentariosMock.mockRejectedValueOnce(new TypeError('fetch failed'));

    render(<ComentariosSection postId="post-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor.');
  });
});
