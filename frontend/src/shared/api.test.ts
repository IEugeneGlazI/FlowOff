import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './api';

describe('API-клиент', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('добавляет заголовок авторизации и возвращает JSON-ответ', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: 'Test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await apiRequest<{ id: number; name: string }>('/test', {
      method: 'GET',
      token: 'token-1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          Authorization: 'Bearer token-1',
        }),
      }),
    );
    expect(result).toEqual({ id: 1, name: 'Test' });
  });

  it('не добавляет content-type для FormData', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.txt');

    await apiRequest<{ ok: boolean }>('/upload', {
      method: 'POST',
      body: formData,
    });

    const [, options] = fetchMock.mock.calls[0];
    expect(options?.headers).not.toEqual(expect.objectContaining({ 'Content-Type': 'application/json' }));
  });

  it('возвращает undefined для ответа без содержимого', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await apiRequest<void>('/empty', { method: 'DELETE' });

    expect(result).toBeUndefined();
  });

  it('преобразует сообщения валидации в одну строку ошибки', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: {
            Email: ['Некорректный email.'],
            Password: ['Пароль слишком короткий.'],
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await expect(apiRequest('/validation-error')).rejects.toMatchObject<ApiError>({
      message: 'Некорректный email. Пароль слишком короткий.',
      status: 400,
    });
  });

  it('переводит типовое сообщение API на русский язык', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid credentials.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(apiRequest('/login')).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).message).toBe('Неверный email или пароль.');
      expect((error as ApiError).status).toBe(401);
      return true;
    });
  });

  it('возвращает ошибку соединения, если fetch завершился неудачно', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValue(new Error('Network error'));

    await expect(apiRequest('/offline')).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).message).toBe('Не удалось соединиться с сервером.');
      expect((error as ApiError).status).toBe(0);
      return true;
    });
  });
});
