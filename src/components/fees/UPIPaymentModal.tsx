import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { QrCode, Upload } from 'lucide-react';

interface UPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeAmount: number;
  feeName: string;
  studentName: string;
  onConfirm: (utrNumber: string) => void;
}

export const UPIPaymentModal = ({
  isOpen,
  onClose,
  feeAmount,
  feeName,
  studentName,
  onConfirm,
}: UPIPaymentModalProps) => {
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!utrNumber || utrNumber.length < 8) {
      toast.error('Please enter a valid 12-digit UTR or Transaction ID');
      return;
    }
    
    setIsSubmitting(true);
    // Simulate network delay
    setTimeout(() => {
      setIsSubmitting(false);
      onConfirm(utrNumber);
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Fee via UPI</DialogTitle>
          <DialogDescription>
            Scan the QR code below using any UPI app (PhonePe, GPay, Paytm) to pay for {studentName}'s {feeName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Amount to Pay</p>
            <p className="text-4xl font-bold text-primary">₹{feeAmount.toLocaleString('en-IN')}</p>
          </div>

          {/* Placeholder for actual QR code */}
          <div className="p-4 bg-white border rounded-xl shadow-sm">
            <div className="w-48 h-48 bg-slate-100 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg">
              <QrCode className="w-16 h-16 text-slate-400 mb-2" />
              <p className="text-xs text-slate-500 font-medium">Scan to Pay</p>
            </div>
          </div>
          
          <div className="text-sm font-medium text-muted-foreground bg-slate-100 px-4 py-2 rounded-full">
            UPI ID: schoolname@sbi
          </div>

          <div className="w-full space-y-3 pt-4 border-t">
            <div className="space-y-1">
              <Label htmlFor="utr">Enter UTR / Transaction ID</Label>
              <p className="text-xs text-muted-foreground">After successful payment, enter the 12-digit UTR number here.</p>
            </div>
            <Input
              id="utr"
              placeholder="e.g. 312345678901"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="font-mono text-center tracking-widest text-lg"
              maxLength={12}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || utrNumber.length < 8}>
            {isSubmitting ? 'Verifying...' : 'Submit Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
