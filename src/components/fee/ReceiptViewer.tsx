import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Printer, AlertCircle } from 'lucide-react';
import { feeApi } from '@/services/api';
import { showApiError } from '@/lib/api-toast';
import { toast } from 'sonner';

interface ReceiptViewerProps {
  paymentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Receipt {
  _id: string;
  receiptNumber: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
  remarks?: string;
  schoolName: string;
  academicYear?: string;
}

const ReceiptViewer = ({ paymentId, open, onOpenChange }: ReceiptViewerProps) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: receipt, isLoading, error } = useQuery({
    queryKey: ['fee-receipt', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;
      try {
        const res = await feeApi.getReceiptById(paymentId);
        return res.data?.data;
      } catch (err) {
        showApiError(err);
        return null;
      }
    },
    enabled: open && !!paymentId,
  });

  const handlePrint = () => {
    if (!receipt) return;
    setIsPrinting(true);
    
    // Use window.print() for print functionality
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownloadPDF = async () => {
    if (!receipt) return;
    
    try {
      setIsDownloading(true);
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Receipt - ${receipt.receiptNumber}</title>
            <style>
              * { margin: 0; padding: 0; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #333;
                background: white;
                padding: 20px;
              }
              .receipt-container {
                max-width: 800px;
                margin: 0 auto;
                border: 1px solid #ddd;
                padding: 40px;
                background: white;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #000;
                padding-bottom: 15px;
              }
              .school-name {
                font-size: 24px;
                font-weight: bold;
                color: #1a3a52;
              }
              .receipt-title {
                font-size: 18px;
                font-weight: bold;
                margin-top: 10px;
                color: #1a3a52;
              }
              .receipt-number {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
              }
              .section {
                margin: 20px 0;
              }
              .section-title {
                font-weight: bold;
                font-size: 12px;
                text-transform: uppercase;
                color: #1a3a52;
                margin-bottom: 10px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
              }
              .row {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
                font-size: 13px;
              }
              .label {
                font-weight: 600;
                color: #555;
                width: 40%;
              }
              .value {
                text-align: right;
                width: 60%;
              }
              .amount-section {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 4px;
                margin: 20px 0;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                font-size: 16px;
                font-weight: bold;
                color: #1a3a52;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 2px solid #1a3a52;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 11px;
                color: #999;
                border-top: 1px solid #ddd;
                padding-top: 15px;
              }
              .status-badge {
                display: inline-block;
                background: #4caf50;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: bold;
                margin-left: 10px;
              }
              @media print {
                body { padding: 0; }
                .receipt-container { border: none; }
                @page { margin: 10mm; }
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <div class="header">
                <div class="school-name">${receipt.schoolName || 'School Name'}</div>
                <div class="receipt-title">FEE RECEIPT<span class="status-badge">PAID</span></div>
                <div class="receipt-number">Receipt #${receipt.receiptNumber}</div>
              </div>

              <div class="section">
                <div class="section-title">Student Information</div>
                <div class="row">
                  <span class="label">Student Name:</span>
                  <span class="value">${receipt.studentName || '-'}</span>
                </div>
                <div class="row">
                  <span class="label">Admission Number:</span>
                  <span class="value">${receipt.admissionNumber || '-'}</span>
                </div>
                <div class="row">
                  <span class="label">Class:</span>
                  <span class="value">${receipt.className || '-'}</span>
                </div>
                <div class="row">
                  <span class="label">Academic Year:</span>
                  <span class="value">${receipt.academicYear || '-'}</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Payment Details</div>
                <div class="row">
                  <span class="label">Payment Date:</span>
                  <span class="value">${new Date(receipt.paymentDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="row">
                  <span class="label">Payment Method:</span>
                  <span class="value">${(receipt.paymentMethod || 'Cash').toUpperCase()}</span>
                </div>
                ${receipt.transactionId ? `
                <div class="row">
                  <span class="label">Transaction ID:</span>
                  <span class="value">${receipt.transactionId}</span>
                </div>
                ` : ''}
              </div>

              <div class="amount-section">
                <div class="row">
                  <span class="label">Amount Received:</span>
                  <span class="value">₹ ${Number(receipt.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="total-row">
                  <span>TOTAL AMOUNT PAID:</span>
                  <span>₹ ${Number(receipt.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              ${receipt.remarks ? `
              <div class="section">
                <div class="section-title">Remarks</div>
                <div class="row">
                  <span class="value">${receipt.remarks}</span>
                </div>
              </div>
              ` : ''}

              <div class="footer">
                <p>This is a computer-generated receipt. No signature required.</p>
                <p style="margin-top: 5px;">Generated on ${new Date().toLocaleString('en-IN')}</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receipt.receiptNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Receipt downloaded successfully');
    } catch (err) {
      showApiError(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fee Receipt</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error || !receipt ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold">Failed to load receipt</p>
            <p className="text-sm text-muted-foreground">
              Receipt details could not be retrieved
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Receipt Preview */}
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="text-center mb-6 pb-4 border-b-2">
                <h2 className="text-2xl font-bold text-blue-900">
                  {receipt.schoolName || 'School Name'}
                </h2>
                <h3 className="text-lg font-semibold text-gray-800 mt-2">FEE RECEIPT</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Receipt #{receipt.receiptNumber}
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Student Information</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-600">Student Name</p>
                      <p className="font-medium">{receipt.studentName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Admission No.</p>
                      <p className="font-medium">{receipt.admissionNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Class</p>
                      <p className="font-medium">{receipt.className || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Academic Year</p>
                      <p className="font-medium">{receipt.academicYear || '-'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Payment Details</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-600">Payment Date</p>
                      <p className="font-medium">
                        {new Date(receipt.paymentDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment Method</p>
                      <Badge variant="secondary">
                        {(receipt.paymentMethod || 'Cash').toUpperCase()}
                      </Badge>
                    </div>
                    {receipt.transactionId && (
                      <div className="col-span-2">
                        <p className="text-gray-600">Transaction ID</p>
                        <p className="font-mono text-sm">{receipt.transactionId}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Amount Received:</span>
                    <span className="text-lg font-bold text-blue-900">
                      ₹{Number(receipt.amount || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {receipt.remarks && (
                  <div>
                    <p className="text-gray-600">Remarks</p>
                    <p className="text-gray-800">{receipt.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={isLoading || !receipt || isPrinting}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isLoading || !receipt || isDownloading}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptViewer;
