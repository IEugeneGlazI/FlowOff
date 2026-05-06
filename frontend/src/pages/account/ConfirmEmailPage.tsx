import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { apiRequest, ApiError } from '../../shared/api';

type ConfirmationState = 'loading' | 'success' | 'error';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ConfirmationState>('loading');
  const [message, setMessage] = useState('Подтверждаем email...');

  useEffect(() => {
    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    if (!userId || !token) {
      setStatus('error');
      setMessage('Ссылка для подтверждения почты неполная или повреждена.');
      return;
    }

    let isActive = true;

    void apiRequest<{ message: string }>(`/Auth/confirm-email?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`)
      .then(() => {
        if (!isActive) {
          return;
        }

        setStatus('success');
        setMessage('Почта успешно подтверждена. Теперь можно вернуться на сайт и войти в аккаунт.');
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setStatus('error');
        setMessage(error instanceof ApiError ? error.message : 'Не удалось подтвердить почту. Попробуйте открыть ссылку из письма еще раз.');
      });

    return () => {
      isActive = false;
    };
  }, [searchParams]);

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 180px)' }}>
      <Card
        sx={{
          width: '100%',
          maxWidth: 720,
          background: 'rgba(255,255,255,0.84)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(24,38,31,0.08)',
          boxShadow: '0 22px 60px rgba(38, 54, 45, 0.08)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 2.5, textAlign: 'center' }}>
          <Stack spacing={1.25} sx={{ alignItems: 'center' }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2.4 }}>
              FLOWOFF
            </Typography>

            {status === 'loading' ? <CircularProgress size={28} /> : null}

            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
              {status === 'success' ? 'Почта подтверждена' : status === 'error' ? 'Не удалось подтвердить почту' : 'Подтверждаем почту'}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '52ch', lineHeight: 1.8 }}>
              {status === 'success' ? 'Почта подтверждена. Вы можете закрыть эту вкладку и вернуться на сайт.' : message}
            </Typography>
          </Stack>

          {status === 'error' ? <Alert severity="error" sx={{ textAlign: 'left', borderRadius: 2 }}>{message}</Alert> : null}
        </CardContent>
      </Card>
    </Box>
  );
}
