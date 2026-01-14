import { useState, useCallback } from 'react';

interface LiveUpdate {
  id: string;
  message: string;
  timestamp: string;
}

export function useLiveUpdates(limit = 5) {
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);

  const addLiveUpdate = useCallback(
    (message: string) => {
      const update: LiveUpdate = {
        id: crypto.randomUUID(),
        message,
        timestamp: new Date().toLocaleTimeString(),
      };

      setLiveUpdates((prev) => [update, ...prev].slice(0, limit));
    },
    [limit]
  );

  return { liveUpdates, addLiveUpdate };
}
