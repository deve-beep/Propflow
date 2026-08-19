const crypto = require('crypto');
const User = require('../models/User');
const Company = require('../models/Company');
const Customer = require('../models/Customer');
const Agent = require('../models/Agent');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const { issueTokenPair, verifyRefreshToken, signAccessToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { ROLES } = require('../utils/constants');

const REFRESH_COOKIE_NAME = 'propflow_refresh_token';

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/auth',
});

/**
 * Issues tokens, stores the refresh token on the user doc (so it can be revoked
 * on logout / password change), and sets the refresh token as an httpOnly cookie.
 */
const issueSession = async (user, req, res) => {
  const { accessToken, refreshToken } = issueTokenPair(user);

  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ token: refreshToken, userAgent: req.headers['user-agent'] || '' });
  // Cap stored sessions per user to avoid unbounded growth
  if (user.refreshTokens.length > 10) {
    user.refreshTokens = user.refreshTokens.slice(-10);
  }
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  return accessToken;
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register  (customer self-registration)
// ─────────────────────────────────────────────────────────────
const registerCustomer = catchAsync(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: ROLES.CUSTOMER,
  });

  await Customer.create({ user: user._id });

  const verifyToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
  await sendVerificationEmail(user.email, user.name, verifyUrl);

  const accessToken = await issueSession(user, req, res);

  sendResponse(res, 201, 'Account created successfully. Please check your email to verify your account.', {
    user: user.toSafeObject(),
    accessToken,
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register-company  (new agency onboarding: creates Company + COMPANY_ADMIN)
// ─────────────────────────────────────────────────────────────
const registerCompany = catchAsync(async (req, res) => {
  const { companyName, name, email, phone, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const company = await Company.create({
    name: companyName,
    email,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: ROLES.COMPANY_ADMIN,
    company: company._id,
  });

  company.createdBy = user._id;
  await company.save();

  const verifyToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
  await sendVerificationEmail(user.email, user.name, verifyUrl);

  const accessToken = await issueSession(user, req, res);

  sendResponse(res, 201, 'Company workspace created successfully.', {
    user: user.toSafeObject(),
    company,
    accessToken,
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/invite  (COMPANY_ADMIN creates staff accounts: AGENT/BROKER/PROPERTY_MANAGER/DEVELOPER)
// ─────────────────────────────────────────────────────────────
const inviteStaff = catchAsync(async (req, res) => {
  const { name, email, phone, password, role, specialization } = req.body;

  const allowedInviteRoles = [ROLES.AGENT, ROLES.BROKER, ROLES.PROPERTY_MANAGER, ROLES.DEVELOPER];
  if (!allowedInviteRoles.includes(role)) {
    throw ApiError.badRequest(`Cannot invite a user with role ${role}`);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    company: req.user.company,
    specialization,
    isEmailVerified: true, // invited by an admin, so treated as pre-verified
  });

  if (role === ROLES.AGENT || role === ROLES.BROKER) {
    await Agent.create({ user: user._id, company: req.user.company });
  }

  sendResponse(res, 201, 'Staff account created successfully.', { user: user.toSafeObject() });
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest('Email and password are required.');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact your administrator.');
  }

  const accessToken = await issueSession(user, req, res);

  sendResponse(res, 200, 'Logged in successfully.', {
    user: user.toSafeObject(),
    accessToken,
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────
const refresh = catchAsync(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('No refresh token provided.');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token. Please log in again.');
  }

  const user = await User.findById(decoded.id).select('+refreshTokens.token');
  if (!user) throw ApiError.unauthorized('User no longer exists.');

  const hasToken = user.refreshTokens.some((rt) => rt.token === token);
  if (!hasToken) {
    // Token reuse or already-revoked token — treat as compromised and wipe all sessions.
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    throw ApiError.unauthorized('Refresh token not recognized. Please log in again.');
  }

  const accessToken = signAccessToken({
    id: user._id.toString(),
    role: user.role,
    company: user.company ? user.company.toString() : null,
  });

  sendResponse(res, 200, 'Token refreshed.', { accessToken });
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token && req.user) {
    req.user.refreshTokens = req.user.refreshTokens.filter((rt) => rt.token !== token);
    await req.user.save({ validateBeforeSave: false });
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  sendResponse(res, 200, 'Logged out successfully.');
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });

  // Always respond success to avoid leaking which emails are registered.
  if (!user) {
    return sendResponse(res, 200, 'If an account with that email exists, a reset link has been sent.');
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendPasswordResetEmail(user.email, user.name, resetUrl);

  sendResponse(res, 200, 'If an account with that email exists, a reset link has been sent.');
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────
const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) throw ApiError.badRequest('Password reset token is invalid or has expired.');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // revoke all existing sessions on password reset
  await user.save();

  sendResponse(res, 200, 'Password reset successfully. Please log in with your new password.');
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/verify-email/:token
// ─────────────────────────────────────────────────────────────
const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) throw ApiError.badRequest('Verification link is invalid or has expired.');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  sendResponse(res, 200, 'Email verified successfully.');
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/change-password  (authenticated)
// ─────────────────────────────────────────────────────────────
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect.');
  }

  user.password = newPassword;
  user.refreshTokens = []; // revoke all sessions except the one about to be reissued
  await user.save();

  const accessToken = await issueSession(user, req, res);

  sendResponse(res, 200, 'Password changed successfully.', { accessToken });
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────
const getMe = catchAsync(async (req, res) => {
  sendResponse(res, 200, 'Current user fetched.', { user: req.user.toSafeObject() });
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/auth/me
// ─────────────────────────────────────────────────────────────
const updateMe = catchAsync(async (req, res) => {
  const allowedFields = ['name', 'phone', 'bio', 'specialization'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  sendResponse(res, 200, 'Profile updated successfully.', { user: user.toSafeObject() });
});

module.exports = {
  registerCustomer,
  registerCompany,
  inviteStaff,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  getMe,
  updateMe,
};
