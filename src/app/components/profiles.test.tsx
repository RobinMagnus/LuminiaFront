import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiError } from '../services/api';
import { alunoProfile, alunoUser, professorProfile, professorUser } from '../test/fixtures';
import { StudentProfile } from './StudentScreens';
import { TeacherProfile } from './TeacherScreens';

const getMeuPerfilAlunoMock = vi.fn();
const getMeuPerfilProfessorMock = vi.fn();
let authUser: any = alunoUser;

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: authUser,
    logout: vi.fn(),
  }),
}));

vi.mock('../services/profileService', () => ({
  getMeuPerfilAluno: () => getMeuPerfilAlunoMock(),
  getMeuPerfilProfessor: () => getMeuPerfilProfessorMock(),
}));

function renderProfile(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('perfis integrados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUser = alunoUser;
    getMeuPerfilAlunoMock.mockResolvedValue(alunoProfile);
    getMeuPerfilProfessorMock.mockResolvedValue(professorProfile);
  });

  test('perfil de aluno carrega dados reais sem marcador de integração pendente', async () => {
    renderProfile(<StudentProfile />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando perfil...');
    expect(await screen.findByText('Matrícula: MAT-123')).toBeInTheDocument();
    expect(screen.getByText('Turma: 3A')).toBeInTheDocument();
    expect(screen.queryByText('Demonstração visual — integração pendente')).not.toBeInTheDocument();
    expect(getMeuPerfilAlunoMock).toHaveBeenCalledTimes(1);
    expect(getMeuPerfilProfessorMock).not.toHaveBeenCalled();
  });

  test('perfil de professor carrega matérias e turmas reais', async () => {
    authUser = professorUser;
    renderProfile(<TeacherProfile />);

    expect(await screen.findByText('Matérias: Física')).toBeInTheDocument();
    expect(screen.getByText('Turmas: 3A')).toBeInTheDocument();
    expect(getMeuPerfilProfessorMock).toHaveBeenCalledTimes(1);
    expect(getMeuPerfilAlunoMock).not.toHaveBeenCalled();
  });

  test('perfil de aluno exibe estado sem dados', async () => {
    getMeuPerfilAlunoMock.mockResolvedValueOnce({ ...alunoProfile, matricula: '', turma: undefined, dataNascimento: undefined });
    renderProfile(<StudentProfile />);

    expect(await screen.findByText('Matrícula: Não informada')).toBeInTheDocument();
    expect(screen.getByText('Turma: Não informada')).toBeInTheDocument();
  });

  test('perfil de professor exibe estado vazio', async () => {
    authUser = professorUser;
    getMeuPerfilProfessorMock.mockResolvedValueOnce({ ...professorProfile, materias: [], turmas: [] });
    renderProfile(<TeacherProfile />);

    expect(await screen.findByText('Matérias: Não informadas')).toBeInTheDocument();
    expect(screen.getByText('Turmas: Não informadas')).toBeInTheDocument();
  });

  test('perfil mostra erro acessível quando API falha', async () => {
    getMeuPerfilAlunoMock.mockRejectedValueOnce(new ApiError('não encontrado', 404));
    renderProfile(<StudentProfile />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não encontramos o conteúdo solicitado.');
  });
});
