import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { PencilLine, Plus, Trash2 } from 'lucide-react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import type { Order } from '../../entities/cart';
import type { Category, ColorReference, FlowerInReference, StatusReference } from '../../entities/catalog';
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
  getDeliveryStatuses,
  getFlowerIns,
  getOrderStatuses,
  getPaymentStatuses,
  updateCategory,
  updateColor,
  updateDeliveryStatusReference,
  updateFlowerIn,
  updateOrderStatusReference,
  updatePaymentStatusReference,
} from '../../features/catalog/catalogApi';
import { apiRequest, ApiError } from '../../shared/api';
import { formatCurrency, formatDate } from '../../shared/format';
import { AdminPromotionsTab } from './AdminPromotionsTab';
import { AdminUsersTab } from './AdminUsersTab';
import { FloristPanelPage } from '../florist/FloristPanelPage';

type AdminTab = 'products' | 'references' | 'promotions' | 'orders' | 'users';
type ReferenceTab =
  | 'categories'
  | 'colors'
  | 'flowerIns'
  | 'orderStatuses'
  | 'deliveryStatuses'
  | 'paymentStatuses';

type FeedbackState = {
  severity: 'success' | 'error';
  message: string;
};

type ReferenceDialogState =
  | { type: 'category'; item?: Category | null }
  | { type: 'color'; item?: ColorReference | null }
  | { type: 'flowerIn'; item?: FlowerInReference | null }
  | { type: 'orderStatus'; item: StatusReference }
  | { type: 'deliveryStatus'; item: StatusReference }
  | { type: 'paymentStatus'; item: StatusReference }
  | null;

type ReferenceListItem = { id: string; name: string };

type ReferenceSectionProps<TItem extends ReferenceListItem> = {
  title: string;
  description: string;
  items: TItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (item: TItem) => void;
  onCreate?: () => void;
  onDelete?: (item: TItem) => void;
  renderMeta?: (item: TItem) => string | null;
  createLabel?: string;
};

function ReferenceSection<TItem extends ReferenceListItem>({
  title,
  description,
  items,
  search,
  onSearchChange,
  onEdit,
  onCreate,
  onDelete,
  renderMeta,
  createLabel,
}: ReferenceSectionProps<TItem>) {
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

          {onCreate ? (
            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={14} />}
              onClick={onCreate}
              sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, px: 1.5, minHeight: 36 }}
            >
              {createLabel ?? 'Добавить'}
            </Button>
          ) : null}
        </Stack>

        <TextField
          label="Поиск по названию"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          sx={{ width: { xs: '100%', md: 360 } }}
        />

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

                  {onDelete ? (
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
                  ) : null}
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

function getDeliveryMethodLabel(method: string) {
  return method === 'Pickup' ? 'Самовывоз' : 'Доставка';
}

function getProductPlaceholderImage(productType: Order['items'][number]['productType']) {
  if (productType === 'Flower') {
    return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80';
  }

  if (productType === 'Gift') {
    return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80';
  }

  return 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=900&q=80';
}

function getOrderItemsCountLabel(count: number) {
  if (count % 10 === 1 && count % 100 !== 11) {
    return `${count} позиция`;
  }

  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)) {
    return `${count} позиции`;
  }

  return `${count} позиций`;
}

