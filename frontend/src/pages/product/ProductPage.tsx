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
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Product } from '../../entities/catalog';
import { getProductById } from '../../features/catalog/catalogApi';
import { useCart } from '../../features/cart/CartContext';
import { ApiError } from '../../shared/api';
import { formatCurrency } from '../../shared/format';

function getProductPlaceholderImage(product: Product) {
  if (product.type === 'Flower') {
    return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80';
  }

  if (product.type === 'Gift') {
    return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80';
  }

  return 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=80';
}

function getTypeLabel(product: Product) {
  switch (product.type) {
    case 'Flower':
      return 'Цветок';
    case 'Gift':
      return 'Подарок';
    default:
      return 'Букет';
  }
}

type FeedbackState = {
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
};

export function ProductPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadProduct() {
      setIsLoading(true);

      try {
        const nextProduct = await getProductById(productId as string);
        if (isMounted) {
          setProduct(nextProduct);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  async function handleAddToCart() {
    if (!product) {
      return;
    }

    try {
      await addItem(product.id, quantity);
      setFeedback({
        message: 'Товар добавлен в корзину.',
        severity: 'success',
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось добавить товар в корзину.';
      setFeedback({
        message,
        severity: error instanceof ApiError && error.status === 401 ? 'warning' : 'error',
      });
    }
  }

  const detailChips = useMemo(() => {
    if (!product) {
      return [];
    }

    const chips: string[] = [];

    if (product.categoryName) {
      chips.push(product.categoryName);
    }

    if (product.flowerInName && product.type === 'Flower') {
      chips.push(product.flowerInName);
    }

    for (const flowerInName of product.flowerInNames ?? []) {
      if (!chips.includes(flowerInName)) {
        chips.push(flowerInName);
      }
    }

    for (const colorName of product.colorNames ?? []) {
      if (!chips.includes(colorName)) {
        chips.push(colorName);
      }
    }

    if (product.colorName && !chips.includes(product.colorName)) {
      chips.push(product.colorName);
    }

    return chips;
  }, [product]);

  if (isLoading) {
    return (
      <Card sx={{ backgroundColor: alpha('#ffffff', 0.82), backdropFilter: 'blur(14px)' }}>
        <CardContent>
          <Typography>Загружаем карточку товара...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!product) {
    return (
      <Card sx={{ backgroundColor: alpha('#ffffff', 0.82), backdropFilter: 'blur(14px)' }}>
        <CardContent>
          <Typography>Товар не найден.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
      }}
    >
      <Button
        component={RouterLink}
        to={product.type === 'Flower' ? '/flowers' : product.type === 'Gift' ? '/gifts' : '/bouquets'}
        variant="text"
        color="inherit"
        startIcon={<ArrowLeft size={16} />}
        sx={{ width: 'fit-content', px: 0 }}
      >
        Назад к каталогу
      </Button>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Card
          sx={{
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.84)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <Box sx={{ p: { xs: 2, md: 3 }, pb: 0 }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: { xs: '100%', md: 420 },
                mx: 'auto',
                borderRadius: 3,
                overflow: 'hidden',
                backgroundColor: '#f3f7f4',
                aspectRatio: { xs: '4 / 5', md: '3 / 4' },
                boxShadow: '0 20px 48px rgba(31,42,35,0.12)',
              }}
            >
              <Box
                component="img"
                src={getProductPlaceholderImage(product)}
                alt={product.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(14,19,16,0.02) 0%, rgba(14,19,16,0.06) 48%, rgba(14,19,16,0.24) 100%)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  right: 16,
                  bottom: 16,
                  px: 2,
                  py: 1.25,
                  borderRadius: 999,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 12px 32px rgba(31,42,35,0.16)',
                }}
              >
                <Typography variant="h4">{formatCurrency(product.price)}</Typography>
              </Box>
            </Box>
          </Box>

          <CardContent sx={{ p: { xs: 2, md: 3 }, display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.6rem' } }}>
                {product.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '64ch', lineHeight: 1.8 }}>
                {product.description || 'Описание для этой позиции пока не добавлено.'}
              </Typography>
            </Box>

            {detailChips.length > 0 ? (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {detailChips.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    variant="outlined"
                    sx={{
                      bgcolor: alpha('#ffffff', 0.72),
                    }}
                  />
                ))}
              </Stack>
            ) : null}

            <Divider />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                gap: 1.5,
              }}
            >
              <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha('#f8fbf9', 0.92) }}>
                <CardContent sx={{ display: 'grid', gap: 0.6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Тип
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {getTypeLabel(product)}
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha('#f8fbf9', 0.92) }}>
                <CardContent sx={{ display: 'grid', gap: 0.6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Раздел
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {product.categoryName || product.flowerInName || 'Каталог Flowoff'}
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha('#f8fbf9', 0.92) }}>
                <CardContent sx={{ display: 'grid', gap: 0.6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Формат
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {product.type === 'Bouquet' ? 'Готовая композиция' : product.type === 'Flower' ? 'Поштучно' : 'Дополнение'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            position: { lg: 'sticky' },
            top: { lg: 96 },
            background: 'rgba(255,255,255,0.84)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'grid', gap: 0.75 }}>
              <Typography variant="h5">Добавить в корзину</Typography>
              <Typography variant="body2" color="text.secondary">
                Выбери количество и добавь позицию в заказ.
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                p: 1,
                borderRadius: 999,
                bgcolor: alpha('#f3f7f4', 0.95),
                border: '1px solid rgba(24,38,31,0.08)',
              }}
            >
              <Button
                variant="text"
                color="inherit"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                sx={{ minWidth: 44, width: 44, height: 44, borderRadius: '50%' }}
              >
                <Minus size={16} />
              </Button>

              <TextField
                value={quantity}
                size="small"
                sx={{
                  width: 84,
                  '& .MuiOutlinedInput-input': {
                    textAlign: 'center',
                    fontWeight: 600,
                  },
                }}
              />

              <Button
                variant="text"
                color="inherit"
                onClick={() => setQuantity((value) => value + 1)}
                sx={{ minWidth: 44, width: 44, height: 44, borderRadius: '50%' }}
              >
                <Plus size={16} />
              </Button>
            </Box>

            <Card
              variant="outlined"
              sx={{
                borderRadius: 2,
                bgcolor: alpha('#f8fbf9', 0.92),
              }}
            >
              <CardContent sx={{ display: 'grid', gap: 0.6 }}>
                <Typography variant="caption" color="text.secondary">
                  Итого
                </Typography>
                <Typography variant="h4">{formatCurrency(product.price * quantity)}</Typography>
              </CardContent>
            </Card>

            <Button
              type="button"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<ShoppingBag size={18} />}
              onClick={() => void handleAddToCart()}
              sx={{ minHeight: 52 }}
            >
              В корзину
            </Button>

          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={3200}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={feedback?.severity ?? 'info'}
          onClose={() => setFeedback(null)}
          sx={{ borderRadius: 2, minWidth: 320, boxShadow: '0 18px 40px rgba(31,42,35,0.18)' }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
