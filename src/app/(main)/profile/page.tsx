
'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Upload, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import React, { useState } from 'react';

const profileFormSchema = z.object({
  displayName: z.string().min(1, 'Display name is required.'),
  phone: z.string().optional(),
  dob: z.date().optional(),
  bio: z.string().max(200, "Bio can't be longer than 200 characters.").optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, updateUserPhoto, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      phone: user?.phoneNumber ?? '',
      bio: 'Lover of technology, wellness, and continuous learning. Excited to be on the DAWION platform!',
      dob: user?.metadata.creationTime ? new Date(user.metadata.creationTime) : undefined,
    },
  });
  
  const { watch } = form;
  const bioValue = watch('bio');
  const dobValue = watch('dob');


  const onProfileSubmit = (data: ProfileFormValues) => {
    console.log(data);
    toast({
      title: 'Profile Updated',
      description: 'Your personal information has been updated.',
    });
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploading(true);
      try {
        await updateUserPhoto(file);
        toast({
          title: 'Success',
          description: 'Profile picture updated successfully!',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      } finally {
        setIsUploading(false);
         if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const isLoading = authLoading || isUploading;

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-background ring-2 ring-primary">
            <AvatarImage src={user?.photoURL ?? undefined} />
            <AvatarFallback className="text-3xl">
              {user?.displayName?.charAt(0).toUpperCase() ??
                user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={handleAvatarClick}
            className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            disabled={isLoading}
          >
             {isUploading ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-white" />
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            className="hidden"
            accept="image/png, image/jpeg"
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {user?.displayName}
          </h1>
          <p className="text-muted-foreground">{user?.email}</p>
          {bioValue && <p className="text-sm max-w-prose mt-2">{bioValue}</p>}
           {dobValue && <p className="text-sm text-muted-foreground">Born {format(dobValue, 'MMMM d, yyyy')}</p>}
        </div>
      </header>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
             <CardHeader className="p-0">
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                  Update your display name and other personal details.
                </CardDescription>
              </CardHeader>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-none shadow-none">
              <CardContent className="pt-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onProfileSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your display name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="Your phone number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                captionLayout="dropdown-buttons"
                                fromYear={1900}
                                toYear={new Date().getFullYear()}
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date('1900-01-01')
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us a little bit about yourself"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit">Save Changes</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
           <AccordionTrigger>
             <CardHeader className="p-0">
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  For your security, use a strong password.
                </CardDescription>
              </CardHeader>
          </AccordionTrigger>
          <AccordionContent>
             <Card className="border-none shadow-none">
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                 <Button>Change Password</Button>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
         <AccordionItem value="item-3" className="border-b-0">
           <AccordionTrigger>
             <CardHeader className="p-0">
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data.
                </CardDescription>
              </CardHeader>
          </AccordionTrigger>
          <AccordionContent>
             <Card className="border-none shadow-none">
              <CardContent className="pt-6">
                <p className="mb-4 text-sm text-muted-foreground">
                    This action cannot be undone. This will permanently delete your account, and remove your data from our servers.
                </p>
                <Button variant="destructive">Delete My Account</Button>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

    