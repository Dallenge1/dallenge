
'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type NotificationsModalProps = {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Notifications</DialogTitle>
                    <DialogDescription>
                        Manage how you receive notifications from Dallenge.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                   <div className="flex items-center justify-between rounded-lg border p-4">
                     <div>
                        <Label htmlFor="comments-notifications">New Comments</Label>
                        <p className="text-xs text-muted-foreground">Get notified when someone comments on your posts.</p>
                     </div>
                     <Switch id="comments-notifications" defaultChecked />
                   </div>
                   <div className="flex items-center justify-between rounded-lg border p-4">
                     <div>
                        <Label htmlFor="challenges-notifications">Challenge Updates</Label>
                         <p className="text-xs text-muted-foreground">Get notified about new challenges and replies.</p>
                     </div>
                     <Switch id="challenges-notifications" defaultChecked />
                   </div>
                   <div className="flex items-center justify-between rounded-lg border p-4">
                     <div>
                        <Label htmlFor="followers-notifications">New Followers</Label>
                        <p className="text-xs text-muted-foreground">Get notified when someone new follows you.</p>
                     </div>
                     <Switch id="followers-notifications" />
                   </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onClose}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
