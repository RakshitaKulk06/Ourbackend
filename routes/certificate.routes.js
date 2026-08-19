const express = require('express');
const router = express.Router();

const { verifyInternalService } = require('../middleware/internalService.middleware');
const { getEligibleParticipants } = require('../controllers/certificate.controller');

router.get(
  '/workshops/:workshopId/eligible-participants',
  verifyInternalService,
  getEligibleParticipants
);

module.exports = router;
