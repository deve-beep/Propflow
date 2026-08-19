import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { agentService } from '../../services/resources';
import { PageLoader } from '../../components/ui/Primitives';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agentService
      .list()
      .then(({ data }) => setAgents(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <p className="section-label mb-2">Our Team</p>
      <h1 className="text-3xl font-serif text-charcoal-900 mb-10">Meet Our Agents</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div key={agent._id} className="bg-white border border-stone-100 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-charcoal-900 text-white flex items-center justify-center font-serif text-xl mx-auto mb-4">
              {agent.user?.name?.charAt(0)}
            </div>
            <p className="font-serif text-lg text-charcoal-900 mb-1">{agent.user?.name}</p>
            <p className="text-xs text-charcoal-500 mb-3">{agent.specialization?.join(', ')}</p>
            <div className="flex items-center justify-center gap-1 text-xs text-bronze-500 mb-4">
              <Star className="w-3.5 h-3.5 fill-bronze-400 text-bronze-400" />
              {agent.rating?.average?.toFixed(1)} ({agent.rating?.count})
            </div>
            <div className="flex justify-center gap-6 text-xs text-charcoal-500 border-t border-stone-100 pt-4">
              <span>{agent.stats?.propertiesListed || 0} Listings</span>
              <span>{agent.stats?.dealsClosed || 0} Closed</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
