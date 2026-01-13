'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { pollApi, voteApi } from '@/lib/api';

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

interface LiveUpdate {
  id: string;
  message: string;
  timestamp: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { isConnected, joinPoll, leavePoll, onPollUpdated, onPollCreated } =
    useSocket();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [notification, setNotification] = useState<{
    type: string;
    message: string;
  } | null>(null);

  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchPolls();

      const unsubscribeCreated = onPollCreated((poll) => {
        setPolls((prev) => [poll, ...prev]);
        addLiveUpdate(`New poll created: ${poll.title}`);
      });

      const unsubscribeUpdated = onPollUpdated((updatedPoll) => {
        setPolls((prev) =>
          prev.map((p) => (p._id === updatedPoll._id ? updatedPoll : p))
        );
        addLiveUpdate(`Vote registered on: ${updatedPoll.title}`);
      });

      return () => {
        unsubscribeCreated();
        unsubscribeUpdated();
      };
    }
  }, [user]);

  const fetchPolls = async () => {
    try {
      setIsLoadingPolls(true);
      const data = await pollApi.getAll();
      setPolls(data);

      const voted = new Set<string>();
      for (const poll of data) {
        try {
          const { hasVoted } = await voteApi.checkVoted(poll._id);
          if (hasVoted) voted.add(poll._id);
        } catch (err) {
          console.error('Check voted error:', err);
        }
      }
      setVotedPolls(voted);
    } catch (err) {
      console.error('Fetch polls error:', err);
      showNotification('error', 'Failed to load polls');
    } finally {
      setIsLoadingPolls(false);
    }
  };

  const addLiveUpdate = (message: string) => {
    const update: LiveUpdate = {
      id: Date.now().toString(),
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLiveUpdates((prev) => [update, ...prev].slice(0, 5));
  };

  const showNotification = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreatePoll = async () => {
    const validOptions = newPollOptions.filter((o) => o.trim());
    if (!newPollTitle.trim() || validOptions.length < 2) {
      showNotification('error', 'Poll needs title and at least 2 options');
      return;
    }

    try {
      setIsCreating(true);
      await pollApi.create(newPollTitle, validOptions);
      setNewPollTitle('');
      setNewPollOptions(['', '']);
      showNotification('success', 'Poll created successfully!');
    } catch (err) {
      console.error('Create poll error:', err);
      showNotification('error', 'Failed to create poll');
    } finally {
      setIsCreating(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (votedPolls.has(pollId)) {
      showNotification('error', 'Already voted on this poll');
      return;
    }

    try {
      await voteApi.vote(pollId, optionId);
      setVotedPolls((prev) => new Set(prev).add(pollId));
      showNotification('success', 'Vote submitted! Processing...');
    } catch (err: any) {
      console.error('Vote error:', err);
      showNotification('error', err.response?.data?.error || 'Failed to vote');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Polling Dashboard
            </h1>
            <p className="text-gray-600">Welcome, {user.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {notification && (
          <Alert
            className={
              notification.type === 'success'
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
            }
          >
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Poll</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Poll question"
                  value={newPollTitle}
                  onChange={(e) => setNewPollTitle(e.target.value)}
                />
                {newPollOptions.map((opt, i) => (
                  <Input
                    key={i}
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...newPollOptions];
                      updated[i] = e.target.value;
                      setNewPollOptions(updated);
                    }}
                  />
                ))}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setNewPollOptions([...newPollOptions, ''])}
                    disabled={isCreating}
                  >
                    Add Option
                  </Button>
                  <Button onClick={handleCreatePoll} disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Poll'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isLoadingPolls ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">Loading polls...</p>
                </CardContent>
              </Card>
            ) : polls.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">
                    No polls yet. Create one above!
                  </p>
                </CardContent>
              </Card>
            ) : (
              polls.map((poll) => (
                <PollCard
                  key={poll._id}
                  poll={poll}
                  hasVoted={votedPolls.has(poll._id)}
                  onVote={handleVote}
                  joinPoll={joinPoll}
                  leavePoll={leavePoll}
                />
              ))
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Live Updates
                  <span
                    className={`ml-2 h-2 w-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {liveUpdates.length === 0 ? (
                    <p className="text-sm text-gray-500">No updates yet</p>
                  ) : (
                    liveUpdates.map((update) => (
                      <div
                        key={update.id}
                        className="border-l-2 border-blue-500 pl-3 py-2"
                      >
                        <p className="text-sm font-medium">{update.message}</p>
                        <p className="text-xs text-gray-500">
                          {update.timestamp}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tech Stack</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  'Next.js 16 + React 19',
                  'TypeScript',
                  'Express.js backend',
                  'Socket.io real-time',
                  'MongoDB + Mongoose',
                  'Redis + Bull jobs',
                  'Passport.js auth',
                  'Tailwind + shadcn/ui',
                ].map((tech, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{tech}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// poll card component
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
  }, [poll._id]);

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
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {new Date(poll.createdAt).toLocaleString()} • by {poll.createdBy.name}
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
                  className="flex-1 justify-start"
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
