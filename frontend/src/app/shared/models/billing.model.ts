export interface Billing {
  id: string;
  seller_id: string;
  order_id: string;
  fee_value: number;
  quantity_items: number;
  status: string;
  created_at: string;
}

export interface BillingSummary {
  total_fees: number;
  total_orders: number;
  total_items: number;
  pending_fees: number;
  paid_fees: number;
}
