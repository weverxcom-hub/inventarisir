export type UserRole = "Staff" | "Approver" | "Admin";

export interface User {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export type ItemCondition = "Good" | "Repair" | "Broken";

export interface InventoryItem {
  item_id: string;
  name: string;
  category: string;
  quantity: number;
  location: string;
  condition: ItemCondition;
  photo_url: string;
  receipt_url: string;
  qr_url: string;
  created_at: string;
}

export type ProcurementStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Completed";

export interface ProcurementRequest {
  request_id: string;
  requestor_name: string;
  item_name: string;
  quantity: number;
  estimated_price: number;
  status: ProcurementStatus;
  nota_photo_drive_id: string;
  created_at: string;
}

export interface Unit {
  unit_id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Handover {
  bast_id: string;
  handover_date: string;
  place: string;
  giver_name: string;
  giver_position: string;
  receiver_name: string;
  receiver_position: string;
  receiver_unit: string;
  item_ids: string[];
  notes: string;
  created_at: string;
  created_by: string;
}
