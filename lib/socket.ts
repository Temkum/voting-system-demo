import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 10,
    });
    socket.on('connect', () => console.log('Socket connected'));
    socket.on('connect_error', (err) =>
      console.error('Socket connect_error:', err.message)
    );
    socket.on('disconnect', () => console.log('Socket disconnected'));
  }
  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
