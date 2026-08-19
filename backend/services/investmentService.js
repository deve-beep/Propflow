/**
 * Standard reducing-balance EMI formula:
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 * where P = principal, r = monthly interest rate, n = number of months.
 */
const calculateEMI = ({ principal, annualInterestRate, tenureYears }) => {
  const r = annualInterestRate / 12 / 100;
  const n = tenureYears * 12;
  if (r === 0) return Math.round(principal / n);
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
};

/**
 * Gross rental yield = (Annual Rent / Property Price) * 100
 */
const calculateRentalYield = ({ price, monthlyRent, annualExpenses = 0 }) => {
  const annualRent = monthlyRent * 12;
  const grossYield = (annualRent / price) * 100;
  const netYield = ((annualRent - annualExpenses) / price) * 100;
  return {
    annualRentalIncome: Math.round(annualRent),
    grossYieldPercent: Math.round(grossYield * 100) / 100,
    netYieldPercent: Math.round(netYield * 100) / 100,
  };
};

/**
 * Projects property value forward using compound annual appreciation.
 */
const calculateAppreciation = ({ price, annualAppreciationRate, years }) => {
  const futureValue = price * Math.pow(1 + annualAppreciationRate / 100, years);
  return {
    futureValue: Math.round(futureValue),
    totalGain: Math.round(futureValue - price),
    gainPercent: Math.round(((futureValue - price) / price) * 10000) / 100,
  };
};

/**
 * Simple total-return ROI combining rental income over the hold period plus
 * capital appreciation, against total cash invested (down payment + costs).
 */
const calculateROI = ({ price, downPayment, monthlyRent, annualAppreciationRate, holdYears, annualExpenses = 0 }) => {
  const totalRentalIncome = monthlyRent * 12 * holdYears - annualExpenses * holdYears;
  const { totalGain: appreciationGain, futureValue } = calculateAppreciation({
    price,
    annualAppreciationRate,
    years: holdYears,
  });
  const totalReturn = totalRentalIncome + appreciationGain;
  const roiPercent = (totalReturn / downPayment) * 100;

  return {
    totalRentalIncome: Math.round(totalRentalIncome),
    appreciationGain,
    futureValue,
    totalReturn: Math.round(totalReturn),
    roiPercent: Math.round(roiPercent * 100) / 100,
  };
};

module.exports = { calculateEMI, calculateRentalYield, calculateAppreciation, calculateROI };
