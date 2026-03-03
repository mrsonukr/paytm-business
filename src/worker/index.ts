import { Hono } from "hono";
import { cors } from "hono/cors";

interface Env {
  DB: D1Database;
}

interface Merchant {
  id?: number;
  merchant_name: string;
  mobile_no: string;
  upi_id: string;
  merchant_key: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

interface PaymentOrder {
  id?: number;
  order_id: string;
  merchant_id: number;
  amount: number;
  status: string;
  payment_link: string;
  qr_code_data?: string;
  created_at?: string;
  updated_at?: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// GET ALL
app.get("/api/merchants", async (c) => {
  try {
    const { results } = await c.env.DB
      .prepare("SELECT * FROM merchants ORDER BY created_at DESC")
      .all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: "Failed to fetch merchants" }, 500);
  }
});

// GET ONE
app.get("/api/merchants/:id", async (c) => {
  const id = Number(c.req.param("id"));

  try {
    const merchant = await c.env.DB
      .prepare("SELECT * FROM merchants WHERE id = ?")
      .bind(id)
      .first();

    if (!merchant) {
      return c.json({ success: false, error: "Merchant not found" }, 404);
    }

    return c.json({ success: true, data: merchant });
  } catch {
    return c.json({ success: false, error: "Failed to fetch merchant" }, 500);
  }
});

// CREATE
app.post("/api/merchants", async (c) => {
  const body = await c.req.json<Merchant>();

  if (!body.merchant_name || !body.mobile_no || !body.upi_id || !body.merchant_key) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }

  const status = body.status ?? 0; // fix: default to 0 (Inactive)

  try {
    const result = await c.env.DB
      .prepare(
        `INSERT INTO merchants (merchant_name, mobile_no, upi_id, merchant_key, status)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(body.merchant_name, body.mobile_no, body.upi_id, body.merchant_key, status)
      .run();

    const insertedId = result.meta?.last_row_id;

    const merchant = await c.env.DB
      .prepare("SELECT * FROM merchants WHERE id = ?")
      .bind(insertedId)
      .first();

    return c.json({ success: true, data: merchant });
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      return c.json(
        { success: false, error: "Mobile number, UPI ID or Merchant Key already exists" },
        409
      );
    }

    return c.json({ success: false, error: "Failed to create merchant" }, 500);
  }
});

// UPDATE
app.put("/api/merchants/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<Merchant>();

  if (!body.merchant_name || !body.mobile_no || !body.upi_id || !body.merchant_key) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }

  const status = body.status ?? 0; // default to 0 (Inactive)

  try {
    const result = await c.env.DB
      .prepare(
        `UPDATE merchants
         SET merchant_name = ?, 
             mobile_no = ?, 
             upi_id = ?, 
             merchant_key = ?,
             status = ?, 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(body.merchant_name, body.mobile_no, body.upi_id, body.merchant_key, status, id)
      .run();

    if (result.meta?.changes === 0) {
      return c.json({ success: false, error: "Merchant not found" }, 404);
    }

    const merchant = await c.env.DB
      .prepare("SELECT * FROM merchants WHERE id = ?")
      .bind(id)
      .first();

    return c.json({ success: true, data: merchant });
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      return c.json(
        { success: false, error: "Mobile number, UPI ID or Merchant Key already exists" },
        409
      );
    }

    return c.json({ success: false, error: "Failed to update merchant" }, 500);
  }
});

// DELETE
app.delete("/api/merchants/:id", async (c) => {
  const id = Number(c.req.param("id"));

  try {
    const result = await c.env.DB
      .prepare("DELETE FROM merchants WHERE id = ?")
      .bind(id)
      .run();

    if (result.meta?.changes === 0) {
      return c.json({ success: false, error: "Merchant not found" }, 404);
    }

    return c.json({ success: true, message: "Merchant deleted successfully" });
  } catch {
    return c.json({ success: false, error: "Failed to delete merchant" }, 500);
  }
});

// PAYMENT ENDPOINTS

// Create payment order
app.post("/api/payment/create", async (c) => {
  const body = await c.req.json();
  const { merchant_id, amount } = body;

  if (!merchant_id || !amount) {
    return c.json({ success: false, error: "Merchant ID and amount are required" }, 400);
  }

  try {
    // Generate unique order ID
    const order_id = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get merchant details
    const merchant = await c.env.DB
      .prepare("SELECT * FROM merchants WHERE id = ?")
      .bind(merchant_id)
      .first();

    if (!merchant) {
      return c.json({ success: false, error: "Merchant not found" }, 404);
    }

    // Create payment link
    const payment_link = `https://your-domain.com/payment/${order_id}`;
    
    // Generate QR code data (UPI QR format)
    const merchantName = String(merchant.merchant_name);
    const qr_data = `upi://pay?pa=${merchant.upi_id}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${order_id}`;

    // Insert payment order
    const result = await c.env.DB
      .prepare(`
        INSERT INTO payment_orders (order_id, merchant_id, amount, status, payment_link, qr_code_data)
        VALUES (?, ?, ?, 'PENDING', ?, ?)
      `)
      .bind(order_id, merchant_id, amount, payment_link, qr_data)
      .run();

    const insertedId = result.meta?.last_row_id;

    const order: PaymentOrder = await c.env.DB
      .prepare("SELECT * FROM payment_orders WHERE id = ?")
      .bind(insertedId)
      .first() as PaymentOrder;

    return c.json({ success: true, data: order });
  } catch (error) {
    return c.json({ success: false, error: "Failed to create payment order" }, 500);
  }
});

// Get payment order details
app.get("/api/payment/:order_id", async (c) => {
  const order_id = c.req.param("order_id");

  try {
    const order = await c.env.DB
      .prepare(`
        SELECT po.*, m.merchant_name, m.upi_id, m.mobile_no
        FROM payment_orders po
        JOIN merchants m ON po.merchant_id = m.id
        WHERE po.order_id = ?
      `)
      .bind(order_id)
      .first();

    if (!order) {
      return c.json({ success: false, error: "Order not found" }, 404);
    }

    return c.json({ success: true, data: order });
  } catch (error) {
    return c.json({ success: false, error: "Failed to fetch order" }, 500);
  }
});

// Get all payment orders for a merchant
app.get("/api/payments/merchant/:merchant_id", async (c) => {
  const merchant_id = Number(c.req.param("merchant_id"));

  try {
    const { results } = await c.env.DB
      .prepare("SELECT * FROM payment_orders WHERE merchant_id = ? ORDER BY created_at DESC")
      .bind(merchant_id)
      .all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: "Failed to fetch payment orders" }, 500);
  }
});

export default app;