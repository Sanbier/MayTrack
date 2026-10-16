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
