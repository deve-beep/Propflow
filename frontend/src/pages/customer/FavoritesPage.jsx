import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { propertyService } from '../../services/resources';
import { PropertyCard } from '../../components/property/PropertyCard';
import { EmptyState, PageLoader } from '../../components/ui/Primitives';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    propertyService
      .listFavorites()
      .then(({ data }) => setFavorites(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleFavorite = async (id) => {
    await propertyService.toggleFavorite(id);
    setFavorites((prev) => prev.filter((p) => p._id !== id));
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-serif text-charcoal-900 mb-6">Saved Properties</h1>
      {favorites.length === 0 ? (
        <EmptyState icon={Heart} title="No saved properties" description="Browse listings and tap the heart icon to save your favorites here." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {favorites.map((p) => (
            <PropertyCard key={p._id} property={p} onToggleFavorite={handleToggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}
