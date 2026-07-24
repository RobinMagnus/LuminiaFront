import { Comentario } from '../services/comentarioService';
import { ContentItem } from '../services/postService';
import { Aluno, Professor, Usuario } from '../types/api';

export const professorUser: Usuario = {
  id: 'professor-1',
  nome: 'Professor Teste',
  email: 'professor@luminia.test',
  role: 'professor',
  ativo: true,
};

export const alunoUser: Usuario = {
  id: 'aluno-1',
  nome: 'Aluno Teste',
  email: 'aluno@luminia.test',
  role: 'aluno',
  ativo: true,
};

export const authToken = 'token-de-teste';

export const postItem: ContentItem = {
  id: 'post-1',
  authorId: professorUser.id,
  title: 'Leis de Newton',
  subject: 'Física',
  className: 'Todas as turmas',
  teacher: professorUser.nome,
  publishedAt: '09/07',
  text: 'Conteúdo sobre força e aceleração.',
  related: ['Exercícios de revisão'],
  visibility: 'todos',
  tags: ['fisica'],
  videoLinks: [],
};

export const alunoProfile: Aluno = {
  _id: 'perfil-aluno-1',
  userId: {
    _id: alunoUser.id,
    nome: alunoUser.nome,
    email: alunoUser.email,
    role: alunoUser.role,
    ativo: true,
  },
  nome: alunoUser.nome,
  matricula: 'MAT-123',
  turma: '3A',
  dataNascimento: '2010-05-01T00:00:00.000Z',
};

export const professorProfile: Professor = {
  _id: 'perfil-professor-1',
  userId: {
    _id: professorUser.id,
    nome: professorUser.nome,
    email: professorUser.email,
    role: professorUser.role,
    ativo: true,
  },
  nome: professorUser.nome,
  materias: ['Física'],
  turmas: ['3A'],
  dataNascimento: '1985-02-03T00:00:00.000Z',
};

export const comentarioPermitido: Comentario = {
  _id: 'comentario-1',
  postId: 'post-1',
  conteudo: 'Comentário inicial',
  autor: {
    _id: alunoUser.id,
    nome: alunoUser.nome,
    role: 'aluno',
  },
  criadoEm: '2026-07-09T20:00:00.000Z',
  atualizadoEm: '2026-07-09T20:00:00.000Z',
  podeEditar: true,
  podeExcluir: true,
};
