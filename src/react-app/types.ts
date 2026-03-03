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
