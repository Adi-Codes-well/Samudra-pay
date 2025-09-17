import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { CreditCard, CheckCircle } from 'lucide-react';
import { CarbonCredit } from '../../../types/dashboard';
import { getHealthScoreColor } from '../../../utils/formatters';
import PaymentForm from './PaymentForm';
import { ApiService } from '../../../utils/frontend/api-service';
import { toast } from 'sonner';

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credit: CarbonCredit | null;
  purchaseAmount: number;
  onPurchaseAmountChange: (amount: number) => void;
  onPurchaseSuccess: () => void;
}

export function PurchaseDialog({
  open,
  onOpenChange,
  credit,
  purchaseAmount,
  onPurchaseAmountChange,
  onPurchaseSuccess
}: PurchaseDialogProps) {
  const [step, setStep] = useState('selection');
  const [paymentData, setPaymentData] = useState<{ orderId: string, amount: number, currency: string } | null>(null);

  const handleCreatePaymentIntent = async () => {
    if (!credit) return;

    try {
      const response = await ApiService.createPaymentIntent(credit.id, purchaseAmount);
      setPaymentData(response);
      setStep('payment');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  const handlePaymentSuccess = () => {
    // Razorpay webhook handles the final credit transfer,
    // so we just update the UI and refresh data.
    setStep('success');
    onPurchaseSuccess();
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep('selection');
    }
    onOpenChange(open);
  };
  
  if (!credit) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Purchase Carbon Credits</DialogTitle>
          <DialogDescription>
            {step === 'selection' && `Purchase verified blue carbon credits from Project ${credit.projectId.slice(-8)}`}
            {step === 'payment' && `Confirm your payment of ₹${(purchaseAmount * 1250).toFixed(2)}`}
            {step === 'success' && `Purchase completed successfully.`}
          </DialogDescription>
        </DialogHeader>
        
        {/* Step 1: Credit Selection */}
        {step === 'selection' && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Available Credits</p>
                  <p className="font-semibold">{credit.amount.toLocaleString()} tCO₂e</p>
                </div>
                <div>
                  <p className="text-gray-600">Quality Score</p>
                  <p className={`font-semibold ${getHealthScoreColor(credit.healthScore)}`}>
                    {(credit.healthScore * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="purchaseAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Select Amount to Purchase
              </label>
              <input
                id="purchaseAmount"
                type="number"
                min={1}
                max={credit.amount}
                value={purchaseAmount}
                onChange={e => onPurchaseAmountChange(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">Max: {credit.amount.toLocaleString()} tCO₂e</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-sm">
              <p className="font-medium text-yellow-800">Purchase Summary</p>
              <p className="text-yellow-700 mt-1">
                Purchasing {purchaseAmount.toLocaleString()} tCO₂e credits
              </p>
              <p className="text-yellow-700">
                Estimated cost: ₹{(purchaseAmount * 1250).toLocaleString()}
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePaymentIntent} 
                disabled={purchaseAmount < 1 || purchaseAmount > credit.amount}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Payment
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Form */}
        {step === 'payment' && paymentData && (
          <PaymentForm 
            amount={paymentData.amount}
            orderId={paymentData.orderId}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setStep('selection')}
          />
        )}
        
        {/* Step 3: Success Confirmation (optional, since the dialog closes) */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <p className="text-xl font-semibold text-gray-800">Purchase Successful!</p>
            <p className="text-gray-600 mt-2">The credits will be assigned to your account shortly.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}