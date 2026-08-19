import { useEffect, useState } from 'react';
import { leadService } from '../../services/resources';
import { formatINR } from '../../utils/format';
import { PageLoader } from '../../components/ui/Primitives';

const COLUMNS = ['NEW', 'CONTACTED', 'QUALIFIED', 'VISIT', 'NEGOTIATION', 'CLOSED', 'LOST'];

const COLUMN_TONE = {
  NEW: 'border-t-charcoal-400',
  CONTACTED: 'border-t-bronze-400',
  QUALIFIED: 'border-t-olive-400',
  VISIT: 'border-t-terracotta-400',
  NEGOTIATION: 'border-t-terracotta-600',
  CLOSED: 'border-t-olive-500',
  LOST: 'border-t-charcoal-300',
};

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState(null);

  const load = () => {
    leadService
      .getPipeline()
      .then(({ data }) => setPipeline(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDrop = async (targetStatus) => {
    if (!draggedId) return;
    const sourceStatus = COLUMNS.find((col) => pipeline[col].some((l) => l._id === draggedId));
    if (sourceStatus === targetStatus) {
      setDraggedId(null);
      return;
    }

    // Optimistic update
    const lead = pipeline[sourceStatus].find((l) => l._id === draggedId);
    setPipeline((prev) => ({
      ...prev,
      [sourceStatus]: prev[sourceStatus].filter((l) => l._id !== draggedId),
      [targetStatus]: [{ ...lead, status: targetStatus }, ...prev[targetStatus]],
    }));
    setDraggedId(null);

    try {
      await leadService.updateStatus(draggedId, targetStatus);
    } catch (err) {
      load(); // revert on failure by reloading from source of truth
    }
  };

  if (loading) return <PageLoader />;
  if (!pipeline) return null;

  return (
    <div>
      <h1 className="text-2xl font-serif text-charcoal-900 mb-6">Lead Pipeline</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(status)}
            className={`min-w-[280px] w-[280px] bg-white border-t-4 ${COLUMN_TONE[status]} shadow-soft`}
          >
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-charcoal-600">{status.replace('_', ' ')}</p>
              <span className="text-xs text-charcoal-400">{pipeline[status].length}</span>
            </div>
            <div className="p-3 space-y-3 min-h-[200px] max-h-[65vh] overflow-y-auto">
              {pipeline[status].map((lead) => (
                <div
                  key={lead._id}
                  draggable
                  onDragStart={() => setDraggedId(lead._id)}
                  className="bg-ivory-50 border border-stone-100 p-3 cursor-grab active:cursor-grabbing hover:border-terracotta-300 transition-colors"
                >
                  <p className="text-sm font-medium text-charcoal-900 mb-1">{lead.name}</p>
                  <p className="text-xs text-charcoal-500 mb-2">{lead.phone}</p>
                  <div className="flex items-center justify-between">
                    {lead.budgetMax && (
                      <span className="text-xs text-terracotta-600">{formatINR(lead.budgetMax)}</span>
                    )}
                    {lead.assignedAgent && (
                      <span className="w-6 h-6 rounded-full bg-charcoal-900 text-white text-[10px] flex items-center justify-center">
                        {lead.assignedAgent.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
