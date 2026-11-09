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

// Dữ liệu độc lập cho Tab Bán Hàng (theo mẫu Google Sheet Trang tính19)
export interface SalesItem {
  id: string;
  // Khối NHẬP HÀNG BÁN
  productName: string; // Cột A & G: TÊN SẢN PHẨM
  importQty: number;   // Cột B: SL NHẬP
  importPrice: number; // Cột C: giá nhập
  sellPrice: number;   // Cột D & J: GIÁ BÁN
  // Cột E: LỢI NHUẬN = sellPrice - importPrice
  
  // Khối BILL BÁN
  soldQty: number;     // Cột H: SL ĐÃ BÁN
  // Cột I: SL TỒN KHO = importQty - soldQty
  // Cột K: CẢNH BÁO = Tồn kho <= 0 ? "⚠️ CẢNH BÁO HẾT HÀNG" : "CÒN TỒN"

  note?: string;
  createdAt: number;
  updatedAt: number;
}

export type TabType = 'dashboard' | 'orders' | 'reports' | 'presets' | 'sales';
