import { Link } from 'react-router-dom';
import { Heart, BedDouble, Bath, Ruler, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatINR, formatArea, coverImage } from '../../utils/format';
import { Badge } from '../ui/Primitives';

export const PropertyCard = ({ property, onToggleFavorite, isCompareSelected, onToggleCompare }) => {
  const image = coverImage(property);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="group relative bg-white border border-stone-100 hover:border-stone-200 transition-colors duration-300"
    >
      <Link to={`/properties/${property.slug || property._id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
          {image ? (
            <img
              src={image}
              alt={property.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-charcoal-300 text-sm">No image</div>
          )}

          <div className="absolute top-3 left-3 flex gap-2">
            <Badge tone="dark">{property.listingType === 'RENT' ? 'For Rent' : 'For Sale'}</Badge>
            {property.isFeatured && <Badge tone="warning">Featured</Badge>}
          </div>
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          onToggleFavorite?.(property._id);
        }}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-soft hover:bg-white transition-colors"
        aria-label="Toggle favorite"
      >
        <Heart className={`w-4 h-4 ${property.isFavorited ? 'fill-terracotta-500 text-terracotta-500' : 'text-charcoal-600'}`} />
      </button>

      <div className="p-5">
        <p className="text-lg font-serif text-charcoal-900 mb-1">{formatINR(property.price)}</p>
        <Link to={`/properties/${property.slug || property._id}`}>
          <h3 className="text-sm text-charcoal-800 mb-1.5 line-clamp-1 hover:text-terracotta-600 transition-colors">
            {property.title}
          </h3>
        </Link>
        <p className="text-xs text-charcoal-500 flex items-center gap-1 mb-4">
          <MapPin className="w-3 h-3" />
          {property.location?.locality}, {property.location?.city}
        </p>

        <div className="flex items-center gap-4 text-xs text-charcoal-600 border-t border-stone-100 pt-3">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" /> {property.bathrooms}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Ruler className="w-3.5 h-3.5" /> {formatArea(property.area)}
          </span>
        </div>

        {onToggleCompare && (
          <label className="flex items-center gap-2 mt-3 text-xs text-charcoal-500 cursor-pointer">
            <input
              type="checkbox"
              checked={!!isCompareSelected}
              onChange={() => onToggleCompare(property._id)}
              className="accent-terracotta-500"
            />
            Compare
          </label>
        )}
      </div>
    </motion.div>
  );
};
