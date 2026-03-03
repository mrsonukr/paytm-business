import { Hono } from "hono";
import { cors } from "hono/cors";

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// ================= MERCHANT APIs =================

// GET ALL
app.get("/api/merchants", async (c) => {
  try {
    const result = await c.env.DB
      .prepare("SELECT * FROM merchants ORDER BY created_at DESC")
      .all();

    return c.json({ success: true, data: result.results });
  } catch {
    return c.json({ success: false }, 500);
  }
});

// CREATE
app.post("/api/merchants", async (c) => {
  const body = await c.req.json<any>();

  if (!body.merchant_name || !body.mobile_no || !body.upi_id || !body.merchant_key) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }

  try {
    const insert = await c.env.DB
      .prepare(
        `INSERT INTO merchants 
        (merchant_name, mobile_no, upi_id, merchant_key, status)
        VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        body.merchant_name,
        body.mobile_no,
        body.upi_id,
        body.merchant_key,
        body.status ?? 0
      )
      .run();

    const merchant = await c.env.DB
      .prepare("SELECT * FROM merchants WHERE id = ?")
      .bind(insert.meta?.last_row_id)
      .first();

    return c.json({ success: true, data: merchant });
  } catch (e: any) {
    if (e.message?.includes("UNIQUE")) {
      return c.json({ success: false, error: "Duplicate data" }, 409);
    }
    return c.json({ success: false }, 500);
  }
});

// ================= PAYMENT APIs =================

// CREATE PAYMENT
app.post("/api/payment/create", async (c) => {
  const body = await c.req.json<any>();

  if (!body.merchant_id || !body.amount) {
    return c.json({ success: false, error: "Missing fields" }, 400);
  }

  try {
    const order_id =
      "ORD_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 10);

    const payment_id =
      Math.random().toString(36).slice(2, 18) +
      Math.random().toString(36).slice(2, 18);

    const merchant: any = await c.env.DB
      .prepare("SELECT * FROM merchants WHERE id = ?")
      .bind(body.merchant_id)
      .first();

    if (!merchant) {
      return c.json({ success: false, error: "Merchant not found" }, 404);
    }

    const qr_data = `upi://pay?pa=${merchant.upi_id}&pn=${encodeURIComponent(
      merchant.merchant_name
    )}&am=${body.amount}&cu=INR&tn=${order_id}`;

    const paytmResponse = {
      success: true,
      orderId: payment_id,
      amount: body.amount.toString(),
    };

    await c.env.DB
      .prepare(
        `INSERT INTO payment_orders
        (order_id, merchant_id, amount, status, payment_link, qr_code_data)
        VALUES (?, ?, ?, 'PENDING', ?, ?)`
      )
      .bind(
        order_id,
        body.merchant_id,
        body.amount,
        JSON.stringify(paytmResponse),
        qr_data
      )
      .run();

    return c.json({
      success: true,
      data: {
        order_id,
        payment_id,
      },
    });
  } catch {
    return c.json({ success: false }, 500);
  }
});

// GET PAYMENT
app.get("/api/payment/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const order: any = await c.env.DB
      .prepare("SELECT * FROM payment_orders WHERE order_id = ?")
      .bind(id)
      .first();

    if (!order) {
      return c.json({ success: false, error: "Not found" }, 404);
    }

    const merchant: any = await c.env.DB
      .prepare("SELECT * FROM merchants WHERE id = ?")
      .bind(order.merchant_id)
      .first();

    return c.json({
      success: true,
      data: {
        ...order,
        merchant_name: merchant?.merchant_name,
        upi_id: merchant?.upi_id,
      },
    });
  } catch {
    return c.json({ success: false }, 500);
  }
});

export default app;