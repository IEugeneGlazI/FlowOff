import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ImagePlus, PackageCheck, PencilLine, Plus, Trash2, X } from 'lucide-react';
import type { Category, ColorReference, FlowerInReference, Product, ProductType, Promotion } from '../../entities/catalog';
import type { Order } from '../../entities/cart';
import { useAuth } from '../../features/auth/AuthContext';
import {
  createProduct,
  deleteProduct,
  getCategories,
  getColors,
  getFlowerIns,
  getPromotions,
  getProducts,
  updateProduct,
  uploadProductImage,
} from '../../features/catalog/catalogApi';
import { apiRequest, ApiError } from '../../shared/api';
import { formatCurrency, formatDate } from '../../shared/format';
import { PaginationControls } from '../../shared/PaginationControls';
import { ProductImage } from '../../shared/ProductImage';
import { getPromotionPricing } from '../../shared/promotionPricing';

type FloristTab = 'products' | 'orders';
type FloristOrdersTab = 'assembly' | 'accepted';
type FloristPanelMode = 'florist' | 'admin';
const FLORIST_PRODUCTS_PAGE_SIZE = 9;
const FLORIST_ORDERS_PAGE_SIZE = 6;

type ProductFormState = {
  id?: string;
  type: ProductType;
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  isVisible: boolean;
  categoryId: string;
  flowerInId: string;
  colorId: string;
  flowerInIds: string[];
  colorIds: string[];
};

type FeedbackState = {
  severity: 'success' | 'error';
  message: string;
};

const emptyProductForm: ProductFormState = {
  type: 'Bouquet',
  name: '',
  description: '',
  imageUrl: '',
  price: '',
  isVisible: true,
  categoryId: '',
  flowerInId: '',
  colorId: '',
  flowerInIds: [],
  colorIds: [],
};

function normalizeMultiValue(value: string | string[]) {
  return typeof value === 'string' ? value.split(',').filter(Boolean) : value;
}

function getProductTypeLabel(productType: ProductType) {
  switch (productType) {
    case 'Flower':
      return 'Цветы';
    case 'Gift':
      return 'Подарки';
    default:
      return 'Букеты';
  }
}

function getOrderStageLabel(order: Order) {
  if (order.deliveryMethod !== 'Pickup' && order.deliveryStatus === 'Заказ готов к выдаче') {
    return 'Заказ передается в доставку';
  }

  return order.deliveryStatus || 'Заказ на рассмотрении';
}

