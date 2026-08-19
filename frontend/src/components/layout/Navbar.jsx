import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, Heart, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { label: 'Buy', to: '/properties?listingType=SALE' },
  { label: 'Rent', to: '/properties?listingType=RENT' },
  { label: 'Projects', to: '/projects' },
  { label: 'Agents', to: '/agents' },
];

const dashboardPathFor = (role) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin';
    case 'COMPANY_ADMIN':
      return '/agency';
    case 'AGENT':
    case 'BROKER':
    case 'PROPERTY_MANAGER':
      return '/crm';
    case 'DEVELOPER':
      return '/developer';
    default:
      return '/account';
  }
};

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-ivory-50/90 backdrop-blur border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="font-serif text-2xl tracking-tight text-charcoal-900">
          Prop<span className="text-terracotta-600">Flow</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} to={link.to} className="text-sm text-charcoal-700 hover:text-terracotta-600 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-5">
          {user ? (
            <>
              {user.role === 'CUSTOMER' && (
                <Link to="/account/favorites" className="text-charcoal-600 hover:text-terracotta-600">
                  <Heart className="w-5 h-5" />
                </Link>
              )}
              <Link to="/notifications" className="text-charcoal-600 hover:text-terracotta-600">
                <Bell className="w-5 h-5" />
              </Link>
              <button
                onClick={() => navigate(dashboardPathFor(user.role))}
                className="flex items-center gap-2 text-sm text-charcoal-800"
              >
                <span className="w-8 h-8 rounded-full bg-charcoal-900 text-ivory-50 flex items-center justify-center text-xs">
                  {user.name?.charAt(0)}
                </span>
                {user.name?.split(' ')[0]}
              </button>
              <button onClick={logout} className="text-sm text-charcoal-500 hover:text-terracotta-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-charcoal-700 hover:text-terracotta-600">
                Sign in
              </Link>
              <Link to="/register-company" className="btn-primary">
                Book a Demo
              </Link>
            </>
          )}
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-stone-100 bg-ivory-50 px-6 py-6 space-y-4">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} to={link.to} className="block text-sm text-charcoal-700" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-stone-100 flex flex-col gap-3">
            {user ? (
              <>
                <button onClick={() => navigate(dashboardPathFor(user.role))} className="btn-secondary">
                  Dashboard
                </button>
                <button onClick={logout} className="text-sm text-charcoal-500">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-center">
                  Sign in
                </Link>
                <Link to="/register-company" className="btn-primary text-center">
                  Book a Demo
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
