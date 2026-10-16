export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
}

export function formatNumber(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(val);
}

export function formatKg(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val) || val === 0) return '-';
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(val)} kg`;
}

export function getDayOfWeekVN(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const date = new Date(clean + 'T00:00:00');
  if (isNaN(date.getTime())) return '';
  const day = date.getDay();
  switch (day) {
    case 0: return 'CN';
    case 1: return 'Thứ 2';
    case 2: return 'Thứ 3';
    case 3: return 'Thứ 4';
    case 4: return 'Thứ 5';
    case 5: return 'Thứ 6';
    case 6: return 'Thứ 7';
    default: return '';
  }
}

/**
 * Định dạng ngày theo chuẩn Việt Nam: Ngày/Tháng/Năm (DD/MM/YYYY)
 * Ví dụ: 2026-10-15 -> 15/10/2026
 */
export function formatDateVN(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = clean.split('-');
  if (parts.length === 3) {
    const day = parts[2].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[0];
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

/**
 * Định dạng có chữ Ngày Tháng Năm rõ ràng
 * Ví dụ: 2026-10-15 -> Ngày 15/10/2026
 */
export function formatFullDateVN(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const formatted = formatDateVN(dateStr);
  return formatted ? `Ngày ${formatted}` : '';
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DeliveryUrgency {
  level: 'overdue' | 'today' | 'tomorrow' | 'soon' | 'safe' | 'none';
  diffDays: number | null;
  label: string;
  badgeText: string;
  badgeClass: string;
  cardBorderClass: string;
}

/**
 * Tính toán mức độ khẩn cấp theo hạn giao hàng (deliveryDate)
 * Báo động nếu còn 1 ngày (mai giao), hôm nay phải giao hoặc quá hạn
 */
export function getDeliveryUrgency(deliveryDate?: string | null, status?: string): DeliveryUrgency {
  if (status === 'DELIVERED' || !deliveryDate) {
    return {
      level: 'none',
      diffDays: null,
      label: '',
      badgeText: '',
      badgeClass: '',
      cardBorderClass: '',
    };
  }

  const todayStr = getTodayString();
  const dToday = new Date(todayStr + 'T00:00:00');
  const dTarget = new Date(deliveryDate + 'T00:00:00');
  const diffTime = dTarget.getTime() - dToday.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      level: 'overdue',
      diffDays,
      label: `Quá hạn ${Math.abs(diffDays)} ngày`,
      badgeText: `🚨 QUÁ HẠN ${Math.abs(diffDays)}N`,
      badgeClass: 'bg-rose-600 text-white font-extrabold animate-pulse shadow-xs',
      cardBorderClass: 'border-l-rose-600 ring-1 ring-rose-400 bg-rose-50/15',
    };
  }

  if (diffDays === 0) {
    return {
      level: 'today',
      diffDays: 0,
      label: 'Hôm nay phải giao gấp!',
      badgeText: '🚨 HÔM NAY PHẢI GIAO',
      badgeClass: 'bg-rose-500 text-white font-extrabold animate-pulse shadow-xs',
      cardBorderClass: 'border-l-rose-500 ring-1 ring-amber-400 bg-amber-50/20',
    };
  }

  if (diffDays === 1) {
    return {
      level: 'tomorrow',
      diffDays: 1,
      label: 'Còn 1 ngày (Mai giao)!',
      badgeText: '⚠️ CÒN 1 NGÀY GIAO',
      badgeClass: 'bg-amber-500 text-white font-extrabold animate-pulse shadow-xs ring-1 ring-amber-300',
      cardBorderClass: 'border-l-amber-500 ring-2 ring-amber-400/80 bg-amber-50/20',
    };
  }

  if (diffDays === 2) {
    return {
      level: 'soon',
      diffDays: 2,
      label: 'Còn 2 ngày giao',
      badgeText: '⏳ Còn 2 ngày',
      badgeClass: 'bg-amber-100 text-amber-900 font-bold border border-amber-300',
      cardBorderClass: 'border-l-amber-400',
    };
  }

  return {
    level: 'safe',
    diffDays,
    label: `Còn ${diffDays} ngày`,
    badgeText: `Còn ${diffDays} ngày`,
    badgeClass: 'bg-slate-100 text-slate-700 font-medium',
    cardBorderClass: '',
  };
}

// ==========================================
// CHU KỲ CHỐT CÔNG LÃNH TIỀN (NGÀY MÙNG 3 HÀNG THÁNG)
// ==========================================

export interface PayrollPeriodInfo {
  monthStr: string; // '2026-10'
  year: number; // 2026
  month: number; // 10
  closingDay: number; // 3
  startDate: string; // '2026-10-04'
  endDate: string; // '2026-11-03'
  label: string; // 'Tháng 10/2026'
  rangeText: string; // '04/10/2026 → 03/11/2026'
  shortRangeText: string; // '04/10 → 03/11'
  closingDateFormatted: string; // '03/11/2026'
  closingDayFormatted: string; // 'Thứ ...'
  isCurrentPeriod: boolean;
}

/**
 * Lấy chu kỳ công hiện tại dựa trên ngày chốt công (mặc định mùng 3)
 * - Nếu hôm nay là ngày 1, 2, 3: Vẫn thuộc kỳ của tháng trước (kỳ kết thúc ngày 3 tháng này)
 * - Nếu hôm nay từ ngày 4 trở đi: Thuộc kỳ của tháng này (kết thúc ngày 3 tháng sau)
 */
export function getCurrentPayrollMonth(closingDay: number = 3): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  const date = d.getDate();

  if (date <= closingDay) {
    let prevM = month - 1;
    let prevY = year;
    if (prevM < 1) {
      prevM = 12;
      prevY -= 1;
    }
    return prevY + '-' + String(prevM).padStart(2, '0');
  }

  return year + '-' + String(month).padStart(2, '0');
}

/**
 * Tính toán toàn bộ thông tin chu kỳ công cho một tháng (YYYY-MM)
 * Ví dụ '2026-10', closingDay=3:
 * - Bắt đầu: 04/10/2026
 * - Kết thúc (chốt công): 03/11/2026
 */
export function getPayrollPeriodInfo(monthStr: string, closingDay: number = 3): PayrollPeriodInfo | null {
  if (!monthStr || monthStr === 'ALL') return null;
  const parts = monthStr.split('-');
  if (parts.length !== 2) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(y) || isNaN(m)) return null;

  const startDay = closingDay + 1;
  const startDate = y + '-' + String(m).padStart(2, '0') + '-' + String(startDay).padStart(2, '0');

  let nextM = m + 1;
  let nextY = y;
  if (nextM > 12) {
    nextM = 1;
    nextY += 1;
  }
  const endDate = nextY + '-' + String(nextM).padStart(2, '0') + '-' + String(closingDay).padStart(2, '0');

  const currentPayMonth = getCurrentPayrollMonth(closingDay);

  return {
    monthStr,
    year: y,
    month: m,
    closingDay,
    startDate,
    endDate,
    label: 'Tháng ' + m + '/' + y,
    rangeText: formatDateVN(startDate) + ' → ' + formatDateVN(endDate),
    shortRangeText: String(startDay).padStart(2, '0') + '/' + String(m).padStart(2, '0') + ' → ' + String(closingDay).padStart(2, '0') + '/' + String(nextM).padStart(2, '0'),
    closingDateFormatted: formatDateVN(endDate),
    closingDayFormatted: getDayOfWeekVN(endDate),
    isCurrentPeriod: monthStr === currentPayMonth,
  };
}

/**
 * Kiểm tra xem một đơn hàng có thuộc kỳ công đã chọn hay không
 * - Nếu đơn ĐÃ GIAO: tính theo ngày giao (hoàn thành nhận tiền trong kỳ chốt mùng 3)
 * - Nếu đơn ĐÃ NHẬN: tính theo ngày nhận hàng hoặc ngày hẹn giao trong kỳ
 */
export function isOrderInPayrollPeriod(
  order: { receiveDate: string; deliveryDate?: string | null; status: string },
  period: PayrollPeriodInfo
): boolean {
  if (order.status === 'DELIVERED') {
    const targetDate = order.deliveryDate || order.receiveDate;
    return targetDate >= period.startDate && targetDate <= period.endDate;
  }

  const inReceive = order.receiveDate >= period.startDate && order.receiveDate <= period.endDate;
  const inDelivery = order.deliveryDate
    ? (order.deliveryDate >= period.startDate && order.deliveryDate <= period.endDate)
    : false;
  return inReceive || inDelivery;
}