export function FloristPanelPage({
  mode = 'florist',
  allowedTabs,
  embedded = false,
}: {
  mode?: FloristPanelMode;
  allowedTabs?: FloristTab[];
  embedded?: boolean;
} = {}) {
  const productImageInputRef = useRef<HTMLInputElement | null>(null);
  const { session } = useAuth();
  const location = useLocation();
  const availableTabs = useMemo<FloristTab[]>(
    () => allowedTabs ?? (mode === 'admin' ? ['products'] : ['products', 'orders']),
    [allowedTabs, mode],
  );
  const defaultTab = availableTabs[0] ?? 'products';

  const [tab, setTab] = useState<FloristTab>(defaultTab);
  const [ordersTab, setOrdersTab] = useState<FloristOrdersTab>('assembly');
  const [productsPage, setProductsPage] = useState(1);
  const [assemblyOrdersPage, setAssemblyOrdersPage] = useState(1);
  const [acceptedOrdersPage, setAcceptedOrdersPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<ColorReference[]>([]);
  const [flowerIns, setFlowerIns] = useState<FlowerInReference[]>([]);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<ProductType | 'All'>('All');
  const [productVisibilityFilter, setProductVisibilityFilter] = useState<'All' | 'Visible' | 'Hidden'>('All');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [productImagePreviewUrl, setProductImagePreviewUrl] = useState<string | null>(null);

  const token = session?.token ?? null;
  const isAllowed = mode === 'admin' ? session?.role === 'Administrator' : session?.role === 'Florist' || session?.role === 'Administrator';
  const isEditing = Boolean(productForm.id);
  const pricingByProductId = useMemo(
    () =>
      Object.fromEntries(
        products.map((product) => [
          product.id,
          getPromotionPricing({ id: product.id, type: product.type, price: product.price }, promotions),
        ]),
      ),
    [products, promotions],
  );

  useEffect(() => {
    if (!availableTabs.includes(tab)) {
      setTab(defaultTab);
    }
  }, [availableTabs, defaultTab, tab]);

  useEffect(() => {
    void Promise.all([getCategories(), getColors(), getFlowerIns(), getPromotions()]).then(
      ([nextCategories, nextColors, nextFlowerIns, nextPromotions]) => {
        setCategories(nextCategories);
        setColors(nextColors);
        setFlowerIns(nextFlowerIns);
        setPromotions(nextPromotions);
      },
    );
  }, []);

  useEffect(() => {
    if (!token || !isAllowed) {
      return;
    }

    void loadProducts();
    if (availableTabs.includes('orders')) {
      void loadOrders();
    }
  }, [availableTabs, isAllowed, token]);

  async function loadProducts() {
    if (!token) {
      return;
    }

    setIsLoadingProducts(true);
    try {
      const nextProducts = await getProducts({ type: 'All', includeHidden: true, token });
      setProducts(nextProducts);
    } finally {
      setIsLoadingProducts(false);
    }
  }

  async function loadOrders() {
    if (!token) {
      return;
    }

    setIsLoadingOrders(true);
    try {
      const nextOrders = await apiRequest<Order[]>('/florist/orders', { token });
      setOrders(nextOrders);
    } finally {
      setIsLoadingOrders(false);
    }
  }

  function resetProductForm(nextType: ProductType = 'Bouquet') {
    setProductForm({
      ...emptyProductForm,
      type: nextType,
    });
  }

  function openCreateProductDialog() {
    resetProductForm();
    setSelectedImageFile(null);
    setProductImagePreviewUrl(null);
    setIsProductDialogOpen(true);
  }

  function closeProductDialog() {
    if (isSaving) {
      return;
    }

    setIsProductDialogOpen(false);
  }

  function startEditingProduct(product: Product) {
    setProductForm({
      id: product.id,
      type: product.type,
      name: product.name,
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
      price: String(product.price),
      isVisible: product.isVisible,
      categoryId: product.categoryId ?? '',
      flowerInId: product.flowerInId ?? '',
      colorId: product.colorId ?? '',
      flowerInIds: product.flowerInIds ?? [],
      colorIds: product.colorIds ?? [],
    });
    setSelectedImageFile(null);
    setProductImagePreviewUrl(product.imageUrl ?? null);
    setIsProductDialogOpen(true);
  }

  function handleProductImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedImageFile(file);

    if (!file) {
      setProductImagePreviewUrl(productForm.imageUrl || null);
      return;
    }

    setProductImagePreviewUrl(URL.createObjectURL(file));
  }

  function clearSelectedProductImage() {
    setSelectedImageFile(null);
    setProductImagePreviewUrl(null);
    setProductForm((current) => ({ ...current, imageUrl: '' }));

    if (productImageInputRef.current) {
      productImageInputRef.current.value = '';
    }
  }

  function buildProductPayload(imageUrlOverride?: string | null) {
    return {
      name: productForm.name.trim(),
      description: productForm.description.trim() || null,
      imageUrl: imageUrlOverride ?? (productForm.imageUrl.trim() || null),
      price: Number(productForm.price),
      isVisible: productForm.isVisible,
      type: productForm.type,
      categoryId: productForm.categoryId || null,
      flowerInId: productForm.flowerInId || null,
      colorId: productForm.colorId || null,
      flowerInIds: productForm.flowerInIds,
      colorIds: productForm.colorIds,
    };
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setFeedback(null);
    setIsSaving(true);

    try {
      let imageUrl = productForm.imageUrl.trim() || null;

      if (selectedImageFile) {
        const uploadedImage = await uploadProductImage(selectedImageFile, token);
        imageUrl = uploadedImage.imageUrl;
      }

      const payload = buildProductPayload(imageUrl);

      if (isEditing && productForm.id) {
        await updateProduct(productForm.id, payload, token);
        setFeedback({ severity: 'success', message: 'Товар обновлен.' });
      } else {
        await createProduct(payload, token);
        setFeedback({ severity: 'success', message: 'Товар создан.' });
      }

      resetProductForm(productForm.type);
      setSelectedImageFile(null);
      setProductImagePreviewUrl(null);
      setIsProductDialogOpen(false);
      await loadProducts();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось сохранить товар.';
      setFeedback({ severity: 'error', message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!token) {
      return;
    }

    setFeedback(null);

    try {
      await deleteProduct(productId, token);
      setFeedback({ severity: 'success', message: 'Товар удален.' });
      if (productForm.id === productId) {
        resetProductForm(productForm.type);
      }
      await loadProducts();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось удалить товар.';
      setFeedback({ severity: 'error', message });
    }
  }

  async function handleVisibilityToggle(product: Product) {
    if (!token) {
      return;
    }

    setFeedback(null);

    try {
      await updateProduct(
        product.id,
        {
          name: product.name,
          description: product.description ?? null,
          imageUrl: product.imageUrl ?? null,
          price: product.price,
          isVisible: !product.isVisible,
          categoryId: product.categoryId ?? null,
          flowerInId: product.flowerInId ?? null,
          colorId: product.colorId ?? null,
          flowerInIds: product.flowerInIds ?? [],
          colorIds: product.colorIds ?? [],
        },
        token,
      );

      setFeedback({
        severity: 'success',
        message: !product.isVisible ? 'Товар снова виден на сайте.' : 'Товар скрыт с сайта.',
      });
      await loadProducts();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось изменить видимость товара.';
      setFeedback({ severity: 'error', message });
    }
  }

  async function handleAssemblyStatusChange(orderId: string, status: 'Заказ собирается' | 'Заказ готов к выдаче') {
    if (!token) {
      return;
    }

    setFeedback(null);

    try {
      await apiRequest(`/florist/orders/${orderId}/assembly-status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      });

      setFeedback({
        severity: 'success',
        message: status === 'Заказ собирается' ? 'Заказ принят в сборку.' : 'Сборка заказа завершена.',
      });
      await loadOrders();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось обновить статус заказа.';
      setFeedback({ severity: 'error', message });
    }
  }

  async function handleCompletePickup(orderId: string) {
    if (!token) {
      return;
    }

    setFeedback(null);

    try {
      await apiRequest(`/florist/orders/${orderId}/complete-pickup`, {
        method: 'PATCH',
        token,
      });

      setFeedback({
        severity: 'success',
        message: 'Заказ отмечен как забранный покупателем.',
      });
      await loadOrders();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось завершить заказ с самовывозом.';
      setFeedback({ severity: 'error', message });
    }
  }

  const sortedProducts = useMemo(
    () =>
      [...products]
        .filter((product) => {
          const matchesType = productTypeFilter === 'All' || product.type === productTypeFilter;
          const matchesSearch = product.name.toLowerCase().includes(productSearch.trim().toLowerCase());
          const matchesVisibility =
            productVisibilityFilter === 'All'
              ? true
              : productVisibilityFilter === 'Visible'
                ? product.isVisible
                : !product.isVisible;

          return matchesType && matchesSearch && matchesVisibility;
        })
        .sort((left, right) => Number(right.isVisible) - Number(left.isVisible) || left.name.localeCompare(right.name)),
    [productSearch, productTypeFilter, productVisibilityFilter, products],
  );

  const productImageById = useMemo(
    () =>
      products.reduce<Record<string, string>>((accumulator, product) => {
        accumulator[product.id] = product.imageUrl || '';
        return accumulator;
      }, {}),
    [products],
  );

  const assemblyOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === 'Активен' &&
          (order.deliveryStatus === 'Заказ на рассмотрении' || !order.deliveryStatus),
      ),
    [orders],
  );

  const acceptedOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === 'Активен' &&
          ['Заказ собирается', 'Заказ готов к выдаче', 'Заказ передается в доставку'].includes(order.deliveryStatus || ''),
      ),
    [orders],
  );

  const visibleOrders = ordersTab === 'assembly' ? assemblyOrders : acceptedOrders;
  const pagedProducts = sortedProducts.slice((productsPage - 1) * FLORIST_PRODUCTS_PAGE_SIZE, productsPage * FLORIST_PRODUCTS_PAGE_SIZE);
  const productsPageCount = Math.max(1, Math.ceil(sortedProducts.length / FLORIST_PRODUCTS_PAGE_SIZE));
  const currentOrdersPage = ordersTab === 'assembly' ? assemblyOrdersPage : acceptedOrdersPage;
  const ordersPageCount = Math.max(1, Math.ceil(visibleOrders.length / FLORIST_ORDERS_PAGE_SIZE));
  const pagedVisibleOrders = visibleOrders.slice(
    (currentOrdersPage - 1) * FLORIST_ORDERS_PAGE_SIZE,
    currentOrdersPage * FLORIST_ORDERS_PAGE_SIZE,
  );

  useEffect(() => {
    setProductsPage(1);
  }, [productSearch, productTypeFilter, productVisibilityFilter, products]);

  useEffect(() => {
    setAssemblyOrdersPage(1);
  }, [assemblyOrders]);

  useEffect(() => {
    setAcceptedOrdersPage(1);
  }, [acceptedOrders]);

  if (!session || !isAllowed) {
    return (
      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ minHeight: 220, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <Typography>
            {mode === 'admin'
              ? 'Панель администратора доступна только для аккаунта администратора.'
              : 'Панель флориста доступна только для аккаунта флориста.'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      {!embedded ? (
        <>
          <Box sx={{ display: 'grid', gap: 0.75 }}>
            <Typography variant="h1">{mode === 'admin' ? 'Панель администратора' : 'Панель флориста'}</Typography>
            <Typography variant="body1" color="text.secondary">
              {mode === 'admin'
                ? 'Управляйте товарами и готовьте следующие вкладки администрирования.'
                : 'Управляйте товарами, их видимостью и этапами сборки заказов.'}
            </Typography>
          </Box>

          <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Tabs value={tab} onChange={(_, value: FloristTab) => setTab(value)} sx={{ minHeight: 48 }}>
                <Tab value="products" label="Товары" />
                {availableTabs.includes('orders') ? <Tab value="orders" label="Заказы" /> : null}
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : null}

      {tab === 'products' ? (
        <>
          <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'space-between' }}>
                <Box sx={{ display: 'grid', gap: 0.5 }}>
                  <Typography variant="h5">Каталог товаров</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Создавайте, редактируйте и скрывайте товары каталога.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Plus size={14} />}
                  onClick={openCreateProductDialog}
                  sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, px: 1.5, minHeight: 36 }}
                >
                  Новый товар
                </Button>
              </Stack>

              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ alignItems: { lg: 'center' } }}>
                <TextField
                  label="Поиск по названию"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  sx={{
                    width: { xs: '100%', lg: 380 },
                    flexShrink: 0,
                  }}
                />

                <ToggleButtonGroup
                  value={productTypeFilter}
                  exclusive
                  onChange={(_, value: ProductType | 'All' | null) => {
                    if (value) {
                      setProductTypeFilter(value);
                    }
                  }}
                  sx={{
                    flexWrap: 'wrap',
                    flexShrink: 0,
                    '& .MuiToggleButton-root': {
                      px: 2,
                    },
                  }}
                >
                  <ToggleButton value="All">Все</ToggleButton>
                  <ToggleButton value="Bouquet">Букеты</ToggleButton>
                  <ToggleButton value="Flower">Цветы</ToggleButton>
                  <ToggleButton value="Gift">Подарки</ToggleButton>
                </ToggleButtonGroup>

                <ToggleButtonGroup
                  value={productVisibilityFilter}
                  exclusive
                  onChange={(_, value: 'All' | 'Visible' | 'Hidden' | null) => {
                    if (value) {
                      setProductVisibilityFilter(value);
                    }
                  }}
                  sx={{
                    flexWrap: 'wrap',
                    flexShrink: 0,
                    '& .MuiToggleButton-root': {
                      px: 2,
                    },
                  }}
                >
                  <ToggleButton value="All">Все</ToggleButton>
                  <ToggleButton value="Visible">Видимые</ToggleButton>
                  <ToggleButton value="Hidden">Скрытые</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {isLoadingProducts ? <Typography>Загружаем товары...</Typography> : null}

              <Box sx={{ display: 'grid', gap: 1.25 }}>
                {pagedProducts.map((product) => (
                  <Card
                    key={product.id}
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
                    onClick={() => startEditingProduct(product)}
                  >
                    <CardContent sx={{ display: 'grid', gap: 1.25 }}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
                      >
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: 2,
                              flexShrink: 0,
                              border: '1px solid rgba(24,38,31,0.06)',
                            }}
                          />
                          <Box sx={{ display: 'grid', gap: 0.4, minWidth: 0 }}>
                            <Typography variant="h6">{product.name}</Typography>
                            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                {getProductTypeLabel(product.type)}
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {formatCurrency(pricingByProductId[product.id]?.discountedPrice ?? product.price)}
                              </Typography>
                              {pricingByProductId[product.id]?.hasDiscount ? (
                                <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                  {formatCurrency(product.price)}
                                </Typography>
                              ) : null}
                            </Stack>
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                          <Tooltip title={product.isVisible ? 'При нажатии товар будет скрыт с сайта' : 'При нажатии товар снова станет виден на сайте'}>
                            <Chip
                              label={product.isVisible ? 'Виден на сайте' : 'Скрыт с сайта'}
                              color={product.isVisible ? 'success' : 'default'}
                              variant="outlined"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleVisibilityToggle(product);
                              }}
                            />
                          </Tooltip>

                          <Button
                            variant="text"
                            color="inherit"
                            startIcon={<PencilLine size={16} />}
                            onClick={(event) => {
                              event.stopPropagation();
                              startEditingProduct(product);
                            }}
                          >
                            Изменить
                          </Button>

                          <Button
                            variant="text"
                            color="inherit"
                            startIcon={<Trash2 size={16} />}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteProduct(product.id);
                            }}
                          >
                            Удалить
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              <PaginationControls
                page={productsPage}
                pageCount={productsPageCount}
                totalCount={sortedProducts.length}
                pageSize={FLORIST_PRODUCTS_PAGE_SIZE}
                onChange={setProductsPage}
              />
            </CardContent>
          </Card>

          <Dialog open={isProductDialogOpen} onClose={closeProductDialog} fullWidth maxWidth="sm">
            <DialogTitle>{isEditing ? 'Редактирование товара' : 'Создание товара'}</DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
              <Box sx={{ display: 'grid', gap: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Заполните данные карточки и при необходимости скройте товар с витрины.
                </Typography>
              </Box>

              <form onSubmit={(event) => void handleProductSubmit(event)}>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id="florist-product-type-label">Тип товара</InputLabel>
                    <Select
                      labelId="florist-product-type-label"
                      value={productForm.type}
                      label="Тип товара"
                      disabled={isEditing}
                      onChange={(event) => setProductForm((current) => ({ ...current, type: event.target.value as ProductType }))}
                    >
                      <MenuItem value="Bouquet">Букет</MenuItem>
                      <MenuItem value="Flower">Цветок</MenuItem>
                      <MenuItem value="Gift">Подарок</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Название"
                    value={productForm.name}
                    onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                    required
                    fullWidth
                  />

                  <TextField
                    label="Описание"
                    value={productForm.description}
                    onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
                    multiline
                    minRows={3}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <Stack spacing={1.25}>
                    <input
                      ref={productImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      hidden
                      onChange={handleProductImageSelection}
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
                      <ProductImage
                        src={productImagePreviewUrl || productForm.imageUrl}
                        alt={productForm.name || 'Изображение товара'}
                        sx={{
                          width: 112,
                          height: 112,
                          borderRadius: 2,
                          border: '1px solid rgba(24,38,31,0.08)',
                          flexShrink: 0,
                        }}
                      />

                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        <Button
                          type="button"
                          variant="outlined"
                          color="inherit"
                          startIcon={<ImagePlus size={16} />}
                          onClick={() => productImageInputRef.current?.click()}
                        >
                          {productForm.imageUrl || selectedImageFile ? 'Заменить изображение' : 'Добавить изображение'}
                        </Button>

                        {productForm.imageUrl || selectedImageFile ? (
                          <IconButton aria-label="Очистить изображение" onClick={clearSelectedProductImage}>
                            <X size={16} />
                          </IconButton>
                        ) : null}
                      </Stack>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      Поддерживаются JPG, PNG и WEBP до 5 МБ.
                    </Typography>
                  </Stack>

                  <TextField
                    label="Цена"
                    type="number"
                    value={productForm.price}
                    onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
                    required
                    fullWidth
                  />

                  {productForm.type === 'Gift' ? (
                    <FormControl fullWidth>
                      <InputLabel id="gift-category-label">Категория</InputLabel>
                      <Select
                        labelId="gift-category-label"
                        value={productForm.categoryId}
                        label="Категория"
                        onChange={(event) => setProductForm((current) => ({ ...current, categoryId: event.target.value }))}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : null}

                  {productForm.type === 'Flower' ? (
                    <>
                      <FormControl fullWidth>
                        <InputLabel id="flower-type-label">Цветок</InputLabel>
                        <Select
                          labelId="flower-type-label"
                          value={productForm.flowerInId}
                          label="Цветок"
                          onChange={(event) => setProductForm((current) => ({ ...current, flowerInId: event.target.value }))}
                        >
                          {flowerIns.map((flowerIn) => (
                            <MenuItem key={flowerIn.id} value={flowerIn.id}>
                              {flowerIn.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel id="flower-color-label">Цвет</InputLabel>
                        <Select
                          labelId="flower-color-label"
                          value={productForm.colorId}
                          label="Цвет"
                          onChange={(event) => setProductForm((current) => ({ ...current, colorId: event.target.value }))}
                        >
                          {colors.map((color) => (
                            <MenuItem key={color.id} value={color.id}>
                              {color.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </>
                  ) : null}

                  {productForm.type === 'Bouquet' ? (
                    <>
                      <FormControl fullWidth>
                        <InputLabel id="bouquet-flowerins-label">Цветы в составе</InputLabel>
                        <Select
                          multiple
                          labelId="bouquet-flowerins-label"
                          value={productForm.flowerInIds}
                          label="Цветы в составе"
                          onChange={(event) =>
                            setProductForm((current) => ({ ...current, flowerInIds: normalizeMultiValue(event.target.value as string | string[]) }))
                          }
                        >
                          {flowerIns.map((flowerIn) => (
                            <MenuItem key={flowerIn.id} value={flowerIn.id}>
                              {flowerIn.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel id="bouquet-colors-label">Цвета</InputLabel>
                        <Select
                          multiple
                          labelId="bouquet-colors-label"
                          value={productForm.colorIds}
                          label="Цвета"
                          onChange={(event) =>
                            setProductForm((current) => ({ ...current, colorIds: normalizeMultiValue(event.target.value as string | string[]) }))
                          }
                        >
                          {colors.map((color) => (
                            <MenuItem key={color.id} value={color.id}>
                              {color.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </>
                  ) : null}

                  <FormControlLabel
                    control={
                      <Switch
                        checked={productForm.isVisible}
                        onChange={(event) => setProductForm((current) => ({ ...current, isVisible: event.target.checked }))}
                      />
                    }
                    label={productForm.isVisible ? 'Товар виден на сайте' : 'Товар скрыт с сайта'}
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                    <Button type="submit" variant="contained" disabled={isSaving}>
                      {isSaving ? 'Сохраняем...' : isEditing ? 'Сохранить товар' : 'Создать товар'}
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      color="inherit"
                      onClick={() => {
                        resetProductForm(productForm.type);
                        closeProductDialog();
                      }}
                    >
                      Закрыть
                    </Button>
                  </Stack>
                </Stack>
              </form>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
          <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="h5">{ordersTab === 'assembly' ? 'Заказы для сборки' : 'Принятые заказы'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {ordersTab === 'assembly'
                  ? 'Здесь находятся заказы, которые можно принять в сборку.'
                  : 'Здесь находятся заказы, уже принятые в работу.'}
              </Typography>
            </Box>

            <Tabs value={ordersTab} onChange={(_, value: FloristOrdersTab) => setOrdersTab(value)} sx={{ minHeight: 48 }}>
              <Tab value="assembly" label="Заказы для сборки" />
              <Tab value="accepted" label="Принятые заказы" />
            </Tabs>

            {isLoadingOrders ? <Typography>Загружаем заказы...</Typography> : null}

            <Box sx={{ display: 'grid', gap: 1.25 }}>
              {pagedVisibleOrders.map((order) => (
                <Card key={order.id} variant="outlined" sx={{ borderRadius: 2, boxShadow: 'none' }}>
                  <CardContent sx={{ display: 'grid', gap: 1.5 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'grid', gap: 0.4 }}>
                        <Typography variant="h6">Заказ #{order.orderNumber ? String(order.orderNumber).padStart(6, '0') : order.id.slice(0, 8)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(order.createdAtUtc)} • {order.deliveryMethod === 'Pickup' ? 'Самовывоз' : 'Доставка'}
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
                          state={{
                            returnTo: location.pathname + location.search,
                            returnLabel: mode === 'admin' ? 'Назад в панель администратора' : 'Назад в панель флориста',
                          }}
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
                            <ProductImage
                              src={productImageById[item.productId]}
                              alt={item.productName}
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 1.5,
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
                      {order.status === 'Активен' && (order.deliveryStatus === 'Заказ на рассмотрении' || !order.deliveryStatus) ? (
                        <Button variant="contained" onClick={() => void handleAssemblyStatusChange(order.id, 'Заказ собирается')}>
                          Принять заказ
                        </Button>
                      ) : null}
                      {order.status === 'Активен' && order.deliveryStatus === 'Заказ собирается' ? (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => void handleAssemblyStatusChange(order.id, 'Заказ готов к выдаче')}
                        >
                          Отметить: Заказ собран
                        </Button>
                      ) : null}
                      {order.deliveryMethod === 'Pickup' && order.deliveryStatus === 'Заказ готов к выдаче' ? (
                        <Button variant="outlined" color="inherit" onClick={() => void handleCompletePickup(order.id)}>
                          Отметить: Заказ принят покупателем
                        </Button>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              ))}

              {!isLoadingOrders && visibleOrders.length === 0 ? (
                <Typography color="text.secondary">
                  {ordersTab === 'assembly'
                    ? 'Сейчас нет заказов, которые ожидают принятия в сборку.'
                    : 'Сейчас нет заказов, которые уже приняты в работу флористом.'}
                </Typography>
              ) : null}
            </Box>

            <PaginationControls
              page={currentOrdersPage}
              pageCount={ordersPageCount}
              totalCount={visibleOrders.length}
              pageSize={FLORIST_ORDERS_PAGE_SIZE}
              onChange={ordersTab === 'assembly' ? setAssemblyOrdersPage : setAcceptedOrdersPage}
            />
          </CardContent>
        </Card>
      )}

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
