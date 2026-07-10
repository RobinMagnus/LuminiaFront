import { Aluno, Professor } from '../types/api';
import { apiFetch } from './api';

export function getMeuPerfilAluno() {
  return apiFetch<Aluno>('/alunos/me');
}

export function getMeuPerfilProfessor() {
  return apiFetch<Professor>('/professores/me');
}
