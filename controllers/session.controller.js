const AttendanceSession = require('../models/AttendanceSession.model');
const Registration = require('../models/Registration.model');
const Workshop = require('../models/Workshop.model');
const qrManager = require('../utils/qrManager');
const { endSessionInternal } = require('./_endSessionInternal');

async function startSession(req, res) {
  try {
    const { workshopId } = req.body;
    if (!workshopId) {
      return res.status(400).json({ message: 'workshopId is required' });
    }

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const existingActive = await AttendanceSession.findOne({
      workshop: workshopId,
      status: 'active',
    });
    if (existingActive) {
      return res.status(409).json({
        message: 'An attendance session is already active for this workshop',
        sessionId: existingActive._id,
      });
    }

    const totalRegistered = await Registration.countDocuments({ workshop: workshopId });

    const session = await AttendanceSession.create({
      workshop: workshopId,
      startedBy: req.user.id,
      status: 'active',
      totalRegistered,
    });

    const io = req.app.get('io');
    qrManager.startQrLoop(io, session._id.toString(), workshopId.toString());

    return res.status(201).json({
      sessionId: session._id,
      workshopId,
      workshopTitle: workshop.title,
      totalRegistered,
      startedAt: session.startedAt,
      refreshMs: qrManager.REFRESH_MS,
    });
  } catch (err) {
    console.error('[startSession]', err);
    return res.status(500).json({ message: 'Failed to start attendance session' });
  }
}


async function endSession(req, res) {
  try {
    const { id } = req.params;
    const session = await AttendanceSession.findById(id);

    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status === 'ended') {
      return res.status(200).json({ message: 'Session already ended', sessionId: id });
    }

    const io = req.app.get('io');
    await endSessionInternal(io, session, 'manual');

    return res.json({ message: 'Session ended', sessionId: id, endedAt: session.endedAt });
  } catch (err) {
    console.error('[endSession]', err);
    return res.status(500).json({ message: 'Failed to end attendance session' });
  }
}

async function getCurrentQr(req, res) {
  try {
    const { id } = req.params;
    const current = await qrManager.getCurrentQrImage(id);
    if (!current) {
      return res.status(404).json({ message: 'No active QR for this session right now' });
    }
    return res.json(current);
  } catch (err) {
    console.error('[getCurrentQr]', err);
    return res.status(500).json({ message: 'Failed to fetch current QR' });
  }
}

module.exports = { startSession, endSession, getCurrentQr };
