
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { navigateToDashboard } from '@/app/actions';


const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type SignupFormInputs = z.infer<typeof formSchema>;


export default function SignupPage() {
  const { signUp, loading } = useAuth();
  const { toast } = useToast();

  const form = useForm<SignupFormInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    try {
      await signUp(data.email, data.password, data.firstName, data.lastName);
      toast({
        title: 'Success',
        description: 'Account created successfully!',
      });
      await navigateToDashboard();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>
              Enter your information to create an account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Max" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Robinson" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </CardContent>
          <CardFooter className="flex flex-col">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create an account'}
              </Button>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline">
                  Sign in
                </Link>
              </div>
          </CardFooter>
        </form>
      </Form>
      </Card>
    </div>
  );
}
