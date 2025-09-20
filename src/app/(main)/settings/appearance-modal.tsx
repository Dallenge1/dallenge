
'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Moon } from "lucide-react";

type AppearanceModalProps = {
    isOpen: boolean;
    onClose: () => void;
}

export default function AppearanceModal({ isOpen, onClose }: AppearanceModalProps) {

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Appearance</DialogTitle>
                    <DialogDescription>
                        Customize the look and feel of the app.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Label>Theme</Label>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-2">
                           <Moon className="h-5 w-5" />
                           <span className="font-semibold">Dark Mode</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Enabled</span>
                    </div>
                     <p className="text-sm text-muted-foreground">
                        The application is currently set to dark mode only.
                    </p>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
