import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { propertyService } from '../../services/resources';
import { formatINR, coverImage } from '../../utils/format';
import { PageLoader } from '../../components/ui/Primitives';

// Leaflet's default marker icons reference bundler-relative paths that break
// under Vite; point them at a CDN so pins actually render.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function PropertyMapPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertyService
      .getMap({})
      .then(({ data }) => setProperties(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const center = properties.length
    ? [properties[0].location.geo.coordinates[1], properties[0].location.geo.coordinates[0]]
    : [30.7333, 76.7794]; // Chandigarh fallback

  return (
    <div className="h-[calc(100vh-80px)]">
      <MapContainer center={center} zoom={11} className="w-full h-full" scrollWheelZoom>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {properties.map((p) => {
          const [lng, lat] = p.location?.geo?.coordinates || [];
          if (!lat || !lng) return null;
          return (
            <Marker key={p._id} position={[lat, lng]} icon={markerIcon}>
              <Popup>
                <div className="w-48">
                  {coverImage(p) && (
                    <img src={coverImage(p)} alt={p.title} className="w-full h-24 object-cover mb-2" />
                  )}
                  <p className="text-sm font-medium mb-1">{p.title}</p>
                  <p className="text-terracotta-600 text-sm mb-2">{formatINR(p.price)}</p>
                  <Link to={`/properties/${p.slug || p._id}`} className="text-xs text-charcoal-600 underline">
                    View details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
