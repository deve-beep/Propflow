import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { propertyService } from '../../services/resources';
import { formatINR, formatArea, coverImage } from '../../utils/format';
import { PageLoader } from '../../components/ui/Primitives';

const ROWS = [
  { label: 'Price', get: (p) => formatINR(p.price) },
  { label: 'Type', get: (p) => p.propertyType?.replace(/_/g, ' ') },
  { label: 'Bedrooms', get: (p) => p.bedrooms || '—' },
  { label: 'Bathrooms', get: (p) => p.bathrooms || '—' },
  { label: 'Area', get: (p) => formatArea(p.area) },
  { label: 'Furnishing', get: (p) => p.furnishing?.replace(/_/g, ' ') },
  { label: 'City', get: (p) => p.location?.city },
  { label: 'Locality', get: (p) => p.location?.locality },
  { label: 'Expected Rental Yield', get: (p) => (p.investment?.expectedRentalYield ? `${p.investment.expectedRentalYield}%` : '—') },
  { label: 'Expected Appreciation', get: (p) => (p.investment?.expectedAppreciation ? `${p.investment.expectedAppreciation}%/yr` : '—') },
];

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',') || [];
    if (ids.length < 2) {
      setLoading(false);
      return;
    }
    propertyService
      .compare(ids)
      .then(({ data }) => setProperties(data.data))
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) return <PageLoader />;

  if (properties.length < 2) {
    return <div className="text-center py-20 text-charcoal-500">Select at least 2 properties to compare.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 overflow-x-auto">
      <h1 className="text-2xl font-serif text-charcoal-900 mb-8">Compare Properties</h1>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="w-40"></th>
            {properties.map((p) => (
              <th key={p._id} className="p-4 text-left align-top min-w-[220px]">
                {coverImage(p) && <img src={coverImage(p)} alt={p.title} className="w-full h-32 object-cover mb-3" />}
                <p className="font-serif text-charcoal-900">{p.title}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-t border-stone-100">
              <td className="p-4 text-xs uppercase tracking-wide text-charcoal-500">{row.label}</td>
              {properties.map((p) => (
                <td key={p._id} className="p-4 text-charcoal-700">{row.get(p)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
