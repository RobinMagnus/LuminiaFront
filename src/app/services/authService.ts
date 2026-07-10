import { apiFetch } from './api';
import { LoginResponse, Role, Usuario } from '../types/api';

export type BackendRole = Role;
export type FrontendRole = 'teacher' | 'student';

export type AuthUser = Usuario;

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
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}

export function getMe() {
  return apiFetch<MeResponse>('/auth/me');
}
