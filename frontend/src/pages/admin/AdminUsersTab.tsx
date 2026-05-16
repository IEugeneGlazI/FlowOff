import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Mail, PencilLine, ShieldBan, UserCheck, UserPlus } from 'lucide-react';
import type { AdminUser, UserRole } from '../../entities/users';
import {
  createAdminUser,
  deactivateAdminUser,
  getAdminUsers,
  restoreAdminUser,
  sendAdminUserPasswordReset,
  updateAdminUser,
} from '../../features/users/usersApi';
import { ApiError } from '../../shared/api';
import { PaginationControls } from '../../shared/PaginationControls';

type FeedbackState = {
  severity: 'success' | 'error';
  message: string;
};

type UserDialogState =
  | { mode: 'create' }
  | { mode: 'edit'; user: AdminUser }
  | null;

type UserActivationFilter = 'All' | 'Active' | 'Deactivated';

const roleOptions: UserRole[] = ['Customer', 'Florist', 'Courier', 'Administrator'];
const USERS_PAGE_SIZE = 8;

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
  const [activationFilter, setActivationFilter] = useState<UserActivationFilter>('All');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialogState, setDialogState] = useState<UserDialogState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
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
      } else {
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
      if (dialogState?.mode === 'edit' && dialogState.user.id === user.id) {
        closeDialog();
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось деактивировать аккаунт.';
      setFeedback({ severity: 'error', message });
    }
  }

  async function handleRestore(user: AdminUser) {
    try {
      await restoreAdminUser(user.id, token);
      setFeedback({ severity: 'success', message: 'Пользователь снова активирован.' });
      await loadUsers();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось активировать пользователя.';
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
      const matchesActivation =
        activationFilter === 'All' ||
        (activationFilter === 'Active' && !user.isDeleted) ||
        (activationFilter === 'Deactivated' && user.isDeleted);

      return matchesSearch && matchesRole && matchesActivation;
    });
  }, [activationFilter, roleFilter, search, users]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, activationFilter]);

  const pagedUsers = useMemo(
    () => filteredUsers.slice((page - 1) * USERS_PAGE_SIZE, page * USERS_PAGE_SIZE),
    [filteredUsers, page],
  );
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / USERS_PAGE_SIZE));

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
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { lg: 'flex-start' } }}>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="h5">Пользователи</Typography>
              <Typography variant="body2" color="text.secondary">
                Управляйте покупателями, флористами, доставщиками и администраторами.
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="small"
              startIcon={<UserPlus size={14} />}
              onClick={openCreateDialog}
              sx={{ alignSelf: { xs: 'stretch', lg: 'center' }, px: 1.5, minHeight: 36 }}
            >
              Новый пользователь
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.5} sx={{ alignItems: { xl: 'center' } }}>
            <TextField
              label="Поиск по имени и email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ width: { xs: '100%', xl: 360 } }}
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

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel id="admin-users-activation-filter-label">Статус</InputLabel>
              <Select
                labelId="admin-users-activation-filter-label"
                value={activationFilter}
                label="Статус"
                onChange={(event: SelectChangeEvent) => setActivationFilter(event.target.value as UserActivationFilter)}
              >
                <MenuItem value="All">Все пользователи</MenuItem>
                <MenuItem value="Active">Активированные</MenuItem>
                <MenuItem value="Deactivated">Деактивированные</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Box sx={{ display: 'grid', gap: 1.25 }}>
            {pagedUsers.map((user) => (
              <Card
                key={user.id}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                  ':hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 14px 32px rgba(38, 54, 45, 0.08)',
                    borderColor: 'rgba(92, 143, 115, 0.34)',
                  },
                }}
                onClick={() => openEditDialog(user)}
              >
                <CardContent sx={{ display: 'grid', gap: 1.5 }}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.5}
                    sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}
                  >
                    <Box sx={{ display: 'grid', gap: 0.45 }}>
                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="h6">{user.fullName}</Typography>
                        <Chip label={getRoleLabel(user.role)} size="small" variant="outlined" />
                        {user.isBlocked || user.isDeleted ? <Chip label={getUserStatusLabel(user)} size="small" variant="outlined" /> : null}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
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

                      {!user.isDeleted ? (
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
                      ) : null}

                      {user.isDeleted ? (
                        <Button
                          variant="text"
                          color="inherit"
                          startIcon={<UserCheck size={16} />}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleRestore(user);
                          }}
                        >
                          Активировать
                        </Button>
                      ) : (
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
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}

            {filteredUsers.length === 0 ? <Typography color="text.secondary">Пользователи по текущим фильтрам не найдены.</Typography> : null}
            <PaginationControls
              page={page}
              pageCount={pageCount}
              totalCount={filteredUsers.length}
              pageSize={USERS_PAGE_SIZE}
              onChange={setPage}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={Boolean(dialogState)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{dialogState?.mode === 'create' ? 'Создание пользователя' : 'Редактирование пользователя'}</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'grid', gap: 2 }}>
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
