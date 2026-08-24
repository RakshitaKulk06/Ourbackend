
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
