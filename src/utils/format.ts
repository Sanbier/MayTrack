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
