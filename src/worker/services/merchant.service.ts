import { Merchant } from '../types';

export class MerchantService {
  static async getAllMerchants(db: D1Database) {
    try {
      const { results } = await db
        .prepare("SELECT * FROM merchants ORDER BY created_at DESC")
        .all();
      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: "Failed to fetch merchants" };
    }
  }

  static async getMerchantById(db: D1Database, id: number) {
    try {
      const merchant = await db
        .prepare("SELECT * FROM merchants WHERE id = ?")
        .bind(id)
        .first();

      if (!merchant) {
        return { success: false, error: "Merchant not found" };
      }

      return { success: true, data: merchant };
    } catch {
      return { success: false, error: "Failed to fetch merchant" };
    }
  }

  static async createMerchant(db: D1Database, merchant: Merchant) {
    if (!merchant.merchant_name || !merchant.mobile_no || !merchant.upi_id || !merchant.merchant_key) {
      return { success: false, error: "Missing required fields" };
    }

    const status = merchant.status ?? 0; // default to 0 (Inactive)

    try {
      const result = await db
        .prepare(
          `INSERT INTO merchants (merchant_name, mobile_no, upi_id, merchant_key, status)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(merchant.merchant_name, merchant.mobile_no, merchant.upi_id, merchant.merchant_key, status)
        .run();

      const insertedId = result.meta?.last_row_id;

      const newMerchant = await db
        .prepare("SELECT * FROM merchants WHERE id = ?")
        .bind(insertedId)
        .first();

      return { success: true, data: newMerchant };
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        return { success: false, error: "Mobile number, UPI ID or Merchant Key already exists" };
      }

      return { success: false, error: "Failed to create merchant" };
    }
  }

  static async updateMerchant(db: D1Database, id: number, merchant: Merchant) {
    if (!merchant.merchant_name || !merchant.mobile_no || !merchant.upi_id || !merchant.merchant_key) {
      return { success: false, error: "Missing required fields" };
    }

    const status = merchant.status ?? 0; // default to 0 (Inactive)

    try {
      const result = await db
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
        .bind(merchant.merchant_name, merchant.mobile_no, merchant.upi_id, merchant.merchant_key, status, id)
        .run();

      if (result.meta?.changes === 0) {
        return { success: false, error: "Merchant not found" };
      }

      const updatedMerchant = await db
        .prepare("SELECT * FROM merchants WHERE id = ?")
        .bind(id)
        .first();

      return { success: true, data: updatedMerchant };
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        return { success: false, error: "Mobile number, UPI ID or Merchant Key already exists" };
      }

      return { success: false, error: "Failed to update merchant" };
    }
  }

  static async deleteMerchant(db: D1Database, id: number) {
    try {
      const result = await db
        .prepare("DELETE FROM merchants WHERE id = ?")
        .bind(id)
        .run();

      if (result.meta?.changes === 0) {
        return { success: false, error: "Merchant not found" };
      }

      return { success: true, message: "Merchant deleted successfully" };
    } catch {
      return { success: false, error: "Failed to delete merchant" };
    }
  }
}
