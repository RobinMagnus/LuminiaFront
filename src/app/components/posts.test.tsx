import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiError } from '../services/api';
import { alunoUser, postItem, professorUser } from '../test/fixtures';
import { StudentContents } from './StudentScreens';
import { TeacherContentForm, TeacherContents } from './TeacherScreens';

const navigateMock = vi.fn();
const listPostsMock = vi.fn();
const getPostMock = vi.fn();
const createPostMock = vi.fn();
const updatePostMock = vi.fn();
const deletePostMock = vi.fn();
const listReadingsMock = vi.fn();
let authUser: any = professorUser;

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: authUser,
    logout: vi.fn(),
  }),
}));

vi.mock('../services/postService', () => ({
  listPosts: () => listPostsMock(),
  getPost: (id: string) => getPostMock(id),
  createPost: (payload: unknown) => createPostMock(payload),
  updatePost: (id: string, payload: unknown) => updatePostMock(id, payload),
  deletePost: (id: string) => deletePostMock(id),
  listMinhasLeituras: () => listReadingsMock(),
  marcarPostComoLido: vi.fn(),
  marcarPostComoNaoLido: vi.fn(),
}));

vi.mock('../services/academicService', () => ({
  listDisciplinas: () => Promise.resolve({
    dados: [{
      _id: 'disciplina-1',
      codigo: 'FIS',
      nome: 'Física',
      cargaHoraria: 60,
      turmaIds: [],
      ativa: true,
      professorId: 'professor-1',
    }],
    paginacao: { pagina: 1, limite: 100, total: 1, totalPaginas: 1, itens: 1 },
  }),
}));

function renderWithRouter(ui: React.ReactElement, route = '/') {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

function renderForm(route = '/teacher/content/new') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/teacher/content/new" element={<TeacherContentForm />} />
        <Route path="/teacher/content/:id/edit" element={<TeacherContentForm />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('posts e conteúdos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUser = professorUser;
    listPostsMock.mockResolvedValue([postItem]);
    getPostMock.mockResolvedValue(postItem);
    createPostMock.mockResolvedValue({ mensagem: 'Post criado com sucesso.', post: postItem });
    updatePostMock.mockResolvedValue({ mensagem: 'Post atualizado com sucesso.', post: postItem });
    deletePostMock.mockResolvedValue({ mensagem: 'Post excluído com sucesso.' });
    listReadingsMock.mockResolvedValue([]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  test('lista posts para aluno sem ações de professor', async () => {
    authUser = alunoUser;
    renderWithRouter(<StudentContents />);

    expect(screen.getByText('Carregando conteúdos...')).toBeInTheDocument();
    expect(await screen.findByText('Leis de Newton')).toBeInTheDocument();
    expect(screen.getByText('Professor Teste | 09/07')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /novo conteúdo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });

  test('renderiza lista vazia sem dados mockados', async () => {
    listPostsMock.mockResolvedValueOnce([]);
    renderWithRouter(<StudentContents />);

    expect(await screen.findByText('Nenhum conteúdo disponível.')).toBeInTheDocument();
    expect(screen.queryByText('Leis de Newton')).not.toBeInTheDocument();
  });

  test('erro ao listar mostra ação de tentar novamente', async () => {
    listPostsMock
      .mockRejectedValueOnce(new ApiError('falha', 500))
      .mockResolvedValueOnce([postItem]);
    renderWithRouter(<StudentContents />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Ocorreu um erro inesperado. Tente novamente.');
    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(await screen.findByText('Leis de Newton')).toBeInTheDocument();
    expect(listPostsMock).toHaveBeenCalledTimes(2);
  });

  test('professor vê criar, editar e excluir quando é autor', async () => {
    renderWithRouter(<TeacherContents />);

    expect(await screen.findByText('Leis de Newton')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo conteúdo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
  });

  test('professor não vê editar/excluir post de outro autor', async () => {
    listPostsMock.mockResolvedValueOnce([{ ...postItem, authorId: 'outro-professor' }]);
    renderWithRouter(<TeacherContents />);

    expect(await screen.findByText('Leis de Newton')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
  });

  test('exclui post com confirmação e atualiza lista', async () => {
    renderWithRouter(<TeacherContents />);

    await screen.findByText('Leis de Newton');
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(deletePostMock).toHaveBeenCalledWith('post-1'));
    expect(await screen.findByText('Post excluído com sucesso.')).toBeInTheDocument();
    expect(screen.queryByText('Leis de Newton')).not.toBeInTheDocument();
  });

  test('cancela exclusão sem chamar API', async () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    renderWithRouter(<TeacherContents />);

    await screen.findByText('Leis de Newton');
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(deletePostMock).not.toHaveBeenCalled();
  });

  test('mostra erro ao excluir sem remover item', async () => {
    deletePostMock.mockRejectedValueOnce(new ApiError('sem permissão', 403));
    renderWithRouter(<TeacherContents />);

    await screen.findByText('Leis de Newton');
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Você não tem permissão para realizar esta ação.');
    expect(screen.getByText('Leis de Newton')).toBeInTheDocument();
  });

  test('cria post validando campos e enviando payload', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Publicar conteúdo' }));
    expect(await screen.findByText('Título e texto do conteúdo são obrigatórios.')).toBeInTheDocument();
    expect(createPostMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Novo post' } });
    fireEvent.change(screen.getByLabelText('Texto do conteúdo'), { target: { value: 'Texto do post' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publicar conteúdo' }));

    await waitFor(() => expect(createPostMock).toHaveBeenCalledWith(expect.objectContaining({
      titulo: 'Novo post',
      conteudo: 'Texto do post',
    })));
    expect(navigateMock).toHaveBeenCalledWith('/teacher/contents');
  });

  test.each([
    [400, 'Verifique os dados informados.'],
    [403, 'Você não tem permissão para realizar esta ação.'],
    [500, 'Ocorreu um erro inesperado. Tente novamente.'],
  ])('mostra erro %s ao criar post', async (status, message) => {
    createPostMock.mockRejectedValueOnce(new ApiError('falha', status));
    renderForm();

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Novo post' } });
    fireEvent.change(screen.getByLabelText('Texto do conteúdo'), { target: { value: 'Texto do post' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publicar conteúdo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  test('carrega dados e edita post com sucesso', async () => {
    renderForm('/teacher/content/post-1/edit');

    expect(await screen.findByDisplayValue('Leis de Newton')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Leis atualizadas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(updatePostMock).toHaveBeenCalledWith('post-1', expect.objectContaining({
      titulo: 'Leis atualizadas',
    })));
    expect(navigateMock).toHaveBeenCalledWith('/teacher/contents');
  });

  test('preserva dados ao falhar edição', async () => {
    updatePostMock.mockRejectedValueOnce(new ApiError('sem permissão', 403));
    renderForm('/teacher/content/post-1/edit');

    expect(await screen.findByDisplayValue('Leis de Newton')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Leis atualizadas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Você não tem permissão para realizar esta ação.');
    expect(screen.getByDisplayValue('Leis atualizadas')).toBeInTheDocument();
  });
});
