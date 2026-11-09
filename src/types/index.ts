// 2 Trạng thái chính: ĐÃ NHẬN (gồm Đang Làm & Chờ Làm) và ĐÃ GIAO
export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'DELIVERED';
export type MainOrderStatus = 'RECEIVED' | 'DELIVERED';
export type SubReceivedStatus = 'IN_PROGRESS' | 'PENDING';

export interface SewingOrder {
  id: string;
  // CÔNG ĐOẠN NHẬN
  receiveDate: string; // YYYY-MM-DD (Định dạng ngày/tháng/năm)
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
  payCycleClosingDay?: number; // Mặc định: 3 (ngày mùng 3 hàng tháng chốt công lãnh tiền)
}

// Lịch sử từng lần lên Bill Bán Hàng
export interface SalesBillRecord {
  id: string;
  saleDate: string; // YYYY-MM-DD
  saleDayOfWeek: string;
  quantity: number;
  sellPrice: number;
  importPrice: number;
  discountAmount?: number; // Số tiền giảm giá
  totalAmount: number;     // Thành tiền thực tế = quantity * sellPrice - discountAmount
  profitAmount: number;    // Tiền lời thực tế = totalAmount - quantity * importPrice
  customerNote?: string;
  createdAt: number;
}

// Dữ liệu Mặt Hàng Nhập & Bán (Độc lập với công đoạn may)
export interface SalesItem {
  id: string;
  importDate?: string;       // Ngày nhập (YYYY-MM-DD)
  importDayOfWeek?: string;  // Thứ nhập
  category?: string;         // Mục hàng / Phân loại (VD: Hoa, Phụ kiện, Trái cây...)
  productName: string;       // Tên sản phẩm
  importQty: number;         // Tổng SL nhập
  importPrice: number;       // Giá nhập / 1 SP
  sellPrice: number;         // Giá bán / 1 SP
  soldQty: number;           // Tổng SL đã bán
  note?: string;             // Ghi chú nguồn hàng / mô tả
  bills?: SalesBillRecord[]; // Lịch sử các Bill bán của mặt hàng này
  createdAt: number;
  updatedAt: number;
}

export type TabType = 'dashboard' | 'orders' | 'reports' | 'presets' | 'sales';
