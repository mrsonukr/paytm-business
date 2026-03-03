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

export default app;