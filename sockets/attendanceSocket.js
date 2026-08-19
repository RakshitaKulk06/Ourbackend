/**
 * Socket.io events used by this module:
 *
 *   Client -> Server
 *     'join:session'   { sessionId }   admin dashboard joins the room for a session
 *     'leave:session'  { sessionId }
 *
 *   Server -> Client (room: session:<id>)
 *     'qr:new'             { qrImage, generatedAt, expiresAt, refreshMs }
 *     'attendance:update'  { totalRegistered, present, remaining, percentage, latest }
 *     'session:ended'      { sessionId, endedAt, reason }
 */
function registerAttendanceSocket(io) {
  io.on('connection', (socket) => {
    socket.on('join:session', ({ sessionId }) => {
      if (!sessionId) return;
      socket.join(`session:${sessionId}`);
    });

    socket.on('leave:session', ({ sessionId }) => {
      if (!sessionId) return;
      socket.leave(`session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      // socket.io cleans up room membership automatically
    });
  });
}

module.exports = { registerAttendanceSocket };
