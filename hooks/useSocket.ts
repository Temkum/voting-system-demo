'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { initSocket, getSocket, disconnectSocket } from '@/lib/socket';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<ReturnType<typeof getSocket>>(null);

  // Keep a stable reference to the socket
  useEffect(() => {
    const socket = initSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      // Only disconnect on unmount of the LAST useSocket instance if desired
      // For most apps it's fine to keep alive → comment out if you want persistent socket
      // disconnectSocket();
    };
  }, []); // empty deps = runs once per component mount

  const joinPoll = useCallback((pollId: string) => {
    const socket = socketRef.current || getSocket();
    if (socket?.connected) {
      console.log('Joining poll:', pollId);
      socket.emit('join-poll', pollId);
    }
  }, []);

  const leavePoll = useCallback((pollId: string) => {
    const socket = socketRef.current || getSocket();
    if (socket?.connected) {
      console.log('Leaving poll:', pollId);
      socket.emit('leave-poll', pollId);
    }
  }, []);

  // ── Stable event subscription helpers ──
  const onPollUpdated = useCallback((callback: (poll: any) => void) => {
    const socket = socketRef.current || getSocket();
    if (!socket) return () => {};

    const handler = (poll: any) => {
      console.log('Poll updated via socket:', poll?._id);
      callback(poll);
    };

    socket.on('poll-updated', handler);

    return () => {
      socket.off('poll-updated', handler);
    };
  }, []); // ← empty deps = this function never changes

  const onPollCreated = useCallback((callback: (poll: any) => void) => {
    const socket = socketRef.current || getSocket();
    if (!socket) return () => {};

    const handler = (poll: any) => {
      console.log('Poll created via socket:', poll?._id);
      callback(poll);
    };

    socket.on('poll-created', handler);

    return () => {
      socket.off('poll-created', handler);
    };
  }, []); // ← empty deps = stable forever

  return {
    isConnected,
    joinPoll,
    leavePoll,
    onPollUpdated,
    onPollCreated,
  };
}
