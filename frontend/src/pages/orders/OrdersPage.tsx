import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Lock } from 'lucide-react';
import type { Order } from '../../entities/cart';
import type { ProductType } from '../../entities/catalog';
import { useAuth } from '../../features/auth/AuthContext';
import { apiRequest } from '../../shared/api';
import { formatCurrency, formatDate } from '../../shared/format';

type OrdersView = 'active' | 'completed';

function getProductPlaceholderImage(productType: ProductType) {
  if (productType === 'Flower') {
    return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80';
  }

  if (productType === 'Gift') {
    return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80';
  }

  return 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=900&q=80';
}

function getDeliveryMethodLabel(method: string) {
  return method === 'Pickup' ? 'Самовывоз' : 'Доставка';
}

function getPaymentStatusLabel(status?: string | null) {
  switch (status) {
    case 'Pending':
      return 'Ожидает оплаты';
    case 'Paid':
      return 'Оплачено';
    case 'Failed':
      return 'Ошибка оплаты';
    default:
      return 'Не указано';
  }
}

const deliveryOrderSteps = [
  'Заказ на рассмотрении',
  'Заказ собирается',
  'Заказ передается в доставку',
  'Заказ принят в доставку',
  'Заказ в пути',
  'Заказ доставлен',
];

const pickupOrderSteps = ['Заказ на рассмотрении', 'Заказ собирается', 'Заказ готов к выдаче'];

function getDeliveryOrderStep(status: string) {
  switch (status) {
    case 'PendingPayment':
    case 'Paid':
      return 0;
    case 'Accepted':
    case 'InAssembly':
      return 1;
    case 'Assembled':
      return 2;
    case 'TransferredToCourier':
      return 3;
    case 'InTransit':
      return 4;
    case 'Delivered':
    case 'ReceivedByCustomer':
      return 5;
    case 'Cancelled':
      return 0;
    default:
      return 0;
  }
}

function getPickupOrderStep(status: string) {
  switch (status) {
    case 'PendingPayment':
    case 'Paid':
      return 0;
    case 'Accepted':
    case 'InAssembly':
      return 1;
    case 'Assembled':
    case 'Delivered':
    case 'ReceivedByCustomer':
      return 2;
    case 'Cancelled':
      return 0;
    default:
      return 0;
  }
}

function isCompletedOrder(order: Order) {
  return ['ReceivedByCustomer', 'Cancelled'].includes(order.status) || (order.deliveryMethod === 'Pickup' && order.status === 'Delivered');
}

function isLastStepCompleted(order: Order) {
  if (order.deliveryMethod === 'Pickup') {
    return ['Delivered', 'ReceivedByCustomer'].includes(order.status);
  }

  return order.status === 'ReceivedByCustomer';
}

