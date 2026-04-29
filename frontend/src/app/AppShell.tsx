import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Flower2, Package2, ShoppingBag, UserRound } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useCart } from '../features/cart/CartContext';

export function AppShell() {
  const location = useLocation();
  const { session, logout } = useAuth();
  const { cart } = useCart();

  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const storefrontPath = location.pathname.startsWith('/flowers')
    ? '/flowers'
    : location.pathname.startsWith('/gifts')
      ? '/gifts'
      : '/bouquets';

  function getCatalogButtonVariant(path: string) {
    return storefrontPath === path ? 'contained' : 'text';
  }

  return (
    <Box className="app-shell">
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          backdropFilter: 'blur(18px)',
          backgroundColor: 'rgba(247, 247, 251, 0.9)',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{ minHeight: 84, gap: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 42, height: 42 }}>
                <Flower2 size={18} />
              </Avatar>
              <Box>
                <Typography
                  component={NavLink}
                  to="/bouquets"
                  variant="h6"
                  sx={{ color: 'text.primary', textDecoration: 'none' }}
                >
                  Flowoff
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Цветочный магазин с доставкой, бронью и онлайн-заказами
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} aria-label="Основная навигация" sx={{ flexWrap: 'wrap' }}>
              <Button component={NavLink} to="/bouquets" variant={getCatalogButtonVariant('/bouquets')} color="inherit">
                Букеты
              </Button>
              <Button component={NavLink} to="/flowers" variant={getCatalogButtonVariant('/flowers')} color="inherit">
                Цветы
              </Button>
              <Button component={NavLink} to="/gifts" variant={getCatalogButtonVariant('/gifts')} color="inherit">
                Подарки
              </Button>
              <Button
                component={NavLink}
                to="/orders"
                variant="text"
                color="inherit"
                startIcon={<Package2 size={16} />}
              >
                Заказы
              </Button>
              <Button
                component={NavLink}
                to="/cart"
                variant="outlined"
                color="inherit"
                startIcon={
                  <Badge badgeContent={cartCount} color="secondary">
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
                  <Stack spacing={0} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {session.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {session.role}
                    </Typography>
                  </Stack>
                  <Button type="button" variant="text" color="inherit" onClick={logout}>
                    Выйти
                  </Button>
                </>
              ) : (
                <Button component={NavLink} to="/account" variant="contained" startIcon={<UserRound size={16} />}>
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
