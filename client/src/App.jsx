import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CityProvider } from './context/CityContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ui/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CityProvider>
          <div className="d-flex flex-column min-vh-100" style={{ background: 'var(--bg-main)' }}>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#121624',
                  color: '#fff',
                  border: '1px solid #242c44',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                },
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#121624',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#121624',
                  },
                },
              }}
            />
            <Navbar />
            <main className="flex-grow-1">
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </CityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
