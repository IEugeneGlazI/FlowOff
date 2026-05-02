import { API_BASE_URL } from './config';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

function translateApiMessage(message: string) {
  const normalized = message.trim();

  const translations: Array<[RegExp, string]> = [
    [/^Email is already registered\.?$/i, 'Этот email уже зарегистрирован.'],
    [/^Invalid credentials\.?$/i, 'Неверный email или пароль.'],
    [/^Email confirmation is required before login\.?$/i, 'Сначала подтвердите email, затем выполните вход.'],
    [/^User not found\.?$/i, 'Пользователь не найден.'],
    [/Passwords must have at least one non alphanumeric character/i, 'Пароль должен содержать хотя бы один специальный символ.'],
    [/Passwords must have at least one digit/i, 'Пароль должен содержать хотя бы одну цифру.'],
    [/Passwords must have at least one uppercase/i, 'Пароль должен содержать хотя бы одну заглавную букву.'],
    [/Passwords must have at least one lowercase/i, 'Пароль должен содержать хотя бы одну строчную букву.'],
    [/Passwords must be at least (\d+) characters/i, 'Пароль должен содержать минимум $1 символов.'],
    [/Name 'Email' is already taken\./i, 'Этот email уже используется.'],
  ];

  let translated = normalized;

  for (const [pattern, replacement] of translations) {
    translated = translated.replace(pattern, replacement);
  }

  return translated;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, body, ...rest } = options;

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body,
    });
  } catch {
    throw new ApiError('Не удалось соединиться с сервером. Проверь, что backend запущен и CORS настроен.', 0);
  }

  if (!response.ok) {
    let message = 'Не удалось выполнить запрос.';

    try {
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        title?: string;
        detail?: string;
        errors?: Record<string, string[]>;
      };

      if (payload.errors) {
        const validationMessages = Object.values(payload.errors).flat();
        if (validationMessages.length > 0) {
          message = validationMessages.join(' ');
        }
      }

      message = payload.error ?? payload.message ?? payload.title ?? payload.detail ?? message;
    } catch {
      if (response.status === 401) {
        message = 'Нужна авторизация.';
      }
    }

    throw new ApiError(translateApiMessage(message), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
