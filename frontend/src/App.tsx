import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLanguage } from './i18n/useLanguage';

import { HomePage } from './pages/HomePage';
import { AuctionsPage } from './pages/AuctionsPage';
import { AuctionDetailPage } from './pages/AuctionDetailPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { MarketplaceDetailPage } from './pages/MarketplaceDetailPage';
import { VaultPage } from './pages/VaultPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAuctions } from './pages/admin/AdminAuctions';
import { AdminWatches } from './pages/admin/AdminWatches';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminValuations } from './pages/admin/AdminValuations';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const lang = useLanguage(s => s.lang);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auctions" element={<AuctionsPage />} />
          <Route path="/auctions/:slug" element={<AuctionDetailPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:slug" element={<MarketplaceDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated */}
          <Route path="/vault" element={<PrivateRoute><VaultPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/auctions" element={<AdminAuctions />} />
          <Route path="/admin/watches" element={<AdminWatches />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/valuations" element={<AdminValuations />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

