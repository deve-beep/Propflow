const PROPERTY_TYPES = ['APARTMENT', 'VILLA', 'PLOT', 'INDEPENDENT_HOUSE', 'PENTHOUSE', 'STUDIO', 'COMMERCIAL_OFFICE', 'COMMERCIAL_SHOP', 'FARMHOUSE', 'WAREHOUSE'];
const CITIES = ['Chandigarh', 'Mohali', 'Delhi', 'Gurgaon', 'Noida', 'Lucknow', 'Kanpur', 'Jaipur', 'Bangalore', 'Mumbai'];

export const PropertyFilters = ({ filters, onChange }) => {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-3">City</p>
        <select value={filters.city || ''} onChange={(e) => set('city', e.target.value)} className="input-field">
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="section-label mb-3">Property Type</p>
        <select value={filters.propertyType || ''} onChange={(e) => set('propertyType', e.target.value)} className="input-field">
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="section-label mb-3">Bedrooms</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => set('bedrooms', filters.bedrooms === n ? '' : n)}
              className={`w-9 h-9 text-xs border ${filters.bedrooms === n ? 'bg-charcoal-900 text-white border-charcoal-900' : 'border-stone-200 text-charcoal-600'}`}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="section-label mb-3">Budget</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin || ''}
            onChange={(e) => set('priceMin', e.target.value)}
            className="input-field text-xs"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax || ''}
            onChange={(e) => set('priceMax', e.target.value)}
            className="input-field text-xs"
          />
        </div>
      </div>

      <div>
        <p className="section-label mb-3">Furnishing</p>
        <select value={filters.furnishing || ''} onChange={(e) => set('furnishing', e.target.value)} className="input-field">
          <option value="">Any</option>
          <option value="UNFURNISHED">Unfurnished</option>
          <option value="SEMI_FURNISHED">Semi Furnished</option>
          <option value="FULLY_FURNISHED">Fully Furnished</option>
        </select>
      </div>

      <button
        onClick={() => onChange({})}
        className="text-xs text-charcoal-500 hover:text-terracotta-600 underline"
      >
        Clear all filters
      </button>
    </div>
  );
};
