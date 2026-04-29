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

type AuthContextValue = {
  session: AuthSession | null;
  error: string | null;
  isSubmitting: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string>;
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
      const message =
        requestError instanceof ApiError ? requestError.message : 'Не удалось выполнить вход.';
      setError(message);
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
      return result.message;
    } catch (requestError) {
      const message =
        requestError instanceof ApiError ? requestError.message : 'Не удалось создать аккаунт.';
      setError(message);
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
