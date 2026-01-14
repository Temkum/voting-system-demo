import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Clock } from 'lucide-react';
import { Poll } from '@/types';

interface PollCardProps {
  poll: Poll;
  hasVoted: boolean;
  onVote: (pollId: string, optionId: string) => void;
  joinPoll: (pollId: string) => void;
  leavePoll: (pollId: string) => void;
}

function PollCard({
  poll,
  hasVoted,
  onVote,
  joinPoll,
  leavePoll,
}: PollCardProps) {
  useEffect(() => {
    joinPoll(poll._id);
    return () => leavePoll(poll._id);
  }, [poll._id, joinPoll, leavePoll]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex-1">{poll.title}</span>
          <span className="text-sm font-normal text-gray-500 flex items-center gap-1">
            <Users className="w-4 h-4" />
            {poll.totalVotes}
          </span>
        </CardTitle>
        <div className="text-xs text-gray-600 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {new Date(poll.createdAt).toLocaleString()} created by{' '}
          {poll.createdBy.name}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {poll.options.map((option) => {
          const percentage =
            poll.totalVotes > 0
              ? Math.round((option.votes / poll.totalVotes) * 100)
              : 0;

          return (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  className="flex-1 justify-start cursor-pointer"
                  onClick={() => onVote(poll._id, option.id)}
                  disabled={hasVoted}
                >
                  {option.text}
                </Button>
                <span className="ml-4 text-sm font-medium w-24 text-right">
                  {option.votes} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        {hasVoted && (
          <p className="text-sm text-green-600 text-center mt-2">
            ✓ You voted on this poll
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default PollCard;
