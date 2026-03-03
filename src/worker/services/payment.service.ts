import { PaymentCreateRequest, PaymentCreateResponse, PaytmResponse } from '../types';

export class PaymentService {
  static generateOrderId(): string {
    return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generatePaymentId(): string {
    return Math.random().toString(36).substr(2, 20) + Math.random().toString(36).substr(2, 20);
  }

  static generatePaytmResponse(orderId: string, amount: number): PaytmResponse {
    return {
      success: true,
      orderId: Math.random().toString(36).substr(2, 32),
      amount: amount.toString(),
      paymentUrl: "https://securegw.paytm.in/theia/processTransaction",
      parameters: {
        MID: "ZIrAGA72236364605077",
        ORDER_ID: orderId,
        CUST_ID: `CUST_${Date.now()}`,
        EMAIL: "customer@example.com",
        INDUSTRY_TYPE_ID: "Retail",
        CHANNEL_ID: "WEB",
        TXN_AMOUNT: amount.toString(),
        WEBSITE: "DEFAULT",
        CALLBACK_URL: "https://your-domain.com/payment/payTMCheckout"
      },
      message: "Payment initiated. Submit the form to Paytm gateway.",
      note: "Checksum generation needs to be implemented in production"
    };
  }

  static generateQRData(upiId: string, merchantName: string, amount: number, orderId: string): string {
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${orderId}`;
  }

  static async createPaymentOrder(db: D1Database, request: PaymentCreateRequest): Promise<{ success: boolean; data?: PaymentCreateResponse; error?: string }> {
    const { merchant_id, amount } = request;

    if (!merchant_id || !amount) {
      return { success: false, error: "Merchant ID and amount are required" };
    }

    try {
      // Get merchant details
      const merchant = await db
        .prepare("SELECT * FROM merchants WHERE id = ?")
        .bind(merchant_id)
        .first();

      if (!merchant) {
        return { success: false, error: "Merchant not found" };
      }

      // Generate IDs and data
      const order_id = this.generateOrderId();
      const payment_id = this.generatePaymentId();
      const merchantName = String(merchant.merchant_name);
      const qr_data = this.generateQRData((merchant.upi_id || '') as string, merchantName, amount, order_id);
      const paytmResponse = this.generatePaytmResponse(order_id, amount);

      // Insert payment order with Paytm response data
      await db
        .prepare(`
          INSERT INTO payment_orders (order_id, merchant_id, amount, status, payment_link, qr_code_data)
          VALUES (?, ?, ?, 'PENDING', ?, ?)
        `)
        .bind(order_id, merchant_id, amount, JSON.stringify(paytmResponse), qr_data)
        .run();

      return { 
        success: true, 
        data: {
          order_id: order_id,
          payment_id: payment_id,
          paytm_response: paytmResponse
        }
      };
    } catch (error) {
      return { success: false, error: "Failed to create payment order" };
    }
  }

  static async getPaymentByPaymentId(db: D1Database, payment_id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // First find the order by searching in the payment_link JSON
      const orders = await db
        .prepare("SELECT * FROM payment_orders")
        .all();

      let order = null;
      for (const row of orders.results) {
        if (row.payment_link) {
          try {
            const paytmData = JSON.parse(row.payment_link as string);
            // Check if this order contains our payment_id
            if (paytmData.orderId === payment_id || (row.order_id as string).includes(payment_id)) {
              order = row;
              break;
            }
          } catch (e) {
            // Skip invalid JSON
            continue;
          }
        }
      }

      if (!order) {
        // Try to find by order_id if payment_id not found
        order = await db
          .prepare("SELECT * FROM payment_orders WHERE order_id = ?")
          .bind(payment_id)
          .first();
      }

      if (!order) {
        return { success: false, error: "Payment not found" };
      }

      // Get merchant details
      const merchant = await db
        .prepare("SELECT * FROM merchants WHERE id = ?")
        .bind(order.merchant_id)
        .first();

      const result = {
        ...order,
        merchant_name: merchant?.merchant_name,
        upi_id: merchant?.upi_id,
        mobile_no: merchant?.mobile_no
      };

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: "Failed to fetch payment" };
    }
  }

  static async getPaymentsByMerchantId(db: D1Database, merchant_id: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { results } = await db
        .prepare("SELECT * FROM payment_orders WHERE merchant_id = ? ORDER BY created_at DESC")
        .bind(merchant_id)
        .all();

      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: "Failed to fetch payment orders" };
    }
  }
}
