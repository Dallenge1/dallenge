
'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type DangerZoneModalProps = {
    isOpen: boolean;
    onClose: () => void;
}

export default function DangerZoneModal({ isOpen, onClose }: DangerZoneModalProps) {

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-destructive">Danger Zone</DialogTitle>
                    <DialogDescription>
                        This action is irreversible. Are you sure you want to permanently delete your account?
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        This will permanently delete your account, posts, and all associated data from our servers. This action cannot be undone.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive">Delete My Account</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
