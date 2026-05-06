import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, SyntheticEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
} from '@mui/material';
import { ArrowLeft, Lock, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../features/cart/CartContext';
import { useAuth } from '../../features/auth/AuthContext';
import { formatCurrency } from '../../shared/format';
import { apiRequest, ApiError } from '../../shared/api';
import { getAddressSuggestions } from '../../features/address/addressApi';
import type { AddressSuggestion } from '../../entities/address';

type DeliveryMethod = 'Delivery' | 'Pickup';

function getCartItemPlaceholderImage(productType: 'Flower' | 'Bouquet' | 'Gift') {
  if (productType === 'Flower') {
    return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=480&q=80';
  }

  if (productType === 'Gift') {
    return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=480&q=80';
  }

  return 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=480&q=80';
}

export function CartPage() {
  const { cart, updateItem, clearCart, refreshCart } = useCart();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressOptions, setAddressOptions] = useState<AddressSuggestion[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressLookupError, setAddressLookupError] = useState<string | null>(null);
  const [payOnPickup, setPayOnPickup] = useState(false);
  const [feedback, setFeedback] = useState<{ severity: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCheckout = useMemo(
    () => Boolean(session?.token && session.role === 'Customer' && cart && cart.items.length > 0),
    [session, cart],
  );

  useEffect(() => {
    if (deliveryMethod !== 'Delivery') {
      setAddressOptions([]);
      setIsAddressLoading(false);
      setAddressLookupError(null);
      return;
    }

    const query = deliveryAddress.trim();
    if (!session?.token || session.role !== 'Customer' || query.length < 3) {
      setAddressOptions([]);
      setIsAddressLoading(false);
      setAddressLookupError(null);
      return;
    }

    let cancelled = false;
    setIsAddressLoading(true);
    setAddressLookupError(null);

    const timeoutId = window.setTimeout(() => {
      void getAddressSuggestions(query, session.token)
        .then((result) => {
          if (!cancelled) {
            setAddressOptions(result);
            setAddressLookupError(null);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setAddressOptions([]);
            setAddressLookupError(
              error instanceof ApiError ? error.message : 'Не удалось загрузить подсказки адреса.',
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsAddressLoading(false);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [deliveryAddress, deliveryMethod, session?.role, session?.token]);

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session?.token || !cart || cart.items.length === 0) {
      setFeedback({
        severity: 'warning',
        message: 'Чтобы оформить заказ, войдите в аккаунт и добавьте хотя бы один товар в корзину.',
      });
      return;
    }

    if (session.role !== 'Customer') {
      setFeedback({
        severity: 'warning',
        message: 'Оформление заказа и подсказки адреса доступны только для аккаунта покупателя.',
      });
      return;
    }

    const normalizedDeliveryAddress = deliveryAddress.trim();
    if (deliveryMethod === 'Delivery' && normalizedDeliveryAddress.length === 0) {
      setFeedback({
        severity: 'warning',
        message: 'Укажите адрес доставки.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await apiRequest('/Orders', {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({
          deliveryMethod,
          deliveryAddress: deliveryMethod === 'Delivery' ? normalizedDeliveryAddress : null,
          payOnPickup,
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      await clearCart();
      await refreshCart();
      navigate('/orders');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось оформить заказ.';
      setFeedback({
        severity: 'error',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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
              Корзина доступна после входа
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Войдите в аккаунт, чтобы собирать товары в корзину, менять количество и переходить к оформлению заказа.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'center', pt: 1 }}>
              <Button
                component={RouterLink}
                to="/account"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<Lock size={16} />}
              >
                Перейти ко входу
              </Button>
              <Button component={RouterLink} to="/bouquets" variant="text" color="inherit" size="large">
                Вернуться в каталог
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const hasItems = Boolean(cart && cart.items.length > 0);

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box sx={{ display: 'grid', gap: 1 }}>
        <Button
          component={RouterLink}
          to="/bouquets"
          variant="text"
          color="inherit"
          startIcon={<ArrowLeft size={16} />}
          sx={{ width: 'fit-content', px: 0 }}
        >
          Назад к каталогу
        </Button>
        <Typography variant="h1">Корзина</Typography>
        <Typography variant="body1" color="text.secondary">
          {hasItems
            ? `В корзине ${cart?.items.length ?? 0} ${cart?.items.length === 1 ? 'позиция' : 'позиций'}.`
            : 'Выберите товары, которые хотите приобрести.'}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.25fr) minmax(340px, 0.75fr)' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Card
          sx={{
            background: 'rgba(255,255,255,0.84)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
              <Box>
                <Typography variant="h5">Состав заказа</Typography>
                <Typography variant="body2" color="text.secondary">
                  {hasItems ? 'Проверьте количество и итоговую сумму перед оформлением.' : 'Корзина пока пустая.'}
                </Typography>
              </Box>

              {hasItems ? (
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<Trash2 size={16} />}
                  onClick={() => void clearCart()}
                >
                  Очистить
                </Button>
              ) : null}
            </Stack>

            <Divider />

            {!hasItems ? (
              <Box
                sx={{
                  minHeight: 260,
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <Box sx={{ display: 'grid', gap: 1.5, maxWidth: 420 }}>
                  <Typography variant="h6">Корзина пока пустая</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    Добавьте букеты, цветы или подарки из каталога, и здесь появится итог вашего заказа.
                  </Typography>
                  <Box>
                    <Button component={RouterLink} to="/bouquets" variant="contained" color="primary">
                      Перейти к покупкам
                    </Button>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {cart?.items.map((item) => (
                  <Card
                    key={item.productId}
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      bgcolor: alpha('#f8fbf9', 0.92),
                      borderColor: 'rgba(24,38,31,0.08)',
                      transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 16px 36px rgba(31,42,35,0.10)',
                        borderColor: 'rgba(24,38,31,0.18)',
                        bgcolor: alpha('#ffffff', 0.98),
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '92px minmax(0, 1fr) 124px 128px' },
                        gap: { xs: 1.5, md: 1 },
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        component={RouterLink}
                        to={`/products/${item.productId}`}
                        sx={{
                          display: { xs: 'none', md: 'block' },
                          lineHeight: 0,
                        }}
                      >
                        <Box
                          component="img"
                          src={getCartItemPlaceholderImage(item.productType)}
                          alt={item.productName}
                          sx={{
                            width: 92,
                            height: 118,
                            objectFit: 'cover',
                            borderRadius: 2,
                            border: '1px solid rgba(24,38,31,0.08)',
                            bgcolor: '#f3f7f4',
                            display: 'block',
                          }}
                        />
                      </Box>

                      <Box
                        component={RouterLink}
                        to={`/products/${item.productId}`}
                        sx={{
                          display: 'grid',
                          gap: 0.5,
                          color: 'inherit',
                          textDecoration: 'none',
                          minWidth: 0,
                        }}
                      >
                        <Typography variant="h6">{item.productName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(item.unitPrice)} за единицу
                        </Typography>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{
                          alignItems: 'center',
                          justifySelf: { xs: 'start', md: 'stretch' },
                          justifyContent: 'space-between',
                          width: { xs: 'fit-content', md: 124 },
                          p: 0.5,
                          borderRadius: 999,
                          bgcolor: '#ffffff',
                          border: '1px solid rgba(24,38,31,0.08)',
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => void updateItem(item.productId, Math.max(0, item.quantity - 1))}
                        >
                          <Minus size={16} />
                        </IconButton>
                        <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 600 }}>
                          {item.quantity}
                        </Typography>
                        <IconButton size="small" onClick={() => void updateItem(item.productId, item.quantity + 1)}>
                          <Plus size={16} />
                        </IconButton>
                      </Stack>

                      <Typography
                        variant="h6"
                        sx={{
                          justifySelf: { xs: 'start', md: 'end' },
                          width: { xs: 'auto', md: 128 },
                          textAlign: { xs: 'left', md: 'right' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatCurrency(item.lineTotal)}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card
          sx={{
            background: 'rgba(255,255,255,0.84)',
            backdropFilter: 'blur(14px)',
            position: { xl: 'sticky' },
            top: { xl: 96 },
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'grid', gap: 0.75 }}>
              <Typography variant="h5">Оформление заказа</Typography>
              <Typography variant="body2" color="text.secondary">
                Выберите способ получения и проверьте итог перед подтверждением.
              </Typography>
            </Box>

            <form onSubmit={(event) => void handleCheckout(event)}>
              <Stack spacing={2}>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.4 }}>
                    Способ получения
                  </Typography>

                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    value={deliveryMethod}
                    onChange={(_, nextValue: DeliveryMethod | null) => {
                      if (nextValue) {
                        setDeliveryMethod(nextValue);
                      }
                    }}
                    sx={{
                      bgcolor: alpha('#ffffff', 0.64),
                      borderRadius: 999,
                      p: 0.5,
                      '& .MuiToggleButton-root': {
                        border: 0,
                        borderRadius: 999,
                        minHeight: 44,
                      },
                    }}
                  >
                    <ToggleButton value="Delivery">Доставка</ToggleButton>
                    <ToggleButton value="Pickup">Самовывоз</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {deliveryMethod === 'Delivery' ? (
                  <>
                    <Autocomplete
                    freeSolo
                    filterOptions={(options) => options}
                    options={addressOptions}
                    loading={isAddressLoading}
                    noOptionsText={
                      addressLookupError
                        ? addressLookupError
                        : deliveryAddress.trim().length < 3
                          ? 'Введите минимум 3 символа.'
                          : 'Подсказки не найдены.'
                    }
                    inputValue={deliveryAddress}
                    onInputChange={(_event: SyntheticEvent, nextValue: string) => {
                      setDeliveryAddress(nextValue);
                    }}
                    onChange={(_event: SyntheticEvent, option: AddressSuggestion | string | null) => {
                      if (!option) {
                        return;
                      }

                      if (typeof option === 'string') {
                        setDeliveryAddress(option);
                        return;
                      }

                      setDeliveryAddress(option.unrestrictedValue || option.value);
                    }}
                    getOptionLabel={(option) => (typeof option === 'string' ? option : option.unrestrictedValue || option.value)}
                    renderOption={(props, option) => {
                      if (typeof option === 'string') {
                        return (
                          <Box component="li" {...props}>
                            <Typography variant="body2">{option}</Typography>
                          </Box>
                        );
                      }

                      return (
                        <Box component="li" {...props} sx={{ display: 'grid', gap: 0.25 }}>
                          <Typography variant="body2">{option.value}</Typography>
                          {option.postalCode || option.city || option.street || option.house ? (
                            <Typography variant="caption" color="text.secondary">
                              {[option.postalCode, option.city, option.street, option.house].filter(Boolean).join(', ')}
                            </Typography>
                          ) : null}
                        </Box>
                      );
                    }}
                    renderInput={(params) => {
                      return (
                        <TextField
                          {...params}
                          label="Адрес доставки"
                          placeholder="Город, улица, дом, подъезд, комментарий"
                          helperText="Начните вводить адрес, и появятся подсказки по населенным пунктам, улицам и домам."
                          error={Boolean(addressLookupError)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              alignItems: 'center',
                            },
                          }}
                          slotProps={{
                            ...params.slotProps,
                            input: {
                              ...params.slotProps.input,
                              endAdornment: (
                                <>
                                  {isAddressLoading ? <CircularProgress color="inherit" size={18} /> : null}
                                  {params.slotProps.input.endAdornment}
                                </>
                              ),
                            },
                            htmlInput: {
                              ...params.slotProps.htmlInput,
                              name: 'deliveryAddress',
                            },
                          }}
                        />
                      );
                    }}
                    />
                    {addressLookupError ? <Alert severity="error">{addressLookupError}</Alert> : null}
                  </>
                ) : (
                  <FormControlLabel
                    control={
                      <Checkbox checked={payOnPickup} onChange={(event) => setPayOnPickup(event.target.checked)} />
                    }
                    label="Оплатить при получении"
                  />
                )}

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                    bgcolor: alpha('#f8fbf9', 0.92),
                    borderColor: 'rgba(24,38,31,0.08)',
                  }}
                >
                  <CardContent sx={{ display: 'grid', gap: 0.9 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Товаров
                      </Typography>
                      <Typography variant="body2">{cart?.items.length ?? 0}</Typography>
                    </Stack>

                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Итого
                      </Typography>
                      <Typography variant="h5">{formatCurrency(cart?.totalAmount ?? 0)}</Typography>
                    </Stack>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<ShoppingBag size={18} />}
                  disabled={!canCheckout || isSubmitting}
                  sx={{ minHeight: 52 }}
                >
                  {isSubmitting ? 'Оформляем...' : 'Оформить заказ'}
                </Button>
              </Stack>
            </form>

            {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : null}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
