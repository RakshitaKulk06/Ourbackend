const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { registerAttendanceSocket } = require('./sockets/attendanceSocket');

const sessionRoutes = require('./routes/session.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const certificateRoutes = require('./routes/certificate.routes');
const workshopRoutes = require('./routes/workshop.routes'); // standalone-testing only

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'attendance', time: new Date().toISOString() });
});

app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/certificate', certificateRoutes);
app.use('/api/workshops', workshopRoutes); // remove on integration, see routes/workshop.routes.js

registerAttendanceSocket(io);

// 404 + error handlers
app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`[server] Attendance Module backend running on http://localhost:${PORT}`);
  });
});

module.exports = { app, httpServer, io };
