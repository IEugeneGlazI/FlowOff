import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { BarChart3, Download, RefreshCw } from 'lucide-react';
import type {
  AdminAnalytics,
  EmployeePerformance,
  StatusMetric,
  TopProductAnalytics,
  TrendPoint,
} from '../../entities/analytics';
import { getAdminAnalytics } from '../../features/analytics/analyticsApi';
import { ApiError } from '../../shared/api';
import { downloadExcelWorkbook } from '../../shared/excelWorkbook';
import { formatCurrency, formatDate } from '../../shared/format';

type FeedbackState = {
  severity: 'success' | 'error';
  message: string;
};

function formatInputDate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatRangeDate(value: string) {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}.${month}.${year}` : value;
}

function getDefaultRange() {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 29);

  return {
    dateFrom: formatInputDate(from),
    dateTo: formatInputDate(today),
  };
}

function MetricCard({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <Card
      sx={{
        height: '100%',
        background: 'rgba(255,255,255,0.84)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <CardContent sx={{ display: 'grid', gap: 0.75, p: { xs: 2, md: 2.25 } }}>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: 28, md: 32 } }}>
          {value}
        </Typography>
        {secondary ? (
          <Typography variant="body2" color="text.secondary">
            {secondary}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TrendChart({
  title,
  subtitle,
  data,
  granularity,
}: {
  title: string;
  subtitle: string;
  data: TrendPoint[];
  granularity: string;
}) {
  const maxRevenue = Math.max(...data.map((point) => point.revenue), 1);

  return (
    <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
      <CardContent
        sx={{
          display: 'grid',
          gap: 2,
          p: { xs: 2, md: 2.5 },
          height: '100%',
          gridTemplateRows: 'auto 1fr',
        }}
      >
        <Box sx={{ display: 'grid', gap: 0.5 }}>
          <Typography variant="h5">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>

        <Box
          sx={{
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 0.5,
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'end',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(28px, 1fr))`,
              gap: 1,
              alignItems: 'end',
              minHeight: 300,
              minWidth: Math.max(data.length * 44, 320),
            }}
          >
            {data.map((point) => {
              const height = `${Math.max((point.revenue / maxRevenue) * 100, point.revenue > 0 ? 8 : 2)}%`;

              return (
                <Stack
                  key={point.periodStartUtc}
                  spacing={0.75}
                  sx={{
                    alignItems: 'center',
                    minWidth: 0,
                    height: '100%',
                    justifyContent: 'end',
                }}
              >
                <Box sx={{ width: '100%', height: 220, display: 'flex', alignItems: 'end' }}>
                  <Tooltip
                    title={`${point.label}: ${point.revenue > 0 ? formatCurrency(point.revenue) : formatCurrency(0)}`}
                    arrow
                    placement="top"
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height,
                        minHeight: 6,
                        borderRadius: granularity === 'monthly' ? '8px 8px 2px 2px' : '6px 6px 2px 2px',
                        background: 'linear-gradient(180deg, rgba(115, 173, 131, 0.95) 0%, rgba(79, 133, 95, 0.82) 100%)',
                        boxShadow: '0 10px 22px rgba(79, 133, 95, 0.18)',
                        transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 14px 28px rgba(79, 133, 95, 0.24)',
                            filter: 'brightness(1.03)',
                          },
                        }}
                      />
                    </Tooltip>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2 }}
                  >
                    {point.label}
                  </Typography>
                </Stack>
              );
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function DistributionChart({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: StatusMetric[];
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const palette = ['#5c8f73', '#8ab58f', '#d0e4d5', '#c6d8cb', '#90b39b', '#b8d0bf', '#729d82'];

  return (
    <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
      <CardContent sx={{ display: 'grid', gap: 2, p: { xs: 2, md: 2.5 } }}>
        <Box sx={{ display: 'grid', gap: 0.5 }}>
          <Typography variant="h5">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ width: '100%', minHeight: 12 }}>
          {items.map((item, index) => (
            <Box
              key={item.label}
              sx={{
                flex: Math.max(item.count, 1),
                borderRadius: 999,
                bgcolor: palette[index % palette.length],
              }}
            />
          ))}
        </Stack>

        <Stack spacing={1.1}>
          {items.map((item, index) => {
            const ratio = total > 0 ? (item.count / total) * 100 : 0;

            return (
              <Stack key={item.label} spacing={0.55}>
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: palette[index % palette.length], flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ minWidth: 0 }}>
                      {item.label}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {item.count} ({ratio.toFixed(0)}%)
                  </Typography>
                </Stack>
                <Box sx={{ height: 8, borderRadius: 999, bgcolor: alpha('#5c8f73', 0.12), overflow: 'hidden' }}>
                  <Box
                    sx={{
                      width: `${ratio}%`,
                      height: '100%',
                      borderRadius: 999,
                      bgcolor: palette[index % palette.length],
                    }}
                  />
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

function LeaderboardCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: EmployeePerformance[];
}) {
  const maxCompleted = Math.max(...items.map((item) => item.completedOrders), 1);

  return (
    <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
      <CardContent sx={{ display: 'grid', gap: 2, p: { xs: 2, md: 2.5 } }}>
        <Box sx={{ display: 'grid', gap: 0.5 }}>
          <Typography variant="h5">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>

        <Stack spacing={1.25}>
          {items.map((item) => {
            const ratio = (item.completedOrders / maxCompleted) * 100;

            return (
              <Card
                key={item.employeeId}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  boxShadow: 'none',
                  bgcolor: alpha('#ffffff', 0.68),
                }}
              >
                <CardContent sx={{ p: 1.5, display: 'grid', gap: 1 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'grid', gap: 0.2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {item.fullName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.email || 'Email не указан'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      <Chip size="small" label={`Заказов: ${item.totalAssignedOrders}`} />
                      <Chip size="small" label={`Завершено: ${item.completedOrders}`} />
                      <Chip size="small" label={`Активно: ${item.activeOrders}`} />
                    </Stack>
                  </Stack>

                  <Box sx={{ height: 8, borderRadius: 999, bgcolor: alpha('#5c8f73', 0.12), overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${ratio}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, rgba(115,173,131,0.95) 0%, rgba(79,133,95,0.82) 100%)',
                      }}
                    />
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Доля завершения: {item.completionRatePercent.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Выручка: {formatCurrency(item.revenueHandled)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

function TopProductsCard({ items }: { items: TopProductAnalytics[] }) {
  const maxQuantity = Math.max(...items.map((item) => item.quantitySold), 1);

  return (
    <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
      <CardContent sx={{ display: 'grid', gap: 2, p: { xs: 2, md: 2.5 } }}>
        <Box sx={{ display: 'grid', gap: 0.5 }}>
          <Typography variant="h5">Популярные товары</Typography>
          <Typography variant="body2" color="text.secondary">
            Лидеры по количеству продаж и выручке.
          </Typography>
        </Box>

        <Stack spacing={1.1}>
          {items.map((item) => {
            const ratio = (item.quantitySold / maxQuantity) * 100;

            return (
              <Card
                key={`${item.productType}-${item.productId}`}
                variant="outlined"
                sx={{ borderRadius: 2, boxShadow: 'none', bgcolor: alpha('#ffffff', 0.68) }}
              >
                <CardContent sx={{ p: 1.5, display: 'grid', gap: 0.9 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'grid', gap: 0.2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {item.productName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.productType === 'Bouquet' ? 'Букет' : item.productType === 'Flower' ? 'Цветок' : 'Подарок'}
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(item.revenue)}
                    </Typography>
                  </Stack>

                  <Box sx={{ height: 8, borderRadius: 999, bgcolor: alpha('#5c8f73', 0.12), overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${ratio}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, rgba(115,173,131,0.95) 0%, rgba(79,133,95,0.82) 100%)',
                      }}
                    />
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Продано штук: {item.quantitySold}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Заказов: {item.ordersCount}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

function exportAnalytics(analytics: AdminAnalytics) {
  downloadExcelWorkbook(`flowoff-analytics-${analytics.dateFrom}-${analytics.dateTo}`, [
    {
      name: 'Сводка',
      columns: ['Показатель', 'Значение'],
      rows: [
        ['Период от', analytics.dateFrom],
        ['Период до', analytics.dateTo],
        ['Всего заказов', analytics.summary.totalOrders],
        ['Активные заказы', analytics.summary.activeOrders],
        ['Завершенные заказы', analytics.summary.completedOrders],
        ['Отмененные заказы', analytics.summary.cancelledOrders],
        ['Доставка', analytics.summary.deliveryOrders],
        ['Самовывоз', analytics.summary.pickupOrders],
        ['Оплаченные заказы', analytics.summary.paidOrders],
        ['Ожидают оплаты', analytics.summary.pendingPaymentOrders],
        ['Уникальные клиенты', analytics.summary.uniqueCustomers],
        ['Выручка', analytics.summary.revenue],
        ['Средний чек', analytics.summary.averageOrderValue],
      ],
    },
    {
      name: 'Периоды',
      columns: ['Период', 'Заказов', 'Выручка', 'Средний чек'],
      rows: analytics.revenueByPeriods.map((period) => [
        period.label,
        period.ordersCount,
        period.revenue,
        period.averageOrderValue,
      ]),
    },
    {
      name: 'Динамика',
      columns: ['Дата', 'Заказов', 'Выручка'],
      rows: analytics.revenueTrend.map((point) => [point.label, point.ordersCount, point.revenue]),
    },
    {
      name: 'Товары',
      columns: ['Тип', 'Товар', 'Продано штук', 'Заказов', 'Выручка'],
      rows: analytics.topProducts.map((item) => [
        item.productType,
        item.productName,
        item.quantitySold,
        item.ordersCount,
        item.revenue,
      ]),
    },
    {
      name: 'Флористы',
      columns: ['Флорист', 'Email', 'Всего заказов', 'Активных', 'Завершенных', 'Отмененных', 'Выручка', 'Доля завершения %'],
      rows: analytics.florists.map((item) => [
        item.fullName,
        item.email,
        item.totalAssignedOrders,
        item.activeOrders,
        item.completedOrders,
        item.cancelledOrders,
        item.revenueHandled,
        item.completionRatePercent,
      ]),
    },
    {
      name: 'Курьеры',
      columns: ['Курьер', 'Email', 'Всего заказов', 'Активных', 'Завершенных', 'Отмененных', 'Выручка', 'Доля завершения %'],
      rows: analytics.couriers.map((item) => [
        item.fullName,
        item.email,
        item.totalAssignedOrders,
        item.activeOrders,
        item.completedOrders,
        item.cancelledOrders,
        item.revenueHandled,
        item.completionRatePercent,
      ]),
    },
    {
      name: 'Статусы',
      columns: ['Раздел', 'Статус', 'Количество'],
      rows: [
        ...analytics.orderStatuses.map((item) => ['Заказы', item.label, item.count]),
        ...analytics.deliveryStatuses.map((item) => ['Доставка', item.label, item.count]),
        ...analytics.paymentStatuses.map((item) => ['Оплата', item.label, item.count]),
      ],
    },
  ]);
}

export function AdminAnalyticsTab({ token }: { token: string }) {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);

  async function loadAnalytics(range?: { dateFrom: string; dateTo: string }) {
    const nextRange = range ?? { dateFrom, dateTo };

    if (nextRange.dateFrom && nextRange.dateTo && nextRange.dateFrom > nextRange.dateTo) {
      setFeedback({ severity: 'error', message: 'Дата начала периода не может быть позже даты окончания.' });
      return;
    }

    setIsLoading(true);

    try {
      const next = await getAdminAnalytics(token, nextRange);
      setAnalytics(next);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось загрузить аналитику.';
      setFeedback({ severity: 'error', message });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics(defaultRange);
  }, [token]);

  if (isLoading) {
    return (
      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 }, display: 'grid', gap: 1 }}>
          <Typography variant="h5">Аналитика загружается</Typography>
          <Typography variant="body2" color="text.secondary">
            Собираем выручку, популярность товаров и показатели команды.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <>
        <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 }, display: 'grid', gap: 1.5 }}>
            <Typography variant="h5">Не удалось загрузить аналитику</Typography>
            <Typography variant="body2" color="text.secondary">
              Попробуйте обновить данные еще раз.
            </Typography>
            <Button variant="contained" startIcon={<RefreshCw size={16} />} onClick={() => void loadAnalytics()} sx={{ width: 'fit-content' }}>
              Обновить
            </Button>
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
      </>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 1.5 }}>
          <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.25} sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <BarChart3 size={18} />
                <Typography variant="h5">Аналитика</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Сводка по прибыли, товарам, флористам, курьерам и статусам заказов.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Обновлено {formatDate(analytics.generatedAtUtc)} • Период {formatRangeDate(analytics.dateFrom)} - {formatRangeDate(analytics.dateTo)}
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1} sx={{ alignItems: { lg: 'center' }, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                type="date"
                label="Дата от"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ minWidth: 170, bgcolor: alpha('#ffffff', 0.72) }}
              />
              <TextField
                size="small"
                type="date"
                label="Дата до"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ minWidth: 170, bgcolor: alpha('#ffffff', 0.72) }}
              />
              <Button variant="outlined" color="inherit" startIcon={<RefreshCw size={16} />} onClick={() => void loadAnalytics()}>
                Показать
              </Button>
              <Button variant="contained" startIcon={<Download size={16} />} onClick={() => exportAnalytics(analytics)}>
                Выгрузить в Excel
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        <MetricCard
          label="Выручка"
          value={formatCurrency(analytics.summary.revenue)}
          secondary={`Период: ${formatRangeDate(analytics.dateFrom)} - ${formatRangeDate(analytics.dateTo)}`}
        />
        <MetricCard
          label="Средний чек"
          value={formatCurrency(analytics.summary.averageOrderValue)}
          secondary={`Оплаченных заказов: ${analytics.summary.paidOrders}`}
        />
        <MetricCard
          label="Всего заказов"
          value={String(analytics.summary.totalOrders)}
          secondary={`Активных: ${analytics.summary.activeOrders} · Завершенных: ${analytics.summary.completedOrders}`}
        />
        <MetricCard
          label="Клиенты"
          value={String(analytics.summary.uniqueCustomers)}
          secondary={`Самовывоз: ${analytics.summary.pickupOrders} · Доставка: ${analytics.summary.deliveryOrders}`}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(0, 1.35fr) minmax(320px, 0.9fr)',
          },
        }}
      >
        <TrendChart
          title={analytics.trendGranularity === 'monthly' ? 'Динамика выручки по месяцам' : 'Динамика выручки по дням'}
          subtitle={
            analytics.trendGranularity === 'monthly'
              ? 'Диапазон широкий, поэтому график автоматически сгруппирован по месяцам.'
              : 'График построен по каждому дню выбранного периода.'
          }
          data={analytics.revenueTrend}
          granularity={analytics.trendGranularity}
        />

        <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
          <CardContent sx={{ display: 'grid', gap: 2, p: { xs: 2, md: 2.5 } }}>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="h5">Выручка по периодам</Typography>
              <Typography variant="body2" color="text.secondary">
                Быстрое сравнение выбранного диапазона с соседними и крупными периодами.
              </Typography>
            </Box>

            <Stack spacing={1.15}>
              {analytics.revenueByPeriods.map((period) => (
                <Card
                  key={period.key}
                  variant="outlined"
                  sx={{ borderRadius: 2, boxShadow: 'none', bgcolor: alpha('#ffffff', 0.68) }}
                >
                  <CardContent sx={{ p: 1.5, display: 'grid', gap: 0.5 }}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {period.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {period.ordersCount} заказов
                      </Typography>
                    </Stack>
                    <Typography variant="h6">{formatCurrency(period.revenue)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Средний чек: {formatCurrency(period.averageOrderValue)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            xl: 'repeat(2, minmax(0, 1fr))',
          },
        }}
      >
        <DistributionChart
          title="Статусы заказов"
          subtitle="Общий верхний статус заказа в системе."
          items={analytics.orderStatuses}
        />
        <DistributionChart
          title="Статусы доставки"
          subtitle="На каких этапах сейчас находятся заказы."
          items={analytics.deliveryStatuses}
        />
        <DistributionChart
          title="Статусы оплаты"
          subtitle="Сколько заказов уже оплачено и сколько еще ждут оплаты."
          items={analytics.paymentStatuses}
        />
        <DistributionChart
          title="Способы получения"
          subtitle="Доли самовывоза и доставки."
          items={analytics.deliveryMethods}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
          },
        }}
      >
        <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
          <CardContent sx={{ display: 'grid', gap: 2, p: { xs: 2, md: 2.5 } }}>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="h5">Продажи по типам товаров</Typography>
              <Typography variant="body2" color="text.secondary">
                Что дает больше выручки и что чаще покупают.
              </Typography>
            </Box>

            <Stack spacing={1.15}>
              {analytics.productTypes.map((item) => (
                <Card
                  key={item.productType}
                  variant="outlined"
                  sx={{ borderRadius: 2, boxShadow: 'none', bgcolor: alpha('#ffffff', 0.68) }}
                >
                  <CardContent sx={{ p: 1.5, display: 'grid', gap: 0.65 }}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {item.productType === 'Bouquet' ? 'Букеты' : item.productType === 'Flower' ? 'Цветы' : 'Подарки'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(item.revenue)}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Продано позиций: {item.itemsSold}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Заказов с этим типом: {item.ordersCount}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <TopProductsCard items={analytics.topProducts} />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            xl: 'repeat(2, minmax(0, 1fr))',
          },
        }}
      >
        <LeaderboardCard
          title="Эффективность флористов"
          subtitle="Сколько заказов ведут флористы, сколько завершают и какую выручку проводят."
          items={analytics.florists}
        />
        <LeaderboardCard
          title="Эффективность доставщиков"
          subtitle="Активность курьеров, завершение доставок и объем обработанной выручки."
          items={analytics.couriers}
        />
      </Box>

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
