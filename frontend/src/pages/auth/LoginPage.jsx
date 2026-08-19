import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Primitives';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-ivory-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-serif text-2xl text-charcoal-900">
            Prop<span className="text-terracotta-600">Flow</span>
          </Link>
          <h1 className="text-2xl font-serif mt-6 text-charcoal-900">Welcome back</h1>
          <p className="text-sm text-charcoal-500 mt-1">Sign in to continue to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8 shadow-card border border-stone-100">
          {error && <p className="text-sm text-terracotta-700 bg-terracotta-400/10 px-4 py-3">{error}</p>}

          <div>
            <label className="text-xs text-charcoal-600 mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-xs text-charcoal-600 mb-1 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-charcoal-500 hover:text-terracotta-600">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-charcoal-500 mt-6">
          New here?{' '}
          <Link to="/register" className="text-terracotta-600 hover:underline">
            Create a customer account
          </Link>{' '}
          or{' '}
          <Link to="/register-company" className="text-terracotta-600 hover:underline">
            register your agency
          </Link>
        </p>
      </div>
    </div>
  );
}
