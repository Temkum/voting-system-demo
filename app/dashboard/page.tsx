'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { pollApi, voteApi } from '@/lib/api';
import PollCard from './PollCard';
import { LiveUpdate, Poll } from '@/types';

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

  const showNotification = useCallback(
    (type: 'success' | 'error', message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 3000);
    },
    []
  );

  const fetchPolls = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingPolls(true);
      const data = await pollApi.getAll();
      setPolls(data);

      // TODO: req backend to return hasVoted in poll list
      const voted = new Set<string>();
      for (const poll of data) {
        try {
          const { hasVoted } = await voteApi.checkVoted(poll._id);
          if (hasVoted) voted.add(poll._id);
        } catch {}
      }
      setVotedPolls(voted);
    } catch (err) {
      console.error('Fetch polls error:', err);
      showNotification('error', 'Failed to load polls');
    } finally {
      setIsLoadingPolls(false);
    }
  }, [user, showNotification]);

  // global listeners
  useEffect(() => {
    if (!user) return;

    fetchPolls();

    const unsubscribeCreated = onPollCreated((newPoll: Poll) => {
      setPolls((prev) => [newPoll, ...prev]);
      addLiveUpdate(`New poll created: ${newPoll.title}`);
    });

    const unsubscribeUpdated = onPollUpdated((updatedPoll: Poll) => {
      setPolls((prev) =>
        prev.map((p) => (p._id === updatedPoll._id ? updatedPoll : p))
      );
      addLiveUpdate(`Vote registered on: ${updatedPoll.title}`);
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [user, onPollCreated, onPollUpdated, fetchPolls]);

  const addLiveUpdate = useCallback((message: string) => {
    const update: LiveUpdate = {
      id: Date.now().toString(),
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLiveUpdates((prev) => [update, ...prev].slice(0, 5));
  }, []);

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
      showNotification('error', 'Failed to create poll');
    } finally {
      setIsCreating(false);
    }
  };

  // Optimistic vote + rollback on error
  const handleVote = useCallback(
    async (pollId: string, optionId: string) => {
      if (votedPolls.has(pollId)) {
        showNotification('error', 'You already voted on this poll');
        return;
      }

      // 1. Optimistic UI update
      setPolls((prevPolls) =>
        prevPolls.map((p) =>
          p._id === pollId
            ? {
                ...p,
                options: p.options.map((opt) =>
                  opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
                ),
                totalVotes: p.totalVotes + 1,
              }
            : p
        )
      );

      try {
        await voteApi.vote(pollId, optionId);
        setVotedPolls((prev) => new Set([...prev, pollId]));
        showNotification('success', 'Vote submitted!');
      } catch (err: any) {
        // Rollback: refetch or revert (simplest = refetch)
        console.error('Vote failed:', err);
        showNotification(
          'error',
          err.response?.data?.error || 'Failed to vote'
        );
        fetchPolls(); // Re-sync from server
      }
    },
    [votedPolls, showNotification, fetchPolls]
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (authLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
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
            {/* Create Poll */}
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

            {/* Polls List with Skeleton */}
            {isLoadingPolls ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-7 w-3/4 bg-gray-300 rounded" />
                      <div className="h-4 w-1/2 bg-gray-300 rounded mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[...Array(3)].map((__, j) => (
                        <div key={j} className="space-y-2">
                          <div className="h-10 bg-gray-300 rounded" />
                          <div className="h-2 bg-gray-300 rounded-full" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : polls.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No polls yet. Create one above!
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

          {/* Sidebar */}
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
                <div className="space-y-3">
                  {liveUpdates.length === 0 ? (
                    <p className="text-sm text-gray-500">No updates yet</p>
                  ) : (
                    liveUpdates.map((update) => (
                      <div
                        key={update.id}
                        className="border-l-4 border-blue-500 pl-3 py-1.5 bg-blue-50/40 rounded-r"
                      >
                        <p className="text-sm font-medium">{update.message}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
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
