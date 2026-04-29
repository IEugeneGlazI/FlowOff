import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ArrowRight, LoaderCircle } from 'lucide-react';
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
  'Шары': ['шар', 'шары', 'balloon'],
  'Сладости': ['сладост', 'конфет', 'шоколад', 'dessert'],
  'Продуктовые корзины': ['продукт', 'grocery'],
  'Фруктовые корзины': ['фрукт', 'fruit'],
  'Мягкие игрушки': ['игрушк', 'плюш', 'teddy'],
  'Вазы': ['ваза', 'vase'],
  'Свечи': ['свеч', 'candle'],
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
        <>
          <Typography variant="subtitle2" color="text.secondary">
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
                />
              );
            })}
          </Stack>
        </>
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
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Card>
        <CardHeader title="Фильтры" subheader="Горизонтальная панель фильтрации для текущего раздела" />
        <CardContent>
          <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Поиск"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activeTab === 'bouquets'
                    ? 'Например, свадебный или пионовый'
                    : activeTab === 'flowers'
                      ? 'Например, роза или тюльпан'
                      : 'Например, ваза или сладости'
                }
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ px: { xs: 1, md: 2 }, pt: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Цена
                </Typography>
                <Slider
                  value={priceRange}
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  onChange={(_, value) => setPriceRange(value as PriceRange)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value} ₽`}
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

            <Grid size={{ xs: 12, md: 3 }}>
              {renderTabFilters()}
            </Grid>

            <Grid size={{ xs: 12, md: 1 }}>
              <Button variant="text" color="inherit" onClick={resetFilters} fullWidth sx={{ minHeight: 56 }}>
                Сбросить
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Stack spacing={3}>
        <Card>
          <CardHeader title="Акции" subheader="Подтягиваются из backend" />
          <CardContent>
            <Grid container spacing={2}>
              {promotions.length === 0 ? (
                <Grid size={12}>
                  <Alert severity="info">Пока нет активных акций.</Alert>
                </Grid>
              ) : (
                promotions.slice(0, 3).map((promotion) => (
                  <Grid key={promotion.id} size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Chip label={`-${promotion.discountPercent}%`} color="primary" sx={{ width: 'fit-content' }} />
                          <Typography variant="h6">{promotion.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {promotion.description || 'Скидка уже доступна для ближайших заказов.'}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </CardContent>
        </Card>

        {feedback ? <Alert severity="success">{feedback}</Alert> : null}

        <Box>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            sx={{ mb: 2, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
          >
            <Box>
              <Typography variant="h2">
                {activeTab === 'bouquets' ? 'Букеты' : activeTab === 'flowers' ? 'Цветы' : 'Подарки'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredProducts.length} позиций после фильтрации
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Категорий в справочнике: {categories.length}
            </Typography>
          </Stack>

          {activeTab === 'gifts' && productStats.gifts === 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              На backend пока нет явно распознанных подарочных товаров. Вкладка и фильтры уже готовы,
              но контент появится после наполнения каталога позициями вроде «Шары», «Вазы» или «Сладости».
            </Alert>
          ) : null}

          {isLoading ? (
            <Card>
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
                    <Card sx={{ height: '100%' }}>
                      <CardContent sx={{ display: 'grid', gap: 2, height: '100%' }}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
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
                          <Typography
                            variant="caption"
                            color={product.stockQuantity > 0 ? 'secondary.main' : 'error.main'}
                          >
                            {product.stockQuantity > 0 ? `В наличии: ${product.stockQuantity}` : 'Нет в наличии'}
                          </Typography>
                        </Stack>

                        <Box sx={{ display: 'grid', gap: 1 }}>
                          <Typography variant="h6">{product.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {product.description || 'Описание пока не заполнено.'}
                          </Typography>
                        </Box>

                        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                          {product.categoryName ? <Chip size="small" variant="outlined" label={product.categoryName} /> : null}
                          {activeTab === 'bouquets'
                            ? bouquetColorTags.map((color) => (
                                <Chip key={color} size="small" variant="outlined" label={color} />
                              ))
                            : null}
                        </Stack>

                        <Box sx={{ mt: 'auto' }}>
                          <Typography variant="h6" sx={{ mb: 1.5 }}>
                            {formatCurrency(product.price)}
                          </Typography>
                          <Stack direction="row" spacing={1}>
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
                              fullWidth
                              disabled={product.stockQuantity === 0}
                              onClick={() => void handleAddToCart(product.id)}
                            >
                              В корзину
                            </Button>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {!isLoading && filteredProducts.length === 0 ? (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="body1">
                  По текущим фильтрам ничего не найдено. Попробуй ослабить поиск или сбросить часть условий.
                </Typography>
              </CardContent>
            </Card>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}
