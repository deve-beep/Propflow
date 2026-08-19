import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { analyticsService } from '../../services/resources';
import { formatINR } from '../../utils/format';
import { PageLoader } from '../../components/ui/Primitives';

const COLORS = ['#c06a44', '#8b8a5f', '#a68a5b', '#867f72', '#d38361'];

const StatCard = ({ label, value }) => (
  <div className="bg-white border border-stone-100 p-6">
    <p className="text-xs text-charcoal-500 uppercase tracking-wide mb-2">{label}</p>
    <p className="text-2xl font-serif text-charcoal-900">{value}</p>
  </div>
);

export default function PlatformOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getPlatformAnalytics()
      .then(({ data }) => setData(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  const { totals, usersByRole } = data;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-serif text-charcoal-900">Platform Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Companies" value={totals.companies} />
        <StatCard label="Total Users" value={totals.users} />
        <StatCard label="Properties" value={totals.properties} />
        <StatCard label="Agents" value={totals.agents} />
        <StatCard label="Leads" value={totals.leads} />
        <StatCard label="Deals Closed" value={totals.dealsClosed} />
        <StatCard label="Total Revenue" value={formatINR(totals.totalRevenue)} />
      </div>

      <section className="bg-white border border-stone-100 p-6">
        <h2 className="text-lg font-serif text-charcoal-900 mb-6">Users by Role</h2>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={usersByRole} dataKey="count" nameKey="_id" outerRadius={90}>
              {usersByRole.map((entry, i) => (
                <Cell key={entry._id} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
