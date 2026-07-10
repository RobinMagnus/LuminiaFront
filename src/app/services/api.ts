import { API_URL } from '../config/api';

export const AUTH_TOKEN_KEY = 'luminia:authToken';
export const AUTH_EXPIRED_EVENT = 'luminia:auth-expired';

export type AppError = {
  status?: number;
  code?: string;
  message: string;
  details?: unknown;
  retryable?: boolean;
};

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Verifique os dados informados.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Não encontramos o conteúdo solicitado.',
  409: 'Não foi possível concluir porque há um conflito nos dados.',
  422: 'Alguns campos precisam ser corrigidos.',
  429: 'Muitas tentativas. Aguarde um momento e tente novamente.',
  500: 'Ocorreu um erro inesperado. Tente novamente.',
};

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  retryable: boolean;

  constructor(message: string, status?: number, options: Omit<AppError, 'message' | 'status'> = {}) {
    super(message || normalizeStatusMessage(status));
    this.name = 'ApiError';
    this.status = status;
    this.code = options.code;
    this.details = options.details;
    this.retryable = options.retryable ?? isRetryableStatus(status);
  }
}

function isRetryableStatus(status?: number) {
  return !status || status === 408 || status === 429 || status >= 500;
}

function normalizeStatusMessage(status?: number) {
  if (!status) {
    return 'Não foi possível conectar ao servidor.';
  }

  return STATUS_MESSAGES[status] || 'Erro ao comunicar com a API.';
}

function sanitizeApiMessage(message: unknown, status?: number) {
  if (typeof message !== 'string' || !message.trim()) {
    return normalizeStatusMessage(status);
  }

  const normalized = message.trim();
  const lower = normalized.toLowerCase();

  if (lower.includes('stack') || lower.includes('token') || lower.includes('jwt')) {
    return normalizeStatusMessage(status);
  }

  return normalized;
}

export function normalizeApiError(error: unknown): AppError {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      code: error.code,
      message: error.status ? normalizeStatusMessage(error.status) : error.message || normalizeStatusMessage(error.status),
      details: error.details,
      retryable: error.retryable,
    };
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      code: 'timeout',
      message: 'A operação demorou mais que o esperado.',
      retryable: true,
    };
  }

  if (error instanceof TypeError) {
    return {
      code: 'network_error',
      message: 'Não foi possível conectar ao servidor.',
      retryable: true,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'unknown_error',
      message: sanitizeApiMessage(error.message),
      retryable: true,
    };
  }

  return {
    code: 'unknown_error',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
    retryable: true,
  };
}

export function getFriendlyErrorMessage(error: unknown) {
  return normalizeApiError(error).message;
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    const appError = normalizeApiError(error);
    throw new ApiError(appError.message, appError.status, appError);
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  try {
    data = contentType.includes('application/json') ? await response.json() : null;
  } catch (error) {
    throw new ApiError('A API retornou uma resposta inválida.', response.status, {
      code: 'invalid_response',
      retryable: true,
      details: error,
    });
  }

  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login') {
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }

    throw new ApiError(sanitizeApiMessage(data?.mensagem, response.status), response.status, {
      details: data?.erros,
      retryable: isRetryableStatus(response.status),
    });
  }

  return data as T;
}
