import { Hono } from "hono";
import { MerchantService } from "../services/merchant.service";
import { Merchant, Env } from "../types";

const merchantRoutes = new Hono<{ Bindings: Env }>();

// GET ALL
merchantRoutes.get("/", async (c) => {
  const result = await MerchantService.getAllMerchants(c.env.DB);
  if (result.success) {
    return c.json(result);
  }
  return c.json(result, 500);
});

// GET ONE
merchantRoutes.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await MerchantService.getMerchantById(c.env.DB, id);
  if (result.success) {
    return c.json(result);
  }
  return c.json(result, 404);
});

// CREATE
merchantRoutes.post("/", async (c) => {
  const merchant = await c.req.json<Merchant>();
  const result = await MerchantService.createMerchant(c.env.DB, merchant);
  if (result.success) {
    return c.json(result);
  }
  return c.json(result, result.error?.includes("already exists") ? 409 : 500);
});

// UPDATE
merchantRoutes.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const merchant = await c.req.json<Merchant>();
  const result = await MerchantService.updateMerchant(c.env.DB, id, merchant);
  if (result.success) {
    return c.json(result);
  }
  return c.json(result, result.error?.includes("not found") ? 404 : 500);
});

// DELETE
merchantRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await MerchantService.deleteMerchant(c.env.DB, id);
  if (result.success) {
    return c.json(result);
  }
  return c.json(result, result.error?.includes("not found") ? 404 : 500);
});

export default merchantRoutes;
