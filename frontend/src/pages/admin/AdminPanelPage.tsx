import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
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
import { ApiError, apiRequest } from '../../shared/api';
import { formatCurrency, formatDate } from '../../shared/format';
import { FloristPanelPage } from '../florist/FloristPanelPage';
import { AdminAnalyticsTab } from './AdminAnalyticsTab';
import { AdminPromotionsTab } from './AdminPromotionsTab';
import { AdminSiteContactsTab } from './AdminSiteContactsTab';
import { AdminUsersTab } from './AdminUsersTab';

type AdminTab = 'products' | 'references' | 'promotions' | 'orders' | 'users' | 'contacts' | 'analytics';
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

          {items.length === 0 ? <Typography color="text.secondary">По вашему запросу ничего не найдено.</Typography> : null}
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
        bgcolor: alpha('#ffffff', 0.54),
        boxShadow: 'none',
        borderColor: 'rgba(24,38,31,0.05)',
      }}
    >
      <CardContent sx={{ p: 1.5, display: 'grid', gap: 0.65 }}>
        <Typography variant="overline" color="text.secondary">
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
      return dialogState.item ? 'Редактирование категории' : 'Новая категория';
    case 'color':
      return dialogState.item ? 'Редактирование цвета' : 'Новый цвет';
    case 'flowerIn':
      return dialogState.item ? 'Редактирование цветка' : 'Новый цветок';
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
      return dialogState.item
        ? 'Измените название и описание категории. Все изменения сразу отразятся в фильтрах и карточках товаров.'
        : 'Добавьте новую категорию подарков, чтобы она появилась в каталоге и в фильтрах.';
    case 'color':
      return dialogState.item
        ? 'Измените название цвета. Он будет использоваться в карточках и фильтрации каталога.'
        : 'Добавьте новый цвет для букетов и цветов.';
    case 'flowerIn':
      return dialogState.item
        ? 'Измените название цветка в справочнике состава.'
        : 'Добавьте новый цветок в справочник состава букетов и типов цветов.';
    case 'orderStatus':
      return 'Измените название статуса заказа.';
    case 'deliveryStatus':
      return 'Измените название статуса доставки.';
    case 'paymentStatus':
      return 'Измените название статуса оплаты.';
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
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [orderMethodFilter, setOrderMethodFilter] = useState('');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [orderStatusDrafts, setOrderStatusDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token || !isAdmin) {
      return;
    }

    void Promise.all([loadReferences(token), loadOrders(token)]);
  }, [token, isAdmin]);

  useEffect(() => {
    setReferenceSearch('');
  }, [referenceTab]);

  async function loadReferences(_authToken: string) {
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

  async function loadOrders(authToken: string) {
    const nextOrders = await apiRequest<Order[]>('/admin/orders', { token: authToken });
    setOrders(nextOrders);
    setOrderStatusDrafts(
      Object.fromEntries(
        nextOrders.map((order) => [order.id, order.deliveryStatus || order.paymentStatus || order.status || '']),
      ),
    );
  }

  function resetDialogFields() {
    setName('');
    setDescription('');
  }

  function openCreateDialog(type: 'category' | 'color' | 'flowerIn') {
    resetDialogFields();
    setDialogState({ type, item: null });
  }

  function openEditDialog(
    type: 'category' | 'color' | 'flowerIn' | 'orderStatus' | 'deliveryStatus' | 'paymentStatus',
    item: Category | ColorReference | FlowerInReference | StatusReference,
  ) {
    setName(item.name);

    if (type === 'category') {
      setDescription((item as Category).description ?? '');
      setDialogState({ type, item: item as Category });
      return;
    }

    setDescription('');

    if (type === 'color') {
      setDialogState({ type, item: item as ColorReference });
      return;
    }

    if (type === 'flowerIn') {
      setDialogState({ type, item: item as FlowerInReference });
      return;
    }

    setDialogState({ type, item: item as StatusReference });
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

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setFeedback({ severity: 'error', message: 'Введите название.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      switch (dialogState.type) {
        case 'category': {
          const payload = {
            name: trimmedName,
            description: trimmedDescription ? trimmedDescription : null,
          };

          if (dialogState.item?.id) {
            await updateCategory(dialogState.item.id, payload, token);
            setFeedback({ severity: 'success', message: 'Категория обновлена.' });
          } else {
            await createCategory(payload, token);
            setFeedback({ severity: 'success', message: 'Категория добавлена.' });
          }
          break;
        }

        case 'color':
          if (dialogState.item?.id) {
            await updateColor(dialogState.item.id, { name: trimmedName }, token);
            setFeedback({ severity: 'success', message: 'Цвет обновлен.' });
          } else {
            await createColor({ name: trimmedName }, token);
            setFeedback({ severity: 'success', message: 'Цвет добавлен.' });
          }
          break;

        case 'flowerIn':
          if (dialogState.item?.id) {
            await updateFlowerIn(dialogState.item.id, { name: trimmedName }, token);
            setFeedback({ severity: 'success', message: 'Цветок обновлен.' });
          } else {
            await createFlowerIn({ name: trimmedName }, token);
            setFeedback({ severity: 'success', message: 'Цветок добавлен.' });
          }
          break;

        case 'orderStatus':
          await updateOrderStatusReference(dialogState.item.id, { name: trimmedName }, token);
          setFeedback({ severity: 'success', message: 'Статус заказа обновлен.' });
          break;

        case 'deliveryStatus':
          await updateDeliveryStatusReference(dialogState.item.id, { name: trimmedName }, token);
          setFeedback({ severity: 'success', message: 'Статус доставки обновлен.' });
          break;

        case 'paymentStatus':
          await updatePaymentStatusReference(dialogState.item.id, { name: trimmedName }, token);
          setFeedback({ severity: 'success', message: 'Статус оплаты обновлен.' });
          break;
      }

      await loadReferences(token);
      closeDialog();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось сохранить изменения.';
      setFeedback({ severity: 'error', message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(type: 'category' | 'color' | 'flowerIn', item: Category | ColorReference | FlowerInReference) {
    if (!token) {
      return;
    }

    try {
      if (type === 'category') {
        await deleteCategory(item.id, token);
        setFeedback({ severity: 'success', message: 'Категория удалена.' });
      } else if (type === 'color') {
        await deleteColor(item.id, token);
        setFeedback({ severity: 'success', message: 'Цвет удален.' });
      } else {
        await deleteFlowerIn(item.id, token);
        setFeedback({ severity: 'success', message: 'Цветок удален.' });
      }

      await loadReferences(token);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось удалить элемент.';
      setFeedback({ severity: 'error', message });
    }
  }

  async function handleAdminOrderStatusSave(orderId: string) {
    if (!token) {
      return;
    }

    const status = orderStatusDrafts[orderId];
    if (!status) {
      return;
    }

    try {
      await apiRequest(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      });

      setFeedback({ severity: 'success', message: 'Статус заказа обновлен.' });
      await loadOrders(token);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось обновить статус заказа.';
      setFeedback({ severity: 'error', message });
    }
  }

  async function handleAdminOrderCancel(orderId: string) {
    if (!token) {
      return;
    }

    try {
      await apiRequest(`/admin/orders/${orderId}/cancel`, {
        method: 'PATCH',
        token,
      });

      setFeedback({ severity: 'success', message: 'Заказ отменен.' });
      await loadOrders(token);
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
    [orderStatuses, deliveryStatuses, paymentStatuses],
  );

  const filteredOrders = useMemo(() => {
    const normalizedQuery = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const searchMatches =
        !normalizedQuery ||
        [
          order.id,
          order.orderNumber ? String(order.orderNumber) : '',
          order.id.slice(0, 8),
          order.customerEmail ?? '',
          order.customerFullName ?? '',
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      if (!searchMatches) {
        return false;
      }

      if (orderStatusFilter && order.status !== orderStatusFilter) {
        return false;
      }

      if (deliveryStatusFilter && (order.deliveryStatus ?? '') !== deliveryStatusFilter) {
        return false;
      }

      if (paymentStatusFilter && (order.paymentStatus ?? '') !== paymentStatusFilter) {
        return false;
      }

      if (orderMethodFilter && order.deliveryMethod !== orderMethodFilter) {
        return false;
      }

      const createdAt = new Date(order.createdAtUtc);

      if (orderDateFrom) {
        const fromDate = new Date(`${orderDateFrom}T00:00:00`);
        if (createdAt < fromDate) {
          return false;
        }
      }

      if (orderDateTo) {
        const toDate = new Date(`${orderDateTo}T23:59:59`);
        if (createdAt > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [
    orders,
    orderSearch,
    orderStatusFilter,
    deliveryStatusFilter,
    paymentStatusFilter,
    orderMethodFilter,
    orderDateFrom,
    orderDateTo,
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
            <Tab value="contacts" label="Контакты" />
            <Tab value="analytics" label="Аналитика" />
          </Tabs>
        </CardContent>
      </Card>

      {tab === 'products' ? <FloristPanelPage mode="admin" allowedTabs={['products']} embedded /> : null}

      {tab === 'references' ? (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Tabs value={referenceTab} onChange={(_, value: ReferenceTab) => setReferenceTab(value)} variant="scrollable">
                <Tab value="categories" label="Категории" />
                <Tab value="colors" label="Цвета" />
                <Tab value="flowerIns" label="Цветки" />
                <Tab value="orderStatuses" label="Статусы заказа" />
                <Tab value="deliveryStatuses" label="Статусы доставки" />
                <Tab value="paymentStatuses" label="Статусы оплаты" />
              </Tabs>
            </CardContent>
          </Card>

          {referenceTab === 'categories' ? (
            <ReferenceSection
              title="Категории подарков"
              description="Категории используются для фильтрации и оформления витрины подарков."
              items={filteredCategories}
              search={referenceSearch}
              onSearchChange={setReferenceSearch}
              onEdit={(item) => openEditDialog('category', item)}
              onCreate={() => openCreateDialog('category')}
              onDelete={(item) => void handleDelete('category', item)}
              renderMeta={(item) => item.description || 'Описание не заполнено'}
              createLabel="Новая категория"
            />
          ) : null}

          {referenceTab === 'colors' ? (
            <ReferenceSection
              title="Цвета"
              description="Цвета используются в карточках товаров и в пользовательских фильтрах."
              items={filteredColors}
              search={referenceSearch}
              onSearchChange={setReferenceSearch}
              onEdit={(item) => openEditDialog('color', item)}
              onCreate={() => openCreateDialog('color')}
              onDelete={(item) => void handleDelete('color', item)}
              createLabel="Новый цвет"
            />
          ) : null}

          {referenceTab === 'flowerIns' ? (
            <ReferenceSection
              title="Цветки в составе"
              description="Этот справочник используется для состава букетов и типов цветов."
              items={filteredFlowerIns}
              search={referenceSearch}
              onSearchChange={setReferenceSearch}
              onEdit={(item) => openEditDialog('flowerIn', item)}
              onCreate={() => openCreateDialog('flowerIn')}
              onDelete={(item) => void handleDelete('flowerIn', item)}
              createLabel="Новый цветок"
            />
          ) : null}

          {referenceTab === 'orderStatuses' ? (
            <ReferenceSection
              title="Статусы заказа"
              description="Верхний уровень состояния заказа: активен, завершен, отменен."
              items={filteredOrderStatuses}
              search={referenceSearch}
              onSearchChange={setReferenceSearch}
              onEdit={(item) => openEditDialog('orderStatus', item)}
            />
          ) : null}

          {referenceTab === 'deliveryStatuses' ? (
            <ReferenceSection
              title="Статусы доставки"
              description="Детальный маршрут заказа от рассмотрения до получения клиентом."
              items={filteredDeliveryStatuses}
              search={referenceSearch}
              onSearchChange={setReferenceSearch}
              onEdit={(item) => openEditDialog('deliveryStatus', item)}
            />
          ) : null}

          {referenceTab === 'paymentStatuses' ? (
            <ReferenceSection
              title="Статусы оплаты"
              description="Статусы используются в заказах и в админских фильтрах."
              items={filteredPaymentStatuses}
              search={referenceSearch}
              onSearchChange={setReferenceSearch}
              onEdit={(item) => openEditDialog('paymentStatus', item)}
            />
          ) : null}
        </Box>
      ) : null}

      {tab === 'promotions' ? <AdminPromotionsTab token={token!} /> : null}

      {tab === 'orders' ? (
        <Box sx={{ display: 'grid', gap: 2.5 }}>
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="h5">Все заказы</Typography>
              <Typography variant="body2" color="text.secondary">
                Здесь можно найти заказ, отфильтровать его по статусам и при необходимости вручную обновить состояние.
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gap: 1.25,
                p: { xs: 1.5, md: 2 },
                borderRadius: 2.5,
                bgcolor: alpha('#ffffff', 0.82),
                backdropFilter: 'blur(14px)',
                boxShadow: '0 18px 40px rgba(40, 60, 48, 0.08)',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.25,
                  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) auto' },
                  alignItems: { lg: 'center' },
                }}
              >
                <TextField
                  fullWidth
                  label="Поиск по номеру, имени или email"
                  value={orderSearch}
                  onChange={(event) => setOrderSearch(event.target.value)}
                />

                <Button
                  variant="text"
                  color="inherit"
                  onClick={() => {
                    setOrderSearch('');
                    setOrderStatusFilter('');
                    setDeliveryStatusFilter('');
                    setPaymentStatusFilter('');
                    setOrderMethodFilter('');
                    setOrderDateFrom('');
                    setOrderDateTo('');
                  }}
                  sx={{ alignSelf: { xs: 'stretch', md: 'center' }, minWidth: 132 }}
                >
                  Сбросить
                </Button>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gap: 1.25,
                  p: { xs: 1.25, md: 1.5 },
                  borderRadius: 2,
                  bgcolor: alpha('#ffffff', 0.54),
                  border: '1px solid rgba(24,38,31,0.05)',
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  Фильтры
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.25,
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, minmax(220px, 1fr))',
                      xl: 'repeat(4, minmax(220px, 1fr))',
                    },
                  }}
                >
                  <FormControl fullWidth>
                    <InputLabel>Статус заказа</InputLabel>
                    <Select
                      label="Статус заказа"
                      value={orderStatusFilter}
                      onChange={(event) => setOrderStatusFilter(event.target.value)}
                    >
                      <MenuItem value="">Все</MenuItem>
                      {orderStatuses.map((status) => (
                        <MenuItem key={status.id} value={status.name}>
                          {status.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Статус доставки</InputLabel>
                    <Select
                      label="Статус доставки"
                      value={deliveryStatusFilter}
                      onChange={(event) => setDeliveryStatusFilter(event.target.value)}
                    >
                      <MenuItem value="">Все</MenuItem>
                      {deliveryStatuses.map((status) => (
                        <MenuItem key={status.id} value={status.name}>
                          {status.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Статус оплаты</InputLabel>
                    <Select
                      label="Статус оплаты"
                      value={paymentStatusFilter}
                      onChange={(event) => setPaymentStatusFilter(event.target.value)}
                    >
                      <MenuItem value="">Все</MenuItem>
                      {paymentStatuses.map((status) => (
                        <MenuItem key={status.id} value={status.name}>
                          {status.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Способ получения</InputLabel>
                    <Select
                      label="Способ получения"
                      value={orderMethodFilter}
                      onChange={(event) => setOrderMethodFilter(event.target.value)}
                    >
                      <MenuItem value="">Все</MenuItem>
                      <MenuItem value="Pickup">Самовывоз</MenuItem>
                      <MenuItem value="Delivery">Доставка</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    type="date"
                    label="Дата от"
                    value={orderDateFrom}
                    onChange={(event) => setOrderDateFrom(event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    fullWidth
                    type="date"
                    label="Дата до"
                    value={orderDateTo}
                    onChange={(event) => setOrderDateTo(event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {filteredOrders.map((order) => (
              <Card key={order.id} sx={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(14px)' }}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
                  <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'grid', gap: 0.35 }}>
                      <Typography variant="h5">
                        Заказ #{order.orderNumber ? String(order.orderNumber).padStart(6, '0') : order.id.slice(0, 8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Создан {formatDate(order.createdAtUtc)}
                      </Typography>
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ alignItems: { sm: 'center' } }}>
                      <Typography variant="h5">{formatCurrency(order.totalAmount)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getOrderItemsCountLabel(order.items.length)}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.25,
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))',
                        xl: 'repeat(4, minmax(0, 1fr))',
                      },
                    }}
                  >
                    <OrderInfoCard
                      label="Клиент"
                      primary={order.customerFullName || 'Имя не указано'}
                      secondary={order.customerEmail || 'Email не указан'}
                    />
                    <OrderInfoCard
                      label="Получение"
                      primary={getDeliveryMethodLabel(order.deliveryMethod)}
                      secondary={order.deliveryAddress || 'Адрес не указан'}
                    />
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        borderRadius: 2,
                        bgcolor: alpha('#ffffff', 0.54),
                        boxShadow: 'none',
                        borderColor: 'rgba(24,38,31,0.05)',
                      }}
                    >
                      <CardContent sx={{ p: 1.5, display: 'grid', gap: 0.85 }}>
                        <Typography variant="overline" color="text.secondary">
                          Ответственные
                        </Typography>

                        <Box sx={{ display: 'grid', gap: 0.15 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {order.floristFullName || 'Флорист не назначен'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.floristEmail || 'Email флориста не указан'}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'grid', gap: 0.15 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {order.courierFullName || 'Курьер не назначен'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.courierEmail || 'Email курьера не указан'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                    <OrderInfoCard
                      label="Статусы"
                      primary={`Заказ: ${order.status}`}
                      secondary={`Доставка: ${order.deliveryStatus || 'Не указан'}`}
                      tertiary={`Оплата: ${order.paymentStatus || 'Не указана'}`}
                    />
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Box sx={{ display: 'grid', gap: 1 }}>
                      {order.items.map((item, index) => (
                        <Stack
                          key={`${item.productId}-${index}`}
                          component={RouterLink}
                          to={`/products/${item.productId}`}
                          state={{
                            returnTo: location.pathname + location.search,
                            returnLabel: 'Назад в панель администратора',
                          }}
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          sx={{
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            p: 1,
                            borderRadius: 2,
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 12px 28px rgba(31,42,35,0.08)',
                              backgroundColor: 'rgba(255,255,255,0.94)',
                            },
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.25}
                            sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}
                          >
                            <Box
                              component="img"
                              src={getProductPlaceholderImage(item.productType)}
                              alt={item.productName}
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 1.5,
                                objectFit: 'cover',
                                display: 'block',
                                flexShrink: 0,
                                border: '1px solid rgba(31, 42, 35, 0.08)',
                              }}
                            />
                            <Typography variant="body2" sx={{ minWidth: 0 }}>
                              {item.productName} x {item.quantity}
                            </Typography>
                          </Stack>

                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </Typography>
                        </Stack>
                      ))}
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.25}>
                      <FormControl
                        sx={{
                          width: '100%',
                          maxWidth: { xs: '100%', lg: 320 },
                          flexShrink: 0,
                        }}
                      >
                        <InputLabel>Новый статус</InputLabel>
                        <Select
                          label="Новый статус"
                          value={orderStatusDrafts[order.id] ?? ''}
                          onChange={(event: SelectChangeEvent) =>
                            setOrderStatusDrafts((current) => ({ ...current, [order.id]: event.target.value }))
                          }
                        >
                          <ListSubheader>Статусы заказа</ListSubheader>
                          {allStatusOptions.order.map((status) => (
                            <MenuItem key={status.id} value={status.name}>
                              {status.name}
                            </MenuItem>
                          ))}

                          <ListSubheader>Статусы доставки</ListSubheader>
                          {allStatusOptions.delivery.map((status) => (
                            <MenuItem key={status.id} value={status.name}>
                              {status.name}
                            </MenuItem>
                          ))}

                          <ListSubheader>Статусы оплаты</ListSubheader>
                          {allStatusOptions.payment.map((status) => (
                            <MenuItem key={status.id} value={status.name}>
                              {status.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => void handleAdminOrderStatusSave(order.id)}
                        sx={{ minWidth: { lg: 150 }, alignSelf: { xs: 'stretch', lg: 'center' } }}
                      >
                        Сохранить статус
                      </Button>

                      {order.status !== 'Отменен' && order.status !== 'Завершен' ? (
                        <Button
                          variant="text"
                          color="inherit"
                          size="small"
                          onClick={() => void handleAdminOrderCancel(order.id)}
                          sx={{ minWidth: { lg: 126 }, alignSelf: { xs: 'stretch', lg: 'center' } }}
                        >
                          Отменить заказ
                        </Button>
                      ) : null}
                    </Stack>
                  </Box>
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

      {tab === 'contacts' ? <AdminSiteContactsTab token={token!} /> : null}

      {tab === 'analytics' ? <AdminAnalyticsTab token={token!} /> : null}

      <Dialog open={Boolean(dialogState)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{getDialogTitle(dialogState)}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2.25, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {getDialogDescription(dialogState)}
          </Typography>

          <TextField
            autoFocus
            label="Название"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
          />

          {dialogState?.type === 'category' ? (
            <TextField
              label="Описание"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          ) : null}

          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'flex-end' }}>
            <Button color="inherit" onClick={closeDialog} disabled={isSaving}>
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
