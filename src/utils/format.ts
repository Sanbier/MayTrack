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
  const date = new Date(dateStr + 'T00:00:00');
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

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
