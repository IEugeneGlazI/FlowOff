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
import { Link as RouterLink } from 'react-router-dom';
import { ImagePlus, PackageCheck, PencilLine, Plus, Trash2, X } from 'lucide-react';
import type { Category, ColorReference, FlowerInReference, Product, ProductType } from '../../entities/catalog';
import type { Order } from '../../entities/cart';
import { useAuth } from '../../features/auth/AuthContext';
import {
  createProduct,
  deleteProduct,
  getCategories,
  getColors,
  getFlowerIns,
  getProducts,
  updateProduct,
  uploadProductImage,
} from '../../features/catalog/catalogApi';
import { apiRequest, ApiError } from '../../shared/api';
import { formatCurrency, formatDate } from '../../shared/format';

type FloristTab = 'products' | 'orders';
type FloristOrdersTab = 'assembly' | 'accepted';

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

function getProductPlaceholderImage(productType: ProductType) {
  if (productType === 'Flower') {
    return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80';
  }

  if (productType === 'Gift') {
    return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80';
  }

  return 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=900&q=80';
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
  if (order.deliveryMethod === 'Pickup') {
    switch (order.status) {
      case 'Accepted':
      case 'InAssembly':
        return 'Заказ собирается';
      case 'Assembled':
        return 'Заказ готов к выдаче';
      case 'ReceivedByCustomer':
      case 'Delivered':
        return 'Заказ принят покупателем';
      default:
        return 'Заказ на рассмотрении';
    }
  }

  switch (order.status) {
    case 'Accepted':
    case 'InAssembly':
      return 'Заказ собирается';
    case 'Assembled':
      return 'Заказ передается в доставку';
    case 'TransferredToCourier':
      return 'Заказ принят в доставку';
    case 'InTransit':
      return 'Заказ в пути';
    case 'Delivered':
      return 'Заказ доставлен';
    case 'ReceivedByCustomer':
      return 'Заказ принят покупателем';
    default:
      return 'Заказ на рассмотрении';
  }
}

export function FloristPanelPage() {
  const productImageInputRef = useRef<HTMLInputElement | null>(null);
  const { session } = useAuth();

  const [tab, setTab] = useState<FloristTab>('products');
  const [ordersTab, setOrdersTab] = useState<FloristOrdersTab>('assembly');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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
  const isFlorist = session?.role === 'Florist' || session?.role === 'Administrator';
  const isEditing = Boolean(productForm.id);

  useEffect(() => {
    void Promise.all([getCategories(), getColors(), getFlowerIns()]).then(([nextCategories, nextColors, nextFlowerIns]) => {
      setCategories(nextCategories);
      setColors(nextColors);
      setFlowerIns(nextFlowerIns);
    });
  }, []);

  useEffect(() => {
    if (!token || !isFlorist) {
      return;
    }

    void loadProducts();
    void loadOrders();
  }, [token, isFlorist]);

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

  async function handleAssemblyStatusChange(orderId: string, status: 'Accepted' | 'Assembled') {
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
        message: status === 'Accepted' ? 'Заказ принят в сборку.' : 'Сборка заказа завершена.',
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
        accumulator[product.id] = product.imageUrl || getProductPlaceholderImage(product.type);
        return accumulator;
      }, {}),
    [products],
  );

  const assemblyOrders = useMemo(
    () => orders.filter((order) => ['PendingPayment', 'Paid'].includes(order.status)),
    [orders],
  );

  const acceptedOrders = useMemo(
    () => orders.filter((order) => ['Accepted', 'InAssembly', 'Assembled'].includes(order.status)),
    [orders],
  );

  const visibleOrders = ordersTab === 'assembly' ? assemblyOrders : acceptedOrders;

  if (!session || !isFlorist) {
    return (
      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ minHeight: 220, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <Typography>Панель флориста доступна только для аккаунта флориста.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gap: 0.75 }}>
        <Typography variant="h1">Панель флориста</Typography>
        <Typography variant="body1" color="text.secondary">
          Управляйте товарами, их видимостью и этапами сборки заказов.
        </Typography>
      </Box>

      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Tabs value={tab} onChange={(_, value: FloristTab) => setTab(value)} sx={{ minHeight: 48 }}>
            <Tab value="products" label="Товары" />
            <Tab value="orders" label="Заказы" />
          </Tabs>
        </CardContent>
      </Card>

      {tab === 'products' ? (
        <>
          <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'space-between' }}>
                <Box sx={{ display: 'grid', gap: 0.5 }}>
                  <Typography variant="h5">Каталог товаров</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Здесь видны и скрытые товары.
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
                {sortedProducts.map((product) => (
                  <Card
                    key={product.id}
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      boxShadow: 'none',
                      cursor: 'pointer',
                      transition: 'transform 160ms ease, box-shadow 160ms ease',
                      ':hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 14px 32px rgba(38, 54, 45, 0.08)',
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
                          <Box
                            component="img"
                            src={product.imageUrl || getProductPlaceholderImage(product.type)}
                            alt={product.name}
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: 2,
                              objectFit: 'cover',
                              display: 'block',
                              flexShrink: 0,
                              border: '1px solid rgba(24,38,31,0.06)',
                              bgcolor: '#f3f7f4',
                            }}
                          />
                          <Box sx={{ display: 'grid', gap: 0.4, minWidth: 0 }}>
                            <Typography variant="h6">{product.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {getProductTypeLabel(product.type)} • {formatCurrency(product.price)}
                            </Typography>
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
                      <Box
                        component="img"
                        src={productImagePreviewUrl || productForm.imageUrl || getProductPlaceholderImage(productForm.type)}
                        alt={productForm.name || 'Изображение товара'}
                        sx={{
                          width: 112,
                          height: 112,
                          borderRadius: 2,
                          objectFit: 'cover',
                          border: '1px solid rgba(24,38,31,0.08)',
                          bgcolor: '#f3f7f4',
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
                  ? 'Здесь находятся заказы, которые флорист может принять в сборку.'
                  : 'Здесь находятся заказы, уже принятые флористом в работу.'}
              </Typography>
            </Box>

            <Tabs value={ordersTab} onChange={(_, value: FloristOrdersTab) => setOrdersTab(value)} sx={{ minHeight: 48 }}>
              <Tab value="assembly" label="Заказы для сборки" />
              <Tab value="accepted" label="Принятые заказы" />
            </Tabs>

            {isLoadingOrders ? <Typography>Загружаем заказы...</Typography> : null}

            <Box sx={{ display: 'grid', gap: 1.25 }}>
              {visibleOrders.map((order) => (
                <Card key={order.id} variant="outlined" sx={{ borderRadius: 2, boxShadow: 'none' }}>
                  <CardContent sx={{ display: 'grid', gap: 1.5 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'grid', gap: 0.4 }}>
                        <Typography variant="h6">Заказ {order.id.slice(0, 8)}</Typography>
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
                              src={productImageById[item.productId] || getProductPlaceholderImage(item.productType)}
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
                      {['PendingPayment', 'Paid'].includes(order.status) ? (
                        <Button variant="contained" onClick={() => void handleAssemblyStatusChange(order.id, 'Accepted')}>
                          Принять заказ
                        </Button>
                      ) : null}
                      {['Accepted', 'InAssembly'].includes(order.status) ? (
                        <Button variant="contained" color="primary" onClick={() => void handleAssemblyStatusChange(order.id, 'Assembled')}>
                          Отметить: Заказ собран
                        </Button>
                      ) : null}
                      {order.deliveryMethod === 'Pickup' && order.status === 'Assembled' ? (
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
