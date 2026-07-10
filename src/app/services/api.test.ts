import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AUTH_EXPIRED_EVENT, AUTH_TOKEN_KEY, ApiError, apiFetch, clearAuthToken, getAuthToken, normalizeApiError, setAuthToken } from './api';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('apiFetch e normalização de erros', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('envia token salvo no localStorage', async () => {
    setAuthToken('token-123');
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ok: true }));

    await apiFetch('/posts');

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/posts', expect.objectContaining({
      headers: expect.any(Headers),
    }));
    const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token-123');
  });

  test.each([
    [400, 'Verifique os dados informados.'],
    [401, 'Sua sessão expirou. Entre novamente.'],
    [403, 'Você não tem permissão para realizar esta ação.'],
    [404, 'Não encontramos o conteúdo solicitado.'],
    [409, 'Não foi possível concluir porque há um conflito nos dados.'],
    [422, 'Alguns campos precisam ser corrigidos.'],
    [429, 'Muitas tentativas. Aguarde um momento e tente novamente.'],
    [500, 'Ocorreu um erro inesperado. Tente novamente.'],
  ])('normaliza status %s', (status, message) => {
    expect(normalizeApiError(new ApiError('mensagem técnica', status)).message).toBe(message);
  });

  test('normaliza falha de rede e timeout', () => {
    expect(normalizeApiError(new TypeError('fetch failed')).message).toBe('Não foi possível conectar ao servidor.');
    expect(normalizeApiError(new DOMException('Aborted', 'AbortError')).message).toBe('A operação demorou mais que o esperado.');
  });

  test('401 fora do login emite evento de sessão expirada sem limpar token diretamente', async () => {
    setAuthToken('token-123');
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ mensagem: 'jwt inválido' }, 401));

    await expect(apiFetch('/auth/me')).rejects.toMatchObject({ status: 401 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getAuthToken()).toBe('token-123');
    clearAuthToken();
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });

  test('403 não emite evento de sessão expirada', async () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ mensagem: 'sem permissão' }, 403));

    await expect(apiFetch('/posts')).rejects.toMatchObject({ status: 403 });

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });
});
