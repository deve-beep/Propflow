import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Calendar, Handshake, BarChart3,
  MessageSquare, Bell, Settings, LogOut, Heart, FileText, Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_BY_ROLE = {
  CRM: [
    { label: 'Dashboard', to: '/crm', icon: LayoutDashboard, end: true },
    { label: 'Properties', to: '/crm/properties', icon: Building2 },
    { label: 'Leads', to: '/crm/leads', icon: Users },
    { label: 'Pipeline', to: '/crm/pipeline', icon: Layers },
    { label: 'Appointments', to: '/crm/appointments', icon: Calendar },
    { label: 'Deals', to: '/crm/deals', icon: Handshake },
    { label: 'Messages', to: '/crm/messages', icon: MessageSquare },
    { label: 'Reports', to: '/crm/reports', icon: FileText },
  ],
  AGENCY: [
    { label: 'Overview', to: '/agency', icon: LayoutDashboard, end: true },
    { label: 'Analytics', to: '/agency/analytics', icon: BarChart3 },
    { label: 'Staff', to: '/agency/staff', icon: Users },
    { label: 'Properties', to: '/crm/properties', icon: Building2 },
    { label: 'Settings', to: '/agency/settings', icon: Settings },
  ],
  ADMIN: [
    { label: 'Platform Overview', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Companies', to: '/admin/companies', icon: Building2 },
    { label: 'Users', to: '/admin/users', icon: Users },
  ],
  DEVELOPER: [
    { label: 'Projects', to: '/developer', icon: LayoutDashboard, end: true },
    { label: 'Units', to: '/developer/units', icon: Layers },
  ],
  CUSTOMER: [
    { label: 'Overview', to: '/account', icon: LayoutDashboard, end: true },
    { label: 'Favorites', to: '/account/favorites', icon: Heart },
    { label: 'Appointments', to: '/account/appointments', icon: Calendar },
    { label: 'Messages', to: '/account/messages', icon: MessageSquare },
  ],
};

const sectionForRole = (role) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'ADMIN';
    case 'COMPANY_ADMIN':
      return 'AGENCY';
    case 'AGENT':
    case 'BROKER':
    case 'PROPERTY_MANAGER':
      return 'CRM';
    case 'DEVELOPER':
      return 'DEVELOPER';
    default:
      return 'CUSTOMER';
  }
};

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV_BY_ROLE[sectionForRole(user?.role)] || [];

  return (
    <div className="min-h-screen flex bg-ivory-100">
      <aside className="w-64 shrink-0 bg-charcoal-950 text-ivory-100 flex flex-col">
        <div className="px-6 py-6 border-b border-charcoal-800">
          <button onClick={() => navigate('/')} className="font-serif text-xl">
            Prop<span className="text-terracotta-400">Flow</span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {links.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                  isActive ? 'bg-terracotta-600 text-white' : 'text-charcoal-300 hover:bg-charcoal-800'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-charcoal-800 space-y-1">
          <NavLink
            to="/notifications"
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-charcoal-300 hover:bg-charcoal-800"
          >
            <Bell className="w-4 h-4" /> Notifications
          </NavLink>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-charcoal-300 hover:bg-charcoal-800 w-full"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-stone-100 flex items-center justify-between px-8">
          <p className="text-sm text-charcoal-500">
            Welcome back, <span className="text-charcoal-900 font-medium">{user?.name}</span>
          </p>
          <span className="text-xs px-3 py-1 rounded-full bg-stone-100 text-charcoal-600">{user?.role?.replace('_', ' ')}</span>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
