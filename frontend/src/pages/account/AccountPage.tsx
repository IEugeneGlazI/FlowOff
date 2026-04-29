import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Flower2, LockKeyhole, Mail, UserRound } from 'lucide-react';
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
      navigate('/bouquets');
      return;
    }

    const message = await register({ email, password, fullName });
    setFeedback(message);
    setMode('login');
  }

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
            <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              

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
            </Stack>

            <ToggleButtonGroup
              color="primary"
              value={mode}
              exclusive
              onChange={(_, nextMode: Mode | null) => {
                if (nextMode) {
                  setMode(nextMode);
                  setFeedback(null);
                  clearError();
                }
              }}
              fullWidth
              sx={{
                bgcolor: alpha('#ffffff', 0.68),
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
                        startAdornment: <UserRound size={16} style={{ marginRight: 8, opacity: 0.55 }} />,
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
                      startAdornment: <Mail size={16} style={{ marginRight: 8, opacity: 0.55 }} />,
                    },
                  }}
                />

                <TextField
                  label="Пароль"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: <LockKeyhole size={16} style={{ marginRight: 8, opacity: 0.55 }} />,
                    },
                  }}
                />

                <Button type="submit" variant="contained" color="primary" size="large" disabled={isSubmitting} fullWidth>
                  {isSubmitting ? 'Отправляем...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
                </Button>
              </Stack>
            </form>

            {feedback ? <Alert severity="success">{feedback}</Alert> : null}
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
