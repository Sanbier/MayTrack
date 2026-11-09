import { SewingOrder, StagePreset, WorkshopSettings, SalesItem } from '../types';
import { formatDateVN, formatNumber } from './format';

export const DEFAULT_PRESETS: StagePreset[] = [
  { id: '1', name: 'TIM TIA', defaultUnitPrice: 8000, color: 'indigo' },
  { id: '2', name: 'Vắt sổ', defaultUnitPrice: 2500, color: 'blue' },
  { id: '3', name: 'Tra khoá / Dây kéo', defaultUnitPrice: 4000, color: 'teal' },
  { id: '4', name: 'May viền cổ / nách', defaultUnitPrice: 3000, color: 'purple' },
  { id: '5', name: 'Ráp sườn / Vai', defaultUnitPrice: 3500, color: 'pink' },
  { id: '6', name: 'May lai / Gấu áo', defaultUnitPrice: 2000, color: 'orange' },
  { id: '7', name: 'Tra cổ áo', defaultUnitPrice: 5000, color: 'emerald' },
  { id: '8', name: 'May túi mổ / Túi ốp', defaultUnitPrice: 6000, color: 'amber' },
  { id: '9', name: 'Đóng nút / Thùa khuy', defaultUnitPrice: 1500, color: 'cyan' },
];

export const INITIAL_ORDERS: SewingOrder[] = [
  {
    id: 'sample-1',
    receiveDate: '2026-07-03',
    receiveDayOfWeek: 'Thứ 6',
    stageName: 'TIM TIA',
    unitPrice: 8000,
    receiveQuantity: 8,
    receiveFabricKg: 8,
    status: 'DELIVERED',
    deliveryDate: '2026-10-11',
    deliveryDayOfWeek: 'CN',
    deliverQuantity: 8,
    deliveryFabricKg: 8,
    totalAmount: 64000,
    note: 'Đơn may mẫu theo bảng tính',
    createdAt: new Date('2026-07-03').getTime(),
    updatedAt: new Date('2026-10-11').getTime(),
  }
];

export const INITIAL_SALES_ITEMS: SalesItem[] = [];

export const DEFAULT_SETTINGS: WorkshopSettings = {
  workshopName: 'Xưởng May Gia Công',
  ownerName: 'Sanbier',
  phone: '',
  noteTemplate: 'May kỹ đường chỉ, ủi phẳng trước khi giao',
  payCycleClosingDay: 3,
};

const STORAGE_KEYS = {
  ORDERS: 'maytrack_orders_v1',
  PRESETS: 'maytrack_presets_v1',
  SETTINGS: 'maytrack_settings_v1',
  SALES_ITEMS: 'maytrack_sales_v2',
};

export function loadOrders(): SewingOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (raw !== null && raw !== undefined) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    // Trả về mảng rỗng để không bao giờ tự sinh đơn mẫu đè lên dữ liệu đã xóa trên đám mây
    return [];
  } catch (e) {
    console.error('Failed to load orders', e);
    return [];
  }
}

export function saveOrders(orders: SewingOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders', e);
  }
}

export function loadPresets(): StagePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (!raw) {
      savePresets(DEFAULT_PRESETS);
      return DEFAULT_PRESETS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_PRESETS;
  }
}

export function savePresets(presets: StagePreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save presets', e);
  }
}

export function loadSettings(): WorkshopSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: WorkshopSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadSalesItems(): SalesItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES_ITEMS);
    if (raw !== null && raw !== undefined) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to load sales items', e);
    return [];
  }
}

export function saveSalesItems(items: SalesItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save sales items', e);
  }
}

/**
 * Xuất dữ liệu công đoạn may ra file CSV tương thích 100% cấu trúc Google Sheet
 */
