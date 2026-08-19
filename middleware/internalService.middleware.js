/**
 * Guards the internal endpoint the Certificate Module hits to fetch
 * eligible participants. This is intentionally simple (shared header key)
 * since both modules live in the same backend/repo. If the team already has
 * a convention for service-to-service calls (e.g. everything just goes
 * through requireAdmin, or there's an internal API gateway), swap this out
 * for that instead — it's a placeholder, not a hard requirement.
 */
function verifyInternalService(req, res, next) {
  const key = req.headers['x-internal-key'];

  if (!process.env.INTERNAL_SERVICE_KEY) {
    // Fail closed if the key isn't configured, rather than silently open.
    return res.status(500).json({ message: 'INTERNAL_SERVICE_KEY not configured on server' });
  }

  if (key !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  next();
}

module.exports = { verifyInternalService };
