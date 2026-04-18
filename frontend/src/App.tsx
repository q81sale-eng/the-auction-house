import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './i18n/LanguageContext';
import { supabase } from './lib/supabase';

import { HomePage } from './pages/HomePage';
import { AuctionsPage } from './pages/AuctionsPage';
import { AuctionDetailPage } from './pages/AuctionDetailPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { MarketplaceDetailPage } from './pages/MarketplaceDetailPage';
import { VaultPage } from './pages/VaultPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAuctions } from './pages/admin/AdminAuctions';
import { AdminAuctionForm } from './pages/admin/AdminAuctionForm';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminBids } from './pages/admin/AdminBids';
import { useAuthStore } from './store/authStore';
import { fetchProfile } from './api/auth';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const { setAuth, logout } = useAuthStore();

  useEffect(() => {
    const hydrateUser = async (session: { user: any; access_token: string }) => {
      const u = session.user;
      const m = u.user_metadata ?? {};
      const profile = await fetchProfile(u.id);
      setAuth(
        {
          id: u.id,
          name: m.name || u.email || '',
          email: u.email || '',
          is_admin: profile.is_admin,
          is_verified: !!u.email_confirmed_at,
          deposit_balance: profile.deposit_balance,
          phone: m.phone,
          country: m.country,
        },
        session.access_token,
      );
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) hydrateUser(session as any);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        hydrateUser(session as any);
      } else {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuth, logout]);

  return (
    <LanguageProvider>
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
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/auctions" element={<AdminAuctions />} />
            <Route path="/admin/auctions/new" element={<AdminAuctionForm />} />
            <Route path="/admin/auctions/:id/edit" element={<AdminAuctionForm />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/bids" element={<AdminBids />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
