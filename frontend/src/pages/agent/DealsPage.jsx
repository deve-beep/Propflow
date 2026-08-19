import { useEffect, useState } from 'react';
import { Handshake } from 'lucide-react';
import { dealService } from '../../services/resources';
import { formatINR } from '../../utils/format';
import { Badge, PageLoader, EmptyState } from '../../components/ui/Primitives';

const STAGE_TONE = { OPEN: 'default', WON: 'success', LOST: 'danger' };

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    dealService
      .list()
      .then(({ data }) => setDeals(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleStage = async (id, stage) => {
    setDeals((prev) => prev.map((d) => (d._id === id ? { ...d, stage } : d)));
    await dealService.updateStage(id, { stage });
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-serif text-charcoal-900 mb-6">Deals</h1>

      {deals.length === 0 ? (
        <EmptyState icon={Handshake} title="No deals yet" description="Deals created from qualified leads will appear here." />
      ) : (
        <div className="bg-white border border-stone-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs text-charcoal-500 uppercase tracking-wide">
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Value</th>
                <th className="px-5 py-3">Commission</th>
                <th className="px-5 py-3">Stage</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal._id} className="border-b border-stone-50 hover:bg-ivory-100">
                  <td className="px-5 py-3 text-charcoal-900">{deal.property?.title}</td>
                  <td className="px-5 py-3 text-charcoal-600">{deal.customer?.name}</td>
                  <td className="px-5 py-3 text-charcoal-600">{formatINR(deal.dealValue)}</td>
                  <td className="px-5 py-3 text-charcoal-600">{formatINR(deal.commissionAmount)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={STAGE_TONE[deal.stage]}>{deal.stage}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    {deal.stage === 'OPEN' && (
                      <div className="flex gap-3">
                        <button onClick={() => handleStage(deal._id, 'WON')} className="text-xs text-olive-600 underline">
                          Mark Won
                        </button>
                        <button onClick={() => handleStage(deal._id, 'LOST')} className="text-xs text-terracotta-600 underline">
                          Mark Lost
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
