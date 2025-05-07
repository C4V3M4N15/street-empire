
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus } from 'lucide-react';

const signupSchema = z.object({
  username: z.string().min(3, {message: 'Username must be at least 3 characters'}).max(20, {message: 'Username must be at most 20 characters'}),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignupFormInputs = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: data.username });
      }
      toast({
        title: 'Signup Successful',
        description: 'Welcome to Street Empire! You can now login.',
      });
      // Redirect to login, so user explicitly logs in after signup
      router.push('/login'); 
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = 'An unexpected error occurred.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login or use a different email.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: 'Signup Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="username-signup">Username</Label>
        <Input
          id="username-signup"
          type="text"
          {...register('username')}
          className={errors.username ? 'border-destructive' : ''}
          placeholder="YourInGameName"
          autoComplete="username"
        />
        {errors.username && <p className="text-xs text-destructive mt-1">{errors.username.message}</p>}
      </div>
      <div>
        <Label htmlFor="email-signup">Email</Label>
        <Input
          id="email-signup"
          type="email"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
          placeholder="you@example.com"
          autoComplete="email"
        />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password-signup">Password</Label>
        <Input
          id="password-signup"
          type="password"
          {...register('password')}
          className={errors.password ? 'border-destructive' : ''}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" />
        )}
        Sign Up
      </Button>
    </form>
  );
}
