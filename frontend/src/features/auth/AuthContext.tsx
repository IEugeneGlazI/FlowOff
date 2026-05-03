import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, ApiError } from '../../shared/api';
import { STORAGE_KEYS } from '../../shared/config';

type AuthSession = {
  token: string;
  expiresAtUtc: string;
  email: string;
  fullName: string;
  role: string;
};

type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type ResetPasswordPayload = {
  email: string;
  token: string;
  newPassword: string;
};

type AuthContextValue = {
  session: AuthSession | null;
  error: string | null;
  isSubmitting: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<string>;
  logout: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEYS.auth);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;

    if (new Date(parsed.expiresAtUtc).getTime() <= Date.now()) {
      localStorage.removeItem(STORAGE_KEYS.auth);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.auth);
    return null;
  }
}

function getErrorMessage(requestError: unknown, fallback: string) {
  return requestError instanceof ApiError ? requestError.message : fallback;
}

function getSuccessMessage(message: string, fallback: string) {
  const normalized = message.trim();

  if (/^Registration completed\. Please confirm your email before login\.?$/i.test(normalized)) {
    return 'Регистрация завершена. Подтвердите email перед входом.';
  }

  if (/^If the account exists, a password reset email has been sent\.?$/i.test(normalized)) {
    return 'Если аккаунт существует, письмо для восстановления пароля уже отправлено.';
  }

  if (/^Password has been reset successfully\.?$/i.test(normalized)) {
    return 'Пароль успешно обновлен.';
  }

  return normalized || fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.auth);
      return;
    }

    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(session));
  }, [session]);

  async function login(payload: LoginPayload) {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await apiRequest<AuthSession>('/Auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSession(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Не удалось выполнить вход.'));
      throw requestError;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function register(payload: RegisterPayload) {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await apiRequest<{ message: string }>('/Auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return getSuccessMessage(result.message, 'Регистрация завершена. Подтвердите email перед входом.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Не удалось создать аккаунт.'));
      throw requestError;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function forgotPassword(email: string) {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await apiRequest<{ message: string }>('/Auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return getSuccessMessage(result.message, 'Если аккаунт существует, письмо для восстановления пароля уже отправлено.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Не удалось отправить письмо для восстановления пароля.'));
      throw requestError;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resetPassword(payload: ResetPasswordPayload) {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await apiRequest<{ message: string }>('/Auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return getSuccessMessage(result.message, 'Пароль успешно обновлен.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Не удалось сбросить пароль.'));
      throw requestError;
    } finally {
      setIsSubmitting(false);
    }
  }

  function logout() {
    setSession(null);
    setError(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      error,
      isSubmitting,
      login,
      register,
      forgotPassword,
      resetPassword,
      logout,
      clearError: () => setError(null),
    }),
    [session, error, isSubmitting],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
