import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ArrowRight, LoaderCircle, Search } from 'lucide-react';
import type { Category, Product, Promotion } from '../../entities/catalog';
import { getCategories, getProducts, getPromotions } from '../../features/catalog/catalogApi';
import { formatCurrency } from '../../shared/format';
import { useCart } from '../../features/cart/CartContext';
import { ApiError } from '../../shared/api';

type CatalogTab = 'bouquets' | 'flowers' | 'gifts';
type PriceRange = [number, number];

const bouquetColors = ['Белый', 'Розовый', 'Красный', 'Желтый', 'Фиолетовый', 'Синий'];
const flowerTypes = ['Роза', 'Тюльпан', 'Пион', 'Лилия', 'Хризантема', 'Гербера', 'Гвоздика', 'Орхидея'];
const giftTypes = [
  'Шары',
  'Сладости',
  'Продуктовые корзины',
  'Фруктовые корзины',
  'Мягкие игрушки',
  'Вазы',
  'Свечи',
];

const giftKeywordMap: Record<string, string[]> = {
  Шары: ['шар', 'шары', 'balloon'],
  Сладости: ['сладост', 'конфет', 'шоколад', 'dessert'],
  'Продуктовые корзины': ['продукт', 'grocery'],
  'Фруктовые корзины': ['фрукт', 'fruit'],
  'Мягкие игрушки': ['игрушк', 'плюш', 'teddy'],
  Вазы: ['ваза', 'vase'],
  Свечи: ['свеч', 'candle'],
};

function toSearchBlob(product: Product) {
  return [product.name, product.description, product.categoryName].filter(Boolean).join(' ').toLowerCase();
}

function detectBouquetColors(product: Product) {
  const blob = toSearchBlob(product);
  return bouquetColors.filter((color) => blob.includes(color.toLowerCase()));
}

function detectFlowerType(product: Product) {
  const blob = toSearchBlob(product);
  return flowerTypes.find((flowerType) => blob.includes(flowerType.toLowerCase())) ?? null;
}

function detectGiftType(product: Product) {
  const blob = toSearchBlob(product);
  return (
    giftTypes.find((giftType) => giftKeywordMap[giftType].some((keyword) => blob.includes(keyword.toLowerCase()))) ??
    null
  );
}

function isGiftProduct(product: Product) {
  return detectGiftType(product) !== null;
}

function getTabHeading(activeTab: CatalogTab) {
  switch (activeTab) {
    case 'flowers':
      return 'Цветы';
    case 'gifts':
      return 'Подарки';
    default:
      return 'Букеты';
  }
}

function getTabSubheading(activeTab: CatalogTab) {
  switch (activeTab) {
    case 'flowers':
      return 'Поштучные цветы с быстрым подбором по типу и диапазону цены.';
    case 'gifts':
      return 'Сопутствующие подарки для заказа: от ваз до сладостей и мягких игрушек.';
    default:
      return 'Композиции для доставки, витрины и особых поводов с фильтрами по составу.';
  }
}

