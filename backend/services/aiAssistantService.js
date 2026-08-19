const Property = require('../models/Property');

/**
 * Extracts structured search filters from a natural-language query using the
 * configured AI provider (Anthropic by default). The model is instructed to
 * return ONLY JSON matching our filter schema — no prose — so we can feed it
 * straight into a Mongo query. Falls back to a naive keyword parse if no AI
 * API key is configured, so the endpoint still works in a bare-bones setup.
 */
const extractFiltersWithAI = async (query) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return naiveKeywordParse(query);

  const systemPrompt = `You convert a real-estate search query into a JSON filter object. Fields: city, locality, propertyType (one of APARTMENT, VILLA, PLOT, INDEPENDENT_HOUSE, PENTHOUSE, STUDIO, COMMERCIAL_OFFICE, COMMERCIAL_SHOP, FARMHOUSE, WAREHOUSE), listingType (SALE or RENT), bedrooms (number), priceMax (number, in INR), priceMin (number, in INR), amenities (array of strings). Only include fields you're confident about. Respond with ONLY the JSON object, nothing else.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'claude-sonnet-4-6',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: query }],
      }),
    });

    const data = await response.json();
    const text = data?.content?.find((c) => c.type === 'text')?.text || '{}';
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[AI Assistant] Provider call failed, falling back to keyword parse:', err.message);
    return naiveKeywordParse(query);
  }
};

/**
 * Minimal fallback parser so the assistant is still useful with zero AI
 * configuration — extracts city names, bedroom counts, and a rough price
 * ceiling from common phrasings like "3 bedroom in Mohali under 1.2 crore".
 */
const naiveKeywordParse = (query) => {
  const filters = {};
  const lower = query.toLowerCase();

  const bedroomMatch = lower.match(/(\d+)[\s-]*(?:bhk|bedroom)/);
  if (bedroomMatch) filters.bedrooms = Number(bedroomMatch[1]);

  const croreMatch = lower.match(/(\d+(?:\.\d+)?)\s*crore/);
  if (croreMatch) filters.priceMax = Math.round(Number(croreMatch[1]) * 10000000);

  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*lakh/);
  if (lakhMatch) filters.priceMax = Math.round(Number(lakhMatch[1]) * 100000);

  if (lower.includes('rent')) filters.listingType = 'RENT';
  if (lower.includes('sale') || lower.includes('buy')) filters.listingType = 'SALE';

  const cities = ['chandigarh', 'mohali', 'delhi', 'gurgaon', 'noida', 'lucknow', 'kanpur', 'jaipur', 'bangalore', 'mumbai'];
  const foundCity = cities.find((c) => lower.includes(c));
  if (foundCity) filters.city = foundCity.charAt(0).toUpperCase() + foundCity.slice(1);

  return filters;
};

/**
 * Runs the extracted filters against the real Property collection, scoped to
 * a company if provided (staff context) or public-published-only otherwise.
 */
const searchPropertiesForAssistant = async (filters, { companyId } = {}) => {
  const mongoFilter = { status: 'PUBLISHED' };
  if (companyId) mongoFilter.company = companyId;

  if (filters.city) mongoFilter['location.city'] = new RegExp(`^${filters.city}$`, 'i');
  if (filters.locality) mongoFilter['location.locality'] = new RegExp(filters.locality, 'i');
  if (filters.propertyType) mongoFilter.propertyType = filters.propertyType;
  if (filters.listingType) mongoFilter.listingType = filters.listingType;
  if (filters.bedrooms) mongoFilter.bedrooms = { $gte: filters.bedrooms };
  if (filters.priceMin || filters.priceMax) {
    mongoFilter.price = {};
    if (filters.priceMin) mongoFilter.price.$gte = filters.priceMin;
    if (filters.priceMax) mongoFilter.price.$lte = filters.priceMax;
  }
  if (filters.amenities?.length) mongoFilter.amenities = { $all: filters.amenities };

  return Property.find(mongoFilter)
    .select('title price location bedrooms bathrooms area images propertyType listingType investment')
    .sort({ 'investment.expectedRentalYield': -1, publishedAt: -1 })
    .limit(12)
    .lean();
};

module.exports = { extractFiltersWithAI, searchPropertiesForAssistant };
