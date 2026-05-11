import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Mail, PencilLine, ShieldBan, UserCog, UserPlus } from 'lucide-react';
import type { AdminUser, UserRole } from '../../entities/users';
import {
  createAdminUser,
  deactivateAdminUser,
  getAdminUsers,
  sendAdminUserPasswordReset,
  updateAdminUser,
  updateAdminUserBlockStatus,
} from '../../features/users/usersApi';
import { ApiError } from '../../shared/api';

type FeedbackState = {
  severity: 'success' | 'error';
  message: string;
};

type UserDialogState =
  | { mode: 'create' }
  | { mode: 'edit'; user: AdminUser }
  | { mode: 'profile'; user: AdminUser }
  | null;

const roleOptions: UserRole[] = ['Customer', 'Florist', 'Courier', 'Administrator'];

function getRoleLabel(role: UserRole) {
  switch (role) {
    case 'Customer':
      return 'Покупатель';
    case 'Florist':
      return 'Флорист';
    case 'Courier':
      return 'Доставщик';
    case 'Administrator':
      return 'Администратор';
    default:
      return role;
  }
}

function getUserStatusLabel(user: AdminUser) {
  if (user.isDeleted) {
    return 'Деактивирован';
  }

  if (user.isBlocked) {
    return 'Заблокирован';
  }

  return 'Активен';
}

