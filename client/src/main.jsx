import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <App />
            <Toaster
              position="top-center"
              gutter={10}
              toastOptions={{
                duration: 3200,
                style: {
                  background: '#14100E',
                  color: '#FDFBF7',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '12px 16px',
                  boxShadow: '0 18px 40px -18px rgba(20, 16, 14, 0.5)',
                },
                success: { iconTheme: { primary: '#F97316', secondary: '#14100E' } },
                error: { iconTheme: { primary: '#E11D48', secondary: '#FDFBF7' } },
              }}
            />
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
