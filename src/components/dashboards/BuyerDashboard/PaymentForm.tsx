// src/components/dashboards/BuyerDashboard/PaymentForm.tsx
"use client";

import React from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { toast } from 'sonner';

type PaymentFormProps = {
  amount: number;
  orderId: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
};

// This component assumes you have added the Razorpay script to your index.html
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentForm({ amount, orderId, onSuccess, onCancel }: PaymentFormProps) {
  const [loading, setLoading] = React.useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!window.Razorpay) {
      toast.error("Razorpay is not loaded. Please try again later.");
      setLoading(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amount,
      currency: "INR",
      name: "Samudra Ledger",
      description: "Purchase of Carbon Credits",
      order_id: orderId,
      handler: function(response: any) {
        onSuccess(response.razorpay_payment_id);
      },
      modal: {
        ondismiss: function() {
          toast.info("Payment was cancelled.");
          setLoading(false);
          onCancel();
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <Card className="p-4">
      <CardContent>
        <form onSubmit={handlePayment} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center text-lg font-bold">
            Pay ₹{(amount / 100).toFixed(2)}
          </div>
          <p className="text-sm text-center text-gray-600">
            Click the button below to open the Razorpay payment form.
          </p>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Loading..." : "Proceed to Razorpay"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}