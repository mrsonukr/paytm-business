export interface Env {
  DB: D1Database;
}

export interface Merchant {
  id?: number;
  merchant_name: string;
  mobile_no: string;
  upi_id: string;
  merchant_key: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentOrder {
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

export interface PaytmResponse {
  success: boolean;
  orderId: string;
  amount: string;
  paymentUrl: string;
  parameters: {
    MID: string;
    ORDER_ID: string;
    CUST_ID: string;
    EMAIL: string;
    INDUSTRY_TYPE_ID: string;
    CHANNEL_ID: string;
    TXN_AMOUNT: string;
    WEBSITE: string;
    CALLBACK_URL: string;
  };
  message: string;
  note: string;
}

export interface PaymentCreateRequest {
  merchant_id: number;
  amount: number;
}

export interface PaymentCreateResponse {
  order_id: string;
  payment_id: string;
  paytm_response: PaytmResponse;
}
