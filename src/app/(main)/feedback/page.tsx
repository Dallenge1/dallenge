
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { submitFeedback } from '@/app/actions';

const feedbackFormSchema = z.object({
  category: z.string({
    required_error: 'Please select a category.',
  }),
  message: z
    .string()
    .min(10, {
      message: 'Feedback must be at least 10 characters.',
    })
    .max(1000, {
      message: 'Feedback must not be longer than 1000 characters.',
    }),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

export default function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      message: '',
    },
  });

  function onSubmit(data: FeedbackFormValues) {
    if (!user) return;
    startTransition(async () => {
      try {
        await submitFeedback({
            ...data,
            userId: user.uid,
            userDisplayName: user.displayName || 'Anonymous',
        });
        toast({
          title: 'Feedback Submitted',
          description: "Thank you for your feedback! We've received your message.",
        });
        form.reset();
      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: 'Could not submit your feedback. Please try again.',
        });
      }
    });
  }

  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Submit Feedback</h1>
        <p className="text-muted-foreground">
          We'd love to hear your thoughts. Let us know how we can improve.
        </p>
      </header>
      <Card className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Feedback Form</CardTitle>
              <CardDescription>
                Your feedback is valuable to us.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a feedback category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bug-report">Bug Report</SelectItem>
                        <SelectItem value="feature-request">
                          Feature Request
                        </SelectItem>
                        <SelectItem value="general-feedback">
                          General Feedback
                        </SelectItem>
                        <SelectItem value="ui-ux">UI/UX Suggestion</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your experience, what you liked, or what could be better..."
                        className="resize-y min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending || !user}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
