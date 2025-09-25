
'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from '@/components/providers/auth-provider';
import { deleteUserAccount } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

type DangerZoneModalProps = {
    isOpen: boolean;
    onClose: () => void;
}

export default function DangerZoneModal({ isOpen, onClose }: DangerZoneModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [confirmationText, setConfirmationText] = useState('');

    const handleDelete = () => {
        if (!user || confirmationText !== 'DELETE') {
            toast({
                variant: 'destructive',
                title: 'Confirmation failed',
                description: 'Please type DELETE to confirm account deletion.',
            });
            return;
        }

        startTransition(async () => {
            try {
                await deleteUserAccount(user.uid);
                toast({
                    title: 'Account Deleted',
                    description: 'Your account has been permanently deleted.',
                });
                router.push('/');
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Deletion Failed',
                    description: 'Could not delete your account. Please try again.',
                });
            }
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-destructive">Danger Zone</DialogTitle>
                    <DialogDescription>
                        This action is irreversible. Are you sure you want to permanently delete your account?
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This will permanently delete your account, posts, and all associated data from our servers. This action cannot be undone.
                    </p>
                    <div className='space-y-2'>
                        <Label htmlFor='delete-confirm'>Please type <strong className='text-destructive'>DELETE</strong> to confirm.</Label>
                        <Input
                            id='delete-confirm'
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            disabled={isPending}
                            autoComplete='off'
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isPending || confirmationText !== 'DELETE'}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPending ? 'Deleting...' : 'Delete My Account'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
