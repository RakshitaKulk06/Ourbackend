const express = require('express');
const router = express.Router();

const { requireStudent } = require('../middleware/auth.middleware');
const { scanAttendance } = require('../controllers/attendance.controller');

router.post('/scan', requireStudent, scanAttendance);

module.exports = router;
