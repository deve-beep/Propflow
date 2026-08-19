import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { PageLoader } from './components/ui/Primitives';

// Public pages
import LandingPage from './pages/public/LandingPage';
const PropertyListPage = lazy(() => import('./pages/public/PropertyListPage'));
const PropertyDetailPage = lazy(() => import('./pages/public/PropertyDetailPage'));
const PropertyMapPage = lazy(() => import('./pages/public/PropertyMapPage'));
const ComparePage = lazy(() => import('./pages/public/ComparePage'));
const AgentsPage = lazy(() => import('./pages/public/AgentsPage'));
const NotificationsPage = lazy(() => import('./pages/public/NotificationsPage'));
const MessagesPage = lazy(() => import('./pages/public/MessagesPage'));

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const RegisterCompanyPage = lazy(() => import('./pages/auth/RegisterCompanyPage'));

// Agent/CRM pages
const CrmDashboardPage = lazy(() => import('./pages/agent/CrmDashboardPage'));
const LeadsPage = lazy(() => import('./pages/agent/LeadsPage'));
const PipelinePage = lazy(() => import('./pages/agent/PipelinePage'));
const StaffPropertiesPage = lazy(() => import('./pages/agent/StaffPropertiesPage'));
const AppointmentsPage = lazy(() => import('./pages/agent/AppointmentsPage'));
const DealsPage = lazy(() => import('./pages/agent/DealsPage'));
const AgencyOverviewPage = lazy(() => import('./pages/agent/AgencyOverviewPage'));

// Customer pages
const CustomerDashboardPage = lazy(() => import('./pages/customer/CustomerDashboardPage'));
const FavoritesPage = lazy(() => import('./pages/customer/FavoritesPage'));

// Admin / Developer pages
const PlatformOverviewPage = lazy(() => import('./pages/admin/PlatformOverviewPage'));
const DeveloperProjectsPage = lazy(() => import('./pages/developer/DeveloperProjectsPage'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/properties" element={<PropertyListPage />} />
                <Route path="/properties/:idOrSlug" element={<PropertyDetailPage />} />
                <Route path="/map" element={<PropertyMapPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/register-company" element={<RegisterCompanyPage />} />

                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route
                element={
                  <ProtectedRoute roles={['AGENT', 'BROKER', 'PROPERTY_MANAGER', 'COMPANY_ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/crm" element={<CrmDashboardPage />} />
                <Route path="/crm/leads" element={<LeadsPage />} />
                <Route path="/crm/pipeline" element={<PipelinePage />} />
                <Route path="/crm/properties" element={<StaffPropertiesPage />} />
                <Route path="/crm/appointments" element={<AppointmentsPage />} />
                <Route path="/crm/deals" element={<DealsPage />} />
                <Route path="/crm/messages" element={<MessagesPage />} />
                <Route path="/agency" element={<AgencyOverviewPage />} />
                <Route path="/agency/analytics" element={<AgencyOverviewPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute roles={['CUSTOMER']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/account" element={<CustomerDashboardPage />} />
                <Route path="/account/favorites" element={<FavoritesPage />} />
                <Route path="/account/appointments" element={<AppointmentsPage />} />
                <Route path="/account/messages" element={<MessagesPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin" element={<PlatformOverviewPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute roles={['DEVELOPER']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/developer" element={<DeveloperProjectsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
