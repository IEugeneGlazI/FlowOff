import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, Search } from 'lucide-react';
import type { Category, ColorReference, FlowerInReference, Product, Promotion } from '../../entities/catalog';
import { getCategories, getColors, getFlowerIns, getProducts, getPromotions } from '../../features/catalog/catalogApi';
import { useCart } from '../../features/cart/CartContext';
import { ApiError } from '../../shared/api';
import { formatCurrency } from '../../shared/format';

type CatalogTab = 'bouquets' | 'flowers' | 'gifts';
type PriceRange = [number, number];
type FeedbackState = {
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
};

const ALL_FILTER_VALUE = '__all__';

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

function getProductPlaceholderImage(product: Product) {
  if (product.imageUrl) {
    return product.imageUrl;
  }

  if (product.type === 'Flower') {
    return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80';
  }

  if (product.type === 'Gift') {
    return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80';
  }

  return 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=900&q=80';
}

function normalizeMultiValue(value: string | string[]) {
  return typeof value === 'string' ? value.split(',').filter(Boolean) : value;
}

export function StorefrontPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<ColorReference[]>([]);
  const [flowerIns, setFlowerIns] = useState<FlowerInReference[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRange>([0, 25000]);
  const [selectedBouquetColorIds, setSelectedBouquetColorIds] = useState<string[]>([]);
  const [selectedBouquetFlowerInIds, setSelectedBouquetFlowerInIds] = useState<string[]>([]);
  const [selectedFlowerInIds, setSelectedFlowerInIds] = useState<string[]>([]);
  const [selectedFlowerColorIds, setSelectedFlowerColorIds] = useState<string[]>([]);
  const [selectedGiftCategoryIds, setSelectedGiftCategoryIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
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
  }, [activeTab]);

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
      const matchesSearch = !needle || product.name.toLowerCase().includes(needle);
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      if (!matchesSearch || !matchesPrice) {
        return false;
      }

      if (activeTab === 'bouquets') {
        const matchesColors =
          selectedBouquetColorIds.length === 0 ||
          selectedBouquetColorIds.some((id) => product.colorIds?.includes(id));
        const matchesFlowerIns =
          selectedBouquetFlowerInIds.length === 0 ||
          selectedBouquetFlowerInIds.some((id) => product.flowerInIds?.includes(id));

        return matchesColors && matchesFlowerIns;
      }

      if (activeTab === 'flowers') {
        const matchesFlowerType =
          selectedFlowerInIds.length === 0 ||
          (product.flowerInId ? selectedFlowerInIds.includes(product.flowerInId) : false);
        const matchesColor =
          selectedFlowerColorIds.length === 0 ||
          (product.colorId ? selectedFlowerColorIds.includes(product.colorId) : false);

        return matchesFlowerType && matchesColor;
      }

      const matchesCategory =
        selectedGiftCategoryIds.length === 0 ||
        (product.categoryId ? selectedGiftCategoryIds.includes(product.categoryId) : false);

      return matchesCategory;
    });
  }, [
    activeTab,
    priceRange,
    products,
    search,
    selectedBouquetColorIds,
    selectedBouquetFlowerInIds,
    selectedFlowerColorIds,
    selectedFlowerInIds,
    selectedGiftCategoryIds,
  ]);

  useEffect(() => {
    setSearch('');
    setSelectedBouquetColorIds([]);
    setSelectedBouquetFlowerInIds([]);
    setSelectedFlowerInIds([]);
    setSelectedFlowerColorIds([]);
    setSelectedGiftCategoryIds([]);
  }, [activeTab]);

  useEffect(() => {
    setPriceRange(priceBounds);
  }, [priceBounds]);

  async function handleAddToCart(productId: string) {
    try {
      await addItem(productId, 1);
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

  function resetFilters() {
    setSearch('');
    setPriceRange(priceBounds);
    setSelectedBouquetColorIds([]);
    setSelectedBouquetFlowerInIds([]);
    setSelectedFlowerInIds([]);
    setSelectedFlowerColorIds([]);
    setSelectedGiftCategoryIds([]);
  }

  function handleMinPriceInput(value: string) {
    if (value === '') {
      setPriceRange([priceBounds[0], priceRange[1]]);
      return;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }

    const nextMin = Math.max(priceBounds[0], Math.min(parsed, priceRange[1]));
    setPriceRange([nextMin, priceRange[1]]);
  }

  function handleMaxPriceInput(value: string) {
    if (value === '') {
      setPriceRange([priceRange[0], priceBounds[1]]);
      return;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }

    const nextMax = Math.min(priceBounds[1], Math.max(parsed, priceRange[0]));
    setPriceRange([priceRange[0], nextMax]);
  }

  function handleMultipleChange(
    event: SelectChangeEvent<string[]>,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) {
    const nextValue = normalizeMultiValue(event.target.value);
    setter(nextValue.includes(ALL_FILTER_VALUE) ? [] : nextValue);
  }

  function renderSelectedNames(selectedIds: string[], source: Array<{ id: string; name: string }>, emptyLabel: string) {
    if (selectedIds.length === 0) {
      return emptyLabel;
    }

    return source
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => item.name)
      .join(', ');
  }

  function renderTabFilters() {
    if (activeTab === 'bouquets') {
      return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl fullWidth>
            <InputLabel id="bouquet-color-label">Цвет букета</InputLabel>
            <Select
              multiple
              labelId="bouquet-color-label"
              value={selectedBouquetColorIds}
              input={<OutlinedInput label="Цвет букета" />}
              renderValue={(selected) => renderSelectedNames(selected, colors, 'Все цвета')}
              onChange={(event) => handleMultipleChange(event, setSelectedBouquetColorIds)}
            >
              <MenuItem value={ALL_FILTER_VALUE}>Все цвета</MenuItem>
              {colors.map((color) => (
                <MenuItem key={color.id} value={color.id}>
                  {color.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="bouquet-flowerin-label">Цветы в составе</InputLabel>
            <Select
              multiple
              labelId="bouquet-flowerin-label"
              value={selectedBouquetFlowerInIds}
              input={<OutlinedInput label="Цветы в составе" />}
              renderValue={(selected) => renderSelectedNames(selected, flowerIns, 'Все цветки')}
              onChange={(event) => handleMultipleChange(event, setSelectedBouquetFlowerInIds)}
            >
              <MenuItem value={ALL_FILTER_VALUE}>Все цветки</MenuItem>
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
              multiple
              labelId="flower-type-label"
              value={selectedFlowerInIds}
              input={<OutlinedInput label="Тип цветка" />}
              renderValue={(selected) => renderSelectedNames(selected, flowerIns, 'Все типы')}
              onChange={(event) => handleMultipleChange(event, setSelectedFlowerInIds)}
            >
              <MenuItem value={ALL_FILTER_VALUE}>Все типы</MenuItem>
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
              multiple
              labelId="flower-color-label"
              value={selectedFlowerColorIds}
              input={<OutlinedInput label="Цвет цветка" />}
              renderValue={(selected) => renderSelectedNames(selected, colors, 'Все цвета')}
              onChange={(event) => handleMultipleChange(event, setSelectedFlowerColorIds)}
            >
              <MenuItem value={ALL_FILTER_VALUE}>Все цвета</MenuItem>
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
          multiple
          labelId="gift-category-label"
          value={selectedGiftCategoryIds}
          input={<OutlinedInput label="Категория подарка" />}
          renderValue={(selected) => renderSelectedNames(selected, categories, 'Все подарки')}
          onChange={(event) => handleMultipleChange(event, setSelectedGiftCategoryIds)}
        >
          <MenuItem value={ALL_FILTER_VALUE}>Все подарки</MenuItem>
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
            linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(246,251,247,0.84) 100%)
          `,
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(24,38,31,0.06)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.75 }, display: 'grid', gap: 2.25 }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 8.5 }}>
              <Box sx={{ display: 'grid', gap: 0.75 }}>
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
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 3.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyItems: { xs: 'stretch', md: 'end' },
                  justifyContent: { xs: 'stretch', md: 'flex-end' },
                }}
              >
                <Button
                  variant="text"
                  color="inherit"
                  onClick={resetFilters}
                  sx={{
                    minHeight: 48,
                    px: 2.25,
                    bgcolor: alpha('#ffffff', 0.52),
                    width: { xs: '100%', md: 'fit-content' },
                  }}
                >
                  Сбросить фильтры
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={2.25} sx={{ alignItems: 'stretch' }}>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Box
                sx={{
                  height: '100%',
                  p: { xs: 1.5, md: 1.75 },
                  borderRadius: 2.5,
                  bgcolor: alpha('#ffffff', 0.54),
                  border: '1px solid rgba(24,38,31,0.05)',
                }}
              >
                 <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.4 }}>
                  Цена
                </Typography>
                <Stack direction="row" spacing={1.25} sx={{ mt: 1.25 }}>
                  <TextField
                    fullWidth
                    label="От"
                    type="number"
                    value={priceRange[0]}
                    onChange={(event) => handleMinPriceInput(event.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="До"
                    type="number"
                    value={priceRange[1]}
                    onChange={(event) => handleMaxPriceInput(event.target.value)}
                  />
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, lg: 7 }}>
              <Box
                sx={{
                  height: '100%',
                  p: { xs: 1.5, md: 1.75 },
                  borderRadius: 2.5,
                  bgcolor: alpha('#ffffff', 0.54),
                  border: '1px solid rgba(24,38,31,0.05)',
                  display: 'grid',
                  gap: 1.1,
                }}
              >
                 <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.4 }}>
                  Фильтры
                </Typography>
                <Box sx={{ width: '100%' }}>{renderTabFilters()}</Box>
              </Box>
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
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,239,228,0.74) 100%)',
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
                  <CardActionArea
                    onClick={() =>
                      navigate(`/products/${product.id}`, {
                        state: {
                          returnTo: location.pathname + location.search,
                          returnLabel:
                            activeTab === 'flowers' ? 'Назад к цветам' : activeTab === 'gifts' ? 'Назад к подаркам' : 'Назад к букетам',
                        },
                      })
                    }
                    sx={{
                      height: '100%',
                      display: 'block',
                    }}
                  >
                    <CardContent sx={{ display: 'grid', gap: 2, height: '100%', p: 2.25 }}>
                      <Box
                        sx={{
                          minHeight: 320,
                          borderRadius: 2,
                          border: '1px solid rgba(24,38,31,0.06)',
                          overflow: 'hidden',
                          position: 'relative',
                          backgroundColor: '#f3f7f4',
                        }}
                      >
                        <Box
                          component="img"
                          src={getProductPlaceholderImage(product)}
                          alt={product.name}
                          sx={{
                            width: '100%',
                            height: 320,
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(180deg, rgba(14,19,16,0.02) 0%, rgba(14,19,16,0.05) 48%, rgba(14,19,16,0.22) 100%)',
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            right: 12,
                            bottom: 12,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 999,
                            bgcolor: 'rgba(255,255,255,0.88)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 8px 24px rgba(31,42,35,0.10)',
                          }}
                        >
                          <Typography variant="h5" sx={{ maxWidth: '10ch' }}>
                            {formatCurrency(product.price)}
                          </Typography>
                        </Box>

                        <Tooltip title="В корзину">
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              void handleAddToCart(product.id);
                            }}
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              minWidth: 44,
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              p: 0,
                              opacity: { xs: 1, md: 0 },
                              transform: { xs: 'scale(1)', md: 'scale(0.92)' },
                              transition: 'opacity 180ms ease, transform 180ms ease',
                              '.MuiCard-root:hover &': {
                                opacity: 1,
                                transform: 'scale(1)',
                              },
                            }}
                          >
                            <Plus size={18} />
                          </Button>
                        </Tooltip>
                      </Box>

                      <Box sx={{ display: 'grid', gap: 0.9 }}>
                        <Typography variant="h6">{product.name}</Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {product.description || 'Описание пока не заполнено.'}
                        </Typography>
                      </Box>

                      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                        {product.categoryName ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={product.categoryName}
                            sx={{ bgcolor: alpha('#ffffff', 0.74) }}
                          />
                        ) : null}
                        {product.type === 'Bouquet'
                          ? (product.flowerInNames ?? []).map((flowerInName) => (
                              <Chip
                                key={`${product.id}-${flowerInName}`}
                                size="small"
                                variant="outlined"
                                label={flowerInName}
                                sx={{ bgcolor: alpha('#ffffff', 0.74) }}
                              />
                            ))
                          : null}
                        {product.flowerInName && product.type === 'Flower' ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={product.flowerInName}
                            sx={{ bgcolor: alpha('#ffffff', 0.74) }}
                          />
                        ) : null}
                        {product.type === 'Bouquet'
                          ? (product.colorNames ?? []).map((colorName) => (
                              <Chip
                                key={`${product.id}-${colorName}`}
                                size="small"
                                variant="outlined"
                                label={colorName}
                                sx={{ bgcolor: alpha('#ffffff', 0.74) }}
                              />
                            ))
                          : null}
                        {product.colorName && product.type === 'Flower' ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={product.colorName}
                            sx={{ bgcolor: alpha('#ffffff', 0.74) }}
                          />
                        ) : null}
                      </Stack>

                    </CardContent>
                  </CardActionArea>
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

