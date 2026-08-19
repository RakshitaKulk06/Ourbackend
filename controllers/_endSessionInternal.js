const qrManager = require('../utils/qrManager');

async function endSessionInternal(io, session, reason = 'manual') {
  qrManager.stopQrLoop(session._id.toString());
  session.status = 'ended';
  session.endedAt = new Date();
  await session.save();

  io.to(`session:${session._id}`).emit('session:ended', {
    sessionId: session._id,
    endedAt: session.endedAt,
    reason, 
  });

  return session;
}

module.exports = { endSessionInternal };
