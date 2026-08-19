const crypto = require('crypto');
const QRCode = require('qrcode');
const AttendanceSession = require('../models/AttendanceSession.model');

const REFRESH_MS = Number(process.env.QR_REFRESH_INTERVAL_MS) || 15000;


const activeSessions = new Map();

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

async function buildQrPayload(sessionId, token) {
  const payload = JSON.stringify({ sessionId, token });
  const qrImage = await QRCode.toDataURL(payload, { margin: 1, width: 320 });
  return qrImage;
}


function startQrLoop(io, sessionId, workshopId) {
  async function rotate() {
    const token = generateToken();
    const qrGeneratedAt = new Date();
    const expiresAt = new Date(qrGeneratedAt.getTime() + REFRESH_MS);
    const qrImage = await buildQrPayload(sessionId, token);

    const entry = activeSessions.get(sessionId);
    if (!entry) return; // session was ended mid-flight
    entry.currentToken = token;
    entry.qrGeneratedAt = qrGeneratedAt;
    entry.expiresAt = expiresAt;

   
    await AttendanceSession.updateOne(
      { _id: sessionId },
      { currentQrToken: token, qrGeneratedAt }
    );

    io.to(`session:${sessionId}`).emit('qr:new', {
      sessionId,
      qrImage,
      generatedAt: qrGeneratedAt,
      expiresAt,
      refreshMs: REFRESH_MS,
    });
  }

  
  rotate();
  const intervalHandle = setInterval(rotate, REFRESH_MS);

  activeSessions.set(sessionId, {
    workshopId,
    currentToken: null,
    qrGeneratedAt: null,
    expiresAt: null,
    intervalHandle,
  });
}

function stopQrLoop(sessionId) {
  const entry = activeSessions.get(sessionId);
  if (entry?.intervalHandle) clearInterval(entry.intervalHandle);
  activeSessions.delete(sessionId);
}

function isSessionActive(sessionId) {
  return activeSessions.has(sessionId);
}


function isTokenValid(sessionId, token) {
  const entry = activeSessions.get(sessionId);
  if (!entry || !entry.currentToken) return false;
  return entry.currentToken === token;
}

function getCurrentState(sessionId) {
  return activeSessions.get(sessionId) || null;
}

async function getCurrentQrImage(sessionId) {
  const entry = activeSessions.get(sessionId);
  if (!entry || !entry.currentToken) return null;
  const qrImage = await buildQrPayload(sessionId, entry.currentToken);
  return { qrImage, generatedAt: entry.qrGeneratedAt, expiresAt: entry.expiresAt };
}

module.exports = {
  REFRESH_MS,
  startQrLoop,
  stopQrLoop,
  isSessionActive,
  isTokenValid,
  getCurrentState,
  getCurrentQrImage,
};
