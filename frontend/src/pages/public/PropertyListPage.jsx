import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, MapPin, Home } from 'lucide-react';
import { propertyService } from '../../services/resources';
import { PropertyCard } from '../../components/property/PropertyCard';
import { PropertyFilters } from '../../components/property/PropertyFilters';
import { EmptyState, PageLoader } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';

export default function PropertyListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [compareIds, setCompareIds] = useState([]);

  const filters = Object.fromEntries(searchParams.entries());

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await propertyService.list(filters);
      setProperties(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const updateFilters = (next) => {
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== '' && v !== undefined));
    setSearchParams(clean);
  };

  const handleToggleFavorite = async (id) => {
    if (!user) return;
    await propertyService.toggleFavorite(id);
    setProperties((prev) => prev.map((p) => (p._id === id ? { ...p, isFavorited: !p.isFavorited } : p)));
  };

  const toggleCompare = (id) => {
    setCompareIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 4 ? [...prev, id] : prev));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-label mb-2">Property Discovery</p>
          <h1 className="text-3xl font-serif text-charcoal-900">
            {meta?.total ?? '—'} properties found
          </h1>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary lg:hidden">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
          <div className="sticky top-28 bg-white p-6 border border-stone-100">
            <PropertyFilters filters={filters} onChange={updateFilters} />
          </div>
        </aside>

        <div className="lg:col-span-3">
          {loading ? (
            <PageLoader />
          ) : properties.length === 0 ? (
            <EmptyState
              icon={Home}
              title="No properties match your search"
              description="Try adjusting your filters or exploring a different city."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property._id}
                  property={property}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleCompare={toggleCompare}
                  isCompareSelected={compareIds.includes(property._id)}
                />
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateFilters({ ...filters, page: p })}
                  className={`w-9 h-9 text-xs border ${meta.page === p ? 'bg-charcoal-900 text-white border-charcoal-900' : 'border-stone-200 text-charcoal-600'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {compareIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal-950 text-white px-6 py-3 rounded-full shadow-lifted flex items-center gap-4 z-50">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{compareIds.length} properties selected</span>
          <a href={`/compare?ids=${compareIds.join(',')}`} className="text-sm text-terracotta-400 underline">
            Compare now
          </a>
        </div>
      )}
    </div>
  );
}