export function exportToCSV(orders: SewingOrder[]): void {
  const header1 = 'CÔNG ĐOẠN NHẬN,,,,,,,,,CÔNG ĐOẠN GIAO,,,,,';
  const header2 = 'NGÀY,THỨ,CÔNG ĐOẠN,ĐƠN GIÁ,SỐ LƯỢNG,KÍ VẢI (KG)_,TRẠNG THÁI,,NGÀY,THỨ,CÔNG ĐOẠN,ĐƠN GIÁ,SỐ LƯỢNG,KÍ VẢI,TỔNG';

  const rows = orders.map(o => {
    const rDate = formatDateVN(o.receiveDate);
    const rDay = o.receiveDayOfWeek;
    const stage = `"${o.stageName.replace(/"/g, '""')}"`;
    const price = o.unitPrice;
    const rQty = o.receiveQuantity;
    const rKg = o.receiveFabricKg ?? '';
    const statusText = o.status === 'DELIVERED' ? 'ĐÃ GIAO' : (o.status === 'IN_PROGRESS' ? 'ĐÃ NHẬN (ĐANG LÀM)' : 'ĐÃ NHẬN (CHỜ LÀM)');

    const dDate = o.deliveryDate ? formatDateVN(o.deliveryDate) : '';
    const dDay = o.deliveryDayOfWeek ?? '';
    const dStage = o.status === 'DELIVERED' ? stage : '';
    const dPrice = o.status === 'DELIVERED' ? price : '';
    const dQty = o.deliverQuantity ?? (o.status === 'DELIVERED' ? rQty : '');
    const dKg = o.deliveryFabricKg ?? '';
    const total = o.status === 'DELIVERED' ? o.totalAmount : '';

    return `${rDate},${rDay},${stage},${price},${rQty},${rKg},${statusText},,${dDate},${dDay},${dStage},${dPrice},${dQty},${dKg},${total}`;
  });

  const totalDeliveredSum = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const totalRow = `TỔNG,,,,,,,,,,,,,,${totalDeliveredSum}`;

  const csvContent = '\uFEFF' + [header1, '', '', '', header2, ...rows, totalRow].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `MayTrack_CongDoanMay_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Xuất dữ liệu Bán Hàng ra file CSV khớp cấu trúc 2 khối: NHẬP HÀNG BÁN & BILL BÁN
 */
export function exportSalesToCSV(items: SalesItem[]): void {
  const header1 = 'NHẬP HÀNG BÁN ,,,,,,BILL BÁN ,,,,';
  const header2 = 'TÊN SẢN PHẨM,SL NHẬP,giá nhập,GIÁ BÁN ,LỢI NHUẬN ,,TÊN SẢN PHẨM,SL ĐÃ BÁN ,SL TỒN KHO,GIÁ BÁN,CẢNH BÁO ';

  const rows = items.map(item => {
    const name = `"${item.productName.replace(/"/g, '""')}"`;
    const unitProfit = (item.sellPrice || 0) - (item.importPrice || 0);
    const sold = item.soldQty || 0;
    const stock = (item.importQty || 0) - sold;
    const warning = stock <= 0
      ? `⚠️CẢNH BÁO HẾT HÀNG ${formatNumber(Math.abs(stock))}`
      : 'CÒN TỒN ';

    return `${name},${item.importQty},${item.importPrice},${item.sellPrice},${unitProfit},,${name},${sold > 0 ? sold : ''},${stock},${sold > 0 ? item.sellPrice : ''},${warning}`;
  });

  const totalUnitProfit = items.reduce((sum, item) => sum + ((item.sellPrice || 0) - (item.importPrice || 0)), 0);
  const totalRealizedProfit = items.reduce((sum, item) => sum + ((item.soldQty || 0) * ((item.sellPrice || 0) - (item.importPrice || 0))), 0);
  const totalRow1 = `TỔNG LỢI NHUẬN / ĐV,,,,${totalUnitProfit},,,,,,`;
  const totalRow2 = `TỔNG LÃI THỰC ĐÃ BÁN,,,,${totalRealizedProfit},,,,,,`;

  const csvContent = '\uFEFF' + [header1, header2, ...rows, totalRow1, totalRow2].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `MayTrack_SoBanHang_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportJSONBackup(
  orders: SewingOrder[],
  presets: StagePreset[],
  settings: WorkshopSettings,
  salesItems?: SalesItem[]
): void {
  const data = {
    appName: 'MayTrack',
    version: '1.1.0',
    exportedAt: new Date().toISOString(),
    orders,
    presets,
    settings,
    salesItems: salesItems || loadSalesItems(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `MayTrack_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
