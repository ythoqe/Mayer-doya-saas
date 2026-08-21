import { DateRange, DateRangePreset } from './types';

export const formatDateISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDateRangeFromPreset = (preset: DateRangePreset): DateRange => {
  const now = new Date();
  const todayStr = formatDateISO(now);

  switch (preset) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr, preset: 'today' };
    
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = formatDateISO(yesterday);
      return { startDate: yStr, endDate: yStr, preset: 'yesterday' };
    }

    case 'this_week': {
      const start = new Date(now);
      // Start of week (Sunday or Monday, let's say Monday as factory week)
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      return { startDate: formatDateISO(start), endDate: todayStr, preset: 'this_week' };
    }

    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatDateISO(start), endDate: todayStr, preset: 'this_month' };
    }

    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: formatDateISO(start), endDate: formatDateISO(end), preset: 'last_month' };
    }

    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: formatDateISO(start), endDate: todayStr, preset: 'this_year' };
    }

    case 'all_time':
    default:
      return { startDate: '2020-01-01', endDate: '2030-12-31', preset: 'all_time' };
  }
};

export const getDefaultDateRange = (preset: DateRangePreset = 'this_month'): DateRange => {
  return getDateRangeFromPreset(preset);
};

export const isDateInRange = (dateStr?: string, range?: DateRange): boolean => {
  if (!dateStr || !range) return true;
  if (range.preset === 'all_time') return true;

  // Extract YYYY-MM-DD from date string (might be timestamp or ISO)
  const cleanDate = dateStr.slice(0, 10);
  return cleanDate >= range.startDate && cleanDate <= range.endDate;
};
