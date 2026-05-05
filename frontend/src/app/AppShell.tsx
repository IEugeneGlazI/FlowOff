import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Flower2, Package2, ShoppingBag, UserRound } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useCart } from '../features/cart/CartContext';

export function AppShell() {
  const location = useLocation();
  const { session } = useAuth();
  const { cart } = useCart();

  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const storefrontPath = location.pathname.startsWith('/bouquets')
    ? '/bouquets'
    : location.pathname.startsWith('/flowers')
      ? '/flowers'
      : location.pathname.startsWith('/gifts')
        ? '/gifts'
        : null;

  function getCatalogButtonVariant(path: string) {
    return storefrontPath === path ? 'contained' : 'text';
  }

  function getSectionButtonVariant(path: string) {
    return location.pathname.startsWith(path) ? 'contained' : 'text';
  }

  return (
    <Box className="app-shell">
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          backdropFilter: 'blur(22px)',
          backgroundColor: alpha('#f7fbf7', 0.82),
          borderBottom: '1px solid rgba(24, 38, 31, 0.08)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              minHeight: 88,
              gap: 2,
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              py: 1,
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 46,
                  height: 46,
                  bgcolor: 'transparent',
                  color: 'primary.dark',
                  border: '1px solid rgba(24, 38, 31, 0.08)',
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(220,239,228,0.82) 100%)',
                }}
              >
                <Flower2 size={18} />
              </Avatar>
              <Box>
                <Typography
                  component={NavLink}
                  to="/bouquets"
                  variant="h6"
                  sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 700 }}
                >
                  Flowoff
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Когда чувства важнее слов
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} aria-label="Основная навигация" sx={{ flexWrap: 'wrap' }}>
              <Button
                component={NavLink}
                to="/bouquets"
                variant={getCatalogButtonVariant('/bouquets')}
                color={storefrontPath === '/bouquets' ? 'primary' : 'inherit'}
              >
                Букеты
              </Button>
              <Button
                component={NavLink}
                to="/flowers"
                variant={getCatalogButtonVariant('/flowers')}
                color={storefrontPath === '/flowers' ? 'primary' : 'inherit'}
              >
                Цветы
              </Button>
              <Button
                component={NavLink}
                to="/gifts"
                variant={getCatalogButtonVariant('/gifts')}
                color={storefrontPath === '/gifts' ? 'primary' : 'inherit'}
              >
                Подарки
              </Button>
              <Button
                component={NavLink}
                to="/orders"
                variant={getSectionButtonVariant('/orders')}
                color={location.pathname.startsWith('/orders') ? 'primary' : 'inherit'}
                startIcon={<Package2 size={16} />}
              >
                Заказы
              </Button>
              <Button
                component={NavLink}
                to="/cart"
                variant={location.pathname.startsWith('/cart') ? 'contained' : 'outlined'}
                color={location.pathname.startsWith('/cart') ? 'primary' : 'inherit'}
                startIcon={
                  <Badge badgeContent={cartCount} color="primary">
                    <ShoppingBag size={16} />
                  </Badge>
                }
              >
                Корзина
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {session ? (
                <>
                  {session.role === 'Florist' || session.role === 'Administrator' ? (
                    <Button
                      component={NavLink}
                      to="/florist"
                      variant={location.pathname.startsWith('/florist') ? 'contained' : 'outlined'}
                      color={location.pathname.startsWith('/florist') ? 'primary' : 'inherit'}
                    >
                      Панель флориста
                    </Button>
                  ) : null}
                  {session.role === 'Courier' ? (
                    <Button
                      component={NavLink}
                      to="/courier"
                      variant={location.pathname.startsWith('/courier') ? 'contained' : 'outlined'}
                      color={location.pathname.startsWith('/courier') ? 'primary' : 'inherit'}
                    >
                      Панель доставщика
                    </Button>
                  ) : null}
                  <Tooltip title="Профиль">
                    <IconButton
                      component={NavLink}
                      to="/account"
                      color="inherit"
                      sx={{
                        width: 44,
                        height: 44,
                        border: '1px solid rgba(24, 38, 31, 0.08)',
                        bgcolor: alpha('#ffffff', 0.74),
                      }}
                    >
                      <UserRound size={18} />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <Button component={NavLink} to="/account" variant="contained" color="primary" startIcon={<UserRound size={16} />}>
                  Войти
                </Button>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="xl" className="page-frame">
        <Outlet />
      </Container>
    </Box>
  );
}
