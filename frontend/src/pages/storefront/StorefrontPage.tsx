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
import type { Category, ColorReference, FlowerInReference, Product, Promotion } from '../../entities/catalog';
import { getCategories, getColors, getFlowerIns, getProducts, getPromotions } from '../../features/catalog/catalogApi';
import { useCart } from '../../features/cart/CartContext';
import { ApiError } from '../../shared/api';
import { formatCurrency } from '../../shared/format';

type CatalogTab = 'bouquets' | 'flowers' | 'gifts';
type PriceRange = [number, number];

function toSearchBlob(product: Product) {
  return [
    product.name,
    product.description,
    product.categoryName,
    product.flowerInName,
    ...(product.flowerInNames ?? []),
    product.colorName,
    ...(product.colorNames ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
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
      return 'Там, где рождаются чувства.';
    case 'gifts':
      return 'Маленькие детали, которые делают день особенным.';
    default:
      return 'Идеальные сочетания для особых моментов.';
  }
}

export function StorefrontPage() {
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<ColorReference[]>([]);
  const [flowerIns, setFlowerIns] = useState<FlowerInReference[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRange>([0, 25000]);
  const [selectedBouquetColorId, setSelectedBouquetColorId] = useState('');
  const [selectedBouquetFlowerInId, setSelectedBouquetFlowerInId] = useState('');
  const [selectedFlowerInId, setSelectedFlowerInId] = useState('');
  const [selectedFlowerColorId, setSelectedFlowerColorId] = useState('');
  const [selectedGiftCategoryId, setSelectedGiftCategoryId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { addItem } = useCart();

  const activeTab: CatalogTab = location.pathname.startsWith('/flowers')
    ? 'flowers'
    : location.pathname.startsWith('/gifts')
      ? 'gifts'
      : 'bouquets';

  useEffect(() => {
    async function loadReferences() {
      const [nextCategories, nextColors, nextFlowerIns, nextPromotions] = await Promise.all([
        getCategories(),
        getColors(),
        getFlowerIns(),
        getPromotions(),
      ]);

      setCategories(nextCategories);
      setColors(nextColors);
      setFlowerIns(nextFlowerIns);
      setPromotions(nextPromotions.filter((item) => item.isActive));
    }

    void loadReferences();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);

      try {
        const nextProducts = await getProducts({
          type: activeTab === 'bouquets' ? 'Bouquet' : activeTab === 'flowers' ? 'Flower' : 'Gift',
          colorId:
            activeTab === 'bouquets' && selectedBouquetColorId
              ? selectedBouquetColorId
              : activeTab === 'flowers' && selectedFlowerColorId
                ? selectedFlowerColorId
                : null,
          flowerInId:
            activeTab === 'bouquets' && selectedBouquetFlowerInId
              ? selectedBouquetFlowerInId
              : activeTab === 'flowers' && selectedFlowerInId
                ? selectedFlowerInId
                : null,
          categoryId: activeTab === 'gifts' && selectedGiftCategoryId ? selectedGiftCategoryId : null,
        });

        setProducts(nextProducts);

        if (nextProducts.length > 0) {
          const prices = nextProducts.map((item) => item.price);
          setPriceRange([Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]);
        } else {
          setPriceRange([0, 25000]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadProducts();
  }, [
    activeTab,
    selectedBouquetColorId,
    selectedBouquetFlowerInId,
    selectedFlowerInId,
    selectedFlowerColorId,
    selectedGiftCategoryId,
  ]);

  const priceBounds = useMemo<PriceRange>(() => {
    if (products.length === 0) {
      return [0, 25000];
    }

    const prices = products.map((item) => item.price);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return products.filter((product) => {
      const blob = toSearchBlob(product);
      const matchesSearch = !needle || blob.includes(needle);
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      return matchesSearch && matchesPrice;
    });
  }, [priceRange, products, search]);

  useEffect(() => {
    setSearch('');
    setSelectedBouquetColorId('');
    setSelectedBouquetFlowerInId('');
    setSelectedFlowerInId('');
    setSelectedFlowerColorId('');
    setSelectedGiftCategoryId('');
  }, [activeTab]);

  async function handleAddToCart(productId: string) {
    try {
      await addItem(productId, 1);
      setFeedback('Товар добавлен в корзину.');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось добавить товар в корзину.';
      setFeedback(message);
    }
  }

  function resetFilters() {
    setSearch('');
    setPriceRange(priceBounds);
    setSelectedBouquetColorId('');
    setSelectedBouquetFlowerInId('');
    setSelectedFlowerInId('');
    setSelectedFlowerColorId('');
    setSelectedGiftCategoryId('');
  }

  function renderTabFilters() {
    if (activeTab === 'bouquets') {
      return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl fullWidth>
            <InputLabel id="bouquet-color-label">Цвета в составе</InputLabel>
            <Select
              labelId="bouquet-color-label"
              value={selectedBouquetColorId}
              input={<OutlinedInput label="Цвета в составе" />}
              onChange={(event) => setSelectedBouquetColorId(event.target.value)}
            >
              <MenuItem value="">Все цвета</MenuItem>
              {colors.map((color) => (
                <MenuItem key={color.id} value={color.id}>
                  {color.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="bouquet-flowerin-label">Цветки в составе</InputLabel>
            <Select
              labelId="bouquet-flowerin-label"
              value={selectedBouquetFlowerInId}
              input={<OutlinedInput label="Цветки в составе" />}
              onChange={(event) => setSelectedBouquetFlowerInId(event.target.value)}
            >
              <MenuItem value="">Все цветки</MenuItem>
              {flowerIns.map((flowerIn) => (
                <MenuItem key={flowerIn.id} value={flowerIn.id}>
                  {flowerIn.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      );
    }

    if (activeTab === 'flowers') {
      return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl fullWidth>
            <InputLabel id="flower-type-label">Тип цветка</InputLabel>
            <Select
              labelId="flower-type-label"
              value={selectedFlowerInId}
              input={<OutlinedInput label="Тип цветка" />}
              onChange={(event) => setSelectedFlowerInId(event.target.value)}
            >
              <MenuItem value="">Все типы</MenuItem>
              {flowerIns.map((flowerIn) => (
                <MenuItem key={flowerIn.id} value={flowerIn.id}>
                  {flowerIn.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="flower-color-label">Цвет цветка</InputLabel>
            <Select
              labelId="flower-color-label"
              value={selectedFlowerColorId}
              input={<OutlinedInput label="Цвет цветка" />}
              onChange={(event) => setSelectedFlowerColorId(event.target.value)}
            >
              <MenuItem value="">Все цвета</MenuItem>
              {colors.map((color) => (
                <MenuItem key={color.id} value={color.id}>
                  {color.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      );
    }

    return (
      <FormControl fullWidth>
        <InputLabel id="gift-category-label">Категория подарка</InputLabel>
        <Select
          labelId="gift-category-label"
          value={selectedGiftCategoryId}
          input={<OutlinedInput label="Категория подарка" />}
          onChange={(event) => setSelectedGiftCategoryId(event.target.value)}
        >
          <MenuItem value="">Все подарки</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
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

            <Grid size={{ xs: 12, md: 4 }}>{renderTabFilters()}</Grid>

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

      {feedback ? (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          {feedback}
        </Alert>
      ) : null}

      <Box>
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
            {filteredProducts.map((product) => (
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
                      {(product.colorNames ?? []).map((colorName) => (
                        <Chip
                          key={`${product.id}-${colorName}`}
                          size="small"
                          variant="outlined"
                          label={colorName}
                          sx={{ bgcolor: alpha('#ffffff', 0.74) }}
                        />
                      ))}
                      {product.flowerInName && product.type === 'Flower' ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={product.flowerInName}
                          sx={{ bgcolor: alpha('#ffffff', 0.74) }}
                        />
                      ) : null}
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
                      <Button variant="contained" color="primary" fullWidth onClick={() => void handleAddToCart(product.id)}>
                        В корзину
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {!isLoading && filteredProducts.length === 0 ? (
          <Card sx={{ mt: 2, backgroundColor: alpha('#ffffff', 0.8) }}>
            <CardContent>
              <Typography variant="body1">
                Ничего не найдено. Попробуйте изменить поисковый запрос или сбросить фильтры, чтобы увидеть все доступные товары.
              </Typography>
            </CardContent>
          </Card>
        ) : null}
      </Box>
    </Box>
  );
}
