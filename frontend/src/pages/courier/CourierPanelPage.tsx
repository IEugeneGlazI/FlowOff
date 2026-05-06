import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Bike, PackageCheck } from 'lucide-react';
import type { Order } from '../../entities/cart';
import { useAuth } from '../../features/auth/AuthContext';
import { apiRequest, ApiError } from '../../shared/api';
import { formatCurrency, formatDate } from '../../shared/format';

type FeedbackState = {
  severity: 'success' | 'error';
  message: string;
};

type CourierTab = 'available' | 'assigned';

function getOrderStageLabel(order: Order) {
  switch (order.status) {
    case 'InTransit':
      return 'Заказ в пути';
    case 'Delivered':
      return 'Заказ доставлен';
    case 'ReceivedByCustomer':
      return 'Заказ принят покупателем';
    default:
      return 'Заказ ожидает принятия в доставку';
  }
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

export function CourierPanelPage() {
  const { session } = useAuth();
  const token = session?.token ?? null;
  const isCourier = session?.role === 'Courier';

  const [tab, setTab] = useState<CourierTab>('available');
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    if (!token || !isCourier) {
      return;
    }

    void loadOrders();
  }, [token, isCourier]);

  async function loadOrders() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    try {
      const [nextAvailableOrders, nextAssignedOrders] = await Promise.all([
        apiRequest<Order[]>('/courier/orders/available', { token }),
        apiRequest<Order[]>('/courier/orders', { token }),
      ]);

      setAvailableOrders(nextAvailableOrders);
      setAssignedOrders(nextAssignedOrders);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAcceptOrder(orderId: string) {
    if (!token) {
      return;
    }

    setFeedback(null);

    try {
      await apiRequest(`/courier/orders/${orderId}/accept`, {
        method: 'PATCH',
        token,
      });

      setFeedback({ severity: 'success', message: 'Доставка принята.' });
      setTab('assigned');
      await loadOrders();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось принять доставку.';
      setFeedback({ severity: 'error', message });
    }
  }

  async function handleDeliveryStatusChange(orderId: string, status: 'Delivered' | 'ReceivedByCustomer') {
    if (!token) {
      return;
    }

    setFeedback(null);

    try {
      await apiRequest(`/courier/orders/${orderId}/delivery-status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      });

      setFeedback({
        severity: 'success',
        message:
          status === 'Delivered'
            ? 'Заказ отмечен как доставленный.'
            : 'Заказ отмечен как принятый покупателем.',
      });
      await loadOrders();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось обновить статус доставки.';
      setFeedback({ severity: 'error', message });
    }
  }

  const activeAssignedOrders = useMemo(
    () => assignedOrders.filter((order) => ['InTransit', 'Delivered'].includes(order.status)),
    [assignedOrders],
  );

  if (!session || !isCourier) {
    return (
      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ minHeight: 220, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <Typography>Панель доставщика доступна только для аккаунта доставщика.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gap: 0.75 }}>
        <Typography variant="h1">Панель доставщика</Typography>
        <Typography variant="body1" color="text.secondary">
          Здесь можно принять собранный заказ в доставку и отмечать его продвижение до передачи покупателю.
        </Typography>
      </Box>

      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Tabs value={tab} onChange={(_, value: CourierTab) => setTab(value)} sx={{ minHeight: 48 }}>
            <Tab value="available" label="Ожидают принятия" />
            <Tab value="assigned" label="Мои доставки" />
          </Tabs>
        </CardContent>
      </Card>

      {tab === 'available' ? (
        <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
          <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="h5">Ожидают принятия</Typography>
              <Typography variant="body2" color="text.secondary">
                Здесь находятся заказы, уже подготовленные флористом к передаче в доставку.
              </Typography>
            </Box>

            {isLoading ? <Typography>Загружаем заказы...</Typography> : null}

            <Box sx={{ display: 'grid', gap: 1.25 }}>
              {availableOrders.map((order) => (
                <Card key={order.id} variant="outlined" sx={{ borderRadius: 2, boxShadow: 'none' }}>
                  <CardContent sx={{ display: 'grid', gap: 1.5 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'grid', gap: 0.4 }}>
                        <Typography variant="h6">Заказ {order.id.slice(0, 8)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(order.createdAtUtc)}
                          {order.deliveryAddress ? ` • ${order.deliveryAddress}` : ''}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        <Chip icon={<PackageCheck size={16} />} label="Заказ передается в доставку" color="warning" variant="outlined" />
                        <Chip label={formatCurrency(order.totalAmount)} variant="outlined" />
                      </Stack>
                    </Stack>

                    <Box sx={{ display: 'grid', gap: 1 }}>
                      {order.items.map((item, index) => (
                        <Stack
                          key={`${item.productId}-${index}`}
                          component={RouterLink}
                          to={`/products/${item.productId}`}
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

                    <Divider />

                    <Button variant="contained" startIcon={<Bike size={16} />} onClick={() => void handleAcceptOrder(order.id)}>
                      Принять доставку
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {!isLoading && availableOrders.length === 0 ? (
                <Typography color="text.secondary">Сейчас нет заказов, которые ожидают принятия в доставку.</Typography>
              ) : null}
            </Box>
          </CardContent>
        </Card>
      ) : null}

      {tab === 'assigned' ? (
        <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
          <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="h5">Мои доставки</Typography>
              <Typography variant="body2" color="text.secondary">
                Здесь отображаются доставки, которые уже приняты вами в работу.
              </Typography>
            </Box>

            {isLoading ? <Typography>Загружаем заказы...</Typography> : null}

            <Box sx={{ display: 'grid', gap: 1.25 }}>
              {activeAssignedOrders.map((order) => (
                <Card key={order.id} variant="outlined" sx={{ borderRadius: 2, boxShadow: 'none' }}>
                  <CardContent sx={{ display: 'grid', gap: 1.5 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'grid', gap: 0.4 }}>
                        <Typography variant="h6">Заказ {order.id.slice(0, 8)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(order.createdAtUtc)}
                          {order.deliveryAddress ? ` • ${order.deliveryAddress}` : ''}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        <Chip icon={<PackageCheck size={16} />} label={getOrderStageLabel(order)} color="primary" variant="outlined" />
                        <Chip label={formatCurrency(order.totalAmount)} variant="outlined" />
                      </Stack>
                    </Stack>

                    <Box sx={{ display: 'grid', gap: 1 }}>
                      {order.items.map((item, index) => (
                        <Stack
                          key={`${item.productId}-${index}`}
                          component={RouterLink}
                          to={`/products/${item.productId}`}
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

                    <Divider />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                      {order.status === 'InTransit' ? (
                        <Button variant="contained" onClick={() => void handleDeliveryStatusChange(order.id, 'Delivered')}>
                          Отметить: Заказ доставлен
                        </Button>
                      ) : null}
                      {order.status === 'Delivered' ? (
                        <Button variant="outlined" color="inherit" onClick={() => void handleDeliveryStatusChange(order.id, 'ReceivedByCustomer')}>
                          Отметить: Заказ принят покупателем
                        </Button>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              ))}

              {!isLoading && activeAssignedOrders.length === 0 ? (
                <Typography color="text.secondary">У вас пока нет активных доставок.</Typography>
              ) : null}
            </Box>
          </CardContent>
        </Card>
      ) : null}

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
