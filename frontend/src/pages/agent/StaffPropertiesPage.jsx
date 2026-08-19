import { useEffect, useState } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { propertyService } from '../../services/resources';
import { formatINR } from '../../utils/format';
import { Badge, PageLoader, EmptyState, Button } from '../../components/ui/Primitives';

const STATUS_TONE = { DRAFT: 'default', PUBLISHED: 'success', UNPUBLISHED: 'warning', SOLD: 'dark', RENTED: 'dark' };

export default function StaffPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    propertyService
      .listStaff()
      .then(({ data }) => setProperties(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id, status) => {
    setProperties((prev) => prev.map((p) => (p._id === id ? { ...p, status } : p)));
    await propertyService.updateStatus(id, status);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-charcoal-900">My Listings</h1>
        <Button>
          <Plus className="w-4 h-4" /> New Property
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : properties.length === 0 ? (
        <EmptyState icon={Building2} title="No listings yet" description="Create your first property listing to get started." />
      ) : (
        <div className="bg-white border border-stone-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs text-charcoal-500 uppercase tracking-wide">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Views</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p._id} className="border-b border-stone-50 hover:bg-ivory-100">
                  <td className="px-5 py-3 text-charcoal-900">{p.title}</td>
                  <td className="px-5 py-3 text-charcoal-600">{p.location?.city}</td>
                  <td className="px-5 py-3 text-charcoal-600">{formatINR(p.price)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-charcoal-600">{p.viewsCount}</td>
                  <td className="px-5 py-3">
                    {p.status === 'PUBLISHED' ? (
                      <button onClick={() => handleStatusChange(p._id, 'UNPUBLISHED')} className="text-xs text-charcoal-500 hover:text-terracotta-600">
                        Unpublish
                      </button>
                    ) : (
                      <button onClick={() => handleStatusChange(p._id, 'PUBLISHED')} className="text-xs text-terracotta-600 hover:underline">
                        Publish
                      </button>
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
