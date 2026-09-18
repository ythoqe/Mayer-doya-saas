import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  onConfirm: () => void;
  onClose?: () => void;
  onCancel?: () => void;
  confirmBtnText?: string;
  confirmLabel?: string;
  cancelBtnText?: string;
  cancelLabel?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onClose,
  onCancel,
  confirmBtnText,
  confirmLabel,
  cancelBtnText,
  cancelLabel
}) => {
  const { language } = useERP();

  const handleClose = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  if (!isOpen) return null;

  const defaultTitle = language === 'bn' ? 'মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Deletion';
  const defaultMessage = language === 'bn' 
    ? 'আপনি কি নিশ্চিতভাবে এই রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।'
    : 'Are you sure you want to permanently delete this record? This action cannot be undone.';
  const defaultConfirmText = language === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete';
  const defaultCancelText = language === 'bn' ? 'বাতিল' : 'Cancel';
  const finalConfirmText = confirmLabel || confirmBtnText || defaultConfirmText;
  const finalCancelText = cancelLabel || cancelBtnText || defaultCancelText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#C83F57] shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#17383B]">
                {title || defaultTitle}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg text-[#8EA3A5] hover:text-[#17383B] hover:bg-[#F1FAFA] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {itemName && (
              <div className="mt-1 font-bold text-xs text-[#C83F57] bg-rose-50/70 px-2.5 py-1 rounded-lg border border-rose-100/80 inline-block">
                {itemName}
              </div>
            )}
            <p className="mt-2 text-xs text-[#688285] leading-relaxed">
              {message || defaultMessage}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#F8FCFC] border-t border-[#D9EAEB] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#688285] hover:text-[#17383B] hover:bg-[#EAF2F3] transition-colors"
          >
            {finalCancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              handleClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-black bg-[#EA7185] hover:bg-[#C83F57] text-white shadow-md shadow-rose-200 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{finalConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
