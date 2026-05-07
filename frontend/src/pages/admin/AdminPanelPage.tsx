import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { PencilLine, Plus, Trash2 } from 'lucide-react';
import type { Category, ColorReference, FlowerInReference } from '../../entities/catalog';
import { useAuth } from '../../features/auth/AuthContext';
import {
  createCategory,
  createColor,
  createFlowerIn,
  deleteCategory,
  deleteColor,
  deleteFlowerIn,
  getCategories,
  getColors,
  getFlowerIns,
  updateCategory,
  updateColor,
  updateFlowerIn,
} from '../../features/catalog/catalogApi';
import { FloristPanelPage } from '../florist/FloristPanelPage';
import { ApiError } from '../../shared/api';

type AdminTab = 'products' | 'categories' | 'colors' | 'flowerIns';

type FeedbackState = {
  severity: 'success' | 'error';
  message: string;
};

type ReferenceDialogState =
  | { type: 'category'; item?: Category | null }
  | { type: 'color'; item?: ColorReference | null }
  | { type: 'flowerIn'; item?: FlowerInReference | null }
  | null;

function ReferenceSection<TItem extends { id: string; name: string }>(props: {
  title: string;
  description: string;
  items: TItem[];
  onCreate: () => void;
  onEdit: (item: TItem) => void;
  onDelete: (item: TItem) => void;
  renderMeta?: (item: TItem) => string | null;
}) {
  const { title, description, items, onCreate, onEdit, onDelete, renderMeta } = props;

  return (
    <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
      <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'grid', gap: 0.5 }}>
            <Typography variant="h5">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<Plus size={14} />}
            onClick={onCreate}
            sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, px: 1.5, minHeight: 36 }}
          >
            Добавить
          </Button>
        </Stack>

        <Box sx={{ display: 'grid', gap: 1.25 }}>
          {items.map((item) => (
            <Card
              key={item.id}
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
              onClick={() => onEdit(item)}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                }}
              >
                <Box sx={{ display: 'grid', gap: 0.4 }}>
                  <Typography variant="h6">{item.name}</Typography>
                  {renderMeta ? (
                    <Typography variant="body2" color="text.secondary">
                      {renderMeta(item)}
                    </Typography>
                  ) : null}
                </Box>

                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Button
                    variant="text"
                    color="inherit"
                    startIcon={<PencilLine size={16} />}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(item);
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
                      onDelete(item);
                    }}
                  >
                    Удалить
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}

          {items.length === 0 ? <Typography color="text.secondary">Пока здесь пусто.</Typography> : null}
        </Box>
      </CardContent>
    </Card>
  );
}

