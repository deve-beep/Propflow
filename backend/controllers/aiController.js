const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const { extractFiltersWithAI, searchPropertiesForAssistant } = require('../services/aiAssistantService');

// ─────────────────────────────────────────────────────────────
// POST /api/ai/query   { query: "3 bedroom under 1.2 crore in Mohali" }
// ─────────────────────────────────────────────────────────────
const query = catchAsync(async (req, res) => {
  const { query: userQuery } = req.body;
  if (!userQuery?.trim()) throw ApiError.badRequest('query is required.');

  const filters = await extractFiltersWithAI(userQuery);
  const companyId = req.user?.company || null;
  const results = await searchPropertiesForAssistant(filters, { companyId });

  const summary =
    results.length > 0
      ? `Found ${results.length} propert${results.length === 1 ? 'y' : 'ies'} matching your search.`
      : "No properties matched that search. Try adjusting your budget or location.";

  sendResponse(res, 200, summary, { filters, results });
});

module.exports = { query };
