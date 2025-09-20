
'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download } from "lucide-react";

type PrivacyDataModalProps = {
    isOpen: boolean;
    onClose: () => void;
}

export default function PrivacyDataModal({ isOpen, onClose }: PrivacyDataModalProps) {

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Privacy & Data</DialogTitle>
                    <DialogDescription>
                        Manage how your data is used and seen by others.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                   <div className="flex items-center justify-between rounded-lg border p-4">
                     <div>
                        <Label htmlFor="private-account">Private Account</Label>
                        <p className="text-xs text-muted-foreground">When your account is private, only people you approve can see your posts.</p>
                     </div>
                     <Switch id="private-account" />
                   </div>
                   <div className="space-y-2 rounded-lg border p-4">
                        <Label>Download Your Data</Label>
                        <p className="text-xs text-muted-foreground">
                            You can request a file of your information, like your posts and profile data.
                        </p>
                        <Button variant="secondary" className="w-full mt-2">
                           <Download className="mr-2 h-4 w-4" />
                           Request Data File
                        </Button>
                   </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
