import { apiFetch } from './api';

export type BackendRole = 'professor' | 'aluno';
export type FrontendRole = 'teacher' | 'student';

export type AuthUser = {
  id: string;
  nome: string;
  email: string;
  role: BackendRole;
  ativo: boolean;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type MeResponse = {
  user: AuthUser;
};

export function toFrontendRole(role: BackendRole): FrontendRole {
  return role === 'professor' ? 'teacher' : 'student';
}

export function roleHomePath(role: BackendRole) {
  return `/${toFrontendRole(role)}`;
}

export function login(email: string, senha: string) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}

export function getMe() {
  return apiFetch<MeResponse>('/auth/me');
}
