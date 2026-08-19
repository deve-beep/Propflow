import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Primitives';

export default function RegisterCompanyPage() {
  const [form, setForm] = useState({ companyName: '', name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerCompany } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerCompany(form);
      navigate('/agency', { replace: true });
    } catch (err) {
      setError(err.response?.data?.details?.[0]?.message || err.response?.data?.message || 'Registration failed.');
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
          <h1 className="text-2xl font-serif mt-6 text-charcoal-900">Set up your agency</h1>
          <p className="text-sm text-charcoal-500 mt-1">Start your 14-day trial — no card required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8 shadow-card border border-stone-100">
          {error && <p className="text-sm text-terracotta-700 bg-terracotta-400/10 px-4 py-3">{error}</p>}

          <div>
            <label className="text-xs text-charcoal-600 mb-1 block">Company name</label>
            <input required value={form.companyName} onChange={update('companyName')} className="input-field" placeholder="Horizon Realty Group" />
          </div>
          <div>
            <label className="text-xs text-charcoal-600 mb-1 block">Your name</label>
            <input required value={form.name} onChange={update('name')} className="input-field" placeholder="Rajiv Malhotra" />
          </div>
          <div>
            <label className="text-xs text-charcoal-600 mb-1 block">Work email</label>
            <input type="email" required value={form.email} onChange={update('email')} className="input-field" placeholder="you@agency.com" />
          </div>
          <div>
            <label className="text-xs text-charcoal-600 mb-1 block">Phone</label>
            <input value={form.phone} onChange={update('phone')} className="input-field" placeholder="+91-9876500000" />
          </div>
          <div>
            <label className="text-xs text-charcoal-600 mb-1 block">Password</label>
            <input type="password" required minLength={8} value={form.password} onChange={update('password')} className="input-field" placeholder="At least 8 characters" />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Setting up...' : 'Start Free Trial'}
          </Button>
        </form>

        <p className="text-center text-sm text-charcoal-500 mt-6">
          Looking to buy or rent instead?{' '}
          <Link to="/register" className="text-terracotta-600 hover:underline">
            Create a customer account
          </Link>
        </p>
      </div>
    </div>
  );
}
