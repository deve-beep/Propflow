export const formatINR = (value) => {
  if (value === null || value === undefined) return '—';
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(value % 10000000 === 0 ? 0 : 2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 2)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
};

export const formatArea = (area) => {
  if (!area) return '—';
  const unitLabel = { SQFT: 'sq.ft', SQM: 'sq.m', ACRE: 'acre' }[area.unit] || area.unit;
  return `${area.value.toLocaleString('en-IN')} ${unitLabel}`;
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const propertyTypeLabel = (type) =>
  (type || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export const coverImage = (property) =>
  property?.images?.find((img) => img.isCover)?.url || property?.images?.[0]?.url || null;
