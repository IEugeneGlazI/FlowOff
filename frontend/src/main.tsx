import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, alpha, createTheme } from '@mui/material';
import { App } from './app/App';
import { AuthProvider } from './features/auth/AuthContext';
import { CartProvider } from './features/cart/CartContext';
import './app/styles.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5c8f73',
      light: '#dcefe4',
      dark: '#315a45',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9bc9ae',
      light: '#edf7f1',
      dark: '#608b72',
    },
    text: {
      primary: '#18261f',
      secondary: '#607067',
    },
    background: {
      default: '#f5f8f5',
      paper: '#ffffff',
    },
    divider: 'rgba(24, 38, 31, 0.08)',
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: 'clamp(2.3rem, 3.6vw, 4.4rem)',
      lineHeight: 1.04,
      fontWeight: 700,
    },
    h2: {
      fontSize: 'clamp(1.5rem, 2vw, 2.2rem)',
      lineHeight: 1.15,
      fontWeight: 650,
    },
    h5: {
      fontWeight: 650,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: 0,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: 'light',
        },
        body: {
          backgroundImage: `
            radial-gradient(circle at 0% 0%, rgba(183, 223, 197, 0.65), transparent 28%),
            radial-gradient(circle at 100% 0%, rgba(232, 246, 235, 0.9), transparent 33%),
            linear-gradient(180deg, #f8fbf8 0%, #f4f7f4 54%, #f2f6f2 100%)
          `,
          color: '#18261f',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 16,
          minHeight: 42,
        },
        contained: {
          boxShadow: 'none',
          ':hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: `1px solid ${alpha('#18261f', 0.08)}`,
          boxShadow: '0 22px 60px rgba(38, 54, 45, 0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: alpha('#ffffff', 0.84),
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
