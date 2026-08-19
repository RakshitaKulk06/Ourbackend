const AttendanceSession = require('../models/AttendanceSession.model');
const Attendance = require('../models/Attendance.model');
const Registration = require('../models/Registration.model');
const qrManager = require('../utils/qrManager');
const { endSessionInternal } = require('./_endSessionInternal');


async function scanAttendance(req, res) {
  try {
    const { sessionId, token } = req.body;
    const studentId = req.user.id;

    if (!sessionId || !token) {
      return res.status(400).json({ message: 'sessionId and token are required' });
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session || session.status !== 'active') {
      return res.status(400).json({ message: 'This attendance session is not active' });
    }

    // "Ensure only the currently displayed QR code is valid."
    if (!qrManager.isTokenValid(sessionId, token)) {
      return res.status(410).json({ message: 'This QR code has expired — scan the current one' });
    }

    // "System verifies workshop registration"
    const registration = await Registration.findOne({
      student: studentId,
      workshop: session.workshop,
    });
    if (!registration) {
      return res.status(403).json({ message: 'You are not registered for this workshop' });
    }

    // "Prevent duplicate attendance submissions"
    const alreadyMarked = await Attendance.findOne({ session: sessionId, student: studentId });
    if (alreadyMarked) {
      return res.status(409).json({ message: 'Your attendance is already marked for this session' });
    }

    let attendance;
    try {
      attendance = await Attendance.create({
        session: sessionId,
        workshop: session.workshop,
        student: studentId,
        status: 'present',
      });
    } catch (err) {
      if (err.code === 11000) {
        // Race condition: two scans landed at once, unique index caught it.
        return res.status(409).json({ message: 'Your attendance is already marked for this session' });
      }
      throw err;
    }

    const presentCount = await Attendance.countDocuments({ session: sessionId });
    const populated = await attendance.populate('student', 'name usn department');

    const io = req.app.get('io');
    io.to(`session:${sessionId}`).emit('attendance:update', {
      sessionId,
      totalRegistered: session.totalRegistered,
      present: presentCount,
      remaining: Math.max(session.totalRegistered - presentCount, 0),
      percentage: session.totalRegistered
        ? Math.round((presentCount / session.totalRegistered) * 100)
        : 0,
      latest: {
        studentId: populated.student._id,
        name: populated.student.name,
        usn: populated.student.usn,
        department: populated.student.department,
        markedAt: attendance.markedAt,
      },
    });

    // "...until the admin ends it or all registered participants have
    // marked their attendance."
    if (session.totalRegistered > 0 && presentCount >= session.totalRegistered) {
      await endSessionInternal(io, session, 'all_marked');
    }

    return res.status(200).json({
      message: 'Attendance recorded',
      workshopId: session.workshop,
      markedAt: attendance.markedAt,
    });
  } catch (err) {
    console.error('[scanAttendance]', err);
    return res.status(500).json({ message: 'Failed to record attendance' });
  }
}

module.exports = { scanAttendance };
