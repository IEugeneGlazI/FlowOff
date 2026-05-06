import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, LogOut, Mail, UserRound } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

const modeTitles: Record<Mode, string> = {
  login: 'Добро пожаловать обратно',
  register: 'Создайте аккаунт для расширения возможностей',
  forgot: 'Восстановление пароля',
  reset: 'Новый пароль',
};

const modeDescriptions: Record<Mode, string> = {
  login: 'Войдите, чтобы управлять корзиной, оформлять заказы и смотреть историю покупок.',
  register: 'После регистрации вы сможете собирать корзину и оформлять заказы.',
  forgot: 'Введите email, и мы отправим вам письмо со ссылкой для сброса пароля.',
  reset: 'Задайте новый пароль для вашего аккаунта.',
};

export function AccountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileEmail, setProfileEmail] = useState('');
  const [profileFullName, setProfileFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const {
    session,
    login,
    register,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    logout,
    error,
    isSubmitting,
    clearError,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      return;
    }

    setProfileEmail(session.email);
    setProfileFullName(session.fullName);
  }, [session]);

  useEffect(() => {
    const rawMode = searchParams.get('mode');
    const tokenFromQuery = searchParams.get('token');
    const canOpenResetMode = Boolean(tokenFromQuery?.trim());
    const nextMode: Mode =
      rawMode === 'register' || rawMode === 'forgot' || rawMode === 'login'
        ? rawMode
        : rawMode === 'reset' && canOpenResetMode
          ? 'reset'
          : 'login';

    setMode(nextMode);

    const emailFromQuery = searchParams.get('email');

    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }

    if (tokenFromQuery) {
      setResetToken(tokenFromQuery);
    } else {
      setResetToken('');
    }
  }, [searchParams]);

  const passwordMismatch = useMemo(
    () => (mode === 'register' || mode === 'reset') && confirmPassword.length > 0 && password !== confirmPassword,
    [mode, password, confirmPassword],
  );

  const newPasswordMismatch = useMemo(
    () => confirmNewPassword.length > 0 && newPassword !== confirmNewPassword,
    [newPassword, confirmNewPassword],
  );

  function switchMode(nextMode: Mode, options?: { preserveFeedback?: boolean }) {
    const targetMode = nextMode === 'reset' && !resetToken.trim() ? 'forgot' : nextMode;

    setMode(targetMode);

    if (!options?.preserveFeedback) {
      setFeedback(null);
    }

    setLocalError(null);
    clearError();

    const nextParams = new URLSearchParams();

    if (targetMode !== 'login') {
      nextParams.set('mode', targetMode);
    }

    if (targetMode === 'reset') {
      if (email) {
        nextParams.set('email', email);
      }

      if (resetToken) {
        nextParams.set('token', resetToken);
      }
    }

    setSearchParams(nextParams, { replace: true });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setLocalError(null);
    clearError();

    if (mode === 'register' || mode === 'reset') {
      if (password !== confirmPassword) {
        setLocalError('Пароли не совпадают.');
        return;
      }

      if (password.length < 6) {
        setLocalError('Пароль должен содержать минимум 6 символов.');
        return;
      }
    }

    if (mode === 'reset' && !resetToken.trim()) {
      setLocalError('Откройте ссылку из письма перед изменением пароля.');
      return;
    }

    try {
      if (mode === 'login') {
        await login({ email, password });
        navigate('/bouquets');
        return;
      }

      if (mode === 'register') {
        const message = await register({ email, password, fullName });
        setFeedback(message);
        setPassword('');
        setConfirmPassword('');
        switchMode('login', { preserveFeedback: true });
        return;
      }

      if (mode === 'forgot') {
        const message = await forgotPassword(email);
        setFeedback(message);
        return;
      }

      const message = await resetPassword({
        email,
        token: resetToken,
        newPassword: password,
      });

      setFeedback(message);
      setPassword('');
      setConfirmPassword('');
      setResetToken('');
      switchMode('login', { preserveFeedback: true });
    } catch {
      // Error state is handled in AuthContext.
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setLocalError(null);
    clearError();

    try {
      const message = await updateProfile({
        email: profileEmail,
        fullName: profileFullName,
      });
      setFeedback(message);
    } catch {
      // Error state is handled in AuthContext.
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setLocalError(null);
    clearError();

    if (newPassword !== confirmNewPassword) {
      setLocalError('Пароли не совпадают.');
      return;
    }

    if (newPassword.length < 6) {
      setLocalError('Пароль должен содержать минимум 6 символов.');
      return;
    }

    try {
      const message = await changePassword({
        currentPassword,
        newPassword,
      });
      setFeedback(message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch {
      // Error state is handled in AuthContext.
    }
  }

  function renderPasswordField(options: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    visible: boolean;
    onToggleVisibility: () => void;
    helperText?: string;
    error?: boolean;
  }) {
    return (
      <TextField
        label={options.label}
        type={options.visible ? 'text' : 'password'}
        value={options.value}
        onChange={(event) => options.onChange(event.target.value)}
        required
        fullWidth
        error={options.error}
        helperText={options.helperText}
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
                  aria-label={options.visible ? 'Скрыть пароль' : 'Показать пароль'}
                  onClick={options.onToggleVisibility}
                  edge="end"
                >
                  {options.visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    );
  }

  if (session) {
    return (
      <Box sx={{ display: 'grid', gap: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Box sx={{ display: 'grid', gap: 0.75 }}>
            <Typography variant="h1">Профиль</Typography>
            <Typography variant="body1" color="text.secondary">
              Здесь можно обновить личные данные и сменить пароль.
            </Typography>
          </Box>

          <Button
            type="button"
            variant="text"
            color="inherit"
            startIcon={<LogOut size={16} />}
            onClick={() => {
              logout();
              navigate('/bouquets');
            }}
            sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}
          >
            Выйти из аккаунта
          </Button>
        </Box>

        <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 }, display: 'grid', gap: 3 }}>
            <Box sx={{ display: 'grid', gap: 0.75 }}>
              <Typography variant="h5">Личные данные</Typography>
              <Typography variant="body2" color="text.secondary">
                Обновите имя и email, которые используются в аккаунте.
              </Typography>
            </Box>

            <form onSubmit={(event) => void handleProfileSubmit(event)}>
              <Stack spacing={2}>
                <TextField
                  label="Имя"
                  value={profileFullName}
                  onChange={(event) => setProfileFullName(event.target.value)}
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

                <TextField
                  label="Email"
                  type="email"
                  value={profileEmail}
                  onChange={(event) => setProfileEmail(event.target.value)}
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

                <Button type="submit" variant="contained" color="primary" size="large" disabled={isSubmitting}>
                  {isSubmitting ? 'Сохраняем...' : 'Сохранить изменения'}
                </Button>
              </Stack>
            </form>

            <Divider />

            <Box sx={{ display: 'grid', gap: 0.75 }}>
              <Typography variant="h5">Смена пароля</Typography>
              <Typography variant="body2" color="text.secondary">
                Укажите текущий пароль и задайте новый.
              </Typography>
            </Box>

            <form onSubmit={(event) => void handlePasswordSubmit(event)}>
              <Stack spacing={2}>
                {renderPasswordField({
                  label: 'Текущий пароль',
                  value: currentPassword,
                  onChange: setCurrentPassword,
                  visible: showCurrentPassword,
                  onToggleVisibility: () => setShowCurrentPassword((value) => !value),
                })}

                {renderPasswordField({
                  label: 'Новый пароль',
                  value: newPassword,
                  onChange: setNewPassword,
                  visible: showNewPassword,
                  onToggleVisibility: () => setShowNewPassword((value) => !value),
                })}

                {renderPasswordField({
                  label: 'Повторите новый пароль',
                  value: confirmNewPassword,
                  onChange: setConfirmNewPassword,
                  visible: showConfirmNewPassword,
                  onToggleVisibility: () => setShowConfirmNewPassword((value) => !value),
                  error: newPasswordMismatch,
                  helperText: newPasswordMismatch ? 'Пароли не совпадают.' : ' ',
                })}

                <Button type="submit" variant="outlined" color="inherit" size="large" disabled={isSubmitting}>
                  {isSubmitting ? 'Обновляем...' : 'Сменить пароль'}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>

        {feedback ? <Alert severity="success">{feedback}</Alert> : null}
        {localError ? <Alert severity="error">{localError}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
      </Box>
    );
  }

  const showAuthToggle = mode === 'login' || mode === 'register';

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
          background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(246,251,247,0.88) 100%)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h2" sx={{ mb: 1, textAlign: 'center' }}>
                {modeTitles[mode]}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                {modeDescriptions[mode]}
              </Typography>
            </Box>

            {showAuthToggle ? (
              <ToggleButtonGroup
                color="primary"
                value={mode}
                exclusive
                onChange={(_, nextMode: Mode | null) => {
                  if (nextMode === 'login' || nextMode === 'register') {
                    switchMode(nextMode);
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
            ) : null}

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

                {mode !== 'forgot'
                  ? renderPasswordField({
                      label: mode === 'reset' ? 'Новый пароль' : 'Пароль',
                      value: password,
                      onChange: setPassword,
                      visible: showPassword,
                      onToggleVisibility: () => setShowPassword((value) => !value),
                    })
                  : null}

                {mode === 'register' || mode === 'reset'
                  ? renderPasswordField({
                      label: 'Повторите пароль',
                      value: confirmPassword,
                      onChange: setConfirmPassword,
                      visible: showConfirmPassword,
                      onToggleVisibility: () => setShowConfirmPassword((value) => !value),
                      error: passwordMismatch,
                      helperText: passwordMismatch ? 'Пароли не совпадают.' : ' ',
                    })
                  : null}

                <Button type="submit" variant="contained" color="primary" size="large" disabled={isSubmitting} fullWidth>
                  {isSubmitting
                    ? 'Отправляем...'
                    : mode === 'login'
                      ? 'Войти в аккаунт'
                      : mode === 'register'
                        ? 'Создать аккаунт'
                        : mode === 'forgot'
                          ? 'Отправить письмо'
                          : 'Сохранить новый пароль'}
                </Button>
              </Stack>
            </form>

            <Stack spacing={1} sx={{ alignItems: 'center' }}>
              {mode === 'login' ? (
                <Link component="button" type="button" underline="hover" onClick={() => switchMode('forgot')}>
                  Забыли пароль?
                </Link>
              ) : null}

              {mode === 'forgot' ? (
                <Link component="button" type="button" underline="hover" onClick={() => switchMode('login')}>
                  Вернуться ко входу
                </Link>
              ) : null}

              {mode === 'reset' ? (
                <Stack spacing={1} sx={{ alignItems: 'center' }}>
                  <Link component="button" type="button" underline="hover" onClick={() => switchMode('forgot')}>
                    Отправить письмо еще раз
                  </Link>
                  <Link component="button" type="button" underline="hover" onClick={() => switchMode('login')}>
                    Вернуться ко входу
                  </Link>
                </Stack>
              ) : null}
            </Stack>

            {feedback ? <Alert severity="success">{feedback}</Alert> : null}
            {localError ? <Alert severity="error">{localError}</Alert> : null}
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
