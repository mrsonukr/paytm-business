import { Hono } from "hono";
import { PaymentService } from "../services/payment.service";
import { PaymentCreateRequest, Env } from "../types";

const paymentRoutes = new Hono<{ Bindings: Env }>();

// Create payment order
paymentRoutes.post("/create", async (c) => {
  const body = await c.req.json<PaymentCreateRequest>();
  const result = await PaymentService.createPaymentOrder(c.env.DB, body);
  if (result.success) {
    return c.json(result);
  }
  return c.json(result, 500);
});

// Get payment order details by payment_id
paymentRoutes.get("/:payment_id", async (c) => {
  const payment_id = c.req.param("payment_id");
  const result = await PaymentService.getPaymentByPaymentId(c.env.DB, payment_id);
  if (result.success) {
    return c.json(result);
  }
  return c.json(result, result.error?.includes("not found") ? 404 : 500);
});

// Get all payment orders for a merchant
paymentRoutes.get("/merchant/:merchant_id", async (c) => {
  const merchant_id = Number(c.req.param("merchant_id"));
  const result = await PaymentService.getPaymentsByMerchantId(c.env.DB, merchant_id);
  if (result.success) {
    return c.json(result);
  }
  return c.json(result, 500);
});

export default paymentRoutes;
