import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Snackbar, Stack, TextField, Typography } from '@mui/material';
import type { SiteContactSettings } from '../../entities/site';
import { getSiteContactSettings, updateSiteContactSettings } from '../../features/site/siteApi';
import { ApiError } from '../../shared/api';

type FeedbackState = {
  severity: 'success' | 'error';
  message: string;
};

const emptyState: SiteContactSettings = {
  phone: '',
  email: '',
  address: '',
  workingHours: '',
  vkUrl: '',
  telegramUrl: '',
};

export function AdminSiteContactsTab({ token }: { token: string }) {
  const [form, setForm] = useState<SiteContactSettings>(emptyState);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    void getSiteContactSettings().then(setForm);
  }, []);

  function updateField<Key extends keyof SiteContactSettings>(key: Key, value: SiteContactSettings[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    setFeedback(null);

    try {
      const next = await updateSiteContactSettings(form, token);
      setForm(next);
      setFeedback({ severity: 'success', message: 'Контакты магазина обновлены.' });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось обновить контакты магазина.';
      setFeedback({ severity: 'error', message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="h5">Контакты магазина</Typography>
              <Typography variant="body2" color="text.secondary">
                Эти данные используются на публичной странице контактов и в разделе «О нас».
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="small"
              onClick={() => void handleSave()}
              disabled={isSaving}
              sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, px: 1.5, minHeight: 36 }}
            >
              {isSaving ? 'Сохраняем...' : 'Сохранить'}
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField label="Телефон" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} fullWidth />
            <TextField label="Email" value={form.email} onChange={(event) => updateField('email', event.target.value)} fullWidth />
          </Stack>

          <TextField label="Адрес магазина" value={form.address} onChange={(event) => updateField('address', event.target.value)} fullWidth />
          <TextField
            label="Время работы"
            value={form.workingHours}
            onChange={(event) => updateField('workingHours', event.target.value)}
            fullWidth
            multiline
            minRows={3}
            placeholder={'Пн-Пт: 09:00-21:00\nСб: 10:00-20:00\nВс: 10:00-18:00'}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <TextField label="Ссылка VK" value={form.vkUrl} onChange={(event) => updateField('vkUrl', event.target.value)} fullWidth />
          <TextField label="Ссылка Telegram" value={form.telegramUrl} onChange={(event) => updateField('telegramUrl', event.target.value)} fullWidth />
        </CardContent>
      </Card>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={3200}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={feedback?.severity ?? 'success'} onClose={() => setFeedback(null)} sx={{ borderRadius: 2, minWidth: 320 }}>
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
