import React, { useEffect, Component } from 'react';
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
import { VaultDetailPage } from './pages/VaultDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAuctions } from './pages/admin/AdminAuctions';
import { AdminAuctionForm } from './pages/admin/AdminAuctionForm';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminBids } from './pages/admin/AdminBids';
import { AdminValuationRequests } from './pages/admin/AdminValuationRequests';
import { AdminListings } from './pages/admin/AdminListings';
import { AdminListingForm } from './pages/admin/AdminListingForm';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminCatalog } from './pages/admin/AdminCatalog';
import { AdminCatalogForm } from './pages/admin/AdminCatalogForm';
import { AdminCatalogImport } from './pages/admin/AdminCatalogImport';
import { AdminWatchRequests } from './pages/admin/AdminWatchRequests';
import { AdminWatchReference } from './pages/admin/AdminWatchReference';
import { AdminPriceIndex } from './pages/admin/AdminPriceIndex';
import { PriceIndexPage } from './pages/PriceIndexPage';
import { PriceIndexGalleryPage } from './pages/PriceIndexGalleryPage';
import { WatchReferencePage } from './pages/WatchReferencePage';
import { CatalogPage } from './pages/CatalogPage';
import { CatalogDetailPage } from './pages/CatalogDetailPage';
import { PavePage } from './pages/PavePage';
import { PaveRegentPage } from './pages/PaveRegentPage';
import { PaveArtisanaPage } from './pages/PaveArtisanaPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AuthenticationPage } from './pages/AuthenticationPage';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { useAuthStore } from './store/authStore';
import { fetchProfile } from './api/auth';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// ── Error boundary ───────────────────────────────────────────────────────────
interface EBState { hasError: boolean; message: string }
class ErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { hasError: true, message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div>
            <p style={{ color: '#d4af37', fontFamily: 'Georgia, serif', fontSize: '1.5rem', marginBottom: '1rem' }}>
              Something went wrong
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '400px' }}>
              {this.state.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#d4af37', color: '#0a0a0a', border: 'none', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Private route ────────────────────────────────────────────────────────────
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// ── App ──────────────────────────────────────────────────────────────────────
function App() {
  const setAuth = useAuthStore(s => s.setAuth);
  const logout  = useAuthStore(s => s.logout);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const hydrateUser = async (session: any) => {
      try {
        const u = session.user;
        const m = u?.user_metadata ?? {};
        const profile = await fetchProfile(u.id, u.email ?? undefined);
        // Never downgrade is_admin from the already-stored value
        const currentUser = useAuthStore.getState().user;
        const is_admin = profile.is_admin || (currentUser?.is_admin ?? false);
        setAuth(
          {
            id: u.id,
            name: m.name || u.email || '',
            email: u.email || '',
            is_admin,
            is_verified: !!u.email_confirmed_at,
            deposit_balance: profile.deposit_balance,
            phone: m.phone,
            country: m.country,
            bio: m.bio,
          },
          session.access_token,
          session.refresh_token,
        );
      } catch (e) {
        console.warn('[Auth] hydrateUser failed:', e);
      }
    };

    // Restore any existing session on mount
    supabase.auth.getSession()
      .then(({ data: { session } }) => { if (session?.user) hydrateUser(session); })
      .catch((e) => console.warn('[Auth] getSession failed:', e));

    // Subscribe to future auth changes — only logout on explicit SIGNED_OUT
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          hydrateUser(session);
        } else if (_event === 'SIGNED_OUT') {
          logout();
        }
      });
      subscription = data.subscription;
    } catch (e) {
      console.warn('[Auth] onAuthStateChange failed:', e);
    }

    return () => { subscription?.unsubscribe(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auctions" element={<AuctionsPage />} />
            <Route path="/auctions/:slug" element={<AuctionDetailPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:slug" element={<MarketplaceDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/authentication" element={<AuthenticationPage />} />
            <Route path="/price-index" element={<PriceIndexPage />} />
            <Route path="/price-index/gallery" element={<PriceIndexGalleryPage />} />
            <Route path="/watches" element={<WatchReferencePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/:slug" element={<CatalogDetailPage />} />
            <Route path="/pave" element={<PavePage />} />
            <Route path="/pave/regent" element={<PaveRegentPage />} />
            <Route path="/pave/artisana" element={<PaveArtisanaPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated */}
            <Route path="/vault" element={<PrivateRoute><VaultPage /></PrivateRoute>} />
            <Route path="/vault/:id" element={<PrivateRoute><VaultDetailPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/auctions" element={<AdminAuctions />} />
            <Route path="/admin/auctions/new" element={<AdminAuctionForm />} />
            <Route path="/admin/auctions/:id/edit" element={<AdminAuctionForm />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/bids" element={<AdminBids />} />
            <Route path="/admin/valuation-requests" element={<AdminValuationRequests />} />
            <Route path="/admin/listings" element={<AdminListings />} />
            <Route path="/admin/listings/new" element={<AdminListingForm />} />
            <Route path="/admin/listings/:id/edit" element={<AdminListingForm />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/catalog" element={<AdminCatalog />} />
            <Route path="/admin/catalog/import" element={<AdminCatalogImport />} />
            <Route path="/admin/watch-requests" element={<AdminWatchRequests />} />
            <Route path="/admin/watch-reference" element={<AdminWatchReference />} />
            <Route path="/admin/price-index" element={<AdminPriceIndex />} />
            <Route path="/admin/catalog/new" element={<AdminCatalogForm />} />
            <Route path="/admin/catalog/:id/edit" element={<AdminCatalogForm />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default function Root() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
