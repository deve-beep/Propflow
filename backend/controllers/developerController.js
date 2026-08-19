const Developer = require('../models/Developer');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');

const listDevelopers = catchAsync(async (req, res) => {
  const filter = req.tenantId ? { company: req.tenantId } : {};
  const developers = await Developer.find(filter).sort({ name: 1 });
  sendResponse(res, 200, 'Developers fetched successfully.', developers);
});

const getDeveloper = catchAsync(async (req, res) => {
  const developer = await Developer.findById(req.params.id);
  if (!developer) throw ApiError.notFound('Developer not found.');
  sendResponse(res, 200, 'Developer fetched successfully.', developer);
});

const createDeveloper = catchAsync(async (req, res) => {
  const developer = await Developer.create({ ...req.body, company: req.tenantId });
  sendResponse(res, 201, 'Developer created successfully.', developer);
});

const updateDeveloper = catchAsync(async (req, res) => {
  const developer = await Developer.findOneAndUpdate(
    { _id: req.params.id, company: req.tenantId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!developer) throw ApiError.notFound('Developer not found.');
  sendResponse(res, 200, 'Developer updated successfully.', developer);
});

module.exports = { listDevelopers, getDeveloper, createDeveloper, updateDeveloper };
