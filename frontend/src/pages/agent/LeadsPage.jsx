import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { leadService } from '../../services/resources';
import { formatDate } from '../../utils/format';
import { Badge, PageLoader, EmptyState } from '../../components/ui/Primitives';
import { Users } from 'lucide-react';

const STATUS_TONE = {
  NEW: 'default',
  CONTACTED: 'default',
  QUALIFIED: 'warning',
  VISIT: 'warning',
  NEGOTIATION: 'warning',
  CLOSED: 'success',
  LOST: 'danger',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    setLoading(true);
    leadService
      .list({ status: status || undefined, q: q || undefined })
      .then(({ data }) => setLeads(data.data))
      .finally(() => setLoading(false));
  }, [status, q]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-charcoal-900">Leads</h1>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="input-field pl-9"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field max-w-[180px]">
          <option value="">All statuses</option>
          {['NEW', 'CONTACTED', 'QUALIFIED', 'VISIT', 'NEGOTIATION', 'CLOSED', 'LOST'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <PageLoader />
      ) : leads.length === 0 ? (
        <EmptyState icon={Users} title="No leads found" description="Try adjusting your filters." />
      ) : (
        <div className="bg-white border border-stone-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs text-charcoal-500 uppercase tracking-wide">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Score</th>
                <th className="px-5 py-3">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id} className="border-b border-stone-50 hover:bg-ivory-100">
                  <td className="px-5 py-3">
                    <Link to={`/crm/leads/${lead._id}`} className="text-charcoal-900 hover:text-terracotta-600">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-charcoal-600">{lead.phone}</td>
                  <td className="px-5 py-3 text-charcoal-600">{lead.source}</td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[lead.status]}>{lead.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-charcoal-600">{lead.score}</td>
                  <td className="px-5 py-3 text-charcoal-600">{lead.followUpDate ? formatDate(lead.followUpDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
