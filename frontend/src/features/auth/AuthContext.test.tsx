import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { STORAGE_KEYS } from '../../shared/config';

const apiRequestMock = vi.fn();

vi.mock('../../shared/api', () => ({
  ApiError: class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function TestConsumer() {
  const { session, error, isSubmitting, login, register, logout, clearError } = useAuth();
  const [actionResult, setActionResult] = useState('');

  return (
    <div>
      <div data-testid="session-email">{session?.email ?? ''}</div>
      <div data-testid="error">{error ?? ''}</div>
      <div data-testid="submitting">{String(isSubmitting)}</div>
      <div data-testid="action-result">{actionResult}</div>
      <button
        type="button"
        onClick={() =>
          void login({ email: 'user@test.local', password: 'Password1!' }).catch(() => undefined)
        }
      >
        войти
      </button>
      <button
        type="button"
        onClick={() =>
          void register({ email: 'user@test.local', password: 'Password1!', fullName: 'Иван Иванов' })
            .then(setActionResult)
            .catch(() => undefined)
        }
      >
        зарегистрироваться
      </button>
      <button type="button" onClick={logout}>
        выйти
      </button>
      <button type="button" onClick={clearError}>
        очистить ошибку
      </button>
    </div>
  );
}

describe('Контекст авторизации', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    localStorage.clear();
  });

  it('восстанавливает активную сессию из localStorage', async () => {
    localStorage.setItem(
      STORAGE_KEYS.auth,
      JSON.stringify({
        token: 'token-1',
        expiresAtUtc: '2099-01-01T00:00:00Z',
        email: 'stored@test.local',
        fullName: 'Stored User',
        role: 'Customer',
      }),
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('session-email')).toHaveTextContent('stored@test.local');
  });

  it('выполняет вход и сохраняет новую сессию', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({
      token: 'token-1',
      expiresAtUtc: '2099-01-01T00:00:00Z',
      email: 'user@test.local',
      fullName: 'Иван Иванов',
      role: 'Customer',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'войти' }));

    await waitFor(() => expect(screen.getByTestId('session-email')).toHaveTextContent('user@test.local'));
    expect(localStorage.getItem(STORAGE_KEYS.auth)).toContain('user@test.local');
  });

  it('сохраняет сообщение об ошибке при неудачном входе', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockRejectedValue(new Error('Ошибка входа'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'войти' }));

    await waitFor(() => expect(screen.getByTestId('error')).not.toHaveTextContent(''));
  });

  it('возвращает локализованное сообщение после успешной регистрации', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({
      message: 'Registration completed. Please confirm your email before login.',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'зарегистрироваться' }));

    await waitFor(() => expect(screen.getByTestId('action-result')).not.toHaveTextContent(''));
    expect(screen.getByTestId('action-result').textContent).toContain('Регистрация');
  });

  it('очищает сессию и localStorage при выходе', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({
      token: 'token-1',
      expiresAtUtc: '2099-01-01T00:00:00Z',
      email: 'user@test.local',
      fullName: 'Иван Иванов',
      role: 'Customer',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'войти' }));
    await waitFor(() => expect(screen.getByTestId('session-email')).toHaveTextContent('user@test.local'));

    await user.click(screen.getByRole('button', { name: 'выйти' }));

    await waitFor(() => expect(screen.getByTestId('session-email')).toHaveTextContent(''));
    expect(localStorage.getItem(STORAGE_KEYS.auth)).toBeNull();
  });
});
