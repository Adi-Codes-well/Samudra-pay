// src/supabase/functions/make-server-a82c4acb/services/payment-service.ts
import Razorpay from "razorpay";
import crypto from "node:crypto";
import { DatabaseRepository } from "../repository.ts";
import { User, CarbonCredit } from "../models.ts";

const razorpay = new Razorpay({
  key_id: Deno.env.get("RAZORPAY_KEY_ID")!,
  key_secret: Deno.env.get("RAZORPAY_SECRET_KEY")!,
});
// Assuming a fixed price for credits for this demo
const CREDIT_PRICE_INR = 1250; // ₹1250 per tCO₂e

export class PaymentService {
  /**
   * Creates a Razorpay Order on the backend.
   * Calculates the amount server-side to prevent tampering.
   */
  static async createPaymentIntent(creditId: string, quantity: number, userId: string) {
    const credit = await DatabaseRepository.getCarbonCredit(creditId);
    if (!credit) {
      throw new Error("Credit not found in registry");
    }

    // Amount is in paise for Razorpay, hence multiply by 100
    const amount = credit.amount * CREDIT_PRICE_INR * 100;

    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { creditId, quantity: String(quantity), userId },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  }

  /**
   * Verifies the Razorpay webhook signature.
   * This is the most critical security step for confirming payment success.
   */
  static verifyWebhook(body: string, signature: string) {
    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;
    const hmac = crypto.createHHmac("sha256", secret);
    hmac.update(body);
    const generatedSignature = hmac.digest("hex");

    return generatedSignature === signature;
  }
}