export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  seller_id: string;
  supplier_id: string;
  shopee_order_id?: string;
  status: OrderStatus;
  tracking_code?: string;
  total_value: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages?: number;
}
