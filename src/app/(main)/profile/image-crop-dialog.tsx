
'use client';

import React from 'react';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ImageCropDialogProps {
  imageSrc: string;
  crop: Point;
  zoom: number;
  setCrop: (point: Point) => void;
  setZoom: (zoom: number) => void;
  onCroppedAreaChange: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onClose: () => void;
  onSave: () => void;
  isLoading: boolean;
}

const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  imageSrc,
  crop,
  zoom,
  setCrop,
  setZoom,
  onCroppedAreaChange,
  onClose,
  onSave,
  isLoading,
}) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] md:sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crop Your Profile Picture</DialogTitle>
           <DialogDescription>
            Adjust the image to get the perfect crop for your new avatar.
          </DialogDescription>
        </DialogHeader>
        <div className="relative h-80 w-full bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCroppedAreaChange}
            cropShape="round"
            showGrid={false}
          />
        </div>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="zoom">Zoom</Label>
            <Slider
              id="zoom"
              min={1}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;

    