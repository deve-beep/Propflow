const jwt = require('jsonwebtoken');

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

/**
 * Issues a fresh access + refresh token pair for a user, embedding just enough
 * claims (id, role, company) to authorize requests without a DB round trip
 * on every single request. The DB is still consulted for isActive checks.
 */
const issueTokenPair = (user) => {
  const payload = {
    id: user._id.toString(),
    role: user.role,
    company: user.company ? user.company.toString() : null,
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({ id: payload.id }),
  };
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  issueTokenPair,
};
