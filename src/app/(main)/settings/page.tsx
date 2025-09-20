
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Lock, ShieldAlert, Bell, Palette, DatabaseZap } from 'lucide-react';
import EditProfileModal from './edit-profile-modal';
import ChangePasswordModal from './change-password-modal';
import DangerZoneModal from './danger-zone-modal';

const profileFormSchema = z.object({
  displayName: z.string().min(1, 'Display name is required.'),
  phone: z.string().optional(),
  dob: z.date().optional(),
  bio: z.string().max(200, "Bio can't be longer than 200 characters.").optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState<'edit' | 'password' | 'danger' | 'notifications' | 'appearance' | 'privacy' | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName ?? '',
        phone: (user as any).phone ?? '', // Custom data might not be on the type
        bio: (user as any).bio ?? 'Lover of technology, wellness, and continuous learning. Excited to be on the Dallenge platform!',
        dob: (user as any).dob ? new Date((user as any).dob) : (user.metadata.creationTime ? new Date(user.metadata.creationTime) : undefined),
      });
    }
  }, [user, form]);

  const onProfileSubmit = (data: ProfileFormValues) => {
    startTransition(async () => {
      try {
        await updateUserProfile(data);
        toast({
          title: 'Profile Updated',
          description: 'Your personal information has been updated.',
        });
        setModalOpen(null);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    });
  };

  const isMutationPending = isPending || authLoading;

  const settingsCards = [
    { id: 'edit', icon: User, title: 'Edit Profile', description: 'Update your personal details.', modal: <EditProfileModal isOpen={modalOpen === 'edit'} onClose={() => setModalOpen(null)} onSubmit={onProfileSubmit} isPending={isMutationPending} form={form} /> },
    { id: 'password', icon: Lock, title: 'Change Password', description: 'Update your security.', modal: <ChangePasswordModal isOpen={modalOpen === 'password'} onClose={() => setModalOpen(null)} /> },
    { id: 'notifications', icon: Bell, title: 'Notifications', description: 'Manage your notification settings.' },
    { id: 'appearance', icon: Palette, title: 'Appearance', description: 'Customize the look and feel.' },
    { id: 'privacy', icon: DatabaseZap, title: 'Privacy & Data', description: 'Manage how your data is used.' },
    { id: 'danger', icon: ShieldAlert, title: 'Danger Zone', description: 'Permanently delete account.', destructive: true, modal: <DangerZoneModal isOpen={modalOpen === 'danger'} onClose={() => setModalOpen(null)} /> },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCards.map(card => (
          <React.Fragment key={card.id}>
            <Card onClick={() => setModalOpen(card.id as any)} className={`cursor-pointer transition-colors ${card.destructive ? 'hover:bg-destructive/10' : 'hover:bg-muted/50'}`}>
              <CardHeader className="flex flex-row items-center gap-4">
                <card.icon className={`w-8 h-8 ${card.destructive ? 'text-destructive' : 'text-primary'}`} />
                <div>
                  <CardTitle className={card.destructive ? 'text-destructive' : ''}>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
            {card.modal}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
