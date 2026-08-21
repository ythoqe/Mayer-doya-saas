import React from 'react';
import { OrderStatus, Language } from '../../types';
import { translations } from '../../utils/translation';
import { 
  CheckCircle2, 
  Clock, 
  Droplets, 
  Layers, 
  RotateCcw, 
  Wind, 
  Sparkles, 
  CheckCircle, 
  Truck, 
  Package,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProductionTimelineProps {
  currentStatus: OrderStatus;
  onStatusChange?: (newStatus: OrderStatus) => void;
  language?: Language;
  interactive?: boolean;
  compact?: boolean;
}

export interface PipelineStage {
  key: OrderStatus;
  labelKey: string;
  shortLabel: string;
  icon: React.ElementType;
  stepNumber: number;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { key: 'pending', labelKey: 'stage_pending', shortLabel: 'Booked', icon: Clock, stepNumber: 1 },
  { key: 'lot_received', labelKey: 'stage_lot_received', shortLabel: 'Lot Received', icon: Package, stepNumber: 2 },
  { key: 'batch_assigned', labelKey: 'stage_batch_assigned', shortLabel: 'Batch Assigned', icon: Layers, stepNumber: 3 },
  { key: 'washing', labelKey: 'stage_washing', shortLabel: 'Washing', icon: Droplets, stepNumber: 4 },
  { key: 'dyeing', labelKey: 'stage_dyeing', shortLabel: 'Dyeing', icon: Layers, stepNumber: 5 },
  { key: 'hydro', labelKey: 'stage_hydro', shortLabel: 'Hydro Extractor', icon: RotateCcw, stepNumber: 6 },
  { key: 'drying', labelKey: 'stage_drying', shortLabel: 'Drying & Curing', icon: Wind, stepNumber: 7 },
  { key: 'finishing', labelKey: 'stage_finishing', shortLabel: 'Finishing', icon: Sparkles, stepNumber: 8 },
  { key: 'qc_passed', labelKey: 'stage_qc_passed', shortLabel: 'QC Passed', icon: CheckCircle2, stepNumber: 9 },
  { key: 'ready_for_delivery', labelKey: 'stage_ready_for_delivery', shortLabel: 'Ready Dispatch', icon: Truck, stepNumber: 10 },
  { key: 'delivered', labelKey: 'stage_delivered', shortLabel: 'Delivered', icon: CheckCircle, stepNumber: 11 },
];

export const getStageProgressPercentage = (status: OrderStatus): number => {
  if (status === 'cancelled') return 0;
  const stageIndex = PIPELINE_STAGES.findIndex(s => s.key === status);
  if (stageIndex === -1) return 0;
  return Math.round(((stageIndex + 1) / PIPELINE_STAGES.length) * 100);
};

export const ProductionTimeline: React.FC<ProductionTimelineProps> = ({
  currentStatus,
  onStatusChange,
  language = 'en',
  interactive = false,
  compact = false
}) => {
  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.key === currentStatus);
  const isCancelled = currentStatus === 'cancelled';
  const progressPercent = getStageProgressPercentage(currentStatus);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <div className="w-full space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#688285] uppercase tracking-wider">
            {t('productionProgress')}
          </span>
          {isCancelled ? (
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200">
              Cancelled
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-[#DDF4F3] text-[#0B9FA5] text-xs font-black">
              {progressPercent}%
            </span>
          )}
        </div>

        <div className="text-xs font-medium text-[#688285]">
          {isCancelled ? (
            <span className="text-rose-600 font-semibold">Job Cancelled</span>
          ) : (
            <span>
              Stage <strong className="text-[#17383B]">{Math.max(1, currentStageIndex + 1)}</strong> of {PIPELINE_STAGES.length}:{' '}
              <strong className="text-[#0B9FA5]">
                {t(PIPELINE_STAGES[currentStageIndex]?.labelKey || 'pending')}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#E6F0F1] h-2 sm:h-2.5 rounded-full overflow-hidden relative">
        <motion.div
          className={`h-full rounded-full ${
            isCancelled 
              ? 'bg-rose-500' 
              : 'bg-gradient-to-r from-[#0B9FA5] via-[#16B8B0] to-[#38C99A]'
          }`}
          initial={{ width: 0 }}
          animate={{ width: isCancelled ? '100%' : `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Horizontal Steps Timeline */}
      <div className="overflow-x-auto pb-2 pt-1 -mx-1 px-1 custom-scrollbar">
        <div className="flex items-start justify-between min-w-[700px] gap-2 relative">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = !isCancelled && idx < currentStageIndex;
            const isCurrent = !isCancelled && idx === currentStageIndex;
            const isFuture = !isCancelled && idx > currentStageIndex;
            const Icon = stage.icon;

            return (
              <div 
                key={stage.key}
                className="flex-1 flex flex-col items-center text-center relative group"
              >
                {/* Connecting horizontal line */}
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div 
                    className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 transition-colors ${
                      isCompleted ? 'bg-[#0B9FA5]' : 'bg-[#E6F0F1]'
                    }`}
                  />
                )}

                {/* Node Icon */}
                <button
                  type="button"
                  disabled={!interactive}
                  onClick={() => interactive && onStatusChange && onStatusChange(stage.key)}
                  className={`w-8 h-8 rounded-xl relative z-10 flex items-center justify-center transition-all duration-200 ${
                    interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                  } ${
                    isCurrent
                      ? 'bg-[#0B9FA5] text-white ring-4 ring-[#0B9FA5]/25 shadow-md scale-105'
                      : isCompleted
                      ? 'bg-[#E5F8F1] text-[#229A73] border border-[#38C99A]/40'
                      : 'bg-white text-[#8EA3A5] border border-[#D9EAEB]'
                  }`}
                  title={interactive ? `Set to ${t(stage.labelKey)}` : t(stage.labelKey)}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </button>

                {/* Label */}
                <span 
                  className={`mt-2 text-[11px] leading-tight transition-colors line-clamp-2 px-1 ${
                    isCurrent
                      ? 'font-extrabold text-[#0B9FA5]'
                      : isCompleted
                      ? 'font-semibold text-[#17383B]'
                      : 'font-medium text-[#8EA3A5]'
                  }`}
                >
                  {t(stage.labelKey)}
                </span>

                <span className="text-[9px] text-[#8EA3A5] mt-0.5">
                  Step {stage.stepNumber}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
