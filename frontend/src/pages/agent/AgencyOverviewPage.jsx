import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { analyticsService } from '../../services/resources';
import { PageLoader } from '../../components/ui/Primitives';

export default function AgencyOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getCompanyAnalytics()
      .then(({ data }) => setData(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  const locationChartData = data.topLocations.map((l) => ({ city: l._id || 'Unknown', properties: l.count }));

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-serif text-charcoal-900">Agency Overview</h1>

      <section className="bg-white border border-stone-100 p-6">
        <h2 className="text-lg font-serif text-charcoal-900 mb-6">Properties by City</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={locationChartData}>
            <XAxis dataKey="city" tick={{ fontSize: 11 }} stroke="#aeaaa0" />
            <YAxis tick={{ fontSize: 11 }} stroke="#aeaaa0" />
            <Tooltip />
            <Bar dataKey="properties" fill="#c06a44" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="bg-white border border-stone-100 p-6">
        <h2 className="text-lg font-serif text-charcoal-900 mb-6">Top Agents</h2>
        <div className="divide-y divide-stone-50">
          {data.agentPerformance.map((agent) => (
            <div key={agent._id} className="py-3 flex items-center justify-between">
              <p className="text-sm text-charcoal-900">{agent.user?.name}</p>
              <div className="flex gap-6 text-xs text-charcoal-500">
                <span>{agent.stats.dealsClosed} deals</span>
                <span>{agent.stats.propertiesListed} listings</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
