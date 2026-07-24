import { Aluno, Professor } from '../types/api';
import { apiFetch } from './api';

export function getMeuPerfilAluno() {
  return apiFetch<Aluno>('/alunos/me');
}

export function updateMeuPerfilAluno(id: string, fotoPerfil: string) {
  return apiFetch<{ mensagem: string; aluno: Aluno }>(`/alunos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ fotoPerfil }),
  });
}

export function getMeuPerfilProfessor() {
  return apiFetch<Professor>('/professores/me');
}

export function updateMeuPerfilProfessor(id: string, fotoPerfil: string) {
  return apiFetch<{ mensagem: string; professor: Professor }>(`/professores/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ fotoPerfil }),
  });
}
