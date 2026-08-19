import { useEffect, useState } from 'react';
import { Users, Calendar, Handshake, TrendingUp } from 'lucide-react';
import { analyticsService } from '../../services/resources';
import { formatINR } from '../../utils/format';
import { PageLoader } from '../../components/ui/Primitives';

const StatCard = ({ label, value, icon: Icon, tone = 'text-charcoal-900' }) => (
  <div className="bg-white border border-stone-100 p-6">
    <div className="flex items-center justify-between mb-4">
      <p className="text-xs text-charcoal-500 uppercase tracking-wide">{label}</p>
      <Icon className="w-4 h-4 text-charcoal-300" />
    </div>
    <p className={`text-2xl font-serif ${tone}`}>{value}</p>
  </div>
);

export default function CrmDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getCrmDashboard()
      .then(({ data }) => setStats(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!stats) return null;

  return (
    <div>
      <h1 className="text-2xl font-serif text-charcoal-900 mb-8">CRM Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Leads" value={stats.totalLeads} icon={Users} />
        <StatCard label="New Leads" value={stats.newLeads} icon={Users} />
        <StatCard label="Qualified" value={stats.qualifiedLeads} icon={Users} />
        <StatCard label="Property Visits" value={stats.propertyVisits} icon={Calendar} />
        <StatCard label="Active Deals" value={stats.activeDeals} icon={Handshake} />
        <StatCard label="Closed Deals" value={stats.closedDeals} icon={Handshake} />
        <StatCard label="Conversion Rate" value={`${stats.conversionRate}%`} icon={TrendingUp} tone="text-terracotta-600" />
        <StatCard label="Revenue Generated" value={formatINR(stats.revenueGenerated)} icon={TrendingUp} tone="text-terracotta-600" />
      </div>

      <div className="bg-sand-100/40 p-6 border border-sand-200">
        <p className="text-sm text-charcoal-600">
          Expected pipeline value: <span className="font-serif text-lg text-charcoal-900">{formatINR(stats.expectedRevenue)}</span>
        </p>
      </div>
    </div>
  );
}
