import { io } from 'socket.io-client';

// In dev, Vite proxies /socket.io to the backend (see vite.config.js).
// In production, set VITE_SOCKET_URL to the deployed backend origin.
const socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export default socket;
