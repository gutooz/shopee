export interface Supplier {
  id: string;
  seller_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  whatsapp_number?: string;
  active: boolean;
  created_at: string;
}

export interface SupplierCreate {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  whatsapp_number?: string;
}

export interface SupplierUpdate extends Partial<SupplierCreate> {
  active?: boolean;
}
