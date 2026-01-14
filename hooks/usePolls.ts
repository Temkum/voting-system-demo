import { useEffect, useState } from 'react';
import { pollApi, voteApi } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  _id: string;
  title: string;
  options: PollOption[];
  createdBy: { _id: string; name: string; email: string };
  totalVotes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function usePolls(user: any, addLiveUpdate: (msg: string) => void) {
  const { joinPoll, leavePoll, onPollCreated, onPollUpdated } = useSocket();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const fetchPolls = async () => {
      setIsLoadingPolls(true);
      const data = await pollApi.getAll();
      if (!mounted) return;

      setPolls(data);

      const checks = await Promise.all(
        data.map((p) =>
          voteApi.checkVoted(p._id).then((r) => [p._id, r.hasVoted] as const)
        )
      );

      if (!mounted) return;
      setVotedPolls(new Set(checks.filter(([, v]) => v).map(([id]) => id)));
      setIsLoadingPolls(false);
    };

    fetchPolls();

    const unsubCreate = onPollCreated((poll) => {
      setPolls((prev) => [poll, ...prev]);
      addLiveUpdate(`New poll created: ${poll.title}`);
    });

    const unsubUpdate = onPollUpdated((updated) => {
      setPolls((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
      addLiveUpdate(`Vote registered on: ${updated.title}`);
    });

    return () => {
      mounted = false;
      unsubCreate();
      unsubUpdate();
    };
  }, [user, onPollCreated, onPollUpdated, addLiveUpdate]);

  const vote = async (pollId: string, optionId: string) => {
    if (votedPolls.has(pollId)) return;

    await voteApi.vote(pollId, optionId);
    setVotedPolls((prev) => new Set(prev).add(pollId));
  };

  return {
    polls,
    votedPolls,
    isLoadingPolls,
    vote,
    joinPoll,
    leavePoll,
  };
}
