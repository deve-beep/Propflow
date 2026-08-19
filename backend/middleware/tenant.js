const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');

/**
 * Enforces tenant isolation. Must run after `protect`.
 *
 * - SUPER_ADMIN bypasses tenant scoping entirely (can see across companies,
 *   used only for platform-level admin routes).
 * - All other staff roles (COMPANY_ADMIN, AGENT, BROKER, DEVELOPER, PROPERTY_MANAGER)
 *   MUST belong to a company; req.tenantId is set and every controller that
 *   touches tenant data filters by it.
 * - CUSTOMER accounts are not bound to a single company at the auth layer —
 *   they can browse/interact across companies — so req.tenantId is left null
 *   for them and individual controllers scope by the company field on the
 *   specific resource being accessed (e.g. the property's company) instead.
 */
const enforceTenant = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }

  if (req.user.role === ROLES.SUPER_ADMIN) {
    req.tenantId = null; // unrestricted
    return next();
  }

  if (req.user.role === ROLES.CUSTOMER) {
    req.tenantId = null; // scoped per-resource, not per-request
    return next();
  }

  if (!req.user.company) {
    return next(ApiError.forbidden('Your account is not associated with a company workspace.'));
  }

  req.tenantId = req.user.company.toString();
  next();
};

/**
 * Guarantees a staff (non-customer, non-super-admin) request has a tenant.
 * Use on routes that create/modify tenant-owned resources.
 */
const requireTenant = (req, res, next) => {
  if (!req.tenantId) {
    return next(ApiError.forbidden('This action requires an active company workspace.'));
  }
  next();
};

/**
 * Helper for controllers: builds a Mongo filter object scoped to the caller's
 * tenant. SUPER_ADMIN gets an empty filter (sees everything unless they pass
 * an explicit ?companyId= query param, handled separately in admin controllers).
 */
const tenantFilter = (req, extra = {}) => {
  if (req.tenantId) {
    return { ...extra, company: req.tenantId };
  }
  return { ...extra };
};

module.exports = { enforceTenant, requireTenant, tenantFilter };
