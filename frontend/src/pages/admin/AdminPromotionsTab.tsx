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
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { PencilLine, Plus, Trash2 } from 'lucide-react';
import type { Product, Promotion } from '../../entities/catalog';
import {
  createPromotion,
  deletePromotion,
  getProducts,
  getPromotions,
  updatePromotion,
} from '../../features/catalog/catalogApi';
import { ApiError } from '../../shared/api';
import { formatDate } from '../../shared/format';

type FeedbackState = {
  severity: 'success' | 'error';
  message: string;
};

type PromotionDialogState =
  | { mode: 'create' }
  | { mode: 'edit'; promotion: Promotion }
  | null;

type PromotionViewFilter = 'all' | 'active' | 'completed' | 'disabled';

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toUtcIsoString(value: string) {
  return new Date(value).toISOString();
}

function getPromotionState(promotion: Promotion, now: Date) {
  const endsAt = new Date(promotion.endsAtUtc);
  if (endsAt < now) {
    return 'completed';
  }

  if (!promotion.isActive) {
    return 'disabled';
  }

  return 'active';
}

function getSelectedNames(ids: string[], products: Product[]) {
  return products.filter((product) => ids.includes(product.id)).map((product) => product.name);
}

export function AdminPromotionsTab({ token }: { token: string }) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [bouquets, setBouquets] = useState<Product[]>([]);
  const [flowers, setFlowers] = useState<Product[]>([]);
  const [gifts, setGifts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [viewFilter, setViewFilter] = useState<PromotionViewFilter>('all');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialogState, setDialogState] = useState<PromotionDialogState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedBouquetIds, setSelectedBouquetIds] = useState<string[]>([]);
  const [selectedFlowerIds, setSelectedFlowerIds] = useState<string[]>([]);
  const [selectedGiftIds, setSelectedGiftIds] = useState<string[]>([]);

  useEffect(() => {
    void Promise.all([loadPromotions(), loadProducts()]);
  }, []);

  async function loadPromotions() {
    const nextPromotions = await getPromotions();
    setPromotions(nextPromotions);
  }

  async function loadProducts() {
    const [nextBouquets, nextFlowers, nextGifts] = await Promise.all([
      getProducts({ type: 'Bouquet', includeHidden: true, token }),
      getProducts({ type: 'Flower', includeHidden: true, token }),
      getProducts({ type: 'Gift', includeHidden: true, token }),
    ]);

    setBouquets(nextBouquets);
    setFlowers(nextFlowers);
    setGifts(nextGifts);
  }

  function resetForm() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setTitle('');
    setDescription('');
    setDiscountPercent('10');
    setStartsAt(toLocalDateTimeInput(now.toISOString()));
    setEndsAt(toLocalDateTimeInput(tomorrow.toISOString()));
    setIsActive(true);
    setSelectedBouquetIds([]);
    setSelectedFlowerIds([]);
    setSelectedGiftIds([]);
  }

  function openCreateDialog() {
    resetForm();
    setDialogState({ mode: 'create' });
  }

  function openEditDialog(promotion: Promotion) {
    setTitle(promotion.title);
    setDescription(promotion.description ?? '');
    setDiscountPercent(String(promotion.discountPercent));
    setStartsAt(toLocalDateTimeInput(promotion.startsAtUtc));
    setEndsAt(toLocalDateTimeInput(promotion.endsAtUtc));
    setIsActive(promotion.isActive);
    setSelectedBouquetIds(promotion.bouquetIds ?? []);
    setSelectedFlowerIds(promotion.flowerIds ?? []);
    setSelectedGiftIds(promotion.giftIds ?? []);
    setDialogState({ mode: 'edit', promotion });
  }

  function closeDialog() {
    if (isSaving) {
      return;
    }

    setDialogState(null);
  }

  async function handleSave() {
    if (!dialogState) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();
      const parsedDiscount = Number(discountPercent);

      if (!trimmedTitle) {
        throw new Error('Название акции должно быть заполнено.');
      }

      if (!startsAt || !endsAt) {
        throw new Error('Укажите период действия акции.');
      }

      if (!Number.isFinite(parsedDiscount) || parsedDiscount <= 0 || parsedDiscount > 100) {
        throw new Error('Процент скидки должен быть в диапазоне от 0.01 до 100.');
      }

      if (
        selectedBouquetIds.length === 0 &&
        selectedFlowerIds.length === 0 &&
        selectedGiftIds.length === 0
      ) {
        throw new Error('Выберите хотя бы один букет, цветок или подарок для акции.');
      }

      const payload = {
        title: trimmedTitle,
        description: trimmedDescription || null,
        discountPercent: parsedDiscount,
        startsAtUtc: toUtcIsoString(startsAt),
        endsAtUtc: toUtcIsoString(endsAt),
        isActive,
        bouquetIds: selectedBouquetIds,
        flowerIds: selectedFlowerIds,
        giftIds: selectedGiftIds,
      };

      if (dialogState.mode === 'create') {
        await createPromotion(payload, token);
        setFeedback({ severity: 'success', message: 'Акция создана.' });
      } else {
        await updatePromotion(dialogState.promotion.id, payload, token);
        setFeedback({ severity: 'success', message: 'Акция обновлена.' });
      }

      await loadPromotions();
      closeDialog();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : 'Не удалось сохранить акцию.';
      setFeedback({ severity: 'error', message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(promotion: Promotion, nextIsActive: boolean) {
    try {
      await updatePromotion(
        promotion.id,
        {
          title: promotion.title,
          description: promotion.description ?? null,
          discountPercent: promotion.discountPercent,
          startsAtUtc: promotion.startsAtUtc,
          endsAtUtc: promotion.endsAtUtc,
          isActive: nextIsActive,
          bouquetIds: promotion.bouquetIds ?? [],
          flowerIds: promotion.flowerIds ?? [],
          giftIds: promotion.giftIds ?? [],
        },
        token,
      );

      setFeedback({
        severity: 'success',
        message: nextIsActive ? 'Акция включена.' : 'Акция отключена.',
      });
      await loadPromotions();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось изменить состояние акции.';
      setFeedback({ severity: 'error', message });
    }
  }

  async function handleDelete(promotion: Promotion) {
    try {
      await deletePromotion(promotion.id, token);
      setFeedback({ severity: 'success', message: 'Акция удалена.' });
      await loadPromotions();
      if (dialogState?.mode === 'edit' && dialogState.promotion.id === promotion.id) {
        closeDialog();
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось удалить акцию.';
      setFeedback({ severity: 'error', message });
    }
  }

  const filteredPromotions = useMemo(() => {
    const now = new Date();
    const needle = search.trim().toLowerCase();

    return promotions.filter((promotion) => {
      const matchesSearch =
        !needle ||
        promotion.title.toLowerCase().includes(needle) ||
        (promotion.description ?? '').toLowerCase().includes(needle);

      const state = getPromotionState(promotion, now);
      const matchesFilter = viewFilter === 'all' || state === viewFilter;
      return matchesSearch && matchesFilter;
    });
  }, [promotions, search, viewFilter]);

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
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="h5">Акции</Typography>
              <Typography variant="body2" color="text.secondary">
                Управляйте скидками, периодами действия и товарами, на которые распространяется акция.
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={14} />}
              onClick={openCreateDialog}
              sx={{ alignSelf: { xs: 'stretch', lg: 'center' }, px: 1.5, minHeight: 36 }}
            >
              Новая акция
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.5} sx={{ alignItems: { xl: 'center' } }}>
            <TextField
              label="Поиск по названию"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ width: { xs: '100%', xl: 360 } }}
            />

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel id="admin-promotions-view-filter-label">Показать</InputLabel>
              <Select
                labelId="admin-promotions-view-filter-label"
                value={viewFilter}
                label="Показать"
                onChange={(event: SelectChangeEvent<PromotionViewFilter>) =>
                  setViewFilter(event.target.value as PromotionViewFilter)
                }
              >
                <MenuItem value="all">Все акции</MenuItem>
                <MenuItem value="active">Активные</MenuItem>
                <MenuItem value="completed">Завершенные</MenuItem>
                <MenuItem value="disabled">Отключенные</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Box sx={{ display: 'grid', gap: 1.25 }}>
            {filteredPromotions.map((promotion) => (
              <Card
                key={promotion.id}
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
                onClick={() => openEditDialog(promotion)}
              >
                <CardContent sx={{ display: 'grid', gap: 1.5 }}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.5}
                    sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}
                  >
                    <Box sx={{ display: 'grid', gap: 0.5 }}>
                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="h6">{promotion.title}</Typography>
                        <Chip size="small" variant="outlined" label={`Скидка ${promotion.discountPercent}%`} />
                      </Stack>

                      {promotion.description ? (
                        <Typography variant="body2" color="text.secondary">
                          {promotion.description}
                        </Typography>
                      ) : null}

                      <Typography variant="body2" color="text.secondary">
                        Букеты: {promotion.bouquetIds?.length ?? 0}, цветы: {promotion.flowerIds?.length ?? 0}, подарки: {promotion.giftIds?.length ?? 0}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      <Tooltip title={promotion.isActive ? 'Нажмите, чтобы отключить акцию на сайте' : 'Нажмите, чтобы снова включить акцию на сайте'}>
                        <Chip
                          label={promotion.isActive ? 'Активна' : 'Отключена'}
                          color={promotion.isActive ? 'success' : 'default'}
                          variant="outlined"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleToggleActive(promotion, !promotion.isActive);
                          }}
                        />
                      </Tooltip>

                      <Button
                        variant="text"
                        color="inherit"
                        startIcon={<PencilLine size={16} />}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditDialog(promotion);
                        }}
                      >
                        Изменить
                      </Button>

                      <Button
                        variant="text"
                        color="inherit"
                        startIcon={<Trash2 size={16} />}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(promotion);
                        }}
                      >
                        Удалить
                      </Button>
                    </Stack>
                  </Stack>

                  <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ alignItems: { lg: 'center' } }}>
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                      Период действия: {formatDate(promotion.startsAtUtc)} - {formatDate(promotion.endsAtUtc)}
                    </Typography>

                    <Box />
                  </Stack>
                </CardContent>
              </Card>
            ))}

            {filteredPromotions.length === 0 ? (
              <Typography color="text.secondary">По текущим фильтрам акции не найдены.</Typography>
            ) : null}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={Boolean(dialogState)} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>{dialogState?.mode === 'edit' ? 'Редактирование акции' : 'Создание акции'}</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'grid', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Заполните параметры акции, задайте скидку, срок действия и отметьте, на какие товары она распространяется.
          </Typography>

          <TextField label="Название" value={title} onChange={(event) => setTitle(event.target.value)} fullWidth />

          <TextField
            label="Описание"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            fullWidth
            multiline
            minRows={3}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.75 } }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Скидка, %"
              type="number"
              value={discountPercent}
              onChange={(event) => setDiscountPercent(event.target.value)}
              slotProps={{ htmlInput: { min: 0.01, max: 100, step: 0.5 } }}
              fullWidth
            />

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minHeight: 56, px: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Акция включена
              </Typography>
              <Switch checked={isActive} onChange={(_, checked) => setIsActive(checked)} />
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Действует с"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Действует до"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>

          <Stack spacing={1.5}>
            <FormControl fullWidth>
              <InputLabel id="promotion-bouquets-label">Букеты</InputLabel>
              <Select
                labelId="promotion-bouquets-label"
                multiple
                value={selectedBouquetIds}
                label="Букеты"
                onChange={(event) => setSelectedBouquetIds(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)}
                renderValue={(selected) => {
                  const names = getSelectedNames(selected as string[], bouquets);
                  return names.length > 0 ? names.join(', ') : 'Не выбраны';
                }}
              >
                {bouquets.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="promotion-flowers-label">Цветы</InputLabel>
              <Select
                labelId="promotion-flowers-label"
                multiple
                value={selectedFlowerIds}
                label="Цветы"
                onChange={(event) => setSelectedFlowerIds(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)}
                renderValue={(selected) => {
                  const names = getSelectedNames(selected as string[], flowers);
                  return names.length > 0 ? names.join(', ') : 'Не выбраны';
                }}
              >
                {flowers.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="promotion-gifts-label">Подарки</InputLabel>
              <Select
                labelId="promotion-gifts-label"
                multiple
                value={selectedGiftIds}
                label="Подарки"
                onChange={(event) => setSelectedGiftIds(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)}
                renderValue={(selected) => {
                  const names = getSelectedNames(selected as string[], gifts);
                  return names.length > 0 ? names.join(', ') : 'Не выбраны';
                }}
              >
                {gifts.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'flex-end', pb: 0.5 }}>
            <Button onClick={closeDialog} disabled={isSaving} color="inherit">
              Закрыть
            </Button>
            <Button variant="contained" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? 'Сохраняем...' : 'Сохранить'}
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
          onClose={() => setFeedback(null)}
          severity={feedback?.severity ?? 'success'}
          sx={{ borderRadius: 2, minWidth: 320, boxShadow: '0 18px 40px rgba(31,42,35,0.18)' }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
