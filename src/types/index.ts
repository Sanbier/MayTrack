export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'DELIVERED';

export interface SewingOrder {
  id: string;
  // CÔNG ĐOẠN NHẬN
  receiveDate: string; // YYYY-MM-DD
  receiveDayOfWeek: string; // Thứ 2 ... CN
  stageName: string; // Tên công đoạn
  unitPrice: number; // Đơn giá (VNĐ)
  receiveQuantity: number; // Số lượng nhận
  receiveFabricKg?: number | null; // Kí vải (kg)
  status: OrderStatus;
  
  // CÔNG ĐOẠN GIAO
  deliveryDate?: string | null; // YYYY-MM-DD
  deliveryDayOfWeek?: string | null; // Thứ giao
  deliverQuantity?: number | null; // Số lượng thực tế giao
  deliveryFabricKg?: number | null; // Kí vải khi giao
  totalAmount: number; // Thành tiền = unitPrice * (deliverQuantity || receiveQuantity)
  
  note?: string; // Ghi chú (mã hàng, khách hàng, size...)
  createdAt: number;
  updatedAt: number;
}

export interface StagePreset {
  id: string;
  name: string;
  defaultUnitPrice: number;
  description?: string;
  color?: string;
}

export interface WorkshopSettings {
  workshopName: string;
  ownerName: string;
  phone?: string;
  noteTemplate?: string;
}

export type TabType = 'dashboard' | 'orders' | 'reports' | 'presets';
