const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const {
  calculateEMI,
  calculateRentalYield,
  calculateAppreciation,
  calculateROI,
} = require('../services/investmentService');

const emiCalculator = catchAsync(async (req, res) => {
  const { principal, annualInterestRate, tenureYears } = req.body;
  if (!principal || !annualInterestRate || !tenureYears) {
    throw ApiError.badRequest('principal, annualInterestRate, and tenureYears are required.');
  }
  const result = calculateEMI({ principal: Number(principal), annualInterestRate: Number(annualInterestRate), tenureYears: Number(tenureYears) });
  sendResponse(res, 200, 'EMI calculated.', { emi: result });
});

const rentalYieldCalculator = catchAsync(async (req, res) => {
  const { price, monthlyRent, annualExpenses } = req.body;
  if (!price || !monthlyRent) throw ApiError.badRequest('price and monthlyRent are required.');
  const result = calculateRentalYield({
    price: Number(price),
    monthlyRent: Number(monthlyRent),
    annualExpenses: Number(annualExpenses) || 0,
  });
  sendResponse(res, 200, 'Rental yield calculated.', result);
});

const appreciationCalculator = catchAsync(async (req, res) => {
  const { price, annualAppreciationRate, years } = req.body;
  if (!price || !annualAppreciationRate || !years) {
    throw ApiError.badRequest('price, annualAppreciationRate, and years are required.');
  }
  const result = calculateAppreciation({
    price: Number(price),
    annualAppreciationRate: Number(annualAppreciationRate),
    years: Number(years),
  });
  sendResponse(res, 200, 'Appreciation calculated.', result);
});

const roiCalculator = catchAsync(async (req, res) => {
  const { price, downPayment, monthlyRent, annualAppreciationRate, holdYears, annualExpenses } = req.body;
  if (!price || !downPayment || !monthlyRent || !annualAppreciationRate || !holdYears) {
    throw ApiError.badRequest('price, downPayment, monthlyRent, annualAppreciationRate, and holdYears are required.');
  }
  const result = calculateROI({
    price: Number(price),
    downPayment: Number(downPayment),
    monthlyRent: Number(monthlyRent),
    annualAppreciationRate: Number(annualAppreciationRate),
    holdYears: Number(holdYears),
    annualExpenses: Number(annualExpenses) || 0,
  });
  sendResponse(res, 200, 'ROI calculated.', result);
});

module.exports = { emiCalculator, rentalYieldCalculator, appreciationCalculator, roiCalculator };
