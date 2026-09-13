import crypto from "crypto";
import axios from "axios";
import { PLANS } from "../config/plans.js";
import Payment from "../models/payment.model.js";
import razorpay from "../config/razorpay.js";
import redis from "../../../shared/redis/redis.js"; // adjust path to your redis client instance

export const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({ message: "User ID not found in headers" });
    }

    const selectedPlan = PLANS[plan];
    if (!selectedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const order = await razorpay.orders.create({
      amount: selectedPlan.amount * 100,
      currency: "INR",
      receipt: `receipt-${Date.now()}`,
    });

    await Payment.create({
      userId,
      orderId: order.id,
      amount: selectedPlan.amount,
      credits: selectedPlan.credits,
      plan: selectedPlan.id,
      currency: order.currency,
      status: "created",
    });

    return res.status(200).json({ order, plan: selectedPlan });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ message: `Create order error: ${error.message}` });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1. Validate signature against secrets
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: "failed", paymentId: razorpay_payment_id }
      );
      return res.status(400).json({ message: "Payment verification failed: Invalid signature" });
    }

    // 2. Authoritative check: Ensure payment is actually captured
    const paymentRecord = await razorpay.payments.fetch(razorpay_payment_id);
    if (paymentRecord.status !== "captured") {
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: paymentRecord.status, paymentId: razorpay_payment_id }
      );
      return res.status(400).json({
        message: `Payment not captured. Current status: ${paymentRecord.status}`,
      });
    }

    // 3. Prevent duplicate credit assignments
    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (payment.status === "paid") {
      return res.status(200).json({ message: "Payment already verified and processed" });
    }

    payment.status = "paid";
    payment.paymentId = razorpay_payment_id;
    await payment.save();

    // 4. Propagate updates to Auth service
    const authResponse = await axios.post(`${process.env.AUTH_SERVICE_URL}/auth/update-plan`, {
      userId: payment.userId,
      plan: payment.plan,
      credits: payment.credits,
    });

    // 5. Invalidate/update Redis cache so Drawer displays updated stats instantly
    try {
      const userSession = await redis.get(`user-session-${payment.userId}`);
      if (userSession) {
        const { sessionId } = JSON.parse(userSession);
        const sessionData = await redis.get(`session-${sessionId}`);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          parsed.plan = payment.plan;
          parsed.credits = (parsed.credits || 0) + payment.credits;
          parsed.totalCredits = (parsed.totalCredits || 0) + payment.credits;

          await redis.set(`session-${sessionId}`, JSON.stringify(parsed), "KEEPTTL");
        }
      }
    } catch (cacheError) {
      console.warn("Session cache sync failed:", cacheError.message);
    }

    return res.status(200).json({
      message: "Payment Verified",
      user: authResponse.data?.user,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ message: `Verify payment error: ${error.message}` });
  }
};