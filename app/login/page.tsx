'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError('');
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="">
          <CardTitle className="text-center">Welcome Back</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-500 bg-red-50">
              <AlertDescription className="">{error}</AlertDescription>
            </Alert>
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className=""
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className=""
          />
          <Button
            onClick={handleSubmit}
            className="w-full cursor-pointer"
            disabled={isLoading}
            variant="default"
            size="default"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
          <p className="text-sm text-center">
            No account yet?{' '}
            <Link href="/register" className="text-blue-600">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
