import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./types";
import merchantRoutes from "./routes/merchant.routes";
import paymentRoutes from "./routes/payment.routes";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// Health check endpoint
app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Mount routes
app.route("/api/merchants", merchantRoutes);
app.route("/api/payment", paymentRoutes);

export default app;