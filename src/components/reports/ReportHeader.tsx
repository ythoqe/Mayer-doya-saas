import React from 'react';
import { 
  Calendar, 
  Download, 
  Printer, 
  RotateCcw, 
  ChevronDown,
  BarChart3,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { DateRange, DateRangePreset, ReportCategory } from './types';
import { getDateRangeFromPreset } from './dateUtils';

interface ReportHeaderProps {
  activeCategory: ReportCategory;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  onOpenPrintCenter: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  activeCategory,
  dateRange,
  setDateRange,
  onExportCSV,
  onExportExcel,
  onOpenPrintCenter,
}) => {
  const { t, language } = useERP();

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setDateRange({ ...dateRange, preset: 'custom' });
    } else {
      const newRange = getDateRangeFromPreset(preset);
      setDateRange(newRange);
    }
  };

  const getPresetLabel = (preset: DateRangePreset): string => {
    switch (preset) {
      case 'today': return t('presetToday');
      case 'yesterday': return t('presetYesterday');
      case 'this_week': return t('presetThisWeek');
      case 'this_month': return t('presetThisMonth');
      case 'last_month': return t('presetLastMonth');
      case 'this_year': return t('presetThisYear');
      case 'custom': return t('presetCustom');
      case 'all_time':
      default: return t('presetAllTime');
    }
  };

  return (
    <div id="reports-header-card" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {t('reportsCenterTitle')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'bn' ? 'বাৎসরিক ও পর্যায়ক্রমিক আর্থিক হিসাব, এক্সেল ও এক ক্লিকে পিডিএফ রিপোর্ট' : t('reportsCenterSubtitle')}
            </p>
          </div>
        </div>

        {/* Action Controls & Date Range Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <div className="flex items-center px-2 py-1 text-xs font-medium text-slate-500 gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{t('dateRangeLabel')}:</span>
            </div>
            
            <div className="relative">
              <select
                id="report-date-preset-select"
                value={dateRange.preset}
                onChange={(e) => handlePresetChange(e.target.value as DateRangePreset)}
                className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 pr-7 appearance-none cursor-pointer hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="all_time">{t('presetAllTime')}</option>
                <option value="this_year">{language === 'bn' ? '📅 এই বছর (Annual)' : t('presetThisYear')}</option>
                <option value="this_month">{t('presetThisMonth')}</option>
                <option value="last_month">{t('presetLastMonth')}</option>
                <option value="this_week">{t('presetThisWeek')}</option>
                <option value="today">{t('presetToday')}</option>
                <option value="yesterday">{t('presetYesterday')}</option>
                <option value="custom">{t('presetCustom')}</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Custom Date Pickers */}
            {dateRange.preset === 'custom' && (
              <div className="flex items-center gap-1 px-1">
                <input
                  id="report-start-date-input"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <span className="text-xs text-slate-400">-</span>
                <input
                  id="report-end-date-input"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            )}

            {dateRange.preset !== 'all_time' && (
              <button
                id="reset-date-filter-btn"
                onClick={() => handlePresetChange('all_time')}
                title="Reset Date Filter"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export Excel (.xlsx) Button */}
          <button
            id="export-report-excel-btn"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            title="বাৎসরিক ও সকল রিপোর্ট এক্সেলে (.xlsx) ডাউনলোড করুন"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
            <span>{language === 'bn' ? 'এক্সেল (.xlsx)' : 'Export Excel'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            id="export-report-csv-btn"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{t('exportCsv')}</span>
          </button>

          {/* 1-Click Print / PDF Statement Button */}
          <button
            id="open-print-center-btn"
            onClick={onOpenPrintCenter}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
            title="১-ক্লিকে পিডিএফ প্রিন্ট ও ডাউনলোড করুন"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? '১-ক্লিকে PDF / প্রিন্ট' : t('printReport')}</span>
          </button>
        </div>
      </div>

      {/* Filter Active Badge */}
      {dateRange.preset !== 'all_time' && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            <span>
              {language === 'bn' ? 'বর্তমান ফিল্টার:' : 'Active Filter Period:'}{' '}
              <strong className="text-slate-700">{getPresetLabel(dateRange.preset)}</strong> ({dateRange.startDate} {language === 'bn' ? 'হতে' : 'to'} {dateRange.endDate})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