export function AdminUsersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialogState, setDialogState] = useState<UserDialogState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Customer');

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    const nextUsers = await getAdminUsers(token);
    setUsers(nextUsers);
  }

  function resetForm() {
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('Customer');
  }

  function openCreateDialog() {
    resetForm();
    setDialogState({ mode: 'create' });
  }

  function openEditDialog(user: AdminUser) {
    setFullName(user.fullName);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setDialogState({ mode: 'edit', user });
  }

  function openProfileDialog(user: AdminUser) {
    setDialogState({ mode: 'profile', user });
  }

  function closeDialog() {
    if (isSaving) {
      return;
    }

    setDialogState(null);
    resetForm();
  }

  async function handleSave() {
    if (!dialogState) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const normalizedFullName = fullName.trim();
      const normalizedEmail = email.trim();

      if (!normalizedFullName || !normalizedEmail) {
        throw new Error('Имя и email должны быть заполнены.');
      }

      if (dialogState.mode === 'create') {
        if (password.trim().length < 6) {
          throw new Error('Пароль должен содержать минимум 6 символов.');
        }

        await createAdminUser(
          {
            fullName: normalizedFullName,
            email: normalizedEmail,
            password: password.trim(),
            role,
          },
          token,
        );

        setFeedback({ severity: 'success', message: 'Пользователь создан.' });
      } else if (dialogState.mode === 'edit') {
        await updateAdminUser(
          dialogState.user.id,
          {
            fullName: normalizedFullName,
            email: normalizedEmail,
            role,
          },
          token,
        );

        setFeedback({ severity: 'success', message: 'Профиль пользователя обновлен.' });
      }

      await loadUsers();
      closeDialog();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : 'Не удалось сохранить пользователя.';
      setFeedback({ severity: 'error', message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBlockToggle(user: AdminUser, isBlocked: boolean) {
    try {
      await updateAdminUserBlockStatus(user.id, isBlocked, token);
      setFeedback({ severity: 'success', message: isBlocked ? 'Пользователь заблокирован.' : 'Пользователь разблокирован.' });
      await loadUsers();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось изменить статус блокировки.';
      setFeedback({ severity: 'error', message });
    }
  }

  async function handleSendReset(user: AdminUser) {
    try {
      await sendAdminUserPasswordReset(user.id, token);
      setFeedback({ severity: 'success', message: 'Письмо для смены пароля отправлено.' });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось отправить письмо для смены пароля.';
      setFeedback({ severity: 'error', message });
    }
  }

  async function handleDeactivate(user: AdminUser) {
    try {
      await deactivateAdminUser(user.id, token);
      setFeedback({ severity: 'success', message: 'Аккаунт деактивирован.' });
      await loadUsers();
      if (dialogState?.mode !== 'create') {
        closeDialog();
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось деактивировать аккаунт.';
      setFeedback({ severity: 'error', message });
    }
  }

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !needle ||
        user.fullName.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle);

      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [roleFilter, search, users]);

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Card
        sx={{
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(246,251,247,0.84) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(24,38,31,0.06)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.75 }, display: 'grid', gap: 2.25 }}>
          <Box sx={{ display: 'grid', gap: 0.5 }}>
            <Typography variant="h5">Пользователи</Typography>
            <Typography variant="body2" color="text.secondary">
              Управляйте покупателями, флористами, доставщиками и администраторами.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ alignItems: { lg: 'center' } }}>
            <TextField
              label="Поиск по имени и email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}
            />

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel id="admin-users-role-filter-label">Роль</InputLabel>
              <Select
                labelId="admin-users-role-filter-label"
                value={roleFilter}
                label="Роль"
                onChange={(event: SelectChangeEvent) => setRoleFilter(event.target.value as 'All' | UserRole)}
              >
                <MenuItem value="All">Все роли</MenuItem>
                {roleOptions.map((item) => (
                  <MenuItem key={item} value={item}>
                    {getRoleLabel(item)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<UserPlus size={16} />}
              onClick={openCreateDialog}
              sx={{ width: { xs: '100%', lg: 'fit-content' }, alignSelf: { lg: 'flex-start' } }}
            >
              Новый пользователь
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {filteredUsers.map((user) => (
          <Card
            key={user.id}
            sx={{
              background: 'rgba(255,255,255,0.84)',
              backdropFilter: 'blur(14px)',
              cursor: 'pointer',
              transition: 'transform 160ms ease, box-shadow 160ms ease',
              ':hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 16px 30px rgba(31,42,35,0.08)',
              },
            }}
            onClick={() => openProfileDialog(user)}
          >
            <CardContent sx={{ p: { xs: 2, md: 2.25 }, display: 'grid', gap: 1.5 }}>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { lg: 'center' } }}>
                <Box sx={{ display: 'grid', gap: 0.45 }}>
                  <Typography variant="h6">{user.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Chip label={getRoleLabel(user.role)} size="small" />
                  <Chip label={getUserStatusLabel(user)} size="small" variant="outlined" />
                  <Chip label={user.emailConfirmed ? 'Почта подтверждена' : 'Почта не подтверждена'} size="small" variant="outlined" />
                </Stack>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} sx={{ alignItems: { md: 'center' } }}>
                <FormControlLabelInline
                  label={user.isBlocked ? 'Заблокирован' : 'Активен'}
                  checked={user.isBlocked}
                  onChange={(checked) => void handleBlockToggle(user, checked)}
                  disabled={user.isDeleted}
                />

                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<PencilLine size={16} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    openEditDialog(user);
                  }}
                >
                  Изменить
                </Button>

                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<Mail size={16} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleSendReset(user);
                  }}
                >
                  Смена пароля
                </Button>

                {!user.isDeleted ? (
                  <Button
                    variant="text"
                    color="inherit"
                    startIcon={<ShieldBan size={16} />}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDeactivate(user);
                    }}
                  >
                    Деактивировать
                  </Button>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        ))}

        {filteredUsers.length === 0 ? <Typography color="text.secondary">Пользователи по текущим фильтрам не найдены.</Typography> : null}
      </Box>

      <Dialog open={Boolean(dialogState)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {dialogState?.mode === 'create'
            ? 'Создание пользователя'
            : dialogState?.mode === 'edit'
              ? 'Редактирование пользователя'
              : 'Профиль пользователя'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'grid', gap: 2 }}>
          {dialogState?.mode === 'profile' ? (
            <>
              <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha('#f8fbf9', 0.92), boxShadow: 'none' }}>
                <CardContent sx={{ display: 'grid', gap: 0.75 }}>
                  <Typography variant="h6">{dialogState.user.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dialogState.user.email}
                  </Typography>
                  <Typography variant="body2">Роль: {getRoleLabel(dialogState.user.role)}</Typography>
                  <Typography variant="body2">Статус: {getUserStatusLabel(dialogState.user)}</Typography>
                  <Typography variant="body2">
                    Почта: {dialogState.user.emailConfirmed ? 'подтверждена' : 'не подтверждена'}
                  </Typography>
                </CardContent>
              </Card>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <Button variant="contained" startIcon={<UserCog size={16} />} onClick={() => openEditDialog(dialogState.user)}>
                  Редактировать
                </Button>
                <Button variant="text" color="inherit" startIcon={<Mail size={16} />} onClick={() => void handleSendReset(dialogState.user)}>
                  Отправить письмо
                </Button>
              </Stack>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                {dialogState?.mode === 'create'
                  ? 'Создайте аккаунт для покупателя, флориста, доставщика или администратора.'
                  : 'Измените данные пользователя, роль и контакты аккаунта.'}
              </Typography>

              <TextField label="Имя" value={fullName} onChange={(event) => setFullName(event.target.value)} fullWidth />
              <TextField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth />

              {dialogState?.mode === 'create' ? (
                <TextField
                  label="Пароль"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  fullWidth
                />
              ) : null}

              <FormControl fullWidth>
                <InputLabel id="admin-user-role-label">Роль</InputLabel>
                <Select
                  labelId="admin-user-role-label"
                  value={role}
                  label="Роль"
                  onChange={(event: SelectChangeEvent) => setRole(event.target.value as UserRole)}
                >
                  {roleOptions.map((item) => (
                    <MenuItem key={item} value={item}>
                      {getRoleLabel(item)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <Button variant="contained" onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving ? 'Сохраняем...' : 'Сохранить'}
                </Button>
                <Button variant="text" color="inherit" onClick={closeDialog}>
                  Закрыть
                </Button>
              </Stack>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={3200}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={feedback?.severity ?? 'success'}
          onClose={() => setFeedback(null)}
          sx={{ borderRadius: 2, minWidth: 320, boxShadow: '0 18px 40px rgba(31,42,35,0.18)' }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function FormControlLabelInline(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const { label, checked, onChange, disabled } = props;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Switch checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />
    </Stack>
  );
}
