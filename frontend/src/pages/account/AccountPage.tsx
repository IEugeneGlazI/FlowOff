import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

type Mode = 'login' | 'register';

export function AccountPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const { login, register, error, isSubmitting, clearError } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    clearError();

    if (mode === 'login') {
      await login({ email, password });
      navigate('/');
      return;
    }

    const message = await register({ email, password, fullName });
    setFeedback(message);
    setMode('login');
  }

  return (
    <div className="account-layout">
      <section className="panel account-intro">
        <h1>Авторизация и регистрация</h1>
        <p>
          Форма уже работает с текущими `Auth` endpoints. После логина JWT сохраняется локально и
          используется для customer-запросов к корзине и заказам.
        </p>
      </section>

      <section className="panel account-form-panel">
        <div className="segmented">
          <button
            type="button"
            className={mode === 'login' ? 'segment active' : 'segment'}
            onClick={() => setMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'segment active' : 'segment'}
            onClick={() => setMode('register')}
          >
            Регистрация
          </button>
        </div>

        <form className="account-form" onSubmit={(event) => void handleSubmit(event)}>
          {mode === 'register' ? (
            <div>
              <label className="field-label" htmlFor="full-name">
                Имя
              </label>
              <input
                id="full-name"
                className="text-input"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>
          ) : null}

          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="text-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className="text-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button type="submit" className="primary-button wide-button" disabled={isSubmitting}>
            {isSubmitting ? 'Отправляем...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>

          {feedback ? <p className="helper-text success-text">{feedback}</p> : null}
          {error ? <p className="helper-text">{error}</p> : null}
        </form>
      </section>
    </div>
  );
}
