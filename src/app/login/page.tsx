
'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();

  // Effect to redirect if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);


  // This loading state is for the AuthProvider initial check, not form submission
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }
  
  // If user becomes available after loading and effect hasn't redirected yet
  if (user) {
    return null; // Or another loading/redirect indicator
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-2xl border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            {isLoginView ? 'Welcome Back' : 'Join Street Empire'}
          </CardTitle>
          <CardDescription className="text-muted-foreground pt-1">
            {isLoginView ? 'Sign in to continue your hustle.' : 'Create an account to start your empire.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {isLoginView ? <LoginForm /> : <SignupForm />}
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsLoginView(!isLoginView)}
              className="text-sm text-accent hover:text-accent/90"
            >
              {isLoginView ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

