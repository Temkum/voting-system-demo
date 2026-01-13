'use client';

import { useEffect, useState } from 'react';
import { initSocket, getSocket, disconnectSocket } from '@/lib/socket';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = initSocket();
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    return () => disconnectSocket();
  }, []);

  const joinPoll = (pollId: string) => getSocket()?.emit('join-poll', pollId);
  const leavePoll = (pollId: string) => getSocket()?.emit('leave-poll', pollId);

  const onPollUpdated = (callback: (poll: any) => void) => {
    const socket = getSocket();
    socket?.on('poll-updated', callback);
    return () => socket?.off('poll-updated', callback);
  };

  const onPollCreated = (callback: (poll: any) => void) => {
    const socket = getSocket();
    socket?.on('poll-created', callback);
    return () => socket?.off('poll-created', callback);
  };

  return { isConnected, joinPoll, leavePoll, onPollUpdated, onPollCreated };
};
