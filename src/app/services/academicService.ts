import { apiFetch } from './api';
import { Atividade, Boletim, Correcao, Disciplina, Entrega, EventoCronograma, ListaPaginada, Turma } from '../types/api';

const query = (params: Record<string, string | number | undefined> = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => value !== undefined && search.set(key, String(value)));
  const value = search.toString();
  return value ? `?${value}` : '';
};

export const listAtividades = (params?: Record<string, string | number | undefined>) =>
  apiFetch<ListaPaginada<Atividade>>(`/atividades${query({ limite: 100, ...params })}`);
export const getAtividade = (id: string) => apiFetch<Atividade>(`/atividades/${id}`);
export const createAtividade = (data: Omit<Atividade, '_id' | 'professorId' | 'createdAt'>) =>
  apiFetch<{ mensagem: string; atividade: Atividade }>('/atividades', { method: 'POST', body: JSON.stringify(data) });
export const createEntrega = (atividadeId: string, resposta: string) =>
  apiFetch<{ mensagem: string; entrega: Entrega }>(`/atividades/${atividadeId}/entregas`, { method: 'POST', body: JSON.stringify({ resposta }) });
export const listEntregasAtividade = (atividadeId: string) =>
  apiFetch<ListaPaginada<Entrega>>(`/atividades/${atividadeId}/entregas?limite=100`);
export const listMinhasEntregas = () => apiFetch<ListaPaginada<Entrega>>('/entregas/me?limite=100');
export const getCorrecao = (entregaId: string) => apiFetch<Correcao>(`/entregas/${entregaId}/correcao`);
export const saveCorrecao = (entregaId: string, nota: number, feedback: string) =>
  apiFetch<{ mensagem: string; correcao: Correcao }>(`/entregas/${entregaId}/correcao`, { method: 'PUT', body: JSON.stringify({ nota, feedback }) });
export const getMeuBoletim = () => apiFetch<Boletim>('/boletins/me');
export const listCronograma = () => apiFetch<ListaPaginada<EventoCronograma>>('/cronograma?limite=100&ordenarPor=inicio&ordem=asc');
export const listTurmas = () => apiFetch<ListaPaginada<Turma>>('/turmas?limite=100&ordenarPor=nome&ordem=asc');
export const getTurma = (id: string) => apiFetch<Turma>(`/turmas/${id}`);
export const listDisciplinas = (turmaId?: string) =>
  apiFetch<ListaPaginada<Disciplina>>(`/disciplinas${query({ limite: 100, ordenarPor: 'nome', ordem: 'asc', turmaId })}`);
