// Date formatting utilities for consistent date display across the app

/**
 * Format date for table display: 26.06.2026
 */
export function formatDateShort(date: string | Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format date for dashboard/cards: 26-iyun
 */
export function formatDateDashboard(date: string | Date): string {
  const d = new Date(date);
  const day = d.getDate();
  const months = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
  ];
  return `${day}-${months[d.getMonth()]}`;
}

/**
 * Format date with year for dashboard: 26-iyun 2026
 */
export function formatDateDashboardWithYear(date: string | Date): string {
  const d = new Date(date);
  const day = d.getDate();
  const year = d.getFullYear();
  const months = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
  ];
  return `${day}-${months[d.getMonth()]} ${year}`;
}

/**
 * Format month-year for reports: Iyun 2026
 */
export function formatMonthYear(date: string | Date): string {
  const d = new Date(date);
  const months = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format datetime: 26.06.2026 14:30
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
