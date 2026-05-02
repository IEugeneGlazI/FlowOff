import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

type Mode = 'login' | 'register';

export function AccountPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register, error, isSubmitting, clearError } = useAuth();
  const navigate = useNavigate();

  const passwordMismatch = useMemo(
    () => mode === 'register' && confirmPassword.length > 0 && password !== confirmPassword,
    [mode, password, confirmPassword],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setLocalError(null);
    clearError();

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setLocalError('Пароли не совпадают.');
        return;
      }

      if (password.length < 6) {
        setLocalError('Пароль должен содержать минимум 6 символов.');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login({ email, password });
        navigate('/bouquets');
        return;
      }

      const message = await register({ email, password, fullName });
      setFeedback(message);
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch {
      // The error is already set in AuthContext.
    }
  }

  const passwordInputType = showPassword ? 'text' : 'password';
  const confirmPasswordInputType = showConfirmPassword ? 'text' : 'password';

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 168px)',
        display: 'grid',
        placeItems: 'center',
        py: { xs: 2, md: 4 },
      }}
    >
      <Card
        sx={{
          width: 'min(100%, 560px)',
          overflow: 'hidden',
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(246,251,247,0.88) 100%)
          `,
          backdropFilter: 'blur(16px)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h2" sx={{ mb: 1 }}>
                {mode === 'login' ? 'Добро пожаловать обратно' : 'Создай аккаунт для заказов и брони'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {mode === 'login'
                  ? 'Войди, чтобы управлять корзиной, оформлять заказы и смотреть историю покупок.'
                  : 'После регистрации ты сможешь собирать корзину, оформлять заказы и бронировать витринные букеты.'}
              </Typography>
            </Box>

            <ToggleButtonGroup
              color="primary"
              value={mode}
              exclusive
              onChange={(_, nextMode: Mode | null) => {
                if (nextMode) {
                  setMode(nextMode);
                  setFeedback(null);
                  setLocalError(null);
                  clearError();
                }
              }}
              fullWidth
              sx={{
                bgcolor: 'rgba(255,255,255,0.68)',
                borderRadius: 999,
                p: 0.5,
                '& .MuiToggleButton-root': {
                  border: 0,
                  borderRadius: 999,
                  minHeight: 44,
                },
              }}
            >
              <ToggleButton value="login">Вход</ToggleButton>
              <ToggleButton value="register">Регистрация</ToggleButton>
            </ToggleButtonGroup>

            <form className="account-form" onSubmit={(event) => void handleSubmit(event)}>
              <Stack spacing={2}>
                {mode === 'register' ? (
                  <TextField
                    label="Имя"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    fullWidth
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <UserRound size={16} style={{ opacity: 0.55 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                ) : null}

                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail size={16} style={{ opacity: 0.55 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  label="Пароль"
                  type={passwordInputType}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockKeyhole size={16} style={{ opacity: 0.55 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                            onClick={() => setShowPassword((value) => !value)}
                            edge="end"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {mode === 'register' ? (
                  <TextField
                    label="Повтори пароль"
                    type={confirmPasswordInputType}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    fullWidth
                    error={passwordMismatch}
                    helperText={passwordMismatch ? 'Пароли не совпадают.' : ' '}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockKeyhole size={16} style={{ opacity: 0.55 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                              onClick={() => setShowConfirmPassword((value) => !value)}
                              edge="end"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                ) : null}

                <Button type="submit" variant="contained" color="primary" size="large" disabled={isSubmitting} fullWidth>
                  {isSubmitting ? 'Отправляем...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
                </Button>
              </Stack>
            </form>

            {feedback ? <Alert severity="success">{feedback}</Alert> : null}
            {localError ? <Alert severity="error">{localError}</Alert> : null}
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
