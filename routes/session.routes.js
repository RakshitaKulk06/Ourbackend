const express = require('express');
const router = express.Router();

const { requireAdmin } = require('../middleware/auth.middleware');
const { startSession, endSession, getCurrentQr } = require('../controllers/session.controller');
const { getDashboard } = require('../controllers/dashboard.controller');

router.post('/start', requireAdmin, startSession);
router.post('/:id/end', requireAdmin, endSession);
router.get('/:id/qr', requireAdmin, getCurrentQr);
router.get('/:id/dashboard', requireAdmin, getDashboard);

module.exports = router;