function renderOrderCard(order: Order, isMobile: boolean) {
  const isPickup = order.deliveryMethod === 'Pickup';
  const activeStep = isPickup ? getPickupOrderStep(order.status) : getDeliveryOrderStep(order.status);
  const orderSteps = isPickup ? pickupOrderSteps : deliveryOrderSteps;
  const lastStepCompleted = isLastStepCompleted(order);

  return (
    <Card
      key={order.id}
      sx={{
        background: 'rgba(255,255,255,0.84)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(24,38,31,0.08)',
        boxShadow: '0 22px 60px rgba(38, 54, 45, 0.06)',
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
        >
          <Box sx={{ display: 'grid', gap: 0.5 }}>
            <Typography variant="h5">Заказ {order.id.slice(0, 8)}</Typography>
            <Typography variant="body2" color="text.secondary">
              Оформлен {formatDate(order.createdAtUtc)}
            </Typography>
          </Box>

          <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="h5">{formatCurrency(order.totalAmount)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {order.items.length} {order.items.length === 1 ? 'позиция' : order.items.length < 5 ? 'позиции' : 'позиций'}
            </Typography>
          </Box>
        </Stack>

        <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha('#f8fbf9', 0.92), boxShadow: 'none' }}>
          <CardContent sx={{ display: 'grid', gap: 1.5, p: { xs: 1.5, md: 2 } }}>
            <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'} alternativeLabel={!isMobile}>
              {orderSteps.map((step, index) => (
                <Step key={step} completed={lastStepCompleted && index === orderSteps.length - 1 ? true : undefined}>
                  <StepLabel>{step}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha('#f8fbf9', 0.92), boxShadow: 'none' }}>
            <CardContent sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Тип получения
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {getDeliveryMethodLabel(order.deliveryMethod)}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha('#f8fbf9', 0.92), boxShadow: 'none' }}>
            <CardContent sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Статус оплаты
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {getPaymentStatusLabel(order.paymentStatus)}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha('#f8fbf9', 0.92), boxShadow: 'none' }}>
            <CardContent sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Адрес
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {order.deliveryAddress || 'Самовывоз из магазина'}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Divider />

        <Box sx={{ display: 'grid', gap: 1.25 }}>
          {order.items.map((item, index) => (
            <Box
              key={`${item.productId}-${index}`}
              component={RouterLink}
              to={`/products/${item.productId}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: '72px minmax(0, 1fr)',
                gap: 1.25,
                alignItems: 'center',
                color: 'inherit',
                textDecoration: 'none',
                p: 1,
                borderRadius: 2,
                transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 12px 28px rgba(31,42,35,0.08)',
                  backgroundColor: alpha('#ffffff', 0.94),
                },
              }}
            >
              <Box
                component="img"
                src={getProductPlaceholderImage(item.productType)}
                alt={item.productName}
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 2,
                  objectFit: 'cover',
                  display: 'block',
                  bgcolor: '#f3f7f4',
                  border: '1px solid rgba(24,38,31,0.06)',
                }}
              />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, minWidth: 0 }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {item.productName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {formatCurrency(item.unitPrice * item.quantity)}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export function OrdersPage() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<OrdersView>('active');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (!session?.token) {
      setOrders([]);
      return;
    }

    setIsLoading(true);
    void apiRequest<Order[]>('/Orders/my', { token: session.token })
      .then(setOrders)
      .finally(() => setIsLoading(false));
  }, [session]);

  const activeOrders = useMemo(() => orders.filter((order) => !isCompletedOrder(order)), [orders]);
  const completedOrders = useMemo(() => orders.filter(isCompletedOrder), [orders]);
  const visibleOrders = view === 'active' ? activeOrders : completedOrders;

  if (!session) {
    return (
      <Card
        sx={{
          background: 'rgba(255,255,255,0.84)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <CardContent
          sx={{
            minHeight: 340,
            display: 'grid',
            placeItems: 'center',
            p: { xs: 3, md: 5 },
          }}
        >
          <Box sx={{ maxWidth: 520, textAlign: 'center', display: 'grid', gap: 2.25 }}>
            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.4rem' } }}>
              История заказов доступна после входа
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Войдите в аккаунт, чтобы видеть оформленные заказы, способ получения и текущий этап доставки.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'center', pt: 1 }}>
              <Button component={RouterLink} to="/account" variant="contained" color="primary" startIcon={<Lock size={16} />}>
                Войти в аккаунт
              </Button>
              <Button component={RouterLink} to="/bouquets" variant="text" color="inherit" size="large">
                Вернуться к каталогу
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gap: 0.75 }}>
        <Typography variant="h1">Мои заказы</Typography>
        <Typography variant="body1" color="text.secondary">
          Отслеживайте этапы сборки, доставки и самовывоза в одном месте.
        </Typography>
      </Box>

      <Card sx={{ backgroundColor: alpha('#ffffff', 0.82), backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, value: OrdersView | null) => {
              if (value) {
                setView(value);
              }
            }}
            sx={{
              width: 'fit-content',
              flexWrap: 'wrap',
              '& .MuiToggleButton-root': {
                px: 2.25,
              },
            }}
          >
            <ToggleButton value="active">Активные</ToggleButton>
            <ToggleButton value="completed">Завершенные</ToggleButton>
          </ToggleButtonGroup>

          {isLoading ? (
            <Card sx={{ backgroundColor: alpha('#ffffff', 0.82), backdropFilter: 'blur(14px)' }}>
              <CardContent sx={{ minHeight: 112, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <Typography color="text.secondary">Загружаем заказы...</Typography>
              </CardContent>
            </Card>
          ) : null}

          {!isLoading && visibleOrders.length === 0 ? (
            <Card sx={{ backgroundColor: alpha('#ffffff', 0.82), backdropFilter: 'blur(14px)' }}>
              <CardContent sx={{ minHeight: 148, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <Box sx={{ display: 'grid', gap: 0.75 }}>
                  <Typography variant="h5">{view === 'active' ? 'Нет активных заказов' : 'Нет завершенных заказов'}</Typography>
                  <Typography color="text.secondary">
                    {view === 'active'
                      ? 'Как только вы оформите заказ, он появится здесь.'
                      : 'Завершенные заказы будут сохранены в этом разделе.'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : null}

          {!isLoading && visibleOrders.length > 0 ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              {visibleOrders.map((order) => renderOrderCard(order, isMobile))}
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </Box>
  );
}