export function StorefrontPage() {
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRange>([0, 25000]);
  const [selectedBouquetColors, setSelectedBouquetColors] = useState<string[]>([]);
  const [selectedFlowerType, setSelectedFlowerType] = useState('');
  const [selectedGiftType, setSelectedGiftType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { addItem } = useCart();

  const activeTab: CatalogTab = location.pathname.startsWith('/flowers')
    ? 'flowers'
    : location.pathname.startsWith('/gifts')
      ? 'gifts'
      : 'bouquets';

  useEffect(() => {
    async function loadInitial() {
      setIsLoading(true);

      try {
        const [nextCategories, nextPromotions, nextProducts] = await Promise.all([
          getCategories(),
          getPromotions(),
          getProducts({}),
        ]);

        setCategories(nextCategories);
        setPromotions(nextPromotions.filter((item) => item.isActive));
        setProducts(nextProducts);

        if (nextProducts.length > 0) {
          const prices = nextProducts.map((item) => item.price);
          setPriceRange([Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitial();
  }, []);

  const priceBounds = useMemo<PriceRange>(() => {
    if (products.length === 0) {
      return [0, 25000];
    }

    const prices = products.map((item) => item.price);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [products]);

  const productStats = useMemo(
    () => ({
      bouquets: products.filter((item) => item.type === 'Bouquet').length,
      flowers: products.filter((item) => item.type === 'Flower').length,
      gifts: products.filter((item) => isGiftProduct(item)).length,
    }),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return products.filter((product) => {
      const blob = toSearchBlob(product);
      const matchesSearch = !needle || blob.includes(needle);
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      if (!matchesSearch || !matchesPrice) {
        return false;
      }

      if (activeTab === 'bouquets') {
        const colors = detectBouquetColors(product);
        const matchesColors =
          selectedBouquetColors.length === 0 ||
          selectedBouquetColors.every((selectedColor) => colors.includes(selectedColor));
        return product.type === 'Bouquet' && matchesColors;
      }

      if (activeTab === 'flowers') {
        const flowerType = detectFlowerType(product);
        const matchesFlowerType = !selectedFlowerType || flowerType === selectedFlowerType;
        return product.type === 'Flower' && matchesFlowerType;
      }

      const giftType = detectGiftType(product);
      const matchesGiftType = !selectedGiftType || giftType === selectedGiftType;
      return isGiftProduct(product) && matchesGiftType;
    });
  }, [activeTab, priceRange, products, search, selectedBouquetColors, selectedFlowerType, selectedGiftType]);

  async function handleAddToCart(productId: string) {
    try {
      await addItem(productId, 1);
      setFeedback('Товар добавлен в корзину.');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Не удалось добавить товар в корзину.';
      setFeedback(message);
    }
  }

  function resetFilters() {
    setSearch('');
    setPriceRange(priceBounds);
    setSelectedBouquetColors([]);
    setSelectedFlowerType('');
    setSelectedGiftType('');
  }

  function renderTabFilters() {
    if (activeTab === 'bouquets') {
      return (
        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Цвета в составе
          </Typography>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            {bouquetColors.map((color) => {
              const active = selectedBouquetColors.includes(color);
              return (
                <Chip
                  key={color}
                  label={color}
                  color={active ? 'primary' : 'default'}
                  variant={active ? 'filled' : 'outlined'}
                  onClick={() =>
                    setSelectedBouquetColors((current) =>
                      current.includes(color)
                        ? current.filter((item) => item !== color)
                        : [...current, color],
                    )
                  }
                  sx={{ bgcolor: active ? 'primary.main' : alpha('#ffffff', 0.84) }}
                />
              );
            })}
          </Stack>
        </Stack>
      );
    }

    if (activeTab === 'flowers') {
      return (
        <FormControl fullWidth>
          <InputLabel id="flower-type-label">Тип цветка</InputLabel>
          <Select
            labelId="flower-type-label"
            value={selectedFlowerType}
            input={<OutlinedInput label="Тип цветка" />}
            onChange={(event) => setSelectedFlowerType(event.target.value)}
          >
            <MenuItem value="">Все типы</MenuItem>
            {flowerTypes.map((flowerType) => (
              <MenuItem key={flowerType} value={flowerType}>
                {flowerType}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    return (
      <FormControl fullWidth>
        <InputLabel id="gift-type-label">Тип подарка</InputLabel>
        <Select
          labelId="gift-type-label"
          value={selectedGiftType}
          input={<OutlinedInput label="Тип подарка" />}
          onChange={(event) => setSelectedGiftType(event.target.value)}
        >
          <MenuItem value="">Все подарки</MenuItem>
          {giftTypes.map((giftType) => (
            <MenuItem key={giftType} value={giftType}>
              {giftType}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 1.25,
          pt: { xs: 1, md: 2 },
          pb: 1,
        }}
      >
        <Typography variant="h1">{getTabHeading(activeTab)}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '64ch', fontSize: '1.05rem' }}>
          {getTabSubheading(activeTab)}
        </Typography>
      </Box>

      <Card
        sx={{
          overflow: 'hidden',
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(246,251,247,0.82) 100%)
          `,
          backdropFilter: 'blur(14px)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 3.5 }}>
              <TextField
                fullWidth
                label="Поиск"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activeTab === 'bouquets'
                    ? 'Свадебный, нежный, пионовый'
                    : activeTab === 'flowers'
                      ? 'Роза, тюльпан, орхидея'
                      : 'Ваза, сладости, свечи'
                }
                slotProps={{
                  input: {
                    startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.55 }} />,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3.5 }}>
              <Box sx={{ px: { xs: 0.5, md: 1 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Диапазон цены
                </Typography>
                <Slider
                  value={priceRange}
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  onChange={(_, value) => setPriceRange(value as PriceRange)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value} ₽`}
                  color="primary"
                />
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(priceRange[0])}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(priceRange[1])}
                  </Typography>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              {renderTabFilters()}
            </Grid>

            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                variant="text"
                color="inherit"
                onClick={resetFilters}
                fullWidth
                sx={{ minHeight: 48, bgcolor: alpha('#ffffff', 0.42) }}
              >
                Сбросить
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {promotions.length > 0 ? (
        <Grid container spacing={2}>
          {promotions.slice(0, 3).map((promotion) => (
            <Grid key={promotion.id} size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  background: `
                    linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,239,228,0.74) 100%)
                  `,
                }}
              >
                <CardContent sx={{ display: 'grid', gap: 1.5, minHeight: 172 }}>
                  <Chip
                    label={`-${promotion.discountPercent}%`}
                    color="primary"
                    sx={{ width: 'fit-content', bgcolor: alpha('#5c8f73', 0.14), color: 'primary.dark' }}
                  />
                  <Typography variant="h6">{promotion.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {promotion.description || 'Скидка уже доступна для ближайших заказов.'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : null}

      {feedback ? <Alert severity="success" sx={{ borderRadius: 2 }}>{feedback}</Alert> : null}

      <Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ mb: 2.5, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' } }}
        >
          <Box>
            <Typography variant="h2">{getTabHeading(activeTab)}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {filteredProducts.length} позиций после фильтрации
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {categories.length} категорий в каталоге
          </Typography>
        </Stack>

        {activeTab === 'gifts' && productStats.gifts === 0 ? (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            Вкладка подарков уже готова по интерфейсу, но на backend пока нет явно распознанных
            позиций вроде шаров, ваз или сладостей.
          </Alert>
        ) : null}

        {isLoading ? (
          <Card sx={{ backgroundColor: alpha('#ffffff', 0.8) }}>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <LoaderCircle size={18} />
                <Typography>Загружаем каталог...</Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredProducts.map((product) => {
              const bouquetColorTags = detectBouquetColors(product);
              const flowerType = detectFlowerType(product);
              const giftType = detectGiftType(product);

              return (
                <Grid key={product.id} size={{ xs: 12, md: 6, xl: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      background: 'rgba(255,255,255,0.84)',
                      backdropFilter: 'blur(12px)',
                      transition: 'transform 180ms ease, box-shadow 180ms ease',
                      ':hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 28px 66px rgba(38, 54, 45, 0.10)',
                      },
                    }}
                  >
                    <CardContent sx={{ display: 'grid', gap: 2, height: '100%', p: 2.25 }}>
                      <Box
                        sx={{
                          minHeight: 140,
                          borderRadius: 2,
                          border: '1px solid rgba(24,38,31,0.06)',
                          background: `
                            radial-gradient(circle at 20% 20%, rgba(220,239,228,0.94), transparent 36%),
                            radial-gradient(circle at 75% 30%, rgba(255,244,234,0.92), transparent 32%),
                            linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(242,248,243,0.98) 100%)
                          `,
                          p: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            size="small"
                            color={product.type === 'Bouquet' ? 'primary' : 'secondary'}
                            label={
                              activeTab === 'gifts'
                                ? giftType || 'Подарок'
                                : product.type === 'Bouquet'
                                  ? 'Букет'
                                  : flowerType || 'Цветок'
                            }
                          />
                          {product.isShowcase ? <Chip size="small" variant="outlined" label="Витрина" /> : null}
                        </Stack>

                        <Typography variant="h5" sx={{ maxWidth: '10ch' }}>
                          {formatCurrency(product.price)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'grid', gap: 0.9 }}>
                        <Typography variant="h6">{product.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.description || 'Описание пока не заполнено.'}
                        </Typography>
                      </Box>

                      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                        {product.categoryName ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={product.categoryName}
                            sx={{ bgcolor: alpha('#ffffff', 0.74) }}
                          />
                        ) : null}
                        {activeTab === 'bouquets'
                          ? bouquetColorTags.map((color) => (
                              <Chip
                                key={color}
                                size="small"
                                variant="outlined"
                                label={color}
                                sx={{ bgcolor: alpha('#ffffff', 0.74) }}
                              />
                            ))
                          : null}
                      </Stack>

                      <Stack
                        direction="row"
                        sx={{ justifyContent: 'space-between', alignItems: 'center', color: 'text.secondary' }}
                      >
                        <Typography variant="caption">
                          {product.stockQuantity > 0 ? `В наличии: ${product.stockQuantity}` : 'Нет в наличии'}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                        <Button
                          component={RouterLink}
                          to={`/products/${product.id}`}
                          variant="outlined"
                          color="inherit"
                          fullWidth
                          endIcon={<ArrowRight size={16} />}
                        >
                          Подробнее
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          disabled={product.stockQuantity === 0}
                          onClick={() => void handleAddToCart(product.id)}
                        >
                          В корзину
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {!isLoading && filteredProducts.length === 0 ? (
          <Card sx={{ mt: 2, backgroundColor: alpha('#ffffff', 0.8) }}>
            <CardContent>
              <Typography variant="body1">
                По текущим фильтрам ничего не найдено. Попробуй ослабить поиск или сбросить часть условий.
              </Typography>
            </CardContent>
          </Card>
        ) : null}
      </Box>
    </Box>
  );
}