function OrderInfoCard({
  label,
  primary,
  secondary,
  tertiary,
  quaternary,
}: {
  label: string;
  primary: ReactNode;
  secondary?: ReactNode;
  tertiary?: ReactNode;
  quaternary?: ReactNode;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 2,
        bgcolor: alpha('#f8fbf9', 0.92),
        boxShadow: 'none',
      }}
    >
      <CardContent sx={{ p: 1.75, display: 'grid', gap: 0.55 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {primary}
        </Typography>
        {secondary ? (
          <Typography variant="body2" color="text.secondary">
            {secondary}
          </Typography>
        ) : null}
        {tertiary ? (
          <Typography variant="body2" color="text.secondary">
            {tertiary}
          </Typography>
        ) : null}
        {quaternary ? (
          <Typography variant="body2" color="text.secondary">
            {quaternary}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

function getDialogTitle(dialogState: ReferenceDialogState) {
  if (!dialogState) {
    return '';
  }

  switch (dialogState.type) {
    case 'category':
      return dialogState.item ? 'Редактирование категории' : 'Создание категории';
    case 'color':
      return dialogState.item ? 'Редактирование цвета' : 'Создание цвета';
    case 'flowerIn':
      return dialogState.item ? 'Редактирование типа цветка' : 'Создание типа цветка';
    case 'orderStatus':
      return 'Редактирование статуса заказа';
    case 'deliveryStatus':
      return 'Редактирование статуса доставки';
    case 'paymentStatus':
      return 'Редактирование статуса оплаты';
    default:
      return '';
  }
}

function getDialogDescription(dialogState: ReferenceDialogState) {
  if (!dialogState) {
    return '';
  }

  switch (dialogState.type) {
    case 'category':
      return 'Заполните название и описание категории, чтобы использовать ее в каталоге подарков.';
    case 'color':
      return 'Укажите название цвета для товаров и фильтров витрины.';
    case 'flowerIn':
      return 'Укажите название типа цветка для цветов и составов букетов.';
    case 'orderStatus':
      return 'Измените отображаемое название статуса заказа.';
    case 'deliveryStatus':
      return 'Измените отображаемое название статуса доставки.';
    case 'paymentStatus':
      return 'Измените отображаемое название статуса оплаты.';
    default:
      return '';
  }
}

export function AdminPanelPage() {
  const { session } = useAuth();
  const location = useLocation();
  const token = session?.token ?? null;
  const isAdmin = session?.role === 'Administrator';

  const [tab, setTab] = useState<AdminTab>('products');
  const [referenceTab, setReferenceTab] = useState<ReferenceTab>('categories');
  const [referenceSearch, setReferenceSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<ColorReference[]>([]);
  const [flowerIns, setFlowerIns] = useState<FlowerInReference[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<StatusReference[]>([]);
  const [deliveryStatuses, setDeliveryStatuses] = useState<StatusReference[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<StatusReference[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialogState, setDialogState] = useState<ReferenceDialogState>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | string>('All');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<'All' | string>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'All' | string>('All');
  const [orderMethodFilter, setOrderMethodFilter] = useState<'All' | 'Pickup' | 'Delivery'>('All');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [orderStatusDrafts, setOrderStatusDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token || !isAdmin) {
      return;
    }

    void Promise.all([loadReferences(), loadOrders()]);
  }, [isAdmin, token]);

  useEffect(() => {
    setReferenceSearch('');
  }, [referenceTab]);

  async function loadReferences() {
    const [nextCategories, nextColors, nextFlowerIns, nextOrderStatuses, nextDeliveryStatuses, nextPaymentStatuses] =
      await Promise.all([
        getCategories(),
        getColors(),
        getFlowerIns(),
        getOrderStatuses(),
        getDeliveryStatuses(),
        getPaymentStatuses(),
      ]);

    setCategories(nextCategories);
    setColors(nextColors);
    setFlowerIns(nextFlowerIns);
    setOrderStatuses(nextOrderStatuses);
    setDeliveryStatuses(nextDeliveryStatuses);
    setPaymentStatuses(nextPaymentStatuses);
  }

  async function loadOrders() {
    if (!token) {
      return;
    }

    const nextOrders = await apiRequest<Order[]>('/admin/orders', { token });
    setOrders(nextOrders);
    setOrderStatusDrafts(
      nextOrders.reduce<Record<string, string>>((accumulator, order) => {
        accumulator[order.id] = order.status;
        return accumulator;
      }, {}),
    );
  }

  function resetDialogFields() {
    setName('');
    setDescription('');
  }

  function openCreateDialog(type: 'category' | 'color' | 'flowerIn') {
    setDialogState({ type, item: null });
    resetDialogFields();
  }

  function openEditDialog(type: 'category', item: Category): void;
  function openEditDialog(type: 'color', item: ColorReference): void;
  function openEditDialog(type: 'flowerIn', item: FlowerInReference): void;
  function openEditDialog(type: 'orderStatus' | 'deliveryStatus' | 'paymentStatus', item: StatusReference): void;
  function openEditDialog(
    type: NonNullable<ReferenceDialogState>['type'],
    item: Category | ColorReference | FlowerInReference | StatusReference,
  ) {
    setDialogState({ type, item } as ReferenceDialogState);
    setName(item.name);
    setDescription('description' in item ? item.description ?? '' : '');
  }

  function closeDialog() {
    if (isSaving) {
      return;
    }

    setDialogState(null);
    resetDialogFields();
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

      if (dialogState.type === 'orderStatus') {
        await updateOrderStatusReference(dialogState.item.id, { name: trimmedName }, token);
        setFeedback({ severity: 'success', message: 'Статус заказа обновлен.' });
      }

      if (dialogState.type === 'deliveryStatus') {
        await updateDeliveryStatusReference(dialogState.item.id, { name: trimmedName }, token);
        setFeedback({ severity: 'success', message: 'Статус доставки обновлен.' });
      }

      if (dialogState.type === 'paymentStatus') {
        await updatePaymentStatusReference(dialogState.item.id, { name: trimmedName }, token);
        setFeedback({ severity: 'success', message: 'Статус оплаты обновлен.' });
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

  async function handleAdminOrderStatusSave(orderId: string) {
    if (!token) {
      return;
    }

    setFeedback(null);

    try {
      await apiRequest(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: orderStatusDrafts[orderId] }),
      });

      setFeedback({ severity: 'success', message: 'Статус заказа обновлен.' });
      await loadOrders();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось обновить статус заказа.';
      setFeedback({ severity: 'error', message });
    }
  }

  async function handleAdminOrderCancel(orderId: string) {
    if (!token) {
      return;
    }

    setFeedback(null);

    try {
      await apiRequest(`/admin/orders/${orderId}/cancel`, {
        method: 'PATCH',
        token,
      });

      setFeedback({ severity: 'success', message: 'Заказ отменен.' });
      await loadOrders();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось отменить заказ.';
      setFeedback({ severity: 'error', message });
    }
  }

  const normalizedReferenceSearch = referenceSearch.trim().toLowerCase();
  const filteredCategories = categories.filter((item) => item.name.toLowerCase().includes(normalizedReferenceSearch));
  const filteredColors = colors.filter((item) => item.name.toLowerCase().includes(normalizedReferenceSearch));
  const filteredFlowerIns = flowerIns.filter((item) => item.name.toLowerCase().includes(normalizedReferenceSearch));
  const filteredOrderStatuses = orderStatuses.filter((item) => item.name.toLowerCase().includes(normalizedReferenceSearch));
  const filteredDeliveryStatuses = deliveryStatuses.filter((item) => item.name.toLowerCase().includes(normalizedReferenceSearch));
  const filteredPaymentStatuses = paymentStatuses.filter((item) => item.name.toLowerCase().includes(normalizedReferenceSearch));

  const allStatusOptions = useMemo(
    () => ({
      order: orderStatuses,
      delivery: deliveryStatuses,
      payment: paymentStatuses,
    }),
    [deliveryStatuses, orderStatuses, paymentStatuses],
  );

  const filteredOrders = useMemo(() => {
    const needle = orderSearch.trim().toLowerCase();
    const normalizedNeedle = needle.replace(/^#/, '');

    return orders.filter((order) => {
      const orderNumberRaw = String(order.orderNumber ?? '');
      const orderNumberFormatted = order.orderNumber ? String(order.orderNumber).padStart(6, '0') : '';

      const matchesSearch =
        !needle ||
        order.id.toLowerCase().includes(needle) ||
        orderNumberRaw.includes(normalizedNeedle) ||
        orderNumberFormatted.includes(normalizedNeedle) ||
        order.id.slice(0, 8).toLowerCase().includes(needle) ||
        (order.customerEmail ?? '').toLowerCase().includes(needle) ||
        (order.customerFullName ?? '').toLowerCase().includes(needle);

      const matchesOrderStatus = orderStatusFilter === 'All' || order.status === orderStatusFilter;
      const matchesDeliveryStatus = deliveryStatusFilter === 'All' || (order.deliveryStatus ?? '') === deliveryStatusFilter;
      const matchesPaymentStatus = paymentStatusFilter === 'All' || (order.paymentStatus ?? '') === paymentStatusFilter;
      const matchesMethod = orderMethodFilter === 'All' || order.deliveryMethod === orderMethodFilter;

      const orderDate = new Date(order.createdAtUtc);
      const from = orderDateFrom ? new Date(`${orderDateFrom}T00:00:00`) : null;
      const to = orderDateTo ? new Date(`${orderDateTo}T23:59:59`) : null;
      const matchesFrom = !from || orderDate >= from;
      const matchesTo = !to || orderDate <= to;

      return matchesSearch && matchesOrderStatus && matchesDeliveryStatus && matchesPaymentStatus && matchesMethod && matchesFrom && matchesTo;
    });
  }, [
    deliveryStatusFilter,
    orderDateFrom,
    orderDateTo,
    orderMethodFilter,
    orderSearch,
    orderStatusFilter,
    orders,
    paymentStatusFilter,
  ]);

  if (!session || !isAdmin) {
    return (
      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ minHeight: 220, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <Typography>Панель администратора доступна только для аккаунта администратора.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gap: 0.75 }}>
        <Typography variant="h1">Панель администратора</Typography>
        <Typography variant="body1" color="text.secondary">
          Здесь можно управлять товарами, справочниками, акциями, заказами и пользователями.
        </Typography>
      </Box>

      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Tabs value={tab} onChange={(_, value: AdminTab) => setTab(value)} sx={{ minHeight: 48 }}>
            <Tab value="products" label="Товары" />
            <Tab value="references" label="Справочники" />
            <Tab value="promotions" label="Акции" />
            <Tab value="orders" label="Заказы" />
            <Tab value="users" label="Пользователи" />
          </Tabs>
        </CardContent>
      </Card>

      {tab === 'products' ? <FloristPanelPage mode="admin" allowedTabs={['products']} embedded /> : null}

      {tab === 'promotions' ? <AdminPromotionsTab token={token!} /> : null}
      {tab === 'references' ? (
        <Box sx={{ display: 'grid', gap: 2.5 }}>
          <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Tabs value={referenceTab} onChange={(_, value: ReferenceTab) => setReferenceTab(value)} sx={{ minHeight: 48 }}>
                <Tab value="categories" label="Категории" />
                <Tab value="colors" label="Цвета" />
                <Tab value="flowerIns" label="Типы цветков" />
                <Tab value="orderStatuses" label="Статусы заказа" />
                <Tab value="deliveryStatuses" label="Статусы доставки" />
                <Tab value="paymentStatuses" label="Статусы оплаты" />
              </Tabs>
            </CardContent>
          </Card>

          {referenceTab === 'categories' ? (
            <ReferenceSection
              title="Категории"
              description="Справочник категорий для подарков и связанных товаров."
              items={filteredCategories}
              search={referenceSearch}
              onSearchChange={setReferenceSearch}
              onCreate={() => openCreateDialog('category')}
              onEdit={(item) => openEditDialog('category', item)}
              onDelete={(item) => void handleDelete('category', item)}
              renderMeta={(item) => item.description || 'Описание не заполнено'}
            />
          ) : null}

          {referenceTab === 'colors' ? (
            <ReferenceSection
              title="Цвета"
              description="Справочник цветов для цветов и букетов."
              items={filteredColors}
              search={referenceSearch}
              onSearchChange={setReferenceSearch}
              onCreate={() => openCreateDialog('color')}
              onEdit={(item) => openEditDialog('color', item)}
              onDelete={(item) => void handleDelete('color', item)}
            />
          ) : null}

          {referenceTab === 'flowerIns' ? (
            <ReferenceSection
              title="Типы цветков"
              description="Справочник видов цветов, используемых в каталоге."
              items={filteredFlowerIns}
              search={referenceSearch}
              onSearchChange={setReferenceSearch}
              onCreate={() => openCreateDialog('flowerIn')}
              onEdit={(item) => openEditDialog('flowerIn', item)}
              onDelete={(item) => void handleDelete('flowerIn', item)}
            />
          ) : null}

          {referenceTab === 'orderStatuses' ? (
            <ReferenceSection
              title="Статусы заказа"
              description="Справочник верхнеуровневых статусов заказа."
              items={filteredOrderStatuses}
              search={referenceSearch}
              onSearchChange={setReferenceSearch}
              onEdit={(item) => openEditDialog('orderStatus', item)}
            />
          ) : null}

          {referenceTab === 'deliveryStatuses' ? (
            <ReferenceSection
              title="Статусы доставки"
              description="Справочник этапов сборки и доставки заказа."
              items={filteredDeliveryStatuses}
              search={referenceSearch}
              onSearchChange={setReferenceSearch}
              onEdit={(item) => openEditDialog('deliveryStatus', item)}
            />
          ) : null}

          {referenceTab === 'paymentStatuses' ? (
            <ReferenceSection
              title="Статусы оплаты"
              description="Справочник платежных статусов заказа."
              items={filteredPaymentStatuses}
              search={referenceSearch}
              onSearchChange={setReferenceSearch}
              onEdit={(item) => openEditDialog('paymentStatus', item)}
            />
          ) : null}
        </Box>
      ) : null}

      {tab === 'orders' ? (
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
                <Typography variant="h5">Все заказы</Typography>
                <Typography variant="body2" color="text.secondary">
                  Управляйте заказами, следите за текущими статусами и быстро находите нужные позиции по клиенту или номеру.
                </Typography>
              </Box>

              <Box
                sx={{
                  p: { xs: 1.5, md: 1.75 },
                  borderRadius: 2.5,
                  bgcolor: alpha('#ffffff', 0.54),
                  border: '1px solid rgba(24,38,31,0.05)',
                  display: 'grid',
                  gap: 1.5,
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' } }}>
                  <TextField
                    fullWidth
                    label="Поиск по номеру, email, имени"
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                  />

                  <Button
                    variant="text"
                    color="inherit"
                    onClick={() => {
                      setOrderSearch('');
                      setOrderStatusFilter('All');
                      setDeliveryStatusFilter('All');
                      setPaymentStatusFilter('All');
                      setOrderMethodFilter('All');
                      setOrderDateFrom('');
                      setOrderDateTo('');
                    }}
                    sx={{
                      minHeight: 48,
                      px: 2.25,
                      bgcolor: alpha('#ffffff', 0.52),
                      width: { xs: '100%', md: 'fit-content' },
                      alignSelf: { xs: 'stretch', md: 'flex-start' },
                    }}
                  >
                    Сбросить фильтры
                  </Button>
                </Stack>

                <Box
                  sx={{
                    p: { xs: 1.5, md: 1.75 },
                    borderRadius: 2.25,
                    bgcolor: alpha('#ffffff', 0.52),
                    border: '1px solid rgba(24,38,31,0.05)',
                    display: 'grid',
                    gap: 1.1,
                  }}
                >
                  <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.4 }}>
                    Фильтры
                  </Typography>

                  <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 200, flex: 1 }}>
                      <InputLabel id="admin-order-status-filter-label">Статус заказа</InputLabel>
                      <Select
                        labelId="admin-order-status-filter-label"
                        value={orderStatusFilter}
                        label="Статус заказа"
                        onChange={(event: SelectChangeEvent) => setOrderStatusFilter(event.target.value)}
                      >
                        <MenuItem value="All">Все статусы заказа</MenuItem>
                        {orderStatuses.map((status) => (
                          <MenuItem key={status.id} value={status.name}>
                            {status.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 220, flex: 1 }}>
                      <InputLabel id="admin-delivery-status-filter-label">Статус доставки</InputLabel>
                      <Select
                        labelId="admin-delivery-status-filter-label"
                        value={deliveryStatusFilter}
                        label="Статус доставки"
                        onChange={(event: SelectChangeEvent) => setDeliveryStatusFilter(event.target.value)}
                      >
                        <MenuItem value="All">Все статусы доставки</MenuItem>
                        {deliveryStatuses.map((status) => (
                          <MenuItem key={status.id} value={status.name}>
                            {status.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200, flex: 1 }}>
                      <InputLabel id="admin-payment-status-filter-label">Статус оплаты</InputLabel>
                      <Select
                        labelId="admin-payment-status-filter-label"
                        value={paymentStatusFilter}
                        label="Статус оплаты"
                        onChange={(event: SelectChangeEvent) => setPaymentStatusFilter(event.target.value)}
                      >
                        <MenuItem value="All">Все статусы оплаты</MenuItem>
                        {paymentStatuses.map((status) => (
                          <MenuItem key={status.id} value={status.name}>
                            {status.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 180, flex: 1 }}>
                      <InputLabel id="admin-order-method-label">Получение</InputLabel>
                      <Select
                        labelId="admin-order-method-label"
                        value={orderMethodFilter}
                        label="Получение"
                        onChange={(event: SelectChangeEvent) => setOrderMethodFilter(event.target.value as 'All' | 'Pickup' | 'Delivery')}
                      >
                        <MenuItem value="All">Все способы</MenuItem>
                        <MenuItem value="Delivery">Доставка</MenuItem>
                        <MenuItem value="Pickup">Самовывоз</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' } }}>
                    <TextField
                      label="Дата от"
                      type="date"
                      value={orderDateFrom}
                      onChange={(event) => setOrderDateFrom(event.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ width: { xs: '100%', md: 220 } }}
                    />

                    <TextField
                      label="Дата до"
                      type="date"
                      value={orderDateTo}
                      onChange={(event) => setOrderDateTo(event.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ width: { xs: '100%', md: 220 } }}
                    />
                  </Stack>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {filteredOrders.map((order) => (
              <Card key={order.id} sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
                  <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    spacing={1.5}
                    sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', lg: 'center' } }}
                  >
                    <Box sx={{ display: 'grid', gap: 0.45 }}>
                      <Typography variant="h5">
                        Заказ #{order.orderNumber ? String(order.orderNumber).padStart(6, '0') : order.id.slice(0, 8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Оформлен {formatDate(order.createdAtUtc)}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: { xs: 'left', lg: 'right' } }}>
                      <Typography variant="h5">{formatCurrency(order.totalAmount)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getOrderItemsCountLabel(order.items.length)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
                      gap: 1.5,
                    }}
                  >
                    <OrderInfoCard
                      label="Клиент"
                      primary={order.customerFullName || 'Не указано'}
                      secondary={order.customerEmail || 'Email не указан'}
                    />
                    <OrderInfoCard
                      label="Получение"
                      primary={getDeliveryMethodLabel(order.deliveryMethod)}
                      secondary={order.deliveryAddress || 'Без адреса'}
                    />
                    <OrderInfoCard
                      label="Ответственные"
                      primary={
                        <Box component="span" sx={{ fontWeight: 600 }}>
                          <strong>Флорист:</strong> {order.floristFullName || 'Не назначен'}
                        </Box>
                      }
                      secondary={order.floristEmail || 'Флорист без email'}
                      tertiary={
                        <Box component="span" sx={{ fontWeight: 600 }}>
                          <strong>Доставщик:</strong> {order.courierFullName || 'Не назначен'}
                        </Box>
                      }
                      quaternary={order.courierEmail || 'Доставщик без email'}
                    />
                    <OrderInfoCard
                      label="Статусы"
                      primary={`Заказ: ${order.status}`}
                      secondary={`Доставка: ${order.deliveryStatus || 'Не указано'}`}
                      tertiary={`Оплата: ${order.paymentStatus || 'Не указано'}`}
                    />
                  </Box>

                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha('#f8fbf9', 0.92), boxShadow: 'none' }}>
                    <CardContent sx={{ p: { xs: 1.5, md: 1.75 }, display: 'grid', gap: 1 }}>
                      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.4 }}>
                        Состав заказа
                      </Typography>

                      <Box sx={{ display: 'grid', gap: 1 }}>
                        {order.items.map((item, index) => (
                          <Stack
                            key={`${item.productId}-${index}`}
                            component={RouterLink}
                            to={`/products/${item.productId}`}
                            state={{ returnTo: location.pathname + location.search, returnLabel: 'Назад в панель администратора' }}
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            sx={{
                              justifyContent: 'space-between',
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              color: 'inherit',
                              textDecoration: 'none',
                              p: 1,
                              borderRadius: 2,
                              transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 12px 28px rgba(31,42,35,0.08)',
                                backgroundColor: 'rgba(255,255,255,0.94)',
                              },
                            }}
                          >
                            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
                              <Box
                                component="img"
                                src={getProductPlaceholderImage(item.productType)}
                                alt={item.productName}
                                sx={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: 1.5,
                                  objectFit: 'cover',
                                  display: 'block',
                                  flexShrink: 0,
                                  border: '1px solid rgba(31, 42, 35, 0.08)',
                                }}
                              />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {item.productName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {item.quantity} x {formatCurrency(item.unitPrice)}
                                </Typography>
                              </Box>
                            </Stack>

                            <Typography variant="body1" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </Typography>
                          </Stack>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha('#f8fbf9', 0.92), boxShadow: 'none' }}>
                    <CardContent sx={{ p: { xs: 1.5, md: 1.75 }, display: 'grid', gap: 1.25 }}>
                      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.4 }}>
                        Действия
                      </Typography>

                      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.25} sx={{ alignItems: { lg: 'center' } }}>
                        <FormControl sx={{ minWidth: 280, flex: 1 }}>
                          <InputLabel id={`admin-order-status-draft-${order.id}`}>Изменить статус</InputLabel>
                          <Select
                            labelId={`admin-order-status-draft-${order.id}`}
                            value={orderStatusDrafts[order.id] ?? order.status}
                            label="Изменить статус"
                            onChange={(event: SelectChangeEvent) =>
                              setOrderStatusDrafts((current) => ({ ...current, [order.id]: event.target.value }))
                            }
                          >
                            <ListSubheader>Статус заказа</ListSubheader>
                            {allStatusOptions.order.map((status) => (
                              <MenuItem key={`order-${status.id}`} value={status.name}>
                                {status.name}
                              </MenuItem>
                            ))}
                            <ListSubheader>Статус доставки</ListSubheader>
                            {allStatusOptions.delivery.map((status) => (
                              <MenuItem key={`delivery-${status.id}`} value={status.name}>
                                {status.name}
                              </MenuItem>
                            ))}
                            <ListSubheader>Статус оплаты</ListSubheader>
                            {allStatusOptions.payment.map((status) => (
                              <MenuItem key={`payment-${status.id}`} value={status.name}>
                                {status.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Button variant="contained" onClick={() => void handleAdminOrderStatusSave(order.id)}>
                          Сохранить статус
                        </Button>

                        {order.status !== 'Отменен' && order.status !== 'Завершен' ? (
                          <Button variant="outlined" color="inherit" onClick={() => void handleAdminOrderCancel(order.id)}>
                            Отменить заказ
                          </Button>
                        ) : null}
                      </Stack>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            ))}

            {filteredOrders.length === 0 ? (
              <Typography color="text.secondary">По текущим фильтрам заказы не найдены.</Typography>
            ) : null}
          </Box>
        </Box>
      ) : null}

      {tab === 'users' ? <AdminUsersTab token={token!} /> : null}

      <Dialog open={Boolean(dialogState)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{getDialogTitle(dialogState)}</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'grid', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {getDialogDescription(dialogState)}
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