export function AdminPanelPage() {
  const { session } = useAuth();
  const token = session?.token ?? null;

  const [tab, setTab] = useState<AdminTab>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<ColorReference[]>([]);
  const [flowerIns, setFlowerIns] = useState<FlowerInReference[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialogState, setDialogState] = useState<ReferenceDialogState>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token || session?.role !== 'Administrator') {
      return;
    }

    void loadReferences();
  }, [session?.role, token]);

  async function loadReferences() {
    const [nextCategories, nextColors, nextFlowerIns] = await Promise.all([getCategories(), getColors(), getFlowerIns()]);
    setCategories(nextCategories);
    setColors(nextColors);
    setFlowerIns(nextFlowerIns);
  }

  function openCreateDialog(type: NonNullable<ReferenceDialogState>['type']) {
    setDialogState({ type, item: null });
    setName('');
    setDescription('');
  }

  function openEditDialog(type: NonNullable<ReferenceDialogState>['type'], item: Category | ColorReference | FlowerInReference) {
    setDialogState({ type, item });
    setName(item.name);
    setDescription('description' in item ? item.description ?? '' : '');
  }

  function closeDialog() {
    if (isSaving) {
      return;
    }

    setDialogState(null);
    setName('');
    setDescription('');
  }

  async function handleSave() {
    if (!token || !dialogState) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error('Название не должно быть пустым.');
      }

      if (dialogState.type === 'category') {
        if (dialogState.item) {
          await updateCategory(dialogState.item.id, { name: trimmedName, description: description.trim() || null }, token);
          setFeedback({ severity: 'success', message: 'Категория обновлена.' });
        } else {
          await createCategory({ name: trimmedName, description: description.trim() || null }, token);
          setFeedback({ severity: 'success', message: 'Категория создана.' });
        }
      }

      if (dialogState.type === 'color') {
        if (dialogState.item) {
          await updateColor(dialogState.item.id, { name: trimmedName }, token);
          setFeedback({ severity: 'success', message: 'Цвет обновлен.' });
        } else {
          await createColor({ name: trimmedName }, token);
          setFeedback({ severity: 'success', message: 'Цвет создан.' });
        }
      }

      if (dialogState.type === 'flowerIn') {
        if (dialogState.item) {
          await updateFlowerIn(dialogState.item.id, { name: trimmedName }, token);
          setFeedback({ severity: 'success', message: 'Тип цветка обновлен.' });
        } else {
          await createFlowerIn({ name: trimmedName }, token);
          setFeedback({ severity: 'success', message: 'Тип цветка создан.' });
        }
      }

      await loadReferences();
      closeDialog();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : 'Не удалось сохранить запись.';
      setFeedback({ severity: 'error', message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(type: 'category' | 'color' | 'flowerIn', item: Category | ColorReference | FlowerInReference) {
    if (!token) {
      return;
    }

    setFeedback(null);

    try {
      if (type === 'category') {
        await deleteCategory(item.id, token);
        setFeedback({ severity: 'success', message: 'Категория удалена.' });
      }

      if (type === 'color') {
        await deleteColor(item.id, token);
        setFeedback({ severity: 'success', message: 'Цвет удален.' });
      }

      if (type === 'flowerIn') {
        await deleteFlowerIn(item.id, token);
        setFeedback({ severity: 'success', message: 'Тип цветка удален.' });
      }

      await loadReferences();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось удалить запись.';
      setFeedback({ severity: 'error', message });
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gap: 0.75 }}>
        <Typography variant="h1">Панель администратора</Typography>
        <Typography variant="body1" color="text.secondary">
          Здесь можно управлять товарами и системными справочниками.
        </Typography>
      </Box>

      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Tabs value={tab} onChange={(_, value: AdminTab) => setTab(value)} sx={{ minHeight: 48 }}>
            <Tab value="products" label="Товары" />
            <Tab value="categories" label="Категории" />
            <Tab value="colors" label="Цвета" />
            <Tab value="flowerIns" label="Типы цветов" />
          </Tabs>
        </CardContent>
      </Card>

      {tab === 'products' ? <FloristPanelPage mode="admin" allowedTabs={['products']} embedded /> : null}

      {tab === 'categories' ? (
        <ReferenceSection
          title="Категории"
          description="Справочник категорий для подарков и связанных товаров."
          items={categories}
          onCreate={() => openCreateDialog('category')}
          onEdit={(item) => openEditDialog('category', item)}
          onDelete={(item) => void handleDelete('category', item)}
          renderMeta={(item) => item.description || 'Описание не заполнено'}
        />
      ) : null}

      {tab === 'colors' ? (
        <ReferenceSection
          title="Цвета"
          description="Справочник цветов для цветов и букетов."
          items={colors}
          onCreate={() => openCreateDialog('color')}
          onEdit={(item) => openEditDialog('color', item)}
          onDelete={(item) => void handleDelete('color', item)}
        />
      ) : null}

      {tab === 'flowerIns' ? (
        <ReferenceSection
          title="Типы цветов"
          description="Справочник видов цветов, используемых в каталоге."
          items={flowerIns}
          onCreate={() => openCreateDialog('flowerIn')}
          onEdit={(item) => openEditDialog('flowerIn', item)}
          onDelete={(item) => void handleDelete('flowerIn', item)}
        />
      ) : null}

      <Dialog open={Boolean(dialogState)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {dialogState?.type === 'category'
            ? dialogState.item
              ? 'Редактирование категории'
              : 'Создание категории'
            : dialogState?.type === 'color'
              ? dialogState.item
                ? 'Редактирование цвета'
                : 'Создание цвета'
              : dialogState?.item
                ? 'Редактирование типа цветка'
                : 'Создание типа цветка'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'grid', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {dialogState?.type === 'category'
              ? 'Заполните название и описание категории, чтобы ее было удобно использовать в каталоге.'
              : dialogState?.type === 'color'
                ? 'Укажите название цвета, чтобы его можно было выбирать в карточках товаров.'
                : 'Укажите название типа цветка, чтобы использовать его в цветах и букетах.'}
          </Typography>
          <TextField label="Название" value={name} onChange={(event) => setName(event.target.value)} fullWidth />
          {dialogState?.type === 'category' ? (
            <TextField
              label="Описание"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              fullWidth
              multiline
              minRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          ) : null}
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

      {feedback ? (
        <Alert severity={feedback.severity} onClose={() => setFeedback(null)} sx={{ borderRadius: 2 }}>
          {feedback.message}
        </Alert>
      ) : null}
    </Box>
  );
}
